import React from 'react';
import './VoiceOrb.css';
const dots=Array.from({length:96},(_,i)=>{const strand=i%3,k=Math.floor(i/3),t=k/31,angle=t*Math.PI*3.5+strand*2*Math.PI/3,r=10+73*t;return {x:100+Math.cos(angle)*r,y:100+Math.sin(angle)*r*.76,r:.9+(i%5)*.27,opacity:.26+t*.65,color:['#72e9ff','#777dff','#cfa0ff'][strand]};});
export default function VoiceOrb({enabled,phase,micState,busy,transcript,interim,notice,suggestions,onChoose}){
 if(!enabled&&!notice&&!suggestions.length)return null;
 const state=busy?'thinking':phase==='standby'?'standby':micState;
 const label=busy?'Processing…':phase==='standby'?'Waiting for Voca…':micState==='speaking'?'Listening to you…':micState==='listening'?'Listening…':micState==='starting'?'Connecting microphone…':micState==='reconnecting'?'Reconnecting…':'Voice Control';
 return <div className={'vd-orb-overlay vd-orb-'+state}>
  {enabled&&<div className="vd-orb-art" aria-hidden="true"><svg viewBox="0 0 200 200"><defs><radialGradient id="vd-orb-glow"><stop stopColor="#8adfff" stopOpacity=".7"/><stop offset=".35" stopColor="#635eff" stopOpacity=".34"/><stop offset="1" stopColor="#465bf5" stopOpacity="0"/></radialGradient></defs><circle cx="100" cy="100" r="73" fill="url(#vd-orb-glow)"/><g className="vd-orb-spin">{dots.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={p.r} fill={p.color} opacity={p.opacity}/>)}</g><g className="vd-orb-counter">{Array.from({length:28},(_,i)=>{const a=i/28*Math.PI*2;return <circle key={i} cx={100+88*Math.cos(a)} cy={100+67*Math.sin(a)} r={i%4===0?1.4:.65} fill="#aadfff" opacity={.38+(i%3)*.17}/>;})}</g><circle className="vd-orb-core" cx="100" cy="100" r="5" fill="#e6f9ff"/></svg></div>}
  {enabled&&<div id="vd-voice-live" role="status" className="vd-orb-label">{label}</div>}
  {enabled&&transcript&&phase!=='standby'&&<div className={'vd-orb-transcript'+(interim?' is-interim':'')}>“{transcript}”</div>}
  {notice&&<div role="status" className="vd-orb-notice">{notice}</div>}
  {suggestions.length>0&&<div className="vd-orb-suggestions">{suggestions.map(word=><button key={word} type="button" onClick={()=>onChoose(word)}>{word}</button>)}</div>}
 </div>;
}
