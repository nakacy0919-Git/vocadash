import test from 'node:test';
import assert from 'node:assert/strict';
import {getRelations,orbitNodes,orbitPageCount,lookupUniverse,universeCoverage,relationTier,universeEntries,usageFor,domainMegaCoverage,actionMegaCoverage,adjectiveMegaCoverage,unifiedReadingCoverage,everydayAbstractCoverage,collocationReadingCoverage,nuanceFamilyCoverage,thematicReadingCoverage,everydayPhrasesCoverage,concreteWorldCoverage,productiveVerbCoverage} from './universe.js';
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
 const added=domainMegaCoverage();
 assert.deepEqual(universeCoverage(),{heads:6842+added.heads+actionMegaCoverage().heads+adjectiveMegaCoverage().heads+unifiedReadingCoverage().heads+everydayAbstractCoverage().heads+collocationReadingCoverage().heads+nuanceFamilyCoverage().heads+thematicReadingCoverage().heads+everydayPhrasesCoverage().heads+concreteWorldCoverage().heads+productiveVerbCoverage().heads,links:26096+added.links+actionMegaCoverage().links+adjectiveMegaCoverage().links+unifiedReadingCoverage().links+everydayAbstractCoverage().links+collocationReadingCoverage().links+nuanceFamilyCoverage().links+thematicReadingCoverage().links+everydayPhrasesCoverage().links+concreteWorldCoverage().links+productiveVerbCoverage().links});
 assert.equal(lookupUniverse('  TRANSLATE ').meaning,'翻訳する');
 assert.ok(lookupUniverse('constellation').relatedWords.some(x=>x.word==='Orion'));
 assert.ok(lookupUniverse('remarkably').relatedWords.some(x=>x.word==='extraordinarily'));
 assert.ok(getRelations({word:'redistribute'}).some(x=>x.word==='distribute'&&x.reverse));
 assert.ok(getRelations({word:'translation'}).some(x=>x.word==='translate'&&!x.reverse));
 assert.ok(!getRelations({word:'translate into English'}).some(x=>x.word==='translate'));
 assert.ok(!getRelations({word:'redistribute'},{includeReverse:false}).some(x=>x.word==='distribute'));
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

test('foundation maps distinguish usage, word families and spelling variants',()=>{
 for(const w of ['grammar','confidence','conquer','diligent','democracy','defence','economic'])assert.ok(lookupUniverse(w).relatedWords.length>=3);
 assert.ok(getRelations(lookupUniverse('economic')).some(x=>x.word==='economical'&&x.note&&x.example));
 assert.ok(getRelations(lookupUniverse('despite')).some(x=>x.word==='in spite of'&&x.note));
 assert.ok(getRelations(lookupUniverse('defence')).some(x=>x.word==='defense'&&x.type==='synonym'));
 assert.ok(getRelations(lookupUniverse('diligent')).some(x=>x.word==='diligence'&&x.type==='family'));
});

test('E–F original vocabulary links and explanations',()=>{
 for(const w of ['endanger','essence','extinct','fascinate','fitness','fortnight'])assert.ok(lookupUniverse(w).relatedWords.length>=3);
 assert.ok(getRelations(lookupUniverse('extinct')).some(x=>x.word==='endangered'&&x.note));
 assert.ok(getRelations(lookupUniverse('flavor')).some(x=>x.word==='flavour'));
});

test('G–K original vocabulary links and contextual comparisons',()=>{
 for(const w of ['genetics','gratitude','historic','humid','immigrate','intensive','kitten'])assert.ok(lookupUniverse(w).relatedWords.length>=3);
 assert.ok(getRelations(lookupUniverse('historic')).some(x=>x.word==='historical'&&x.note));
 assert.ok(getRelations(lookupUniverse('harbour')).some(x=>x.word==='harbor'&&x.type==='synonym'));
 assert.ok(getRelations(lookupUniverse('immigrate')).some(x=>x.word==='emigrate'&&x.note));
});

