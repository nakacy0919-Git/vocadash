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
