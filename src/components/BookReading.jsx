import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {scoreReading} from '../lib/reading.js';
import {targetParts} from '../lib/redSheet.js';
import './BookReading.css';

function ReadingIcon({name}){
 const shapes={
  mic:<><rect x="9" y="2.5" width="6" height="12" rx="3"/><path d="M5.5 10.5v1.5a6.5 6.5 0 0 0 13 0v-1.5M12 18.5v3m-3 0h6"/></>,
  stop:<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>,
  retry:<><path d="M3.5 11a8.5 8.5 0 1 1 2.7 7.2M3.5 5.5V11H9"/></>,
  next:<path d="M4 12h15m-6-6 6 6-6 6"/>,
  volume:<><path d="M3 9h4l5-4v14l-5-4H3zM16 9a4 4 0 0 1 0 6m2-9a8 8 0 0 1 0 12"/></>,
  settings:<><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="10" cy="18" r="2" fill="currentColor" stroke="none"/></>,
  history:<><path d="M3 11a9 9 0 1 1 3 7M3 5v6h6m3-4v5l3 2"/></>,
  close:<path d="m6 6 12 12M18 6 6 18"/>
 };
 return <svg className="br-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]}</svg>;
}
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
 const content=<><span className="br-badge-mic"><ReadingIcon name="mic"/></span><span className="br-badge-count">{history.count||0}回</span>{last&&<><span className={'br-badge-score'+(last.percent>=90?' br-good':'')}>{last.percent}%</span><span className="br-badge-best">最高 {history.best}%</span><span className="br-badge-date">{dateText(last.at)}</span></>}</>;
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
function AccuracyGauge({percent,live,passed}){
 const p=Number.isFinite(percent)?Math.min(100,Math.max(0,percent)):0;
 const color=passed?'#91b477':'#cbb477';
 return <div className={'br-gauge'+(passed?' br-gauge-pass':'')+(live?' br-gauge-live':'')}><svg viewBox="0 0 220 220" aria-hidden="true"><defs><linearGradient id="br-meter-gradient" x1="0" y1="1" x2="1" y2="0"><stop stopColor="#64844b"/><stop offset=".55" stopColor={color}/><stop offset="1" stopColor="#d6b36b"/></linearGradient></defs><circle cx="110" cy="110" r="101" fill="none" stroke="#a48a61" strokeOpacity=".18" strokeDasharray="2 7"/><circle cx="110" cy="110" r="86" fill="none" stroke="#a89975" strokeOpacity=".14" strokeWidth="13"/><circle className="br-gauge-arc" cx="110" cy="110" r="86" fill="none" stroke="url(#br-meter-gradient)" strokeWidth="13" strokeLinecap="round" pathLength="100" strokeDasharray={p+' 100'} transform="rotate(-90 110 110)"/><circle cx="110" cy="110" r="69" stroke="#b39c6b" strokeOpacity=".09" fill="none"/></svg><div className="br-gauge-center"><small>ACCURACY</small><strong>{percent===null?'—':p}<span>%</span></strong><b>{live?'LISTENING':passed?'✦ EXCELLENT':percent===null?'READY':'KEEP GOING'}</b></div></div>;
}
function HistoryGraph({attempts}){
 const recent=attempts.slice(0,10).reverse();
 if(!recent.length)return <div className="br-trend-empty">音読すると記録が表示されます</div>;
 const pts=recent.map((a,i)=>[recent.length===1?95:8+i*174/(recent.length-1),76-a.percent*.64]);
 return <svg viewBox="0 0 190 90" role="img" aria-label="最近のAccuracyの推移"><defs><linearGradient id="br-trend-fill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#87a16b" stopOpacity=".38"/><stop offset="1" stopColor="#87a16b" stopOpacity="0"/></linearGradient></defs>{[12,44,76].map(y=><line key={y} x1="8" y1={y} x2="182" y2={y} stroke="#b39b74" strokeOpacity=".18" strokeDasharray="3 4"/>)}{pts.length>1&&<><polygon points={pts.map(p=>p.join(',')).join(' ')+' 182,76 8,76'} fill="url(#br-trend-fill)"/><polyline points={pts.map(p=>p.join(',')).join(' ')} fill="none" stroke="#64844b" strokeWidth="2.5" strokeLinejoin="round"/></>}{pts.map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i===pts.length-1?4:2.5} fill="#b58b42"/>)}<text x="8" y="88" fontSize="7" fill="#8a7559">OLD</text><text x="182" y="88" textAnchor="end" fontSize="7" fill="#8a7559">NEW</text></svg>;
}
export default function BookReading({entry,sound,onStopAudio,onModel,onClose,nextEntry,onNext,onSaved}){
 const [stage,setStage]=useState(1),[level,setLevel]=useState(1),[phase,setPhase]=useState('idle'),[transcript,setTranscript]=useState(''),[result,setResult]=useState(null),[status,setStatus]=useState('音読開始を押して練習しましょう。'),[history,setHistory]=useState(()=>readBookHistory(entry.key)),[showHistory,setShowHistory]=useState(false),[celebrate,setCelebrate]=useState(false);
 const session=useRef(null),closeButton=useRef(null),timer=useRef(null);
 const [showSettings,setShowSettings]=useState(false);
 const difficulty=(stage-1)*3+level-1;
 function selectDifficulty(n){setStage(Math.floor(n/3)+1);setLevel(n%3+1);clearResult();setStatus('音読開始を押して練習しましょう。');setShowSettings(false);}

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

 const busy=phase!=='idle';
 return createPortal(<div className="br-overlay" role="dialog" aria-modal="true" aria-label="例文音読練習" onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape'){release();onStopAudio?.();onClose();}}}>
  <section className="br-modal">
   <header className="br-header"><div className="br-header-brand"><small>VOCADASH / LIBRARY EDITION</small><b>例文音読トレーニング</b></div><div className="br-header-actions"><button type="button" className="br-icon-button" title="練習レベル設定" aria-label="練習レベル設定" disabled={busy} aria-expanded={showSettings} onClick={()=>{setShowHistory(false);setShowSettings(v=>!v);}}><ReadingIcon name="settings"/></button><button type="button" className="br-icon-button" title="学習履歴" aria-label="学習履歴" aria-expanded={showHistory} onClick={()=>{setShowSettings(false);setShowHistory(v=>!v);}}><ReadingIcon name="history"/></button><button ref={closeButton} type="button" className="br-close br-icon-button" onClick={()=>{release();onStopAudio?.();onClose();}} title="閉じる" aria-label="閉じる"><ReadingIcon name="close"/></button></div></header>
   <div className="br-main">

    {showSettings&&<div className="br-difficulty-list">{descriptions.flatMap((group,s)=>group.map((label,l)=><button type="button" key={s*3+l} disabled={busy} aria-pressed={difficulty===s*3+l} onClick={()=>selectDifficulty(s*3+l)}>S{s+1} · L{l+1}<small>{label}</small></button>))}</div>}
    {showHistory&&<div className="br-history-list">{history.attempts.length?history.attempts.map((a,i)=><div key={i}><span>{new Date(a.at).toLocaleString('ja-JP')}</span><span>S{a.stage} · L{a.level}</span><b>{a.percent}%</b></div>):'まだ記録がありません。'}</div>}
    <div className="br-target"><small>TARGET WORD · No. {entry.w.bookNumber} / EX {entry.index+1}</small><div className="br-target-wordline"><strong lang="en">{entry.w.word}</strong><span>{entry.w.meaning}</span></div></div>
    <div className="br-sentence-card"><button type="button" className="br-model-icon br-icon-button" title="お手本を聞く" aria-label="お手本を聞く" disabled={busy||!sound} onClick={()=>onModel?.(entry)}><ReadingIcon name="volume"/></button><div className="br-sentence" lang="en">{maskBookSentence(entry.ex.en,entry.w.word,stage,level).map((p,i)=>p.hidden?<span className="br-blank" key={i} aria-label="空欄">{'＿'.repeat(Math.min(7,Math.max(2,p.text.replace(/[^\p{L}\p{N}]/gu,'').length)))}</span>:<span key={i} className={p.target?'br-target-ink':undefined}>{p.text}</span>)}</div>{entry.ex.ja&&<p className="br-translation" lang="ja">{entry.ex.ja}</p>}</div>
    <div className="br-dashboard"><AccuracyGauge percent={result?.percent??(transcript?scoreReading(entry.ex.en,transcript).percent:null)} live={busy} passed={result?.percent>=90}/><div className="br-side"><div className="br-metrics"><div><small>ATTEMPTS</small><b>{history.count||0}<span> 回</span></b></div><div><small>PERSONAL BEST</small><b>{history.count?history.best:'—'}<span>%</span></b></div></div><div className="br-trend"><small>RECENT ACCURACY</small><HistoryGraph attempts={history.attempts}/></div></div></div>
    <div className="br-transcript" aria-live="polite"><small>YOUR VOICE / 文字起こし</small><p>{result?result.wordMatches.map((w,i)=><span key={i} className={w.matched?'br-match':'br-miss'}>{w.value} </span>):transcript||'ここに認識した英語が表示されます。'}</p></div>
    {result&&result.missedWords.length>0&&<p className="br-missed">要確認：{result.missedWords.join(' / ')}</p>}
    {celebrate&&<div className="br-confetti" aria-hidden="true">{Array.from({length:24},(_,i)=><i key={i} style={{'--x':(i*41)%100+'%','--d':(i%7)*.045+'s','--c':['#d8af55','#83a86c','#eadab2','#b68f60'][i%4]}}/>)}</div>}
    <p className="br-status" role="status">{status}</p>

   </div>
   <footer className="br-footer"><button type="button" className="br-start" disabled={phase==='stopping'} onClick={busy?stop:()=>start()}><ReadingIcon name={busy?'stop':result?'retry':'mic'}/><span>{phase==='stopping'?'判定中…':busy?'終了・判定':result?'もう一度':'音読開始'}</span></button><button type="button" className="br-next" disabled={busy||!nextEntry} onClick={advance}><span>次の例文</span><ReadingIcon name="next"/></button></footer>
   <div className="br-note">Accuracyは音声認識結果と例文の語順の一致率です。発音の質そのものではありません。履歴はこのブラウザーに保存されます。</div>
  </section>
 </div>,document.body);
}
