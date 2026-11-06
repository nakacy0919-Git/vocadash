import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG, sourcePath, normalizeWords, updateRecord, summaryFor, isDue, assetImage } from './learning.js';

test('all catalog entries define study units', () => {
  assert.equal(CATALOG.length, 7);
  for (const course of CATALOG) assert.ok(course.units.length > 0);
  assert.equal(sourcePath('eiken_pre1','2'),'./data/eiken_pre1_stage2.json');
  assert.equal(sourcePath('eiken1_master','phrasal_verb'),'./data/eiken_phrasal_verb.json');
  assert.equal(sourcePath('reading','15'),'./data/lesson15_30words.json');
});

test('normalizes existing multiple choice and master vocabulary', () => {
  const common = normalizeWords([{id:7,english:'It was ________.',japanese:'それは________だった。',choices:['fine','unavoidable','tiny','bad'],correct:1,word_details:[{word:'unavoidable',meaning:'避けられない'}]}],'eiken_2','1');
  assert.equal(common[0].id,'eiken_2:1:7');
  assert.equal(common[0].word,'unavoidable');
  assert.equal(common[0].meaning,'避けられない');
  assert.equal(common[0].english,'It was unavoidable.');
  const master = normalizeWords([{id:'x',targetWord:'buckle down',meaning:'本腰を入れる',english:'I will buckle down.',choices:['buckle down','get up','put off','take in'],correct:0}],'eiken1_master','phrasal_verb');
  assert.equal(master[0].word,'buckle down');
});

test('spaced repetition records cards separately and schedules due dates', () => {
  const start = {records:{},totalAnswers:0};
  const now = Date.UTC(2026,10,6);
  const once = updateRecord(start,'eiken_2:1:7',true,now);
  assert.equal(once.records['eiken_2:1:7'].level,1);
  assert.equal(once.records['eiken_2:1:7'].dueAt,now+86400000);
  assert.equal(isDue(once.records['eiken_2:1:7'],now),false);
  const twice = updateRecord(once,'eiken_2:1:7',true,now+86400000);
  assert.equal(twice.records['eiken_2:1:7'].level,2);
  assert.equal(summaryFor([{id:'eiken_2:1:7'}],twice.records).known,1);
  const missed = updateRecord(twice,'eiken_2:1:7',false,now+86400000*2);
  assert.equal(missed.records['eiken_2:1:7'].level,0);
  assert.equal(isDue(missed.records['eiken_2:1:7'],now+86400000*2),true);
  assert.equal(start.totalAnswers,0);
  assert.equal(missed.totalAnswers,3);
});

test('converts media filenames without losing ordinary paths', () => {
  assert.equal(assetImage('/images/verb/1 example word.webp'),'/images/verb/1.webp');
  assert.equal(assetImage('/images/verb/1.webp'),'/images/verb/1.webp');
});
