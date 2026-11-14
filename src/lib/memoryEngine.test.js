import test from 'node:test';
import assert from 'node:assert/strict';
import {recall,mastery,reviewMemory,memoryQueue,buildQuestion,enqueueRetry,normalizeAnswer} from './memoryEngine.js';
const DAY=86400000, start=1700000000000;
test('FSRS curve anchors at 90 percent and declines',()=>{const m=reviewMemory(null,3,'typing',start);assert.ok(Math.abs(recall(m,start+m.stability*DAY)-.9)<1e-9);assert.ok(recall(m,start+30*DAY)<recall(m,start+DAY));});
test('same-day repetition cannot master; delayed recall grows stability',()=>{let m=reviewMemory(null,3,'typing',start);for(let i=1;i<=20;i++)m=reviewMemory(m,3,'cloze',start+i*1000);assert.equal(m.spacedSuccesses,0);assert.ok(mastery(m,m.lastAt)<=49);const next=reviewMemory(m,3,'typing',m.lastAt+3*DAY);assert.ok(next.stability>m.stability);assert.equal(next.spacedSuccesses,1);});
test('incorrect answer reduces stability and schedules 10 minute review',()=>{const m=reviewMemory(null,3,'typing',start),next=reviewMemory(m,1,'cloze',start+DAY);assert.ok(next.stability<m.stability);assert.equal(next.dueAt,next.lastAt+600000);assert.equal(next.spacedSuccesses,0);});
const words=[{id:'a',word:'apple',meaning:'りんご',prompt:'I ate an ________.',choices:['apple','pear','peach','orange'],correctIndex:0},{id:'b',word:'pear',meaning:'梨'},{id:'c',word:'peach',meaning:'桃'},{id:'d',word:'orange',meaning:'オレンジ'}];
test('due before new, future reviews excluded',()=>{const m=reviewMemory(null,1,'typing',start),records={a:{memory:m}};assert.equal(memoryQueue(words,records,start,9).length,3);assert.equal(memoryQueue(words,records,m.dueAt,1)[0].id,'a')});
test('valid authored cloze, distinct meaning choices and normalized typing',()=>{assert.equal(buildQuestion(words[0],words,0).options.length,4);assert.equal(buildQuestion(words[0],words,2).kind,'cloze');assert.equal(normalizeAnswer(' ＡPPLE '),'apple');assert.notEqual(buildQuestion({...words[0],prompt:'no blank'},words,2).kind,'cloze')});
test('retry is bounded and placed later',()=>{const q=words.map(word=>({word,retry:0}));assert.equal(enqueueRetry(q,0,q[0])[4].retry,1);assert.equal(enqueueRetry(q,0,{...q[0],retry:2}),q);});

test('first wrong answer cannot increase mastery; later lapse lowers displayed mastery',()=>{const wrong=reviewMemory(null,1,'typing',start);assert.equal(mastery(wrong,start),0);const good=reviewMemory(null,3,'typing',start);const lapse=reviewMemory(good,1,'typing',start+DAY);assert.ok(mastery(lapse,lapse.lastAt)<mastery(good,lapse.lastAt));});

