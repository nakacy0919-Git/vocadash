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

import {pocketPageSize,remapBookPage} from './vocaSheet.js';
test('pocket pagination preserves all words and restores the same reading position across layouts',()=>{const rows=Array.from({length:8653},(_,i)=>({number:i+1}));for(const size of [1,3]){const pages=bookPage(rows,0,size).pages;assert.deepEqual(Array.from({length:pages},(_,i)=>bookPage(rows,i,size).items).flat(),rows);assert.equal(bookPosition(rows,8653,size),pages-1);}assert.equal(pocketPageSize(undefined),1);assert.equal(pocketPageSize(3),3);assert.equal(remapBookPage(5,6,1),30);assert.equal(remapBookPage(31,1,3),10);assert.equal(remapBookPage(10,3,6),5);});

test('registered themes combine with CEFR and POS without renumbering or inventing matches',()=>{
 const words=bookWords([{wordId:'1',senseId:'a',headword:'forest',meaningJa:'森林',partOfSpeech:'noun',cefrHeadword:'A1'},{wordId:'1',senseId:'b',headword:'forest',meaningJa:'植林する',partOfSpeech:'verb',cefrHeadword:'B2'},{wordId:'2',senseId:'c',headword:'algorithm',meaningJa:'アルゴリズム',partOfSpeech:'noun',cefrHeadword:'B2'},{wordId:'3',senseId:'d',headword:'xyz',meaningJa:'未分類',partOfSpeech:'noun',cefrHeadword:'A1'}]);
 assert.deepEqual(bookFilter(words,'A1','','noun','number','e').map(w=>w.number),[1]);
 assert.equal(bookFilter(words,'B2','','verb','number','e').length,0);
 assert.deepEqual(bookFilter(words,'B2','','all','number','t').map(w=>w.number),[2]);
 assert.equal(bookFilter(words).length,3);
});

import {ELEMENTARY_WORDS,ELEMENTARY_SOURCE} from '../data/vocasheet-elementary.js';
test('school-stage filters combine with level and POS while preserving global IDs and numbering',()=>{
 const words=bookWords([{wordId:'1',senseId:'a',headword:'apple',meaningJa:'りんご',partOfSpeech:'noun',cefrHeadword:'A1'},{wordId:'2',senseId:'b',headword:'algorithm',meaningJa:'アルゴリズム',partOfSpeech:'noun',cefrHeadword:'B2'},{wordId:'3',senseId:'c',headword:'unlisted-example',meaningJa:'例',partOfSpeech:'verb',cefrHeadword:'A2'},{wordId:'4',senseId:'d',headword:'unlisted-advanced',meaningJa:'例',partOfSpeech:'noun',cefrHeadword:'C2'}]);
 assert.ok(Object.hasOwn(ELEMENTARY_WORDS,'apple'));assert.ok(ELEMENTARY_SOURCE.sourceRows>=Object.keys(ELEMENTARY_WORDS).length);
 assert.deepEqual(bookFilter(words,'all','','all','number','all','elementary').map(w=>w.number),[1]);
 assert.deepEqual(bookFilter(words,'all','','all','number','all','middle').map(w=>w.number),[1,3]);
 assert.deepEqual(bookFilter(words,'B2','','noun','number','t','high').map(w=>w.number),[2]);
 assert.equal(bookFilter(words,'all','','verb','number','all','elementary').length,0);
 assert.equal(bookFilter(words).length,4);
});
test('school-stage counts are backed by the active vocabulary corpus',()=>{
 const root=new URL('../../data/vocabulary-drafts/',import.meta.url),m=JSON.parse(readFileSync(new URL('manifest.json',root),'utf8'));
 const words=bookWords(m.batchFiles.flatMap(p=>JSON.parse(readFileSync(new URL(p,root),'utf8')).records));
 const counts=Object.fromEntries(['elementary','middle','high'].map(id=>[id,bookFilter(words,'all','','all','number','all',id).length]));
 assert.ok(counts.elementary>100);assert.ok(counts.middle>counts.elementary);assert.ok(counts.high>counts.elementary);
 console.log('VocaSheet school counts: '+JSON.stringify(counts)+'; elementary source distinct: '+Object.keys(ELEMENTARY_WORDS).length);
});
