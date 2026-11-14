// Local-only microphone analyser. No destination, recording, or network output.
export function audioLevel(samples){
 if(!samples?.length)return 0;
 let sum=0;for(const n of samples)sum+=n*n;
 const rms=Math.sqrt(sum/samples.length);
 return Math.min(1,Math.max(0,(rms-.008)*5.8));
}
export function createVoiceMeter(){
 let stream,ctx,node,source,data,closed=false;
 const close=()=>{closed=true;try{source?.disconnect();node?.disconnect();}catch{}stream?.getTracks().forEach(t=>t.stop());if(ctx&&ctx.state!=='closed')ctx.close().catch(()=>{});};
 return {async start(){
  try{
   const AC=window.AudioContext||window.webkitAudioContext;
   if(!AC||!navigator.mediaDevices?.getUserMedia)return false;
   ctx=new AC();ctx.resume().catch(()=>{});
   const media=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:false},video:false});
   if(closed){media.getTracks().forEach(t=>t.stop());return false;}
   stream=media;node=ctx.createAnalyser();node.fftSize=512;data=new Float32Array(node.fftSize);
   source=ctx.createMediaStreamSource(stream);source.connect(node);
   if(ctx.state==='suspended')await ctx.resume();
   return !closed&&ctx.state==='running';
  }catch{close();return false;}
 },read(){if(closed||!node||ctx?.state!=='running')return 0;try{node.getFloatTimeDomainData(data);return audioLevel(data);}catch{return 0;}},close};
}
