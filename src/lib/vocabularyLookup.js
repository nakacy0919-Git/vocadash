import {lookupUniverse,universeEntries} from './universe.js';
import {resolveVocabularyEntry,suggestVoiceWords,wordCandidates} from './voice.js';
import {loadDraftRecords} from './draftCorpus.js';
let draftPromise,readyDraftIndex;
const profileCache=new Map();
export const normalizeKey=x=>String(x||'').toLowerCase().trim().replace(/\s+/g,' ');
export function draftAliases(head){const exact=[normalizeKey(head),...String(head||'').split('/').map(normalizeKey)];return [...new Set([...exact,...exact.map(k=>k.replace(/^[“"'‘]+|[”"'’?.!,]+$/g,''))].filter(Boolean))];}
function draftIndex(){if(!draftPromise){draftPromise=loadDraftRecords().then(records=>{const index=new Map();for(const r of records){for(const key of draftAliases(r.headword)){const list=index.get(key)||[];list.push(r);index.set(key,list);}}readyDraftIndex=index;return index;}).catch(e=>{draftPromise=null;throw e;});}return draftPromise;}
export function warmVocabularyIndex(){return draftIndex();}
export function findVocabulary(raw,{words=[],loadCourseWords}={}){return resolveVocabularyEntry(raw,{words,lookup:lookupUniverse,getDrafts:draftIndex,getCourse:loadCourseWords});}
export async function searchVocabulary(raw,loadCourseIndex){const [drafts,courses]=await Promise.all([draftIndex().catch(()=>new Map()),loadCourseIndex?.().catch(()=>new Map())]);return suggestVoiceWords(raw,[...universeEntries().map(w=>w.word),...drafts.keys(),...(courses?.keys()||[])]);}

// Profiles use the warmed canonical index synchronously, not a second network request.
function profileFromIndex(raw,words,seed,index){
 const keys=wordCandidates(raw).flatMap(draftAliases);
 for(const key of keys){
  const records=index?.get(key)||[];if(!records.length)continue;
  const local=words.find(w=>normalizeKey(w.word)===key),map=lookupUniverse(key),match=seed&&normalizeKey(seed.word)===key?seed:null;
  return {...map,...local,...match,word:key,meaning:records[0].meaningJa,records,examples:records.flatMap(r=>r.examples||[]),draft:true};
 }
 return null;
}
export function peekVocabularyProfile(raw,{words=[],seed=null}={}){
 const key=normalizeKey(raw);
 const cached=profileCache.get(key);if(cached)return cached;
 const complete=profileFromIndex(raw,words,seed,readyDraftIndex);
 if(complete){profileCache.set(key,complete);return complete;}
 return null;
}
export function initialVocabularyProfile(raw,{words=[],seed=null}={}){
 const complete=peekVocabularyProfile(raw,{words,seed});if(complete)return complete;
 for(const key of wordCandidates(raw)){
  const match=seed&&normalizeKey(seed.word)===key?seed:null;
  const local=words.find(w=>normalizeKey(w.word)===key),map=lookupUniverse(key);
  if(match||local||map){const item={...map,...local,...match,word:match?.word||local?.word||map?.word||key};if(item.meaning||item.records?.length||item.english||item.examples?.length)return item;}
 }
 return null;
}
export async function findVocabularyProfile(raw,{words=[],seed=null,resolveVocabulary}={}){
 const key=normalizeKey(raw),cached=peekVocabularyProfile(raw,{words,seed});if(cached)return cached;
 const drafts=await draftIndex().catch(()=>null);
 const complete=profileFromIndex(raw,words,seed,drafts);if(complete){profileCache.set(key,complete);return complete;}
 const item=initialVocabularyProfile(raw,{words,seed})||await resolveVocabulary?.(raw);
 // Do not cache a partial profile after a failed canonical load.
 if(drafts&&item)profileCache.set(key,item);
 return item||null;
}
