import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {parseVoice,extractWake} from '../lib/voice.js';
import {lookupUniverse} from '../lib/universe';
import {assetImage} from '../lib/learning';
import './VoiceControl.css';

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
 const [voiceMode,setVoiceMode]=useState('direct'),[wakePreference,setWakePreference]=useState('both'),[phase,setPhase]=useState('off');
 const modeRef=useRef('direct'),wakeRef=useRef('both'),phaseRef=useRef('off'),idleTimer=useRef(null),activeUntil=useRef(0),restartFailures=useRef(0);
 const recognition=useRef(null),running=useRef(false),wanted=useRef(false),timer=useRef(null),processing=useRef(false),latest=useRef(null),suspendRef=useRef(suspended);
 const [supports]=useState(()=>typeof window!=='undefined'&&Boolean(window.SpeechRecognition||window.webkitSpeechRecognition));
 const changePhase=value=>{phaseRef.current=value;setPhase(value);};
 const standby=()=>{clearTimeout(idleTimer.current);activeUntil.current=0;changePhase('standby');setTranscript('');setStatus('Waiting for '+(wakeRef.current==='hey'?'Hey, Voca':wakeRef.current==='short'?'Voca':'Hey, Voca / Voca')+'…');};
 const stop=()=>{wanted.current=false;clearTimeout(timer.current);clearTimeout(idleTimer.current);activeUntil.current=0;changePhase('off');const r=recognition.current;recognition.current=null;try{r?.abort();}catch{}setEnabled(false);};
 const extendActive=()=>{clearTimeout(idleTimer.current);activeUntil.current=Date.now()+45000;idleTimer.current=setTimeout(()=>{if(wanted.current&&modeRef.current==='wake')standby();},45000);};
 const activate=()=>{changePhase('active');setOpen(true);setStatus("I'm listening…");extendActive();};
 const wakeChime=()=>{try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const ctx=new C();const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(660,ctx.currentTime);o.frequency.setValueAtTime(880,ctx.currentTime+.09);g.gain.setValueAtTime(.035,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.22);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.23);o.onended=()=>{ctx.close().catch(()=>{});};}catch{}};

 const speak=text=>{if(!text||!window.speechSynthesis)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';window.speechSynthesis.speak(u);};
 async function resolve(word){
  const k=norm(word),local=words.find(w=>norm(w.word)===k),map=lookupUniverse(k);
  let records=[];try{records=(await draftIndex()).get(k)||[];}catch{}
  let course=local;if(!course&&loadCourseWords)try{course=await loadCourseWords(k);}catch{}
  if(!map&&!course&&!records.length)return null;
  const first=records[0],examples=records.flatMap(r=>(r.examples||[]).map(e=>({...e,senseId:r.senseId})));
  if(course?.english&&!examples.some(e=>e.en===course.english))examples.unshift({en:course.english,ja:course.japanese});
  return {...map,...course,word:course?.word||map?.word||first?.headword||k,meaning:course?.meaning||map?.meaning||first?.meaningJa||'',records,examples,english:course?.english||examples[0]?.en||'',japanese:course?.japanese||examples[0]?.ja||''};
 }
 const selected=()=>entry||current;
 async function execute(raw){
  if(processing.current)return;
  processing.current=true;setTranscript(raw);
  try{
   const cmd=parseVoice(raw);const {kind,value}=cmd;
   if(kind==='stop'){stop();setStatus('音声操作を停止しました');return;}
   if(kind==='sleep'){if(wanted.current&&modeRef.current==='wake'){standby();setOpen(false);}else{stop();setStatus('音声操作を停止しました');}return;}
   if(kind==='help'){setOpen(true);setStatus('下のコマンド例をお試しください');return;}
   if(kind==='translation'){setShowJa(value==='show');setStatus('Translation '+(value==='show'?'on':'off'));return;}
   if(kind==='images'&&!universeOpen){setShowImage(value==='show');setStatus('Images '+(value==='show'?'on':'off'));return;}
   if(kind==='home'||kind==='close'||kind==='quiz'||kind==='study'||kind==='sentence'||kind==='review'){
    if(kind!=='close')setEntry(null);setShowEntryInUniverse(false);
    if(kind==='quiz')stop();
    onAppCommand(kind);setStatus(kind==='close'?'VocaDash に戻りました':'画面を切り替えました');return;
   }
   if(universeOpen&&['filter','focus','back','next','list','map','images','read','examples','meaning','search','universe'].includes(kind)){
    const detail={...cmd,handled:false,message:''};window.dispatchEvent(new CustomEvent('vd-universe-voice',{detail}));
    if(detail.handled){if(detail.entry){const result=await resolve(detail.entry.word);setEntry(result||detail.entry);setShowExamples(kind==='examples');setShowEntryInUniverse(true);}else if(kind==='focus'||kind==='search'||kind==='universe'||kind==='back'||kind==='filter'){setShowEntryInUniverse(false);}setStatus(detail.message||'OK');return;}
   }
   if(kind==='next'||kind==='back'){setEntry(null);onAppCommand(kind);setStatus('OK');return;}
   if(kind==='search'||kind==='focus'||(kind==='universe'&&value)||(kind==='examples'&&value)){
    const result=await resolve(value);if(!result){setStatus('未登録: '+value);return;}
    setEntry(result);setShowExamples(true);
    if(kind==='universe'||kind==='focus')onOpenUniverse(result);
    setStatus(result.word+' found');return;
   }
   const target=selected();
   if(kind==='universe'||kind==='filter'){if(!target){setStatus('まず単語を指定してください');return;}
    onOpenUniverse(target,kind==='filter'?value:'all');setStatus('Opening '+target.word+' universe');return;}
   if(kind==='meaning'||kind==='examples'){if(!target){setStatus('まず単語を指定してください');return;}const result=await resolve(target.word);setEntry(result||target);setShowExamples(kind==='examples');setStatus('OK');return;}
   if(kind==='read'){if(!target){setStatus('まず単語を指定してください');return;}
    const num={first:0,second:1,third:2}[value];const ex=target.examples||[{en:target.english}];
    const line=num===undefined?target.word:ex[num]?.en;if(!line){setStatus('例文は未登録です');return;}speak(line);setStatus('Reading aloud');return;}
   setStatus('認識した語: '+raw+' — コマンド例をお試しください');
  }catch(e){setStatus('操作できませんでした。もう一度お試しください。');}
  finally{processing.current=false;}
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
 function start(mode=voiceMode){
  if(!supports){setStatus('このブラウザでは音声認識非対応です。入力欄をお使いください。');return;}
  if(suspended){setStatus('音読モードから戻ってから開始してください');return;}
  if(wanted.current){stop();setStatus('停止しました');return;}
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  const r=new SR();recognition.current=r;r.lang='en-US';r.continuous=false;r.interimResults=false;r.maxAlternatives=3;
  modeRef.current=mode;wakeRef.current=wakePreference;restartFailures.current=0;
  wanted.current=true;setEnabled(true);setOpen(true);
  if(mode==='wake')standby();else changePhase('active');
  setStatus('マイクを許可してください');
  r.onstart=()=>{if(recognition.current!==r||!wanted.current)return;running.current=true;restartFailures.current=0;setStatus(phaseRef.current==='standby'?'Waiting for '+(wakeRef.current==='hey'?'Hey, Voca':wakeRef.current==='short'?'Voca':'Hey, Voca / Voca')+'…':"I'm listening…");};
  r.onresult=e=>{
   if(recognition.current!==r||!wanted.current||suspendRef.current||document.hidden||window.speechSynthesis?.speaking||processing.current)return;
   const result=e.results[e.resultIndex];const alternatives=Array.from(result||[]).map(x=>x.transcript).filter(Boolean);
   if(!alternatives.length)return;
   const text=alternatives[0];
   if(modeRef.current==='wake'){
    if(phaseRef.current==='active'&&Date.now()>activeUntil.current)standby();
    const found=alternatives.map(x=>extractWake(x,wakeRef.current)).find(x=>x!==null);
    if(phaseRef.current==='standby'){
     if(!found)return;
     activate();
     if(found.command)latest.current?.(found.command);else{wakeChime();setTranscript('Voca');}
     return;
    }
    if(found){extendActive();if(found.command)latest.current?.(found.command);else setStatus("I'm listening…");return;}
    const command=alternatives.find(x=>parseVoice(x).kind!=='unknown');
    if(!command)return;
    extendActive();latest.current?.(command);return;
   }
   latest.current?.(alternatives.find(x=>parseVoice(x).kind!=='unknown')||text);
  };
  r.onerror=e=>{if(recognition.current!==r||!wanted.current)return;if(['not-allowed','service-not-allowed','audio-capture','network'].includes(e.error)){stop();setStatus('音声認識: '+e.error+'（再度マイクを押してください）');}};
  r.onend=()=>{running.current=false;if(wanted.current&&recognition.current===r)restart();};
  try{r.start();}catch{stop();setStatus('マイクを開始できませんでした');}
 }
 useEffect(()=>{if(suspended&&wanted.current){stop();setStatus('音読と競合しないよう音声操作を停止しました');}},[suspended]);
 useEffect(()=>{
  const hidden=()=>{if(document.hidden&&wanted.current){stop();setStatus('画面が非表示になったため停止しました');}};
  document.addEventListener('visibilitychange',hidden);
  return()=>{document.removeEventListener('visibilitychange',hidden);wanted.current=false;clearTimeout(timer.current);clearTimeout(idleTimer.current);try{recognition.current?.abort();}catch{}};
 },[]);
 return createPortal(<div className="vd-voice-shell">
  {open&&<section className="vd-voice-panel" aria-label="Voice Control">
   <header><strong>VOCADASH · VOICE BETA</strong><button type="button" onClick={()=>{stop();setOpen(false);}} aria-label="Close voice control">×</button></header>
   <div className="vd-voice-mode" role="group" aria-label="Voice activation mode">
    <button type="button" disabled={enabled} aria-pressed={voiceMode==='direct'} onClick={()=>setVoiceMode('direct')}>Hands-free</button>
    <button type="button" disabled={enabled} aria-pressed={voiceMode==='wake'} onClick={()=>setVoiceMode('wake')}>Wake Word</button>
   </div>
   {voiceMode==='wake'&&<label className="vd-wake-option">呼びかけ <select disabled={enabled} value={wakePreference} onChange={e=>setWakePreference(e.target.value)}><option value="both">Hey, Voca / Voca</option><option value="hey">Hey, Voca のみ</option><option value="short">Voca のみ</option></select></label>}
   <p className="vd-voice-privacy">{voiceMode==='wake'?'待機中もマイクを利用します。ブラウザによっては外部の音声認識サービスに音声が送信されます。45秒間指示がないと待機に戻ります。':'マイクを許可して音声操作します。ブラウザによっては外部の音声認識サービスを利用します。'}</p>
   <div className={'vd-voice-status phase-'+phase} role="status">{status}</div>
   {enabled&&voiceMode==='wake'&&<div className="vd-wake-actions"><button type="button" onClick={()=>{if(phaseRef.current==='standby')activate();else standby();}}>{phase==='standby'?'Activate now':'Standby'}</button><button type="button" onClick={()=>{setOpen(false);}}>Minimize</button></div>}
   {transcript&&<p className="vd-voice-transcript">“{transcript}”</p>}
   <form onSubmit={e=>{e.preventDefault();if(typed.trim()){execute(typed.trim());setTyped('');}}}><input aria-label="Type a voice command" value={typed} onChange={e=>setTyped(e.target.value)} placeholder="Show me connect"/><button type="submit">Go</button></form>
   {entry&&(!universeOpen||showEntryInUniverse)&&<div className="vd-voice-entry"><h3>{entry.word}</h3>{showJa&&<p>{entry.meaning}</p>}{entry.image&&showImage&&<img src={assetImage(entry.image)} alt=""/>}<button onClick={()=>speak(entry.word)}>♫ Pronounce</button><button onClick={()=>onOpenUniverse(entry)}>◉ Universe</button>
   {entry.records?.length>0&&<small className="vd-voice-draft">追加教材 β・未校閲の語義を含みます</small>}
   {entry.records?.map(r=><div key={r.senseId} className="vd-voice-sense"><b>{r.partOfSpeech} · {r.definitionEn}</b>{showJa&&<p>{r.meaningJa}</p>}{showExamples&&r.examples?.map(e=><div key={e.id}><p>{e.en} <button onClick={()=>speak(e.en)}>♫</button></p>{showJa&&<small>{e.ja}</small>}</div>)}</div>)}
   {!entry.records?.length&&showExamples&&entry.examples?.map((e,i)=><div key={i}><p>{e.en} <button onClick={()=>speak(e.en)}>♫</button></p>{showJa&&<small>{e.ja}</small>}</div>)}</div>}
   <details><summary>Voice command examples</summary><p>Show me connect · Open the universe · Expand synonyms · Show me word families · Focus on connection · Show me collocations · Show word forms · Next page · Go back · Read it aloud · Hey Voca · Voca · Go to sleep · Stop listening</p></details>
  </section>}
  <div className="vd-voice-bottom">{enabled&&!open&&<button type="button" className="vd-voice-button" onClick={()=>setOpen(true)}>{phase==='standby'?'Waiting for Voca…':'Listening…'}</button>}<button type="button" className={'vd-voice-button'+(enabled?(phase==='standby'?' standby':' listening'):'')} aria-pressed={enabled} onClick={()=>{if(!open&&!enabled){setOpen(true);return;}setOpen(true);start();}}><span aria-hidden="true">🎙</span> {enabled?'Stop mic':open?'Enable mic':'Voice Control'}</button></div>
 </div>,document.body);
}
