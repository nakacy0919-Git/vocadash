import fs from 'node:fs';
import assert from 'node:assert/strict';

const root = 'data/voca-roots/word-breakdowns/';
const manifest = JSON.parse(fs.readFileSync(root + 'manifest.json', 'utf8'));
const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const datasets = manifest.files.map(file => read(root + file));
const records = datasets.flatMap(dataset => dataset.records);
const morphology = read('data/voca-roots/manifest.json').files
  .filter(file => /^(roots|prefixes|suffixes)-\d+\.json$/.test(file))
  .flatMap(file => read('data/voca-roots/' + file).records);
const morphIds = new Set(morphology.map(item => item.id));
const master = read('data/voca-roots/word-breakdowns/full-master-index.json');
const candidates = master.entries;
assert.equal(master.counts.headwords, 8653);
assert.equal(master.counts.senses, 9614);
assert.equal(Object.keys(candidates).length, master.counts.headwords);
const ids = records.map(item => item.id);
const headwords = new Set(records.map(item => item.headword));
const sourceCache = new Map();
function jsExportedObject(src) {
  const marker = src.indexOf('export default');
  assert.ok(marker >= 0, 'Missing JS default export');
  const start = src.indexOf('{', marker);
  let depth = 0, quoted = false, escaped = false;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') quoted = false;
    } else if (ch === '"') quoted = true;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return JSON.parse(src.slice(start, i + 1));
  }
  throw Error('Cannot parse JS family source');
}

assert.equal(manifest.productionEnabled, false);
assert.equal(new Set(ids).size, ids.length, 'record ID duplicate');
assert.equal(records.length, manifest.counts.records);
assert.equal(headwords.size, manifest.counts.distinctHeadwords);

for (const item of records) {
  assert.ok(item.headword && item.explanationJa && item.parts.length >= 2);
  assert.equal(item.parts.map(part => part.surface.replaceAll('-', '')).join(''), item.headword,
    'spelling reconstruction for ' + item.headword);
  assert.equal(item.wordId, candidates[item.headword]?.wordId ?? null);
  assert.equal(item.cefrHeadword, candidates[item.headword]?.cefrHeadword ?? null);
  assert.equal(item.matchStatus, candidates[item.headword] ? 'complete-master-exact' : 'not-in-8653-headword-master');
  assert.equal(item.status, 'draft-unreviewed');
  assert.equal(item.productionEligible, false);
  assert.equal(item.editorialReviewRequired, true);
  for (const part of item.parts) {
    assert.ok(part.surface && part.meaningJa);
    if (part.morphemeId) assert.ok(morphIds.has(part.morphemeId), part.morphemeId);
  }
  if (item.familyEvidence) {
    const evidence = item.familyEvidence;
    assert.ok(
      (evidence.sourceType === 'js-family'
        && /^src\/data\/universe-[a-z0-9-]+\.js$/.test(evidence.sourcePath))
      || (evidence.sourceType !== 'js-family'
        && /^src\/data\/universe-word-families-[a-z0-9-]+\.json$/.test(evidence.sourcePath)),
      'Unexpected word-family source path: ' + evidence.sourcePath
    );
    if (!sourceCache.has(evidence.sourcePath)) {
      const source = evidence.sourceType === 'js-family'
        ? jsExportedObject(fs.readFileSync(evidence.sourcePath, 'utf8'))
        : read(evidence.sourcePath).families;
      sourceCache.set(evidence.sourcePath, source);
    }
    if (evidence.sourceType === 'js-family') {
      const group = sourceCache.get(evidence.sourcePath)[evidence.baseHeadword];
      assert.ok(group?.links?.some(link => link.type === 'family'
        && link.word.toLowerCase() === item.headword), 'JS family evidence for ' + item.headword);
      assert.equal(evidence.targetHeadword, item.headword);
    } else {
      const group = sourceCache.get(evidence.sourcePath)[evidence.familyIndex];
      assert.ok(group && group.some(word => word.word.toLowerCase() === item.headword));
      assert.ok(group.some(word => word.word.toLowerCase() === item.baseHeadword));
    }
    assert.equal(item.historicalEtymologyVerified, false);
  }
}
const matched = records.filter(item => item.wordId);
const modern = records.filter(item => item.id.startsWith('wb:modern:'));
const authored = records.filter(item => item.id.startsWith('wb:core:'));
assert.equal(matched.length, manifest.counts.candidateIndexMatchedRows);
assert.equal(matched.length, manifest.counts.fullMasterMatchedRows);
assert.equal(new Set(matched.map(item => item.headword)).size,
  manifest.counts.candidateIndexMatchedDistinctHeadwords);
assert.equal(new Set(matched.map(item => item.headword)).size,
  manifest.counts.fullMasterMatchedDistinctHeadwords);
assert.equal(modern.length, manifest.counts.automatedModernDerivationCandidates);
assert.equal(authored.length, manifest.counts.handAuthoredCoreRecords);
assert.equal(records.length - matched.length, manifest.counts.unresolvedMasterRows);
assert.equal(headwords.size - new Set(matched.map(item => item.headword)).size, manifest.counts.notIn8653MasterHeadwords);
assert.equal(manifest.counts.fullyEditorialReviewed, 0);
console.log(JSON.stringify({
  status: 'STRUCTURE_OK', records: records.length, headwords: headwords.size,
  modernCandidates: modern.length, authored: authored.length,
  matchedFullMasterRows: matched.length, productionEnabled: false
}, null, 2));
