import test from 'node:test';
import assert from 'node:assert/strict';
import {getRelations,orbitNodes,orbitPageCount,lookupUniverse,universeCoverage,relationTier,universeEntries,usageFor,domainReadingCoverage,familyCollocationCoverage,lexicalReviewCoverage,advancedReviewCoverage,academicReviewCoverage,extendedReviewCoverage,balancedReviewCoverage,cumulativeLexicalCoverage,getWordForms} from './universe.js';
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
 const added=domainReadingCoverage();
 const lexical=familyCollocationCoverage();
 const review=lexicalReviewCoverage();
 const academic=academicReviewCoverage();
 const advanced=advancedReviewCoverage();
 const extended=extendedReviewCoverage();
 const balanced=balancedReviewCoverage();
 assert.deepEqual(universeCoverage(),{heads:6842+added.heads+lexical.heads+review.heads+academic.heads+advanced.heads+extended.heads+balanced.heads,links:26096+added.links+lexical.links+review.links+academic.links+advanced.links+extended.links+balanced.links});
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
 assert.deepEqual(balancedReviewCoverage().after,cumulativeLexicalCoverage());
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
 assert.deepEqual(after,cumulativeLexicalCoverage());
});
