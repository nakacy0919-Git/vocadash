import test from 'node:test';
import assert from 'node:assert/strict';
import {getRelations,orbitNodes,orbitPageCount,lookupUniverse,universeCoverage,relationTier,universeEntries,usageFor,domainMegaCoverage,actionMegaCoverage} from './universe.js';
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
 assert.deepEqual(universeCoverage(),{heads:6842+added.heads+actionMegaCoverage().heads,links:26096+added.links+actionMegaCoverage().links});
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
