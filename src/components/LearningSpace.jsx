import React,{useState,useEffect,useRef} from 'react';
import './LearningSpace.css';
const goals=[
 {id:'learn',tag:'01 / LEARN',icon:'▣',title:'単語を覚えたい',sub:'意味・例文・音声で語彙を増やす',tone:'cyan'},
 {id:'practice',tag:'02 / PRACTICE',icon:'↗',title:'単語を練習したい',sub:'クイズ・音読・聞き取りで定着',tone:'mint'},
 {id:'exam',tag:'03 / EXAM',icon:'◎',title:'資格試験・入試対策',sub:'レベルや学校の教材から選ぶ',tone:'violet'},
 {id:'review',tag:'04 / REVIEW',icon:'↻',title:'復習したい',sub:'覚えた語彙をもう一度確認',tone:'amber'}
];
const studyModes=[
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
export default function LearningSpace({catalog,selection,onStart,onResume,onSettings,progress,courseLabel,unitLabel,stats,today,totalAnswers,allLearned,allDue,readingPassed,questionCount,loading,error,onRetry,onExplore,onDash,unitAvailable}){
 const [goal,setGoal]=useState(null),[step,setStep]=useState(0),[picked,setPicked]=useState(null),[unitId,setUnitId]=useState(null),[query,setQuery]=useState(''),[exploreError,setExploreError]=useState(''),[busy,setBusy]=useState(false);
 const close=()=>{setGoal(null);setStep(0);setExploreError('')};
 const begin=id=>{setGoal(id);setStep(0);setPicked(null);setUnitId(null);setQuery('');setExploreError('')};
 const chooseCourse=c=>{setPicked(c);const u=c.units.filter(x=>unitAvailable(c.id,x.id));if(u.length===1){setUnitId(u[0].id);setStep(2)}else setStep(1)};
 const available=catalog.filter(c=>c.units.some(u=>unitAvailable(c.id,u.id)));
 const goalInfo=goals.find(x=>x.id===goal);
 const lessonCount=available.reduce((n,c)=>n+c.units.filter(u=>unitAvailable(c.id,u.id)).length,0);
 const current=available.find(c=>c.id===selection.courseId);
 const selectExisting=()=>{if(current){setPicked(current);setUnitId(selection.unitId);setStep(2)}};
 const modeList=studyModes.filter(m=>allowed[goal]?.includes(m.id)&&(m.id!=='listening'||picked?.id==='eiken1_master'));
 const start=m=>{if(!picked||!unitId)return;onStart(picked.id,unitId,m);close()};
 const search=async e=>{e.preventDefault();if(!query.trim()||busy)return;setBusy(true);setExploreError('');try{const found=await onExplore(query.trim());if(found)close();else setExploreError('この語は見つかりませんでした。別の単語で検索してください。')}catch{setExploreError('読み込みに失敗しました。もう一度お試しください。')}finally{setBusy(false)}};
 return <div className="ls-home">
 <section className="ls-hero"><div className="ls-stars"/><div className="ls-hero-copy"><span className="ls-eyebrow">VOCADASH 3.0 / LEARNING SPACE</span><h1>Beyond <em>Words.</em></h1><p>今日は、何を学びますか？</p><div className="ls-hero-meta"><span>● 学べる教材 {lessonCount}ユニット</span><span>● 画像・音声・例文</span></div></div><Orb/><button className="ls-dash-link" onClick={onDash}><span>✧ DASH ASSISTANT</span><small>授業・語彙探索に活用 ›</small></button></section>
 <section className="ls-progress"><div className="ls-sectionhead"><div><span className="ls-eyebrow">YOUR PROGRESS</span><h2>学習ダッシュボード</h2></div><button className="ls-text-button" onClick={onSettings}>⚙ 学習設定</button></div><div className="ls-progress-body"><div className="ls-rings">{progress}</div><div className="ls-progress-info"><span className="ls-eyebrow">前回の教材 / CURRENT UNIT</span><h3>{courseLabel} · {unitLabel}</h3>{loading?<p role="status">教材を準備しています…</p>:error?<p>{error} <button onClick={onRetry}>再試行</button></p>:<p>学習済み <strong>{stats.seen}/{stats.total}語</strong>　音読合格 <strong>{readingPassed}/{stats.total}語</strong></p>}<div className="ls-metrics"><div><b>{today}</b><small>今日の学習</small></div><div><b>{allLearned}</b><small>全教材・学習済</small></div><div><b>{allDue}</b><small>全教材・復習待ち</small></div><div><b>{totalAnswers}</b><small>累計回答</small></div></div><button className="ls-primary" disabled={loading||!!error||!stats.total} onClick={onResume}>前回の教材で学習する <span>→</span></button><small className="ls-note">円グラフは現在のユニットの進捗です。全教材の学習済み数は教材ごとの記録件数です。</small></div></div></section>
 <section><div className="ls-sectionhead"><div><span className="ls-eyebrow">CHOOSE YOUR MISSION</span><h2>学習の目的を選ぶ</h2></div><span className="ls-note">目的 → 教材 → 学習方法</span></div><div className="ls-goals">{goals.map(g=><button key={g.id} onClick={()=>begin(g.id)} className={'ls-goal '+g.tone}><span className="ls-goal-tag">{g.tag}</span><span className="ls-goal-icon">{g.icon}</span><strong>{g.title}</strong><small>{g.sub}</small><span className="ls-goal-arrow">→</span></button>)}</div></section>
 <section className="ls-library"><div><span className="ls-eyebrow">VOCABULARY LIBRARY</span><h2>一つの場所で、幅広い語彙学習。</h2><p>20冊以上の市販教材を比較・参照候補に、8,653語の語彙マスターを整備中。オリジナルの英英定義・例文・和訳・画像教材を順次制作しています。</p><small>市販教材の本文・全単語リストを収録したものではありません。未公開の制作データは学習可能数に含めていません。</small></div><button className="ls-outline" onClick={()=>begin('library')}>教材設計の詳細 →</button></section>
 <section className="ls-explore"><span className="ls-explore-mark">◎</span><div><span className="ls-eyebrow">VOCA UNIVERSE</span><h2>語彙のつながりを探索</h2><p>類義語・派生語・コロケーションへ。</p></div><button className="ls-outline" onClick={()=>begin('explore')}>単語を検索 →</button></section>
 {goal&&<Dialog title={goalInfo?.title||(goal==='library'?'教材ライブラリーについて':'Voca Universe')} onClose={close}>
 {goal==='library'?<div className="ls-library-detail">{sourceGroups.map(([title,desc])=><article key={title}><strong>{title}</strong><p>{desc}</p></article>)}<p className="ls-note">上記は教材設計時の比較・参照候補です。収録・提携・対応率を保証するものではありません。</p><button className="ls-primary" onClick={()=>begin('exam')}>利用できる教材から学習する →</button></div>:goal==='explore'?<form className="ls-search" onSubmit={search}><label htmlFor="ls-word">調べたい英単語</label><input id="ls-word" value={query} onChange={e=>setQuery(e.target.value)} placeholder="例：improve" autoFocus/><button className="ls-primary" disabled={busy||!query.trim()}>{busy?'検索中…':'探索する →'}</button>{exploreError&&<p role="alert">{exploreError}</p>}</form>:<>
 <div className="ls-step" aria-label={'ステップ '+(step+1)+' / 3'}>{['教材','ユニット','学習方法'].map((s,i)=><span key={s} className={i===step?'active':i<step?'done':''}>{i+1} {s}</span>)}</div>
 {step===0?<div className="ls-choices">{current&&unitAvailable(current.id,selection.unitId)&&<button className="ls-choice ls-current" onClick={selectExisting}><strong>前回の教材を使う</strong><small>{courseLabel} · {unitLabel}</small><span>→</span></button>}{available.map(c=><button className="ls-choice" key={c.id} onClick={()=>chooseCourse(c)}><strong>{c.label}</strong><small>{c.units.filter(u=>unitAvailable(c.id,u.id)).length}ユニット</small><span>→</span></button>)}</div>:step===1?<div className="ls-choices">{picked?.units.filter(u=>unitAvailable(picked.id,u.id)).map(u=><button className="ls-choice" key={u.id} onClick={()=>{setUnitId(u.id);setStep(2)}}><strong>{u.label}</strong><small>{picked.label}</small><span>→</span></button>)}</div>:<div className="ls-choices">{modeList.map(m=><button className="ls-choice" key={m.id} onClick={()=>start(m.id)}><strong>{m.icon}　{m.title}</strong><small>{m.sub}</small><span>開始 →</span></button>)}</div>}
 {step>0&&<button className="ls-back" onClick={()=>setStep(step===2&&picked?.units.filter(u=>unitAvailable(picked.id,u.id)).length===1?0:step-1)}>← 戻る</button>}
 </>}</Dialog>}
 </div>;
}
