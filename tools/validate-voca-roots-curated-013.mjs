import fs from 'node:fs';
import assert from 'node:assert/strict';

const dir = 'data/voca-roots/word-breakdowns/';
const read = name => JSON.parse(fs.readFileSync(dir + name, 'utf8'));
const manifest = read('manifest.json');
const master = read('full-master-index.json');
const coverage = read('coverage-report-20261117.json');
const batch = read('master-curated-013.json');
const exclusions = read('false-split-exclusions-013.json');
const previous = manifest.files.filter(name => name !== 'master-curated-013.json').flatMap(name => read(name).records);
const oldWords = new Set(previous.map(x => x.headword));
const oldIds = new Set(previous.map(x => x.id));
const newWords = new Set();
const seenId = new Set();
const totals = { suffix: 0, prefix: 0, 'compound-like': 0 };
const cefrCounts = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
assert.equal(master.counts.headwords, 8653);
assert.equal(manifest.productionEnabled, false);
assert.equal(batch.productionEnabled, false);
assert.equal(batch.records.length, batch.counts.records);
assert.ok(Array.isArray(exclusions.examples) && exclusions.examples.length >= 20);
assert.equal(exclusions.productionEnabled, false);
for (const record of batch.records) {
  assert.ok(!newWords.has(record.headword), 'duplicate new headword: ' + record.headword);
  assert.ok(!oldWords.has(record.headword), 'headword already registered: ' + record.headword);
  assert.ok(!oldIds.has(record.id), 'record ID already registered: ' + record.id);
  assert.ok(!seenId.has(record.id), 'duplicate new record ID: ' + record.id);
  newWords.add(record.headword);
  seenId.add(record.id);
  assert.equal(record.wordId, master.entries[record.headword]?.wordId);
  assert.equal(record.baseWordId, master.entries[record.baseHeadword]?.wordId);
  assert.equal(record.cefrHeadword, master.entries[record.headword]?.cefrHeadword);
  assert.equal(record.matchStatus, 'complete-master-exact');
  assert.equal(record.parts.map(p => p.surface.replaceAll('-', '')).join(''), record.headword);
  assert.ok(record.parts.length === 2 && record.parts.every(p => p.surface && p.meaningJa));
  assert.ok(record.explanationJa && record.learningQuestionJa && record.imageHintJa && record.meaningJa);
  assert.equal(record.meaningSource, 'original-editorial-draft-not-master-sense-verified');
  assert.equal(record.referenceLookupPending, true);
  assert.deepEqual(record.sourceRefs, []);
  assert.equal(record.historicalEtymologyVerified, false);
  assert.equal(record.semanticEditorialReviewRequired, true);
  assert.equal(record.editorialReviewRequired, true);
  assert.equal(record.productionEligible, false);
  assert.equal(record.status, 'draft-unreviewed');
  const category = record.analysisType.includes('suffix') ? 'suffix'
    : record.analysisType.includes('compound-first') ? 'compound-like' : 'prefix';
  assert.ok(category === 'suffix' || category === 'prefix' || category === 'compound-like');
  if (category === 'compound-like') assert.equal(record.parts[0].kind, 'combining-form');
  if (category === 'suffix') assert.equal(record.parts[1].kind, 'suffix');
  if (category === 'prefix') assert.equal(record.parts[0].kind, 'prefix');
  totals[category]++;
  cefrCounts[record.cefrHeadword]++;
}
assert.deepEqual(totals, {suffix:batch.counts.suffix,prefix:batch.counts.prefix,'compound-like':batch.counts['compound-like']});
assert.deepEqual(cefrCounts, batch.counts.byCefr);
for(const bad of exclusions.examples) {
  assert.ok(!newWords.has(bad.headword), 'false split selected for new batch: ' + bad.headword);
}
assert.equal(manifest.counts.records, previous.length + batch.records.length);
assert.equal(manifest.counts.distinctHeadwords, new Set([...oldWords, ...newWords]).size);
const fullRecords = [...previous, ...batch.records];
const fullMatchedDistinct = new Set(fullRecords.filter(r => r.wordId).map(r => r.headword));
assert.equal(manifest.counts.fullMasterMatchedDistinctHeadwords, fullMatchedDistinct.size);
assert.ok(manifest.counts.fullMasterMatchedDistinctHeadwords >= batch.counts.priorMatchedMasterHeadwords + batch.records.length);
assert.equal(coverage.wordBreakdown.matchedMasterDistinctHeadwords, manifest.counts.fullMasterMatchedDistinctHeadwords);
assert.equal(coverage.wordBreakdown.uncoveredMasterHeadwords, 8653 - manifest.counts.fullMasterMatchedDistinctHeadwords);
assert.equal(manifest.counts.fullyEditorialReviewed, 0);
console.log(JSON.stringify({status:'STRUCTURE_OK',newRecords:batch.records.length,types:totals,excludedFalseSplits:exclusions.examples.length,matchedMasterWords:manifest.counts.fullMasterMatchedDistinctHeadwords,productionEnabled:false},null,2));
