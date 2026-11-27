import React,{useEffect,useRef,useState} from 'react';
import {INITIAL_SHEET,boundSheet,moveSheet,sizeSheet,sheetClip,isRedField} from '../lib/redSheet.js';
import {posLabel} from '../lib/courseLibrary.js';
import './RedSheet.css';

export default function RedSheet({items,start,page,total}){
 const [mode,setMode]=useState('meaning'),[custom,setCustom]=useState(false),[overrides,setOverrides]=useState({});
 const [rect,setRect]=useState(INITIAL_SHEET),[visible,setVisible]=useState(true),[size,setSize]=useState('medium'),[dragging,setDragging]=useState(false);
 const paper=useRef(null),gesture=useRef(null),handle=useRef(null);
 useEffect(()=>{gesture.current=null;setDragging(false);},[page]);
 const changeMode=m=>{setMode(m);setOverrides({});setCustom(false);};
 const changeSize=s=>{setSize(s);setRect(r=>sizeSheet(r,s));setVisible(true);};
 const toggle=(id,field)=>{setOverrides(prev=>({...prev,[id+':'+field]:!isRedField(mode,prev,id,field)}));};
 const down=e=>{
   if(e.button!==0||gesture.current||!paper.current)return;
   const bounds=paper.current.getBoundingClientRect();if(!bounds.width||!bounds.height)return;
   e.preventDefault();e.currentTarget.focus({preventScroll:true});e.currentTarget.setPointerCapture(e.pointerId);
   gesture.current={id:e.pointerId,x:e.clientX,y:e.clientY,rect,width:bounds.width,height:bounds.height};setDragging(true);
 };
 const move=e=>{const g=gesture.current;if(!g||g.id!==e.pointerId)return;setRect(moveSheet(g.rect,(e.clientX-g.x)/g.width,(e.clientY-g.y)/g.height));};
 const finish=e=>{if(gesture.current?.id!==e.pointerId)return;gesture.current=null;setDragging(false);if(e.currentTarget.hasPointerCapture?.(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);};
 const keyMove=e=>{const n=e.shiftKey?.1:.025;const delta={ArrowLeft:[-n,0],ArrowRight:[n,0],ArrowUp:[0,-n],ArrowDown:[0,n]}[e.key];if(delta){e.preventDefault();setRect(r=>moveSheet(r,...delta));}};
 const reset=()=>{setRect(INITIAL_SHEET);setSize('medium');setVisible(true);};
 const renderPaper=filtered=><div className={'rs-paper-grid'+(filtered?' rs-filtered':'')} aria-hidden={filtered?true:undefined}>{items.map((w,i)=><div className="rs-row" key={w.id}><div className="rs-index"><b>{String(start+i+1).padStart(2,'0')}</b><small>{posLabel(w.partOfSpeech)}</small></div>{['word','meaning'].map(field=>{
 const red=isRedField(mode,overrides,w.id,field),cls='rs-field rs-'+field+(red?' rs-red-ink':'')+(custom?' rs-editable':'');
 const value=w[field]||'—';
 return !filtered&&custom?<button type="button" key={field} className={cls} aria-pressed={red} aria-label={(field==='word'?'英単語':'日本語訳')+'の赤字を切り替える '+value} onClick={()=>toggle(w.id,field)}>{value}</button>:<span key={field} className={cls} lang={field==='word'?'en':'ja'}>{value}</span>;
 })}</div>)}</div>;
 const r=boundSheet(rect);
 return <section className="rs-workspace" aria-label="リアル赤シート学習">
  <div className="rs-heading"><div className="rs-emblem" aria-hidden="true"><svg viewBox="0 0 44 44" fill="none"><rect x="5" y="6" width="27" height="34" rx="3" fill="#fff8e8" stroke="#9f8051" strokeWidth="1.5"/><path d="M11 14h15M11 20h15M11 26h15M11 32h10" stroke="#b69e78" strokeWidth="2" strokeLinecap="round"/><rect x="17" y="3" width="23" height="34" rx="3" fill="#c72d49" fillOpacity=".79" stroke="#a41d3a" strokeWidth="1.5"/><path d="M21 8h14" stroke="#ffcfcc" strokeWidth="2" strokeLinecap="round"/></svg></div><div><small>VOCADASH / RED SHEET LAB</small><h2>リアル赤シート</h2><p>指でシートを動かすと、重なった赤字だけが消えます。</p></div><span className="rs-page-count">{start+1}–{start+items.length} / {total}語</span></div>
  <div className="rs-controls"><div className="rs-control-group"><span>赤字にする箇所</span><div role="group" aria-label="赤字にする箇所">{[['meaning','日本語訳'],['word','英単語'],['both','両方']].map(([m,label])=><button key={m} type="button" aria-pressed={mode===m&&!Object.keys(overrides).length} onClick={()=>changeMode(m)}>{label}</button>)}<button type="button" aria-pressed={custom} onClick={()=>{setCustom(v=>!v);setVisible(false);}}>個別設定</button></div></div>
  <div className="rs-control-group"><span>シートサイズ</span><div role="group" aria-label="シートサイズ">{[['small','小'],['medium','縦長'],['wide','ワイド']].map(([s,label])=><button type="button" key={s} aria-pressed={size===s&&visible} onClick={()=>changeSize(s)}>{label}</button>)}</div></div>
  <div className="rs-control-group rs-visibility"><span>シート操作</span><div><button type="button" onClick={()=>setVisible(v=>!v)} aria-pressed={visible}>{visible?'シートを外す':'シートを置く'}</button><button type="button" onClick={()=>changeSize('full')}>全て覆う</button><button type="button" onClick={reset}>初期位置</button></div></div></div>
  <div className="rs-instruction"><span className="rs-ink-sample">赤字</span><span>{custom?'単語・意味をタップして赤字／黒字を切り替えます。':'赤いシートをつかんで自由に移動。黒い文字は透けて見えます。'}</span><span className="rs-key-hint">PC：矢印キーでも移動</span></div>
  <div className="rs-paper" ref={paper}>{renderPaper(false)}
    {visible&&<><div className="rs-optical-layer" aria-hidden="true" style={{clipPath:sheetClip(r),WebkitClipPath:sheetClip(r)}}>{renderPaper(true)}</div><div ref={handle} className={'rs-sheet-handle'+(dragging?' is-dragging':'')} role="button" tabIndex={0} aria-label="赤シートを移動。矢印キーで移動、Shiftと矢印で大きく移動" style={{left:r.x*100+'%',top:r.y*100+'%',width:r.w*100+'%',height:r.h*100+'%'}} onPointerDown={down} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish} onKeyDown={keyMove}><span className="rs-grip" aria-hidden="true">⠿</span></div></>}
  </div>
  <div className="rs-footer"><span>赤シートで隠すだけでは学習記録は変わりません。</span><span>次のページにも同じ赤字設定を適用</span></div>
 </section>;
}
