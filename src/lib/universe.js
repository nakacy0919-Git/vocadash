import {stageOneUniverse} from '../data/universe-stage1.js';
// Voca Universe: authored semantic links, never quiz distractors.
const rows = (values) => values.map(([word, meaning, type, tier]) => ({word, meaning, type, tier}));
export const universeSeed = {
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
const authored = new Map([
  ...Object.entries(universeSeed).map(([word,links])=>[word,{meaning:seedMeanings[word],links}]),
  ...Object.entries(stageOneUniverse)
]);
// Reverse only explicit symmetric relations; never infer transitive synonymy.
// A reverse-only view means "linked from", not a complete dictionary entry.
const reverse = new Map();
for (const [head,entry] of authored) {
  for (const link of entry.links) {
    if (!['synonym','family','contrast'].includes(link.type)) continue;
    const key=normalize(link.word);
    const list=reverse.get(key)||[];
    list.push({word:head,meaning:entry.meaning,type:link.type,tier:link.tier,reverse:true});
    reverse.set(key,list);
  }
}
export function lookupUniverse(word) {
  const key=normalize(word);
  const entry=authored.get(key);
  return entry ? {word:key,meaning:entry.meaning,relatedWords:entry.links} : null;
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
  for (const raw of [...explicit,...(authored.get(key)?.links || []),...aliases,...(includeReverse ? reverse.get(key)||[] : [])]) {
    const item = typeof raw === 'string' ? {word:raw} : raw;
    if (!item || typeof item.word !== 'string') continue;
    const key = normalize(item.word);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const type = Object.hasOwn(types,item.type) ? item.type : 'related';
    const tier = relationTier(item);
    links.push({...item,word:item.word.trim(),type,tier});
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
