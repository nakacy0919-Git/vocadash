import React,{useEffect,useMemo,useRef,useState} from 'react';
import {assetImage} from '../lib/learning.js';
import {conceptVisual} from '../lib/profileVisuals.js';
import {ProgressRing,WordProgress,CourseProgress} from './WordProgress.jsx';
import {libraryPage,posLabel,examplesFor,PAGE_SIZE,cardPageSize,wordProgress,courseProgress,formatAnswerTime} from '../lib/courseLibrary.js';
import './CourseLibrary.css';
import RedSheet from './RedSheet.jsx';

export function WordImage({word,className=''}) {
 const visual=conceptVisual(word?.word);
 const src=visual?.src||(typeof word?.image==='string'&&word.image?assetImage(word.image):'');
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[src]);
 return src&&!failed?<img className={className} src={src} alt={word.word+' の学習画像'} loading="lazy" onError={()=>setFailed(true)}/>:null;
}
function WordDetail({word,words,onMove,onClose,onSpeak,sound,onStudy,onExplore,records,onSentence}) {
 const dialog=useRef(null);const index=words.findIndex(w=>w.id===word.id),examples=examplesFor(word),data=wordProgress(records[word.id]);
 useEffect(()=>{const el=dialog.current;if(!el)return;el.showModal();return()=>{if(el.open)el.close();};},[]);
 return <dialog ref={dialog} className="cl-detail" aria-labelledby="cl-detail-title" onCancel={e=>{e.preventDefault();onClose();}}><header><small>VOCADASH / WORD PROFILE · {index+1} / {words.length}</small><button onClick={onClose} aria-label="詳細を閉じる">×</button></header><div className="cl-detail-body"><div className="cl-word-hero"><div><span className="cl-pos">{posLabel(word.partOfSpeech)}</span><h1 id="cl-detail-title">{word.word}</h1>{word.pronunciation&&<p className="cl-ipa">{word.pronunciation}</p>}<p className="cl-meaning">{word.meaning}</p><button disabled={!sound} onClick={()=>onSpeak(word)}>♫ 単語の発音</button></div><WordImage word={word} className="cl-detail-image"/></div>
 <div className="cl-detail-progress"><ProgressRing value={data.percent} unknown={!data.attempts} large/><div><b>記憶定着度（推定）</b><small>{data.status} · {data.attempts}回学習 · 正解 {data.correctCount}回</small></div><div><small>直近の計測済み正解</small><b>{formatAnswerTime(data.correctMs)}</b></div><div><small>最速の正解</small><b>{formatAnswerTime(data.bestMs)}</b></div></div>
 {word.definition&&<section><h3>ENGLISH DEFINITION</h3><p>{word.definition}</p></section>}
 <section><h3>EXAMPLES / 例文</h3>{examples.length?examples.map((ex,i)=><article key={i}><p lang="en">{ex.en}</p><small>{ex.ja}</small><button disabled={!sound} onClick={()=>onSpeak({...word,english:ex.en,audio:i===0?word.audio:''},true)}>♫ 例文を聞く</button></article>):<p>例文は未登録です。</p>}</section>
 {word.explanation&&<section><h3>使い方のヒント</h3><p>{word.explanation}</p></section>}
 {Array.isArray(word.collocations)&&word.collocations.length>0&&<section><h3>あわせて覚える表現</h3>{word.collocations.slice(0,8).map((c,i)=><p key={i}>{typeof c==='string'?c:(c?.en||c?.word||'')} {c?.ja||''}</p>)}</section>}
 </div><footer><div className="cl-detail-nav"><button disabled={index<=0} onClick={()=>onMove(words[index-1])}>← 前の語</button><button disabled={index>=words.length-1} onClick={()=>onMove(words[index+1])}>次の語 →</button></div><div className="cl-detail-actions"><button className="cl-primary" onClick={()=>onStudy(word)}>この語から単語学習</button><button onClick={()=>onSentence(word)}>例文を順番に学習</button>{onExplore&&<button onClick={()=>{onClose();onExplore(word);}}>◎ Universe</button>}</div></footer></dialog>;
}
export default function CourseLibrary({words,records,title,loading,error,onRetry,onHome,onMission,onStudy,onSentence,onMode,onSpeak,sound,onExplore,page,onPage,cardDensity=6,onCardDensity}){
 const [view,setView]=useState('cards'),[detail,setDetail]=useState(null),[query,setQuery]=useState(''),[sort,setSort]=useState('original'),[sheetExamples,setSheetExamples]=useState(false);
 const progress=useMemo(()=>courseProgress(words,records),[words,records]);
 const filtered=useMemo(()=>{const q=query.trim().toLowerCase();const list=q?words.filter(w=>(w.word+' '+w.meaning).toLowerCase().includes(q)):words;if(sort==='original')return list;const data=new Map(list.map(w=>[w.id,wordProgress(records[w.id])]));return [...list].sort((a,b)=>{const x=data.get(a.id),y=data.get(b.id);return sort==='weak'?x.percent-y.percent:sort==='strong'?y.percent-x.percent:(y.correctMs??-1)-(x.correctMs??-1);});},[words,query,sort,records]);
 const cardsPerPage=cardPageSize(cardDensity);
 const pageSize=view==='sheet'?(sheetExamples?6:PAGE_SIZE):cardsPerPage;
 const p=libraryPage(filtered,page,pageSize);const current=detail?words.find(w=>w.id===detail):null;
 useEffect(()=>{if(page!==p.page)onPage(p.page);},[page,p.page,onPage]);
 const move=w=>{setDetail(w.id);const i=filtered.findIndex(x=>x.id===w.id);if(i>=0)onPage(Math.floor(i/pageSize));};
 const selectView=v=>{if(v!==view){onPage(Math.floor(p.start/(v==='sheet'?(sheetExamples?6:PAGE_SIZE):cardsPerPage)));setView(v);}};
 const changeDensity=n=>{onPage(Math.floor(p.start/cardPageSize(n)));onCardDensity?.(n);};
 const changeExamples=v=>{onPage(Math.floor(p.start/(v?6:PAGE_SIZE)));setSheetExamples(v);};
 return <section className="cl-page"><header className="cl-header"><div><small>VOCADASH / COURSE LIBRARY</small><h1>{title}</h1><p>語彙を見渡し、覚え、クイズで定着させる。</p></div><button className="cl-home" onClick={onHome}>⌂ ホーム</button></header>
 <div className="cl-course-actions"><button className="cl-primary" disabled={loading||!!error||!words.length} onClick={()=>onMission(null)}>✦ 記憶ミッションを始める</button><button disabled={loading||!!error||!p.items.length} onClick={()=>onMission(p.items.map(w=>w.id))}>このページを学習</button><details className="cl-more"><summary>その他の練習</summary><div>{[['memory','従来の反復学習'],['study','単語カード'],['sentence','例文カード'],['quiz','確認テスト'],['reading','音読'],['review','復習']].map(([id,label])=><button key={id} onClick={()=>onMode(id)}>{label}</button>)}</div></details></div>
 {view==='cards'&&!loading&&!error&&words.length>0&&<CourseProgress data={progress}/>}
 <div className="cl-toolbar"><div className="cl-switch"><button aria-pressed={view==='cards'} onClick={()=>selectView('cards')}>▦ 単語一覧</button><button aria-pressed={view==='sheet'} onClick={()=>selectView('sheet')}>▰ 赤シート</button></div><div className="cl-toolbar-filters">{view==='cards'&&<div className="cl-density" role="group" aria-label="カード表示数"><button type="button" aria-pressed={cardsPerPage===6} onClick={()=>changeDensity(6)} title="イラストを大きく表示">▦ 6語</button><button type="button" aria-pressed={cardsPerPage===12} onClick={()=>changeDensity(12)} title="一覧をコンパクトに表示">▦ 12語</button></div>}<label className="cl-sort"><span>並び順</span><select value={sort} onChange={e=>{setSort(e.target.value);onPage(0);}}><option value="original">教材順</option><option value="weak">定着度が低い順</option><option value="strong">定着度が高い順</option><option value="slow">正解に時間がかかった順</option></select></label><label className="cl-search"><span>検索</span><input type="search" value={query} placeholder="英語・日本語" onChange={e=>{setQuery(e.target.value);onPage(0);}}/></label></div></div>
 {loading?<p role="status">教材を読み込み中…</p>:error?<p role="alert">{error} <button onClick={onRetry}>再試行</button></p>:!p.items.length?<p>該当する語彙はありません。</p>:view==='sheet'?<RedSheet items={p.items} start={p.start} page={p.page} total={filtered.length} onSpeak={onSpeak} sound={sound} showExamples={sheetExamples} onShowExamples={changeExamples}/>:<div className={'cl-grid cl-art-grid'+(cardsPerPage===12?' cl-art-compact':'')}>{p.items.map((w,i)=>{const data=wordProgress(records[w.id]);return <button key={w.id} className="cl-word-card cl-progress-card cl-art-card" onClick={()=>setDetail(w.id)}><span className="cl-art-scene" aria-hidden="true"><WordImage word={w} className="cl-art-image"/></span><span className="cl-art-top"><small>{String(p.start+i+1).padStart(2,'0')} · {posLabel(w.partOfSpeech)}</small><span className="cl-art-open" aria-hidden="true">↗</span></span><span className="cl-art-text"><strong lang="en">{w.word}</strong><span className="cl-art-meaning">{w.meaning}</span></span><WordProgress data={data}/></button>})}</div>}
 <footer className="cl-pagination"><button disabled={p.page===0} onClick={()=>onPage(p.page-1)}>← 前へ</button><span>{p.items.length?p.start+1:0}–{p.start+p.items.length} / {filtered.length.toLocaleString()} 語義</span><label className="cl-page-jump">ページ <input aria-label="ページ番号" type="number" min="1" max={p.pages} value={p.page+1} onChange={e=>onPage(Math.max(0,Math.min(p.pages-1,Number(e.target.value)-1)))}/> / {p.pages}</label><button disabled={p.page>=p.pages-1} onClick={()=>onPage(p.page+1)}>次へ →</button></footer>
 {current&&<WordDetail word={current} words={words} records={records} onMove={move} onClose={()=>setDetail(null)} onSpeak={onSpeak} sound={sound} onStudy={onStudy} onSentence={onSentence} onExplore={onExplore}/>}</section>;
}
