import {choiceIndex,wordOptions} from './fourChoices.js';
// Versioned boundary: the Universe never schedules reviews or computes FSRS itself.
export const UNIVERSE_MEMORY_VERSION=1;
export const memoryLabels={new:'未学習',learned:'学習済み',strong:'定着',fading:'復習時期',weak:'苦手'};
export const normalizeTerm=s=>String(s??'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
export function planetState(word,records={},snapshot={},now=Date.now()){
 const r=word.id?records[word.id]:null;
 const s=snapshot[word.id]||snapshot[normalizeTerm(word.word)];
 if(s){const recall=Number.isFinite(s.retrievability)?Math.max(0,Math.min(1,s.retrievability)):null;
 const status=!s.attempts?'new':s.weak?'weak':(Number.isFinite(s.dueAt)&&s.dueAt<=now)||recall!==null&&recall<.7?'fading':s.mastered?'strong':'learned';
 return {status,recall,brightness:recall===null?(status==='new'?.35:status==='strong'?1:.6):.25+.75*recall};}
 const m=r?.memory,attempts=m?.attempts||r?.seen||0;
 const status=!attempts?'new':m?.lastGrade===1||r?.lastCorrect===false?'weak':(m?.dueAt??r?.dueAt)>0&&(m?.dueAt??r?.dueAt)<=now?'fading':'learned';
 return {status,recall:null,brightness:{new:.35,weak:.4,fading:.3,learned:.7}[status]};
}
// Use the registered translation and exclude other known relations from distractors.
export function relationQuestion(center,links,type,turn=0,index=choiceIndex([]),random=Math.random){
 const candidates=links.filter(x=>x.type===type&&x.meaning&&normalizeTerm(x.word)!==normalizeTerm(center.word));
 const link=candidates.length?candidates[turn%candidates.length]:null;
 if(!link)return null;
 const options=wordOptions({word:link.word,meaning:link.meaning,synonyms:[center.word,...links.map(x=>x.word)]},index,{random});
 return options.length===4?{kind:type,source:center,answer:link.word,meaning:link.meaning,options,prompt:`${center.word} に関連する表現：${link.meaning}`} : null;
}
export function checkRelationAnswer(value,answer){return normalizeTerm(value)===normalizeTerm(answer);}

let provider=null;
const listeners=new Set();
export function registerUniverseMemory(adapter){
 if(adapter&&(adapter.version!==1||typeof adapter.getSnapshot!=='function'||typeof adapter.recordAttempt!=='function'))throw new TypeError('Universe memory adapter v1 required');
 provider=adapter;listeners.forEach(fn=>fn());
 return ()=>{if(provider===adapter){provider=null;listeners.forEach(fn=>fn());}};
}
export const getUniverseMemoryAdapter=()=>provider;
export const subscribeUniverseMemory=fn=>{listeners.add(fn);return()=>listeners.delete(fn);};

export function indexMemorySnapshot(snapshot={}){
 const indexed={...snapshot};
 for(const [id,row] of Object.entries(snapshot)){if(row?.word){const key=normalizeTerm(row.word);const previous=indexed[key];if(!previous||(row.weak&&!previous.weak)||(!previous.weak&&!row.weak&&row.retrievability<previous.retrievability))indexed[key]={...row,wordId:row.wordId||id};}}
 return indexed;
}