import {readFileSync} from 'node:fs';
import {intervalDays,gradeAnswer,dailyPlan,weakWords,isMastered} from './memoryEngine.js';
test('FSRS-6 states match 256 independent ts-fsrs fixtures',()=>{
 const fixture=JSON.parse(readFileSync(new URL('./fixtures/fsrs6-reference.json',import.meta.url)));
 for(const {state,elapsed,grade,expected} of fixture.cases){
  const old=state?{...state,lastAt:start,attempts:1,correct:1,spacedSuccesses:0}:null;
  const actual=reviewMemory(old,grade,'typing',start+elapsed*DAY);
  for(const key of ['stability','difficulty'])assert.ok(Math.abs(actual[key]-expected[key])<Math.max(1e-6,expected[key]*1e-6),JSON.stringify({state,elapsed,grade,key,actual:actual[key],expected:expected[key]}));
 }
});
test('inverse curve and retention targets',()=>{
 for(const s of [.01,1,30,365])for(const r of [.8,.9,.97])assert.ok(Math.abs(recall({stability:s,lastAt:start},start+intervalDays(s,r)*DAY)-r)<1e-7);
 assert.ok(intervalDays(30,.97)<intervalDays(30,.9));
 assert.throws(()=>intervalDays(30,1));
});
test('grading respects correctness, hints, self-report and format time',()=>{
 assert.equal(gradeAnswer({correct:false,hintUsed:true,responseMs:1}),1);
 assert.equal(gradeAnswer({correct:true,hintUsed:true}),2);
 assert.equal(gradeAnswer({correct:true,selfReported:true}),2);
 assert.equal(gradeAnswer({correct:true,responseMs:20000,kind:'meaning'}),2);
 assert.equal(gradeAnswer({correct:true,responseMs:20000,kind:'typing'}),3);
 assert.equal(gradeAnswer({correct:true,responseMs:null}),3);
});
test('migration preserves old skills, records evidence and bounds history',()=>{
 let m=reviewMemory(null,3,'typing',start);delete m.history;delete m.skillStats;
 m=reviewMemory(m,2,'meaning',start+DAY,{responseMs:15000,hintUsed:true});
 assert.equal(m.skills.typing,1);assert.equal(m.skillStats.meaning.unaided,0);assert.equal(m.history[0].hintUsed,true);
 assert.equal(m.history[0].responseMs,15000);assert.ok(m.dueAt>=m.lastAt+DAY);
 for(let i=0;i<220;i++)m=reviewMemory(m,3,'typing',m.lastAt+1000);
 assert.equal(m.history.length,200);assert.equal(m.skillStats.typing.attempts,220);
 assert.throws(()=>reviewMemory(m,3,'typing',NaN));
});
test('daily budget prioritizes lapses, defers new words under backlog',()=>{
 const good={...reviewMemory(null,3,'typing',start),dueAt:start};
 const bad={...reviewMemory(null,1,'meaning',start),dueAt:start};
 const records={a:{memory:good},b:{memory:bad}};
 const plan=dailyPlan([...words,words[0]],records,start,{minutes:.5});
 assert.deepEqual(plan.words.map(w=>w.id),['b']);assert.equal(plan.newWords,0);assert.equal(plan.backlog,1);
 assert.equal(weakWords(words,records,start)[0].word.id,'b');
});
test('mastery requires spaced retrieval and productive success; forgetting revokes it',()=>{
 let m=reviewMemory(null,3,'typing',start);
 for(let i=0;i<8;i++)m=reviewMemory(m,3,'typing',m.dueAt);
 assert.equal(isMastered(m,m.lastAt),true);
 assert.equal(isMastered({...m,skillStats:{}},m.lastAt),false);
 assert.equal(isMastered(m,m.lastAt+100000*DAY),false);
 assert.equal(isMastered(reviewMemory(m,1,'typing',m.dueAt),m.dueAt),false);
});
test('adaptive questions target weak formats without eliminating rotation',()=>{
 const memory={skillStats:{meaning:{attempts:5,unaided:5,lastAt:10},typing:{attempts:5,unaided:0,lastAt:10},cloze:{attempts:5,unaided:5,lastAt:10},listening:{attempts:5,unaided:5,lastAt:10}}};
 assert.equal(buildQuestion(words[0],words,1,()=>.5,memory).kind,'typing');
 assert.equal(buildQuestion(words[0],words,3,()=>.5,memory).kind,'listening');
});
test('daily new allowance survives sessions and resets on next local date',()=>{
 const m=reviewMemory(null,3,'typing',start);
 const records={a:{memory:{...m,dueAt:start+10*DAY}}};
 assert.equal(dailyPlan(words,records,start,{newLimit:1}).newWords,0);
 assert.equal(dailyPlan(words,records,start+DAY,{newLimit:1}).newWords,1);
 assert.equal(dailyPlan(words,records,start,{newLimit:1}).introducedToday,1);
});
test('hard same-day success never decreases stability and repeated hint does not earn mastery',()=>{
 let m=reviewMemory(null,3,'typing',start);
 const before=m.stability;
 for(let i=1;i<=10;i++)m=reviewMemory(m,2,'typing',start+i*60000,{hintUsed:true});
 assert.ok(m.stability>=before);assert.equal(isMastered(m,m.lastAt),false);assert.equal(m.skillStats.typing.unaided,1);
});

test('Memory Mission English and listening tasks offer four distinct choices; recognition alone is not production',()=>{for(let i=0;i<8;i++){const q=buildQuestion(words[0],words,i,()=>.4);assert.equal(q.options.length,4);assert.equal(new Set(q.options.map(normalizeAnswer)).size,4);assert.equal(q.options.filter(x=>normalizeAnswer(x)===normalizeAnswer(q.answer)).length,1);}});
