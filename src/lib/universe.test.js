import test from 'node:test';
import assert from 'node:assert/strict';
import {getRelations,orbitNodes,orbitPageCount,lookupUniverse,universeCoverage,relationTier,universeEntries,usageFor} from './universe.js';
test('uses tagged links instead of distractors; deduplicates and excludes center',()=>{
 const links=getRelations({word:'unknown',choices:['wrong'],relatedWords:[{word:'unknown'},{word:'reply',type:'synonym',tier:'core'},{word:'REPLY'}],synonyms:['answer']});
 assert.deepEqual(links.map(x=>x.word),['reply','answer']);
 assert.equal(links[1].tier,'related');
});
test('missing data is honest; authored core is closer',()=>{
 assert.deepEqual(getRelations({word:'xyz'}),[]);
 const nodes=orbitNodes(getRelations({word:'distribute'}));
 const radius=x=>Math.hypot(x.x-50,x.y-50);
 assert.ok(radius(nodes.find(x=>x.tier==='core'))<radius(nodes.find(x=>x.tier==='extended')));
 assert.ok(nodes.every(x=>x.x>=0&&x.x<=100&&x.y>=0&&x.y<=100));
});

test('stage one seeds cover vocabulary, reciprocal links have provenance',()=>{
 assert.deepEqual(universeCoverage(),{heads:1282,links:4989});
 assert.equal(lookupUniverse('  TRANSLATE ').meaning,'翻訳する');
 assert.ok(lookupUniverse('constellation').relatedWords.some(x=>x.word==='Orion'));
 assert.ok(lookupUniverse('remarkably').relatedWords.some(x=>x.word==='extraordinarily'));
 assert.ok(getRelations({word:'translation'}).some(x=>x.word==='translate'&&x.reverse));
 assert.ok(!getRelations({word:'translate into English'}).some(x=>x.word==='translate'));
 assert.ok(!getRelations({word:'translation'},{includeReverse:false}).some(x=>x.word==='translate'));
});
test('rare usage moves equally strong relations outward; unknown stays unpenalized',()=>{
 assert.equal(relationTier({strength:.85,usageBand:'common'}),'core');
 assert.equal(relationTier({strength:.85,usageBand:'rare'}),'related');
 assert.equal(relationTier({strength:.85}),'core');
});
test('paged orbits never discard links',()=>{
 const links=Array.from({length:13},(_,i)=>({word:'word'+i,tier:i<9?'core':'extended'}));
 const all=Array.from({length:orbitPageCount(links)},(_,i)=>orbitNodes(links,i)).flat();
 assert.equal(all.length,links.length);
 assert.equal(new Set(all.map(x=>x.word)).size,links.length);
 assert.ok(all.every(x=>x.x>=10-1e-8&&x.x<=90+1e-8&&x.y>=10-1e-8&&x.y<=90+1e-8));
});

test('bulk catalog is valid and connects cross-level authored heads',()=>{
 const heads=universeEntries();
 const keys=new Set(heads.map(x=>x.word));
 assert.equal(keys.size,heads.length);
 let cross=0;
 for(const head of heads){
  assert.ok(head.meaning);
  const seen=new Set();
  for(const rel of head.relatedWords){
   const key=rel.word.trim().toLowerCase();
   assert.ok(rel.meaning && !seen.has(key) && key!==head.word);
   seen.add(key);if(keys.has(key))cross++;
  }
 }
 assert.ok(cross>=200);
 assert.ok(getRelations(lookupUniverse('borrow')).some(x=>x.word==='lend'&&x.note));
 assert.ok(usageFor('call off','put off').example);
 assert.ok(getRelations({word:'library'}).some(x=>x.word==='bookstore'&&x.reverse));
});

test('master maps link verbs, adjectives, nouns and phrasal verbs',()=>{
 for(const w of ['recommence','galvanize','scrutinize','salubrious','empirical','neonate','dearth','phase out','grapple with']){
  const entry=lookupUniverse(w);assert.ok(entry&&entry.relatedWords.length>=3);
 }
 assert.ok(getRelations(lookupUniverse('peruse')).some(x=>x.word==='pore over'&&x.note));
 assert.ok(getRelations(lookupUniverse('reimburse')).some(x=>x.word==='reimbursement'));
 assert.ok(getRelations(lookupUniverse('phase out')).some(x=>x.word==='abolish'&&x.example));
 assert.ok(getRelations(lookupUniverse('stave off')).some(x=>x.word==='fend off'&&x.note));
});

test('eradicate is a full center with tiered learning links',()=>{
 const links=getRelations(lookupUniverse('eradicate'));
 assert.ok(links.some(x=>x.word==='eradication'&&x.type==='family'&&x.tier==='core'));
 assert.ok(links.some(x=>x.word==='extirpate'&&x.tier==='extended'));
});

test('school maps connect learning vocabulary across levels',()=>{
 for(const w of ['reduce','evidence','examine','health','creative','laboratory','construct','approximately'])assert.ok(lookupUniverse(w).relatedWords.length>=4);
 assert.ok(getRelations(lookupUniverse('examine')).some(x=>x.word==='scrutinize'&&x.tier==='extended'&&x.note));
 assert.ok(getRelations(lookupUniverse('arrive')).some(x=>x.word==='reach'&&x.example));
 assert.ok(getRelations(lookupUniverse('demand')).some(x=>x.word==='supply'&&x.type==='contrast'));
 assert.ok(getRelations(lookupUniverse('pollution')).some(x=>x.word==='pollutant'&&x.type==='family'));
});

test('school examples retain contextual meanings for inflections and phrases',()=>{
 assert.equal(lookupUniverse('left').meaning,'出発した');
 assert.ok(getRelations(lookupUniverse('left')).some(x=>x.word==='leave'&&x.type==='family'));
 assert.ok(getRelations(lookupUniverse('account')).some(x=>x.word==='account for'&&x.type==='collocation'));
 assert.ok(getRelations(lookupUniverse('across')).some(x=>x.word==='get across'));
 assert.ok(getRelations(lookupUniverse('obliged')).some(x=>x.word==='obligation'&&x.type==='family'));
});

test('late reading and foundational maps link basic to advanced vocabulary',()=>{
 for(const w of ['confuse','maintain','ecosystem','gravity','automate','bilingual','dictionary','climb'])assert.ok(lookupUniverse(w).relatedWords.length>=4);
 assert.ok(getRelations(lookupUniverse('confuse')).some(x=>x.word==='perplex'&&x.tier==='extended'&&x.note));
 assert.ok(getRelations(lookupUniverse('empathy')).some(x=>x.word==='sympathy'&&x.note));
 assert.ok(getRelations(lookupUniverse('reusable')).some(x=>x.word==='recyclable'&&x.example));
});
