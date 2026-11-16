// Keep the utterance alive for WebKit and coordinate the recognizer with model playback.
let active=null;
const signal=playing=>window.dispatchEvent(new CustomEvent('vd-model-speech',{detail:{playing}}));
export function cancelModelSpeech(){
 const previous=active;active=null;
 if(previous){clearTimeout(previous.timer);previous.onStatus?.('idle');}
 if(typeof window!=='undefined'){try{window.speechSynthesis?.cancel();}catch{}if(previous)signal(false);}
}
export function playModelSpeech(text,{rate=0.85,onStatus}={}){
 const value=String(text||'').trim(),synth=window.speechSynthesis;
 if(!value||!synth||!window.SpeechSynthesisUtterance){onStatus?.('error');return false;}
 if(active||synth.speaking||synth.pending)cancelModelSpeech();
 const utterance=new window.SpeechSynthesisUtterance(value);
 utterance.lang='en-US';utterance.rate=Number(rate)||0.85;
 const voice=synth.getVoices().find(v=>v.lang==='en-US'&&v.localService)||synth.getVoices().find(v=>v.lang==='en-US');
 if(voice)utterance.voice=voice;
 const session={utterance,onStatus,timer:null};active=session;
 const finish=status=>{if(active!==session)return;clearTimeout(session.timer);active=null;signal(false);onStatus?.(status);};
 utterance.onstart=()=>{if(active!==session)return;clearTimeout(session.timer);onStatus?.('playing');session.timer=setTimeout(()=>{if(active===session){finish('error');synth.cancel();}},Math.max(15000,value.length*180));};
 utterance.onend=()=>finish('idle');utterance.onerror=()=>finish('error');
 signal(true);onStatus?.('starting');
 session.timer=setTimeout(()=>{if(active===session){finish('error');synth.cancel();}},7000);
 try{if(synth.paused)synth.resume();synth.speak(utterance);return true;}catch{finish('error');return false;}
}
