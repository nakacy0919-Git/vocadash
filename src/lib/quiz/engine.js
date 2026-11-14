// Independent of memoryEngine.js. No scheduling or legacy progress mutations.
import {choiceIndex,wordOptions} from '../fourChoices.js';
export const QUIZ_VERSION = 1;
export const FORMATS = {
  'en-ja':'英語 → 日本語', 'ja-en':'日本語 → 英語', spelling:'スペリング',
  listening:'リスニング', cloze:'例文穴埋め', definition:'英英定義',
  synonym:'類義語', antonym:'対義語', nuance:'ニュアンス比較',
  collocation:'コロケーション', derivation:'派生語', inflection:'語形変化',
  reorder:'語順並べ替え', image:'画像から想起',
};
export const normalize = s => String(s ?? '').normalize('NFKC').toLowerCase().trim().replace(/[’‘]/g,"'").replace(/\s+/g,' ');
export function shuffle(items, random=Math.random) {
  const out=[...items];
  for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
  return out;
}
export function adaptVocabulary(record) {
  return {...record, id:record.senseId || record.id, wordId:record.wordId || record.id,
    word:record.headword || record.word, meaning:record.meaningJa || record.meaning,
    definition:record.definitionEn || record.definition,
    examples:record.examples || (record.english?[{en:record.english,ja:record.japanese}]:[])};
}
export function validateQuestion(q) {
  const errors=[];
  if(!q || !FORMATS[q.format]) return ['unknown-format'];
  if(!q.wordId || !q.senseId || !q.id) errors.push('missing-identity');
  if(typeof q.prompt!=='string' || !q.prompt.trim() || !Array.isArray(q.answers) || !q.answers.length || q.answers.some(a=>typeof a!=='string'||!normalize(a))) return ['missing-content'];
  if(q.options!==undefined && !Array.isArray(q.options)) return ['invalid-options'];
  if(!q.evidence?.source || !q.evidence?.rationale) errors.push('missing-evidence');
  if(q.options?.length){
    const keys=q.options.map(normalize);
    if(keys.length!==4 || new Set(keys).size!==keys.length) errors.push('duplicate-or-insufficient-options');
    if(keys.filter(k=>q.answers.map(normalize).includes(k)).length!==1) errors.push('ambiguous-options');
    if(q.options.some(o=>q.forbiddenDistractors?.map(normalize).includes(normalize(o)) && !q.answers.map(normalize).includes(normalize(o)))) errors.push('related-distractor');
  }
  if(q.format!=='reorder' && q.options?.length!==4) errors.push('four-choices-required');
  if(q.format==='image' && (!q.image || !q.evidence.imageVerified)) errors.push('unverified-image');
  if(q.format==='listening' && !q.audioText) errors.push('missing-audio');
  if(q.format==='reorder' && (!q.tokens?.length || normalize(q.tokens.join(' '))!==normalize(q.answers[0]))) errors.push('token-mismatch');
  if(['synonym','antonym','nuance','collocation','derivation','inflection'].includes(q.format) && !q.evidence.reviewed) errors.push('review-required');
  return errors;
}
// Specialist items are authored; basic recognition uses screened lexical or spelling distractors.
export function buildQuestions(records, authored=[], {random=Math.random, audioAvailable=true, choiceRecords=records}={}) {
  const questions=[], rejected=[], index=choiceIndex(choiceRecords);
  const add=q=>{const errors=validateQuestion(q);if(errors.length)rejected.push({id:q?.id,errors});else questions.push({...q,options:q.options?shuffle(q.options,random):undefined});};
  for(const raw of records){
    const w=adaptVocabulary(raw);
    if(!w.id || !w.word || !w.meaning || /[/…]|\.{2}/.test(w.word))continue;
    const base={wordId:w.wordId,senseId:w.id,answers:[w.word],translation:w.meaning,
      evidence:{source:w.id,rationale:'語義データに登録された見出し語を再現する問題'}};
    const spelling=wordOptions(w,index,{random,spelling:true}), lexical=wordOptions(w,index,{random});
    if(spelling.length===4)add({...base,id:w.id+':spelling',format:'spelling',prompt:`${w.meaning}（${w.partOfSpeech || '語彙'}）の正しいスペルを選んでください。`,options:spelling,hint:`${w.word[0]}… (${w.word.length}文字)`});
    if(audioAvailable&&lexical.length===4)add({...base,id:w.id+':listening',format:'listening',prompt:'音声を聞いて、正しい英単語を選んでください。',audioText:w.word,options:lexical});
    if(w.definition&&lexical.length===4)add({...base,id:w.id+':definition',format:'definition',prompt:`${w.definition}\n定義に合う登録見出し語を選んでください。`,options:lexical,hint:`${w.word[0]}… / ${w.word.length}文字`,evidence:{...base.evidence,rationale:'登録された英英定義の見出し語を再現'}});
    for(const q of sentenceQuestions(raw,index,random))add(q);
  }
  for(const q of authored)if(audioAvailable || q.format!=='listening')add(q);
  return {questions,rejected};
}
export function gradeAnswer(q,answer) {
  if(validateQuestion(q).length)throw new Error('Invalid question');
  const value=Array.isArray(answer)?answer.join(' '):answer;
  return q.answers.some(a=>normalize(a)===normalize(value));
}
export function createAttempt(q,{answer,startedAt,answeredAt=Date.now(),hintCount=0,audioPlays=0,attemptId}) {
  if(!Number.isFinite(startedAt)||!Number.isFinite(answeredAt)||answeredAt<startedAt)throw new Error('Invalid attempt time');
  if(!Number.isInteger(hintCount)||hintCount<0||!Number.isInteger(audioPlays)||audioPlays<0)throw new Error('Invalid assistance counts');
  return {schemaVersion:QUIZ_VERSION,attemptId:attemptId || globalThis.crypto.randomUUID(),questionId:q.id,
    wordId:q.wordId,senseId:q.senseId,format:q.format,correct:gradeAnswer(q,answer),
    responseMs:answeredAt-startedAt,hintCount,audioPlays,answeredAt,
    source:q.evidence.source};
}
// Rotate skills for the same sense, interleaving words. Memory Engine may supply ordered sense IDs.
export function planSession(questions,{limit=20,senseIds,maxSenses=limit,random=Math.random}={}) {
  const groups=new Map();
  for(const q of questions){if(senseIds && !senseIds.includes(q.senseId))continue;const list=groups.get(q.senseId)||[];list.push(q);groups.set(q.senseId,list);}
  const keys=(senseIds?[...new Set(senseIds)].filter(k=>groups.has(k)):shuffle([...groups.keys()],random)).slice(0,Math.max(0,maxSenses));
  const out=[];for(let round=0;out.length<limit;round++){
    let added=false;for(const key of keys){const q=groups.get(key)[round];if(q){out.push(q);added=true;if(out.length>=limit)break;}}
    if(!added)break;
  }return out;
}
// Automatically generated sentence tasks use a reference, not a claim that no other
// English sentence could fit. Initial/length constraints disambiguate lexical recall.
export function sentenceQuestions(raw,index=choiceIndex([raw]),random=Math.random) {
  const w=adaptVocabulary(raw), out=[];
  if(!w.id || !w.word || !/^[a-z]+(?: [a-z]+)*$/i.test(w.word))return out;
  for(const ex of w.examples || []){
    if(!ex.en || !ex.ja || !ex.id)continue;
    const escaped=w.word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const re=new RegExp('\\b'+escaped+'\\b','gi');
    if([...ex.en.matchAll(re)].length!==1)continue;
    const common={wordId:w.wordId,senseId:w.id,translation:ex.ja,
      evidence:{source:ex.id,rationale:'オリジナル例文そのものを再現する参照付き課題'}};
    const options=wordOptions(w,index,{random});
    if(options.length===4)out.push({...common,id:ex.id+':cloze',format:'cloze',prompt:`${ex.en.replace(re,'_____')}\n${ex.ja}\n空欄に入る登録見出し語を選んでください。`,answers:[w.word],options,hint:`${w.word[0]}… / ${w.word.length}文字`});
    const tokens=ex.en.trim().split(/\s+/);
    if(tokens.length>=4 && tokens.length<=18)out.push({...common,id:ex.id+':reorder',format:'reorder',prompt:`登録例文と同じ語順に並べ替えてください：${ex.ja}`,answers:[ex.en],tokens,hint:ex.en});
  }return out;
}
