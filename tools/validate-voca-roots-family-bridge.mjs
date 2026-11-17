import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const base = 'data/voca-roots/';
const bridge = read(base + 'word-breakdowns/master-first-family-bridge-20261118.json');
const stories = read(base + 'word-breakdowns/master-first-root-stories-20261118.json');
const links = read(base + 'full-master-word-links.json').entries;
const words = [
  ...read(base + 'word-breakdowns/master-affixes-010.json').records,
  ...read(base + 'word-breakdowns/master-compounds-011.json').records
];
const roots = new Map(Array.from({ length: 10 }, (_, i) => read(base + `roots-${String(i + 1).padStart(3, '0')}.json`))
  .flatMap(f => f.records).map(x => [x.id, x]));
const byWordId = new Map(words.map(w => [w.wordId, w]));
assert.equal(byWordId.size, 446);
assert.equal(bridge.productionEnabled, false);
assert.equal(stories.productionEnabled, false);
const entryList = Object.values(bridge.entries);
assert.equal(entryList.length, bridge.counts.withExistingFamilyCandidate);
assert.equal(entryList.length, 162);
assert.equal(bridge.counts.withoutExistingFamilyCandidate, 284);
assert.equal(Object.keys(bridge.byMorphemeId).length, bridge.counts.distinctMorphemeIds);
for (const entry of entryList) {
  const w = byWordId.get(entry.wordId);
  assert.ok(w && w.headword === entry.headword && w.id === entry.wordBreakdownId, entry.wordId);
  const source = links[entry.wordId];
  assert.ok(source && source.headword === entry.headword, entry.wordId);
  assert.deepEqual(entry.linkIds, source.linkIds);
  assert.deepEqual(entry.morphemeIds, source.morphemeIds);
  assert.equal(entry.etymologyVerified, false);
  for (const id of entry.morphemeIds) {
    assert.ok(bridge.byMorphemeId[id]?.some(m => m.wordId === entry.wordId));
  }
}
const rootIds = Object.keys(bridge.byMorphemeId).filter(id => id.startsWith('root:'));
assert.equal(stories.stories.length, rootIds.length);
assert.equal(stories.stories.length, 63);
let memberships = 0, multiWordStories = 0;
for (const story of stories.stories) {
  assert.ok(roots.has(story.morphemeId));
  assert.equal(story.productionEligible, false);
  assert.equal(story.editorialReviewRequired, true);
  assert.equal(story.originReviewPending, true);
  assert.equal(story.status, 'draft-unreviewed');
  assert.equal(story.learningMeaningJa, roots.get(story.morphemeId).meaningJa);
  const members = bridge.byMorphemeId[story.morphemeId];
  assert.equal(members.length, story.examples.length);
  assert.deepEqual(story.examples.map(x => x.wordId).sort(), members.map(x => x.wordId).sort());
  for(const x of story.examples) {
    assert.ok(members.some(m => m.wordId === x.wordId));
    assert.equal(byWordId.get(x.wordId)?.wordMeaningJa, x.meaningJa);
  }
  memberships += story.examples.length;
  if(story.examples.length >= 2)multiWordStories++;
}
assert.equal(memberships, stories.counts.totalCandidateLinks);
assert.equal(memberships, 86);
assert.equal(multiWordStories, stories.counts.multiWordStories);
console.log(JSON.stringify({
  status: 'CANDIDATE_LINK_STRUCTURE_OK',
  linkedBreakdowns: entryList.length,
  pendingOnly: true,
  rootFamilyStories: stories.stories.length,
  rootWordMemberships: memberships
}, null, 2));
