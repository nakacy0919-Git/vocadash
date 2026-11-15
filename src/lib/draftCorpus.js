// Canonical active drafts only; supplemental alternative batches remain in Git.
import manifest from '../../data/vocabulary-drafts/manifest.json';
const batches=import.meta.glob('../../data/vocabulary-drafts/batches/*.json',{import:'default'});
const translations=import.meta.glob('../../data/vocabulary-drafts/collocations/*.json',{import:'default'});
const root='../../data/vocabulary-drafts/';
export const draftKey=x=>String(x??'').normalize('NFKC').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ');
let recordsPromise, translatedPromise;
export function loadDraftRecords(){
 if(!recordsPromise)recordsPromise=Promise.all(manifest.batchFiles.map(path=>{
  const load=batches[root+path];if(!load)throw Error('Missing active vocabulary batch '+path);return load();
 })).then(parts=>{
  const records=new Map();
  for(const part of parts)for(const r of part.records||[]){
   if(!r.senseId||!r.headword||!r.meaningJa)continue;
   if(records.has(r.senseId))throw Error('Duplicate active sense '+r.senseId);
   records.set(r.senseId,r);
  }
  return [...records.values()];
 }).catch(e=>{recordsPromise=null;throw e;});
 return recordsPromise;
}
export function loadTranslatedCollocations(){
 if(!translatedPromise)translatedPromise=Promise.all(Object.keys(translations).sort().map(path=>translations[path]())).then(parts=>{
  const bySense=new Map();
  for(const part of parts)for(const row of part.records||[]){
   if(!row.senseId)continue;
   let list=bySense.get(row.senseId);if(!list){list=new Map();bySense.set(row.senseId,list);}
   for(const c of row.collocations||[]){
    if(typeof c.en!=='string'||typeof c.ja!=='string'||!c.en.trim()||!c.ja.trim())continue;
    const key=draftKey(c.en);if(!list.has(key))list.set(key,{en:c.en,ja:c.ja});
   }
  }
  return bySense;
 }).catch(e=>{translatedPromise=null;throw e;});
 return translatedPromise;
}
