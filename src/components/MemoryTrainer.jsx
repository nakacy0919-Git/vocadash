import React,{useState,useRef,useEffect} from 'react';
import {recall,mastery,reviewMemory,memoryQueue,normalizeAnswer,buildQuestion,enqueueRetry} from '../lib/memoryEngine.js';
import './MemoryTrainer.css';

const labels={meaning:'意味を選ぶ',typing:'英単語を入力',cloze:'例文穴埋め',listening:'聞き取り・スペリング',recall:'意味を思い出す'};
export default function MemoryTrainer({words,store,onRecord,onExit,loading,error,title,onRetry,savedError}){
 const [queue,setQueue]=useState([]),[i,setI]=useState(0),[question,setQuestion]=useState(null),[result,setResult]=useState(null),[input,setInput]=useState(''),[count,setCount]=useState(10),[phase,setPhase]=useState('ready'),[tally,setTally]=useState({total:0,correct:0}),[audioError,setAudioError]=useState(''),[intro,setIntro]=useState(false),[hint,setHint]=useState(false);
 const lock=useRef(false),baseAttempts=useRef({}),localAttempts=useRef({}),answerRef=useRef(null);
 const item=queue[i],w=item?.word,records=store.records,now=Date.now();
 const memory=w?records[w.id]?.memory:null;
 const eligible=words.filter(x=>x.id&&x.word&&x.meaning);
 const due=eligible.filter(x=>records[x.id]?.memory?.attempts&&records[x.id].memory.dueAt<=now).length;
 const fresh=eligible.filter(x=>!records[x.id]?.memory?.attempts).length;
 const learned=eligible.filter(x=>mastery(records[x.id]?.memory,now)>=80).length;
 useEffect(()=>()=>{if(typeof window!=='undefined')window.speechSynthesis?.cancel();},[]);
 function load(entry){const past=localAttempts.current[entry.word.id]||0;const prior=baseAttempts.current[entry.word.id]||0;setQuestion(buildQuestion(entry.word,words,prior+past));setInput('');setResult(null);setAudioError('');setHint(false);setIntro(prior===0&&past===0&&entry.retry===0);lock.current=false;}
 function start(){const next=memoryQueue(words,records,Date.now(),count).map(word=>({word,retry:0}));if(!next.length)return;baseAttempts.current=Object.fromEntries(next.map(({word})=>[word.id,records[word.id]?.memory?.attempts||0]));localAttempts.current={};setQueue(next);setI(0);setTally({total:0,correct:0});load(next[0]);setPhase('quiz');}
 function speak(){try{if(!window.speechSynthesis||!question?.answer)throw Error();const u=new SpeechSynthesisUtterance(question.answer);u.lang='en-US';u.rate=.85;u.onerror=()=>setAudioError('音声を再生できません。スキップできます。');window.speechSynthesis.cancel();window.speechSynthesis.speak(u);}catch{setAudioError('このブラウザでは音声を再生できません。スキップできます。');}}
 function submit(value,manual){if(lock.current||!question||!item||intro)return;lock.current=true;const ok=manual===undefined?normalizeAnswer(value)===normalizeAnswer(question.answer):manual;
   const grade=ok?(hint||manual===true?2:3):1, next=reviewMemory(memory,grade,question.kind,Date.now());onRecord(w.id,grade,question.kind,next.lastAt);localAttempts.current[w.id]=(localAttempts.current[w.id]||0)+1;
   setResult({ok,value,before:mastery(memory,next.lastAt),after:mastery(next,next.lastAt),dueAt:next.dueAt});setTally(t=>({total:t.total+1,correct:t.correct+(ok?1:0)}));
   if(!ok||(item.retry===0&&!baseAttempts.current[w.id]))setQueue(q=>enqueueRetry(q,i,item));
 }
 function advance(){if(typeof window!=='undefined')window.speechSynthesis?.cancel();const n=i+1;if(n>=queue.length){setPhase('done');setQuestion(null);return;}setI(n);load(queue[n]);}
 const done=phase==='done',available=phase==='ready'||done;
 return <main className="vm-page"><header className="vm-header"><button onClick={onExit}>← ホーム</button><span>VOCADASH / MEMORY ENGINE</span></header><section className="vm-card">
 {savedError&&<p role="alert">学習記録を保存できません。この端末のブラウザ設定をご確認ください。</p>}<p className="vm-kicker">{title}</p><h1>Memory Mission</h1><p className="vm-sub">今日の復習と新しい語彙。思い出すたびに、記憶を育てよう。</p>
 {loading?<p role="status">教材を読み込んでいます…</p>:error?<p role="alert">{error} <button onClick={onRetry}>再試行</button></p>:available?<><div className="vm-metrics"><div><strong>{due}</strong><small>復習待ち</small></div><div><strong>{fresh}</strong><small>未学習</small></div><div><strong>{learned}</strong><small>長期定着</small></div></div>
 {done&&<p role="status">ミッション完了：{tally.correct} / {tally.total} 正解。次の復習は記憶状態に応じて自動設定されました。</p>}
 <label className="vm-count">今回の新規・復習語数 <select value={count} onChange={e=>setCount(Number(e.target.value))}>{[5,10,20,30].map(n=><option key={n}>{n}</option>)}</select></label>
 <button className="vm-primary" onClick={start} disabled={!due&&!fresh}>ミッションを開始 →</button>{!due&&!fresh&&<p>今すぐ復習する語はありません。時間をおいて戻りましょう。</p>}<small>記憶記録はこの端末に保存されます。既存の学習モードの記録とは区別しています。</small></>:question&&w?<><div className="vm-progress"><span>{i+1} / {queue.length} 問 {item.retry>0?' · 反復':''}</span><progress value={i+1} max={queue.length}/><span>{labels[question.kind]}</span></div>
 <div className="vm-memory"><b>記憶定着度 {result?result.after:mastery(memory,now)}%</b><progress value={result?result.after:mastery(memory,now)} max="100"/><small>想起確率（推定） {Math.round(recall(memory,now)*100)}%</small></div>
 {intro?<div className="vm-feedback"><p>新しい単語</p><h2>{w.word}</h2><p>{w.meaning}</p>{w.english&&<p>{w.english}</p>}{w.japanese&&<p>{w.japanese}</p>}<button className="vm-primary" onClick={()=>setIntro(false)}>覚えたらクイズへ →</button></div>:<><h2 className="vm-prompt">{question.prompt.replace(/_{3,}|＿{3,}/g,'＿＿＿＿')}</h2>
 {question.kind==='typing'&&!result&&<p className="vm-hint">登録された英単語を入力　{hint?'先頭文字：'+question.answer[0]:<button onClick={()=>setHint(true)}>ヒント</button>}</p>}
 {question.kind==='listening'&&<><button className="vm-audio" onClick={speak}>▶ 音声を再生</button>{audioError&&<p role="alert">{audioError}</p>}</>}
 {question.options.length>0?<div className="vm-options">{question.options.map(option=><button key={option} disabled={!!result} onClick={()=>submit(option)} className={result?(normalizeAnswer(option)===normalizeAnswer(question.answer)?'vm-correct':option===result.value?'vm-wrong':''):''}>{option}</button>)}</div>:question.kind==='recall'?<div className="vm-options"><button disabled={!!result} onClick={()=>submit('',true)}>思い出せた</button><button disabled={!!result} onClick={()=>submit('',false)}>思い出せない</button></div>:<form className="vm-input" onSubmit={e=>{e.preventDefault();if(input.trim())submit(input)}}><input ref={answerRef} aria-label="英単語" value={input} disabled={!!result} onChange={e=>setInput(e.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false}/><button disabled={!!result||!input.trim()}>回答</button></form>}
 {!result?<div className="vm-actions"><button onClick={()=>submit('',false)}>わからない</button><button onClick={advance}>採点せずスキップ</button></div>:<div className="vm-feedback" role="status"><strong>{result.ok?'正解！':'もう一度覚えよう'}　{result.before}% → {result.after}%</strong><h3>{w.word} · {w.meaning}</h3>{w.english&&<p>{w.english}</p>}{w.japanese&&<p>{w.japanese}</p>}<small>次回復習：{new Date(result.dueAt).toLocaleString('ja-JP')}</small><button className="vm-primary" onClick={advance}>次へ →</button></div>}</>}
 </>:null}</section></main>;
}
