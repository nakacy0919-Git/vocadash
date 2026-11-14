// A separate, opt-in draft network. Never join polysemy solely by spelling.
import a from '../data/universe-sense-draft-01.js';
import b from '../data/universe-sense-draft-02.js';
import c from '../data/universe-sense-draft-03.js';
import editorial from '../data/universe-sense-editorial-01.js';
const normalize = x => String(x??'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
const records = new Map(), byWord = new Map(), inbound = new Map();
for(const chunk of [a,b,c]){
 for(const row of chunk.rows){
  const [id,word,pos,meaning,definition,cefr,rawSynonyms,examples,imageHint,batch]=row;
  if(records.has(id))throw new Error('Duplicate sense: '+id);
  const entry={id,word,pos,meaning,definition,cefr,rawSynonyms,examples,imageHint,batch,status:'draft-unreviewed'};
  records.set(id,entry);
  for(const spelling of word.split('/').map(normalize).filter(Boolean)){
   const entries=byWord.get(spelling)||[];entries.push(entry);byWord.set(spelling,entries);
  }
 }
}
export function senseById(id){return records.get(id)||null;}
export function sensesFor(word){return byWord.get(normalize(word))||[];}
export function candidateTerms(entry){
 const parts=typeof entry?.rawSynonyms==='string'?entry.rawSynonyms.split(/[;；,、]/):[];
 const seen=new Set(entry?.word?.split('/').map(normalize)||[]);
 const result=[];
 for(const link of (editorial[entry?.id]||[])){
  const key=normalize(link.word);if(!key||seen.has(key))continue;
  seen.add(key);result.push({...link,candidate:true});
 }
 for(const raw of parts){
  const label=raw.trim();if(!label)continue;
  const match=label.match(/^(.+?)\s*\(([^()]*)\)$/);
  const word=(match?match[1]:label).trim(), key=normalize(word);
  if(!key||seen.has(key)||word.length>100||!/[a-z]/i.test(word))continue;
  seen.add(key);
  // The supplied notes can indicate regional, narrower, or contextual use.
  // Treat every term as a provisional related expression, not certified synonymy.
  result.push({word,meaning:'',type:'related',tier:'related',qualifier:match?.[2]||'',candidate:true});
 }
 return result;
}
for(const entry of records.values())for(const term of candidateTerms(entry)){
 const key=normalize(term.word), list=inbound.get(key)||[];
 list.push(entry);inbound.set(key,list);
}
export function candidateTargets(term){return sensesFor(term?.word);}
export function linkedFrom(word){return inbound.get(normalize(word))||[];}
export function searchSenses(query,limit=30){
 const q=normalize(query);if(!q)return [];
 const matches=[];
 for(const entry of records.values()){
  const w=normalize(entry.word), ja=normalize(entry.meaning);
  const score=w===q?0:w.startsWith(q)?1:w.includes(q)?2:ja===q?3:ja.includes(q)?4:99;
  if(score<99)matches.push({entry,score});
 }
 return matches.sort((a,b)=>a.score-b.score||a.entry.word.localeCompare(b.entry.word)||a.entry.id.localeCompare(b.entry.id)).slice(0,limit).map(x=>x.entry);
}
export function senseNetworkStats(){
 return {senses:records.size,headwords:new Set([...records.values()].map(x=>normalize(x.word))).size,
  examples:[...records.values()].reduce((n,x)=>n+x.examples.length,0),
  editorialSenses:Object.keys(editorial).length,editorialLinks:Object.values(editorial).flat().length,
  candidateLinks:[...records.values()].reduce((n,x)=>n+candidateTerms(x).length,0),
  mappedSenses:[...records.values()].filter(x=>candidateTerms(x).length>0).length,
  linkedCandidates:[...records.values()].reduce((n,x)=>n+candidateTerms(x).filter(t=>candidateTargets(t).length>0).length,0)};
}
export function allDraftSenses(){return [...records.values()];}
