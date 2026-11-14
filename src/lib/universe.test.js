import test from 'node:test';
import assert from 'node:assert/strict';
import {getRelations,orbitNodes,orbitPageCount,lookupUniverse,universeCoverage,relationTier,universeEntries,usageFor,domainReadingCoverage,familyCollocationCoverage,lexicalReviewCoverage,advancedReviewCoverage,academicReviewCoverage,extendedReviewCoverage,balancedReviewCoverage,cumulativeLexicalCoverage,getWordForms,domainMegaCoverage,actionMegaCoverage,adjectiveMegaCoverage,unifiedReadingCoverage,everydayAbstractCoverage,collocationReadingCoverage,nuanceFamilyCoverage,thematicReadingCoverage,everydayPhrasesCoverage,concreteWorldCoverage,productiveVerbCoverage,adjectiveNounCoverage,derivationCollocationCoverage} from './universe.js';
test('uses tagged links instead of distractors; deduplicates and excludes center',()=>{
 const links=getRelations({word:'__test_fixture_unregistered__',choices:['wrong'],relatedWords:[{word:'__test_fixture_unregistered__'},{word:'reply',type:'synonym',tier:'core'},{word:'REPLY'}],synonyms:['answer']});
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
 const added=domainReadingCoverage();
 const lexical=familyCollocationCoverage();
 const review=lexicalReviewCoverage();
 const academic=academicReviewCoverage();
 const advanced=advancedReviewCoverage();
 const extended=extendedReviewCoverage();
 const balanced=balancedReviewCoverage();
 const extra=[domainMegaCoverage(),actionMegaCoverage(),adjectiveMegaCoverage(),unifiedReadingCoverage(),everydayAbstractCoverage(),collocationReadingCoverage(),nuanceFamilyCoverage(),thematicReadingCoverage(),everydayPhrasesCoverage(),concreteWorldCoverage(),productiveVerbCoverage(),adjectiveNounCoverage(),derivationCollocationCoverage()].reduce((a,b)=>({heads:a.heads+b.heads,links:a.links+b.links}),{heads:0,links:0});
 const expansion=lexicalExpansionCoverage(),synonyms=synonymMegaCoverage(),synonyms2=synonymMega2Coverage();
 assert.deepEqual(universeCoverage(),{heads:extra.heads+6842+added.heads+lexical.heads+review.heads+academic.heads+advanced.heads+extended.heads+balanced.heads+(expansion.after.heads-expansion.before.heads)+synonyms.headsAdded+synonyms2.headsAdded,links:extra.links+26096+added.links+lexical.links+review.links+academic.links+advanced.links+extended.links+balanced.links+(expansion.after.links-expansion.before.links)+synonyms.linksAdded+synonyms2.linksAdded});
 assert.ok(lexical.heads>0&&lexical.links>0&&lexical.refined>=0);
 assert.ok(added.heads>0&&added.links>0);
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

test('domain reading mega batch keeps contextual links and bilingual distinctions',()=>{
 for(const w of ['carbon sequestration','phonemic awareness','inter-rater reliability','thermohaline circulation','pseudonymization','stratified sampling','spatial interpolation','data provenance']) {
   const entry=lookupUniverse(w);
   assert.ok(entry&&entry.meaning);
   assert.ok(entry.relatedWords.length>=5);
   assert.equal(new Set(entry.relatedWords.map(x=>x.word.trim().toLowerCase())).size,entry.relatedWords.length);
 }
 for(const [head,related] of [['incidence rate','prevalence rate'],['climate adaptation','climate mitigation'],['formative assessment','summative assessment'],['anode','cathode'],['overfitting','underfitting']]){
   const link=getRelations(lookupUniverse(head)).find(x=>x.word===related);
   assert.ok(link&&link.note&&link.example&&link.translation);
 }
 assert.equal(getRelations(lookupUniverse('thermohaline circulation')).find(x=>x.word==='deep water formation').type,'related');
});

test('curated word families and collocations are separately discoverable',()=>{
 for(const [head,phrase] of [['analyze','analyze survey data'],['participate','participate in a survey'],['allocate','allocate sufficient time'],['persist','persist despite difficulties']]){
   const link=getRelations(lookupUniverse(head)).find(x=>x.word===phrase);
   assert.ok(link&&link.type==='collocation'&&link.meaning,head+' -> '+phrase);
   assert.ok(lookupUniverse(phrase)?.relatedWords.some(x=>x.word===head),phrase+' -> '+head);
 }
 for(const [head,related] of [['assess','assessable'],['verify','unverified'],['quantify','quantifiable'],['justify','justifiable']]){
   assert.ok(getRelations(lookupUniverse(head)).some(x=>x.word===related&&x.type==='family'),head+' -> '+related);
 }
 assert.ok(getRelations(lookupUniverse('contribute')).some(x=>x.word==='contribution'&&x.note&&x.example&&x.translation));
 assert.ok(getRelations(lookupUniverse('articulate')).some(x=>x.word==='articulate speaker'&&x.type==='collocation'));
});

test('core verb forms, irregular plurals and comparison forms are explicit',()=>{
 const form=(word,label)=>getWordForms(word).find(x=>x.label===label)?.forms;
 assert.deepEqual(form('be','その他の現在形'),['am','are']);
 assert.deepEqual(form('go','過去形'),['went']);
 assert.deepEqual(form('get','過去分詞'),['got','gotten']);
 assert.deepEqual(form('read','過去分詞'),['read']);
 assert.deepEqual(form('good','比較級'),['better']);
 assert.deepEqual(form('child','複数形'),['children']);
 assert.deepEqual(form('criterion','複数形'),['criteria']);
 assert.deepEqual(form('species','複数形'),['species']);
 for(const [base,related,label] of [['go','went','過去形'],['take','taken','過去分詞'],['child','children','複数形'],['good','better','比較級']]){
   const link=getRelations(lookupUniverse(base)).find(x=>x.word===related);
   assert.ok(link?.morphology?.includes(label),base+' -> '+related);
 }
 for(const [head,phrase] of [['take','take responsibility for'],['cope','cope with a heavy workload'],['clear','clear instructions'],['criterion','selection criteria']]){
   const related=getRelations(lookupUniverse(head)).find(x=>x.word===phrase);
   assert.ok(related?.meaning&&related.type==='collocation',head+' -> '+phrase);
   assert.ok(lookupUniverse(phrase)?.relatedWords.some(x=>x.word===head));
 }
 const {before,after,existingHeadsUpdated,heads,links}=lexicalReviewCoverage();
 assert.ok(existingHeadsUpdated>0&&heads>0&&links>0);
 assert.ok(after.headsWithForms>before.headsWithForms);
 assert.ok(after.headsWithFamily>=before.headsWithFamily&&after.headsWithCollocations>=before.headsWithCollocations);
});

test('academic verb and adjective expansion has explicit forms and productive phrase links',()=>{
 const form=(word,label)=>getWordForms(word).find(x=>x.label===label)?.forms;
 for(const [word,expected] of [['submit','submitted'],['transfer','transferred'],['deter','deterred'],['confer','conferred'],['accompany','accompanied']]){
   assert.ok(form(word,'過去形')?.includes(expected),word);
 }
 assert.deepEqual(form('guarantee','現在分詞・動名詞'),['guaranteeing']);
 assert.ok(form('benefit','過去分詞')?.includes('benefitted'));
 assert.deepEqual(form('reliable','比較級'),['more reliable']);
 assert.deepEqual(form('subtle','最上級'),['subtlest']);
 assert.equal(form('identical','比較級'),undefined);
 for(const [head,phrase] of [['adhere','adhere to guidelines'],['attribute','attribute success to effort'],['deprive','deprive children of opportunities'],['mitigate','mitigate adverse effects'],['compatible','compatible with existing devices'],['reluctant','reluctant to speak'],['vulnerable','vulnerable to exploitation']]){
   const link=getRelations(lookupUniverse(head)).find(x=>x.word===phrase);
   assert.ok(link&&link.meaning&&link.type==='collocation',head+' -> '+phrase);
   assert.ok(lookupUniverse(phrase)?.relatedWords.some(x=>x.word===head));
 }
 for(const [head,derivative] of [['corroborate','corroboration'],['facilitate','facilitation'],['ambiguous','ambiguity'],['resilient','resilience']]){
   const link=getRelations(lookupUniverse(head)).find(x=>x.word===derivative);
   assert.ok(link?.morphology?.includes('派生・語族'),head+' -> '+derivative);
 }
});

test('advanced lexical review supplements previous entries and preserves distinct forms',()=>{
 const form=(word,label)=>getWordForms(word).find(x=>x.label===label)?.forms;
 assert.deepEqual(form('compel','過去形'),['compelled']);
 assert.deepEqual(form('defer','現在分詞・動名詞'),['deferring']);
 assert.ok(form('submit','過去分詞').includes('submitted'));
 assert.ok(form('discrepancy','複数形').includes('discrepancies'));
 assert.ok(form('subtle','比較級').includes('subtler'));
 assert.ok(form('reliable','比較級').includes('more reliable'));
 assert.ok(form('stable','比較級').includes('more stable'));
 assert.ok(form('go','過去形').includes('went'));
 assert.ok(form('child','複数形').includes('children'));
 assert.ok(!form('expertise','複数形'));
 for(const [h,w] of [['derive','derive meaning from context'],['deter','deter crime'],['mitigate','mitigate adverse effects'],['scrutiny','under close scrutiny'],['robust','robust methodology']]){
  const l=getRelations(lookupUniverse(h)).find(x=>x.word===w);
  assert.ok(l&&l.type==='collocation'&&l.meaning,h+' -> '+w);
  assert.ok(lookupUniverse(w)?.relatedWords.some(x=>x.word===h));
 }
 const oldStyle=getRelations({word:'compel',relatedWords:[{word:'compelled',type:'related'}]}).find(x=>x.word==='compelled');
 assert.ok(oldStyle?.morphology?.includes('過去形')&&oldStyle.type==='family');
 const {before,after,existingHeadsUpdated,heads,links}=advancedReviewCoverage();
 assert.ok(existingHeadsUpdated>0&&heads>0&&links>0);
 assert.ok(after.headsWithFamily>=before.headsWithFamily&&after.headsWithCollocations>=before.headsWithCollocations&&after.headsWithForms>before.headsWithForms);
 assert.ok(usageFor('derive','derive meaning from context')?.example);
});

test('extended lexical review and all parallel batches are actually integrated',()=>{
 const form=(w,l)=>getWordForms(w).find(x=>x.label===l)?.forms;
 assert.deepEqual(form('foresee','過去形'),['foresaw']);
 assert.deepEqual(form('foresee','過去分詞'),['foreseen']);
 assert.deepEqual(form('underlie','過去分詞'),['underlain']);
 assert.ok(form('mimic','現在分詞・動名詞').includes('mimicking'));
 assert.ok(form('cancel','過去形').includes('cancelled'));
 assert.ok(form('cancel','過去形').includes('canceled'));
 assert.ok(form('compel','過去形').includes('compelled'));
 assert.ok(!form('compel','過去形').includes('compeled'));
 assert.ok(form('compel','現在分詞・動名詞').includes('compelling'));
 assert.ok(form('injury','複数形').includes('injuries'));
 assert.ok(!form('advice','複数形'));
 for(const [h,w] of [['abstain','abstain from voting'],['align','align objectives with needs'],['tailor','tailor instruction to individual needs'],['feedback','provide constructive feedback'],['ownership','take ownership of one\'s learning']]){
   const l=getRelations(lookupUniverse(h)).find(x=>x.word===w);
   assert.ok(l&&l.meaning&&l.type==='collocation',h+' -> '+w);
 }
 const academic=academicReviewCoverage(),advanced=advancedReviewCoverage(),extended=extendedReviewCoverage();
 assert.deepEqual(academic.after,advanced.before);
 assert.deepEqual(advanced.after,extended.before);
 assert.deepEqual(extended.after,balancedReviewCoverage().before);
 assert.ok(cumulativeLexicalCoverage().heads>=balancedReviewCoverage().after.heads);
 assert.ok(extended.heads>0&&extended.links>0&&extended.existingHeadsUpdated>0);
 assert.ok(extended.after.headsWithForms>=extended.before.headsWithForms);
 assert.ok(extended.after.headsWithCollocations>=extended.before.headsWithCollocations);
});

test('sense-focused synonyms, collocations and forms are integrated together',()=>{
 const form=(w,l)=>getWordForms(w).find(x=>x.label===l)?.forms;
 assert.ok(form('concur','過去形').includes('concurred'));
 assert.ok(form('recap','現在分詞・動名詞').includes('recapping'));
 assert.ok(form('weary','比較級').includes('wearier'));
 assert.ok(form('drawback','複数形').includes('drawbacks'));
 assert.ok(form('foresee','過去分詞').includes('foreseen'));
 for(const [h,w] of [['important','significant'],['ponder','think'],['concur','agree'],['surmount','overcome']]){
   const l=getRelations(lookupUniverse(h)).find(x=>x.word===w);
   assert.ok(l?.meaning&&(l.type==='synonym'||l.type==='related'),h+' -> '+w);
 }
 for(const [h,w] of [['pragmatic','pragmatic decision-making'],['concur','concur with a conclusion'],['lucid','lucid reasoning'],['setback','temporary academic setback']]){
   const l=getRelations(lookupUniverse(h)).find(x=>x.word===w);
   assert.ok(l&&l.type==='collocation'&&l.meaning,h+' -> '+w);
 }
 assert.ok(usageFor('effective','efficient')?.note);
 assert.ok(usageFor('despite','regardless of')?.translation);
 const {before,after,heads,links,existingHeadsUpdated}=balancedReviewCoverage();
 assert.ok(heads>0&&links>0&&existingHeadsUpdated>0);
 assert.ok(after.synonym>=before.synonym&&after.collocation>before.collocation&&after.forms>=before.forms);
 assert.ok(cumulativeLexicalCoverage().links>=after.links);
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
  if(batch!==domainReadingMega){assert.ok(stats.heads>0);assert.ok(stats.links>0);}
  else {assert.ok(stats.compatible+stats.heads>0);}
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

import adjectiveNounMega, {adjectiveNounNotes} from '../data/universe-adjective-noun-expressions-mega.js';
test('adjective and noun networks distinguish derivations and contextual combinations',()=>{
 const stats=adjectiveNounCoverage();
 assert.equal(stats.candidates,1613);
 assert.equal(stats.heads+stats.compatible+stats.skippedSense,stats.candidates);
 assert.ok(stats.heads>0&&stats.links>0);
 const entries=Object.entries(adjectiveNounMega);
 assert.equal(entries.length,1613);
 assert.equal(entries.reduce((s,[,e])=>s+e.links.length,0),8094);
 for(const [word,entry] of entries){
  assert.ok(entry.meaning&&lookupUniverse(word)?.meaning);
  assert.ok(entry.links.length>0);
  assert.equal(new Set(entry.links.map(l=>l.word)).size,entry.links.length);
  assert.ok(entry.links.every(l=>l.meaning&&l.word!==word&&['related','family','collocation'].includes(l.type)&&adjectiveNounMega[l.word]));
 }
 for(const [head,ns] of Object.entries(adjectiveNounNotes))for(const [word,note] of Object.entries(ns)){
  assert.ok(adjectiveNounMega[head].links.some(l=>l.word===word));
  assert.ok(note.note&&note.example&&note.translation);
 }
 assert.ok(adjectiveNounMega['equitable'].links.some(l=>l.word==='equity'&&l.type==='family'));
 assert.ok(adjectiveNounMega['evidence'].links.some(l=>l.word==='independent evidence from multiple sources'&&l.type==='collocation'));
 assert.ok(adjectiveNounMega['confident'].links.some(l=>l.word==='confidently'&&l.type==='family'));
});

import derivationCollocationMega, {derivationCollocationNotes} from '../data/universe-derivation-collocation-mega.js';
test('word families and collocations prioritize lexical anchors and protect existing senses',()=>{
 const stats=derivationCollocationCoverage();
 assert.equal(stats.candidates,1491);
 assert.equal(stats.heads+stats.compatible+stats.skippedSense,stats.candidates);
 assert.ok(stats.heads>0&&stats.links>0);
 assert.ok(stats.upgraded>=0);
 const entries=Object.entries(derivationCollocationMega);
 assert.equal(entries.length,1491);
 assert.equal(entries.reduce((s,[,e])=>s+e.links.length,0),3351);
 const totals={family:0,collocation:0,related:0};
 for(const [word,entry] of entries){
  assert.ok(entry.meaning&&lookupUniverse(word)?.meaning);
  assert.ok(entry.links.length>0);
  assert.equal(new Set(entry.links.map(l=>l.word)).size,entry.links.length);
  for(const l of entry.links){
   assert.ok(l.meaning&&l.word!==word&&Object.hasOwn(totals,l.type)&&derivationCollocationMega[l.word]);
   totals[l.type]++;
  }
 }
 assert.deepEqual(totals,{"family":1198,"collocation":867,"related":1286});
 for(const [head,ns] of Object.entries(derivationCollocationNotes))for(const [word,note] of Object.entries(ns)){
  assert.ok(derivationCollocationMega[head].links.some(l=>l.word===word));
  assert.ok(note.note&&note.example&&note.translation);
 }
 assert.ok(derivationCollocationMega['pronounce'].links.some(l=>l.word==='pronunciation'&&l.type==='family'));
 assert.ok(derivationCollocationMega['pronunciation'].links.some(l=>l.word==='pronunciation of unstressed syllables'&&l.type==='collocation'));
 assert.ok(derivationCollocationMega['resistant'].links.some(l=>l.word==='moisture-resistant material for outdoor use'&&l.type==='collocation'));
});

import lexicalExpansion from '../data/universe-lexical-expansion.js';
import {lexicalExpansionCoverage} from './universe.js';
test('editorial expansion preserves classified, unique bilingual edges',()=>{
 assert.equal(Object.keys(lexicalExpansion).length,172);
 const counts={synonym:0,family:0,collocation:0,related:0};
 for(const [word,entry] of Object.entries(lexicalExpansion)){
  assert.ok(entry.meaning&&lookupUniverse(word)?.meaning);
  assert.equal(new Set(entry.links.map(l=>l.word)).size,entry.links.length);
  for(const link of entry.links){assert.ok(link.meaning&&link.word!==word&&Object.hasOwn(counts,link.type));counts[link.type]++;}
 }
 assert.deepEqual(counts,{synonym:163,family:177,collocation:336,related:20});
 assert.ok(lexicalExpansion.scrutinize.links.some(l=>l.word==='scrutinize the evidence'&&l.type==='collocation'));
 assert.ok(lexicalExpansion.procrastinate.links.some(l=>l.word==='procrastination'&&l.type==='family'));
});
test('searchable expansion deduplicates and separates words from expressions',()=>{
 const s=lexicalExpansionCoverage();
 assert.equal(s.editorial.candidates,172);
 assert.equal(s.editorial.heads+s.editorial.compatible+s.editorial.skippedSense,172);
 assert.equal(s.after.heads-s.before.heads,s.editorial.heads+s.promoted.singleWords+s.promoted.expressions);
 assert.equal(s.after.links-s.before.links,s.editorial.links+s.promoted.links);
 assert.ok(s.after.singleWords>=s.before.singleWords);
 assert.ok(s.promoted.singleWords+s.promoted.expressions>0);
 assert.ok(s.promoted.conflictingGloss>=0);
});

import synonymMega from '../data/universe-synonym-mega.js';
import {addSynonymMega,synonymCandidateKeys} from './universe-synonym-mega.js';
import {synonymMegaCoverage,synonymMega2Coverage} from './universe.js';
import synonymMega2 from '../data/universe-synonym-mega-2.js';
test('contextual synonym batch adds 5000 distinct pairs without replacing prior relations',()=>{
 const stats=synonymMegaCoverage();
 assert.equal(stats.addedPairs,5000);
 assert.equal(stats.linksAdded,5000);
 assert.equal(stats.afterSynonyms-stats.beforeSynonyms,5000);
 assert.equal(stats.afterLinks-stats.beforeLinks,5000);
 assert.ok(synonymMega.every(([sense,words])=>sense&&words.length>=3&&new Set(words).size===words.length));
 const seen=new Set();
 for(const {word,relatedWords} of universeEntries()){
  for(const edge of relatedWords.filter(x=>x.synonymBatch===1)){
   const key=[word,edge.word].sort().join('|');
   assert.ok(!seen.has(key));seen.add(key);
   assert.equal(edge.type,'synonym');assert.ok(edge.synonymContext&&edge.note);
   assert.ok(getRelations(lookupUniverse(edge.word)).some(x=>x.word===word&&x.type==='synonym'&&x.reverse&&x.synonymContext===edge.synonymContext));
  }
 }
 assert.equal(seen.size,5000);
});
test('synonym helper preserves existing relations in either direction and excludes duplicates',()=>{
 const entries=new Map([['rise',{meaning:'上がる',links:[{word:'fall',meaning:'下がる',type:'contrast',tier:'core'}]}],['climb',{meaning:'上昇する',links:[{word:'rise',meaning:'上がる',type:'synonym',tier:'core'}]}]]);
 const result=addSynonymMega(entries,[['上昇する',['rise','climb','go up']],['別の文脈',['rise','fall','go up']]],2);
 assert.equal(result.addedPairs,2);
 assert.equal(result.skippedExisting,2);
 assert.equal(entries.get('rise').links.find(l=>l.word==='fall').type,'contrast');
 assert.equal(entries.get('climb').links.find(l=>l.word==='rise').tier,'core');
 assert.equal(result.afterSynonyms-result.beforeSynonyms,2);
});

test('second synonym batch adds another 5000 unique contextual pairs with single-word priority',()=>{
 const first=synonymMegaCoverage(),second=synonymMega2Coverage();
 assert.equal(second.addedPairs,5000);
 assert.equal(second.linksAdded,5000);
 assert.equal(second.beforeLinks,first.afterLinks);
 assert.equal(second.beforeSynonyms,first.afterSynonyms);
 assert.equal(second.afterSynonyms-first.beforeSynonyms,10000);
 assert.equal(second.afterLinks-first.beforeLinks,10000);
 assert.ok(second.singleWordPairs>=3500);
 assert.ok(synonymMega2.every(([sense,words])=>sense&&words.length>=3&&words.every(w=>w.trim()===w&&w.toLowerCase()===w)&&new Set(words).size===words.length));
 const firstCandidates=synonymCandidateKeys(synonymMega);
 const seen=new Set();
 const counts={1:0,2:0};
 for(const {word,relatedWords} of universeEntries()){
  for(const edge of relatedWords.filter(x=>x.synonymMega)){
   const key=[word,edge.word].sort().join('\u0000');
   assert.ok(!seen.has(key));seen.add(key);
   counts[edge.synonymBatch]++;
   if(edge.synonymBatch===2)assert.ok(!firstCandidates.has(key));
   assert.equal(edge.type,'synonym');assert.ok(edge.synonymContext&&edge.note);
   if(edge.synonymBatch===2)assert.ok(getRelations(lookupUniverse(edge.word)).some(x=>x.word===word&&x.type==='synonym'&&x.reverse&&x.synonymContext===edge.synonymContext&&x.synonymBatch===2));
  }
 }
 assert.deepEqual(counts,{1:5000,2:5000});
});
test('second-batch selection prioritizes lexical pairs and excludes first-batch candidates',()=>{
 const map=new Map();
 const excluded=synonymCandidateKeys([['除外する',['alpha','beta']]]);
 const stats=addSynonymMega(map,[['例',['alpha','beta','gamma','long phrase']]],2,{batch:2,prioritizeSingle:true,excludeCandidates:excluded});
 assert.equal(stats.singleWordPairs,2);
 assert.equal(stats.skippedPriorCandidates,1);
 assert.equal(stats.addedPairs,2);
 assert.equal(map.has('long phrase'),false);
 assert.ok([...map.values()].flatMap(x=>x.links).every(l=>l.synonymBatch===2));
});
