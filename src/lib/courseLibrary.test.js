import test from 'node:test';import assert from 'node:assert/strict';import {libraryPage,posLabel,examplesFor,feedbackDelay} from './courseLibrary.js';
test('pagination preserves the entire corpus and clamps page bounds',()=>{const words=Array.from({length:8653},(_,i)=>({id:i}));const pages=libraryPage(words).pages;const all=Array.from({length:pages},(_,i)=>libraryPage(words,i).items).flat();assert.deepEqual(all,words);assert.equal(libraryPage(words,99999).page,pages-1);assert.equal(libraryPage([],4).page,0);assert.equal(libraryPage(words).items.length,12);});
test('word profiles preserve original examples and truthful unknown parts of speech',()=>{assert.equal(posLabel('verb'),'動詞');assert.equal(posLabel(''),'品詞未登録');assert.deepEqual(examplesFor({examples:[{en:'Test.',ja:'テスト。'},{en:'Try.',ja:'試す。'}]}).map(x=>x.en),['Test.','Try.']);assert.deepEqual(examplesFor({english:'Test.',japanese:'テスト。'}),[{en:'Test.',ja:'テスト。'}]);assert.equal(feedbackDelay({english:'Test.'}),2600);assert.equal(feedbackDelay({}),850);});

import {wordProgress,courseProgress,formatAnswerTime} from './courseLibrary.js';
import {reviewMemory} from './memoryEngine.js';
test('card progress uses measured successful recall and does not invent timing',()=>{
 const at=1700000000000;
 const first=reviewMemory(undefined,3,'cloze',at,{responseMs:4100});
 const second=reviewMemory(first,1,'cloze',at+1000,{responseMs:900});
 const third=reviewMemory(second,3,'cloze',at+2000,{responseMs:2500});
 const row=wordProgress({memory:third},at+2000);
 assert.equal(row.correctMs,2500);assert.equal(row.bestMs,2500);assert.equal(row.attempts,3);assert.ok(row.percent<80);
 assert.equal(wordProgress({seen:2},at).status,'計測前');assert.equal(wordProgress({},at).correctMs,null);
 assert.equal(formatAnswerTime(null),'—');assert.equal(formatAnswerTime(2500),'2.5秒');
 const summary=courseProgress([{id:'a'},{id:'b'}],{a:{memory:third}},at+2000);
 assert.equal(summary.learned,1);assert.equal(summary.coverage,50);assert.equal(summary.averageCorrectMs,2500);assert.equal(summary.timedWords,1);assert.equal(summary.average,Math.round(row.percent/2));
});
