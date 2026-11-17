import fs from 'node:fs';
import assert from 'node:assert/strict';

const root = 'data/voca-roots/word-breakdowns/';
const manifest = JSON.parse(fs.readFileSync(root + 'manifest.json', 'utf8'));
const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const datasets = manifest.files.map(file => read(root + file));
const records = datasets.flatMap(dataset => dataset.records);
const morphology = read('data/voca-roots/manifest.json').files
  .filter(file => /^(roots|prefixes|suffixes)-\\d+\\.json$/.test(file))
  .flatMap(file => read('data/voca-roots/' + file).records);
const morphIds = new Set(morphology.map(item => item.id));
const candidates = read('data/vocabulary-drafts/candidate-index.json').entries;
const ids = records.map(item => item.id);
const headwords = new Set(records.map(item => item.headword));
const sourceCache = new Map();

assert.equal(manifest.productionEnabled, false);
assert.equal(new Set(ids).size, ids.length, 'record ID duplicate');
assert.equal(records.length, manifest.counts.records);
assert.equal(headwords.size, manifest.counts.distinctHeadwords);

for (const item of records) {
  assert.ok(item.headword && item.explanationJa && item.parts.length >= 2);
  assert.equal(item.parts.map(part => part.surface.replaceAll('-', '')).join(''), item.headword,
    'spelling reconstruction for ' + item.headword);
  assert.equal(item.wordId, candidates[item.headword]?.wordId ?? null);
  assert.equal(item.status, 'draft-unreviewed');
  assert.equal(item.productionEligible, false);
  assert.equal(item.editorialReviewRequired, true);
  for (const part of item.parts) {
    assert.ok(part.surface && part.meaningJa);
    if (part.morphemeId) assert.ok(morphIds.has(part.morphemeId), part.morphemeId);
  }
  if (item.familyEvidence) {
    const evidence = item.familyEvidence;
    assert.ok(evidence.sourcePath.startsWith('src/data/universe-word-families-'));
    if (!sourceCache.has(evidence.sourcePath)) sourceCache.set(
      evidence.sourcePath, read(evidence.sourcePath).families
    );
    const group = sourceCache.get(evidence.sourcePath)[evidence.familyIndex];
    assert.ok(group && group.some(word => word.word.toLowerCase() === item.headword));
    assert.ok(group.some(word => word.word.toLowerCase() === item.baseHeadword));
    assert.equal(item.historicalEtymologyVerified, false);
  }
}
const matched = records.filter(item => item.wordId);
const modern = records.filter(item => item.id.startsWith('wb:modern:'));
const authored = records.filter(item => item.id.startsWith('wb:core:'));
assert.equal(matched.length, manifest.counts.candidateIndexMatchedRows);
assert.equal(new Set(matched.map(item => item.headword)).size,
  manifest.counts.candidateIndexMatchedDistinctHeadwords);
assert.equal(modern.length, manifest.counts.automatedModernDerivationCandidates);
assert.equal(authored.length, manifest.counts.handAuthoredCoreRecords);
assert.equal(records.length - matched.length, manifest.counts.unresolvedMasterRows);
assert.equal(manifest.counts.fullyEditorialReviewed, 0);
console.log(JSON.stringify({
  status: 'STRUCTURE_OK', records: records.length, headwords: headwords.size,
  modernCandidates: modern.length, authored: authored.length,
  matchedIndexRows: matched.length, productionEnabled: false
}, null, 2));
