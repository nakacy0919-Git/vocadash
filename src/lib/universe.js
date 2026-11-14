import derivationCollocationMega, {derivationCollocationNotes} from '../data/universe-derivation-collocation-mega.js';
import adjectiveNounMega, {adjectiveNounNotes} from '../data/universe-adjective-noun-expressions-mega.js';
import productiveVerbMega, {productiveVerbNotes} from '../data/universe-productive-verbs-mega.js';
import concreteWorldMega, {concreteWorldNotes} from '../data/universe-concrete-world-mega.js';
import everydayPhrasesMega, {everydayPhrasesNotes} from '../data/universe-everyday-phrases-mega.js';
import thematicReadingMega, {thematicReadingNotes} from '../data/universe-thematic-reading-mega.js';
import nuanceFamilyMega, {nuanceFamilyNotes} from '../data/universe-nuance-family-mega.js';
import collocationReadingMega, {collocationReadingNotes} from '../data/universe-collocation-reading-mega.js';
import everydayAbstractMega, {everydayAbstractNotes} from '../data/universe-everyday-abstract-mega.js';
import adjectiveMega from '../data/universe-adjective-mega.js';
import advancedActionMega from '../data/universe-advanced-action-mega.js';
import domainMega from '../data/universe-domain-mega.js';
import balancedLexicalReview, {balancedLexicalNotes,balancedLexicalParadigms} from '../data/universe-balanced-lexical-review.js';
import extendedVerbReview, {extendedVerbParadigms} from '../data/universe-extended-verb-review.js';
import extendedNounReview, {extendedNounParadigms} from '../data/universe-extended-noun-review.js';
import advancedVerbReview, {advancedVerbParadigms,advancedVerbNotes} from '../data/universe-advanced-verb-review.js';
import advancedNominalReview, {advancedNominalParadigms} from '../data/universe-advanced-nominal-review.js';
import academicVerbReview, {academicVerbParadigms} from '../data/universe-academic-verb-review-mega.js';
import academicAdjectiveReview, {academicAdjectiveParadigms} from '../data/universe-academic-adjective-review-mega.js';
import verbMorphologyReview, {verbParadigms} from '../data/universe-verb-morphology-review.js';
import nounAdjectiveReview, {adjectiveNounParadigms} from '../data/universe-noun-adjective-review.js';
import familyCollocationMega, {familyCollocationNotes} from '../data/universe-families-collocations-mega.js';
import domainReadingMega, {domainReadingNotes} from '../data/universe-domain-reading-mega.js';
import academicFamilies, {academicFamilyNotes} from '../data/universe-academic-families.js';
import foundationMega, {foundationMegaNotes} from '../data/universe-foundation-mega.js';
import generalNetwork, {generalNetworkNotes} from '../data/universe-general-network.js';
import academicNetwork, {academicNetworkNotes} from '../data/universe-academic-network.js';
import supplementOZ, {supplementOZNotes} from '../data/universe-original-supplement-oz.js';
import originalFoundationG, {foundationGNotes} from '../data/universe-original-foundation-g.js';
import originalFoundationF, {foundationFNotes} from '../data/universe-original-foundation-f.js';
import originalFoundationE, {foundationENotes} from '../data/universe-original-foundation-e.js';
import originalFoundationD, {foundationDNotes} from '../data/universe-original-foundation-d.js';
import foundationNotes from '../data/universe-foundation-notes.js';
import originalFoundationB from '../data/universe-original-foundation-b.js';
import originalFoundationC from '../data/universe-original-foundation-c.js';
import schoolReadingC from '../data/universe-school-reading-c.js';
import schoolReadingD from '../data/universe-school-reading-d.js';
import originalA1A from '../data/universe-original-a1-a.js';
import readingNotes from '../data/universe-reading-notes.js';
import schoolContext from '../data/universe-school-context.js';
import schoolRegular from '../data/universe-school-regular.js';
import schoolReadingA from '../data/universe-school-reading-a.js';
import schoolReadingB from '../data/universe-school-reading-b.js';
import schoolNotes from '../data/universe-school-notes.js';
import masterVerbs from '../data/universe-master-verbs.js';
import masterAdjectives from '../data/universe-master-adjectives.js';
import masterNouns from '../data/universe-master-nouns.js';
import masterPhrasal from '../data/universe-master-phrasal.js';
import masterNotes from '../data/universe-master-notes.js';
import bridges from '../data/universe-bridges.js';
import coreBulk from '../data/universe-core-bulk.js';
import advancedBulk from '../data/universe-advanced-bulk.js';
import usageNotes from '../data/universe-usage-notes.js';
import stageOne, {headMeanings} from '../data/universeStageOne.js';
import {stageOneUniverse} from '../data/universe-stage1.js';
// Voca Universe: authored semantic links, never quiz distractors.
const rows = (values) => values.map(([word, meaning, type, tier]) => ({word, meaning, type, tier}));
export const universeSeed = {
  ...stageOne,
  distribute: rows([
    ['hand out','配る','synonym','core'],['distribution','分配・流通','family','core'],['deliver','届ける','related','core'],
    ['allocate','割り当てる','synonym','related'],['share','分け合う','related','related'],['distribute supplies','物資を配布する','collocation','related'],
    ['redistribute','再分配する','family','extended'],['distributor','販売業者・配給業者','family','extended'],['dispense','供給する・調剤する','related','extended']]),
  ancestors: rows([
    ['ancestor','先祖（単数）','family','core'],['forebears','先祖','synonym','related'],['descendants','子孫','contrast','core'],
    ['family tree','家系図','related','core'],['ancestry','家系・血統','family','related'],['heritage','受け継いだ文化・遺産','related','related'],
    ['lineage','血統・系譜','related','extended'],['genealogy','系譜学・家系','related','extended']]),
  'interfering with': rows([
    ['interfere with','〜に干渉する','family','core'],['get in the way of','〜の邪魔をする','synonym','core'],['interference','干渉','family','related'],
    ['interrupt','中断する','related','related'],['meddle in','〜に口出しする','synonym','extended'],['intrude on','〜を侵害する','related','extended']]),
  'content with': rows([
    ['satisfied with','〜に満足して','synonym','core'],['happy with','〜に満足して','synonym','core'],['contentment','満足感','family','related'],
    ['dissatisfied with','〜に不満で','contrast','related'],['pleased with','〜を喜んで','synonym','related'],['gratified','満足した','related','extended']]),
  respond: rows([
    ['reply','返答する','synonym','core'],['answer','答える','synonym','core'],['response','返答・反応','family','core'],
    ['respond to','〜に返答・反応する','collocation','related'],['react','反応する','related','related'],['responsive','反応が良い','family','related'],
    ['acknowledge','受領を知らせる・認める','related','extended'],['rejoinder','応答・反論','related','extended']]),
  improve: rows([
    ['get better','良くなる','synonym','core'],['improvement','改善','family','core'],['enhance','高める','synonym','core'],
    ['develop','発展させる','related','related'],['make progress','進歩する','related','related'],['improve skills','技能を向上させる','collocation','related'],
    ['refine','洗練する','related','extended'],['ameliorate','改善する（形式的）','synonym','extended'],['deteriorate','悪化する','contrast','extended']]),
};
export const types = {synonym:'類義語',family:'派生・語形',collocation:'コロケーション',related:'関連語',contrast:'対義・対照'};
const tiers = ['core','related','extended'];
// Optional curated strength and usage bands. Unknown usage never implies rarity.
// These bands are editorial estimates unless a corpus source is attached.
export function relationTier(item) {
  if (tiers.includes(item.tier)) return item.tier;
  const score = typeof item.strength === 'number' && Number.isFinite(item.strength) ? Math.max(0,Math.min(1,item.strength)) : null;
  if (score === null) return 'related';
  const adjusted = score - (item.usageBand === 'rare' ? .22 : item.usageBand === 'common' ? 0 : item.usageBand === 'occasional' ? .10 : 0);
  return adjusted >= .75 ? 'core' : adjusted >= .45 ? 'related' : 'extended';
}
export const tierLabels = {core:'最優先',related:'関連',extended:'発展'};
const normalize = value => String(value || '').trim().toLowerCase().replace(/[’]/g,"'").replace(/\s+/g,' ');
const seedMeanings = {distribute:'配る・分配する',ancestors:'先祖','interfering with':'〜に干渉する','content with':'〜に満足して',respond:'返答・反応する',improve:'改善する'};
const authored = new Map();
// Combine two independent content batches without replacing unique links.
// Prefer earlier curated metadata on duplicate terms.
function addAuthored(word,entry) {
  const key=normalize(word);
  const prior=authored.get(key);
  const seen=new Set();
  const links=[...(prior?.links||[]),...entry.links].filter(link=>{
    const term=normalize(link.word);
    if(!term||term===key||seen.has(term))return false;
    seen.add(term);return true;
  });
  authored.set(key,{meaning:prior?.meaning||entry.meaning||'',links});
}
for(const [word,entry] of Object.entries(stageOneUniverse))addAuthored(word,entry);
for(const [word,links] of Object.entries(universeSeed))addAuthored(word,{meaning:headMeanings[word]||seedMeanings[word],links});
for(const batch of [coreBulk,advancedBulk,masterVerbs,masterAdjectives,masterNouns,masterPhrasal,schoolRegular,schoolReadingA,schoolReadingB,schoolContext,schoolReadingC,schoolReadingD,originalA1A,originalFoundationB,originalFoundationC,originalFoundationD,originalFoundationE,originalFoundationF,originalFoundationG,supplementOZ,academicNetwork,generalNetwork,foundationMega,academicFamilies])for(const [word,entry] of Object.entries(batch))addAuthored(word,entry);
for(const [word,links] of Object.entries(bridges))if(authored.has(word))addAuthored(word,{meaning:authored.get(word).meaning,links});
// Keep earlier authored meanings and link classifications; add only unseen edges.
const domainBefore=universeCoverage();
for(const [word,entry] of Object.entries(domainReadingMega))addAuthored(word,entry);
const domainAfter=universeCoverage();
export function domainReadingCoverage() {
  return {heads:domainAfter.heads-domainBefore.heads,links:domainAfter.links-domainBefore.links};
}
// Explicit lexical relationships can refine a previously generic related edge.
// Keep existing specific classifications, meanings and other authored information.
const familyBefore=universeCoverage();
let refinedLexicalLinks=0;
for(const [word,entry] of Object.entries(familyCollocationMega)){
  const prior=authored.get(normalize(word));
  if(prior){
    const specific=new Map(entry.links.filter(l=>l.type==='family'||l.type==='collocation').map(l=>[normalize(l.word),l]));
    const links=prior.links.map(link=>{
      const refinement=specific.get(normalize(link.word));
      if(link.type!=='related'||!refinement)return link;
      refinedLexicalLinks++;
      return {...link,type:refinement.type,tier:refinement.tier};
    });
    authored.set(normalize(word),{...prior,links});
  }
  addAuthored(word,entry);
}
const familyAfter=universeCoverage();
export function familyCollocationCoverage(){
  return {heads:familyAfter.heads-familyBefore.heads,links:familyAfter.links-familyBefore.links,refined:refinedLexicalLinks};
}
// Review all previous headwords, then enrich entries with explicit lexical evidence.
function lexicalAudit(){
  const stats={heads:authored.size,links:0,synonym:0,family:0,collocation:0,forms:0,headsWithSynonyms:0,headsWithFamily:0,headsWithCollocations:0,headsWithForms:0};
  for(const {links} of authored.values()){
    stats.links+=links.length;
    let synonym=false,family=false,collocation=false,forms=false;
    for(const link of links){
      if(link.type==='synonym'){stats.synonym++;synonym=true;}
      if(link.type==='family'){stats.family++;family=true;}
      if(link.type==='collocation'){stats.collocation++;collocation=true;}
      if(link.morphology?.some(x=>!['派生・語族','基となる語'].includes(x))){stats.forms++;forms=true;}
    }
    if(synonym)stats.headsWithSynonyms++;
    if(family)stats.headsWithFamily++;
    if(collocation)stats.headsWithCollocations++;
    if(forms)stats.headsWithForms++;
  }
  return stats;
}
function applyLexicalReview(batches){
 const before=lexicalAudit();
 const priorReviewHeads=new Set(authored.keys());
const revisedPriorHeads=new Set();
let refinedReviewLinks=0, annotatedReviewLinks=0;
for(const batch of batches){
  for(const [word,entry] of Object.entries(batch)){
    const key=normalize(word);
    const prior=authored.get(key);
    const previousKeys=new Set((prior?.links||[]).map(l=>normalize(l.word)));
    if(prior){
      const additions=new Map(entry.links.map(l=>[normalize(l.word),l]));
      const links=prior.links.map(link=>{
        const addition=additions.get(normalize(link.word));
        if(!addition)return link;
        let next=link;
        if(link.type==='related'&&['family','collocation','synonym'].includes(addition.type)){
          next={...next,type:addition.type,tier:addition.tier};
          refinedReviewLinks++;
        }
        if(addition.morphology){
          const labels=[...new Set([...(link.morphology||[]),...addition.morphology])];
          if(labels.length!==(link.morphology||[]).length||!link.lemma){
            next={...next,morphology:labels,lemma:link.lemma||addition.lemma};
            annotatedReviewLinks++;
          }
        }
        if(next!==link&&priorReviewHeads.has(key))revisedPriorHeads.add(key);
        return next;
      });
      authored.set(key,{...prior,links});
    }
    if(priorReviewHeads.has(key)&&entry.links.some(l=>!previousKeys.has(normalize(l.word))))revisedPriorHeads.add(key);
    addAuthored(word,entry);
  }
}

 const after=lexicalAudit();
 return {heads:after.heads-before.heads,links:after.links-before.links,existingHeadsUpdated:revisedPriorHeads.size,refined:refinedReviewLinks,annotated:annotatedReviewLinks,before,after};
}
const earlierReview=applyLexicalReview([verbMorphologyReview,nounAdjectiveReview]);
const academicReview=applyLexicalReview([academicVerbReview,academicAdjectiveReview]);
const advancedReview=applyLexicalReview([advancedVerbReview,advancedNominalReview]);
const extendedReview=applyLexicalReview([extendedVerbReview,extendedNounReview]);
const balancedReview=applyLexicalReview([balancedLexicalReview]);
function copyReview(r){return {...r,before:{...r.before},after:{...r.after}};}
export function lexicalReviewCoverage(){return copyReview(earlierReview);}
export function advancedReviewCoverage(){return copyReview(advancedReview);}
export function academicReviewCoverage(){return copyReview(academicReview);}
export function extendedReviewCoverage(){return copyReview(extendedReview);}
export function balancedReviewCoverage(){return copyReview(balancedReview);}
export function cumulativeLexicalCoverage(){return {...lexicalAudit()};}
function mergeParadigm(a,b){
 if(!a)return b||null;
 if(!b)return a;
 const result={...a,...b};
 for(const field of new Set([...Object.keys(a),...Object.keys(b)])){
   if(Array.isArray(a[field])||Array.isArray(b[field]))result[field]=[...new Set([...(a[field]||[]),...(b[field]||[])])];
 }
 return result;
}
export function getWordForms(word){
 const key=normalize(word);
 const rows=[];
 const verb=[verbParadigms[key],academicVerbParadigms[key],advancedVerbParadigms[key],extendedVerbParadigms[key],balancedLexicalParadigms.verbs[key]].reduce(mergeParadigm,null);
 const adj=[adjectiveNounParadigms.adjectives[key],academicAdjectiveParadigms[key],advancedNominalParadigms.adjectives[key],balancedLexicalParadigms.adjectives[key]].reduce(mergeParadigm,null);
 const noun=[adjectiveNounParadigms.nouns[key],advancedNominalParadigms.nouns[key],extendedNounParadigms[key],balancedLexicalParadigms.nouns[key]].reduce(mergeParadigm,null);
 const add=(label,forms)=>{if(forms?.length)rows.push({label,forms:[...forms]});};
 if(verb){
   add('動詞・原形',[verb.base]);add('三単現',verb.thirdPerson);add('その他の現在形',verb.otherPresent);
   add('過去形',verb.past);add('過去分詞',verb.pastParticiple);add('現在分詞・動名詞',verb.presentParticiple);
 }
 if(adj){add('形容詞・原級',[adj.base]);add('比較級',adj.comparative);add('最上級',adj.superlative);}
 if(noun){add('名詞・単数形',[noun.singular]);add('複数形',noun.plural);}
 return rows;
}
// Add domain maps only for missing heads; a prior sense must not acquire unrelated links.
const domainMegaAdded = {heads:0,links:0};
for(const [word,entry] of Object.entries(domainMega)) {
  if(authored.has(normalize(word)))continue;
  addAuthored(word,entry);
  domainMegaAdded.heads++;
  domainMegaAdded.links+=authored.get(normalize(word)).links.length;
}
export function domainMegaCoverage(){return {...domainMegaAdded,candidates:Object.keys(domainMega).length};}
const actionMegaAdded={heads:0,links:0};
for(const [word,entry] of Object.entries(advancedActionMega)){
 if(authored.has(normalize(word)))continue;
 addAuthored(word,entry);
 actionMegaAdded.heads++;
 actionMegaAdded.links+=authored.get(normalize(word)).links.length;
}
export function actionMegaCoverage(){return {...actionMegaAdded,candidates:Object.keys(advancedActionMega).length};}
const adjectiveMegaAdded={heads:0,links:0};
for(const [word,entry] of Object.entries(adjectiveMega)){
 if(authored.has(normalize(word)))continue;
 addAuthored(word,entry);
 adjectiveMegaAdded.heads++;
 adjectiveMegaAdded.links+=authored.get(normalize(word)).links.length;
}
export function adjectiveMegaCoverage(){return {...adjectiveMegaAdded,candidates:Object.keys(adjectiveMega).length};}
// Merge parallel content safely. A new sense cannot replace an earlier head's meaning.
// Exact matching Japanese glosses may receive additional contextual edges.
function addCompatibleBatch(batch) {
 const counts={candidates:Object.keys(batch).length,heads:0,links:0,compatible:0,skippedSense:0};
 for(const [word,entry] of Object.entries(batch)){
  const key=normalize(word),prior=authored.get(key);
  if(prior&&prior.meaning!==entry.meaning){counts.skippedSense++;continue;}
  const previous=prior?.links.length||0;
  addAuthored(word,entry);
  if(!prior)counts.heads++;else counts.compatible++;
  counts.links+=authored.get(key).links.length-previous;
 }
 return counts;
}
const unifiedReadingAdded=addCompatibleBatch(domainReadingMega);
const everydayAbstractAdded=addCompatibleBatch(everydayAbstractMega);
const collocationReadingAdded=addCompatibleBatch(collocationReadingMega);
const nuanceFamilyAdded=addCompatibleBatch(nuanceFamilyMega);
const thematicReadingAdded=addCompatibleBatch(thematicReadingMega);
const everydayPhrasesAdded=addCompatibleBatch(everydayPhrasesMega);
const concreteWorldAdded=addCompatibleBatch(concreteWorldMega);
const productiveVerbAdded=addCompatibleBatch(productiveVerbMega);
const adjectiveNounAdded=addCompatibleBatch(adjectiveNounMega);
// Promote only generic earlier relations, and only under an exact sense match.
// Earlier curated synonyms/contrasts and all established head glosses remain unchanged.
const derivationCollocationAdded={...addCompatibleBatch(derivationCollocationMega),upgraded:0};
for(const [word,entry] of Object.entries(derivationCollocationMega)){
 const current=authored.get(normalize(word));
 if(!current||current.meaning!==entry.meaning)continue;
 const preferred=new Map(entry.links.filter(x=>x.type==='family'||x.type==='collocation').map(x=>[normalize(x.word),x]));
 for(let i=0;i<current.links.length;i++){
  const old=current.links[i],next=preferred.get(normalize(old.word));
  if(old.type!=='related'||!next||old.meaning!==next.meaning)continue;
  current.links[i]={...old,type:next.type,tier:next.tier};
  derivationCollocationAdded.upgraded++;
 }
}
export function derivationCollocationCoverage(){return {...derivationCollocationAdded};}
export function adjectiveNounCoverage(){return {...adjectiveNounAdded};}
export function productiveVerbCoverage(){return {...productiveVerbAdded};}
export function concreteWorldCoverage(){return {...concreteWorldAdded};}
export function everydayPhrasesCoverage(){return {...everydayPhrasesAdded};}
export function thematicReadingCoverage(){return {...thematicReadingAdded};}
export function nuanceFamilyCoverage(){return {...nuanceFamilyAdded};}
export function collocationReadingCoverage(){return {...collocationReadingAdded};}
export function unifiedReadingCoverage(){return {...unifiedReadingAdded};}
export function everydayAbstractCoverage(){return {...everydayAbstractAdded};}

