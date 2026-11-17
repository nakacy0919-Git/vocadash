// VocaRoots CEFR planning map. No etymological approval, source mutation or publishing.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root = 'data/voca-roots/';
const read = file => JSON.parse(fs.readFileSync(root + file, 'utf8'));
const ledger = read('link-ledger.json');
const links = read('full-master-word-links.json');
const manifest = read('manifest.json');
const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
assert.equal(manifest.productionEnabled, false);
assert.equal(links.productionEnabled, false);
const temp = Object.create(null);
for (const link of ledger.links) {
  assert.ok(link.id.endsWith('/' + link.headword), 'Malformed relation ID');
  const id = link.id.slice(0, -(link.headword.length + 1));
  const unit = temp[id] ??= { kind: id.split(':')[0], sourceRelationCandidates: 0,
    wordsByLevel: Object.fromEntries(levels.map(level => [level, []])) };
  unit.sourceRelationCandidates++;
}
for (const [wordId, word] of Object.entries(links.entries)) {
  assert.ok(levels.includes(word.cefrHeadword), 'Unknown CEFR level');
  for (const id of word.morphemeIds) {
    assert.ok(temp[id], 'Resolved relation not found in ledger: ' + id);
    temp[id].wordsByLevel[word.cefrHeadword].push({ wordId, headword: word.headword });
  }
}
const entries = Object.create(null);
const byKind = {
  root: { units: 0, withMasterMatches: 0 },
  prefix: { units: 0, withMasterMatches: 0 },
  suffix: { units: 0, withMasterMatches: 0 }
};
let covered = 0, associations = 0;
for (const id of Object.keys(temp).sort()) {
  const item = temp[id];
  for (const level of levels) item.wordsByLevel[level].sort((a, b) =>
    a.headword < b.headword ? -1 : a.headword > b.headword ? 1 : 0);
  const n = levels.reduce((sum, level) => sum + item.wordsByLevel[level].length, 0);
  item.matchedMasterWordCount = n;
  item.firstMatchedCEFR = levels.find(level => item.wordsByLevel[level].length) || null;
  item.coverageStatus = n ? 'has-unreviewed-master-links' : 'no-master-link-candidate';
  item.editorialReviewRequired = true;
  item.productionEligible = false;
  covered += n > 0 ? 1 : 0;
  associations += n;
  entries[id] = item;
  byKind[item.kind].units++;
  byKind[item.kind].withMasterMatches += n > 0 ? 1 : 0;
}
const counts = {
  morphemeUnits: Object.keys(entries).length,
  unitsWithMasterMatches: covered,
  unitsWithoutMasterMatches: Object.keys(entries).length - covered,
  matchedMasterWords: links.counts.matchedDistinctHeadwords,
  matchedRelations: associations,
  sourceRelationCandidates: ledger.links.length,
  byKind
};
assert.equal(counts.morphemeUnits,
  manifest.counts.roots + manifest.counts.prefixes + manifest.counts.suffixes);
assert.equal(counts.matchedRelations, links.counts.matchedRelations);
const result = {
  schemaVersion: '1.0', asOf: '2026-11-17',
  status: 'draft-reference-only', productionEnabled: false,
  sourceLedger: 'data/voca-roots/link-ledger.json',
  sourceMatchedLinks: 'data/voca-roots/full-master-word-links.json',
  noteJa: '800学習単位のCEFR別関連語候補マップ。語史や語構成の正しさは未校閲。表示・出題・本番公開には使用しない。',
  counts, entries
};
const data = JSON.stringify(result) + '\n';
const out = root + 'study-map-by-cefr.json';
if (process.argv.includes('--write')) {
  fs.writeFileSync(out, data, 'utf8');
  console.log('Draft-only CEFR study map regenerated.');
} else if (process.argv.includes('--check')) {
  assert.equal(fs.readFileSync(out, 'utf8'), data, 'Stale CEFR study map');
  console.log('CEFR study map matches source data.');
}
console.log(JSON.stringify(counts, null, 2));
