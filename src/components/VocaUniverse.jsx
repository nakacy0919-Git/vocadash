import React, {useEffect,useLayoutEffect,useId,useMemo,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {getRelations,orbitNodes,orbitPageCount,ORBIT_RADII,lookupUniverse,universeEntries,types,tierLabels,getWordForms} from '../lib/universe';
import {assetImage} from '../lib/learning';
import {centerFromRelation} from '../lib/universeNavigation.js';
import './VocaUniverse.css';
export default function VocaUniverse({entry,words,onClose,onSpeak,sound,effects=true,onToggleEffects,onWarp,voiceDockRef,initialFilter='all'}) {
 const [center,setCenter]=useState(entry);
 const [trail,setTrail]=useState([]);
 const [query,setQuery]=useState('');
 const catalog=useMemo(()=>universeEntries(),[]);
 const searchResults=useMemo(()=>{const q=query.trim().toLowerCase();if(!q)return [];return catalog.filter(w=>w.word.includes(q)||w.meaning.includes(q)).sort((a,b)=>Number(b.word.startsWith(q))-Number(a.word.startsWith(q))||a.word.localeCompare(b.word)).slice(0,8);},[catalog,query]);
 const [filter,setFilter]=useState(initialFilter==='forms'?'all':initialFilter);
 const [warpVersion,setWarpVersion]=useState(0);
 const [badImage,setBadImage]=useState(false);
 const [showImages,setShowImages]=useState(true);
 const [view,setView]=useState(initialFilter==='forms'?'list':'map');
 const [page,setPage]=useState(0);
 const dialog=useRef(null), close=useRef(null), overlay=useRef(null), titleId=useId();
 const [searchOpen,setSearchOpen]=useState(false);
 const index=useMemo(()=>new Map(words.map(w=>[w.word.toLowerCase(),w])),[words]);
 const links=useMemo(()=>getRelations(center),[center]);
 const mapSense=lookupUniverse(center.word)?.meaning;
 const formRows=getWordForms(center.word);
 const visible=links.filter(x=>filter==='all'||x.type===filter);
 const pageCount=orbitPageCount(visible);
 const nodes=orbitNodes(visible,Math.min(page,pageCount-1));
 useEffect(()=>{
   const before=document.activeElement;
   const body=document.body,root=document.documentElement;
   const oldBody=body.style.overflow,oldRoot=root.style.overflow;
   body.style.overflow='hidden';root.style.overflow='hidden';
   const viewport=window.visualViewport;
   const fit=()=>{const el=overlay.current;if(!el)return;el.style.setProperty('--vu-vw',(viewport?.width||window.innerWidth)+'px');el.style.setProperty('--vu-vh',(viewport?.height||window.innerHeight)+'px');el.style.setProperty('--vu-vx',(viewport?.offsetLeft||0)+'px');el.style.setProperty('--vu-vy',(viewport?.offsetTop||0)+'px');};
   fit();window.addEventListener('resize',fit);viewport?.addEventListener('resize',fit);viewport?.addEventListener('scroll',fit);
   close.current?.focus({preventScroll:true});
   return ()=>{window.removeEventListener('resize',fit);viewport?.removeEventListener('resize',fit);viewport?.removeEventListener('scroll',fit);body.style.overflow=oldBody;root.style.overflow=oldRoot;before?.focus?.({preventScroll:true});};
 },[]);

 const change=(next)=>{if(!next)return;const changed=next.word.toLowerCase()!==center.word.toLowerCase();setCenter(next);setFilter('all');setBadImage(false);setPage(0);setQuery('');setSearchOpen(false);if(changed){setWarpVersion(v=>v+1);onWarp?.();}};
 const explore=node=>{const next=centerFromRelation(node,lookupUniverse,index);if(!next)return;if(next.word.toLowerCase()!==center.word.toLowerCase())setTrail(t=>[...t,center]);change(next);setView('map');};
 useLayoutEffect(()=>{
   const handler=e=>{
    const c=e.detail, kind=c.kind,value=c.value;
    const done=msg=>{c.handled=true;c.message=msg||'OK';};
    if(kind==='filter'){if(value==='forms'){setView('list');setFilter('all');}else{setFilter(value);setView('map');}setPage(0);done(value==='forms'?'Word forms':value==='all'?'All relations':(types[value]||value)+' · '+links.filter(x=>x.type===value).length);return;}
    if(kind==='list'||kind==='map'){setView(kind);done();return;}
    if(kind==='images'){setShowImages(value==='show');done();return;}
    if(kind==='next'){setPage(p=>Math.min(p+1,pageCount-1));done();return;}
    if(kind==='previous'){if(trail.length){change(trail.at(-1));setTrail(t=>t.slice(0,-1));done('Previous word');}else done('No previous word');return;}
    if(kind==='pageBack'){setPage(p=>Math.max(0,p-1));done('Previous page');return;}
    if(kind==='back'||kind==='close'){onClose();done('Back to Dash Assistant');return;}
    if(['focus','search','universe'].includes(kind)&&value){
     const k=value.trim().toLowerCase(),link=links.find(x=>x.word.toLowerCase()===k),item=lookupUniverse(k),local=index.get(k),resolved=c.resolvedEntry;
     if(!link&&!item&&!local&&!resolved){if(!c.localOnly)done('未登録: '+value);return;}
     if(center.word.toLowerCase()!==k)setTrail(t=>[...t,center]);const next={...link,...item,...local,...resolved,word:resolved?.word||local?.word||item?.word||link?.word||k,meaning:resolved?.meaning||local?.meaning||item?.meaning||link?.meaning||''};change(next);setView('map');c.entry=next;done('Focus: '+k);return;
    }
    if(kind==='read'){const item=center;if(!sound){done('音声設定がオフです');return;}if(value){if(value==='first'&&item.english){const u=new SpeechSynthesisUtterance(item.english);u.lang='en-US';window.speechSynthesis.speak(u);}else{done('この画面にはその例文がありません');return;}}else onSpeak(item);done();return;}
    if(kind==='meaning'||kind==='examples'){c.entry=center;done();return;}
    if(kind==='universe'){setView('map');done();return;}
   };
   window.addEventListener('vd-universe-voice',handler);
   return()=>window.removeEventListener('vd-universe-voice',handler);
 });
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
 return createPortal(<div ref={overlay} className="vu-overlay vu-portal-open" onClick={onClose}>
  <div key={warpVersion} className="vu-warp" aria-hidden="true"><div className="vu-warp-core"/>{Array.from({length:24},(_,i)=><i key={i} style={{"--vu-angle":(i*15)+"deg","--vu-delay":(i%6)*.024+"s","--vu-length":(18+(i*7)%21)+"vmin"}}/>)}<span>{warpVersion===0?"ENTERING VOCA UNIVERSE":center.word.toUpperCase()}</span></div>
  <section className="vu-dialog vu-dialog-warp" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialog} onKeyDown={key} onClick={e=>e.stopPropagation()}>
   <div className="vu-space" aria-hidden="true"><div className="vu-space-nebula"/><div className="vu-space-stars near"/><div className="vu-space-stars far"/></div>
   <header className="vu-header"><div><small>VOCADASH / SEMANTIC EXPLORER</small><h2 id={titleId}>Voca Universe</h2></div><div className="vu-header-actions"><button className="vu-effects-toggle" aria-pressed={effects} onClick={onToggleEffects} aria-label={effects?"ワープ効果音をオフ":"ワープ効果音をオン"}>{effects?"♫ 効果音 ON":"♪ 効果音 OFF"}</button><button aria-expanded={searchOpen} aria-controls={titleId+"-search-panel"} onClick={()=>{setSearchOpen(v=>!v);setQuery("");}}>⌕ 語彙検索</button><button className="vu-close" ref={close} onClick={onClose} aria-label="閉じる">✕</button></div></header>
   <div ref={voiceDockRef} className="vu-voice-dock"/>
   <div className="vu-controls">
   <div className="vu-toolbar">{trail.length>0&&<button onClick={()=>{change(trail.at(-1));setTrail(t=>t.slice(0,-1));}}>← 前の語</button>}{trail.length>0&&<button onClick={()=>{change(entry);setTrail([]);}}>最初の語へ</button>}<span>距離は関連性・使用頻度の教材上の優先度（実測頻度ではありません）</span></div>
   <div className="vu-filters"><button aria-pressed={filter==='all'} onClick={()=>{setFilter('all');setPage(0);}}>すべて</button>{Object.entries(types).map(([id,label])=><button key={id} data-type={id} aria-pressed={filter===id} onClick={()=>{setFilter(id);setPage(0);}}>{label}</button>)}</div>
   {searchOpen&&<div className="vu-search-wrap" id={titleId+"-search-panel"}><label htmlFor={titleId+'-search'}>ネットワーク内の語彙を探す</label><input id={titleId+'-search'} type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="英単語・日本語で検索" autoComplete="off"/>{query.trim()&&<div className="vu-search-results">{searchResults.length?searchResults.map(item=><button key={item.word} onClick={()=>explore(item)}><strong>{item.word}</strong><small>{item.meaning}</small></button>):<p>登録済みの中心語が見つかりません。</p>}</div>}</div>}
   
   <div className="vu-display-tools"><div className="vu-view-switch"><button aria-pressed={view==='map'} onClick={()=>setView('map')}>◉ マップ</button><button aria-pressed={view==='list'} onClick={()=>setView('list')}>☰ 一覧</button></div><label><input type="checkbox" checked={showImages} onChange={e=>setShowImages(e.target.checked)}/> 画像を表示</label></div>
   </div>
   <div className="vu-workspace"> <div className={"vu-stage"+(view==="list"?" is-list":"")}> 
   {view==='map' && <><div className="vu-map-scroll"><div className="vu-map" key={center.word}>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="vu-orbits">
      {ORBIT_RADII.map(r=><circle key={r} cx="50" cy="50" r={r} className="vu-ring"/>)}
      {nodes.map(n=><line key={n.word} x1="50" y1="50" x2={n.x} y2={n.y} className={'vu-line '+n.type}/>)}
    </svg>
    <div className="vu-center">{showImages&&center.image&&!badImage&&<img src={assetImage(center.image)} onError={()=>setBadImage(true)} alt={center.word+' の参考画像'}/>}<strong>{center.word}</strong><span>{mapSense||center.meaning}</span><button disabled={!sound} aria-label={center.word+' の発音'} onClick={()=>onSpeak(center)}>♫ 発音</button></div>
    {nodes.map((n,i)=><button key={n.word} data-type={n.type} className="vu-node" style={{left:n.x+'%',top:n.y+'%',animationDelay:(280+i*65)+'ms','--vu-from-x':(50-n.x)/100*100+'cqw','--vu-from-y':(50-n.y)/100*100+'cqh'}} onClick={()=>explore(n)} aria-label={n.word+" を中心に表示"}><strong>{n.word}</strong><small>{n.meaning||types[n.type]}</small></button>)}
   </div></div>
   <div className="vu-rings"><span>{visible.length}件の関連語</span><span>内側：最優先</span><span>中間：関連</span><span>外側：発展</span></div>
   {pageCount>1&&<div className="vu-pagination"><button disabled={page===0} onClick={()=>{setPage(p=>p-1);}}>← 前へ</button><span>{page+1} / {pageCount}</span><button disabled={page>=pageCount-1} onClick={()=>{setPage(p=>p+1);}}>次へ →</button></div>}</>}
   {view==='list'&&<section className="vu-list-center"><strong>{center.word}</strong><span>{center.meaning}</span><button disabled={!sound} onClick={()=>onSpeak(center)}>♫ 発音</button>{formRows.length>0&&<details><summary>語形変化</summary>{formRows.map(row=><p key={row.label}><small>{row.label}：</small> {row.forms.join(" / ")}</p>)}</details>}</section>}
   {!visible.length&&<p className="vu-empty">{links.length?'この種類の関連語は未登録です。':'この単語の関連語データはまだ登録されていません。'}</p>}
   
   {visible.length>0&&view==='list'&&<div className="vu-full-list">{Object.entries(tierLabels).map(([tier,label])=>{const group=visible.filter(n=>n.tier===tier);return group.length>0&&<section key={tier}><h3>{label} <small>{group.length}語</small></h3>{group.map(n=><button key={n.word} onClick={()=>explore(n)} aria-label={n.word+" を中心に表示"} data-type={n.type}><strong>{n.word}</strong><span>{n.meaning||types[n.type]} · {types[n.type]}</span></button>)}</section>})}</div>}
  </div>
  </div>
  </section></div>,document.body);
}
