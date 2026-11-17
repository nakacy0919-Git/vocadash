import fs from 'node:fs';
import assert from 'node:assert/strict';

const dir = 'data/voca-roots/word-breakdowns/';
const read = file => JSON.parse(fs.readFileSync(dir + file, 'utf8'));
const manifest = read('manifest.json');
const coverage = read('coverage-report-20261117.json');
const master = read('full-master-index.json');
const selection = read('bulk-selection-014.json');
const a = read('bulk-master-compounds-014a.json');
const b = read('bulk-master-compounds-014b.json');
const evidenceParts = Array.from({ length: 7 }, (_, i) => read('bulk-master-evidence-014-0' + (i + 1) + '.json'));
const records = [...a.records, ...b.records];
const queue = read('bulk-editorial-review-014.json');
assert.equal(queue.productionEnabled, false);
assert.equal(queue.entries.length, 429);
assert.deepEqual(queue.counts.byPriority, {high:75, medium:192, low:162});
assert.deepEqual(new Set(queue.entries.map(x => x.breakdownId)), new Set(records.map(x => x.id)));
assert.ok(queue.entries.every(x => x.approved === false && x.productionEligible === false && x.reviewRequired === true));
const earlier = manifest.files.filter(file => !/^bulk-master-compounds-014[ab]\.json$/.test(file))
  .flatMap(file => read(file).records);
const originalMasterManifest = JSON.parse(fs.readFileSync('data/vocabulary-drafts/manifest.json', 'utf8'));
const holds = new Set(originalMasterManifest.editorialHoldWordIds || []);
const evidence = {};
let senseCount = 0, sourceCount = 0;
for (const section of evidenceParts) {
  assert.equal(section.productionEnabled, false);
  assert.equal(section.sourceBatchCount, section.sourceBatchFiles.length);
  sourceCount += section.sourceBatchCount;
  for (const [id, item] of Object.entries(section.entries)) {
    assert.ok(!Object.hasOwn(evidence, id), 'Duplicate evidence word ID ' + id);
    evidence[id] = item;
    for (const sense of item.senses) {
      assert.ok(section.sourceBatchFiles.includes(sense.sourceBatch), sense.sourceBatch);
      assert.ok(sense.senseId && sense.meaningJa && sense.examples.length > 0, item.headword);
      assert.ok(sense.examples.every(ex => ex.id && ex.en && ex.ja));
      senseCount++;
    }
  }
}
assert.equal(sourceCount, 84);
assert.equal(senseCount, 1076);
assert.equal(Object.keys(evidence).length, 951);
assert.equal(records.length, 429);
assert.equal(selection.items.length, 429);
assert.equal(a.productionEnabled, false);
assert.equal(b.productionEnabled, false);
assert.equal(selection.productionEnabled, false);
assert.equal(manifest.productionEnabled, false);

