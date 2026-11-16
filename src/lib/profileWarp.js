// Original synthesized acceleration and arrival chime; no music or external assets.
export const PROFILE_WARP_MS=720;
export function profileWarpSamples(rate=24000){
 const samples=new Float32Array(Math.round(rate*PROFILE_WARP_MS/1000));let phase=0,high=0,seed=16231,smoothed=0;
 for(let i=0;i<samples.length;i++){
  const t=i/rate,u=t/.49;
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/4294967296*2-1;smoothed=.91*smoothed+.09*noise;
  let sweep=0;
  if(u<1){const env=Math.pow(Math.sin(Math.PI*u),.85);phase+=2*Math.PI*95*Math.pow(13,u)/rate;high+=2*Math.PI*210*Math.pow(8,u)/rate;sweep=env*(.28*Math.sin(phase)+.1*Math.sin(high)+.15*(noise-smoothed));}
  const a=t-.39;const arrival=a>=0?.19*Math.min(1,a/.012)*Math.exp(-a*13)*(Math.sin(2*Math.PI*880*a)+.45*Math.sin(2*Math.PI*1320*a)):0;
  const attack=Math.min(1,t/.008),release=Math.min(1,(samples.length-i)/(.035*rate));
  samples[i]=(sweep+arrival)*attack*release;
 }
 return {rate,samples};
}
let context,buffer,source;
export function unlockProfileWarp(){
 if(typeof window==='undefined')return Promise.resolve(false);
 try{
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return Promise.resolve(false);
  if(!context||context.state==='closed'){context=new Audio();buffer=null;}
  const ctx=context;
  if(!buffer){const {rate,samples}=profileWarpSamples();buffer=ctx.createBuffer(1,samples.length,rate);buffer.copyToChannel(samples,0);}
  return (ctx.state==='running'?Promise.resolve():ctx.resume()).then(()=>ctx.state==='running').catch(()=>false);
 }catch{return Promise.resolve(false);}
}
export function stopProfileWarp(){if(source){try{source.stop();}catch{}source=null;}}
let generation=0;
export function cancelProfileWarp(){generation++;stopProfileWarp();}
export function playProfileWarp(enabled=true){
 cancelProfileWarp();if(!enabled)return;const token=generation;
 unlockProfileWarp().then(ok=>{if(!ok||token!==generation)return;try{const node=context.createBufferSource(),gain=context.createGain();node.buffer=buffer;gain.gain.value=.62;node.connect(gain);gain.connect(context.destination);source=node;node.onended=()=>{node.disconnect();gain.disconnect();if(source===node)source=null;};node.start();}catch{}});
}
