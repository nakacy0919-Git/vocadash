import {readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const normalize=value=>String(value||'').normalize('NFKC').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ');
export function wordImageIndex(root=fileURLToPath(new URL('../public/images/word-profiles/',import.meta.url))){
 const found=new Map();
 // Root is the current upload folder; words/ is also accepted.
 for(const folder of ['', 'words']){
  let entries;try{entries=readdirSync(join(root,folder),{withFileTypes:true});}catch(e){if(e.code==='ENOENT')continue;throw e;}
  for(const entry of entries.sort((a,b)=>a.name.localeCompare(b.name,'en'))){
   if(!entry.isFile()||!(/\.webp$/i.test(entry.name)))continue;
   const stem=normalize(entry.name.replace(/\.webp$/i,''));
   if(/(?:-concept|[_-]word)$/.test(stem)){
    const k=stem.replace(/(?:-concept|[_-]word)$/,'');
    if(!found.has(k))found.set(k,'/images/word-profiles/'+(folder?folder+'/':'')+encodeURIComponent(entry.name));
   }else if(!stem.includes('-ex')&&!stem.includes('_ex')){
    found.set(stem,'/images/word-profiles/'+(folder?folder+'/':'')+encodeURIComponent(entry.name));
   }
  }
 }
 return Object.fromEntries(found);
}
