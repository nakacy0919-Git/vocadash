import React,{useEffect,useRef} from 'react';
import './VoiceOrb.css';
import {createEnergyRenderer} from '../lib/voiceEnergyRenderer.js';
const particles=Array.from({length:960},(_,i)=>{const t=(i+.5)/960,h=1-2*t;return {arm:i%5,t,h,angle:i*2.39996323,r:.76+.23*((i*73%97)/97),weight:.45+(i%7)*.14};});
const stars=Array.from({length:100},(_,i)=>({x:(Math.sin(i*87.31)*43758.5453%1+1)%1,y:(Math.sin(i*42.78+7)*26378.72%1+1)%1,r:.3+(i%4)*.25}));
export default function VoiceOrb({enabled,phase,micState,busy,full,meter,meterReady,transcript,interim,notice,suggestions,onChoose,onMinimize,onExpand,onStop}){
 const canvas=useRef(null),cinematic=useRef(null),live=useRef({});live.current={phase,micState,busy,meterReady};
 useEffect(()=>{
  if(!enabled||!canvas.current)return;
  const el=canvas.current,ctx=el.getContext('2d');if(!ctx)return;
  const film=full?cinematic.current:null;let gpu=null;try{if(film)gpu=createEnergyRenderer(film);}catch{}
  if(film)film.style.visibility=gpu?'visible':'hidden';
  let w=1,h=1,frame=0,energy=0,rotation=0,last=0,stopped=false,painted=0;
  const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const resize=()=>{const b=el.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,2);w=Math.max(1,b.width);h=Math.max(1,b.height);el.width=Math.round(w*d);el.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);gpu?.resize(w,h);};
  resize();const ro=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;ro?.observe(el);window.addEventListener('resize',resize);
  function draw(now){
   if(stopped)return;const dt=last?Math.min(50,now-last):16;last=now;
   const state=live.current,active=state.phase==='active',speaking=state.micState==='speaking';
   const measured=state.meterReady?meter.current?.read()||0:(active&&speaking ? .22 : 0);
   const target=active?measured:0;energy+=(target-energy)*(target>energy?.24:.085);
   if(!reduce)rotation+=dt*.00024*(1+energy*2.8+(state.busy?1.2:0));
   const time=reduce?0:now*.001,cx=w*.5,cy=full?h*.48:h*.5,base=Math.min(w,h)*(full ? .34 : .43);
   if(gpu){if(now-painted>=30){painted=now;if(!gpu.draw(reduce?0:rotation*4.2,energy,state.busy)){gpu.dispose();gpu=null;if(film)film.style.visibility='hidden';}}if(gpu){frame=requestAnimationFrame(draw);return;}}
   ctx.clearRect(0,0,w,h);
   if(full){
    const bg=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(w,h)*.69);bg.addColorStop(0,'#101a38');bg.addColorStop(.43,'#080f24');bg.addColorStop(1,'#03050d');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    for(const p of stars){ctx.fillStyle='rgba(121,159,229,'+(.14+p.r*.16)+')';ctx.beginPath();ctx.arc(p.x*w,p.y*h,p.r,0,Math.PI*2);ctx.fill();}
   }
   const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,base*1.16);glow.addColorStop(0,'rgba(111,176,255,'+(.14+energy*.23)+')');glow.addColorStop(.45,'rgba(76,81,228,'+(.10+energy*.12)+')');glow.addColorStop(1,'rgba(45,56,170,0)');ctx.fillStyle=glow;ctx.fillRect(cx-base*1.2,cy-base*1.2,base*2.4,base*2.4);
   const count=full?particles.length:140;
   ctx.globalCompositeOperation='lighter';
   for(let i=0;i<count;i++){
    const p=particles[full?i:Math.floor(i*particles.length/count)],a=p.angle+rotation;
    const shell=Math.sqrt(1-p.h*p.h),wave=reduce?0:Math.sin(a*3+time*5+p.t*13)*energy*.08;
    const r=base*(p.r+wave)*(1+energy*.12),z=Math.sin(a)*shell;
    const yy=p.h*Math.cos(.34)-z*Math.sin(.34),depth=p.h*Math.sin(.34)+z*Math.cos(.34);
    const perspective=1/(1-.17*depth);
    const x=cx+Math.cos(a)*shell*r*perspective,y=cy+yy*r*perspective;
    const hue=[188,199,207,223,256][p.arm],size=Math.max(.45,(full?1.7:.75)*p.weight*perspective*(1+energy*.7));
    ctx.fillStyle='hsla('+hue+',95%,'+(63+energy*22)+'%,'+(.22+(depth+1)*.26+energy*.18)+')';
    ctx.beginPath();ctx.arc(x,y,size,0,Math.PI*2);ctx.fill();
    if(full&&i%6===0){ctx.fillStyle='hsla('+hue+',95%,70%,.07)';ctx.beginPath();ctx.arc(x,y,size*3.2,0,Math.PI*2);ctx.fill();}
   }
   ctx.globalCompositeOperation='source-over';frame=requestAnimationFrame(draw);
  }
  frame=requestAnimationFrame(draw);
  return()=>{stopped=true;cancelAnimationFrame(frame);ro?.disconnect();gpu?.dispose();if(film)film.style.visibility='hidden';window.removeEventListener('resize',resize);};
 },[enabled,full,meter]);
 if(!enabled&&!notice&&!suggestions.length)return null;
 const state=busy?'thinking':phase==='standby'?'standby':micState;
 const label=busy?'Processing…':phase==='standby'?'Waiting for Dash…':micState==='speaking'?'Listening to you…':micState==='listening'?'Listening…':micState==='starting'?'Connecting microphone…':micState==='reconnecting'?'Reconnecting…':'Dash Assistant';
 return <div className={'vd-orb-overlay '+(full?'vd-orb-full ':'vd-orb-compact ')+'vd-orb-'+state}>
  {enabled&&<canvas ref={canvas} className="vd-orb-canvas" aria-hidden="true"/>}
  {enabled&&full&&<canvas ref={cinematic} className="vd-orb-canvas vd-orb-cinematic" aria-hidden="true"/>}
  {enabled&&full&&<div className="vd-orb-top"><span>DASH<span className="vd-orb-brand-accent"> ASSISTANT</span><small className="vd-orb-edition">NEURAL INTERFACE</small></span><button type="button" aria-label="Minimize assistant" onClick={onMinimize}>−</button></div>}
  <div className="vd-orb-copy">
   {enabled&&<div id="vd-voice-live" role="status" className="vd-orb-label">{label}</div>}
   {enabled&&transcript&&phase!=='standby'&&<div className={'vd-orb-transcript'+(interim?' is-interim':'')}>“{transcript}”</div>}
   {notice&&<div role="status" className="vd-orb-notice">{notice}</div>}
   {suggestions.length>0&&<div className="vd-orb-suggestions">{suggestions.map(word=><button key={word} type="button" onClick={()=>onChoose(word)}>{word}</button>)}</div>}
  </div>
  {enabled&&full&&<div className="vd-orb-footer"><button type="button" className="vd-orb-stop" onClick={onStop} aria-label="Stop microphone"><span/></button><small>{meterReady?'LIVE AUDIO · 音量に連動':'音声認識中 · 音量取得は未接続'}</small></div>}
  {enabled&&!full&&<button className="vd-orb-expand" type="button" onClick={onExpand} aria-label="Expand assistant">⤢</button>}
 </div>;
}