// Common classroom voice queries must have an authored head, not just a reverse link.
const voiceEssentials={
 beautiful:{meaning:'美しい・きれいな',links:rows([
 ['pretty','かわいらしい・きれいな','synonym','core'],['attractive','魅力的な','synonym','core'],['gorgeous','非常に美しい・華麗な','synonym','related'],['lovely','すてきな','synonym','related'],['stunning','息をのむほど美しい','synonym','extended'],['beauty','美しさ','family','core'],['beautifully','美しく','family','core'],['beautify','美しくする','family','extended'],['ugly','醜い','contrast','core'],['beautiful scenery','美しい景色','collocation','core'],['beautiful smile','美しい笑顔','collocation','related'],['beautiful place','美しい場所','collocation','related'],['more beautiful','より美しい','family','related'],['most beautiful','最も美しい','family','related']])},
 happiness:{meaning:'幸福・幸せ',links:rows([
 ['joy','喜び','synonym','core'],['contentment','満足感','synonym','related'],['delight','大きな喜び','synonym','related'],['happy','幸せな','family','core'],['happily','幸せそうに','family','core'],['unhappiness','不幸・不満','contrast','core'],['sadness','悲しみ','contrast','related'],['find happiness','幸せを見つける','collocation','core'],['pursuit of happiness','幸福の追求','collocation','related'],['bring happiness','幸せをもたらす','collocation','related']])}
};
const voiceEssentialAdded={heads:0,links:0};
for(const [word,entry] of Object.entries(voiceEssentials)){
 const prior=authored.get(word);
 if(prior)continue;
 addAuthored(word,entry);
 voiceEssentialAdded.heads++;voiceEssentialAdded.links+=authored.get(word).links.length;
}
export function voiceEssentialCoverage(){return {...voiceEssentialAdded};}

