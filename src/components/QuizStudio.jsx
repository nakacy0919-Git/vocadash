import React,{useEffect,useMemo,useRef,useState} from 'react';
import {FORMATS,buildQuestions,planSession,createAttempt,shuffle,normalize} from '../lib/quiz/engine.js';
import authored from '../data/quiz-authored.json';
import './QuizStudio.css';
const modules=import.meta.glob('../../data/vocabulary-drafts/batches/*.json',{import:'default'});
const KEY='vocadash-quiz-attempts-v1';
function saveAttempt(attempt){
  try {const old=JSON.parse(localStorage.getItem(KEY)||'[]');localStorage.setItem(KEY,JSON.stringify([...(Array.isArray(old)?old:[]),attempt].slice(-2000)));return true;}catch{return false;}
}
export default function QuizStudio({onClose,onAttempt}){
  const [records,setRecords]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[format,setFormat]=useState('mixed'),[word,setWord]=useState(''),[queue,setQueue]=useState([]),[cursor,setCursor]=useState(0),[answer,setAnswer]=useState(''),[picked,setPicked]=useState([]),[result,setResult]=useState(null),[hints,setHints]=useState(0),[plays,setPlays]=useState(0),[score,setScore]=useState(0),[notice,setNotice]=useState('');
  const started=useRef(0),locked=useRef(false);
  const audioAvailable=typeof window!=='undefined' && 'speechSynthesis' in window;
  useEffect(()=>{let active=true;Promise.all(Object.values(modules).map(load=>load())).then(batches=>{if(active){setRecords([...new Map(batches.flatMap(b=>b.records||[]).map(r=>[r.senseId,r])).values()]);setLoading(false);}}).catch(()=>{if(active){setError('教材を読み込めませんでした。閉じて再度開いてください。');setLoading(false);}});return()=>{active=false;window.speechSynthesis?.cancel();};},[]);
  const bank=useMemo(()=>{
    const subset=records.filter(r=>!word || (r.headword||'').toLowerCase().includes(word.toLowerCase()));
    const ids=new Set(subset.map(r=>r.senseId));
    return buildQuestions(subset,authored.filter(q=>ids.has(q.senseId)),{audioAvailable,choiceRecords:records});
  },[records,word,audioAvailable]);
  const available=bank.questions.filter(q=>format==='mixed'||q.format===format);
  const q=queue[cursor];
  const tokens=useMemo(()=>q?.tokens?shuffle(q.tokens.map((text,id)=>({text,id}))):[],[q]);
  function reset(){setAnswer('');setPicked([]);setResult(null);setHints(0);setPlays(0);locked.current=false;started.current=Date.now();window.speechSynthesis?.cancel();}
  function start(){reset();setScore(0);setNotice('');setCursor(0);setQueue(planSession(available,{limit:20,maxSenses:format==='mixed'?5:20}));}
  function submit(e,selected){e?.preventDefault();if(locked.current||!q)return;const value=q.format==='reorder'?picked.map(t=>t.text).join(' '):selected;if(!value?.trim()||(q.format!=='reorder'&&!q.options?.includes(value)))return;setAnswer(value);locked.current=true;
    const attempt=createAttempt(q,{answer:value,startedAt:started.current,hintCount:hints,audioPlays:plays});
    setResult(attempt);setScore(n=>n+Number(attempt.correct));
    if(!saveAttempt(attempt))setNotice('記録を保存できません。ブラウザの保存設定をご確認ください。');
    // Optional integration boundary; scheduling is owned by the separate Memory Engine.
    try{const sourceRecord=records.find(r=>r.senseId===attempt.senseId);onAttempt?.({...attempt,word:sourceRecord?.headword,meaning:sourceRecord?.meaningJa});window.dispatchEvent(new CustomEvent('vocadash:quiz-attempt-v1',{detail:attempt}));}catch{setNotice('回答は記録しましたが、学習エンジンへの通知に失敗しました。');}
    if(!attempt.correct && queue.length<26){setQueue(prev=>{const next=[...prev];const other=bank.questions.find(x=>x.senseId===q.senseId && x.format!==q.format)||q;next.splice(Math.min(next.length,cursor+4),0,other);return next;});}
  }
  function speak(){if(!q||result)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(q.audioText);u.lang='en-US';u.rate=.85;u.onerror=()=>setNotice('音声を再生できません。この問題をスキップできます。');window.speechSynthesis.speak(u);setPlays(n=>n+1);}
  return <section className="qs-studio" aria-label="多角度語彙クイズ">
    <header><div><small>VOCADASH / PRACTICE LAB</small><h1>使える語彙を育てる</h1></div><button onClick={onClose}>ホームへ戻る</button></header>
    {loading?<p role="status">オリジナル教材を読み込み中…</p>:error?<p role="alert">{error}</p>:<>
      {!queue.length?<><p>同じ語彙を、意味・音・文脈・語形から練習します。原稿由来の自動問題は教材確認用です。複数の言い方がある場合も、指定された登録見出し語・例文を再現してください。</p>
      <div className="qs-controls"><label>出題形式<select value={format} onChange={e=>setFormat(e.target.value)}><option value="mixed">ミックス：形式を変えて復習</option>{Object.entries(FORMATS).map(([id,label])=><option key={id} value={id}>{label}（{bank.questions.filter(q=>q.format===id).length}）</option>)}</select></label><label>英単語で絞り込み<input value={word} onChange={e=>setWord(e.target.value)} placeholder="例：book"/></label></div>
      <p>{records.length.toLocaleString()}語義から {available.length.toLocaleString()}問が利用可能。根拠不足の問題 {bank.rejected.length}問を除外。</p><button disabled={!available.length} onClick={start}>20問で練習する</button>{!available.length&&<p>この形式・単語の問題は未整備です。別の形式をお選びください。</p>}</>:
      !q?<div><h2>練習完了</h2><p>{queue.length}問中 {score}問正解。ヒント使用は回答記録に別途保存しています。</p><button onClick={()=>{reset();setQueue([]);}}>教材・形式を選び直す</button></div>:
      <article key={cursor}><div className="qs-meta"><strong>{FORMATS[q.format]}</strong><span>{cursor+1} / {queue.length}</span></div><h2 className="qs-prompt">{q.prompt}</h2>
      {q.image&&<img className="qs-image" src={q.image} alt="出題用の物のイラスト" onError={()=>setNotice('画像が読み込めません。この問題をスキップしてください。')}/>}
      {q.audioText&&<button disabled={!!result} onClick={speak}>音声を聞く（{plays}回）</button>}
      <form onSubmit={e=>submit(e)}>
      {q.format==='reorder'?<><div className="qs-token-answer" aria-label="並べ替えた英文">{picked.map(t=><button type="button" key={t.id} disabled={!!result} onClick={()=>setPicked(p=>p.filter(x=>x.id!==t.id))}>{t.text} ×</button>)}</div><div className="qs-tokens">{tokens.map(t=><button type="button" key={t.id} disabled={!!result||picked.some(x=>x.id===t.id)} onClick={()=>setPicked(p=>[...p,t])}>{t.text}</button>)}</div></>:
      <div className="qs-options">{q.options.map((o,i)=><button type="button" key={o} disabled={!!result} aria-pressed={answer===o} className={result?(q.answers.some(a=>normalize(a)===normalize(o))?'qs-correct':answer===o?'qs-wrong':''):''} onClick={()=>submit(null,o)}><span className="qs-letter">{String.fromCharCode(65+i)}</span>{o}</button>)}</div>}
      {!result&&<div className="qs-actions">{q.format==='reorder'&&<button disabled={picked.length!==tokens.length}>回答する</button>}{q.hint&&<button type="button" onClick={()=>setHints(n=>n+1)}>ヒント</button>}<button type="button" onClick={()=>{reset();setQueue([]);}}>形式を選び直す</button><button type="button" onClick={()=>{reset();setCursor(n=>n+1);}}>スキップ</button></div>}
      </form>
      {hints>0&&<p>ヒント：{q.hint}</p>}
      {result&&<div className="qs-feedback" role="status"><h3>{result.correct?'正解！':'登録教材の答えを確認しましょう'}</h3><p>{q.answers.join(' / ')}</p><p>{q.translation}</p><p>{q.explanation||q.evidence.rationale}</p><small>出典：{q.evidence.source} · {(result.responseMs/1000).toFixed(1)}秒 · ヒント {result.hintCount}回</small><div><button onClick={()=>{reset();setCursor(n=>n+1);}}>次の問題 →</button></div></div>}
      </article>}
    </>}{notice&&<p role="alert">{notice}</p>}
  </section>;
}
