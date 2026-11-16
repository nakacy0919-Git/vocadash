import React,{useEffect,useMemo,useRef,useState} from 'react';
import {findVocabularyProfile,initialVocabularyProfile,peekVocabularyProfile} from '../lib/vocabularyLookup.js';
import {profilePages} from '../lib/wordProfile.js';
import {getRelations} from '../lib/universe.js';
import {playModelSpeech} from '../lib/modelSpeech.js';
import {posLabel} from '../lib/courseLibrary.js';
import {assetImage} from '../lib/learning.js';
import './UniverseWordProfile.css';
export default function UniverseWordProfile({request,words,resolveVocabulary,onBack,onSpeak,sound,page,onPage,onExplore,onReady,onPageData}){
 const [data,setData]=useState(()=>initialVocabularyProfile(request.word,{words,seed:request.seed})),[loading,setLoading]=useState(()=>!peekVocabularyProfile(request.word,{words,seed:request.seed})),[error,setError]=useState(false),[compact,setCompact]=useState(false),[badImage,setBadImage]=useState(false);
 const panel=useRef(null),readyRef=useRef(onReady),inputsRef=useRef({words,resolveVocabulary});readyRef.current=onReady;inputsRef.current={words,resolveVocabulary};
 // Parent callbacks are recreated during microphone and UI updates; never clear/reload because of their identity.
 useEffect(()=>{let alive=true;const {words,resolveVocabulary}=inputsRef.current,options={words,seed:request.seed,resolveVocabulary};setError(false);setBadImage(false);const cached=peekVocabularyProfile(request.word,options);if(cached){setData(cached);setLoading(false);readyRef.current?.(cached);return;}setLoading(true);const first=initialVocabularyProfile(request.word,options);if(first){setData(first);readyRef.current?.(first);}findVocabularyProfile(request.word,options).then(result=>{if(alive){setLoading(false);if(result){setData(result);readyRef.current?.(result);}else if(!first)setError(true);}}).catch(()=>{if(alive){setLoading(false);if(!first)setError(true);}});return()=>{alive=false;};},[request.word,request.seed]);
 useEffect(()=>{const el=panel.current;if(!el)return;const fit=()=>{const rect=el.getBoundingClientRect();setCompact(rect.width<650||rect.height<390);};fit();if(typeof ResizeObserver==='undefined'){window.addEventListener('resize',fit);return()=>window.removeEventListener('resize',fit);}const observer=new ResizeObserver(fit);observer.observe(el);return()=>observer.disconnect();},[]);
 const pages=useMemo(()=>data?profilePages(data,compact?1:2):[],[data,compact]),index=Math.max(0,Math.min(page,Math.max(0,pages.length-1))),p=pages[index];
 useEffect(()=>{if(data&&index!==page)onPage(index);},[data,index,page,onPage]);
 useEffect(()=>{onPageData?.(p||null);},[data,index,compact]);
 const [audioStatus,setAudioStatus]=useState('idle');
 const aliveAudio=useRef(true);useEffect(()=>{aliveAudio.current=true;return()=>{aliveAudio.current=false;};},[]);
 const pronounce=text=>{if(text)playModelSpeech(text,{onStatus:s=>{if(aliveAudio.current)setAudioStatus(s);}});};
 const lexicalLinks=useMemo(()=>data?getRelations(data):[],[data]);
 const groups=p?[{label:'類義語 / Synonyms',rows:p.synonyms,type:'synonym'},{label:'対義語 / Antonyms',rows:p.antonyms,type:'contrast'},{label:'派生語 / Word family',rows:p.family,type:'family'},{label:'コロケーション / Collocations',rows:p.collocations,type:'collocation'}]:[];
 const lexicalSection=(label,rows,key)=><div className="vp-lexical-group" key={key}><small>{label}</small><div>{rows.length?rows.slice(0,12).map(row=><span key={row.word}>{row.word}{row.meaning&&<em>{row.meaning}</em>}</span>):<span className="vp-unregistered">未登録</span>}</div></div>;
 return <section ref={panel} className="vu-profile" aria-label={request.word+' の語義と例文'}>
 <header className="vp-bar"><button onClick={onBack}>← Back</button><span>VOCABULARY PROFILE / WORD &amp; EXAMPLES</span><button disabled={!data} onClick={()=>onExplore(data)}>◉ Universe</button></header>
 {!p?<div className="vp-state" role="status"><h2>{request.word}</h2><p>{error?'登録済みの語義・例文が見つかりませんでした。':'語義と例文を読み込み中…'}</p></div>:<div className="vp-content">
 <article className="vp-definition"><div className="vp-word-heading"><div><small>{posLabel(p.pos)}</small><h1>{data.word}</h1><p className="vp-ipa">IPA: {p.pronunciation||data.pronunciation||data.ipa||'未登録'}</p><span className="vp-cefr">CEFR {p.cefr||'未登録'}</span></div><button className="vp-sound" aria-label={data.word+' の発音'} onClick={()=>pronounce(data.word)}>▶</button></div>
 <div className="vp-meaning">{p.meaning||'日本語訳未登録'}</div>
 {p.definition&&<div className="vp-english-definition"><small>ENGLISH DEFINITION</small><p>{p.definition}</p></div>}
 <div className="vp-audio-status" role="status">{audioStatus==='error'?'モデル音声を再生できません。もう一度タップしてください。':audioStatus==='starting'?'音声を準備中…':audioStatus==='playing'?'モデル音声を再生中…':''}</div>
 <div className="vp-lexical"><h2>VOCABULARY DETAILS</h2>{groups.map(g=>lexicalSection(g.label,g.rows||[],g.type))}<details><summary>語全体の関連語（語義を限定しない）</summary>{groups.map(g=>lexicalSection(g.label,lexicalLinks.filter(l=>l.type===g.type),g.type+'-head'))}</details></div>
 {data.image&&!badImage&&!compact&&<img className="vp-image" src={assetImage(data.image)} alt={data.word+' の学習画像'} onError={()=>setBadImage(true)}/>}
 <small className="vp-meta">語義 {p.senseIndex+1} / {p.senseCount}{p.draft?' · オリジナル教材β（未校閲）':''}{loading?' · 教材読込中':''}</small></article>
 <section className="vp-examples"><h2>EXAMPLE SENTENCES <small>例文</small></h2>{p.examples.length?p.examples.map((ex,i)=><article key={ex.en+'|'+i} className="vp-example"><div className="vp-example-top"><small>EXAMPLE {p.exampleOffset+i+1}</small><button className="vp-sound" aria-label={'例文 '+(p.exampleOffset+i+1)+' の発音'} onClick={()=>pronounce(ex.en)}>▶</button></div><p lang="en">{ex.en}</p><span>{ex.ja||'日本語訳未登録'}</span></article>):<article className="vp-example"><p>{loading?'例文を読み込み中…':'例文は未登録です。'}</p></article>}</section>
 </div>}
 <footer className="vp-pager"><button disabled={index===0||!data} onClick={()=>onPage(index-1)}>← 前のページ</button><span>{data?index+1+' / '+pages.length:'—'}</span><button disabled={!data||index>=pages.length-1} onClick={()=>onPage(index+1)}>次のページ →</button></footer></section>;
}
