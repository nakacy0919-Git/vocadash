import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {scoreReading} from '../lib/reading.js';
import {targetParts} from '../lib/redSheet.js';
import './BookReading.css';

const PREFIX='vd-vocasheet-reading-v1:';
export const bookReadKey=(w,ex)=>PREFIX+encodeURIComponent(JSON.stringify([w.id,ex.en]));
export function readBookHistory(key){
 try{const h=JSON.parse(localStorage.getItem(key)||'null');if(h&&Array.isArray(h.attempts))return h;}catch{/* storage unavailable */}
 return {count:0,best:0,attempts:[]};
}
function saveHistory(key,percent,stage,level){
 const old=readBookHistory(key),attempt={percent,stage,level,at:Date.now()};
 const next={count:(old.count||0)+1,best:Math.max(old.best||0,percent),attempts:[attempt,...old.attempts]};
 try{localStorage.setItem(key,JSON.stringify(next));return {history:next,saved:true};}catch{return {history:next,saved:false};}
}
const dateText=at=>new Intl.DateTimeFormat('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(at);
export function BookReadingBadge({history,filtered,onClick}){
 const last=history.attempts[0];
 const content=<><span className="br-badge-mic">🎙 音読</span><span className="br-badge-count">{history.count||0}回</span>{last&&<><span className={'br-badge-score'+(last.percent>=90?' br-good':'')}>{last.percent}%</span><span className="br-badge-best">最高 {history.best}%</span><span className="br-badge-date">{dateText(last.at)}</span></>}</>;
 return filtered?<span className="br-badge">{content}</span>:<button type="button" className="br-badge" onClick={onClick} title="例文の音読・過去の記録" aria-label="例文を音読する。学習回数と履歴を表示">{content}</button>;
}
const descriptions=[['全文表示','ターゲット語を隠す','25%穴埋め'],['40%穴埋め','60%穴埋め','80%穴埋め']];
export function maskBookSentence(sentence,word,stage,level){
 const pieces=targetParts(sentence,word).flatMap(p=>p.text.split(/(\s+)/).filter(Boolean).map(text=>({text,target:p.target,word:/[\p{L}\p{N}]/u.test(text)})));
 if(stage===1&&level===1)return pieces;
 const words=pieces.filter(p=>p.word),targets=words.filter(p=>p.target),rest=words.filter(p=>!p.target);
 const fraction=stage===1?(level===2?0:.25):[.4,.6,.8][level-1];
 const count=Math.max(targets.length||1,Math.ceil(words.length*fraction));
 const extra=Math.min(rest.length,Math.max(0,count-targets.length));
 const hidden=new Set([...targets,...rest.map((p,i)=>({p,rank:(i*37+17)%101})).sort((a,b)=>a.rank-b.rank).slice(0,extra).map(x=>x.p)]);
 return pieces.map(p=>({...p,hidden:hidden.has(p)}));
}
let audio;
function primeAudio(enabled){
 if(!enabled)return;
 try{const C=window.AudioContext||window.webkitAudioContext;if(C){audio||=new C();if(audio.state==='suspended')audio.resume().catch(()=>{});}}catch{/* optional sound */}
}
function chime(enabled,percent){
 if(!enabled||!audio)return;
 try{const t=audio.currentTime;[523.25,659.25,783.99,1046.5,...(percent===100?[1318.51]:[])].forEach((freq,i)=>{const o=audio.createOscillator(),g=audio.createGain(),s=t+i*.12;o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.001,s);g.gain.exponentialRampToValueAtTime(.11,s+.025);g.gain.exponentialRampToValueAtTime(.001,s+.34);o.connect(g);g.connect(audio.destination);o.start(s);o.stop(s+.36);});}catch{/* optional sound */}
}
export default function BookReading({entry,sound,onStopAudio,onModel,onClose,nextEntry,onNext,onSaved}){
 const [stage,setStage]=useState(1),[level,setLevel]=useState(1),[phase,setPhase]=useState('idle'),[transcript,setTranscript]=useState(''),[result,setResult]=useState(null),[status,setStatus]=useState('音読開始を押して練習しましょう。'),[history,setHistory]=useState(()=>readBookHistory(entry.key)),[showHistory,setShowHistory]=useState(false),[celebrate,setCelebrate]=useState(false);
 const session=useRef(null),closeButton=useRef(null),timer=useRef(null);
 function release(){
  const s=session.current;session.current=null;
  if(s){clearTimeout(s.finishTimer);clearTimeout(s.restartTimer);const r=s.recognition;if(r){r.onresult=r.onend=r.onerror=null;try{r.abort();}catch{/* already ended */}}}
 }
 useEffect(()=>{closeButton.current?.focus();const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=old;release();clearTimeout(timer.current);};},[]);
 useEffect(()=>{setHistory(readBookHistory(entry.key));setShowHistory(false);},[entry.key]);
 function clearResult(){setTranscript('');setResult(null);setCelebrate(false);clearTimeout(timer.current);}
 function finish(s){
  if(session.current!==s||s.finished)return;
  s.finished=true;const heard=[s.base,s.final,s.interim].filter(Boolean).join(' ').trim();
  release();setPhase('idle');setTranscript(heard);
  if(!heard){setStatus('音声を認識できませんでした。マイクと通信環境を確認してください。');return;}
  const score=scoreReading(s.entry.ex.en,heard);setResult(score);
  const saved=saveHistory(s.entry.key,score.percent,s.stage,s.level);setHistory(saved.history);if(saved.saved)onSaved?.();
  setStatus((score.percent>=90?'Excellent! 合格！':'もう一度、聞き取れなかった語を意識して音読しましょう。')+(saved.saved?'':' 端末の保存容量または設定により履歴を保存できませんでした。'));
  if(score.percent>=90){setCelebrate(true);chime(sound,score.percent);timer.current=setTimeout(()=>setCelebrate(false),2200);}
 }
 function start(target=entry){
  if(session.current)return;
  clearResult();primeAudio(sound);onStopAudio?.();window.speechSynthesis?.cancel();
  const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Speech){setStatus('このブラウザーは音声認識に対応していません。対応するSafariやChromeをお試しください。');return;}
  const s={entry:target,stage,level,base:'',final:'',interim:'',restarts:0,stopping:false,finished:false};session.current=s;setPhase('listening');setStatus('音読中… 読み終わったら「終了・判定」を押してください。');
  const connect=()=>{
   if(session.current!==s||s.stopping)return;
   let r;try{r=new Speech();r.lang='en-US';r.continuous=true;r.interimResults=true;r.maxAlternatives=1;s.recognition=r;}catch{release();setPhase('idle');setStatus('マイクの準備に失敗しました。');return;}
   const current=()=>session.current===s&&s.recognition===r;
   r.onresult=e=>{if(!current())return;const f=[],i=[];for(const x of Array.from(e.results)){const t=String(x[0]?.transcript||'').trim();if(t)(x.isFinal?f:i).push(t);}s.final=f.join(' ');s.interim=i.join(' ');setTranscript([s.base,s.final,s.interim].filter(Boolean).join(' '));};
   r.onerror=e=>{if(!current())return;if(['not-allowed','service-not-allowed','audio-capture','language-not-supported','network'].includes(e.error)){release();setPhase('idle');setStatus('音声認識を利用できません（'+e.error+'）。マイクの許可や接続を確認してください。');}};
   r.onend=()=>{if(!current())return;s.recognition=null;if(s.stopping||s.final||s.interim){finish(s);return;}if(++s.restarts<=2)s.restartTimer=setTimeout(connect,260);else finish(s);};
   try{r.start();}catch{release();setPhase('idle');setStatus('音声認識を開始できませんでした。「音読開始」を押して再試行してください。');}
  };
  connect();
 }
 function stop(){const s=session.current;if(!s||s.stopping)return;primeAudio(sound);s.stopping=true;setPhase('stopping');clearTimeout(s.restartTimer);s.finishTimer=setTimeout(()=>finish(s),1500);if(s.recognition){try{s.recognition.stop();}catch{finish(s);}}else finish(s);}
 function advance(){if(session.current||!nextEntry)return;const next=onNext?.();if(next){setHistory(readBookHistory(next.key));setShowHistory(false);start(next);}}
 function changeStage(n){setStage(n);setLevel(1);clearResult();setStatus('音読開始を押して練習しましょう。');}
 function changeLevel(n){setLevel(n);clearResult();setStatus('音読開始を押して練習しましょう。');}
 const busy=phase!=='idle';
 return createPortal(<div className="br-overlay" role="dialog" aria-modal="true" aria-label="例文音読練習" onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape'){release();onStopAudio?.();onClose();}}}>
  <section className="br-modal">
   <header className="br-header"><div><small>VOCADASH / SPEAK &amp; MASTER</small><b>例文音読トレーニング</b></div><button ref={closeButton} type="button" className="br-close" onClick={()=>{release();onStopAudio?.();onClose();}} aria-label="閉じる">×</button></header>
   <div className="br-main">
    <div className="br-stages">{[1,2].map(n=><button type="button" key={n} disabled={busy} aria-pressed={stage===n} onClick={()=>changeStage(n)}>STAGE {n} <small>{n===1?'基礎':'定着チャレンジ'}</small></button>)}</div>
    <div className="br-levels">{[1,2,3].map(n=><button type="button" key={n} disabled={busy} aria-pressed={level===n} onClick={()=>changeLevel(n)}>LEVEL {n}<small>{descriptions[stage-1][n-1]}</small></button>)}</div>
    <div className="br-target"><small>TARGET WORD · No. {entry.w.bookNumber} / EX {entry.index+1}</small><strong>{entry.w.word}</strong><span>{entry.w.meaning}</span></div>
    <div className="br-sentence" lang="en">{maskBookSentence(entry.ex.en,entry.w.word,stage,level).map((p,i)=>p.hidden?<span className="br-blank" key={i} aria-label="空欄">{'＿'.repeat(Math.min(7,Math.max(2,p.text.replace(/[^\p{L}\p{N}]/gu,'').length)))}</span>:<span key={i} className={p.target?'br-target-ink':undefined}>{p.text}</span>)}</div>
    <div className="br-transcript" aria-live="polite"><small>YOUR VOICE / 文字起こし</small><p>{result?result.wordMatches.map((w,i)=><span key={i} className={w.matched?'br-match':'br-miss'}>{w.value} </span>):transcript||'ここに認識した英語が表示されます。'}</p></div>
    {result&&<div className={'br-result'+(result.percent>=90?' br-pass':'')}><small>ACCURACY</small><strong>{result.percent}%</strong><b>{result.percent>=90?'★ EXCELLENT!':'KEEP GOING!'}</b>{result.missedWords.length>0&&<span>要確認：{result.missedWords.join(' / ')}</span>}</div>}
    {celebrate&&<div className="br-confetti" aria-hidden="true">{Array.from({length:24},(_,i)=><i key={i} style={{'--x':(i*41)%100+'%','--d':(i%7)*.045+'s','--c':['#f9c75e','#65d8b1','#ff879d','#91c7ff'][i%4]}}/>)}</div>}
    <p className="br-status" role="status">{status}</p>
    <div className="br-history"><button type="button" aria-expanded={showHistory} onClick={()=>setShowHistory(v=>!v)}>学習履歴 {history.count||0}回 · 最高 {history.count?history.best+'%':'—'} {showHistory?'▴':'▾'}</button>{showHistory&&<div className="br-history-list">{history.attempts.length?history.attempts.map((a,i)=><div key={i}><span>{new Date(a.at).toLocaleString('ja-JP')}</span><span>S{a.stage} · L{a.level}</span><b>{a.percent}%</b></div>):'まだ記録がありません。'}</div>}</div>
   </div>
   <footer className="br-footer"><button type="button" disabled={busy||!sound} onClick={()=>onModel?.(entry)}>♫ お手本</button><button type="button" className="br-start" disabled={phase==='stopping'} onClick={busy?stop:()=>start()}>{phase==='stopping'?'判定中…':busy?'■ 終了・判定':result?'🎙 もう一度':'🎙 音読開始'}</button><button type="button" className="br-next" disabled={busy||!nextEntry} onClick={advance}>次の例文 →</button></footer>
   <div className="br-note">Accuracyは音声認識結果と例文の語順の一致率です。発音の質そのものではありません。履歴はこのブラウザーに保存されます。</div>
  </section>
 </div>,document.body);
}
