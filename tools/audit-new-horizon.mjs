import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {wordImageIndex,normalizeWord} from './word-image-index.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(join(root,p),'utf8'));
export function key(s){return normalizeWord(s).replace(/([.!?])$/,(m,_,i,t)=>/\b(?:[a-z]\.)+[a-z]\.$/i.test(t)?m:'').trim();}
export function sourceKeys(s){
 const k=key(s),m=k.match(/^(.+?)\(([a-z]+)\)$/);
 const keys=m?[m[1],m[1]+m[2]]:k.includes(', ')?k.split(', '):[k];
 return [...new Set(keys.map(key).filter(Boolean))];
}
const index=new Map();
function add(word,info){if(typeof word!=='string')return;for(const s of [word,...word.split('/')]){const k=key(s);if(!k)continue;const a=index.get(k)||[];if(!a.some(x=>x.word===word&&x.source===info.source))a.push({word,...info});index.set(k,a);}}
const draft='data/vocabulary-drafts/',manifest=read(draft+'manifest.json');
for(const file of manifest.batchFiles)for(const row of read(draft+file).records||[])add(row.headword,{source:'draft',wordId:row.wordId,cefr:row.cefrHeadword});
function collect(o,file){if(!o||typeof o!=='object')return;if(Array.isArray(o)){for(const v of o)collect(v,file);return;}add(o.word,{source:file});add(o.headword,{source:file});for(const v of Object.values(o))if(typeof v==='object')collect(v,file);}
for(const file of readdirSync(join(root,'src/data')))if(/^(?:eiken|regular|lesson).*\.json$/.test(file))collect(read('src/data/'+file),file);
const images=new Map(Object.entries(wordImageIndex()).map(([k,v])=>[key(k),v]));
const data=read('src/data/new-horizon-locations.json');
const rows=data.entries.map(row=>{const keys=sourceKeys(row.sourceWord);const matches=keys.flatMap(k=>index.get(k)||[]);return {...row,keys,vocadashMatches:[...new Map(matches.map(m=>[m.word+'|'+m.source,m])).values()],imagePaths:[...new Set(keys.map(k=>images.get(k)).filter(Boolean))]};});
const summaries=[1,2,3].map(grade=>{const subset=rows.filter(r=>r.grade===grade);return {grade,locations:subset.length,matched:subset.filter(r=>r.vocadashMatches.length).length,withImage:subset.filter(r=>r.imagePaths.length).length,unmatched:subset.filter(r=>!r.vocadashMatches.length).length};});
const summary={scope:data.scope,sourceCommit:data.sourceCommit,grades:summaries,total:rows.length,matched:rows.filter(r=>r.vocadashMatches.length).length,withImage:rows.filter(r=>r.imagePaths.length).length,unmatched:rows.filter(r=>!r.vocadashMatches.length).length};
if(process.argv.includes('--summary'))console.log(JSON.stringify(summary));
else console.log(JSON.stringify({summary,rows},null,2));
