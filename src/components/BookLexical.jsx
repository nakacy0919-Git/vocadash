import React,{useEffect,useLayoutEffect,useState,useRef} from 'react';
import {createPortal} from 'react-dom';
import {bookSynonyms,bookCollocations} from '../lib/vocaSheet.js';
import {loadTranslatedCollocations} from '../lib/draftCorpus.js';
export function BookLexical({entry,filtered,onOpen,active}){
 const words=bookSynonyms(entry);
 return <div className="vs-lexical"><small>類義語 <span>SYNONYMS</span></small><div className="vs-synonyms">{words.length?words.map(x=><span key={x.word} title={x.meaning||x.word} lang="en">{x.word}</span>):<span className="vs-lexical-empty">未登録</span>}</div>{filtered?<span className="vs-colloc-button">コロケーション ↗</span>:<button type="button" className="vs-colloc-button" aria-expanded={active} onClick={()=>onOpen(entry)}>コロケーション ↗</button>}</div>;
}
export default function BookCollocation({entry,paper,onClose,onSpeak,sound}){
 const [translated,setTranslated]=useState([]),[state,setState]=useState('loading'),[bounds,setBounds]=useState(null);
 const ref=useRef(null);
 useLayoutEffect(()=>{
  const update=()=>{const rect=paper.current?.getBoundingClientRect();if(!rect)return;const width=document.documentElement.clientWidth,height=window.innerHeight;const left=width<700?8:Math.min(width-260,Math.max(8,rect.left+rect.width/2+6));const top=Math.max(8,Math.min(rect.top+4,height-240));setBounds({left,top,width:Math.max(0,Math.min(rect.right-8,width-8)-left),maxHeight:Math.max(200,Math.min(rect.bottom-4,height-8)-top)});};
  update();window.addEventListener('resize',update);window.addEventListener('scroll',update,true);return()=>{window.removeEventListener('resize',update);window.removeEventListener('scroll',update,true);};
 },[paper]);
 useEffect(()=>{let active=true;setTranslated([]);setState('loading');loadTranslatedCollocations().then(m=>{if(active){setTranslated([...(m.get(entry.sense?.senseId)?.values()||[])]);setState('ready');}}).catch(()=>{if(active)setState('error')});return()=>{active=false;};},[entry.id]);
 useEffect(()=>{ref.current?.focus();const close=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();onClose();}};window.addEventListener('keydown',close,true);return()=>window.removeEventListener('keydown',close,true);},[onClose]);
 const rows=bookCollocations(entry,translated);
 if(!bounds)return null;
 return createPortal(<section className="vs-colloc-pop" style={bounds} role="dialog" aria-label={entry.word+' のコロケーション'} onKeyDown={e=>e.stopPropagation()}><header><div><small>VOCASHEET / COLLOCATIONS</small><h2 lang="en">{entry.word}</h2><p>{entry.meaning} · 一緒に使う表現</p></div><button ref={ref} type="button" onClick={onClose} aria-label="閉じる">×</button></header><div className="vs-colloc-list">{rows.map(x=><article key={x.word}><div><b lang="en">{x.word}</b>{x.meaning&&<span>{x.meaning}</span>}</div><button type="button" disabled={!sound} aria-label={x.word+' を聞く'} onClick={()=>onSpeak?.({...entry,english:x.word,audio:''},true)}>♫</button></article>)}{!rows.length&&<p>{state==='loading'?'読み込み中…':'登録済みのコロケーションはありません。'}</p>}{state==='error'&&<small>追加の和訳を読み込めませんでした。</small>}</div><footer>現在の語義に登録されている表現 · {rows.length}件</footer></section>,document.body);
}