test('L–N original vocabulary links and contextual comparisons',()=>{
 for(const w of ['leadership','liberation','maintenance','memorise','motivate','negotiation','newcomer'])assert.ok(lookupUniverse(w).relatedWords.length>=3);
 assert.ok(getRelations(lookupUniverse('mislead')).some(x=>x.word==='deceive'&&x.note));
 assert.ok(getRelations(lookupUniverse('neighbourhood')).some(x=>x.word==='neighborhood'&&x.type==='synonym'));
 assert.ok(getRelations(lookupUniverse('nevertheless')).some(x=>x.word==='nonetheless'&&x.note));
});

test('N–S large vocabulary batch retains authored links and usage distinctions',()=>{
 for(const w of ['nutrient','ongoing','optional','participation','precision','revenue','stationary','systematic'])assert.ok(lookupUniverse(w).relatedWords.length>=3);
 assert.ok(getRelations(lookupUniverse('revenue')).some(x=>x.word==='profit'&&x.note&&x.example));
 assert.ok(getRelations(lookupUniverse('organisation')).some(x=>x.word==='organization'&&x.type==='synonym'));
 assert.ok(getRelations(lookupUniverse('sympathy')).some(x=>x.word==='empathy'&&x.note));
});

test('supplemental O–Z maps and original usage comparisons',()=>{
 for(const w of ["oath","pamphlet","random","salary","translator","upstairs","vocabulary","wooden","zucchini"])assert.ok(lookupUniverse(w).relatedWords.length>=3);
 assert.ok(getRelations(lookupUniverse("oath")).some(x=>x.word==="pledge"&&x.note&&x.example));
 assert.ok(getRelations(lookupUniverse("odds")).some(x=>x.word==="probability"&&x.note&&x.example));
 assert.ok(getRelations(lookupUniverse("overlook")).some(x=>x.word==="neglect"&&x.note&&x.example));
 assert.ok(getRelations(lookupUniverse("pamphlet")).some(x=>x.word==="brochure"&&x.note&&x.example));
 assert.ok(getRelations(lookupUniverse("partially")).some(x=>x.word==="partly"&&x.note&&x.example));
});

test('academic topics have contextual links, explicit contrasts and bridges to familiar words',()=>{
 for(const w of ['correlation','phonology','morbidity','deforestation','liquidity','photosynthesis','solvent','perseverance'])assert.ok(lookupUniverse(w).relatedWords.length>=3);
 assert.ok(getRelations(lookupUniverse('correlation')).some(x=>x.word==='causation'&&x.type==='related'&&x.note));
 assert.ok(getRelations(lookupUniverse('acute')).some(x=>x.word==='chronic'&&x.type==='contrast'&&x.note));
 assert.ok(getRelations(lookupUniverse('phonology')).some(x=>x.word==='pronunciation'));
 assert.ok(getRelations(lookupUniverse('pronunciation')).some(x=>x.word==='phonology'&&x.reverse));
});

test('general and school vocabulary expansion has contextual links, explicit distinctions and cross-level bridges',()=>{
 for(const w of ["mimic","retailer","laundromat","glacier","screenshot","numerator","vocational","syllabus","proofread","shadowing","facilitator"])assert.ok(lookupUniverse(w).relatedWords.length>=3);
 assert.ok(getRelations(lookupUniverse("inquiry")).some(x=>x.word==="enquiry"&&x.note&&x.example));
 assert.ok(getRelations(lookupUniverse("discernment")).some(x=>x.word==="judgment"&&x.note&&x.example));
 assert.ok(getRelations(lookupUniverse("minority")).some(x=>x.word==="majority"&&x.note&&x.example));
 assert.ok(getRelations(lookupUniverse("maximize")).some(x=>x.word==="minimize"&&x.note&&x.example));
 assert.ok(getRelations(lookupUniverse("syllabus")).some(x=>x.word==="curriculum"&&x.note&&x.example));
 assert.ok(getRelations(lookupUniverse("homophone")).some(x=>x.word==="homograph"&&x.note&&x.example));
 assert.ok(getRelations(lookupUniverse("dictation")).some(x=>x.word==="shadowing"&&x.note&&x.example));
 assert.ok(getRelations(lookupUniverse('mimic')).some(x=>x.word==='imitate'&&x.type==='synonym'));
});

