// Utilities for the school periodic-exam fast cloze workflow.
export const PRACTICE_COUNTS = [10, 20, 30, 50];
export const DEFAULT_PRACTICE_OPTIONS = Object.freeze({
  count: 20, random: true, audio: true, retryWrong: true, instantFeedback: true
});

export function isClozeReady(word) {
  return Boolean(word && typeof word.prompt === 'string' &&
    word.prompt.includes('________') && Array.isArray(word.choices) &&
    word.choices.length === 4 && Number.isInteger(word.correctIndex) &&
    word.correctIndex >= 0 && word.correctIndex < 4);
}

export function eligibleClozeWords(words) {
  return (Array.isArray(words) ? words : []).filter(isClozeReady);
}

// Stable option order is important when an interrupted session resumes.
export function shuffledChoices(word, seed = 0) {
  const arr = word.choices.map((text, index) => ({ text, index }));
  const input = String(word.id) + ':' + String(seed);
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash = Math.imul(hash ^ input.charCodeAt(i), 16777619) >>> 0;
  }
  for (let i = arr.length - 1; i > 0; i--) {
    hash = (Math.imul(hash, 1664525) + 1013904223) >>> 0;
    const j = hash % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function sessionItems(words, { count = 20, random = true } = {}, randomFn = Math.random) {
  const list = eligibleClozeWords(words).map(w => w.id);
  if (random) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(randomFn() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
  }
  return list.slice(0, Math.max(1, Math.min(list.length, Number(count) || 20)));
}

export function recoverSession(value, words) {
  if (!value || !Array.isArray(value.ids) || !Array.isArray(value.answers) ||
      !Number.isInteger(value.cursor) || !Number.isInteger(value.seed)) return null;
  const valid = new Set(eligibleClozeWords(words).map(w => w.id));
  if (!value.ids.length || !value.ids.every(id => valid.has(id)) ||
      value.cursor < 0 || value.cursor >= value.ids.length ||
      value.answers.length > value.ids.length) return null;
  const ids = new Set(value.ids);
  if (!value.answers.every(a => ids.has(a.id) && typeof a.correct === 'boolean')) return null;
  return value;
}

export function summarizePractice(answers = []) {
  const correct = answers.filter(answer => answer.correct).length;
  return { correct, total: answers.length, rate: answers.length ? Math.round(correct / answers.length * 100) : 0,
    wrong: answers.filter(answer => !answer.correct).map(answer => answer.id) };
}

// Extend authored practice to vocabulary courses without changing their source data.
export function prepareFastWords(words = []) {
  return words.flatMap(w => {
    if (isClozeReady(w)) return [{...w, practiceKind:'cloze'}];
    if (!w?.id || !w.word || !w.meaning) return [];
    const key = w.word.trim().toLowerCase();
    let choices = Array.isArray(w.choices) && w.choices.length === 4 && new Set(w.choices.map(x=>x.toLowerCase())).size===4 && w.choices.some(x=>x.toLowerCase()===key) ? [...w.choices] : [];
    if (!choices.length) {
      const blocked = new Set([key]);
      for (const term of [...(Array.isArray(w.synonyms)?w.synonyms:[]),...(Array.isArray(w.antonyms)?w.antonyms:[])]) blocked.add(String(typeof term==='string'?term:term?.word||'').toLowerCase());
      choices=[w.word];
      for (const x of words) {
        const k=String(x.word||'').toLowerCase();
        if (!k || blocked.has(k) || !x.meaning || x.meaning===w.meaning) continue;
        blocked.add(k);choices.push(x.word);if(choices.length===4)break;
      }
    }
    if(choices.length!==4)return [];
    const correctIndex=choices.findIndex(x=>x.toLowerCase()===key);
    const target=w.word.replace(/[.*+?^$(){}|[\]\\]/g,'\\$&');
    const exact=new RegExp('(^|[^A-Za-z0-9])('+target+')(?=$|[^A-Za-z0-9])','i');
    const sentence=String(w.english||'');
    const match=sentence.match(exact);
    // Never display the answer as an unmasked sentence; if the exact surface form
    // is absent, use the Japanese meaning instead of inventing an example.
    const prompt=match?sentence.replace(exact,(_,prefix)=>prefix+'________'):'________';
    return [{...w,choices,correctIndex,prompt,practiceKind:match?'cloze':'meaning'}];
  });
}
export function timedPracticeSummary(answers = []) {
  const timed=answers.filter(a=>!a.skipped&&Number.isFinite(a.responseMs)&&a.responseMs>=0);
  const scores=answers.filter(a=>!a.skipped&&Number.isFinite(a.mastery)).map(a=>a.mastery);
  return { averageMs:timed.length?Math.round(timed.reduce((n,a)=>n+a.responseMs,0)/timed.length):null,
    fastestMs:timed.length?Math.min(...timed.map(a=>a.responseMs)):null,
    mastery:scores.length?Math.round(scores.reduce((n,v)=>n+v,0)/scores.length):null,
    timedCount:timed.length, skipped:answers.filter(a=>a.skipped).length };
}
