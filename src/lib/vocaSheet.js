import {CATEGORY_WORDS} from './category.js';

export const BOOK_PAGE_SIZE=6;
export const BOOK_LEVELS=['A1','A2','B1','B2','C1','C2'];
export const BOOK_STORAGE='vd-vocasheet-place-v1';
const sortId=(a,b)=>String(a).localeCompare(String(b),'en',{numeric:true});
export function bookWords(records=[]){
 const groups=new Map();
 for(const row of records){
  if(!row.wordId||!row.senseId||!row.headword||!row.meaningJa)continue;
  if(!groups.has(row.wordId))groups.set(row.wordId,[]);
  const senses=groups.get(row.wordId);
  if(!senses.some(s=>s.senseId===row.senseId))senses.push(row);
 }
 return [...groups.entries()].sort((a,b)=>sortId(a[0],b[0])).map(([id,senses],index)=>({
  id,number:index+1,headword:senses[0].headword,level:senses[0].cefrHeadword||'',senses:[...senses].sort((a,b)=>sortId(a.senseId,b.senseId))
 }));
}
export const BOOK_TOPICS=[['all','すべてのテーマ'],['d','生活・日常'],['e','環境・自然'],['h','健康・医療'],['l','教育・学習'],['s','社会・文化'],['t','科学・技術']];
export const BOOK_POS_OPTIONS=[['all','すべての品詞'],['verb','動詞'],['noun','名詞'],['adjective','形容詞'],['adverb','副詞'],['phrase','熟語・句'],['other','その他']];
const topicKey=(word,pos)=>String(word||'').normalize('NFKC').trim().toLowerCase()+'|'+bookPos(pos).kind;
const topicIndex=new Map();
for(const row of CATEGORY_WORDS){const key=topicKey(row.word,row.pos);if(!topicIndex.has(key))topicIndex.set(key,new Set());topicIndex.get(key).add(row.topic);}
export function bookTopicMatches(s,topic='all'){return topic==='all'||!!topicIndex.get(topicKey(s.headword,s.partOfSpeech))?.has(topic);}
export function bookFilter(words,level='all',query='',pos='all',sort='number',topic='all'){
 const q=String(query||'').trim().normalize('NFKC').toLowerCase();
 const rows=words.flatMap(w=>{
  const senses=w.senses.filter(s=>(level==='all'||s.cefrHeadword===level)&&(pos==='all'||bookPos(s.partOfSpeech).kind===pos)&&bookTopicMatches(s,topic)&&(!q||String(w.number)===q||w.headword.toLowerCase().includes(q)||String(s.meaningJa).includes(q)));
  return senses.length?[{...w,senses,level:senses[0].cefrHeadword||w.level}]:[];
 });
 if(sort==='alpha')rows.sort((a,b)=>a.headword.localeCompare(b.headword,'en')||a.number-b.number);
 if(sort==='level'){const rank=x=>{const n=BOOK_LEVELS.indexOf(x);return n<0?99:n;};rows.sort((a,b)=>rank(a.level)-rank(b.level)||a.number-b.number);}
 if(sort==='pos')rows.sort((a,b)=>bookPos(a.senses[0].partOfSpeech).kind.localeCompare(bookPos(b.senses[0].partOfSpeech).kind)||a.number-b.number);
 return rows;
}
export function bookPage(words,page=0,size=BOOK_PAGE_SIZE){
 const n=Math.max(1,Math.floor(Number(size)||BOOK_PAGE_SIZE)),pages=Math.max(1,Math.ceil(words.length/n)),index=Math.max(0,Math.min(pages-1,Math.floor(Number(page)||0)));
 return {page:index,pages,items:words.slice(index*n,(index+1)*n),start:index*n};
}
export function bookPosition(words,number,size=BOOK_PAGE_SIZE){
 const index=words.findIndex(w=>w.number===Number(number));
 return index<0?null:Math.floor(index/size);
}
export function bookPos(raw){
 const k=String(raw||'').toLowerCase().trim().replace(/\.$/,'');
 if(['v','verb'].includes(k))return {kind:'verb',icon:'V'};
 if(['n','noun'].includes(k))return {kind:'noun',icon:'N'};
 if(['a','adj','adjective'].includes(k))return {kind:'adjective',icon:'A'};
 if(['r','adv','adverb'].includes(k))return {kind:'adverb',icon:'Adv'};
 if(['phrasal verb','phrase','idiom'].includes(k))return {kind:'phrase',icon:'Phr'};
 if(['preposition','prep'].includes(k))return {kind:'other',icon:'Prep'};
 if(['conjunction','conj'].includes(k))return {kind:'other',icon:'Conj'};
 if(['pronoun','pron'].includes(k))return {kind:'other',icon:'Pron'};
 if(['auxiliary','modal'].includes(k))return {kind:'other',icon:'Aux'};
 if(['determiner','article'].includes(k))return {kind:'other',icon:'Det'};
 if(k==='interjection')return {kind:'other',icon:'Int'};
 if(k==='numeral')return {kind:'other',icon:'Num'};
 return {kind:'other',icon:'—'};
}
export function bookEntry(w,index=0){
 const i=Math.max(0,Math.min(w.senses.length-1,Math.floor(Number(index)||0))),s=w.senses[i],pos=bookPos(s.partOfSpeech),ex=s.examples?.[0]||{};
 return {id:'quiz:'+s.senseId,bookId:w.id,bookNumber:w.number,senseIndex:i,senseCount:w.senses.length,level:s.cefrHeadword||w.level,word:s.headword,meaning:s.meaningJa,partOfSpeech:s.partOfSpeech,posKind:pos.kind,posIcon:pos.icon,english:ex.en||'',japanese:ex.ja||'',examples:s.examples||[],audio:s.audio||'',sense:s};
}

