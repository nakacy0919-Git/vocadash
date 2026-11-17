import fs from 'node:fs';
import assert from 'node:assert/strict';

const dir = 'data/voca-roots/word-breakdowns/';
const masterPath = 'data/vocabulary-drafts/manifest.json';
const outPath = dir + 'full-master-index.json';
const vocabManifest = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
const wbManifest = JSON.parse(fs.readFileSync(dir + 'manifest.json', 'utf8'));
const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const write = (path, object) => fs.writeFileSync(path, JSON.stringify(object, null, 2) + '\n', 'utf8');
const writeCompact = (path, object) => fs.writeFileSync(path, JSON.stringify(object) + '\n', 'utf8');

assert.equal(wbManifest.productionEnabled, false, 'Never update a published dataset');
assert.equal(vocabManifest.batchFiles.length, 84, 'Master batch count changed; inspect source list');

const entries = Object.create(null);
const byId = new Map();
let senses = 0;
for (const batch of vocabManifest.batchFiles) {
  const rows = read('data/vocabulary-drafts/' + batch).records;
  for (const r of rows) {
    senses += 1;
    const headword = String(r.headword || '').trim().toLowerCase();
    assert.ok(headword && r.wordId && r.cefrHeadword, 'Missing master headword/ID/level');
    if (entries[headword]) {
      assert.equal(entries[headword].wordId, r.wordId, 'Conflicting master ID for ' + headword);
      assert.equal(entries[headword].cefrHeadword, r.cefrHeadword, 'Conflicting level for ' + headword);
      entries[headword].senseCount++;
    } else {
      assert.ok(!byId.has(r.wordId), 'Word ID assigned to different headwords: ' + r.wordId);
      entries[headword] = { wordId: r.wordId, cefrHeadword: r.cefrHeadword, senseCount: 1 };
      byId.set(r.wordId, headword);
    }
  }
}
assert.equal(Object.keys(entries).length, vocabManifest.totals.distinctHeadwords);
assert.equal(senses, vocabManifest.totals.senses);
const master = {
  schemaVersion: '1.0',
  asOf: '2026-11-17',
  masterPath,
  activeSourceBatches: vocabManifest.batchFiles.length,
  counts: { headwords: Object.keys(entries).length, wordIds: byId.size, senses },
  status: 'draft-reference-only',
  licenseNote: 'Original draft word IDs; not an etymology approval or publication permission',
  entries
};

const draftFiles = wbManifest.files;
const updated = draftFiles.map(filename => {
  const data = read(dir + filename);
  for (const row of data.records) {
    const match = entries[row.headword] ?? null;
    if (row.wordId && match && row.wordId !== match.wordId) {
      throw new Error('Existing ID conflict: ' + row.headword);
    }
    row.wordId = match?.wordId ?? null;
    row.cefrHeadword = match?.cefrHeadword ?? null;
    row.matchStatus = match ? 'complete-master-exact' : 'not-in-8653-headword-master';
    assert.equal(row.productionEligible, false);
  }
  return { filename, data };
});
const all = updated.flatMap(x => x.data.records);
const matched = all.filter(row => row.wordId);
const distinct = new Set(all.map(row => row.headword));
const matchedDistinct = new Set(matched.map(row => row.headword));
const summary = {
  rows: all.length,
  distinctHeadwords: distinct.size,
  matchedRows: matched.length,
  matchedDistinct: matchedDistinct.size,
  outOfMasterRows: all.length - matched.length,
  outOfMasterDistinct: distinct.size - matchedDistinct.size,
  masterHeadwords: Object.keys(entries).length,
  masterSenses: senses,
  productionEnabled: false
};
assert.equal(summary.rows, wbManifest.counts.records);
assert.equal(summary.distinctHeadwords, wbManifest.counts.distinctHeadwords);
console.log(JSON.stringify(summary, null, 2));

if (process.argv.includes('--write')) {
  // This only changes local repository files. It never publishes or deploys.
  writeCompact(outPath, master);
  for (const { filename, data } of updated) write(dir + filename, data);
  const c = wbManifest.counts;
  c.candidateIndexMatchedRows = summary.matchedRows;
  c.candidateIndexMatchedDistinctHeadwords = summary.matchedDistinct;
  c.fullMasterMatchedRows = summary.matchedRows;
  c.fullMasterMatchedDistinctHeadwords = summary.matchedDistinct;
  c.unresolvedMasterRows = summary.outOfMasterRows;
  c.notIn8653MasterHeadwords = summary.outOfMasterDistinct;
  write(dir + 'manifest.json', wbManifest);
  console.log('Updated development files locally. Review and commit deliberately.');
}
