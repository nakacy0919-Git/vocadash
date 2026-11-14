import React,{useState,useEffect,useRef} from 'react';
import './LearningSpace.css';
const goals=[
 {id:'learn',tag:'01 / LEARN',icon:'▣',title:'単語を覚えたい',sub:'意味・例文・音声で語彙を増やす',tone:'cyan'},
 {id:'practice',tag:'02 / PRACTICE',icon:'↗',title:'単語を練習したい',sub:'クイズ・音読・聞き取りで定着',tone:'mint'},
 {id:'exam',tag:'03 / EXAM',icon:'◎',title:'資格試験・入試対策',sub:'レベルや学校の教材から選ぶ',tone:'violet'},
 {id:'review',tag:'04 / REVIEW',icon:'↻',title:'復習したい',sub:'覚えた語彙をもう一度確認',tone:'amber'}
];
const studyModes=[
 {id:'memory',title:'Memory Mission',sub:'定着度に応じた反復クイズ・自動復習',icon:'↻'},
 {id:'study',title:'単語カード',sub:'単語から意味を思い出す',icon:'▣'},
 {id:'sentence',title:'例文カード',sub:'文脈から語彙を理解する',icon:'▤'},
 {id:'reading',title:'例文を音読',sub:'声に出して定着させる',icon:'◉'},
 {id:'quiz',title:'確認テスト',sub:'4択で理解を確認する',icon:'✦'},
 {id:'listening',title:'音声 × 画像',sub:'音を聞いて画像を選ぶ（対応教材のみ）',icon:'♫'},
 {id:'review',title:'間隔反復・復習',sub:'復習時期の語彙を練習する',icon:'↻'}
];
const allowed={learn:['study','sentence'],practice:['quiz','sentence','reading','listening'],exam:['study','sentence','quiz','reading','listening','review'],review:['review']};
const sourceGroups=[
 ['基礎・中学','中学英単語1800、速読英単語 中学版、キクタン 中学英単語など'],
 ['高校基礎・標準','ターゲット1200 / 1400 / 1900、システム英単語、LEAP、Stock、DataBaseなど'],
 ['上級・大学入試','鉄壁、単語王、DUO 3.0、速読英単語 上級編など'],
 ['資格・国際基準','パス単などの資格試験教材、CEFR-J A1–B2、C1/C2語彙基盤']
];
function Orb({large=false}){
 return <div className={'ls-orb '+(large?'ls-orb-large':'')} aria-hidden="true"><div className="ls-orbit ls-orbit-a"/><div className="ls-orbit ls-orbit-b"/><div className="ls-orb-core"><i/><i/><i/><i/><span className="ls-wave">{[9,18,13,30,44,22,35,14,26,10,18].map((h,i)=><b key={i} style={{'--h':h+'%','--i':i}}/>)}</span></div></div>;
}
export function Opening(){
 const [show,setShow]=useState(()=>{try{return !sessionStorage.getItem('vocadash-3-intro');}catch{return true;}});
 useEffect(()=>{if(!show)return;const t=setTimeout(()=>setShow(false),2250);return()=>clearTimeout(t);},[show]);
 useEffect(()=>{if(!show)try{sessionStorage.setItem('vocadash-3-intro','1')}catch{}},[show]);
 if(!show)return null;
 return <div className="ls-opening" role="presentation" onClick={()=>setShow(false)}><div className="ls-stars"/><div className="ls-opening-content"><span className="ls-eyebrow">VOCADASH / VERSION 3.0</span><Orb large/><h1>Beyond Words.</h1><p>Learn. Practice. Connect.</p><span className="ls-intro-jp">言葉を覚える、その先へ。</span></div><button className="ls-skip" onClick={()=>setShow(false)}>スキップ ›</button></div>;
}
function Dialog({title,onClose,children}){
 const ref=useRef(null);
 useEffect(()=>{const el=ref.current;if(!el)return;el.showModal();return()=>{if(el.open)el.close()};},[]);
 return <dialog ref={ref} className="ls-dialog" aria-labelledby="ls-dialog-title" onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose()}}}><header><div><span className="ls-eyebrow">YOUR LEARNING JOURNEY</span><h2 id="ls-dialog-title">{title}</h2></div><button type="button" className="ls-close" aria-label="閉じる" onClick={onClose}>×</button></header>{children}</dialog>;
}
const missions=[
 ['学年・入試','LEVEL','↗','中学 → 高校 → 大学受験','cyan'],
 ['英検対策','EXAM','◎','英検・級別対策','violet'],
 ['ジャンル別','TOPIC','◈','環境・社会・科学など','mint'],
 ['品詞別','WORD CLASS','Aa','動詞・名詞・形容詞・副詞','amber'],
 ['学校教材','SCHOOL','▤','定期考査・長文語彙','cyan'],
 ['発展学習','ADVANCED','✦','上級・画像と音声','violet']
];
export default function LearningSpace({catalog,selection,onStart,onResume,onSettings,progress,courseLabel,unitLabel,stats,today,allLearned,allDue,loading,error,onRetry,onExplore,onDash,unitAvailable,externalCategory,onCategoryConsumed}){
 const [goal,setGoal]=useState(null),[step,setStep]=useState(0),[picked,setPicked]=useState(null),[unitId,setUnitId]=useState(null),[query,setQuery]=useState(''),[exploreError,setExploreError]=useState(''),[busy,setBusy]=useState(false),[page,setPage]=useState(0),[reviewOnly,setReviewOnly]=useState(false),[searchText,setSearchText]=useState('');
 const close=()=>{setGoal(null);setStep(0);setExploreError('');setPage(0)};
 const begin=(id,review=false)=>{setGoal(id);setStep(0);setPicked(null);setUnitId(null);setQuery('');setExploreError('');setPage(0);setReviewOnly(review)};
 useEffect(()=>{if(externalCategory){begin(externalCategory.group);onCategoryConsumed?.();}},[externalCategory]);
 const available=catalog.filter(c=>c.units.some(u=>unitAvailable(c.id,u.id))),current=available.find(c=>c.id===selection.courseId);
 const lessonCount=available.reduce((n,c)=>n+c.units.filter(u=>unitAvailable(c.id,u.id)).length,0);
 const chooseCourse=c=>{setPicked(c);setPage(0);const u=c.units.filter(x=>unitAvailable(c.id,x.id));if(u.length===1){setUnitId(u[0].id);setStep(2)}else setStep(1)};
 const modeList=studyModes.filter(m=>(!reviewOnly||m.id==='review'||m.id==='memory')&&(m.id!=='listening'||picked?.id==='eiken1_master'));
 const start=m=>{if(!picked||!unitId)return;onStart(picked.id,unitId,m);close()};
 const search=async(e,raw)=>{e.preventDefault();if(!raw.trim()||busy)return;setBusy(true);setExploreError('');try{const found=await onExplore(raw.trim());if(found)close();else{setGoal('explore');setQuery(raw);setExploreError('登録済みの語が見つかりませんでした。別の単語をお試しください。')}}catch{setGoal('explore');setQuery(raw);setExploreError('読み込みに失敗しました。もう一度お試しください。')}finally{setBusy(false)}};
 const groups=goal==='review'?available:available.filter(c=>c.group===goal);
 const choices=step===0?groups:step===1?(picked?.units.filter(u=>unitAvailable(picked.id,u.id))||[]):modeList;
 const pageSize=6,pages=Math.max(1,Math.ceil(choices.length/pageSize)),visible=choices.slice(page*pageSize,(page+1)*pageSize);
 const quick=(review)=>{begin(review?'review':(current?.group||'学年・入試'),review);if(current){setPicked(current);setUnitId(selection.unitId);setStep(2)}};
 return <div className="ls-home ls-compact-home">
 <section className="ls-hero"><div className="ls-stars"/><div className="ls-hero-copy"><span className="ls-eyebrow">VOCADASH 3.0 / LEARNING SPACE</span><h1>Beyond <em>Words.</em></h1><p>今日は、何を学びますか？</p></div><form className="ls-hero-search" onSubmit={e=>search(e,searchText)}><label htmlFor="ls-global-search" className="ls-sr-only">英単語検索</label><input id="ls-global-search" value={searchText} onChange={e=>setSearchText(e.target.value)} placeholder="英単語を検索…" autoComplete="off"/><button type="submit" disabled={busy||!searchText.trim()}>{busy?'…':'⌕'}</button></form><button className="ls-dash-link" onClick={onDash} aria-label="Dash Assistant を開く"><Orb/><span>DASH <small>マイクは手動</small></span></button></section>
 <div className="ls-command-grid">
 <section className="ls-progress"><div className="ls-sectionhead"><div><span className="ls-eyebrow">YOUR PROGRESS</span><h2>学習の進捗</h2></div><button className="ls-text-button" onClick={onSettings} aria-label="学習設定">⚙</button></div><div className="ls-progress-body"><div className="ls-rings">{progress}</div><div className="ls-progress-info"><h3>{courseLabel} · {unitLabel}</h3>{loading?<p role="status">読み込み中…</p>:error?<p>{error} <button onClick={onRetry}>再試行</button></p>:<p>学習済み <strong>{stats.seen}/{stats.total}語</strong></p>}<div className="ls-metrics"><div><b>{today}</b><small>今日</small></div><div><b>{allLearned}</b><small>学習記録</small></div><div><b>{allDue}</b><small>復習待ち</small></div></div><button className="ls-primary" disabled={loading||!!error||!stats.total} onClick={onResume}>前回の教材で学習 <span>→</span></button><div className="ls-fast-actions"><button disabled={loading||!!error||!stats.total} onClick={()=>onStart(selection.courseId,selection.unitId,'memory')}>記憶学習 ↗</button><button onClick={()=>quick(false)}>練習する ↗</button><button onClick={()=>quick(true)}>復習する ↻</button></div><small className="ls-note">円グラフは現在のユニット</small></div></div></section>
 <section className="ls-mission"><div className="ls-sectionhead"><div><span className="ls-eyebrow">CHOOSE YOUR MISSION</span><h2>教材を選ぶ</h2></div><span className="ls-note">{lessonCount}ユニット</span></div><div className="ls-goals">{missions.map(([group,tag,icon,sub,tone])=><button key={group} onClick={()=>begin(group)} className={'ls-goal '+tone}><span className="ls-goal-icon" aria-hidden="true">{icon}</span><div><span className="ls-goal-tag">{tag}</span><strong>{group==='英検対策'?'資格試験':group}</strong><small>{sub}</small></div><span className="ls-goal-arrow">→</span></button>)}</div></section>
 </div><div className="ls-bottom-actions"><button className="ls-outline" onClick={()=>begin('explore')}>◎ Voca Universe <small>語彙探索</small> →</button><button className="ls-outline" onClick={()=>begin('library')}>▤ Vocabulary Library <small>8,653語マスター整備中</small> →</button></div>
 {goal&&<Dialog title={missions.find(g=>g[0]===goal)?.[0]||(goal==='library'?'教材ライブラリー':goal==='review'?'復習する':'Voca Universe')} onClose={close}>
 {goal==='library'?<div className="ls-library-detail"><p>20冊以上の教材を比較・参照候補にした独自語彙マスター（8,653語）を整備中。学年・ジャンル・品詞別はオリジナル先行100語から開始しています。</p>{sourceGroups.map(([title,desc])=><article key={title}><strong>{title}</strong><p>{desc}</p></article>)}<p className="ls-note">市販教材の本文・全収録語を提供するものではありません。</p><button className="ls-primary" onClick={()=>begin('学年・入試')}>学習する →</button></div>:goal==='explore'?<form className="ls-search" onSubmit={e=>search(e,query)}><label htmlFor="ls-word">調べたい英単語</label><input id="ls-word" value={query} onChange={e=>setQuery(e.target.value)} placeholder="例：improve" autoFocus/><button className="ls-primary" disabled={busy||!query.trim()}>{busy?'検索中…':'探索する →'}</button>{exploreError&&<p role="alert">{exploreError}</p>}</form>:<>
 <div className="ls-step">{['教材','ユニット','学習方法'].map((s,i)=><span key={s} className={i===step?'active':i<step?'done':''}>{i+1} {s}</span>)}</div>
 {step===0&&['学年・入試','ジャンル別','品詞別'].includes(goal)&&<p className="ls-note">オリジナル先行教材 · レベルは学習目安</p>}
 <div className="ls-choices">{visible.map(item=>step===0?<button className="ls-choice" key={item.id} onClick={()=>chooseCourse(item)}><strong>{item.label}</strong><small>{item.units.length}ユニット</small><span>→</span></button>:step===1?<button className="ls-choice" key={item.id} onClick={()=>{setUnitId(item.id);setStep(2);setPage(0)}}><strong>{item.label}</strong><small>{picked.label}</small><span>→</span></button>:<button className="ls-choice" key={item.id} onClick={()=>start(item.id)}><strong>{item.icon}　{item.title}</strong><small>{item.sub}</small><span>開始 →</span></button>)}</div>
 <div className="ls-dialog-nav">{step>0&&<button className="ls-back" onClick={()=>{setStep(step===2&&picked?.units.length===1?0:step-1);setPage(0)}}>← 戻る</button>}{pages>1&&<div><button disabled={!page} onClick={()=>setPage(p=>p-1)}>←</button><span>{page+1} / {pages}</span><button disabled={page+1>=pages} onClick={()=>setPage(p=>p+1)}>→</button></div>}</div>
 </>}</Dialog>}
 </div>;
}
