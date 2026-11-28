import {readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
export const normalizeWord=value=>String(value||'').normalize('NFKC').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ');
const authoredExamples=new Set(['important-sleep-learning','important-team-meeting']);
// Explicit equivalents only; do not let approximate matches override an actual image.
const equivalents={'color_colour':['color','colour'],'eat ate':['eat','ate'],'enjoy enjoyed':['enjoy','enjoyed'],'go went':['go','went'],'have had':['have','had'],'make made':['make','made'],'watch watched':['watch','watched'],'see saw':['see','saw']};
export function wordImageIndex(root=fileURLToPath(new URL('../public/images/word-profiles/',import.meta.url))){
 const exact=new Map(),concept=new Map(),aliases=new Map();
 function scan(folder=''){
  let entries;try{entries=readdirSync(join(root,folder),{withFileTypes:true});}catch(e){if(e.code==='ENOENT')return;throw e;}
  // Root uploads take precedence over older nested assets for the same headword.
  for(const entry of entries.sort((a,b)=>a.name.localeCompare(b.name,'en'))){
   if(!entry.isFile()||!/\.webp$/i.test(entry.name))continue;
   const stem=normalizeWord(entry.name.replace(/\.webp$/i,''));
   if(stem==='hot2'||authoredExamples.has(stem)||/(?:-|_)ex(?:[-_\d]|$)/.test(stem))continue;
   const src='/images/word-profiles/'+[...folder.split('/').filter(Boolean),entry.name].map(encodeURIComponent).join('/');
   if(/(?:-concept|[_-]word)$/.test(stem)){
    const k=stem.replace(/(?:-concept|[_-]word)$/,'');if(!concept.has(k))concept.set(k,src);
   }else{
    if(!exact.has(stem))exact.set(stem,src);
    for(const alias of equivalents[stem]||[])if(!aliases.has(alias))aliases.set(alias,src);
   }
  }
  for(const entry of entries)if(entry.isDirectory())scan(folder?folder+'/'+entry.name:entry.name);
 }
 scan();
 return Object.fromEntries([...aliases,...concept,...exact]);
}
