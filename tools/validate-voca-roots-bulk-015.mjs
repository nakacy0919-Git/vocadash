import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='data/voca-roots/word-breakdowns/';
const read=p=>JSON.parse(fs.readFileSync(dir+p,'utf8'));
const manifest=read('manifest.json'), sel=read('bulk-selection-015.json'), master=read('full-master-index.json');
const batch=read('master-curated-015.json'), a=read('master-practice-015a.json'), b=read('master-practice-015b.json');
const originalMaster=JSON.parse(fs.readFileSync('data/vocabulary-drafts/manifest.json','utf8'));
const holds=new Set(originalMaster.editorialHoldWordIds||[]);
const old=manifest.files.filter(f=>f!=='master-curated-015.json' && !/^master-curated-016[ab]\.json$/.test(f)).flatMap(f=>read(f).records);
const all=[...old,...batch.records];
assert.equal(old.length,4586);assert.equal(batch.records.length,134);
assert.equal(manifest.productionEnabled,false);assert.equal(batch.productionEnabled,false);
assert.equal(new Set(all.map(x=>x.id)).size,all.length);
assert.equal(new Set(all.map(x=>x.headword)).size,4717); // historical coverage through 015
assert.equal(all.length,4720); // future batches are validated separately
assert.ok(manifest.counts.records >= all.length);
assert.equal(new Set(all.filter(x=>x.wordId).map(x=>x.headword)).size,2329); // historical 015 coverage
assert.ok(manifest.counts.fullMasterMatchedDistinctHeadwords >= 2329);
assert.equal(sel.pairs.length,134);assert.equal(originalMaster.batchFiles.length,84);
const evidence={};let sourceFiles=0,senseCount=0;
for(let i=1;i<=7;i++){
 const part=read('master-evidence-015-0'+i+'.json');assert.equal(part.productionEnabled,false);
 sourceFiles+=part.sourceBatchCount;
 for(const [id,e] of Object.entries(part.entries)){
  assert.ok(!Object.hasOwn(evidence,id));evidence[id]=e;senseCount+=e.senses.length;
 }
}
assert.equal(sourceFiles,84);assert.equal(Object.keys(evidence).length,266);assert.equal(senseCount,323);
const oldWords=new Set(old.map(x=>x.headword)),origCache=new Map();let missingVisible=0;
for(let i=0;i<batch.records.length;i++){
 const x=batch.records[i], picked=sel.pairs[i];
 assert.equal(x.headword,picked.headword);assert.ok(!oldWords.has(x.headword),x.headword);
 assert.equal(x.id,'wb:curated:'+x.headword);
 assert.equal(master.entries[x.headword]?.wordId,x.wordId);
 assert.equal(master.entries[x.baseHeadword]?.wordId,x.baseWordId);
 assert.ok(!holds.has(x.wordId));
 assert.equal(x.parts.map(p=>p.surface.replaceAll('-','')).join(''),x.headword);
 if(x.teachingBaseSenseId){
  const selected=x.baseSenseRefs.find(s=>s.senseId===x.teachingBaseSenseId);
  assert.ok(selected,'Missing reviewed master base sense '+x.headword);
  assert.equal(x.parts[0].meaningJa,selected.meaningJa);
 }
 if(x.morphologyDisplayType==='quarantined-spelling-candidate-not-approved-for-etymology-lessons'){
  assert.equal(x.productionEligible,false);
  assert.equal(x.analysisType,'orthographic-relationship-review-only');
 }

 assert.equal(x.productionEligible,false);assert.equal(x.editorialReviewRequired,true);
 assert.equal(x.semanticEditorialReviewRequired,true);assert.equal(x.historicalEtymologyVerified,false);
 assert.equal(x.status,'draft-unreviewed');
 const target=evidence[x.wordId],base=evidence[x.baseWordId];
 assert.equal(target.headword,x.headword);assert.equal(base.headword,x.baseHeadword);
 const match=target.senses.find(s=>s.senseId===x.masterExampleRef.senseId);
 assert.ok(match && match.meaningJa===x.masterMeaningJa);
 assert.ok(match.examples.some(ex=>ex.id===x.masterExampleRef.exampleId && ex.en===x.exampleEn && ex.ja===x.exampleJa));
 for(const [ev,wordId] of [[target,x.wordId],[base,x.baseWordId]])for(const sense of ev.senses){
  if(!origCache.has(sense.sourceBatch))origCache.set(sense.sourceBatch,JSON.parse(fs.readFileSync('data/vocabulary-drafts/'+sense.sourceBatch,'utf8')).records);
  const original=origCache.get(sense.sourceBatch).find(r=>r.senseId===sense.senseId&&r.wordId===wordId);
  assert.ok(original,'No exact original sense '+sense.senseId);
  for(const ex of sense.examples)assert.ok(original.examples.some(e=>e.id===ex.id&&e.en===ex.en&&e.ja===ex.ja));
 }
 if(!x.exampleSurfaceVerified)missingVisible++;
}
assert.equal(missingVisible,batch.counts.exampleSurfaceNeedsEditorialReview);
const questions=[...a.items,...b.items], qids=new Set();
const original014=[...read('bulk-master-compounds-014a.json').records,...read('bulk-master-compounds-014b.json').records];
const srcMap=new Map(original014.map(x=>[x.id,x]));assert.equal(srcMap.size,429);
let meanings=0,reconstructions=0;
for(const q of questions){
 assert.ok(!qids.has(q.id));qids.add(q.id);
 assert.equal(q.productionEligible,false);assert.equal(q.editorialReviewRequired,true);
 const source=srcMap.get(q.sourceBreakdownId);assert.ok(source);
 assert.equal(q.headword,source.headword);assert.equal(q.wordId,source.wordId);
 assert.equal(q.masterExampleRef.exampleId,source.masterExampleRef.exampleId);
 if(q.mode==='meaning-in-context'){
  meanings++;assert.equal(q.contextEn,source.exampleEn);assert.equal(q.answerJa,source.masterMeaningJa||source.meaningJa);
 }else if(q.mode==='english-reconstruction'){
  reconstructions++;assert.equal(q.contextJa,source.exampleJa);assert.equal(q.modelAnswerEn,source.exampleEn);
 }else assert.fail('unexpected question mode '+q.mode);
}
assert.equal(questions.length,858);assert.equal(meanings,429);assert.equal(reconstructions,429);
console.log('PASS: 134 new breakdowns, 858 source-linked practices, 2329 covered master headwords, 0 production publication');
