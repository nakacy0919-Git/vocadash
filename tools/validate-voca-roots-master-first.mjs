import assert from 'node:assert/strict';
import fs from 'node:fs';

const dir = 'data/voca-roots/word-breakdowns/';
const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const master = read(dir + 'full-master-index.json');
const manifest = read(dir + 'manifest.json');
const coverage = read(dir + 'coverage-report-20261117.json');
const affix = read(dir + 'master-affixes-010.json');
const compound = read(dir + 'master-compounds-011.json');
const evidenceFiles = Array.from({ length: 7 }, (_, i) => `master-evidence-0${i + 1}.json`);
const evidenceBatches = evidenceFiles.map(f => read(dir + f));
const evidence = {};
let sourceBatchCount = 0;

for (const part of evidenceBatches) {
  assert.equal(part.productionEnabled, false);
  sourceBatchCount += part.sourceBatchCount;
  for (const [id, entry] of Object.entries(part.entries)) {
    assert.ok(!Object.hasOwn(evidence, id), `duplicate evidence ID: ${id}`);
    evidence[id] = entry;
  }
}
assert.equal(sourceBatchCount, 84);
const records = [...affix.records, ...compound.records];
assert.equal(records.length, 446);
assert.equal(affix.records.length, 362);
assert.equal(compound.records.length, 84);
assert.equal(Object.keys(evidence).length, 870);
const seenIds = new Set(), seenHeadwords = new Set();
for (const r of records) {
  assert.ok(!seenIds.has(r.id), r.id);
  assert.ok(!seenHeadwords.has(r.headword), r.headword);
  seenIds.add(r.id);
  seenHeadwords.add(r.headword);
  const canonical = master.entries[r.headword];
  assert.ok(canonical && canonical.wordId === r.wordId);
  assert.equal(canonical.cefrHeadword, r.cefrHeadword);
  assert.equal(r.matchStatus, 'complete-master-exact');
  assert.equal(r.parts.map(p => p.surface.replaceAll('-', '')).join(''), r.headword);
  for (const p of r.parts) {
    assert.ok(p.surface && p.meaningJa);
    if (p.wordId) {
      assert.equal(master.entries[p.surface]?.wordId, p.wordId);
      assert.ok(evidence[p.wordId]?.senses.length);
      assert.equal(p.masterSenseId, evidence[p.wordId].senses[0].senseId);
    }
  }
  assert.equal(r.productionEligible, false);
  assert.equal(r.historicalEtymologyVerified, false);
  assert.equal(r.editorialReviewRequired, true);
  assert.equal(r.semanticEditorialReviewRequired, true);
  assert.equal(r.status, 'draft-unreviewed');
  assert.ok(r.learningQuestionJa && r.imageHintJa && r.explanationJa);
  assert.ok(r.meaningJa && r.wordMeaningJa && r.exampleEn && r.exampleJa);
  assert.equal(r.exampleSource, 'existing-master-vocabulary');
  const e = evidence[r.wordId];
  assert.ok(e && e.headword === r.headword, r.headword);
  const originalSenses = e.senses.map(s => s.senseId).sort();
  assert.deepEqual(r.masterSenseRefs.map(s => s.senseId).sort(), originalSenses);
  assert.equal(r.masterMeaningJa, e.senses[0].meaningJa);
  assert.ok(e.senses.some(s => s.example?.en === r.exampleEn && s.example?.ja === r.exampleJa), r.headword);
  if (r.baseHeadword) {
    assert.equal(master.entries[r.baseHeadword]?.wordId, r.baseWordId);
    assert.ok(evidence[r.baseWordId]);
  }
}
assert.equal(manifest.productionEnabled, false);
assert.equal(manifest.counts.records, 3920);
assert.equal(manifest.counts.distinctHeadwords, 3917);
assert.equal(manifest.counts.fullMasterMatchedDistinctHeadwords, 1529);
assert.equal(manifest.counts.fullyEditorialReviewed, 0);
assert.equal(coverage.wordBreakdown.records, manifest.counts.records);
assert.equal(coverage.wordBreakdown.matchedMasterDistinctHeadwords, 1529);
assert.equal(coverage.wordBreakdown.uncoveredMasterHeadwords, 8653 - 1529);
console.log(JSON.stringify({
  status: 'STRUCTURE_AND_PROVENANCE_OK',
  newWordBreakdowns: records.length,
  affixBreakdowns: affix.records.length,
  compoundBreakdowns: compound.records.length,
  canonicalSourceBatches: sourceBatchCount,
  referencedMasterWords: Object.keys(evidence).length,
  meaningsAndExamplesLinked: records.length,
  editorialReviewed: 0,
  productionEnabled: false
}, null, 2));
