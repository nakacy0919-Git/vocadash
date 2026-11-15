import React,{useEffect,useMemo,useRef,useState} from 'react';
import {assetImage} from '../lib/learning.js';
import {mastery,isMastered} from '../lib/memoryEngine.js';
import {libraryPage,posLabel,examplesFor,PAGE_SIZE} from '../lib/courseLibrary.js';
import './CourseLibrary.css';

export function WordImage({word,className=''}) {
 const src=typeof word?.image==='string'&&word.image?assetImage(word.image):'';
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[src]);
 return src&&!failed?<img className={className} src={src} alt={word.word+' の学習画像'} loading="lazy" onError={()=>setFailed(true)}/>:null;
}
function WordDetail({word,words,onMove,onClose,onSpeak,sound,onStudy,onExplore,records,onSentence}) {
 const dialog=useRef(null);const index=words.findIndex(w=>w.id===word.id),examples=examplesFor(word);
 useEffect(()=>{const el=dialog.current;if(!el)return;el.showModal();return()=>{if(el.open)el.close();};},[]);
 return <dialog ref={dialog} className="cl-detail" aria-labelledby="cl-detail-title" onCancel={e=>{e.preventDefault();onClose();}}><header><small>VOCADASH / WORD PROFILE · {index+1} / {words.length}</small><button onClick={onClose} aria-label="詳細を閉じる">×</button></header><div className="cl-detail-body"><div className="cl-word-hero"><div><span className="cl-pos">{posLabel(word.partOfSpeech)}</span><h1 id="cl-detail-title">{word.word}</h1>{word.pronunciation&&<p className="cl-ipa">{word.pronunciation}</p>}<p className="cl-meaning">{word.meaning}</p><button disabled={!sound} onClick={()=>onSpeak(word)}>♫ 単語の発音</button></div><WordImage word={word} className="cl-detail-image"/></div>
 <div className="cl-level"><span>記憶定着度 {mastery(records[word.id]?.memory)}%</span><progress max="100" value={mastery(records[word.id]?.memory)}/></div>
 {word.definition&&<section><h3>ENGLISH DEFINITION</h3><p>{word.definition}</p></section>}
 <section><h3>EXAMPLES / 例文</h3>{examples.length?examples.map((ex,i)=><article key={i}><p lang="en">{ex.en}</p><small>{ex.ja}</small><button disabled={!sound} onClick={()=>onSpeak({...word,english:ex.en,audio:i===0?word.audio:''},true)}>♫ 例文を聞く</button></article>):<p>例文は未登録です。</p>}</section>
 {word.explanation&&<section><h3>使い方のヒント</h3><p>{word.explanation}</p></section>}
 {Array.isArray(word.collocations)&&word.collocations.length>0&&<section><h3>あわせて覚える表現</h3>{word.collocations.slice(0,8).map((c,i)=><p key={i}>{typeof c==='string'?c:(c?.en||c?.word||'')} {c?.ja||''}</p>)}</section>}
 </div><footer><div className="cl-detail-nav"><button disabled={index<=0} onClick={()=>onMove(words[index-1])}>← 前の語</button><button disabled={index>=words.length-1} onClick={()=>onMove(words[index+1])}>次の語 →</button></div><div className="cl-detail-actions"><button className="cl-primary" onClick={()=>onStudy(word)}>この語から単語学習</button><button onClick={()=>onSentence(word)}>例文を順番に学習</button>{onExplore&&<button onClick={()=>{onClose();onExplore(word);}}>◎ Universe</button>}</div></footer></dialog>;
}
export default function CourseLibrary({words,records,title,loading,error,onRetry,onHome,onMission,onStudy,onSentence,onMode,onSpeak,sound,onExplore,page,onPage}){
 const [view,setView]=useState('cards'),[mask,setMask]=useState('meaning'),[revealed,setRevealed]=useState(new Set()),[detail,setDetail]=useState(null),[query,setQuery]=useState('');
 const filtered=useMemo(()=>{const q=query.trim().toLowerCase();return q?words.filter(w=>(w.word+' '+w.meaning).toLowerCase().includes(q)):words;},[words,query]);
 const p=libraryPage(filtered,page);const current=detail?words.find(w=>w.id===detail):null;
 useEffect(()=>setRevealed(new Set()),[p.page,mask,view,query]);
 useEffect(()=>{if(page!==p.page)onPage(p.page);},[page,p.page,onPage]);
 const reveal=id=>setRevealed(prev=>{const next=new Set(prev);if(next.has(id))next.delete(id);else next.add(id);return next;});
 const move=w=>{setDetail(w.id);const i=filtered.findIndex(x=>x.id===w.id);if(i>=0)onPage(Math.floor(i/PAGE_SIZE));};
 const selectView=v=>{setView(v);setRevealed(new Set());};
 return <section className="cl-page"><header className="cl-header"><div><small>VOCADASH / COURSE LIBRARY</small><h1>{title}</h1><p>語彙を見渡し、覚え、クイズで定着させる。</p></div><button className="cl-home" onClick={onHome}>⌂ ホーム</button></header>
 <div className="cl-course-actions"><button className="cl-primary" disabled={loading||!!error||!words.length} onClick={()=>onMission(null)}>✦ 記憶ミッションを始める</button><button disabled={loading||!!error||!p.items.length} onClick={()=>onMission(p.items.map(w=>w.id))}>このページを学習</button><details className="cl-more"><summary>その他の練習</summary><div>{[['study','単語カード'],['sentence','例文カード'],['quiz','確認テスト'],['reading','音読'],['review','復習']].map(([id,label])=><button key={id} onClick={()=>onMode(id)}>{label}</button>)}</div></details></div>
 <div className="cl-toolbar"><div className="cl-switch"><button aria-pressed={view==='cards'} onClick={()=>selectView('cards')}>▦ 単語一覧</button><button aria-pressed={view==='sheet'} onClick={()=>selectView('sheet')}>▰ 赤シート</button></div><label className="cl-search"><span>検索</span><input type="search" value={query} placeholder="英語・日本語" onChange={e=>{setQuery(e.target.value);onPage(0);}}/></label></div>
 {view==='sheet'&&<div className="cl-sheet-tools"><button aria-pressed={mask==='meaning'} onClick={()=>setMask('meaning')}>日本語を隠す</button><button aria-pressed={mask==='word'} onClick={()=>setMask('word')}>英語を隠す</button><button onClick={()=>setRevealed(new Set())}>全て隠す</button><button onClick={()=>setRevealed(new Set(p.items.map(w=>w.id)))}>全て表示</button><small>赤い部分をタップすると個別に表示・非表示</small></div>}
 {loading?<p role="status">教材を読み込み中…</p>:error?<p role="alert">{error} <button onClick={onRetry}>再試行</button></p>:!p.items.length?<p>該当する語彙はありません。</p>:<div className={'cl-grid '+(view==='sheet'?'cl-sheet':'')}>{p.items.map((w,i)=>{const memory=records[w.id]?.memory,show=revealed.has(w.id),percent=mastery(memory);return view==='sheet'?<article className="cl-word-card" key={w.id}><small>{p.start+i+1} · {posLabel(w.partOfSpeech)}</small>{mask==='word'?<button className={'cl-cover '+(show?'cl-revealed':'')} onClick={()=>reveal(w.id)} aria-label={show?'英語を隠す':'英語を表示'} aria-expanded={show}>{show?w.word:'タップして表示'}</button>:<strong>{w.word}</strong>}{mask==='meaning'?<button className={'cl-cover '+(show?'cl-revealed':'')} onClick={()=>reveal(w.id)} aria-label={show?'意味を隠す':'意味を表示'} aria-expanded={show}>{show?w.meaning:'タップして表示'}</button>:<span>{w.meaning}</span>}<button className="cl-mini" onClick={()=>setDetail(w.id)}>詳細 →</button></article>:<button key={w.id} className="cl-word-card" onClick={()=>setDetail(w.id)}><small>{String(p.start+i+1).padStart(2,'0')} · {posLabel(w.partOfSpeech)}</small><WordImage word={w} className="cl-thumb"/><strong>{w.word}</strong><span>{w.meaning}</span><span className="cl-card-foot"><span>{isMastered(memory)?'定着':memory?.attempts?percent+'%':'未学習'}</span><span>詳細 ↗</span></span></button>})}</div>}
 <footer className="cl-pagination"><button disabled={p.page===0} onClick={()=>onPage(p.page-1)}>← 前へ</button><span>{p.items.length?p.start+1:0}–{p.start+p.items.length} / {filtered.length.toLocaleString()} 語義</span><label className="cl-page-jump">ページ <input aria-label="ページ番号" type="number" min="1" max={p.pages} value={p.page+1} onChange={e=>onPage(Math.max(0,Math.min(p.pages-1,Number(e.target.value)-1)))}/> / {p.pages}</label><button disabled={p.page>=p.pages-1} onClick={()=>onPage(p.page+1)}>次へ →</button></footer>
 {current&&<WordDetail word={current} words={words} records={records} onMove={move} onClose={()=>setDetail(null)} onSpeak={onSpeak} sound={sound} onStudy={onStudy} onSentence={onSentence} onExplore={onExplore}/>}</section>;
}