test('foundation mega batch keeps contextual links and spelling variants',()=>{
 for(const w of ["applaud","appreciation","architect","ashamed","barely","bilingualism","brief","careless","abundant","accidental","acquaintance","aloud"])assert.ok(lookupUniverse(w).relatedWords.length>=3);
 assert.ok(getRelations(lookupUniverse("applaud")).some(x=>x.word==="applause"&&x.note&&x.example));
 assert.ok(getRelations(lookupUniverse("appreciation")).some(x=>x.word==="admiration"&&x.note&&x.example));
 assert.ok(getRelations(lookupUniverse("appoint")).some(x=>x.word==="nominate"&&x.note&&x.example));
 assert.ok(getRelations(lookupUniverse("architect")).some(x=>x.word==="architecture"&&x.note&&x.example));
 assert.ok(getRelations(lookupUniverse("ashamed")).some(x=>x.word==="shame"&&x.note&&x.example));
 assert.ok(getRelations(lookupUniverse("assist")).some(x=>x.word==="assistance"&&x.note&&x.example));
});

test('academic family maps preserve contextual links and usage explanations',()=>{
 for(const w of ["reveal","repeal","corroborate","systemic","homogeneous","intrinsic","stipulate"])assert.ok(lookupUniverse(w).relatedWords.length>=3);
 assert.ok(getRelations(lookupUniverse("reveal")).some(x=>x.word==="disclose"&&x.note&&x.example));
 assert.ok(getRelations(lookupUniverse("abolish")).some(x=>x.word==="repeal"&&x.note&&x.example));
 assert.ok(getRelations(lookupUniverse("contemplate")).some(x=>x.word==="ponder"&&x.note&&x.example));
 assert.ok(getRelations(lookupUniverse("pretext")).some(x=>x.word==="excuse"&&x.note&&x.example));
 assert.ok(getRelations(lookupUniverse("comprise")).some(x=>x.word==="consist of"&&x.note&&x.example));
 assert.ok(getRelations(lookupUniverse("demotion")).some(x=>x.word==="promotion"&&x.note&&x.example));
});

import domainMega from '../data/universe-domain-mega.js';
test('domain expansion preserves curated heads and contributes valid contextual maps',()=>{
 const counts=domainMegaCoverage();
 assert.equal(counts.candidates,744);
 assert.ok(counts.heads>0&&counts.heads<=counts.candidates);
 assert.equal(counts.links,counts.heads*4);
 for(const [word,e] of Object.entries(domainMega)){
  assert.ok(word&&e.meaning&&lookupUniverse(word));
  assert.equal(e.links.length,4);
  assert.equal(new Set(e.links.map(l=>l.word.toLowerCase())).size,4);
  assert.ok(e.links.every(l=>l.word&&l.meaning&&l.word.toLowerCase()!==word&&['related','collocation'].includes(l.type)));
 }
});

import actionMega from '../data/universe-advanced-action-mega.js';
test('advanced action clusters retain distinct related terms',()=>{
 const stats=actionMegaCoverage();
 assert.equal(stats.candidates,684);
 assert.equal(stats.links,5*stats.heads);
 for(const [word,e] of Object.entries(actionMega)){
  assert.ok(e.meaning&&lookupUniverse(word));
  assert.equal(e.links.length,5);
  assert.equal(new Set(e.links.map(l=>l.word)).size,5);
  assert.ok(e.links.every(l=>l.word!==word&&l.meaning&&l.type==='related'));
 }
});

import adjectiveMega from '../data/universe-adjective-mega.js';
test('descriptive clusters contain four distinct contextual relations',()=>{
 const stats=adjectiveMegaCoverage();
 assert.equal(stats.candidates,1079);
 assert.equal(stats.links,4*stats.heads);
 for(const [word,e] of Object.entries(adjectiveMega)){
  assert.ok(e.meaning&&lookupUniverse(word));
  assert.equal(e.links.length,4);
  assert.equal(new Set(e.links.map(l=>l.word)).size,4);
  assert.ok(e.links.every(l=>l.word!==word&&l.meaning&&l.type==='related'));
 }
});

