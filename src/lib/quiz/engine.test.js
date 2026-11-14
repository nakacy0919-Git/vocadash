import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {FORMATS,adaptVocabulary,buildQuestions,validateQuestion,gradeAnswer,createAttempt,planSession,sentenceQuestions,shuffle} from './engine.js';
const authored=JSON.parse(fs.readFileSync(new URL('../../data/quiz-authored.json',import.meta.url)));
const root=new URL('../../../data/vocabulary-drafts/batches/',import.meta.url);
const records=[...new Map(fs.readdirSync(root).filter(f=>f.endsWith('.json')).flatMap(f=>JSON.parse(fs.readFileSync(new URL(f,root))).records||[]).map(r=>[r.senseId,r])).values()];
test('authored specialist questions have evidence and exactly one option answer',()=>{
  for(const q of authored){assert.deepEqual(validateQuestion(q),[],q.id);assert(gradeAnswer(q,q.answers[0]));if(q.options)for(const o of q.options)assert.equal(gradeAnswer(q,o),q.answers.includes(o));}
});
test('full original corpus generates valid questions across all 14 formats',()=>{
  const base=buildQuestions(records,authored,{random:()=>.3});
  const questions=[...base.questions,...records.flatMap(sentenceQuestions)];
  for(const q of questions)assert.deepEqual(validateQuestion(q),[],q.id);
  assert.deepEqual(new Set(questions.map(q=>q.format)),new Set(Object.keys(FORMATS)));
  assert.equal(new Set(questions.map(q=>q.id)).size,questions.length);
});
test('rejects duplicate choices, missing correct option, unreviewed relations and images',()=>{
  const q=authored[0];assert(validateQuestion({...q,options:['本','本']}).includes('duplicate-or-insufficient-options'));
  assert(validateQuestion({...q,options:['靴','時計']}).includes('ambiguous-options'));
  assert(validateQuestion({...authored.find(q=>q.format==='synonym'),evidence:{source:'x',rationale:'x'}}).includes('review-required'));
  assert(validateQuestion({...authored.find(q=>q.format==='image'),evidence:{source:'x',rationale:'x'}}).includes('unverified-image'));
  assert(validateQuestion({...q,options:['本','volume'],forbiddenDistractors:['volume']}).includes('related-distractor'));
});
test('cloze requires one exact headword occurrence and translated source',()=>{
  const w={senseId:'s',wordId:'w',headword:'cat',examples:[{id:'e',en:'A cat met another cat.',ja:'猫同士が会った'}]};
  assert.equal(sentenceQuestions(w).length,0);
  w.examples=[{id:'e',en:'The cat is asleep.',ja:'その猫は眠っている。'}];
  const qs=sentenceQuestions(w);assert.equal(qs.length,2);assert.equal(qs[0].answers[0],'cat');assert.deepEqual(qs[1].tokens,['The','cat','is','asleep.']);
});
test('attempt contract records assistance, timing, sense and mode without memory writes',()=>{
  const q=authored[0], event=createAttempt(q,{answer:' 本 ',startedAt:100,answeredAt:1800,hintCount:1,audioPlays:2,attemptId:'a'});
  assert.equal(event.responseMs,1700);assert.equal(event.correct,true);assert.equal(event.hintCount,1);assert.equal(event.format,'en-ja');assert.equal(event.senseId,q.senseId);
  assert.throws(()=>createAttempt(q,{answer:'本',startedAt:200,answeredAt:100}));
  assert.throws(()=>createAttempt(q,{answer:'本',startedAt:100,hintCount:-1}));
});
test('round robin interleaves senses while rotating formats; respects memory selection',()=>{
  const qs=[{senseId:'a',format:'spelling'},{senseId:'a',format:'listening'},{senseId:'b',format:'spelling'}];
  assert.deepEqual(planSession(qs,{senseIds:['a','b'],limit:3}).map(q=>q.senseId),['a','b','a']);
  assert.equal(planSession(qs,{senseIds:[],limit:20}).length,0);
  assert.equal(planSession(qs,{senseIds:['b'],limit:20}).length,1);
});
test('audio is optional and adapters preserve sense identity',()=>{
  const r=records[0],w=adaptVocabulary(r);assert.equal(w.id,r.senseId);assert.equal(w.wordId,r.wordId);
  assert(!buildQuestions([r],[],{audioAvailable:false}).questions.some(q=>q.format==='listening'));
  assert.deepEqual(shuffle(['a','a','b'],()=>0).sort(),['a','a','b']);
});
test('normalization tolerates case and spacing without accepting misspelling',()=>{
  const q=authored.find(q=>q.format==='derivation');assert(gradeAnswer(q,' DECISION '));assert(!gradeAnswer(q,'decison'));
});

test('mixed session revisits selected senses with different skills',()=>{
  const bank=buildQuestions(records,authored,{random:()=>.5});
  const session=planSession(bank.questions,{limit:20,maxSenses:5,random:()=>.5});
  assert.equal(new Set(session.map(q=>q.senseId)).size,5);
  assert(new Set(session.map(q=>q.format)).size>=3);
  assert(session.length>=15);
});
