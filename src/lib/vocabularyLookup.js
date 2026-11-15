import {lookupUniverse,universeEntries} from './universe.js';
import {resolveVocabularyEntry,suggestVoiceWords} from './voice.js';
import {loadDraftRecords} from './draftCorpus.js';
let draftPromise;
export const normalizeKey=x=>String(x||'').toLowerCase().trim().replace(/\s+/g,' ');
export function draftAliases(head){const exact=[normalizeKey(head),...String(head||'').split('/').map(normalizeKey)];return [...new Set([...exact,...exact.map(k=>k.replace(/^[“"'‘]+|[”"'’?.!,]+$/g,''))].filter(Boolean))];}
function draftIndex(){if(!draftPromise){draftPromise=loadDraftRecords().then(records=>{const index=new Map();for(const r of records){for(const key of draftAliases(r.headword)){const list=index.get(key)||[];list.push(r);index.set(key,list);}}return index;}).catch(e=>{draftPromise=null;throw e;});}return draftPromise;}
export function findVocabulary(raw,{words=[],loadCourseWords}={}){return resolveVocabularyEntry(raw,{words,lookup:lookupUniverse,getDrafts:draftIndex,getCourse:loadCourseWords});}
export async function searchVocabulary(raw,loadCourseIndex){const [drafts,courses]=await Promise.all([draftIndex().catch(()=>new Map()),loadCourseIndex?.().catch(()=>new Map())]);return suggestVoiceWords(raw,[...universeEntries().map(w=>w.word),...drafts.keys(),...(courses?.keys()||[])]);}