import domainReadingMega from '../data/universe-domain-reading-mega.js';
import everydayAbstractMega from '../data/universe-everyday-abstract-mega.js';
test('unified reading and everyday networks retain complete candidate maps without overwriting senses',()=>{
 for(const [batch,stats,total] of [[domainReadingMega,unifiedReadingCoverage(),1218],[everydayAbstractMega,everydayAbstractCoverage(),725]]){
  assert.equal(Object.keys(batch).length,total);
  assert.equal(stats.candidates,total);
  assert.equal(stats.heads+stats.compatible+stats.skippedSense,total);
  assert.ok(stats.heads>0);
  assert.ok(stats.links>0);
  for(const [word,entry] of Object.entries(batch)){
   assert.ok(entry.meaning&&lookupUniverse(word)?.meaning);
   assert.ok(entry.links.length>=4);
   const normalized=entry.links.map(l=>l.word.trim().toLowerCase());
   assert.equal(new Set(normalized).size,normalized.length);
   assert.ok(entry.links.every(l=>l.meaning&&l.word.trim().toLowerCase()!==word.trim().toLowerCase()&&l.type==='related'));
  }
 }
});
test('new everyday clusters provide contextual rather than inferred synonym links',()=>{
 for(const [word,entry] of Object.entries(everydayAbstractMega)){
  assert.equal(entry.links.length,4);
  assert.ok(entry.links.every(l=>l.type==='related'&&l.tier==='related'));
 }
 assert.equal(everydayAbstractMega['read between the lines'].meaning,'行間を読む');
 assert.equal(everydayAbstractMega['pillowcase'].links.length,4);
});

import collocationReadingMega, {collocationReadingNotes} from '../data/universe-collocation-reading-mega.js';
test('entrance exam collocation maps contain complete, deduplicated usage groups',()=>{
 const stats=collocationReadingCoverage();
 assert.equal(stats.candidates,1254);
 assert.equal(stats.heads+stats.compatible+stats.skippedSense,stats.candidates);
 assert.ok(stats.heads>0&&stats.links>0);
 const entries=Object.entries(collocationReadingMega);
 assert.equal(entries.length,1254);
 assert.equal(entries.filter(([,e])=>e.links.every(l=>l.type==='collocation')).length,209);
 for(const [word,entry] of entries){
  assert.ok(entry.meaning&&lookupUniverse(word)?.meaning);
  assert.equal(entry.links.length,5);
  const normalized=entry.links.map(l=>l.word.trim().toLowerCase());
  assert.equal(new Set(normalized).size,5);
  assert.ok(entry.links.every(l=>l.meaning&&l.word!==word&&['related','collocation'].includes(l.type)));
  const isRoot=entry.links.every(l=>l.type==='collocation');
  assert.ok(entry.links.every(l=>isRoot?l.tier==='core':l.type==='related'));
 }
 for(const [head,notes] of Object.entries(collocationReadingNotes))for(const [phrase,note] of Object.entries(notes)){
  assert.ok(collocationReadingMega[head].links.some(l=>l.word===phrase));
  assert.ok(note.note&&note.example&&note.translation);
 }
 assert.equal(collocationReadingMega['substitute paper for plastic'].meaning,'プラスチックの代わりに紙を使う');
 assert.ok(collocationReadingMega['distinguish'].links.some(l=>l.word==='distinguish fact from opinion'&&l.type==='collocation'));
});

