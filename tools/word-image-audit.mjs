// Read the active vocabulary corpus, not the incomplete candidate index.
// Similarity is normalized optimal-string-alignment edit distance; suggestions
// are review-only because a similar spelling can be a different English word.
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {wordImageIndex,normalizeWord} from './word-image-index.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(join(root,p),'utf8'));
const draft='data/vocabulary-drafts/';
const manifest=read(draft+'manifest.json');
const words=new Set();
function add(w){if(typeof w==='string'){for(const s of [w,...w.split('/')]){const k=normalizeWord(s);if(k)words.add(k);}}}
for(const p of manifest.batchFiles)for(const r of read(draft+p).records||[])add(r.headword);
function collect(o){if(!o||typeof o!=='object')return;if(Array.isArray(o)){for(const x of o)collect(x);return;}add(o.word);add(o.headword);for(const x of Object.values(o))if(typeof x==='object')collect(x);}
for(const p of readdirSync(join(root,'src/data')))if(/^(?:eiken|regular|lesson).*\.json$/.test(p))collect(read('src/data/'+p));
const map=wordImageIndex();const keys=Object.keys(map);
function distance(a,b){
 const d=Array.from({length:a.length+1},(_,i)=>Array.from({length:b.length+1},(_,j)=>i===0?j:j===0?i:0));
 for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){
 d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+Number(a[i-1]!==b[j-1]));
 if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);
 }return d[a.length][b.length];
}
const suggestions=[];
for(const word of keys.filter(k=>!words.has(k))){
 const candidates=[];
 for(const target of words){
  const len=Math.max(word.length,target.length);if(len<5||Math.abs(word.length-target.length)>len*.2)continue;
  const score=1-distance(word,target)/len;
  if(score>=.8)candidates.push({word:target,similarity:Math.round(score*100),alreadyHasImage:Object.hasOwn(map,target)});
 }
 candidates.sort((a,b)=>b.similarity-a.similarity||a.word.localeCompare(b.word));
 suggestions.push({file:map[word],key:word,candidates:candidates.slice(0,5)});
}
console.log(JSON.stringify({registeredWords:words.size,imageKeys:keys.length,exactMatches:keys.filter(k=>words.has(k)).length,review:suggestions},null,2));
