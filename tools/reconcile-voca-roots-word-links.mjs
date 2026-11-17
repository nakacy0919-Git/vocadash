// Reconcile VocaRoots word-link candidates against the complete VocaDash master.
// Strict exact spelling/ID matching only; does not verify etymology or publish.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const root = 'data/voca-roots/';
const indexPath = root + 'full-master-word-links.json';
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const master = read(root + 'word-breakdowns/full-master-index.json');
const ledger = read(root + 'link-ledger.json');
const manifest = read(root + 'manifest.json');
const masterEntries = master.entries;
assert.equal(manifest.productionEnabled, false);
assert.equal(master.counts.headwords, Object.keys(masterEntries).length);
assert.equal(ledger.links.length, manifest.counts.relations);

const raw = new Map();
for (const file of manifest.files.filter(name => /^word-links-\d{3}\.json$/.test(name))) {
  const batch = read(root + file);
  for (const row of batch.records) {
    assert.ok(!raw.has(row.id), 'Repeated source link ID ' + row.id);
    raw.set(row.id, row);
  }
}
assert.equal(raw.size, ledger.links.length, 'Link ledger differs from source batches');

const matched = Object.create(null);
const seen = new Set();
for (const link of ledger.links) {
  assert.ok(!seen.has(link.id), 'Repeated ledger ID ' + link.id);
  seen.add(link.id);
  const source = raw.get(link.id);
  assert.ok(source, 'Missing original relation ' + link.id);
  assert.equal(source.headword, link.headword, 'Ledger headword changed');
  assert.equal(source.wordId, link.wordId, 'Ledger ID changed');
  assert.ok(link.id.endsWith('/' + link.headword), 'Invalid canonical link ID');
  const morphemeId = link.id.slice(0, -(link.headword.length + 1));
  assert.equal(source.morphemeId, morphemeId, 'Link morpheme mismatch');
  const normalized = link.headword.trim().toLowerCase();
  const match = masterEntries[normalized];
  if (!match) continue;
  if (source.wordId) assert.equal(source.wordId, match.wordId,
    'Previously matched word ID conflicts with full master: ' + link.headword);
  const bucket = matched[match.wordId] ??= {
    headword: normalized, cefrHeadword: match.cefrHeadword,
    linkIds: [], morphemeIds: []
  };
  assert.equal(bucket.headword, normalized, 'Master ID maps to different headwords');
  bucket.linkIds.push(link.id);
  if (!bucket.morphemeIds.includes(morphemeId)) bucket.morphemeIds.push(morphemeId);
}

const entries = Object.create(null);
for (const key of Object.keys(matched).sort()) {
  const entry = matched[key];
  entry.linkIds.sort();
  entry.morphemeIds.sort();
  entries[key] = entry;
}
const resolvedLinks = Object.values(entries).reduce((n, entry) => n + entry.linkIds.length, 0);
const counts = {
  sourceRelations: ledger.links.length,
  matchedRelations: resolvedLinks,
  matchedDistinctHeadwords: Object.keys(entries).length,
  unmatchedRelations: ledger.links.length - resolvedLinks,
  unmatchedMasterHeadwords: master.counts.headwords - Object.keys(entries).length,
  masterHeadwords: master.counts.headwords,
  legacyMatchedRelations: ledger.links.filter(link => link.wordId).length,
  additionalResolved: ledger.links.filter(link =>
    !link.wordId && masterEntries[link.headword.trim().toLowerCase()]).length
};
assert.equal(counts.legacyMatchedRelations, manifest.counts.matchedRelations);
assert.equal(counts.sourceRelations, manifest.counts.relations);
if (manifest.fullMasterReconciliation) {
  for (const [name, value] of Object.entries(counts)) {
    assert.equal(manifest.fullMasterReconciliation.counts[name], value,
      'Full master manifest mismatch for ' + name);
  }
}
const result = {
  schemaVersion: '1.0', generatedOn: '2026-11-17',
  status: 'draft-reference-only', productionEnabled: false,
  sourceMaster: 'data/voca-roots/word-breakdowns/full-master-index.json',
  sourceLedger: 'data/voca-roots/link-ledger.json',
  matchingPolicy: 'Exact lowercase-and-trimmed headword only; no fuzzy etymology inference',
  reviewNoticeJa: '語源・現代の形態分解の妥当性は未校閲。これは単語ID照合インデックスであり、本番の学習画面やクイズに直接公開しない。',
  counts, entries
};
const serialized = JSON.stringify(result) + '\n';
if (process.argv.includes('--write')) {
  fs.writeFileSync(indexPath, serialized, 'utf8');
  console.log('Rebuilt draft-only index; no source links or app data modified.');
} else if (process.argv.includes('--check')) {
  assert.equal(fs.readFileSync(indexPath, 'utf8'), serialized,
    'Derived index is stale; run --write and review changes');
  console.log('Derived index matches sources.');
}
console.log(JSON.stringify(counts, null, 2));