import nuanceFamilyMega, {nuanceFamilyNotes} from '../data/universe-nuance-family-mega.js';
test('advanced nuance vocabulary uses explicitly typed family and contrast links',()=>{
 const stats=nuanceFamilyCoverage();
 assert.equal(stats.candidates,1795);
 assert.equal(stats.heads+stats.compatible+stats.skippedSense,stats.candidates);
 assert.ok(stats.heads>0&&stats.links>0);
 const entries=Object.entries(nuanceFamilyMega);
 assert.equal(entries.length,1795);
 assert.equal(entries.reduce((n,[,e])=>n+e.links.length,0),7249);
 for(const [word,entry] of entries){
  assert.ok(entry.meaning&&lookupUniverse(word)?.meaning);
  assert.ok(entry.links.length>0);
  const normalized=entry.links.map(l=>l.word.trim().toLowerCase());
  assert.equal(new Set(normalized).size,normalized.length);
  assert.ok(entry.links.every(l=>l.meaning&&l.word!==word&&['related','synonym','family','contrast'].includes(l.type)));
 }
 for(const [head,notes] of Object.entries(nuanceFamilyNotes))for(const [word,note] of Object.entries(notes)){
  assert.ok(nuanceFamilyMega[head].links.some(l=>l.word===word));
  assert.ok(note.note&&note.example&&note.translation);
 }
 assert.ok(nuanceFamilyMega['ubiquitous'].links.some(l=>l.word==='ubiquity'&&l.type==='family'));
 assert.ok(nuanceFamilyMega['implicit'].links.some(l=>l.word==='explicit'&&l.type==='contrast'));
 assert.ok(nuanceFamilyMega['lucid'].links.some(l=>l.word==='clear'&&l.type==='synonym'));
 assert.equal(nuanceFamilyMega['fortuitous'].links.find(l=>l.word==='happenstance').type,'related');
});

import thematicReadingMega, {thematicReadingNotes} from '../data/universe-thematic-reading-mega.js';
test('interdisciplinary vocabulary and expressions have valid contextual edges',()=>{
 const stats=thematicReadingCoverage();
 assert.equal(stats.candidates,1518);
 assert.equal(stats.heads+stats.compatible+stats.skippedSense,stats.candidates);
 assert.ok(stats.heads>0&&stats.links>0);
 const entries=Object.entries(thematicReadingMega);
 assert.equal(entries.length,1518);
 assert.equal(entries.reduce((s,[,e])=>s+e.links.length,0),7590);
 for(const [word,entry] of entries){
  assert.ok(entry.meaning&&lookupUniverse(word)?.meaning);
  assert.equal(entry.links.length,5);
  assert.equal(new Set(entry.links.map(l=>l.word)).size,5);
  assert.ok(entry.links.every(l=>l.meaning&&l.word!==word&&l.type==='related'&&l.tier==='related'));
 }
 for(const [head,ns] of Object.entries(thematicReadingNotes))for(const [word,note] of Object.entries(ns)){
  assert.ok(thematicReadingMega[head].links.some(l=>l.word===word));
  assert.ok(note.note&&note.example&&note.translation);
 }
 assert.ok(thematicReadingMega['climate justice'].links.some(l=>l.word==='just transition'));
 assert.ok(thematicReadingMega['take precedence over'].links.some(l=>l.word==='give priority to safety'));
 assert.ok(thematicReadingMega['lexical coverage'].links.some(l=>l.word==='depth of vocabulary knowledge'));
});

import everydayPhrasesMega, {everydayPhrasesNotes} from '../data/universe-everyday-phrases-mega.js';
test('everyday expressions and phrasal verb contexts preserve unique related edges',()=>{
 const stats=everydayPhrasesCoverage();
 assert.equal(stats.candidates,1428);
 assert.equal(stats.heads+stats.compatible+stats.skippedSense,stats.candidates);
 assert.ok(stats.heads>0&&stats.links>0);
 const entries=Object.entries(everydayPhrasesMega);
 assert.equal(entries.length,1428);
 assert.equal(entries.reduce((s,[,e])=>s+e.links.length,0),7140);
 for(const [word,entry] of entries){
  assert.ok(entry.meaning&&lookupUniverse(word)?.meaning);
  assert.equal(entry.links.length,5);
  assert.equal(new Set(entry.links.map(l=>l.word)).size,5);
  assert.ok(entry.links.every(l=>l.meaning&&l.word!==word&&l.type==='related'&&l.tier==='related'));
 }
 for(const [head,ns] of Object.entries(everydayPhrasesNotes))for(const [word,note] of Object.entries(ns)){
  assert.ok(everydayPhrasesMega[head].links.some(l=>l.word===word));
  assert.ok(note.note&&note.example&&note.translation);
 }
 assert.ok(everydayPhrasesMega['look up a word'].links.some(l=>l.word==='consult an online dictionary'));
 assert.ok(everydayPhrasesMega['look up to someone'].links.some(l=>l.word==='admire a role model'));
 assert.ok(everydayPhrasesMega['at the expense of quality'].links.some(l=>l.word==='prioritize speed over accuracy'));
});

