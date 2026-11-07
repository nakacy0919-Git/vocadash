// Shared vocabulary catalog and local-first spaced-review utilities.
// Existing course JSON files are deliberately kept unchanged.
export const CATALOG = [
  { id: 'eiken_4', label: '英検 4級', short: '4級', group: '英検対策', units: [1,2].map(n => ({ id: String(n), label: 'Stage ' + n })) },
  { id: 'eiken_3', label: '英検 3級', short: '3級', group: '英検対策', units: [1,2].map(n => ({ id: String(n), label: 'Stage ' + n })) },
  { id: 'eiken_pre2', label: '英検 準2級', short: '準2級', group: '英検対策', units: [1, 2, 3].map(n => ({ id: String(n), label: 'Stage ' + n })) },
  { id: 'eiken_2', label: '英検 2級', short: '2級', group: '英検対策', units: [1, 2, 3].map(n => ({ id: String(n), label: 'Stage ' + n })) },
  { id: 'eiken_pre1', label: '英検 準1級', short: '準1級', group: '英検対策', units: [1, 2, 3].map(n => ({ id: String(n), label: 'Stage ' + n })) },
  { id: 'eiken_1', label: '英検 1級', short: '1級', group: '英検対策', units: [1, 2, 3].map(n => ({ id: String(n), label: 'Stage ' + n })) },
  { id: 'eiken1_master', label: '英検1級マスター', short: '1級マスター', group: '発展学習', units: [
    { id: 'verb', label: '動詞 · 100語' }, { id: 'adjective', label: '形容詞 · 100語' },
    { id: 'noun', label: '名詞 · 100語' }, { id: 'phrasal_verb', label: '句動詞 · 100語' },
  ] },
  { id: 'regular', label: '定期考査対策', short: '定期考査', group: '学校教材', units: [
    { id: 'regular', label: '第1回 KICK OFF' }, { id: 'regular2', label: '第2回 KICK OFF' },
  ] },
  { id: 'reading', label: '長文読解 語彙', short: '長文語彙', group: '学校教材', units: Array.from({ length: 15 }, (_, i) => ({ id: String(i + 1), label: 'Lesson ' + (i + 1) })) },
];

export const STORAGE_KEY = 'vocadash-learning-v2';
export const INTERVALS_DAYS = [0, 1, 3, 7, 14, 30, 60, 120];

export function firstUnit(courseId) {
  return (CATALOG.find(course => course.id === courseId) || CATALOG.find(course => course.id === 'eiken_2')).units[0].id;
}

export function sourcePath(courseId, unitId) {
  if (courseId === 'regular') return './data/' + unitId + '.json';
  if (courseId === 'reading') return './data/lesson' + unitId + '_30words.json';
  if (courseId === 'eiken1_master') {
    return './data/' + (unitId === 'phrasal_verb' ? 'eiken_phrasal_verb' : 'eiken1_' + unitId) + '.json';
  }
  return './data/' + courseId + '_stage' + unitId + '.json';
}

export function normalizeWords(raw, courseId, unitId) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const choices = Array.isArray(item.choices) ? item.choices.map(String) : [];
    const correctIndex = Number(item.correct);
    const validIndex = Number.isInteger(correctIndex) && correctIndex >= 0 && correctIndex < choices.length ? correctIndex : 0;
    const word = String(item.targetWord || choices[validIndex] || '').trim();
    const detail = (item.word_details || []).find(d => String(d.word).toLowerCase() === word.toLowerCase());
    const meaning = String(item.meaning || detail?.meaning || item.dictionary?.[word] || '').trim();
    const prompt = String(item.english || '');
    const english = prompt.replace('________', word);
    const japanese = String(item.japanese || '').replace('________', meaning || '（空欄）');
    return {
      id: courseId + ':' + unitId + ':' + (item.id == null ? index : item.id),
      word, meaning, english, prompt, japanese, explanation: item.explanation || '',
      etymology: item.etymology || detail?.etymology || '',
      pronunciation: item.pronunciation || '',
      image: item.image || '', audio: item.audio || '',
      choices, correctIndex, sourceIndex: index
    };
  }).filter(entry => entry.word);
}

export function assetImage(path) {
  if (!path) return '';
  const parts = path.split('/');
  const filename = parts.pop();
  const numericPrefix = filename.match(/^(\d+)\s/);
  if (numericPrefix) return parts.join('/') + '/' + numericPrefix[1] + '.webp';
  return path;
}

