import fs from 'node:fs';
import assert from 'node:assert/strict';

const dir='data/voca-roots/';
const read=x=>JSON.parse(fs.readFileSync(dir+x,'utf8'));
const pilot=read('teaching-pilot-20261117.json');
const map=read('study-map-by-cefr.json');
const master=read('word-breakdowns/full-master-index.json');
assert.equal(pilot.productionEnabled,false);
assert.equal(pilot.status,'draft-unreviewed');
assert.equal(pilot.lessons.length,pilot.counts.lessons);
const idSet=new Set(),morphSet=new Set();
let total=0;
for(const lesson of pilot.lessons){
 assert.ok(!idSet.has(lesson.lessonId),'Duplicate lesson ID '+lesson.lessonId);
 assert.ok(!morphSet.has(lesson.morphemeId),'Duplicate lesson morpheme '+lesson.morphemeId);
 idSet.add(lesson.lessonId);morphSet.add(lesson.morphemeId);
 assert.equal(lesson.productionEligible,false);
 assert.equal(lesson.editorialReviewRequired,true);
 assert.equal(lesson.validationFlags.etymologyReviewed,false);
 assert.equal(lesson.validationFlags.meaningReviewed,false);
 assert.equal(lesson.validationFlags.sentenceReviewed,false);
 assert.ok(lesson.hintMeaningJa&&lesson.inquiryQuestionEn&&lesson.practiceSentenceEn&&lesson.teacherNoteJa);
 assert.equal(lesson.candidateCount,lesson.candidates.length);
 assert.ok(lesson.candidateCount>=3,'Insufficient candidates');
 const mapUnit=map.entries[lesson.morphemeId];
 assert.ok(mapUnit,'Unrecognized morpheme '+lesson.morphemeId);
 assert.equal(mapUnit.kind,lesson.morphemeKind);
 const selected=new Set();
 for(const item of lesson.candidates){
  assert.ok(!selected.has(item.headword),'Repeated headword');
  selected.add(item.headword);
  const mastered=master.entries[item.headword];
  assert.ok(Object.hasOwn(master.entries,item.headword),'Unknown master headword '+item.headword);
  assert.equal(item.wordId,mastered.wordId);
  assert.equal(item.cefrHeadword,mastered.cefrHeadword);
  assert.ok(mapUnit.wordsByLevel[item.cefrHeadword].some(w=>w.wordId===item.wordId&&w.headword===item.headword),
   'Selected headword not in draft CEFR map: '+lesson.morphemeId+'/'+item.headword);
  total++;
 }
}
assert.equal(total,pilot.counts.candidateWordOccurrences);
assert.equal(new Set(pilot.lessons.flatMap(lesson=>lesson.candidates.map(x=>x.headword))).size,pilot.counts.distinctSelectedHeadwords);
for(const kind of ['root','prefix','suffix'])
 assert.equal(pilot.lessons.filter(x=>x.morphemeKind===kind).length,pilot.counts.byKind[kind]);
console.log(JSON.stringify({status:'STRUCTURE_OK',counts:pilot.counts,productionEnabled:false},null,2));
