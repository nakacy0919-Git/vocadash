import React,{useEffect,useRef,useState} from 'react';
import {findVocabularyProfile} from '../lib/vocabularyLookup.js';
import {profilePages} from '../lib/wordProfile.js';
import {posLabel} from '../lib/courseLibrary.js';
import {assetImage} from '../lib/learning.js';
import './UniverseWordProfile.css';
export default function UniverseWordProfile({request,words,resolveVocabulary,onBack,onSpeak,sound,page,onPage,onExplore,onReady,onPageData}){
 const [data,setData]=useState(null),[error,setError]=useState(false),[compact,setCompact]=useState(false),[badImage,setBadImage]=useState(false);
 const panel=useRef(null),readyRef=useRef(onReady);readyRef.current=onReady;
 useEffect(()=>{let alive=true;setData(null);setError(false);setBadImage(false);findVocabularyProfile(request.word,{words,seed:request.seed,resolveVocabulary}).then(result=>{if(alive){setData(result);if(result)readyRef.current?.(result);else setError(true);}}).catch(()=>{if(alive)setError(true);});return()=>{alive=false;};},[request.word,request.seed,words,resolveVocabulary]);
 useEffect(()=>{const el=panel.current;if(!el)return;const fit=()=>{const rect=el.getBoundingClientRect();setCompact(rect.width<650||rect.height<390);};fit();if(typeof ResizeObserver==='undefined'){window.addEventListener('resize',fit);return()=>window.removeEventListener('resize',fit);}const observer=new ResizeObserver(fit);observer.observe(el);return()=>observer.disconnect();},[]);
 const pages=data?profilePages(data,compact?1:2):[],index=Math.max(0,Math.min(page,Math.max(0,pages.length-1))),p=pages[index];
 useEffect(()=>{if(data&&index!==page)onPage(index);},[data,index,page,onPage]);
 useEffect(()=>{onPageData?.(p||null);},[data,index,compact]);
 const pronounce=text=>{if(sound&&text)onSpeak({word:text});};
 return <section ref={panel} className="vu-profile" aria-label={request.word+' の語義と例文'}>
 <header className="vp-bar"><button onClick={onBack}>← Back</button><span>VOCABULARY PROFILE / WORD &amp; EXAMPLES</span><button disabled={!data} onClick={()=>onExplore(data)}>◉ Universe</button></header>
 {!p?<div className="vp-state" role="status"><h2>{request.word}</h2><p>{error?'登録済みの語義・例文が見つかりませんでした。':'語義と例文を読み込み中…'}</p></div>:<div className="vp-content">
 <article className="vp-definition"><div className="vp-word-heading"><div><small>{posLabel(p.pos)}{p.cefr?' · '+p.cefr:''}</small><h1>{data.word}</h1>{(p.pronunciation||data.pronunciation)&&<p className="vp-ipa">{p.pronunciation||data.pronunciation}</p>}</div><button className="vp-sound" aria-label={data.word+' の発音'} disabled={!sound} onClick={()=>pronounce(data.word)}>♫</button></div>
 <div className="vp-meaning">{p.meaning||'日本語訳未登録'}</div>
 {p.definition&&<div className="vp-english-definition"><small>ENGLISH DEFINITION</small><p>{p.definition}</p></div>}
 {data.image&&!badImage&&!compact&&<img className="vp-image" src={assetImage(data.image)} alt={data.word+' の学習画像'} onError={()=>setBadImage(true)}/>}
 <small className="vp-meta">語義 {p.senseIndex+1} / {p.senseCount}{p.draft?' · オリジナル教材β（未校閲）':''}</small></article>
 <section className="vp-examples"><h2>EXAMPLE SENTENCES <small>例文</small></h2>{p.examples.length?p.examples.map((ex,i)=><article key={ex.en+'|'+i} className="vp-example"><div className="vp-example-top"><small>EXAMPLE {p.exampleOffset+i+1}</small><button className="vp-sound" aria-label={'例文 '+(p.exampleOffset+i+1)+' の発音'} disabled={!sound} onClick={()=>pronounce(ex.en)}>♫</button></div><p lang="en">{ex.en}</p><span>{ex.ja||'日本語訳未登録'}</span></article>):<article className="vp-example"><p>例文は未登録です。</p></article>}</section>
 </div>}
 <footer className="vp-pager"><button disabled={index===0||!data} onClick={()=>onPage(index-1)}>← 前のページ</button><span>{data?index+1+' / '+pages.length:'—'}</span><button disabled={!data||index>=pages.length-1} onClick={()=>onPage(index+1)}>次のページ →</button></footer></section>;
}