const oldWords = new Set(earlier.map(r => r.headword));
const oldIds = new Set(earlier.map(r => r.id));
const observedWords = new Set(), observedIds = new Set();
const kinds = {compound:0, phrase:0, adverb:0};
const levels = {A1:0,A2:0,B1:0,B2:0,C1:0,C2:0};
let originalExamples = 0, originalExtraExamples = 0, specialCautions = 0;
for (let i = 0; i < records.length; i++) {
  const r = records[i], selected = selection.items[i];
  assert.equal(r.headword, selected.headword, 'Source selection and sorted entry disagree');
  assert.ok(r.id.startsWith('wb:curated:'));
  assert.ok(!oldWords.has(r.headword) && !observedWords.has(r.headword), 'Duplicate headword '+r.headword);
  assert.ok(!oldIds.has(r.id) && !observedIds.has(r.id), 'Duplicate ID '+r.id);
  observedWords.add(r.headword); observedIds.add(r.id);
  assert.ok(!holds.has(r.wordId), 'Master editorial hold selected '+r.headword);
  assert.equal(master.entries[r.headword]?.wordId, r.wordId);
  assert.equal(master.entries[r.headword]?.cefrHeadword, r.cefrHeadword);
  assert.equal(r.matchStatus,'complete-master-exact');
  assert.equal(r.parts.map(p => p.surface.replaceAll('-', '')).join(''),r.headword);
  assert.ok(r.explanationJa && r.learningQuestionJa && r.imageHintJa && r.semanticCautionJa);
  assert.equal(r.meaningSource,'existing-master-vocabulary');
  assert.equal(r.exampleSource,'existing-master-vocabulary');
  assert.equal(r.status,'draft-unreviewed');
  assert.equal(r.historicalEtymologyVerified,false);
  assert.equal(r.productionEligible,false);
  assert.equal(r.semanticEditorialReviewRequired,true);
  assert.equal(r.editorialReviewRequired,true);
  assert.equal(r.referenceLookupPending,true);
  assert.deepEqual(r.sourceRefs,[]);
  const target = evidence[r.wordId];
  assert.ok(target && target.headword.trim().toLowerCase() === r.headword.trim().toLowerCase(), 'Missing master evidence '+r.headword);
  assert.equal(r.masterMeaningJa,target.senses[0].meaningJa);
  assert.deepEqual(r.masterSenseRefs.map(x=>x.senseId).sort(),target.senses.map(x=>x.senseId).sort());
  const examples = target.senses.flatMap(s=>s.examples.map(ex=>({...ex,senseId:s.senseId})));
  assert.ok(examples.some(ex=>ex.id===r.masterExampleRef.exampleId && ex.senseId===r.masterExampleRef.senseId
    && ex.en===r.exampleEn && ex.ja===r.exampleJa), 'Invalid original English/Japanese example '+r.headword);
  assert.ok(r.additionalMasterExamples?.length);
  for (const ex of r.additionalMasterExamples) {
    assert.ok(examples.some(src=>src.id===ex.exampleId && src.senseId===ex.senseId
      && src.en===ex.en && src.ja===ex.ja), 'Incorrect extra example '+r.headword);
  }
  originalExamples++;
  originalExtraExamples+=r.additionalMasterExamples.length;
  if(r.lexicalizationReviewPriority) specialCautions++;
  for (let j=0; j<selected.componentWords.length; j++) {
    const comp = selected.componentWords[j], wordId=selected.componentWordIds[j];
    const part = r.parts[j];
    assert.ok(part && part.surface && part.meaningJa);
    if(comp === '-ally') {
      assert.equal(part.surface,'-ally');
      assert.equal(part.kind,'suffix');
      assert.equal(wordId,null);
    } else {
      assert.equal(part.surface.trim(),comp);
      assert.equal(part.wordId,wordId);
      assert.equal(master.entries[comp]?.wordId,wordId);
      assert.ok(evidence[wordId]?.senses.length);
      assert.deepEqual(part.masterSenseIds.sort(),
        evidence[wordId].senses.map(s=>s.senseId).sort());
    }
  }
  assert.equal(r.parts.length,selected.componentWords.length);
  const kind = selected.kind;
  kinds[kind]++; levels[r.cefrHeadword]++;
}
assert.deepEqual(kinds,{compound:291,phrase:95,adverb:43});
assert.deepEqual(selection.counts,{items:429,...kinds});
assert.equal(manifest.counts.records,earlier.length+429);
assert.equal(manifest.counts.distinctHeadwords,new Set([...oldWords,...observedWords]).size);
assert.equal(manifest.counts.curatedMasterRecords,429);
assert.equal(manifest.counts.fullMasterMatchedDistinctHeadwords,2195);
assert.equal(coverage.wordBreakdown.matchedMasterDistinctHeadwords,2195);
assert.equal(coverage.wordBreakdown.uncoveredMasterHeadwords,8653-2195);
assert.ok(coverage.coverageByLevel.every(level=>level.breakdownHeadwords >= levels[level.cefr]));
assert.equal(manifest.counts.fullyEditorialReviewed,0);
assert.equal(originalExamples,429);
assert.equal(originalExtraExamples,429);
console.log(JSON.stringify({
  status:'STRUCTURE_AND_MASTER_EVIDENCE_OK',newRecords:429,kinds,
  masterSourceBatches:sourceCount,masterEvidenceWords:Object.keys(evidence).length,
  masterSenses:senseCount,pairedExamples:originalExamples+originalExtraExamples,
  specialCautions,matchedMasterHeadwords:2195,productionEnabled:false
},null,2));
