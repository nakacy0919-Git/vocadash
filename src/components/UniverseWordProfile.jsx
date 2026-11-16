import React,{useEffect,useMemo,useRef,useState} from 'react';
import {findVocabularyProfile,initialVocabularyProfile,peekVocabularyProfile} from '../lib/vocabularyLookup.js';
import {profilePages,profileLayout,profileRelationRows,profileTextPages} from '../lib/wordProfile.js';
import {getRelations} from '../lib/universe.js';
import {playModelSpeech} from '../lib/modelSpeech.js';
import {posLabel} from '../lib/courseLibrary.js';
import {assetImage} from '../lib/learning.js';
import './UniverseWordProfile.css';
// Text overflow is exposed by a visible control, never a hidden scroll region.
function BoundedText({text,className='',onFull}){
 const ref=useRef(null),[clipped,setClipped]=useState(false);
 useEffect(()=>{const el=ref.current;if(!el)return;const fit=()=>setClipped(el.scrollHeight>el.clientHeight+1||el.scrollWidth>el.clientWidth+1);fit();const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(fit);observer?.observe(el);window.addEventListener('resize',fit);return()=>{observer?.disconnect();window.removeEventListener('resize',fit);};},[text]);
 return <div className={'vp-bounded '+className}><p ref={ref}>{text}</p>{clipped&&<button type="button" className="vp-text-more" onClick={onFull}>全文 ↗</button>}</div>;
}
export default function UniverseWordProfile({request,words,resolveVocabulary,onBack,onSpeak,sound,page,onPage,onExplore,onReady,onPageData}){
 const [data,setData]=useState(()=>initialVocabularyProfile(request.word,{words,seed:request.seed})),[loading,setLoading]=useState(()=>!peekVocabularyProfile(request.word,{words,seed:request.seed})),[error,setError]=useState(false),[size,setSize]=useState({width:1024,height:650}),[badImage,setBadImage]=useState(false);
 const panel=useRef(null),readyRef=useRef(onReady),inputsRef=useRef({words,resolveVocabulary});readyRef.current=onReady;inputsRef.current={words,resolveVocabulary};
 // Parent callbacks are recreated during microphone and UI updates; never clear/reload because of their identity.
 useEffect(()=>{let alive=true;const {words,resolveVocabulary}=inputsRef.current,options={words,seed:request.seed,resolveVocabulary};setError(false);setBadImage(false);const cached=peekVocabularyProfile(request.word,options);if(cached){setData(cached);setLoading(false);readyRef.current?.(cached);return;}setLoading(true);const first=initialVocabularyProfile(request.word,options);if(first){setData(first);readyRef.current?.(first);}findVocabularyProfile(request.word,options).then(result=>{if(alive){setLoading(false);if(result){setData(result);readyRef.current?.(result);}else if(!first)setError(true);}}).catch(()=>{if(alive){setLoading(false);if(!first)setError(true);}});return()=>{alive=false;};},[request.word,request.seed]);
 useEffect(()=>{const el=panel.current;if(!el)return;const fit=()=>{const rect=el.getBoundingClientRect();setSize(old=>Math.abs(old.width-rect.width)<2&&Math.abs(old.height-rect.height)<2?old:{width:rect.width,height:rect.height});};fit();const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(fit);observer?.observe(el);window.addEventListener('resize',fit);return()=>{observer?.disconnect();window.removeEventListener('resize',fit);};},[]);
 const layout=profileLayout(size.width,size.height);
 const pages=useMemo(()=>data?profilePages(data,layout.examples):[],[data,layout.examples]),index=Math.max(0,Math.min(page,Math.max(0,pages.length-1))),p=pages[index];
 const [detail,setDetail]=useState(null),[detailPage,setDetailPage]=useState(0);
 const [audioStatus,setAudioStatus]=useState('idle');
 const aliveAudio=useRef(true);useEffect(()=>{aliveAudio.current=true;return()=>{aliveAudio.current=false;};},[]);
 useEffect(()=>{if(data&&index!==page)onPage(index);},[data,index,page,onPage]);
 useEffect(()=>{onPageData?.(p||null);},[data,index,layout.examples]);
 useEffect(()=>{setDetail(null);setDetailPage(0);},[request.word,index]);
 const pronounce=text=>{if(text)playModelSpeech(text,{onStatus:s=>{if(aliveAudio.current)setAudioStatus(s);}});};
 const lexicalLinks=useMemo(()=>data?getRelations(data):[],[data]);
 const groups=p?[{label:'Synonyms',ja:'類義語',rows:p.synonyms,type:'synonym'},{label:'Antonyms',ja:'対義語',rows:p.antonyms,type:'contrast'},{label:'Word family',ja:'派生語',rows:p.family,type:'family'},{label:'Collocations',ja:'コロケーション',rows:p.collocations,type:'collocation'}].map(g=>({...g,rows:profileRelationRows(g.rows,lexicalLinks.filter(l=>l.type===g.type))})):[];
 const openDetail=value=>{setDetail(value);setDetailPage(0);};
 const fullText=(title,text,speech='')=>openDetail({type:'text',title,text,speech});
 const activeGroup=groups.find(g=>g.type===detail?.group);
 const textPages=detail?.type==='text'?profileTextPages(detail.text,layout.tiny?140:layout.tight?240:layout.portrait?420:460):[];
 const detailCount=detail?.type==='relations'?Math.max(1,Math.ceil((activeGroup?.rows.length||0)/layout.detailTerms)):detail?.type==='text'?textPages.length:1;
 const di=Math.max(0,Math.min(detailPage,detailCount-1));
 const changePage=n=>{setDetail(null);setDetailPage(0);onPage(n);};
 const audioMessage=audioStatus==='error'?'音声再生に失敗 · 再タップ':audioStatus==='starting'?'音声準備中…':audioStatus==='playing'?'モデル音声を再生中…':'';
 const speakButton=(value,label)=><button type="button" className="vp-sound" aria-label={label} title={label} onClick={()=>pronounce(value)}>▶</button>;
 return <section ref={panel} className={'vu-profile vp-single'+(layout.portrait?' vp-portrait':'')+(layout.tight?' vp-tight':'')+(layout.tiny?' vp-tiny':'')} aria-label={request.word+' の語義と例文'}>
 <header className="vp-bar"><button type="button" onClick={detail?()=>setDetail(null):onBack}>← {detail?'概要':'Back'}</button><span>WORD PROFILE{p?' · 語義 '+(p.senseIndex+1)+'/'+p.senseCount:''}</span><button type="button" disabled={!data} onClick={()=>onExplore(data)}>◉ Universe</button></header>
 {!p?<div className="vp-state" role="status"><h2>{request.word}</h2><p>{error?'登録済みの語義・例文が見つかりませんでした。':'語義と例文を読み込み中…'}</p></div>:<>
 <div className="vp-summary">
  <article className="vp-word-card">
   <div className="vp-word-heading"><div><h1 title={data.word}>{data.word}</h1><div className="vp-badges"><span className="vp-cefr">CEFR {p.cefr||'未登録'}</span><small>{posLabel(p.pos)||'品詞未登録'}</small></div></div>{speakButton(data.word,data.word+' の発音')}</div>
   <p className="vp-ipa">IPA: {p.pronunciation||data.pronunciation||data.ipa||'未登録'}</p>
   <BoundedText className="vp-meaning" text={p.meaning||'日本語訳未登録'} onFull={()=>fullText('日本語の意味',p.meaning||'未登録')}/>
  </article>
  <article className="vp-definition"><div className="vp-card-heading"><h2>ENGLISH DEFINITION <small>英英定義</small></h2>{data.image&&!badImage&&<button type="button" className="vp-link" onClick={()=>openDetail({type:'image',title:'学習画像'})}>画像 ↗</button>}</div>
   <BoundedText className="vp-definition-text" text={p.definition||'英英定義未登録'} onFull={()=>fullText('English definition',p.definition||'未登録',p.definition)}/>
   <div className="vp-meta"><span>{p.draft?'教材β・未校閲':''}{loading?' · 教材読込中':''}</span><span className="vp-audio-status" role="status">{audioMessage}</span></div>
  </article>
 </div>
 {!detail?<div className="vp-content">
  <section className="vp-relations" aria-label="関連語">{groups.map(g=><article className={'vp-lexical-group vp-type-'+g.type} key={g.type}><div className="vp-card-heading"><h2>{g.label} <small>{g.ja}</small></h2>{g.rows.length>0&&<button type="button" className="vp-link" onClick={()=>openDetail({type:'relations',group:g.type,title:g.label+' / '+g.ja})}>{g.rows.length}件 ↗</button>}</div>
  <div className="vp-term-list">{g.rows.length?g.rows.slice(0,layout.previewTerms).map(row=><button type="button" className="vp-term" key={row.word} title={row.word+(row.meaning?' · '+row.meaning:'')} onClick={()=>openDetail({type:'relations',group:g.type,title:g.label+' / '+g.ja})}><span>{row.word}</span>{row.headOnly&&<small>語全体</small>}</button>):<span className="vp-unregistered">未登録</span>}</div></article>)}</section>
  <section className="vp-examples" aria-label="例文"><div className="vp-card-heading"><h2>EXAMPLE SENTENCES <small>例文</small></h2><span className="vp-example-count">{p.examples.length?p.exampleOffset+1+'–'+(p.exampleOffset+p.examples.length)+' / '+p.exampleCount:'0件'}</span></div>
   {p.examples.length?p.examples.map((ex,i)=><article key={ex.en+'|'+i} className="vp-example"><div className="vp-example-top"><small>EXAMPLE {p.exampleOffset+i+1}</small>{speakButton(ex.en,'例文 '+(p.exampleOffset+i+1)+' の発音')}</div>
    <BoundedText className="vp-example-en" text={ex.en} onFull={()=>fullText('Example '+(p.exampleOffset+i+1),ex.en+'\n\n'+(ex.ja||'日本語訳未登録'),ex.en)}/>
    <BoundedText className="vp-example-ja" text={ex.ja||'日本語訳未登録'} onFull={()=>fullText('Example '+(p.exampleOffset+i+1),ex.en+'\n\n'+(ex.ja||'日本語訳未登録'),ex.en)}/>
   </article>):<article className="vp-example"><p>{loading?'例文を読み込み中…':'例文は未登録です。'}</p></article>}
  </section>
 </div>:<section className="vp-detail" aria-label={detail.title}>
  <div className="vp-card-heading"><h2>{detail.title}</h2><button type="button" className="vp-link" onClick={()=>setDetail(null)}>概要に戻る ↗</button></div>
  {detail.type==='relations'?<div className="vp-detail-grid">{(activeGroup?.rows||[]).slice(di*layout.detailTerms,(di+1)*layout.detailTerms).map(row=><article className="vp-detail-term" key={row.word}><div><BoundedText className="vp-detail-word" text={row.word} onFull={()=>fullText(activeGroup.label,row.word+'\n\n'+row.meaning,row.word)}/><BoundedText className="vp-detail-meaning" text={row.meaning||'日本語訳未登録'} onFull={()=>fullText(activeGroup.label,row.word+'\n\n'+row.meaning,row.word)}/>{row.headOnly&&<small>語全体の関連語</small>}</div>{speakButton(row.word,row.word+' の発音')}</article>)}</div>:detail.type==='text'?<div className="vp-full-text"><p>{textPages[di]}</p>{detail.speech&&speakButton(detail.speech,'モデル音声を再生')}</div>:<div className="vp-image-panel">{data.image&&!badImage?<img src={assetImage(data.image)} alt={data.word+' の学習画像'} onError={()=>setBadImage(true)}/>:<p>画像を表示できません</p>}</div>}
 </section>}
 </>}
 <footer className="vp-pager">{detail?<><button type="button" disabled={di===0} onClick={()=>setDetailPage(di-1)}>← 前へ</button><span>{di+1} / {detailCount} · 詳細</span><button type="button" disabled={di>=detailCount-1} onClick={()=>setDetailPage(di+1)}>次へ →</button></>:<><button type="button" disabled={index===0||!data} onClick={()=>changePage(index-1)}>← 前のページ</button><span>{data?index+1+' / '+pages.length:'—'} · 語義・例文</span><button type="button" disabled={!data||index>=pages.length-1} onClick={()=>changePage(index+1)}>次のページ →</button></>}</footer></section>;
}
