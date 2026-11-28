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

import {wordForms,formCounts} from './wordForms.js';
import {schoolLevel} from './schoolVocabulary.js';
test('school filters and independently curated forms preserve base IDs',()=>{const w=bookWords([{wordId:'1',senseId:'v',headword:'go',meaningJa:'行く',partOfSpeech:'verb',cefrHeadword:'A1'},{wordId:'2',senseId:'a',headword:'good',meaningJa:'良い',partOfSpeech:'adjective',cefrHeadword:'A1'},{wordId:'3',senseId:'b',headword:'obtain',meaningJa:'得る',partOfSpeech:'verb',cefrHeadword:'B2'}]);assert.equal(bookFilter(w,'all','went')[0].id,'1');assert.equal(bookFilter(w,'all','better')[0].id,'2');assert.equal(bookFilter(w,'all','','all','number','elementary').length,2);assert.equal(bookFilter(w,'all','','all','number','senior').length,1);assert.equal(wordForms('go','verb')[2][1],'went');assert.equal(wordForms('good','noun').length,0);assert.ok(formCounts().verbs>=100);assert.equal(schoolLevel({headword:'unknown',cefrHeadword:'C1'}),'advanced');});

import {formProfile,formMatches} from './wordForms.js';
test('full morphology respects lexical attestation, ambiguous senses, and non-inflecting words',()=>{assert.equal(formProfile('admit','verb').forms.find(x=>x[0]==='過去形')[1],'admitted');assert.equal(formProfile('lie','verb',{meaningJa:'うそをつく'}).forms[2][1],'lied');assert.equal(formProfile('lie','verb',{meaningJa:'横たわる'}).forms[2][1],'lay');assert.equal(formProfile('mouse','noun').forms[1][1],'mice');assert.equal(formProfile('information','noun').status,'conditional');assert.ok(!formProfile('information','noun').forms.some(x=>x[1]==='informations'));assert.equal(formProfile('beautiful','adjective').forms[1][1],'more beautiful');assert.equal(formProfile('quickly','adverb').forms[1][1],'more quickly');assert.equal(formProfile('she','pronoun').forms[1][1],'her');assert.equal(formProfile('can','modal').forms.length,2);assert.equal(formProfile('because','conjunction').status,'invariant');assert.equal(formProfile('nonsensezz','verb').status,'review');assert.equal(formMatches('good','adjective','better'),true);assert.equal(formMatches('nonsensezz','adjective','more nonsensezz'),false);});
test('every active sense has a morphology status, a source, and nonempty valid display rows',()=>{const root=new URL('../../data/vocabulary-drafts/',import.meta.url),m=JSON.parse(readFileSync(new URL('manifest.json',root),'utf8'));const rows=m.batchFiles.flatMap(p=>JSON.parse(readFileSync(new URL(p,root),'utf8')).records);let n=0;for(const r of rows){const x=formProfile(r.headword,r.partOfSpeech,r);assert.ok(x.status&&x.source&&x.forms.length,r.senseId);for(const [label,form] of x.forms){assert.ok(label&&form,r.senseId);assert.equal(typeof form,'string');}n++;}assert.equal(n,m.totals.senses);});
