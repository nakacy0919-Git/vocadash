import React, {useEffect,useId,useMemo,useRef,useState} from 'react';
import {getRelations,orbitNodes,types,tierLabels} from '../lib/universe';
import {assetImage} from '../lib/learning';
import './VocaUniverse.css';
export default function VocaUniverse({entry,words,onClose,onSpeak,sound}) {
 const [center,setCenter]=useState(entry);
 const [trail,setTrail]=useState([]);
 const [filter,setFilter]=useState('all');
 const [selected,setSelected]=useState(null);
 const [badImage,setBadImage]=useState(false);
 const dialog=useRef(null), close=useRef(null), titleId=useId();
 const index=useMemo(()=>new Map(words.map(w=>[w.word.toLowerCase(),w])),[words]);
 const links=useMemo(()=>getRelations(center),[center]);
 const visible=links.filter(x=>filter==='all'||x.type===filter);
 const nodes=orbitNodes(visible);
 const active=selected && visible.find(x=>x.word===selected);
 const target=active && (index.get(active.word.toLowerCase())||active);
 const canExplore=target && getRelations(target).length>0;
 useEffect(()=>{
   const before=document.activeElement;close.current?.focus();
   const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
   return ()=>{document.body.style.overflow=overflow;before?.focus?.();};
 },[]);
 const change=(next)=>{setCenter(next);setSelected(null);setFilter('all');setBadImage(false);};
 const key=(e)=>{
   e.stopPropagation();
   if(e.key==='Escape'){e.preventDefault();onClose();}
   if(e.key==='Tab'){
     const buttons=[...dialog.current.querySelectorAll('button:not([disabled])')];
     const first=buttons[0],last=buttons.at(-1);
     if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
     else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
   }
 };
 return <div className="vu-overlay" onClick={onClose}>
  <section className="vu-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialog} onKeyDown={key} onClick={e=>e.stopPropagation()}>
   <header className="vu-header"><div><small>VOCADASH / SEMANTIC EXPLORER</small><h2 id={titleId}>Voca Universe</h2></div><button ref={close} onClick={onClose} aria-label="閉じる">✕</button></header>
   <div className="vu-toolbar">{trail.length>0&&<button onClick={()=>{change(trail.at(-1));setTrail(t=>t.slice(0,-1));}}>← 前の語</button>}<span>距離は教材上の学習優先度（実測頻度ではありません）</span></div>
   <div className="vu-filters"><button aria-pressed={filter==='all'} onClick={()=>{setFilter('all');setSelected(null);}}>すべて</button>{Object.entries(types).map(([id,label])=><button key={id} data-type={id} aria-pressed={filter===id} onClick={()=>{setFilter(id);setSelected(null);}}>{label}</button>)}</div>
   <div className="vu-map-scroll"><div className="vu-map" key={center.word}>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="vu-orbits">
      {[20,34,44].map(r=><circle key={r} cx="50" cy="50" r={r} className="vu-ring"/>)}
      {nodes.map(n=><line key={n.word} x1="50" y1="50" x2={n.x} y2={n.y} className={'vu-line '+n.type}/>)}
    </svg>
    <div className="vu-center">{center.image&&!badImage&&<img src={assetImage(center.image)} onError={()=>setBadImage(true)} alt={center.word+' の参考画像'}/>}<strong>{center.word}</strong><span>{center.meaning}</span><button disabled={!sound} aria-label={center.word+' の発音'} onClick={()=>onSpeak(center)}>♫ 発音</button></div>
    {nodes.map((n,i)=><button key={n.word} data-type={n.type} className={'vu-node '+(selected===n.word?'is-selected':'')} style={{left:n.x+'%',top:n.y+'%',animationDelay:i*55+'ms'}} onClick={()=>setSelected(n.word)} aria-pressed={selected===n.word}><strong>{n.word}</strong><small>{n.meaning||types[n.type]}</small></button>)}
   </div></div>
   <div className="vu-rings"><span>内側：最優先</span><span>中間：関連</span><span>外側：発展</span></div>
   {!visible.length&&<p className="vu-empty">{links.length?'この種類の関連語は未登録です。':'この単語の関連語データはまだ登録されていません。'}</p>}
   {active&&<div className="vu-detail"><div><small>{types[active.type]} · {tierLabels[active.tier]}</small><h3>{active.word}</h3><p>{active.meaning||target?.meaning||'日本語の意味は準備中'}</p>{target?.english&&<p>{target.english}</p>}</div><div className="vu-detail-actions"><button disabled={!sound} onClick={()=>onSpeak(target)}>♫ 発音</button><button disabled={!canExplore} onClick={()=>{setTrail(t=>[...t,center]);change(target);}}>中心にする →</button></div></div>}
   {visible.length>0&&<details className="vu-list"><summary>関連語一覧（{visible.length}語）</summary><div>{visible.map(n=><button key={n.word} onClick={()=>setSelected(n.word)} data-type={n.type}><strong>{n.word}</strong> <span>{n.meaning||types[n.type]} · {tierLabels[n.tier]}</span></button>)}</div></details>}
  </section></div>;
}
