// Validate bilingual draft example cards with exact master-word IDs and an editorial issue guard.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const root = 'data/voca-roots/';
const man = read(root + 'lessons/manifest.json');
const batches = man.files.map(file => read(root + 'lessons/' + file));
const rows = batches.flatMap(batch => batch.records);
const master = read(root + 'word-breakdowns/full-master-index.json');
const links = read(root + 'full-master-word-links.json');
const issues = read(root + 'quality/editorial-issues-001.json');
assert.equal(man.productionEnabled, false);
assert.equal(rows.length, man.counts.exampleCards);
assert.equal(rows.length, batches.reduce((n, x) => n + x.counts.examples, 0));
assert.equal(new Set(rows.map(x => x.id)).size, rows.length);
assert.equal(new Set(rows.map(x => x.wordId)).size, rows.length);
assert.equal(new Set(rows.map(x => x.headword)).size, rows.length);
const byUnit = new Map();
const blocked = new Set(issues.records
  .filter(x => x.publicationBlocked && x.reviewStatus !== 'resolved')
  .map(x => x.linkId));
for (const row of rows) {
  assert.equal(row.status, 'draft-unreviewed');
  assert.equal(row.productionEligible, false);
  assert.equal(row.editorialReviewRequired, true);
  assert.equal(row.historicalEtymologyVerified, false);
  assert.ok(row.learningNoteJa && row.exampleEn && row.exampleJa && row.lessonTitleJa);
  assert.equal(row.id, 'lesson-example:' + row.sourceLinkId);
  assert.equal(row.sourceLinkId, row.lessonUnitId + '/' + row.headword);
  assert.ok(!blocked.has(row.sourceLinkId), 'Flagged incorrect source link in lesson');
  const m = master.entries[row.headword];
  assert.ok(m, 'Missing master word ' + row.headword);
  assert.equal(row.wordId, m.wordId);
  assert.equal(row.cefrHeadword, m.cefrHeadword);
  assert.ok(links.entries[row.wordId].linkIds.includes(row.sourceLinkId));
  assert.ok(row.exampleEn.toLowerCase().includes(row.headword.toLowerCase()),
    'Example does not include the exact target spelling');
  byUnit.set(row.lessonUnitId, (byUnit.get(row.lessonUnitId) || 0) + 1);
}
assert.equal(byUnit.size, man.counts.lessonUnits);
for (const [mid, count] of byUnit) assert.equal(count, 4,
  'Each lesson unit must have 4 examples: ' + mid);
assert.equal(man.counts.distinctHeadwords, new Set(rows.map(x => x.headword)).size);
assert.equal(man.counts.matchedMasterWordIds, new Set(rows.map(x => x.wordId)).size);
assert.equal(man.counts.reviewedCards, 0);
assert.equal(man.counts.productionCards, 0);
console.log(JSON.stringify(man.counts, null, 2));
