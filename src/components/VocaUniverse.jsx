import React, {useEffect,useId,useMemo,useRef,useState} from 'react';
import {getRelations,orbitNodes,orbitPageCount,ORBIT_RADII,lookupUniverse,types,tierLabels} from '../lib/universe';
import {assetImage} from '../lib/learning';
import './VocaUniverse.css';
export default function VocaUniverse({entry,words,onClose,onSpeak,sound}) {
 const [center,setCenter]=useState(entry);
 const [trail,setTrail]=useState([]);
 const [filter,setFilter]=useState('all');
 const [selected,setSelected]=useState(null);
 const [badImage,setBadImage]=useState(false);
 const [targetImageError,setTargetImageError]=useState('');
 const [showImages,setShowImages]=useState(true);
 const [view,setView]=useState('map');
 const [page,setPage]=useState(0);
 const dialog=useRef(null), close=useRef(null), mapScroll=useRef(null), titleId=useId();
 const index=useMemo(()=>new Map(words.map(w=>[w.word.toLowerCase(),w])),[words]);
 const links=useMemo(()=>getRelations(center),[center]);
 const visible=links.filter(x=>filter==='all'||x.type===filter);
 const pageCount=orbitPageCount(visible);
 const nodes=orbitNodes(visible,Math.min(page,pageCount-1));
 const active=selected && visible.find(x=>x.word===selected);
 const target=active && {...active,...(lookupUniverse(active.word)||{}),...(index.get(active.word.toLowerCase())||{}),word:active.word,meaning:active.meaning||index.get(active.word.toLowerCase())?.meaning||lookupUniverse(active.word)?.meaning};
 const canExplore=target && getRelations(target).length>0;
 useEffect(()=>{
   const before=document.activeElement;close.current?.focus();
   const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
   return ()=>{document.body.style.overflow=overflow;before?.focus?.();};
 },[]);
 useEffect(()=>{
   const el=mapScroll.current;
   if(el) el.scrollLeft=Math.max(0,(el.scrollWidth-el.clientWidth)/2);
 },[view,center.word]);
 const change=(next)=>{setCenter(next);setSelected(null);setFilter('all');setBadImage(false);setTargetImageError('');setPage(0);};
 const key=(e)=>{
   e.stopPropagation();
   if(e.key==='Escape'){e.preventDefault();onClose();}
   if(e.key==='Tab'){
     const buttons=[...dialog.current.querySelectorAll('button:not([disabled]), summary, input')].filter(el=>el.getClientRects().length>0);
     const first=buttons[0],last=buttons.at(-1);
     if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
     else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
   }
 };
 return <div className="vu-overlay" onClick={onClose}>
  <section className="vu-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialog} onKeyDown={key} onClick={e=>e.stopPropagation()}>
   <header className="vu-header"><div><small>VOCADASH / SEMANTIC EXPLORER</small><h2 id={titleId}>Voca Universe</h2></div><button ref={close} onClick={onClose} aria-label="閉じる">✕</button></header>
   <div className="vu-toolbar">{trail.length>0&&<button onClick={()=>{change(trail.at(-1));setTrail(t=>t.slice(0,-1));}}>← 前の語</button>}<span>距離は関連性・使用頻度の教材上の優先度（実測頻度ではありません）</span></div>
   <div className="vu-filters"><button aria-pressed={filter==='all'} onClick={()=>{setFilter('all');setSelected(null);setPage(0);}}>すべて</button>{Object.entries(types).map(([id,label])=><button key={id} data-type={id} aria-pressed={filter===id} onClick={()=>{setFilter(id);setSelected(null);setPage(0);}}>{label}</button>)}</div>
   <div className="vu-display-tools"><div className="vu-view-switch"><button aria-pressed={view==='map'} onClick={()=>setView('map')}>◉ マップ</button><button aria-pressed={view==='list'} onClick={()=>setView('list')}>☰ 一覧</button></div><label><input type="checkbox" checked={showImages} onChange={e=>setShowImages(e.target.checked)}/> 画像を表示</label></div>
   {view==='map' && <><div ref={mapScroll} className="vu-map-scroll"><div className="vu-map" key={center.word}>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="vu-orbits">
      {ORBIT_RADII.map(r=><circle key={r} cx="50" cy="50" r={r} className="vu-ring"/>)}
      {nodes.map(n=><line key={n.word} x1="50" y1="50" x2={n.x} y2={n.y} className={'vu-line '+n.type}/>)}
    </svg>
    <div className="vu-center">{showImages&&center.image&&!badImage&&<img src={assetImage(center.image)} onError={()=>setBadImage(true)} alt={center.word+' の参考画像'}/>}<strong>{center.word}</strong><span>{center.meaning}</span><button disabled={!sound} aria-label={center.word+' の発音'} onClick={()=>onSpeak(center)}>♫ 発音</button></div>
    {nodes.map((n,i)=><button key={n.word} data-type={n.type} className={'vu-node '+(selected===n.word?'is-selected':'')} style={{left:n.x+'%',top:n.y+'%',animationDelay:i*55+'ms'}} onClick={()=>setSelected(n.word)} aria-pressed={selected===n.word}><strong>{n.word}</strong><small>{n.meaning||types[n.type]}</small></button>)}
   </div></div>
   <div className="vu-rings"><span>内側：最優先</span><span>中間：関連</span><span>外側：発展</span></div>
   {pageCount>1&&<div className="vu-pagination"><button disabled={page===0} onClick={()=>{setPage(p=>p-1);setSelected(null);}}>← 前へ</button><span>{page+1} / {pageCount}</span><button disabled={page>=pageCount-1} onClick={()=>{setPage(p=>p+1);setSelected(null);}}>次へ →</button></div>}</>}
   {view==='list'&&<section className="vu-list-center"><strong>{center.word}</strong><span>{center.meaning}</span><button disabled={!sound} onClick={()=>onSpeak(center)}>♫ 発音</button></section>}
   {!visible.length&&<p className="vu-empty">{links.length?'この種類の関連語は未登録です。':'この単語の関連語データはまだ登録されていません。'}</p>}
   {active&&<div className="vu-detail" aria-live="polite"><div><small>{types[active.type]} · {tierLabels[active.tier]}</small><h3>{active.word}</h3><p>{active.meaning||target?.meaning||'日本語の意味は準備中'}</p>{target?.english&&<p>{target.english}</p>}{target?.japanese&&<small>{target.japanese}</small>}{active.reverse&&<p className="vu-reverse">登録済みの語からの逆方向リンク</p>}</div>{showImages&&target?.image&&targetImageError!==target.image&&<img className="vu-detail-image" src={assetImage(target.image)} alt={active.word+' の参考画像'} onError={()=>setTargetImageError(target.image)}/>}<div className="vu-detail-actions"><button disabled={!sound} onClick={()=>onSpeak(target)}>♫ 発音</button><button disabled={!canExplore} onClick={()=>{setTrail(t=>[...t,center]);change(target);}}>中心にする →</button></div></div>}
   {visible.length>0&&view==='list'&&<div className="vu-full-list">{Object.entries(tierLabels).map(([tier,label])=>{const group=visible.filter(n=>n.tier===tier);return group.length>0&&<section key={tier}><h3>{label} <small>{group.length}語</small></h3>{group.map(n=><button key={n.word} aria-pressed={selected===n.word} onClick={()=>setSelected(n.word)} data-type={n.type}><strong>{n.word}</strong><span>{n.meaning||types[n.type]} · {types[n.type]}</span></button>)}</section>})}</div>}
  </section></div>;
}
