// Validate hand-identified VocaRoots editorial review issues.
// A source link matching an ID does not imply the link is linguistically correct.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const base = 'data/voca-roots/';
const issues = read(base + 'quality/editorial-issues-001.json');
const linked = read(base + 'full-master-word-links.json');
const master = read(base + 'word-breakdowns/full-master-index.json');
const study = read(base + 'study-map-by-cefr.json');
assert.equal(issues.productionEnabled, false);
assert.equal(linked.productionEnabled, false);
assert.equal(issues.records.length, issues.counts.issues);
assert.equal(new Set(issues.records.map(x => x.linkId)).size, issues.records.length);
assert.equal(issues.counts.highPriority,
  issues.records.filter(x => x.priority === 'high').length);
assert.equal(issues.counts.mediumPriority,
  issues.records.filter(x => x.priority === 'medium').length);
assert.equal(issues.counts.distinctHeadwords,
  new Set(issues.records.map(x => x.headword)).size);
for (const row of issues.records) {
  assert.equal(row.publicationBlocked, true);
  assert.equal(row.reviewStatus, 'open');
  assert.equal(row.id, 'review:' + row.linkId);
  assert.ok(master.entries[row.headword], 'Missing master word: ' + row.headword);
  assert.equal(master.entries[row.headword].wordId, row.wordId);
  assert.equal(linked.entries[row.wordId].cefrHeadword, row.cefrHeadword);
  assert.ok(linked.entries[row.wordId].linkIds.includes(row.linkId),
    'Flagged link is absent from original candidates: ' + row.linkId);
  assert.equal(row.linkId, row.morphemeId + '/' + row.headword);
  assert.ok(study.entries[row.morphemeId]);
  if (row.suggestedMorphemeId) assert.ok(study.entries[row.suggestedMorphemeId]);
  assert.ok(row.explanationJa && row.issueType && row.recommendation);
}
const approvedPath = process.argv.find((arg, i) => i && process.argv[i-1] === '--approved-file');
if (approvedPath) {
  const approved = read(approvedPath);
  assert.ok(Array.isArray(approved.linkIds),
    'Approved candidate file must have a linkIds array');
  const blocked = new Set(issues.records
    .filter(row => row.publicationBlocked && row.reviewStatus !== 'resolved')
    .map(row => row.linkId));
  const forbidden = approved.linkIds.filter(id => blocked.has(id));
  assert.deepEqual(forbidden, [],
    'Proposed publication contains links with unresolved editorial issues');
  console.log('No unresolved identified links are in the proposed approved list.');
}
console.log(JSON.stringify(issues.counts, null, 2));
