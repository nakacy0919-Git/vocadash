import {mastery,isMastered} from './memoryEngine.js';
export const PAGE_SIZE=12;
export function libraryPage(words,page=0,pageSize=PAGE_SIZE){
 const size=Math.max(1,Math.floor(Number(pageSize)||PAGE_SIZE)),pages=Math.max(1,Math.ceil(words.length/size)),index=Math.min(pages-1,Math.max(0,Math.floor(Number(page)||0)));
 return {page:index,pages,items:words.slice(index*size,(index+1)*size),start:index*size};
}
const labels={v:'動詞',verb:'動詞',n:'名詞',noun:'名詞',a:'形容詞',adj:'形容詞',adjective:'形容詞',r:'副詞',adv:'副詞',adverb:'副詞',pronoun:'代名詞',preposition:'前置詞',conjunction:'接続詞',determiner:'限定詞',interjection:'間投詞','phrasal verb':'句動詞',phrase:'句・表現',article:'冠詞',numeral:'数詞',modal:'助動詞',auxiliary:'助動詞'};
export function posLabel(raw){const key=String(raw||'').trim().toLowerCase().replace(/\.$/,'');return labels[key]||String(raw||'').trim()||'品詞未登録';}
export function examplesFor(word){const rows=Array.isArray(word?.examples)?word.examples.map(x=>({en:x.en||'',ja:x.ja||''})).filter(x=>x.en):[];return rows.length?rows:word?.english?[{en:word.english,ja:word.japanese||''}]:[];}
export function feedbackDelay(word,base=850){return word?.image||word?.english?Math.max(base,2600):base;}

/** Read the actual bounded memory history; never infer a measured time from a score. */
export function wordProgress(record,now=Date.now()){
 const m=record?.memory,attempts=m?.attempts||0,percent=attempts?Math.max(0,Math.min(100,mastery(m,now))):0;
 const timed=(Array.isArray(m?.history)?m.history:[]).filter(h=>h.kind!=='recall'&&Number.isFinite(h.responseMs)&&h.responseMs>=0);
 const correct=timed.filter(h=>h.grade>=2);
 const latest=correct.at(-1);
 const mastered=!!attempts&&isMastered(m,now);
 return {attempts,percent,mastered,legacy:!attempts&&!!record?.seen,correctMs:latest?.responseMs??null,bestMs:correct.length?Math.min(...correct.map(h=>h.responseMs)):null,correctCount:m?.correct||0,status:!attempts?(record?.seen?'計測前':'未学習'):mastered?'定着':m.lastGrade===1?'要復習':percent>=50?'定着中':'学習中'};
}
export function courseProgress(words,records={},now=Date.now()){
 const rows=words.map(w=>wordProgress(records[w.id],now)),total=rows.length;
 const learned=rows.filter(r=>r.attempts>0).length,mastered=rows.filter(r=>r.mastered).length;
 const times=rows.map(r=>r.correctMs).filter(t=>t!==null);
 return {total,learned,mastered,unlearned:total-learned,average:total?Math.round(rows.reduce((sum,r)=>sum+r.percent,0)/total):0,coverage:total?Math.round(learned*100/total):0,averageCorrectMs:times.length?Math.round(times.reduce((a,b)=>a+b,0)/times.length):null,timedWords:times.length};
}
export const formatAnswerTime=ms=>Number.isFinite(ms)&&ms>=0?(ms/1000).toFixed(1)+'秒':'—';