import concreteWorldMega, {concreteWorldNotes} from '../data/universe-concrete-world-mega.js';
test('concrete-world networks preserve distinct object and component vocabulary',()=>{
 const stats=concreteWorldCoverage();
 assert.equal(stats.candidates,1248);
 assert.equal(stats.heads+stats.compatible+stats.skippedSense,stats.candidates);
 assert.ok(stats.heads>0&&stats.links>0);
 const entries=Object.entries(concreteWorldMega);
 assert.equal(entries.length,1248);
 assert.equal(entries.reduce((s,[,e])=>s+e.links.length,0),6240);
 for(const [word,entry] of entries){
  assert.ok(entry.meaning&&lookupUniverse(word)?.meaning);
  assert.equal(entry.links.length,5);
  assert.equal(new Set(entry.links.map(l=>l.word)).size,5);
  assert.ok(entry.links.every(l=>l.meaning&&l.word!==word&&l.type==='related'&&l.tier==='related'));
 }
 for(const [head,ns] of Object.entries(concreteWorldNotes))for(const [word,note] of Object.entries(ns)){
  assert.ok(concreteWorldMega[head].links.some(l=>l.word===word));
  assert.ok(note.note&&note.example&&note.translation);
 }
 assert.ok(concreteWorldMega['football pitch'].links.some(l=>l.word==='touchline'));
 assert.ok(concreteWorldMega['staircase'].links.some(l=>l.word==='stair tread'));
 assert.ok(concreteWorldMega['camera tripod'].links.some(l=>l.word==='quick-release plate'));
});

import productiveVerbMega, {productiveVerbNotes} from '../data/universe-productive-verbs-mega.js';
test('productive verbs have typed derivational and collocation edges',()=>{
 const stats=productiveVerbCoverage();
 assert.equal(stats.candidates,1614);
 assert.equal(stats.heads+stats.compatible+stats.skippedSense,stats.candidates);
 assert.ok(stats.heads>0&&stats.links>0);
 const entries=Object.entries(productiveVerbMega);
 assert.equal(entries.length,1614);
 assert.equal(entries.reduce((s,[,e])=>s+e.links.length,0),8070);
 for(const [word,entry] of entries){
  assert.ok(entry.meaning&&lookupUniverse(word)?.meaning);
  assert.equal(entry.links.length,5);
  assert.equal(new Set(entry.links.map(l=>l.word)).size,5);
  assert.ok(entry.links.every(l=>l.meaning&&l.word!==word&&['related','family','collocation'].includes(l.type)&&productiveVerbMega[l.word]));
 }
 for(const [head,ns] of Object.entries(productiveVerbNotes))for(const [word,note] of Object.entries(ns)){
  assert.ok(productiveVerbMega[head].links.some(l=>l.word===word));
  assert.ok(note.note&&note.example&&note.translation);
 }
 assert.ok(productiveVerbMega['adapt'].links.some(l=>l.word==='adaptability'&&l.type==='family'));
 assert.ok(productiveVerbMega['contribute'].links.some(l=>l.word==='contribute original ideas to a group project'&&l.type==='collocation'));
 assert.ok(productiveVerbMega['graduate'].links.some(l=>l.word==='graduate student'&&l.type==='related'));
});
