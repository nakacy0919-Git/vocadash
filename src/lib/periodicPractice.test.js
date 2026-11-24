import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PRACTICE_OPTIONS, eligibleClozeWords, isClozeReady,
  shuffledChoices, sessionItems, recoverSession, summarizePractice } from './periodicPractice.js';
const sample = (n) => ({ id: 'regular:regular4:' + n, prompt: 'People are ________.', choices:['big','equal','tiny','old'], correctIndex:1, word:'equal' });
test('periodic practice accepts only valid four-choice gap-fill items', () => {
  const words=[sample(1), { ...sample(2), prompt:'No blank' }, { ...sample(3), choices:['yes','no'] },
    { ...sample(4), correctIndex:7 }];
  assert.equal(eligibleClozeWords(words).length, 1);
  assert.equal(isClozeReady(words[0]), true);
});
test('answer order changes without losing original answer identity', () => {
  const word=sample(1);
  const a=shuffledChoices(word, 1100);
  assert.deepEqual(a, shuffledChoices(word, 1100));
  assert.equal(a.length, 4);
  assert.deepEqual(a.map(o=>o.index).sort(), [0,1,2,3]);
  assert.equal(a.find(o=>o.index === word.correctIndex).text, 'equal');
});
test('training respects question-count limit and sequential order', () => {
  const words=Array.from({length:50},(_,i)=>sample(i+1));
  assert.equal(DEFAULT_PRACTICE_OPTIONS.count,20);
  assert.deepEqual(sessionItems(words,{count:10,random:false}),words.slice(0,10).map(w=>w.id));
  assert.equal(sessionItems(words,{count:20,random:true},()=>.32).length,20);
  assert.equal(sessionItems(words,{count:50,random:false}).length,50);
});
test('only validated interrupted sessions can resume', () => {
  const words=[sample(1),sample(2)];
  const s={ids:words.map(w=>w.id),cursor:1,seed:42,answers:[{id:words[0].id, correct:false}]};
  assert.deepEqual(recoverSession(s,words),s);
  assert.equal(recoverSession({...s,ids:['alien']},words),null);
  assert.equal(recoverSession({...s,cursor:2},words),null);
});
test('results preserve missed IDs for targeted retry', () => {
  const a=[{id:'a',correct:false},{id:'b',correct:true},{id:'c',correct:true}];
  assert.deepEqual(summarizePractice(a),{correct:2,total:3,rate:67,wrong:['a']});
});