// Reverse only explicit symmetric relations; never infer transitive synonymy.
// A reverse-only view means "linked from", not a complete dictionary entry.
const reverse = new Map();
for (const [head,entry] of authored) {
  for (const link of entry.links) {
    if (!['synonym','family','contrast','related'].includes(link.type)) continue;
    const key=normalize(link.word);
    const list=reverse.get(key)||[];
    list.push({word:head,meaning:entry.meaning,type:link.type,tier:link.tier==='extended'?'extended':'related',reverse:true});
    reverse.set(key,list);
  }
}
export function lookupUniverse(word) {
  const key=normalize(word);
  const entry=authored.get(key);
  return entry ? {word:key,meaning:entry.meaning,relatedWords:entry.links} : null;
}
export function universeEntries() {
  return [...authored].map(([word,entry])=>({word,meaning:entry.meaning,relatedWords:entry.links}));
}
export function usageFor(head,word) {
  const a=normalize(head),b=normalize(word);
  for(const source of [usageNotes,masterNotes,schoolNotes,readingNotes,foundationNotes,foundationDNotes,foundationENotes,foundationFNotes,foundationGNotes,supplementOZNotes,academicNetworkNotes,generalNetworkNotes,foundationMegaNotes,academicFamilyNotes,domainReadingNotes,familyCollocationNotes,advancedVerbNotes,balancedLexicalNotes,everydayAbstractNotes,collocationReadingNotes,nuanceFamilyNotes,thematicReadingNotes,everydayPhrasesNotes,concreteWorldNotes,productiveVerbNotes,adjectiveNounNotes,derivationCollocationNotes]) {
    const notes=Object.hasOwn(source,a)?source[a]:null;
    if(notes&&Object.hasOwn(notes,b))return notes[b];
  }
  return null;
}
export function universeCoverage() {
  return {heads:authored.size,links:[...authored.values()].reduce((n,v)=>n+v.links.length,0)};
}
function asArray(value) { return Array.isArray(value) ? value : []; }
export function getRelations(entry,{includeReverse=true}={}) {
  if (!entry) return [];
  const explicit = asArray(entry.relatedWords);
  // Strings carry no verified distance: default to the middle ring.
  const aliases = [
    ...asArray(entry.synonyms).map(x=>typeof x==='string'?{word:x,type:'synonym'}:{...x,type:'synonym'}),
    ...asArray(entry.antonyms).map(x=>typeof x==='string'?{word:x,type:'contrast'}:{...x,type:'contrast'}),
    ...asArray(entry.wordFamily).map(x=>typeof x==='string'?{word:x,type:'family'}:{...x,type:'family'}),
    ...asArray(entry.collocations).map(x=>typeof x==='string'?{word:x,type:'collocation'}:{...x,type:'collocation'})
  ];
  const seen = new Set([normalize(entry.word)]);
  const links = [];
  const key=normalize(entry.word);
  const savedLinks=authored.get(key)?.links||[];
  const savedByKey=new Map(savedLinks.map(link=>[normalize(link.word),link]));
  for (const raw of [...explicit,...savedLinks,...aliases,...(includeReverse ? reverse.get(key)||[] : [])]) {
    let item = typeof raw === 'string' ? {word:raw} : raw;
    if(item&&typeof item.word==='string'){
      const saved=savedByKey.get(normalize(item.word));
      if(saved&&saved!==item){
        const type=(!item.type||item.type==='related')?saved.type:item.type;
        const morphology=[...new Set([...(saved.morphology||[]),...(item.morphology||[])])];
        item={...saved,...item,type,tier:(type===saved.type&&item.type!==saved.type)?saved.tier:(item.tier||saved.tier),...(morphology.length?{morphology}:{}),lemma:item.lemma||saved.lemma};
      }
    }
    if (!item || typeof item.word !== 'string') continue;
    const key = normalize(item.word);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const type = Object.hasOwn(types,item.type) ? item.type : 'related';
    const tier = relationTier(item);
    links.push({...item,word:item.word.trim(),type,tier,...(usageFor(entry.word,item.word)||{})});
  }
  return links.sort((a,b)=>tiers.indexOf(a.tier)-tiers.indexOf(b.tier));
}
export const ORBIT_RADII = [21,32,40];
const capacities=[3,4,4];
// Greedy placement chooses the angle with the greatest spacing from existing labels.
// A paged map keeps all the links accessible without an unreadable cloud.
export function orbitPageCount(links) {
  return Math.max(1,...tiers.map((tier,i)=>Math.ceil(links.filter(x=>x.tier===tier).length/capacities[i])));
}
export function orbitNodes(links,page=0) {
  const result=[];
  tiers.forEach((tier,i)=>{
    const group=links.filter(x=>x.tier===tier).slice(page*capacities[i],(page+1)*capacities[i]);
    const radius=ORBIT_RADII[i];
    group.forEach((item,k)=>{
      const ideal=-90+i*38+k*360/group.length;
      const candidate=Array.from({length:72},(_,step)=>{
        const degrees=ideal+step*5;
        const a=degrees*Math.PI/180;
        const x=50+radius*Math.cos(a),y=50+radius*Math.sin(a);
        const clearance=Math.min(100,...result.map(n=>Math.hypot((x-n.x)/1.65,(y-n.y))));
        const centerClearance=Math.hypot((x-50)/1.5,y-50);
        return {x,y,score:Math.min(clearance,centerClearance+9)-step*.015};
      }).sort((a,b)=>b.score-a.score)[0];
      result.push({...item,x:candidate.x,y:candidate.y});
    });
  });
  return result;
}
