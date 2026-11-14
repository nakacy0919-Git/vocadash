import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {parseVoice,routeVoice,extractWake,wordCandidates,suggestVoiceWords,speechSegments} from '../lib/voice.js';
import {lookupUniverse,universeEntries} from '../lib/universe';
import {assetImage} from '../lib/learning';
import './VoiceControl.css';
import VoiceOrb from './VoiceOrb';
import {createVoiceMeter} from '../lib/voiceMeter.js';

const drafts=import.meta.glob('../../data/vocabulary-drafts/batches/*.json',{import:'default'});
let draftIndexPromise;
const norm=x=>String(x||'').toLowerCase().trim().replace(/\s+/g,' ');
function draftIndex(){
 if(!draftIndexPromise)draftIndexPromise=Promise.all(Object.values(drafts).map(load=>load())).then(batches=>{
  const index=new Map();
  for(const batch of batches)for(const r of batch.records||[]){
   if(!r.headword||!r.meaningJa||!r.senseId)continue;
   const key=norm(r.headword),list=index.get(key)||[];
   if(!list.some(s=>s.senseId===r.senseId))list.push(r);
   index.set(key,list);
  }
  return index;
 }).catch(e=>{draftIndexPromise=null;throw e;});
 return draftIndexPromise;
}
export default function VoiceControl({current,words,universeOpen,onOpenUniverse,onAppCommand,loadCourseWords,suspended=false}){
 const [open,setOpen]=useState(false),[enabled,setEnabled]=useState(false),[status,setStatus]=useState('マイクを押して開始'),[transcript,setTranscript]=useState(''),[typed,setTyped]=useState(''),[entry,setEntry]=useState(null),[showExamples,setShowExamples]=useState(true),[showJa,setShowJa]=useState(true),[showImage,setShowImage]=useState(true),[showEntryInUniverse,setShowEntryInUniverse]=useState(false);
 const [phase,setPhase]=useState('off'),[micState,setMicState]=useState('off'),[interim,setInterim]=useState(''),[busy,setBusy]=useState(false),[resultOpen,setResultOpen]=useState(false),[helpOpen,setHelpOpen]=useState(false),[suggestions,setSuggestions]=useState([]),[notice,setNotice]=useState('');
 const noticeTimer=useRef(null),commandEpoch=useRef(0);
 const [compact,setCompact]=useState(false),[meterReady,setMeterReady]=useState(false);
 const meter=useRef(null),meterRetry=useRef(false);
 const releaseMeter=()=>{const m=meter.current;meter.current=null;m?.close();setMeterReady(false);};
 const flash=message=>{clearTimeout(noticeTimer.current);setNotice(message);noticeTimer.current=setTimeout(()=>setNotice(''),4200);};
 const phaseRef=useRef('off'),restartFailures=useRef(0);
 const recognition=useRef(null),running=useRef(false),wanted=useRef(false),timer=useRef(null),processing=useRef(false),latest=useRef(null),suspendRef=useRef(suspended);
 const [supports]=useState(()=>typeof window!=='undefined'&&Boolean(window.SpeechRecognition||window.webkitSpeechRecognition));
 const changePhase=value=>{phaseRef.current=value;setPhase(value);};
 const standby=()=>{changePhase('standby');setTranscript('');setStatus('Waiting for Hey, Voca / Voca…');};
 const stop=()=>{releaseMeter();wanted.current=false;commandEpoch.current++;clearTimeout(timer.current);setMicState('off');setInterim('');setBusy(false);changePhase('off');const r=recognition.current;recognition.current=null;try{r?.abort();}catch{}setEnabled(false);};
 const activate=()=>{setCompact(false);changePhase('active');setStatus("I'm listening…");};
 const wakeChime=()=>{try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const ctx=new C();const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(660,ctx.currentTime);o.frequency.setValueAtTime(880,ctx.currentTime+.09);g.gain.setValueAtTime(.035,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.22);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.23);o.onended=()=>{ctx.close().catch(()=>{});};}catch{}};

 const speak=text=>{if(!text||!window.speechSynthesis)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';window.speechSynthesis.speak(u);};
 async function resolveExact(word){
  const k=norm(word),local=words.find(w=>norm(w.word)===k),map=lookupUniverse(k);
  let records=[];try{records=(await draftIndex()).get(k)||[];}catch{}
  let course=local;if(!course&&loadCourseWords)try{course=await loadCourseWords(k);}catch{}
  if(!map&&!course&&!records.length)return null;
  const first=records[0],examples=records.flatMap(r=>(r.examples||[]).map(e=>({...e,senseId:r.senseId})));
  if(course?.english&&!examples.some(e=>e.en===course.english))examples.unshift({en:course.english,ja:course.japanese});
  return {...map,...course,word:course?.word||map?.word||first?.headword||k,meaning:course?.meaning||map?.meaning||first?.meaningJa||'',records,examples,english:course?.english||examples[0]?.en||'',japanese:course?.japanese||examples[0]?.ja||''};
 }
 async function resolve(word){for(const candidate of wordCandidates(word)){const found=await resolveExact(candidate);if(found)return found;}return null;}
 async function candidates(word){let draft=[];try{draft=[...(await draftIndex()).keys()];}catch{}return suggestVoiceWords(word,[...words.map(w=>norm(w.word)),...universeEntries().map(w=>w.word),...draft]);}
 const selected=()=>entry||current;
 async function execute(raw,alternatives=[]){
  if(processing.current)return;
  const epoch=commandEpoch.current;
  const valid=()=>epoch===commandEpoch.current;
  processing.current=true;setBusy(true);setInterim('');setTranscript(raw);setSuggestions([]);
  try{
   const cmd=parseVoice(raw);const {kind,value}=cmd;
   if(kind==='stop'){stop();setStatus('音声操作を停止しました');setResultOpen(false);setHelpOpen(false);return;}
   if(kind==='sleep'){if(wanted.current){setCompact(true);standby();setOpen(false);}else setStatus('先にマイクをオンにしてください');return;}
   if(kind==='help'){setCompact(true);setHelpOpen(true);return;}
   if(kind==='translation'){setShowJa(value==='show');setStatus('Translation '+(value==='show'?'on':'off'));return;}
   if(kind==='images'&&!universeOpen){setShowImage(value==='show');setStatus('Images '+(value==='show'?'on':'off'));return;}
   if(kind==='home'||kind==='close'||kind==='quiz'||kind==='study'||kind==='sentence'||kind==='review'){
    if(kind!=='close')setEntry(null);setShowEntryInUniverse(false);setResultOpen(false);setCompact(true);
    if(kind==='quiz')stop();
    onAppCommand(kind);setStatus(kind==='close'?'VocaDash に戻りました':'画面を切り替えました');return;
   }
   if(universeOpen&&['filter','focus','back','next','list','map','images','read','examples','meaning','search','universe'].includes(kind)){
    const cleaned=wordCandidates(value);const detail={...cmd,value:cleaned.length>1&&!lookupUniverse(cleaned[0])?cleaned.at(-1):value,handled:false,message:''};window.dispatchEvent(new CustomEvent('vd-universe-voice',{detail}));
    if(detail.handled){if(detail.entry){const result=await resolve(detail.entry.word);if(!valid())return;setEntry(result||detail.entry);setShowExamples(kind==='examples');setShowEntryInUniverse(true);setResultOpen(true);}else if(kind==='focus'||kind==='search'||kind==='universe'||kind==='back'||kind==='filter'){setShowEntryInUniverse(false);setResultOpen(false);}if(detail.message?.includes('未登録'))flash(detail.message);else flash(detail.message||'Done');return;}
   }
   if(kind==='next'||kind==='back'){setCompact(true);setEntry(null);setResultOpen(false);onAppCommand(kind);setStatus('OK');return;}
   if(kind==='search'||kind==='focus'||(kind==='universe'&&value)||(kind==='examples'&&value)){
    let result=await resolve(value);
    // Only alternate recognitions of the same command may supply a different search term.
    if(!result)for(const alt of alternatives){const addressed=extractWake(alt);const c=parseVoice(addressed?.command||alt);if(c.kind!==kind||!c.value||c.value===value)continue;result=await resolve(c.value);if(result)break;}
    if(!valid())return;
    if(!result){const guesses=await candidates(value);if(!valid())return;setSuggestions(guesses);flash(guesses.length?'Did you mean…?':'I couldn’t find “'+value+'”. Try again.');return;}
    setEntry(result);setShowExamples(true);setResultOpen(kind!=='universe'&&kind!=='focus');
    if(kind==='universe'||kind==='focus')onOpenUniverse(result);
    flash(result.word+' found');return;
   }
   const target=selected();
   if(kind==='universe'||kind==='filter'){if(!target){setStatus('まず単語を指定してください');return;}
    setResultOpen(false);onOpenUniverse(target,kind==='filter'?value:'all');flash('Opening '+target.word+' universe');return;}
   if(kind==='meaning'||kind==='examples'){if(!target){setStatus('まず単語を指定してください');return;}const result=await resolve(target.word);if(!valid())return;setEntry(result||target);setShowExamples(kind==='examples');setResultOpen(true);flash('Done');return;}
   if(kind==='read'){if(!target){setStatus('まず単語を指定してください');return;}
    const num={first:0,second:1,third:2}[value];const ex=target.examples||[{en:target.english}];
    const line=num===undefined?target.word:ex[num]?.en;if(!line){setStatus('例文は未登録です');return;}speak(line);setStatus('Reading aloud');return;}
   flash('I didn’t catch that. Try again.');
  }catch(e){if(valid())flash('操作できませんでした。もう一度お試しください。');}
  finally{processing.current=false;setBusy(false);}
 }
 latest.current=execute;
 suspendRef.current=suspended;
 function restart(){
  clearTimeout(timer.current);
  if(!wanted.current)return;
  timer.current=setTimeout(()=>{
   if(!wanted.current)return;
   if(document.hidden){stop();setStatus('画面が非表示になったため停止しました');return;}
   if(processing.current||window.speechSynthesis?.speaking||suspendRef.current){restart();return;}
   try{recognition.current?.start();}catch{
    if(++restartFailures.current>=3){stop();setStatus('音声認識を再開できません。マイクを押してください');}
    else restart();
   }
  },450);
 }
 function start(){
  setCompact(false);setOpen(false);setResultOpen(false);setHelpOpen(false);setTranscript('');setInterim('');setSuggestions([]);setNotice('');
  if(!supports){setHelpOpen(true);setStatus('このブラウザでは音声認識非対応です。入力欄をお使いください。');return;}
  if(suspended){flash('音読モードから戻ってから開始してください');return;}
  if(wanted.current){stop();setStatus('停止しました');return;}
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  const r=new SR();recognition.current=r;r.lang='en-US';r.continuous=false;r.interimResults=true;r.maxAlternatives=5;
  restartFailures.current=0;meterRetry.current=false;
  wanted.current=true;setEnabled(true);setMicState('starting');
  changePhase('active');
  setStatus('マイクを許可してください');
  r.onstart=()=>{if(recognition.current!==r||!wanted.current)return;running.current=true;setMicState('listening');restartFailures.current=0;setStatus(phaseRef.current==='standby'?'Waiting for Hey, Voca / Voca…':"I'm listening…");};
  r.onspeechstart=()=>{if(recognition.current===r&&wanted.current)setMicState('speaking');};
  r.onspeechend=()=>{if(recognition.current===r&&wanted.current)setMicState('listening');};
  r.onresult=e=>{
   if(recognition.current!==r||!wanted.current||suspendRef.current||document.hidden||window.speechSynthesis?.speaking||processing.current)return;
   const segments=speechSegments(e);
   if(phaseRef.current==='active'&&segments.interim){setInterim(segments.interim);setMicState('speaking');}
   const alternatives=segments.final.at(-1);if(!alternatives?.length)return;
   setInterim('');
   const routed=routeVoice(alternatives,phaseRef.current);
   if(!routed)return;
   if(routed.kind==='wake'){
    const wasStandby=phaseRef.current==='standby';
    activate();
    if(routed.command)latest.current?.(routed.command,alternatives);
    else{if(wasStandby)wakeChime();setTranscript('Voca');}
    return;
   }
   latest.current?.(routed.command,alternatives);
  };
  r.onerror=e=>{if(recognition.current!==r||!wanted.current)return;if(e.error==='audio-capture'&&meter.current&&!meterRetry.current){meterRetry.current=true;releaseMeter();setMicState('reconnecting');flash('音声認識を優先して再接続します');return;}if(['not-allowed','service-not-allowed','audio-capture','network'].includes(e.error)){stop();flash('音声認識: '+e.error+'（再度マイクを押してください）');}else if(e.error==='no-speech'&&phaseRef.current==='active')setInterim('');};
  r.onend=()=>{if(recognition.current!==r)return;running.current=false;setMicState('reconnecting');if(wanted.current)restart();};
  try{r.start();
   // A separate, local analyser is optional; it never sends or plays audio.
   const m=createVoiceMeter();meter.current=m;m.start().then(ok=>{if(meter.current===m&&wanted.current){setMeterReady(ok);if(!ok)releaseMeter();}});
  }catch{stop();flash('マイクを開始できませんでした');}
 }
 useEffect(()=>{if(suspended&&wanted.current){stop();setStatus('音読と競合しないよう音声操作を停止しました');}},[suspended]);
 useEffect(()=>{
  const hidden=()=>{if(document.hidden&&wanted.current){stop();setStatus('画面が非表示になったため停止しました');}};
  document.addEventListener('visibilitychange',hidden);
  return()=>{document.removeEventListener('visibilitychange',hidden);wanted.current=false;meter.current?.close();meter.current=null;clearTimeout(timer.current);clearTimeout(noticeTimer.current);try{recognition.current?.abort();}catch{}};
 },[]);
 return createPortal(<div className="vd-voice-shell">
  <VoiceOrb enabled={enabled} phase={phase} micState={micState} busy={busy} full={enabled&&!compact&&!resultOpen&&!universeOpen&&!helpOpen} meter={meter} meterReady={meterReady} onMinimize={()=>setCompact(true)} onExpand={()=>{setResultOpen(false);setHelpOpen(false);setCompact(false);}} onStop={()=>{stop();setResultOpen(false);setSuggestions([]);setHelpOpen(false);setNotice('');}} transcript={interim||transcript} interim={Boolean(interim)} notice={notice} suggestions={suggestions} onChoose={word=>{setSuggestions([]);execute('Show me '+word);}}/>
  {helpOpen&&<section className="vd-voice-panel vd-voice-help" aria-label="Voice help">
   <header><strong>Voice commands</strong><button type="button" onClick={()=>setHelpOpen(false)} aria-label="Close help">×</button></header>
   <p>{status}</p><form onSubmit={e=>{e.preventDefault();if(typed.trim()){const addressed=extractWake(typed.trim());if(addressed){if(wanted.current)activate();if(addressed.command)execute(addressed.command);}else execute(typed.trim());setTyped('');setHelpOpen(false);}}}><input aria-label="Type a voice command" value={typed} onChange={e=>setTyped(e.target.value)} placeholder="Show me beautiful"/><button type="submit">Go</button></form>
   <p>Show me beautiful · Open the universe · Expand synonyms · Go to sleep · Stop listening</p><p className="vd-voice-privacy">待機中もマイクを使用します。ブラウザによっては外部の音声認識サービスを利用します。</p>
  </section>}
  {resultOpen&&entry&&(!universeOpen||showEntryInUniverse)&&<section className="vd-voice-panel vd-voice-result" aria-label="Vocabulary search result"><header><small>VOCABULARY RESULT</small><button type="button" onClick={()=>setResultOpen(false)} aria-label="Close result">×</button></header>
   {entry&&(!universeOpen||showEntryInUniverse)&&<div className="vd-voice-entry"><h3>{entry.word}</h3>{showJa&&<p>{entry.meaning}</p>}{entry.image&&showImage&&<img src={assetImage(entry.image)} alt=""/>}<button onClick={()=>speak(entry.word)}>♫ Pronounce</button><button onClick={()=>{setResultOpen(false);onOpenUniverse(entry);}}>◉ Universe</button>
   {entry.records?.length>0&&<small className="vd-voice-draft">追加教材 β・未校閲の語義を含みます</small>}
   {entry.records?.map(r=><div key={r.senseId} className="vd-voice-sense"><b>{r.partOfSpeech} · {r.definitionEn}</b>{showJa&&<p>{r.meaningJa}</p>}{showExamples&&r.examples?.map(e=><div key={e.id}><p>{e.en} <button onClick={()=>speak(e.en)}>♫</button></p>{showJa&&<small>{e.ja}</small>}</div>)}</div>)}
   {!entry.records?.length&&showExamples&&entry.examples?.map((e,i)=><div key={i}><p>{e.en} <button onClick={()=>speak(e.en)}>♫</button></p>{showJa&&<small>{e.ja}</small>}</div>)}</div>}
  </section>}
  <div className="vd-voice-bottom">
   <button type="button" className="vd-voice-help-button" aria-label="Voice help and text input" title="Voice help" onClick={()=>{setCompact(true);setHelpOpen(v=>!v);}}>?</button>
   <div className="vd-voice-launch">
    <button type="button" className={'vd-voice-button vd-voice-round'+(enabled?(phase==='standby'?' standby':' listening'):'')} aria-label={enabled?'Stop microphone':'Start Voice Control'} title={enabled?'Stop microphone':'Start Voice Control'} aria-pressed={enabled} aria-describedby="vd-voice-live" onClick={()=>{if(wanted.current){stop();setOpen(false);setResultOpen(false);setHelpOpen(false);setSuggestions([]);setStatus('音声操作を停止しました');}else start();}}>
     <svg viewBox="0 0 24 24" width="29" height="29" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{enabled?<rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor" stroke="none"/>:<><rect x="9" y="2.5" width="6" height="12" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.5M8.5 21.5h7"/></>}</svg>
    </button>
    <span className="vd-voice-launch-label">{enabled?(phase==='standby'?'Standby':'Listening'):'Voice Control'}</span>
   </div>
  </div>
 </div>,document.body);
}
