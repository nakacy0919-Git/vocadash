import React,{useState,useEffect,useRef} from 'react';
import './LearningSpace.css';
import './LibraryHome.css';
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
 ['CEFR・レベル別','A1–C2','Aa','オリジナル全語彙 · 入門から上級','cyan'],
 ['学年・入試','LEVEL','↗','中学 → 高校 → 大学受験','cyan'],
 ['英検対策','EXAM','◎','英検・級別対策','violet'],
 ['ジャンル別','TOPIC','◈','環境・社会・科学など','mint'],
 ['品詞別','WORD CLASS','Aa','動詞・名詞・形容詞・副詞','amber'],
 ['学校教材','SCHOOL','▤','定期考査・長文語彙','cyan'],
 ['発展学習','ADVANCED','✦','上級・画像と音声','violet']
];
export default function LearningSpace({catalog,selection,onStart,onResume,onLibrary,onQuizStudio,onSettings,progress,courseLabel,unitLabel,stats,today,allLearned,allDue,loading,error,onRetry,onExplore,onLookup,onSpeak,onDash,unitAvailable,externalCategory,onCategoryConsumed}){
 const [goal,setGoal]=useState(null),[step,setStep]=useState(0),[picked,setPicked]=useState(null),[unitId,setUnitId]=useState(null),[query,setQuery]=useState(''),[exploreError,setExploreError]=useState(''),[busy,setBusy]=useState(false),[page,setPage]=useState(0),[reviewOnly,setReviewOnly]=useState(false),[searchText,setSearchText]=useState('');
 const [lang,setLang]=useState(()=>{try{return localStorage.getItem('vd-library-language')==='en'?'en':'ja'}catch{return 'ja'}}),[found,setFound]=useState(null);
 const searchEpoch=useRef(0);
 const t=(ja,en)=>lang==='en'?en:ja;
 const switchLang=next=>{setLang(next);try{localStorage.setItem('vd-library-language',next)}catch{}};
 const groupNames=['CEFR levels','School & entrance exams','English proficiency tests','Topics','Parts of speech','School materials','Advanced'];
 const groupName=group=>lang==='en'?(groupNames[missions.findIndex(m=>m[0]===group)]||group):group==='英検対策'?'資格試験':group;
 const close=()=>{searchEpoch.current++;setBusy(false);setFound(null);setGoal(null);setStep(0);setExploreError('');setPage(0)};
 const begin=(id,review=false)=>{searchEpoch.current++;setBusy(false);setFound(null);setGoal(id);setStep(0);setPicked(null);setUnitId(null);setQuery('');setExploreError('');setPage(0);setReviewOnly(review)};
 useEffect(()=>{if(externalCategory){begin(externalCategory.group);onCategoryConsumed?.();}},[externalCategory]);
 const available=catalog.filter(c=>c.units.some(u=>unitAvailable(c.id,u.id))),current=available.find(c=>c.id===selection.courseId);
 const lessonCount=available.reduce((n,c)=>n+c.units.filter(u=>unitAvailable(c.id,u.id)).length,0);
 const chooseCourse=c=>{setPicked(c);setPage(0);const u=c.units.filter(x=>unitAvailable(c.id,x.id));if(u.length===1){setUnitId(u[0].id);if(reviewOnly)setStep(2);else{onStart(c.id,u[0].id,'library');close();}}else setStep(1)};
 const modeList=studyModes.filter(m=>(!reviewOnly||m.id==='review'||m.id==='memory')&&(m.id!=='listening'||picked?.id==='eiken1_master'));
 const start=m=>{if(!picked||!unitId)return;onStart(picked.id,unitId,m);close()};
 const search=async(e,raw)=>{e.preventDefault();if(!raw.trim()||busy)return;const epoch=++searchEpoch.current;setBusy(true);setFound(null);setExploreError('');try{const item=await onLookup(raw.trim());if(epoch!==searchEpoch.current)return;if(item)setFound(item);else setExploreError(t('登録済みの語が見つかりませんでした。別の英単語をお試しください。','No matching word. Try another English word.'));}catch{if(epoch===searchEpoch.current)setExploreError(t('読み込みに失敗しました。もう一度お試しください。','Unable to load. Please try again.'));}finally{if(epoch===searchEpoch.current)setBusy(false)}};
 const examples=found?.examples?.length?found.examples:found?.english?[{en:found.english,ja:found.japanese}]:[];

 const groups=goal==='review'?available:available.filter(c=>c.group===goal);
 const choices=step===0?groups:step===1?(picked?.units.filter(u=>unitAvailable(picked.id,u.id))||[]):modeList;
 const pageSize=6,pages=Math.max(1,Math.ceil(choices.length/pageSize)),visible=choices.slice(page*pageSize,(page+1)*pageSize);
 const quick=(review)=>{begin(review?'review':(current?.group||'学年・入試'),review);if(current){setPicked(current);setUnitId(selection.unitId);setStep(2)}};
 return <div className="ls-home ls-library-home" lang={lang}>
 <div className="lh-background" aria-hidden="true"/>
 <div className="lh-starlight" aria-hidden="true">
 {Array.from({length:38},(_,i)=>{const x=(i*73.173+9)%100,y=(i*39.617+7)%92;return <span key={i} className={'lh-star'+(i%7===0?' lh-star-cross':'')} style={{'--x':x+'%','--y':y+'%','--s':(i%7===0?7:1.6+(i%4)*.85)+'px','--delay':(-i*.81)+'s','--period':(3.4+(i%6)*.65)+'s','--drift':((i%5)-2)*8+'px'}}/>})}
 {[{x:12,y:11,delay:-1,period:12},{x:52,y:4,delay:-7,period:17},{x:80,y:20,delay:-13,period:23}].map((s,i)=><span className="lh-meteor" key={i} style={{'--mx':s.x+'%','--my':s.y+'%','--md':s.delay+'s','--mp':s.period+'s'}}/>)}
 </div>
 <header className="lh-toolbar"><a href="/?classroom=1">Classroom</a><div className="lh-language" aria-label="Language"><button aria-pressed={lang==='ja'} onClick={()=>switchLang('ja')}>日本語</button><button aria-pressed={lang==='en'} onClick={()=>switchLang('en')}>EN</button></div><button className="lh-settings" aria-label={t('設定','Settings')} onClick={onSettings}>⚙</button></header>
 <div className="lh-center">
 <div className="lh-brand-row"><div className="lh-wordmark"><svg aria-hidden="true" viewBox="0 0 48 48" fill="none"><path d="M24 38c-6-5-13-7-21-5V12c8-2 15 0 21 5 6-5 13-7 21-5v21c-8-2-15 0-21 5Zm0 0V17" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M24 13C24 6 29 3 37 2c-1 7-5 11-13 11ZM23 13C15 13 11 9 10 4c7 0 12 3 13 9Z" fill="#69845b"/></svg><h1>VocaDash</h1></div><div className="lh-floating-orb" aria-hidden="true"><Orb/></div></div>
 <p className="lh-tagline">Your everyday English companion.</p>
 <div className="lh-primary-actions">
 <button className="lh-main-button" onClick={()=>begin('learn')}><span className="lh-action-icon" aria-hidden="true">Aa</span><span><strong>{t('単語を覚える','Learn Words')}</strong><small>{t('意味・例文・復習','Words, examples & review')}</small></span><span aria-hidden="true">›</span></button>
 <button className="lh-main-button" onClick={()=>begin('explore')}><span className="lh-action-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6" strokeLinecap="round"/></svg></span><span><strong>{t('単語を調べる','Search Words')}</strong><small>{t('意味・発音・関連語','Meanings, pronunciation & related words')}</small></span><span aria-hidden="true">›</span></button>
 </div>
 <div className="lh-quick"><button onClick={onResume} disabled={loading||!!error||!stats.total}>{t('前回の続き','Continue learning')} →</button><button onClick={()=>begin('progress')}>{t('学習記録','My progress')} · {allLearned}</button></div>
 <div className="lh-voice"><button className="lh-mic" onClick={onDash} aria-label={t('DASHのマイクを開始','Start DASH microphone')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="9" y="2.5" width="6" height="12" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.5M8.5 21.5h7"/></svg></button><span>{t('DASHと話す','Talk with DASH')}</span><small>{t('例：Show me beautiful','Try: Show me beautiful')}</small></div>
 </div>
 {goal&&<Dialog title={goal==='learn'?t('単語を覚える','Learn Words'):goal==='explore'?t('単語を調べる','Search Words'):goal==='progress'?t('学習記録','My progress'):goal==='review'?t('復習する','Review'):goal==='library'?t('教材ライブラリー','Learning library'):groupName(goal)} onClose={close}>
 {goal==='learn'?<><div className="lh-learn-quick"><button className="ls-primary" onClick={()=>{onResume();close()}} disabled={loading||!!error||!stats.total}>{t('前回の続き・記憶ミッション','Continue / Memory mission')} →</button><button className="ls-choice" onClick={()=>quick(true)}>{t('復習する','Review words')} · {allDue}</button><button className="ls-choice" onClick={()=>{onQuizStudio();close()}}>{t('多角度語彙クイズ','Vocabulary quiz')}</button></div><div className="ls-choices">{missions.map(([group,tag,icon,sub])=><button className="ls-choice" key={group} onClick={()=>begin(group)}><strong>{icon}　{groupName(group)}</strong><small>{lang==='ja'?sub:tag}</small><span>→</span></button>)}</div></>:goal==='progress'?<div className="lh-progress"><div className="ls-metrics">{[[today,t('今日','Today')],[allLearned,t('学習記録','Words studied')],[allDue,t('復習待ち','Due')]].map(([n,label])=><div key={label}><b>{n}</b><small>{label}</small></div>)}</div><h3>{courseLabel} · {unitLabel}</h3>{loading?<p role="status">{t('読み込み中…','Loading…')}</p>:error?<p>{error} <button onClick={onRetry}>{t('再試行','Retry')}</button></p>:<p>{stats.seen}/{stats.total} {t('語学習済み','words studied')}</p>}<button className="ls-primary" disabled={loading||!!error||!stats.total} onClick={()=>{onLibrary();close()}}>{t('単語一覧・赤シート','Word list')} →</button></div>:goal==='library'?<div className="ls-library-detail"><p>20冊以上の教材を比較・参照候補にした独自語彙マスター（8,653語）を整備中。学年・ジャンル・品詞別はオリジナル先行100語から開始しています。</p>{sourceGroups.map(([title,desc])=><article key={title}><strong>{title}</strong><p>{desc}</p></article>)}<p className="ls-note">市販教材の本文・全収録語を提供するものではありません。</p><button className="ls-primary" onClick={()=>begin('学年・入試')}>学習する →</button></div>:goal==='explore'?<><form className="ls-search" onSubmit={e=>search(e,query)}><label htmlFor="ls-word">{t('調べたい英単語','Enter an English word')}</label><input id="ls-word" value={query} onChange={e=>setQuery(e.target.value)} placeholder="e.g. improve" autoFocus autoComplete="off"/><button className="ls-primary" disabled={busy||!query.trim()}>{busy?t('検索中…','Searching…'):t('検索する','Search')} →</button>{exploreError&&<p role="alert">{exploreError}</p>}</form>{found&&<article className="lh-search-result"><div className="lh-result-heading"><h3>{found.word}</h3><button className="ls-choice" onClick={()=>onSpeak(found)} aria-label={t('発音','Pronounce')}>♫</button></div><p>{found.meaning||found.records?.[0]?.meaningJa}</p>{found.records?.slice(0,4).map(r=><div key={r.senseId}><small>{r.partOfSpeech}</small><p>{r.meaningJa}</p>{r.definitionEn&&<p>{r.definitionEn}</p>}</div>)}{examples.slice(0,4).map((ex,i)=><div className="lh-example" key={i}><p>{ex.en} <button onClick={()=>onSpeak({...found,english:ex.en,audio:undefined},true)} aria-label={t('例文を聞く','Listen to example')}>♫</button></p><small>{ex.ja}</small></div>)}<button className="ls-primary" onClick={()=>{const word=found.word;close();onExplore(word)}}>{t('関連語・派生語を見る','Explore related words')} →</button></article>}</>:<>
 <div className="ls-step">{(reviewOnly?[t('教材','Course'),t('ユニット','Unit'),t('学習方法','Mode')]:[t('教材','Course'),t('ユニット','Unit')]).map((s,i)=><span key={s} className={i===step?'active':i<step?'done':''}>{i+1} {s}</span>)}</div>
 {step===0&&['CEFR・レベル別','学年・入試','ジャンル別','品詞別'].includes(goal)&&<p className="ls-note">オリジナル教材β · レベルは学習目安</p>}
 <div className="ls-choices">{visible.map(item=>step===0?<button className="ls-choice" key={item.id} onClick={()=>chooseCourse(item)}><strong>{item.label}</strong><small>{item.units.length} {t('ユニット','units')}</small><span>→</span></button>:step===1?<button className="ls-choice" key={item.id} onClick={()=>{setUnitId(item.id);if(reviewOnly){setStep(2);setPage(0);}else{onStart(picked.id,item.id,'library');close();}}}><strong>{item.label}</strong><small>{picked.label}</small><span>→</span></button>:<button className="ls-choice" key={item.id} onClick={()=>start(item.id)}><strong>{item.icon}　{item.title}</strong><small>{item.sub}</small><span>開始 →</span></button>)}</div>
 <div className="ls-dialog-nav">{step>0&&<button className="ls-back" onClick={()=>{setStep(step===2&&picked?.units.length===1?0:step-1);setPage(0)}}>{t('← 戻る','← Back')}</button>}{pages>1&&<div><button disabled={!page} onClick={()=>setPage(p=>p-1)}>←</button><span>{page+1} / {pages}</span><button disabled={page+1>=pages} onClick={()=>setPage(p=>p+1)}>→</button></div>}</div>
 </>}</Dialog>}
 </div>;
}
