import {lookupUniverse,universeEntries} from './universe.js';
import {resolveVocabularyEntry,suggestVoiceWords} from './voice.js';
const modules=import.meta.glob('../../data/vocabulary-drafts/batches/*.json',{import:'default'});
let draftPromise;
export const normalizeKey=x=>String(x||'').toLowerCase().trim().replace(/\s+/g,' ');
export function draftAliases(head){return [...new Set([normalizeKey(head),...String(head||'').split('/').map(normalizeKey)].filter(Boolean))];}
function draftIndex(){if(!draftPromise){draftPromise=Promise.allSettled(Object.values(modules).map(load=>load())).then(results=>{const index=new Map();for(const result of results){if(result.status!=='fulfilled')continue;for(const r of result.value?.records||[]){if(!r.headword||!r.meaningJa||!r.senseId)continue;for(const key of draftAliases(r.headword)){const list=index.get(key)||[];if(!list.some(x=>x.senseId===r.senseId))list.push(r);index.set(key,list);}}}if(results.some(r=>r.status==='rejected'))draftPromise=null;return index;}).catch(e=>{draftPromise=null;throw e;});}return draftPromise;}
export function findVocabulary(raw,{words=[],loadCourseWords}={}){return resolveVocabularyEntry(raw,{words,lookup:lookupUniverse,getDrafts:draftIndex,getCourse:loadCourseWords});}
export async function searchVocabulary(raw,loadCourseIndex){const [drafts,courses]=await Promise.all([draftIndex().catch(()=>new Map()),loadCourseIndex?.().catch(()=>new Map())]);return suggestVoiceWords(raw,[...universeEntries().map(w=>w.word),...drafts.keys(),...(courses?.keys()||[])]);}
