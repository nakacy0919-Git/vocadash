
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
export function bookFilter(words,level='all',query=''){
 const q=String(query||'').trim().normalize('NFKC').toLowerCase();
 return words.filter(w=>(level==='all'||w.senses.some(s=>s.cefrHeadword===level))&&(!q||String(w.number)===q||w.headword.toLowerCase().includes(q)||w.senses.some(s=>String(s.meaningJa).includes(q))));
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
 return {id:'quiz:'+s.senseId,bookId:w.id,bookNumber:w.number,senseIndex:i,senseCount:w.senses.length,level:s.cefrHeadword||w.level,word:s.headword,meaning:s.meaningJa,partOfSpeech:s.partOfSpeech,posKind:pos.kind,posIcon:pos.icon,english:ex.en||'',japanese:ex.ja||'',examples:s.examples||[],audio:s.audio||''};
}