export function lexicalRows(value){
 const items=Array.isArray(value)?value:typeof value==='string'?value.split(/[;；,、]/):[];
 return items.map(x=>typeof x==='string'?{word:x.trim(),meaning:''}:{word:String(x?.word||x?.en||x?.term||'').trim(),meaning:String(x?.meaning||x?.ja||'').trim()}).filter(x=>x.word);
}
export function mergeLexical(...groups){
 const map=new Map();for(const x of groups.flatMap(lexicalRows)){const key=x.word.toLowerCase();if(!map.has(key)||(!map.get(key).meaning&&x.meaning))map.set(key,x);}return [...map.values()];
}
const verifiedOrigins={
 achieve:{text:'中英語 acheven を経て古フランス語 achever（終える・成し遂げる）に由来。chief（頭・終点）と歴史的につながり、終点に到達するという発想が背景にある。',url:'https://www.etymonline.com/word/achieve'},
 knowledge:{text:'中英語 knowleche / knowlege に由来し、know（知る）と歴史的に関連する。語尾の詳しい成立には諸説がある。',url:'https://www.etymonline.com/word/knowledge'}
};
export function bookOrigin(entry){
 const s=entry?.sense||{},raw=s.etymologyJa||s.etymology||s.wordOriginJa||s.wordOrigin;
 if(typeof raw==='string'&&raw.trim())return {text:raw,source:'既存教材'};
 if(raw&&typeof raw==='object'&&typeof (raw.ja||raw.text||raw.en)==='string')return {text:raw.ja||raw.text||raw.en,source:'既存教材'};
 return verifiedOrigins[String(entry?.word||'').toLowerCase()]||null;
}

// Use the active sense's editorial order; never mix synonyms from another meaning.
export function bookSynonyms(entry,limit=3){
 const target=String(entry?.word||'').trim().toLowerCase();
 return mergeLexical(entry?.sense?.synonyms).filter(x=>x.word.toLowerCase()!==target).slice(0,limit);
}
export function bookCollocations(entry,translated=[]){return mergeLexical(entry?.sense?.collocations,translated);}

export const pocketPageSize=value=>Number(value)===3?3:1;
export function remapBookPage(page,oldSize,newSize){return Math.floor(Math.max(0,Math.floor(Number(page)||0))*Math.max(1,Number(oldSize)||6)/Math.max(1,Number(newSize)||1));}