export function safeLoad() {
  const empty = { records: {}, totalAnswers: 0, lastSelection: { courseId: 'eiken_2', unitId: '1' }, settings: { sound: true, speed: 0.85, questionCount: 10, randomOrder: false } };
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!parsed || typeof parsed !== 'object') return empty;
    const course = CATALOG.find(c => c.id === parsed.lastSelection?.courseId) || CATALOG.find(c => c.id === 'eiken_2');
    const validUnit = course.units.find(u => u.id === parsed.lastSelection?.unitId);
    return {
      records: parsed.records && typeof parsed.records === 'object' && !Array.isArray(parsed.records) ? parsed.records : {},
      totalAnswers: Number.isFinite(parsed.totalAnswers) ? parsed.totalAnswers : 0,
      lastSelection: { courseId: course.id, unitId: validUnit?.id || course.units[0].id },
      settings: { ...empty.settings, ...(parsed.settings || {}) }
    };
  } catch {
    return empty;
  }
}

export function safeSave(store) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); return true; }
  catch { return false; }
}

export function updateRecord(store, wordId, knew, now = Date.now()) {
  const old = store.records[wordId] || { seen: 0, correct: 0, wrong: 0, level: 0, dueAt: 0 };
  const level = knew ? Math.min((Number(old.level) || 0) + 1, INTERVALS_DAYS.length - 1) : 0;
  const next = {
    ...old,
    seen: (Number(old.seen) || 0) + 1,
    correct: (Number(old.correct) || 0) + (knew ? 1 : 0),
    wrong: (Number(old.wrong) || 0) + (knew ? 0 : 1),
    level, dueAt: now + INTERVALS_DAYS[level] * 86400000,
    lastSeenAt: now, lastCorrect: Boolean(knew)
  };
  return { ...store, totalAnswers: store.totalAnswers + 1, records: { ...store.records, [wordId]: next } };
}

export function isDue(record, now = Date.now()) {
  return Boolean(record && record.seen && (record.dueAt || 0) <= now);
}

export function summaryFor(words, records, now = Date.now()) {
  const known = words.filter(w => (records[w.id]?.level || 0) >= 2).length;
  const seen = words.filter(w => (records[w.id]?.seen || 0) > 0).length;
  const due = words.filter(w => isDue(records[w.id], now)).length;
  const correct = words.reduce((acc, w) => acc + (records[w.id]?.correct || 0), 0);
  const wrong = words.reduce((acc, w) => acc + (records[w.id]?.wrong || 0), 0);
  return { total: words.length, known, seen, due, accuracy: correct + wrong ? Math.round(correct * 100 / (correct + wrong)) : 0 };
}

export function shuffled(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}


/**
 * Split short labeled dialogues (A:/B:, Q:/A:, etc.) into turns.
 * Null means a normal sentence, so existing question layout is preserved.
 */
export function splitDialogueTurns(value) {
  const text = String(value ?? '').trim();
  const markers = [...text.matchAll(/(^|\s)([A-DQ])\s*:\s*/gi)].map(match => ({
    start: match.index + match[1].length,
    end: match.index + match[0].length,
    speaker: match[2]
  }));
  if (markers.length < 2 || markers[0].start !== 0 ||
      new Set(markers.map(marker => marker.speaker.toUpperCase())).size < 2) return null;

  const turns = markers.map((marker, index) => ({
    speaker: marker.speaker,
    text: text.slice(marker.end, markers[index + 1]?.start ?? text.length).trim()
  }));
  return turns.every(turn => turn.text) ? turns : null;
}


/** Reusable session selection. Count applies to both quizzes and study cards. */
export function makeSessionQueue(words, mode, records = {}, settings = {}) {
  const source = Array.isArray(words) ? words : [];
  let eligible = source;
  if (mode === 'review') eligible = source.filter(w => isDue(records[w.id]));
  if (mode === 'listening') eligible = source.filter(w => Boolean(w.image && w.audio));
  const random = settings.randomOrder === true || mode === 'quiz' || mode === 'listening' || mode === 'review';
  const ordered = random ? shuffled(eligible) : [...eligible];
  const count = Number(settings.questionCount);
  return Number.isInteger(count) && count > 0 ? ordered.slice(0, count) : ordered;
}
