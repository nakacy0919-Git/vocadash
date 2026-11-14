import test from 'node:test';
import assert from 'node:assert/strict';
import {applyMemoryAttempt,memorySnapshot,quizMemoryAttempt,universeMemoryAttempt} from './memoryBridge.js';
test('quiz attempts retain sense identity and are counted once',()=>{
 const empty={records:{}},base={senseId:'a',word:'bank',meaning:'銀行',format:'meaning',correct:true,responseMs:900,hintCount:0,answeredAt:100000,attemptId:'x'};
 const a=applyMemoryAttempt(empty,quizMemoryAttempt(base));
 assert.equal(applyMemoryAttempt(a,quizMemoryAttempt(base)),a);
 const b=applyMemoryAttempt(a,quizMemoryAttempt({...base,senseId:'b',meaning:'岸',attemptId:'y',correct:false}));
 const s=memorySnapshot(b.records,[],100000);
 assert.equal(s['quiz:a'].word,'bank');assert.equal(s['quiz:a'].weak,false);
 assert.equal(s['quiz:b'].weak,true);assert.equal(Object.keys(s).length,2);
});
test('Universe reviews use exact course identity when available and isolate unregistered words',()=>{
 const base={word:'Learn',kind:'synonym',correct:false,responseMs:5000,answeredAt:100000,attemptId:'u'};
 const a=applyMemoryAttempt({records:{}},universeMemoryAttempt({...base,wordId:'course:1:2'}));
 const b=applyMemoryAttempt(a,universeMemoryAttempt({...base,word:' Other ',attemptId:'v'}));
 const s=memorySnapshot(b.records,[],100000);
 assert.equal(s['course:1:2'].weak,true);assert.equal(s['universe:other'].attempts,1);
});
