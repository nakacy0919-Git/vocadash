import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='data/voca-roots/word-breakdowns/';
const read=file=>JSON.parse(fs.readFileSync(dir+file,'utf8'));
const sel=read('bulk-selection-016.json'),manifest=read('manifest.json'),master=read('full-master-index.json');
const originalMaster=JSON.parse(fs.readFileSync('data/vocabulary-drafts/manifest.json','utf8'));
const newFiles=['master-curated-016a.json','master-curated-016b.json'];
const fresh=newFiles.flatMap(file=>read(file).records);
const old=manifest.files.filter(file=>!newFiles.includes(file)).flatMap(file=>read(file).records);
assert.equal(old.length,4720);assert.equal(fresh.length,345);assert.equal(sel.items.length,345);
assert.equal(manifest.productionEnabled,false);assert.equal(new Set(old.map(x=>x.headword)).size,4717);
assert.equal(new Set([...old,...fresh].map(x=>x.id)).size,5065);
assert.equal(new Set([...old,...fresh].map(x=>x.headword)).size,5062);
assert.equal(manifest.counts.records,5065);
assert.equal(manifest.counts.fullMasterMatchedDistinctHeadwords,2674);
assert.equal(new Set([...old,...fresh].filter(x=>x.wordId).map(x=>x.headword)).size,2674);
const holds=new Set(originalMaster.editorialHoldWordIds||[]),sources=new Set(originalMaster.batchFiles),allEvidence={};let totalSenses=0;
assert.equal(sources.size,84);
for(let i=1;i<=7;i++){
 const section=read('master-evidence-016-0'+i+'.json');assert.equal(section.productionEnabled,false);
 assert.equal(section.sourceBatchCount,12);
 for(const [id,e] of Object.entries(section.entries)){
  assert.ok(!Object.hasOwn(allEvidence,id),'Duplicate evidence '+id);allEvidence[id]=e;totalSenses+=e.senses.length;
  for(const s of e.senses){
   assert.ok(sources.has(s.sourceBatch));assert.ok(s.meaningJa&&s.senseId&&s.examples.length>0);
   assert.ok(s.examples.every(ex=>ex.id&&ex.en&&ex.ja));
  }
 }
}
assert.equal(Object.keys(allEvidence).length,639);assert.equal(totalSenses,737);
let quarantineCount=0;const oldHeads=new Set(old.map(x=>x.headword)),selectedIds=new Set();
for(let i=0;i<fresh.length;i++){
 const row=fresh[i],picked=sel.items[i];
 assert.equal(row.headword,picked.headword);assert.ok(!oldHeads.has(row.headword));
 assert.ok(!selectedIds.has(row.id));selectedIds.add(row.id);
 assert.equal(row.id,'wb:curated:'+row.headword);
 assert.equal(row.parts.map(x=>x.surface.replaceAll('-','')).join(''),row.headword);
 assert.equal(master.entries[row.headword]?.wordId,row.wordId);
 assert.ok(!holds.has(row.wordId));
 assert.equal(row.productionEligible,false);assert.equal(row.editorialReviewRequired,true);
 assert.equal(row.semanticEditorialReviewRequired,true);assert.equal(row.historicalEtymologyVerified,false);
 assert.equal(row.status,'draft-unreviewed');
 const target=allEvidence[row.wordId];assert.ok(target);
 assert.equal(target.headword.toLowerCase(),row.headword.toLowerCase());
 const sense=target.senses.find(x=>x.senseId===row.masterExampleRef.senseId);assert.ok(sense);
 assert.ok(sense.examples.some(ex=>ex.id===row.masterExampleRef.exampleId&&ex.en===row.exampleEn&&ex.ja===row.exampleJa));
 assert.equal(row.masterMeaningJa,sense.meaningJa);
 if(row.baseWordId){
  assert.equal(master.entries[row.baseHeadword]?.wordId,row.baseWordId);
  const b=allEvidence[row.baseWordId];assert.ok(b);
  assert.equal(b.headword.toLowerCase(),row.baseHeadword.toLowerCase());
  assert.ok(row.teachingBaseSenseId&&b.senses.some(s=>s.senseId===row.teachingBaseSenseId));
 }else assert.equal(row.group,'phrase');
 if(row.semanticReviewPriority==='hold'){
  quarantineCount++;assert.equal(row.morphologyDisplayType,'quarantined-spelling-candidate-not-for-learners');
 }
}
assert.equal(quarantineCount,6);
const qa=[...read('master-practice-016a.json').items,...read('master-practice-016b.json').items];
assert.equal(qa.length,690);assert.equal(new Set(qa.map(x=>x.id)).size,690);
const newMap=new Map(fresh.map(x=>[x.id,x]));let context=0,reconstruct=0;
for(const q of qa){
 const x=newMap.get(q.sourceBreakdownId);assert.ok(x);assert.equal(q.wordId,x.wordId);
 assert.equal(q.masterExampleRef.exampleId,x.masterExampleRef.exampleId);
 assert.equal(q.productionEligible,false);assert.equal(q.editorialReviewRequired,true);
 if(q.mode==='meaning-in-context'){
  context++;assert.equal(q.contextEn,x.exampleEn);assert.equal(q.answerJa,x.masterMeaningJa);
 }else if(q.mode==='english-reconstruction'){
  reconstruct++;assert.equal(q.contextJa,x.exampleJa);assert.equal(q.modelAnswerEn,x.exampleEn);
 }else assert.fail('Unknown practice type '+q.mode);
}
assert.equal(context,345);assert.equal(reconstruct,345);
const report=read('coverage-report-20261117.json');
assert.equal(report.wordBreakdown.records,5065);assert.equal(report.wordBreakdown.matchedMasterDistinctHeadwords,2674);
assert.equal(report.wordBreakdown.uncoveredMasterHeadwords,5979);
console.log('PASS batch 016: 345 records, 690 questions, 639 source words, 737 source senses, 6 held analyses, 0 production');
