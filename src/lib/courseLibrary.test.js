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

import {INITIAL_SHEET,boundSheet,moveSheet,sizeSheet,sheetClip,isRedField} from './redSheet.js';
test('red sheet stays inside page and supports partial and full coverage',()=>{
 assert.deepEqual(boundSheet({x:-2,y:5,w:.25,h:.5}),{x:0,y:.5,w:.25,h:.5});
 const m=moveSheet(INITIAL_SHEET,.1,-.05);assert.ok(Math.abs(m.x-.3)<1e-9);assert.ok(Math.abs(m.y-.07)<1e-9);
 assert.deepEqual(sizeSheet(m,'full'),{x:0,y:0,w:1,h:1});
 assert.equal(sheetClip({x:0,y:0,w:1,h:1}),'inset(0% 0% 0% 0%)');
 assert.equal(sheetClip({x:.25,y:.25,w:.5,h:.5}),'inset(25% 25% 25% 25%)');
});
test('red ink switches between languages and individual fields without changing words',()=>{
 assert.equal(isRedField('meaning',{},'w','word'),false);
 assert.equal(isRedField('meaning',{},'w','meaning'),true);
 assert.equal(isRedField('both',{},'w','word'),true);
 assert.equal(isRedField('word',{'w:word':false},'w','word'),false);
 assert.equal(isRedField('meaning',{'w:word':true},'w','word'),true);
 assert.equal(isRedField('meaning',{'w:word':true},'other','word'),false);
});

import {SHEET_THEMES,resizeFilm,paperFilmClip,targetParts} from './redSheet.js';
test('colored sheets are independently configurable and film can cross paper boundaries',()=>{
 assert.equal(Object.keys(SHEET_THEMES).length,7);
 const resized=resizeFilm({x:.2,y:.3,w:.3,h:.4},1,1);for(const [key,value] of Object.entries({x:.2,y:.3,w:.8,h:.7}))assert.ok(Math.abs(resized[key]-value)<1e-9);
 const view={width:1000,height:800},paper={left:200,top:200,width:600,height:400};
 assert.equal(paperFilmClip({x:0,y:0,w:.1,h:.1},view,paper),'inset(0 100% 100% 0)');
 assert.equal(paperFilmClip({x:.2,y:.25,w:.6,h:.5},view,paper),'inset(0% 0% 0% 0%)');
 assert.equal(paperFilmClip({x:.35,y:.375,w:.3,h:.25},view,paper),'inset(25% 25% 25% 25%)');
});
test('example concealment preserves source text and selects complete target forms only',()=>{
 const sentence='She recommenced work. The recommencement was welcome.';
 const p=targetParts(sentence,'recommence');
 assert.equal(p.map(x=>x.text).join(''),sentence);assert.deepEqual(p.filter(x=>x.target).map(x=>x.text),['recommenced']);
 assert.deepEqual(targetParts('He took off his coat.','take off').filter(x=>x.target).map(x=>x.text),['took off']);
 assert.deepEqual(targetParts('The children went home.','child').filter(x=>x.target).map(x=>x.text),['children']);
 assert.equal(targetParts('An unrelated example.','run').some(x=>x.target),false);
});
