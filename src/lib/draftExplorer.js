import {loadDraftRecords,loadTranslatedCollocations,draftKey} from './draftCorpus.js';
import {candidateTerms as legacyTerms} from './universe-senses.js';
let promise;
export function loadDraftExplorer(){
 if(!promise)promise=Promise.all([loadDraftRecords(),loadTranslatedCollocations()]).then(([rows,translated])=>{
  const records=new Map(),byWord=new Map(),inbound=new Map(),termsById=new Map();
  for(const r of rows){
   const entry={id:r.senseId,word:r.headword,pos:r.partOfSpeech,meaning:r.meaningJa,definition:r.definitionEn,cefr:r.cefrHeadword,rawSynonyms:r.synonyms,examples:(r.examples||[]).map(e=>[e.en,e.ja]),imageHint:r.imageHint,usageNote:r.usageNoteJa,wordId:r.wordId};
   records.set(entry.id,entry);
   for(const key of new Set([draftKey(entry.word),...entry.word.split('/').map(draftKey)])){const list=byWord.get(key)||[];list.push(entry);byWord.set(key,list);}
   const phrases=[...(translated.get(entry.id)?.values()||[])];
   const seen=new Set(phrases.map(c=>draftKey(c.en)));
   for(const c of r.collocations||[])if(c.en&&!seen.has(draftKey(c.en))){phrases.push(c);seen.add(draftKey(c.en));}
   entry.collocations=phrases;
   const terms=legacyTerms(entry);const mapped=new Set(terms.map(t=>draftKey(t.word)));
   for(const c of phrases)if(!mapped.has(draftKey(c.en))){terms.push({word:c.en,meaning:c.ja||'',type:'collocation',tier:'related',candidate:true});mapped.add(draftKey(c.en));}
   termsById.set(entry.id,terms);
   for(const t of terms){const k=draftKey(t.word),list=inbound.get(k)||[];list.push(entry);inbound.set(k,list);}
  }
  const sensesFor=w=>byWord.get(draftKey(w))||[];
  return {stats:{headwords:new Set(rows.map(r=>r.wordId)).size,senses:records.size,collocations:[...records.keys()].reduce((n,id)=>n+(translated.get(id)?.size||0),0)},
   senseById:id=>records.get(id)||null,sensesFor,candidateTerms:e=>termsById.get(e?.id)||[],candidateTargets:t=>sensesFor(t?.word),linkedFrom:w=>inbound.get(draftKey(w))||[],
   searchSenses:(query,limit=30)=>{const q=draftKey(query);if(!q)return [];const found=[];for(const entry of records.values()){const w=draftKey(entry.word),ja=draftKey(entry.meaning);const score=w===q||w.split('/').includes(q)?0:w.startsWith(q)?1:w.includes(q)?2:ja===q?3:ja.includes(q)?4:99;if(score<99)found.push({entry,score});}return found.sort((a,b)=>a.score-b.score||a.entry.word.localeCompare(b.entry.word)||a.entry.id.localeCompare(b.entry.id)).slice(0,limit).map(x=>x.entry);}
  };
 }).catch(e=>{promise=null;throw e;});return promise;
}
