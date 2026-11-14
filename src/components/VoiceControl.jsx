import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {parseVoice} from '../lib/voice.js';
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
 const recognition=useRef(null),running=useRef(false),wanted=useRef(false),timer=useRef(null),processing=useRef(false),latest=useRef(null),suspendRef=useRef(suspended);
 const [supports]=useState(()=>typeof window!=='undefined'&&Boolean(window.SpeechRecognition||window.webkitSpeechRecognition));
 const stop=()=>{wanted.current=false;clearTimeout(timer.current);try{recognition.current?.abort();}catch{}setEnabled(false);};
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
   if(processing.current||window.speechSynthesis?.speaking||suspendRef.current||document.hidden){restart();return;}
   try{recognition.current?.start();}catch{restart();}
  },450);
 }
 function start(){
  if(!supports){setStatus('このブラウザでは音声認識非対応です。入力欄をお使いください。');return;}
  if(suspended){setStatus('音読モードから戻ってから開始してください');return;}
  if(wanted.current){stop();setStatus('停止しました');return;}
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  const r=new SR();recognition.current=r;r.lang='en-US';r.continuous=false;r.interimResults=false;r.maxAlternatives=1;
  wanted.current=true;setEnabled(true);setOpen(true);setStatus('マイクを許可してください');
  r.onstart=()=>{running.current=true;setStatus('Listening…');};
  r.onresult=e=>{if(!wanted.current||suspendRef.current)return;const text=e.results[e.resultIndex]?.[0]?.transcript;if(text)latest.current?.(text);};
  r.onerror=e=>{if(['not-allowed','service-not-allowed','audio-capture','network'].includes(e.error)){wanted.current=false;setEnabled(false);setStatus('音声認識: '+e.error+'（再度マイクを押してください）');}};
  r.onend=()=>{running.current=false;if(wanted.current&&recognition.current===r)restart();};
  try{r.start();}catch{stop();setStatus('マイクを開始できませんでした');}
 }
 useEffect(()=>{if(suspended&&wanted.current){stop();setStatus('音読と競合しないよう音声操作を停止しました');}},[suspended]);
 useEffect(()=>()=>{wanted.current=false;clearTimeout(timer.current);try{recognition.current?.abort();}catch{}},[]);
 return createPortal(<div className="vd-voice-shell">
  {open&&<section className="vd-voice-panel" aria-label="Voice Control">
   <header><strong>VOCADASH · VOICE BETA</strong><button type="button" onClick={()=>{stop();setOpen(false);}} aria-label="Close voice control">×</button></header>
   <div role="status" className="vd-voice-status">{status}</div>
   {transcript&&<p className="vd-voice-transcript">“{transcript}”</p>}
   <form onSubmit={e=>{e.preventDefault();if(typed.trim()){execute(typed.trim());setTyped('');}}}><input aria-label="Type a voice command" value={typed} onChange={e=>setTyped(e.target.value)} placeholder="Show me connect"/><button type="submit">Go</button></form>
   {entry&&(!universeOpen||showEntryInUniverse)&&<div className="vd-voice-entry"><h3>{entry.word}</h3>{showJa&&<p>{entry.meaning}</p>}{entry.image&&showImage&&<img src={assetImage(entry.image)} alt=""/>}<button onClick={()=>speak(entry.word)}>♫ Pronounce</button><button onClick={()=>onOpenUniverse(entry)}>◉ Universe</button>
   {entry.records?.length>0&&<small className="vd-voice-draft">追加教材 β・未校閲の語義を含みます</small>}
   {entry.records?.map(r=><div key={r.senseId} className="vd-voice-sense"><b>{r.partOfSpeech} · {r.definitionEn}</b>{showJa&&<p>{r.meaningJa}</p>}{showExamples&&r.examples?.map(e=><div key={e.id}><p>{e.en} <button onClick={()=>speak(e.en)}>♫</button></p>{showJa&&<small>{e.ja}</small>}</div>)}</div>)}
   {!entry.records?.length&&showExamples&&entry.examples?.map((e,i)=><div key={i}><p>{e.en} <button onClick={()=>speak(e.en)}>♫</button></p>{showJa&&<small>{e.ja}</small>}</div>)}</div>}
   <details><summary>Voice command examples</summary><p>Show me connect · Open the universe · Expand synonyms · Show me word families · Focus on connection · Show me collocations · Show word forms · Next page · Go back · Read it aloud · Stop listening</p></details>
  </section>}
  <button type="button" className={'vd-voice-button'+(enabled?' listening':'')} aria-pressed={enabled} onClick={()=>{setOpen(true);start();}}><span aria-hidden="true">🎙</span> {enabled?'Stop voice':'Voice Control'}</button>
 </div>,document.body);
}
