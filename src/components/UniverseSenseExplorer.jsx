import React,{useMemo,useState} from 'react';
import {candidateTerms,candidateTargets,linkedFrom,sensesFor,searchSenses,senseById,senseNetworkStats} from '../lib/universe-senses';
import {orbitNodes,orbitPageCount,ORBIT_RADII} from '../lib/universe';
const stats=senseNetworkStats();
export default function UniverseSenseExplorer({initialWord,onSpeak,sound,onBack}){
 const [query,setQuery]=useState(initialWord||'');
 const [id,setId]=useState(null);
 const [trail,setTrail]=useState([]);
 const [selected,setSelected]=useState(null);
 const [page,setPage]=useState(0);
 const [view,setView]=useState('map');
 const entry=senseById(id);
 const results=useMemo(()=>searchSenses(query),[query]);
 const terms=useMemo(()=>candidateTerms(entry),[entry]);
 const pages=orbitPageCount(terms),nodes=orbitNodes(terms,Math.min(page,pages-1));
 const active=terms.find(t=>t.word===selected);
 const targets=candidateTargets(active);
 const incoming=entry?linkedFrom(entry.word):[];
 const choose=e=>{if(entry&&entry.id!==e.id)setTrail(t=>[...t,entry.id]);setId(e.id);setPage(0);setSelected(null);};
 const back=()=>{const previous=trail.at(-1);setTrail(t=>t.slice(0,-1));setId(previous||null);setPage(0);setSelected(null);};
 const speak=(word)=>onSpeak({word});
 return <div className="vu-draft-explorer">
  <div className="vu-draft-banner"><strong>オリジナル教材 · 開発プレビュー</strong><span>未レビューの語義・関連語候補です。通常の関連語マップとは分離しています。</span><small>{stats.headwords.toLocaleString()}語 / {stats.senses.toLocaleString()}語義 · 英英定義・例文付き</small></div>
  <div className="vu-draft-nav"><button onClick={onBack}>← 通常のマップ</button>{entry&&<button onClick={back}>← {trail.length?'前の語義':'語義検索へ'}</button>}</div>
  <div className="vu-search-wrap"><label htmlFor="vu-draft-query">英単語・日本語から語義を探す</label><input id="vu-draft-query" type="search" value={query} onChange={e=>{setQuery(e.target.value);setId(null);setTrail([]);setSelected(null);setPage(0);}} placeholder="例：character / 性格"/></div>
  {!entry&&<div className="vu-sense-results">{results.length?results.map(r=><button key={r.id} onClick={()=>choose(r)}><strong>{r.word} <small>{r.pos} · {r.cefr}</small></strong><span>{r.meaning}</span><small lang="en">{r.definition}</small></button>):<p>該当する語義がありません。別の表記で検索してください。</p>}</div>}
  {entry&&<>
   {sensesFor(entry.word).length>1&&<div className="vu-sense-alternatives"><span>同じ単語の別語義</span>{sensesFor(entry.word).map(r=><button key={r.id} aria-pressed={r.id===entry.id} onClick={()=>choose(r)}>{r.pos} · {r.meaning}</button>)}</div>}
   <section className="vu-draft-definition"><h3>{entry.word} <small>{entry.pos} · {entry.cefr}</small></h3><p>{entry.meaning}</p><p lang="en">{entry.definition}</p><button disabled={!sound} onClick={()=>speak(entry.word)}>♫ 発音</button></section>
   <div className="vu-display-tools"><div className="vu-view-switch"><button aria-pressed={view==='map'} onClick={()=>setView('map')}>◉ マップ</button><button aria-pressed={view==='list'} onClick={()=>setView('list')}>☰ 一覧</button></div><span>{terms.length}件の関連語候補</span></div>
   {view==='map'&&terms.length>0&&<><div className="vu-map-scroll"><div className="vu-map" key={entry.id}><svg viewBox="0 0 100 100" className="vu-orbits" aria-hidden="true">{ORBIT_RADII.map(r=><circle key={r} cx="50" cy="50" r={r} className="vu-ring"/>)}{nodes.map(n=><line key={n.word} x1="50" y1="50" x2={n.x} y2={n.y} className="vu-line related"/>)}</svg><div className="vu-center"><strong>{entry.word}</strong><span>{entry.meaning}</span></div>{nodes.map((n,i)=><button key={n.word} className={'vu-node '+(selected===n.word?'is-selected':'')} data-type="related" style={{left:n.x+'%',top:n.y+'%',animationDelay:i*55+'ms'}} aria-pressed={selected===n.word} onClick={()=>setSelected(n.word)}><strong>{n.word}</strong><small>{n.qualifier||'候補'}</small></button>)}</div></div>{pages>1&&<div className="vu-pagination"><button disabled={page===0} onClick={()=>setPage(p=>p-1)}>← 前へ</button><span>{page+1}/{pages}</span><button disabled={page>=pages-1} onClick={()=>setPage(p=>p+1)}>次へ →</button></div>}</>}
   {view==='list'&&terms.length>0&&<div className="vu-sense-results">{terms.map(n=><button key={n.word} onClick={()=>setSelected(n.word)} aria-pressed={selected===n.word}><strong>{n.word}</strong><small>{n.qualifier||'関連語候補'}</small></button>)}</div>}
   {!terms.length&&<p className="vu-empty">関連語候補は未登録です。英英定義・例文は学習できます。</p>}
   {active&&<div className="vu-usage-note"><strong>{active.word} · 未レビュー候補</strong>{active.qualifier&&<p>元データの注記：{active.qualifier}</p>}<p>候補の語義を確認して選択してください。綴りが同じだけでは自動接続しません。</p><button disabled={!sound} onClick={()=>speak(active.word)}>♫ 発音</button>{targets.length>0?<div className="vu-sense-results">{targets.map(r=><button key={r.id} onClick={()=>choose(r)}><strong>{r.word} <small>{r.pos}</small></strong><span>{r.meaning}</span><small lang="en">{r.definition}</small></button>)}</div>:<p>候補語の語義カードは未登録です。</p>}</div>}
   <section className="vu-usage-note"><strong>この語義のオリジナル例文</strong>{entry.examples.map(([en,ja],i)=><div key={i} className="vu-draft-example"><p lang="en">{en}</p><small>{ja}</small></div>)}</section>
   {entry.imageHint&&<p className="vu-map-sense">将来の画像制作のヒント：{entry.imageHint}（画像未登録）</p>}
   {incoming.length>0&&<section className="vu-usage-note"><strong>この表現を候補に持つ語義</strong><p>逆方向の参照です。同義語と確定したわけではありません。</p><div className="vu-sense-results">{incoming.slice(0,25).map(r=><button key={r.id} onClick={()=>choose(r)}><strong>{r.word}</strong><span>{r.meaning}</span></button>)}</div>{incoming.length>25&&<small>先頭25件を表示</small>}</section>}
  </>}
 </div>;
}
