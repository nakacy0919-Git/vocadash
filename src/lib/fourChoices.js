// Shared four-choice generators. Spelling variants are intentional distractors, not vocabulary data.
const norm=s=>String(s??'').normalize('NFKC').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ');
const scramble=(a,random)=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export function spellingOptions(answer,{random=Math.random,excluded=[],known=new Set()}={}){
 const key=norm(answer), blocked=new Set([key,...excluded.map(norm)]), candidates=[];
 if(!/^[a-z][a-z '-]*$/i.test(answer))return [];
 const add=s=>{const k=norm(s);if(k&&!blocked.has(k)&&!known.has(k)&&!/(?:cunt|fuck|shit)/i.test(k)){blocked.add(k);candidates.push(s);}};
 for(let i=1;i<answer.length;i++){
  if(!/[a-z]/i.test(answer[i]))continue;
  if(/[a-z]/i.test(answer[i-1])&&answer[i]!==answer[i-1])add(answer.slice(0,i-1)+answer[i]+answer[i-1]+answer.slice(i+1));
  add(answer.slice(0,i)+answer[i]+answer.slice(i));
  if(answer.length>3)add(answer.slice(0,i)+answer.slice(i+1));
 }
 const swaps={a:'e',e:'i',i:'e',o:'a',u:'o',b:'p',p:'b',c:'k',k:'c',d:'t',t:'d',f:'v',v:'f',g:'j',j:'g',s:'z',z:'s',m:'n',n:'m',l:'r',r:'l',h:'w',w:'h',q:'k',x:'s',y:'i'};
 for(let i=0;i<answer.length;i++){const c=swaps[answer[i].toLowerCase()];if(c)add(answer.slice(0,i)+c+answer.slice(i+1));}
 // A short answer still needs three distinct choices; never render a partial set.
 for(const c of ['e','i','o','a','u','s','t','r'])if(candidates.length<3)add(answer+c);
 return candidates.length<3?[]:scramble([answer,...scramble(candidates,random).slice(0,3)],random);
}
export function choiceIndex(records){
 const words=new Set(), groups=new Map();
 for(const r of records){const word=r.headword||r.word, meaning=r.meaningJa||r.meaning, pos=String(r.partOfSpeech||'').toLowerCase().trim();if(!word||!meaning||! /^[a-z][a-z '-]*$/i.test(word))continue;const k=norm(word);words.add(k);
 const row={word,meaning:norm(meaning),pos};for(const group of new Set([pos,'*'])){if(!groups.has(group))groups.set(group,new Map());groups.get(group).set(k,row);}}
 return {words,groups:new Map([...groups].map(([k,v])=>[k,[...v.values()]]))};
}
export function wordOptions(raw,index,{random=Math.random,spelling=false}={}){
 const answer=raw.headword||raw.word, key=norm(answer), meaning=norm(raw.meaningJa||raw.meaning), pos=String(raw.partOfSpeech||'').toLowerCase().trim();
 if(!answer)return [];
 const related=[...(Array.isArray(raw.synonyms)?raw.synonyms:[]),...(Array.isArray(raw.antonyms)?raw.antonyms:[])].map(v=>norm(typeof v==='string'?v:v?.word||v?.headword||v?.term)).filter(Boolean);
 const blocked=new Set([key,...related]);const known=index?.words||new Set();
 if(spelling)return spellingOptions(answer,{random,known,excluded:related});
 const pool=index?.groups.get(pos)||index?.groups.get('*')||[], candidates=[], used=new Set(blocked);
 // Bounded scan from randomized start; exclude identical/overlapping translations and known related forms.
 const start=Math.floor(random()*pool.length), size=key.split(' ').length;
 for(let i=0;i<Math.min(pool.length,400)&&candidates.length<12;i++){
  const row=pool[(start+i)%pool.length], k=norm(row.word);
  if(used.has(k)||k.split(' ').length!==size||!row.meaning||row.meaning===meaning||(meaning&&(row.meaning.includes(meaning)||meaning.includes(row.meaning)))||Math.abs(k.length-key.length)>Math.max(3,Math.ceil(key.length/2)))continue;
  used.add(k);candidates.push(row.word);
 }
 if(candidates.length<3){const all=index?.groups.get('*')||[], offset=Math.floor(random()*all.length);for(let i=0;i<Math.min(all.length,400)&&candidates.length<3;i++){const row=all[(offset+i)%all.length], k=norm(row.word);if(used.has(k)||k.split(' ').length!==size||!row.meaning||row.meaning===meaning||(meaning&&(row.meaning.includes(meaning)||meaning.includes(row.meaning))))continue;used.add(k);candidates.push(row.word);}}
 if(candidates.length>=3)return scramble([answer,...scramble(candidates,random).slice(0,3)],random);
 return spellingOptions(answer,{random,known,excluded:related});
}
