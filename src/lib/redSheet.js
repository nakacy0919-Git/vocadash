// Normalized coordinates keep the sheet in bounds when the tablet rotates.
export const SHEET_SIZES={small:[.29,.36],medium:[.31,.76],wide:[.59,.76],full:[1,1]};
export const INITIAL_SHEET={x:.2,y:.12,w:.31,h:.76};
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
export function boundSheet(rect){
 const w=clamp(rect.w,.12,1),h=clamp(rect.h,.12,1);
 return {x:clamp(rect.x,0,1-w),y:clamp(rect.y,0,1-h),w,h};
}
export function moveSheet(rect,dx,dy){return boundSheet({...rect,x:rect.x+dx,y:rect.y+dy});}
export function sizeSheet(rect,size){const [w,h]=SHEET_SIZES[size]||SHEET_SIZES.medium;return boundSheet({x:rect.x+(rect.w-w)/2,y:rect.y+(rect.h-h)/2,w,h});}
export function sheetClip(rect){const r=boundSheet(rect);return 'inset('+[r.y,Math.max(0,1-r.x-r.w),Math.max(0,1-r.y-r.h),r.x].map(n=>(n*100)+'%').join(' ')+')';}
export function isRedField(mode,overrides,id,field){
 const key=id+':'+field;
 if(Object.prototype.hasOwnProperty.call(overrides,key))return !!overrides[key];
 return mode==='both'||mode===field;
}


// A viewport-sized transparent film, independent of the vocabulary paper.
export const SHEET_THEMES={
 red:{label:'赤',sheet:'#e04a60',ink:'#c32945',edge:'#a91e40'},
 green:{label:'緑',sheet:'#69bc80',ink:'#237945',edge:'#357e4c'},
 pink:{label:'パステルピンク',sheet:'#f4b6c8',ink:'#b74873',edge:'#c46f91'},
 blue:{label:'パステルブルー',sheet:'#a9d8f3',ink:'#287aa9',edge:'#659cb9'},
 purple:{label:'パステル紫',sheet:'#cdbaf2',ink:'#7952ac',edge:'#967abf'},
 yellow:{label:'パステル黄',sheet:'#f8e8a0',ink:'#927015',edge:'#bd9b46'},
 mint:{label:'ミント',sheet:'#b9e8d4',ink:'#277c69',edge:'#69a993'}
};
export function resizeFilm(rect,dx,dy){
 return boundSheet({...rect,w:clamp(rect.w+dx,.12,1-rect.x),h:clamp(rect.h+dy,.12,1-rect.y)});
}
// Translate the fixed-position sheet into the original paper's coordinate space.
// A non-overlapping sheet produces an empty clip instead of hiding unrelated text.
export function paperFilmClip(rect,viewport,paper){
 if(!paper.width||!paper.height)return 'inset(0 100% 100% 0)';
 const x=rect.x*viewport.width, y=rect.y*viewport.height;
 const right=x+rect.w*viewport.width,bottom=y+rect.h*viewport.height;
 const a=Math.max(x,paper.left), b=Math.max(y,paper.top), c=Math.min(right,paper.left+paper.width),d=Math.min(bottom,paper.top+paper.height);
 if(c<=a||d<=b)return 'inset(0 100% 100% 0)';
 return 'inset('+[(b-paper.top)/paper.height,(paper.left+paper.width-c)/paper.width,(paper.top+paper.height-d)/paper.height,(a-paper.left)/paper.width].map(n=>Math.max(0,n)*100+'%').join(' ')+')';
}
const irregular={be:['am','is','are','was','were','been','being'],go:['goes','went','gone','going'],do:['does','did','done','doing'],have:['has','had','having'],make:['made','making'],take:['took','taken','taking'],get:['got','gotten','getting'],see:['saw','seen','seeing'],come:['came','coming'],run:['ran','running'],write:['wrote','written','writing'],speak:['spoke','spoken','speaking'],give:['gave','given','giving'],eat:['ate','eaten','eating'],know:['knew','known','knowing'],think:['thought'],buy:['bought'],bring:['brought'],teach:['taught'],find:['found'],keep:['kept'],leave:['left'],feel:['felt'],say:['said'],tell:['told'],read:['read'],put:['putting'],set:['setting'],begin:['began','begun','beginning'],swim:['swam','swum','swimming'],lie:['lay','lain','lying'],die:['dying'],child:['children'],man:['men'],woman:['women'],person:['people'],foot:['feet'],tooth:['teeth'],mouse:['mice']};
const escapeRx=s=>s.replace(/[.*+?^$(){}|[\]\\]/g,'\\$&');
export function targetParts(sentence,word){
 const text=String(sentence||''),target=String(word||'').trim().toLowerCase();
 if(!target)return [{text,target:false}];
 const [first,...rest]=target.split(/\s+/),forms=new Set([first,...(irregular[first]||[])]);
 if(/^[a-z]+$/.test(first)){
  forms.add(first+'s');forms.add(first+'ed');forms.add(first+'ing');
  if(/(s|x|z|ch|sh|o)$/.test(first))forms.add(first+'es');
  if(/[^aeiou]y$/.test(first)){forms.add(first.slice(0,-1)+'ies');forms.add(first.slice(0,-1)+'ied');}
  if(first.endsWith('e')){forms.add(first+'d');forms.add(first.slice(0,-1)+'ing');}
  if(/[aeiou][bcdfgklmnprst]$/.test(first)){forms.add(first+first.at(-1)+'ed');forms.add(first+first.at(-1)+'ing');}
 }
 const alternatives=[...forms].sort((a,b)=>b.length-a.length).map(escapeRx).join('|');
 const pattern='(?<![A-Za-z0-9])(?:'+alternatives+')'+(rest.length?'\\s+'+rest.map(escapeRx).join('\\s+'):'')+'(?![A-Za-z0-9])';
 const result=[];let cursor=0;
 for(const m of text.matchAll(new RegExp(pattern,'gi'))){if(m.index>cursor)result.push({text:text.slice(cursor,m.index),target:false});result.push({text:m[0],target:true});cursor=m.index+m[0].length;}
 if(cursor<text.length)result.push({text:text.slice(cursor),target:false});
 return result.length?result:[{text,target:false}];
}
