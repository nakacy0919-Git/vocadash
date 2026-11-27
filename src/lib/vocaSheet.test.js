import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {bookWords,bookFilter,bookPage,bookPosition,bookEntry,bookPos} from './vocaSheet.js';
test('book includes every active headword and every sense, with stable serials and matching examples',()=>{
 const root=new URL('../../data/vocabulary-drafts/',import.meta.url),m=JSON.parse(readFileSync(new URL('manifest.json',root),'utf8'));
 const rows=m.batchFiles.flatMap(p=>JSON.parse(readFileSync(new URL(p,root),'utf8')).records);
 const words=bookWords(rows);assert.equal(words.length,m.totals.distinctHeadwords);assert.equal(words.reduce((n,w)=>n+w.senses.length,0),m.totals.senses);
 assert.equal(words.reduce((n,w)=>n+w.senses.reduce((a,s)=>a+(s.examples?.length||0),0),0),m.totals.examples);
 assert.equal(words[0].number,1);assert.equal(words.at(-1).number,words.length);
 for(const size of [4,6]){const pages=bookPage(words,0,size).pages;assert.deepEqual(Array.from({length:pages},(_,i)=>bookPage(words,i,size).items).flat().map(w=>w.id),words.map(w=>w.id));assert.equal(bookPosition(words,words.length,size),pages-1);}
 const multi=words.find(w=>w.senses.length>1);assert.ok(multi);const s=bookEntry(multi,1);assert.equal(s.id,'quiz:'+multi.senses[1].senseId);assert.equal(s.bookNumber,multi.number);assert.equal(s.english,multi.senses[1].examples[0].en);
 for(const l of ['A1','A2','B1','B2','C1','C2'])assert.ok(bookFilter(words,l).length>0);
 assert.equal(bookPos('verb').icon,'V');assert.equal(bookPos('noun').icon,'N');assert.equal(bookPos('adjective').icon,'A');assert.equal(bookPos('').icon,'—');
});

import {bookOrigin,mergeLexical} from './vocaSheet.js';
test('CEFR and POS filter the same sense and preserve serials while ordering',()=>{
 const words=bookWords([{wordId:'1',senseId:'1a',headword:'zeta',meaningJa:'名',partOfSpeech:'noun',cefrHeadword:'A1'},{wordId:'1',senseId:'1b',headword:'zeta',meaningJa:'動',partOfSpeech:'verb',cefrHeadword:'B1'},{wordId:'2',senseId:'2a',headword:'alpha',meaningJa:'形',partOfSpeech:'adjective',cefrHeadword:'A1'}]);
 assert.equal(bookFilter(words,'A1','','verb').length,0);
 const result=bookFilter(words,'B1','','verb');assert.equal(result.length,1);assert.equal(bookEntry(result[0]).partOfSpeech,'verb');assert.equal(result[0].number,1);
 assert.deepEqual(bookFilter(words,'all','','all','alpha').map(w=>w.number),[2,1]);
 assert.equal(bookFilter(words,'all','','adjective')[0].number,2);
 assert.equal(bookOrigin({word:'unknown',sense:{}}),null);assert.ok(bookOrigin({word:'achieve'}).url);
 assert.deepEqual(mergeLexical('attain; reach',[{en:'attain',ja:'達成する'}]),[{word:'attain',meaning:'達成する'},{word:'reach',meaning:''}]);
});
