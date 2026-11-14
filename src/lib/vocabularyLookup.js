import {lookupUniverse,universeEntries} from './universe.js';
import {wordCandidates,suggestVoiceWords} from './voice.js';
const modules=import.meta.glob('../../data/vocabulary-drafts/batches/*.json',{import:'default'});
let draftPromise;
export const normalizeKey=x=>String(x||'').toLowerCase().trim().replace(/\s+/g,' ');
export function draftAliases(head){return [...new Set([normalizeKey(head),...String(head||'').split('/').map(normalizeKey)].filter(Boolean))];}
function draftIndex(){if(!draftPromise){draftPromise=Promise.allSettled(Object.values(modules).map(load=>load())).then(results=>{const index=new Map();for(const result of results){if(result.status!=='fulfilled')continue;for(const r of result.value?.records||[]){if(!r.headword||!r.meaningJa||!r.senseId)continue;for(const key of draftAliases(r.headword)){const list=index.get(key)||[];if(!list.some(x=>x.senseId===r.senseId))list.push(r);index.set(key,list);}}}if(results.some(r=>r.status==='rejected'))draftPromise=null;return index;}).catch(e=>{draftPromise=null;throw e;});}return draftPromise;}
export async function findVocabulary(raw,{words=[],loadCourseWords}={}){
 const keys=wordCandidates(raw);
 // Registered networks use their fast path; draft and course datasets still supply words without a network.
 for(const k of keys){const map=lookupUniverse(k),local=words.find(w=>normalizeKey(w.word)===k);if(map||local)return {...map,...local,word:local?.word||map?.word||k,meaning:local?.meaning||map?.meaning||''};}
 const drafts=await draftIndex().catch(()=>new Map());
 for(const k of keys){const records=drafts.get(k)||[];if(records.length){const first=records[0],examples=records.flatMap(r=>(r.examples||[]).map(e=>({...e,senseId:r.senseId})));return {word:k,meaning:first.meaningJa,records,examples,english:examples[0]?.en||'',japanese:examples[0]?.ja||'',draft:true};}}
 for(const k of keys){const course=await loadCourseWords?.(k).catch(()=>null);if(course)return {...course,examples:course.english?[{en:course.english,ja:course.japanese}]:[]};}
 return null;
}
export async function searchVocabulary(raw,loadCourseIndex){const [drafts,courses]=await Promise.all([draftIndex().catch(()=>new Map()),loadCourseIndex?.().catch(()=>new Map())]);return suggestVoiceWords(raw,[...universeEntries().map(w=>w.word),...drafts.keys(),...(courses?.keys()||[])]);}
