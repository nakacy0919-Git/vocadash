import {loadDraftRecords} from './draftCorpus.js';
import {choiceIndex,wordOptions} from './fourChoices.js';
import {CEFR_COURSES} from './learningFlow.js';
let promise;
export function draftCourseLoader(c,u){
 const course=CEFR_COURSES.find(x=>x.id===c);
 if(!course||u!=='all')return null;
 return async()=>{
  if(!promise)promise=loadDraftRecords().then(rows=>({rows,index:choiceIndex(rows)})).catch(e=>{promise=null;throw e;});
  const {rows,index}=await promise;
  const level=course.short;
  const value=rows.filter(r=>r.cefrHeadword===level).sort((a,b)=>a.wordId.localeCompare(b.wordId)||a.senseId.localeCompare(b.senseId)).map(r=>{
   const ex=r.examples?.[0]||{};
   const word=r.headword;
   const opts=wordOptions({...r,synonyms:typeof r.synonyms==='string'?r.synonyms.split(/[;,；、]/).map(x=>x.trim()):r.synonyms},index);
   return {learningId:'quiz:'+r.senseId,targetWord:word,meaning:r.meaningJa,english:ex.en||'',japanese:ex.ja||'',explanation:r.usageNoteJa||'',partOfSpeech:r.partOfSpeech,definition:r.definitionEn,examples:r.examples||[],pronunciation:r.pronunciation||r.ipa||'',image:r.image||'',imageHint:r.imageHint||'',draft:true,choices:opts.length===4?opts:[],correct:opts.indexOf(word),collocations:r.collocations||[]};
  });
  return {default:value};
 };
}
