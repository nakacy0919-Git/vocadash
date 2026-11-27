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
function Dialog({title,onClose,children,journey=false,lang='ja',route=false,subtitle,artKind=0}){
 const ref=useRef(null);
 useEffect(()=>{const el=ref.current;if(!el)return;el.showModal();return()=>{if(el.open)el.close()};},[]);
 return <dialog ref={ref} className={"ls-dialog"+(journey?" lh-journey-dialog":"")+(route?" lh-route-dialog":"")} aria-labelledby="ls-dialog-title" onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose()}}}><header className={journey?'lh-journey-header':''}><div>{journey&&<div className="lh-mini-brand"><span>♧</span> VocaDash <i/> <small>YOUR LEARNING JOURNEY</small></div>}{!journey&&<span className="ls-eyebrow">YOUR LEARNING JOURNEY</span>}<div className={journey?'lh-heading-row':''}>{journey&&<RouteArt kind={artKind}/>}<div><h2 id="ls-dialog-title">{title}</h2>{journey&&<p>{subtitle||(lang==='en'?'Choose the right learning route for your goals.':'学習の目的に合わせて、最適な学習ルートを選びましょう。')}</p>}</div></div></div>{journey&&<div className="lh-header-art" aria-hidden="true"><RouteArt kind={3}/><RouteArt kind={0}/><span>✧</span></div>}<button type="button" className="ls-close" aria-label={lang==='en'?'Close':'閉じる'} onClick={onClose}>×</button></header>{children}</dialog>;
}

// Original scalable illustrations; no bitmap UI or external dependencies.
function RouteArt({kind=0}){
 const id=React.useId().replace(/:/g,'');
 const g='url(#'+id+'g)', gold='url(#'+id+'a)';
 return <svg className="lh-route-art" aria-hidden="true" viewBox="0 0 100 78" fill="none"><defs><linearGradient id={id+'g'} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#b2c78b"/><stop offset="1" stopColor="#42633e"/></linearGradient><linearGradient id={id+'a'} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffe6a0"/><stop offset="1" stopColor="#b77331"/></linearGradient></defs><ellipse cx="50" cy="68" rx="38" ry="5" fill="#785227" opacity=".14"/><circle cx="49" cy="35" r="31" fill="#f4dca4" opacity=".26"/>{kind===0?<><circle cx="29" cy="22" r="9" fill="#f6d17e"/><path d="M8 65 36 24 55 65Z" fill="#a0b680"/><path d="m30 65 31-49 34 49Z" fill={g}/><path d="m48 36 13-20 14 22-13-7-7 7Z" fill="#f7edcf"/><path d="M61 17V5l17 5-17 6" stroke="#9b622e" strokeWidth="2" fill="#c47e37"/></>:kind===1?<><path d="M11 29 50 13 89 29 50 47Z" fill="#425b47" stroke="#314838" strokeWidth="2"/><path d="M28 38v15q22 16 44 0V38L50 47Z" fill={g}/><path d="M87 31v21" stroke="#bd8538" strokeWidth="3"/><circle cx="87" cy="54" r="4" fill={gold}/><rect x="25" y="59" width="47" height="11" rx="5" fill="#f3e1ad" stroke="#a57c48"/><path d="M48 59v11" stroke="#c27142" strokeWidth="5"/></>:kind===2?<><path d="m31 7 15 27H34L20 7Zm38 0L54 34h12L80 7Z" fill="#b86b48"/><circle cx="50" cy="47" r="24" fill={gold} stroke="#a56b32" strokeWidth="2"/><circle cx="50" cy="47" r="18" stroke="#fff0b6" strokeWidth="2"/><path d="m50 32 5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2Z" fill="#fff2b7"/></>:kind===3?<><rect x="18" y="54" width="64" height="13" rx="3" fill="#9f6547"/><rect x="25" y="43" width="54" height="12" rx="3" fill="#e9cc94"/><rect x="16" y="32" width="63" height="12" rx="3" fill={g}/><path d="M50 33Q49 12 32 9Q31 26 50 33Q56 10 80 8Q77 28 50 33Z" fill={g}/><path d="M50 33 63 16" stroke="#42633e" strokeWidth="2"/></>:kind===4?<><path d="M50 24Q32 13 12 20l5 42q19-7 33 2 14-9 33-2l5-42Q68 13 50 24Z" fill="#fff3d3" stroke="#b58a48" strokeWidth="2"/><path d="M50 24v40" stroke="#bc9a5a"/><text x="21" y="46" fontSize="19" fontFamily="Georgia" fontWeight="700" fill="#506d43">Aa</text><path d="M60 58Q63 29 88 12Q90 39 60 58Z" fill={gold}/><path d="m60 58 20-34" stroke="#9b622e" strokeWidth="2"/></>:kind===5?<><rect x="18" y="39" width="64" height="28" rx="2" fill="#e4c387"/><path d="M13 39 50 13 87 39Z" fill="#b77b46"/><rect x="43" y="42" width="14" height="25" fill="#6b8860"/><circle cx="50" cy="30" r="7" fill="#fff4d5" stroke="#906b3e"/><path d="M50 26v4l3 2" stroke="#906b3e" strokeWidth="1.5"/><path d="M25 47h10v10H25Zm40 0h10v10H65Z" fill="#fdf2ce" stroke="#ad8e62"/><path d="M50 13V4l14 4-14 5" fill="#d39a45"/></>:kind===6?<><rect x="17" y="49" width="15" height="17" rx="2" fill="#a6bb81"/><rect x="41" y="34" width="15" height="32" rx="2" fill="#7e9c60"/><rect x="65" y="20" width="15" height="46" rx="2" fill={g}/><path d="M14 37Q45 35 83 7m-15 2 15-2-3 15" stroke="#bc8035" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></>:kind===7?<><circle cx="50" cy="40" r="26" fill="#e6edd5" stroke="#658455" strokeWidth="2"/><circle cx="50" cy="40" r="17" stroke="#658455" strokeWidth="4"/><circle cx="50" cy="40" r="7" fill="#658455"/><path d="m50 40 26-26m-3 12 3-12-12 3" stroke="#be8b43" strokeWidth="4" strokeLinecap="round"/></>:kind===8?<><path d="M28 31a23 23 0 0 1 41-9l5 8m-11-1 11 1 1-12M72 48a23 23 0 0 1-41 9l-5-8m11 1-11-1-1 12" stroke="#68854f" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/></>:<><path d="m50 10 31 17v32L50 76 19 59V27Z" fill="#f4e3b8" stroke="#96723e" strokeWidth="2"/><path d="m19 27 31 17 31-17M50 44v32" stroke="#96723e" strokeWidth="2"/>{[[50,26],[32,42],[37,54],[65,44],[69,57]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="3" fill="#725334"/>)}</>}</svg>;
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
 const searchEpoch=useRef(0); const [routeFilter,setRouteFilter]=useState('all'),[routeQuery,setRouteQuery]=useState('');
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
 const routeDialog=!!goal&&!['learn','explore','progress','library'].includes(goal);
 const routeKind=Math.max(0,missions.findIndex(m=>m[0]===goal));
 const pageSize=6,pages=Math.max(1,Math.ceil(choices.length/pageSize)),visible=choices.slice(page*pageSize,(page+1)*pageSize);
 const routeTypes=['level','level','level','topic','grammar','school','level'];
 const filterOptions=[['all','すべて','All'],['level','レベル・試験','Levels & exams'],['school','学校・教材','School'],['grammar','文法・語法','Word classes'],['topic','テーマ別','Topics']];
 const routeRows=missions.map((m,i)=>({m,i,courses:available.filter(c=>c.group===m[0])})).filter(({m,i,courses})=>(routeFilter==='all'||routeTypes[i]===routeFilter)&&(!routeQuery.trim()||[...m,groupName(m[0]),...courses.flatMap(c=>[c.label,c.short,...c.units.map(u=>u.label)])].join(' ').toLowerCase().includes(routeQuery.trim().toLowerCase())));
 const basics=available.find(c=>c.group==='CEFR・レベル別'&&/(^|\W)A1(\W|$)/i.test(c.label+' '+c.short))||available.find(c=>c.group==='CEFR・レベル別');
 const progressPct=stats.total?Math.min(100,Math.round(stats.seen/stats.total*100)):0;
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
 {goal&&<Dialog journey={goal==='learn'||routeDialog} route={routeDialog} artKind={routeDialog?routeKind:4} subtitle={routeDialog?(step===0?t('学習したい教材を選んでください。','Choose your course.'):step===1?t('学習するユニットを選びましょう。','Choose a unit to study.'):t('今日の学習方法を選びましょう。','Choose a learning mode.')):undefined} lang={lang} title={goal==='learn'?t('単語を覚える','Learn Words'):goal==='explore'?t('単語を調べる','Search Words'):goal==='progress'?t('学習記録','My progress'):goal==='review'?t('復習する','Review'):goal==='library'?t('教材ライブラリー','Learning library'):groupName(goal)} onClose={close}>
 {goal==='learn'?<div className="lh-journey-body">
 <button className="lh-resume-banner" onClick={()=>{onResume();close()}} disabled={loading||!!error||!stats.total}><RouteArt kind={7}/><span className="lh-resume-copy"><strong>{t('前回の続き・記憶ミッション','Continue / Memory Mission')} →</strong><small>{t('中断した学習の続きから、効率よく記憶を定着させましょう。','Pick up where you left off and strengthen your memory.')}</small></span><span className="lh-resume-course"><small>{t('前回の学習','Last course')}</small><b>{courseLabel} · {unitLabel}</b></span><span className="lh-resume-progress"><b>{t('学習進捗','Progress')} {progressPct}%</b><progress max="100" value={progressPct}/></span></button>
 <div className="lh-journey-quick"><button onClick={()=>quick(true)}><RouteArt kind={8}/><span><strong>{t('復習する','Review')} <em>{allDue}</em></strong><small>{t('思い出して、記憶を強化。','Recall and strengthen your memory.')}</small></span><i>›</i></button><button onClick={()=>{onQuizStudio();close()}}><RouteArt kind={9}/><span><strong>{t('多角度語彙クイズ','Vocabulary quiz')}</strong><small>{t('意味・例文など、さまざまな角度で挑戦。','Challenge yourself in different ways.')}</small></span><i>›</i></button></div>
 {basics&&<div className="lh-recommended"><span><b>✦ {t('学習ルートのおすすめ','Suggested route')}</b><small>{t('迷ったらここから','A good place to start')}</small></span><div><strong>{basics.label}</strong><small>{t('基本単語 → 例文で理解 → クイズで定着','Words → Examples → Quiz')}</small></div><button onClick={()=>{begin(basics.group);chooseCourse(basics)}}>{t('このルートで学習','Start this route')} →</button></div>}
 <div className="lh-route-tools"><nav aria-label={t('教材の絞り込み','Filter courses')}>{filterOptions.map(([id,ja,en])=><button key={id} aria-pressed={routeFilter===id} onClick={()=>setRouteFilter(id)}>{t(ja,en)}</button>)}</nav><label className="lh-route-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/></svg><input value={routeQuery} onChange={e=>setRouteQuery(e.target.value)} aria-label={t('教材を検索','Search courses')} placeholder={t('教材を検索（英検、環境など）','Find a course')}/></label></div>
 <div className="lh-route-grid">{routeRows.map(({m:[group,tag,icon,sub],i,courses})=><button className={'lh-route-card lh-route-'+i} key={group} onClick={()=>begin(group)} disabled={!courses.length}><RouteArt kind={i}/><span className="lh-route-text"><strong>{groupName(group)}</strong><small>{lang==='ja'?sub:['Build vocabulary from beginner to advanced','Study for school and entrance exams','Prepare for English proficiency tests','Explore vocabulary by topic','Organize vocabulary by word class','Follow school learning materials','Extend your vocabulary'][i]}</small><span className="lh-route-tags">{courses.slice(0,4).map(c=><b key={c.id}>{c.short||c.label}</b>)}{courses.length>4&&<b>+{courses.length-4}</b>}</span></span><i aria-hidden="true">›</i></button>)}{!routeRows.length&&<p className="lh-empty-routes">{t('該当する教材がありません。','No matching courses.')} <button onClick={()=>{setRouteQuery('');setRouteFilter('all')}}>{t('すべて表示','Show all')}</button></p>}</div>
 </div>:goal==='progress'?<div className="lh-progress"><div className="ls-metrics">{[[today,t('今日','Today')],[allLearned,t('学習記録','Words studied')],[allDue,t('復習待ち','Due')]].map(([n,label])=><div key={label}><b>{n}</b><small>{label}</small></div>)}</div><h3>{courseLabel} · {unitLabel}</h3>{loading?<p role="status">{t('読み込み中…','Loading…')}</p>:error?<p>{error} <button onClick={onRetry}>{t('再試行','Retry')}</button></p>:<p>{stats.seen}/{stats.total} {t('語学習済み','words studied')}</p>}<button className="ls-primary" disabled={loading||!!error||!stats.total} onClick={()=>{onLibrary();close()}}>{t('単語一覧・赤シート','Word list')} →</button></div>:goal==='library'?<div className="ls-library-detail"><p>20冊以上の教材を比較・参照候補にした独自語彙マスター（8,653語）を整備中。学年・ジャンル・品詞別はオリジナル先行100語から開始しています。</p>{sourceGroups.map(([title,desc])=><article key={title}><strong>{title}</strong><p>{desc}</p></article>)}<p className="ls-note">市販教材の本文・全収録語を提供するものではありません。</p><button className="ls-primary" onClick={()=>begin('学年・入試')}>学習する →</button></div>:goal==='explore'?<><form className="ls-search" onSubmit={e=>search(e,query)}><label htmlFor="ls-word">{t('調べたい英単語','Enter an English word')}</label><input id="ls-word" value={query} onChange={e=>setQuery(e.target.value)} placeholder="e.g. improve" autoFocus autoComplete="off"/><button className="ls-primary" disabled={busy||!query.trim()}>{busy?t('検索中…','Searching…'):t('検索する','Search')} →</button>{exploreError&&<p role="alert">{exploreError}</p>}</form>{found&&<article className="lh-search-result"><div className="lh-result-heading"><h3>{found.word}</h3><button className="ls-choice" onClick={()=>onSpeak(found)} aria-label={t('発音','Pronounce')}>♫</button></div><p>{found.meaning||found.records?.[0]?.meaningJa}</p>{found.records?.slice(0,4).map(r=><div key={r.senseId}><small>{r.partOfSpeech}</small><p>{r.meaningJa}</p>{r.definitionEn&&<p>{r.definitionEn}</p>}</div>)}{examples.slice(0,4).map((ex,i)=><div className="lh-example" key={i}><p>{ex.en} <button onClick={()=>onSpeak({...found,english:ex.en,audio:undefined},true)} aria-label={t('例文を聞く','Listen to example')}>♫</button></p><small>{ex.ja}</small></div>)}<button className="ls-primary" onClick={()=>{const word=found.word;close();onExplore(word)}}>{t('関連語・派生語を見る','Explore related words')} →</button></article>}</>:<>
 <div className="lh-route-context"><span>{step===0?t("学習ルート","Learning routes"):groupName(goal)} {step>0&&" / "+picked?.label}{step===2&&" / "+(picked?.units.find(u=>u.id===unitId)?.label||"")}</span><b>{choices.length} {step===0?t("教材","courses"):step===1?t("ユニット","units"):t("学習方法","modes")}</b></div><div className="ls-step lh-route-steps">{(reviewOnly?[t('教材','Course'),t('ユニット','Unit'),t('学習方法','Mode')]:[t('教材','Course'),t('ユニット','Unit')]).map((s,i)=><span key={s} className={i===step?'active':i<step?'done':''} aria-current={i===step?"step":undefined}><b>{i<step?"✓":i+1}</b> {s}</span>)}</div>
 {step===0&&['CEFR・レベル別','学年・入試','ジャンル別','品詞別'].includes(goal)&&<p className="ls-note">オリジナル教材β · レベルは学習目安</p>}
 <div className="ls-choices lh-deep-grid">{visible.map((item,index)=>{
 const kind=step===0?(goal==='学校教材'?(item.id==='regular'?5:4):routeKind):step===1?4:item.id==='review'?8:item.id==='memory'?7:9;
 const count=step===0?item.units.filter(u=>unitAvailable(item.id,u.id)).length:0;
 const currentChoice=step===0?selection.courseId===item.id:step===1?selection.courseId===picked?.id&&selection.unitId===item.id:false;
 const action=step===0?()=>chooseCourse(item):step===1?()=>{setUnitId(item.id);if(reviewOnly){setStep(2);setPage(0)}else{onStart(picked.id,item.id,'library');close()}}:()=>start(item.id);
 return <button className="ls-choice lh-deep-card" key={item.id} onClick={action}><span className="lh-deep-art"><RouteArt kind={kind}/>{step===1&&<b>{page*pageSize+index+1}</b>}</span><div className="lh-deep-copy"><strong>{step===2?item.title:item.label}</strong><small>{step===0?(goal==='学校教材'?(item.id==='regular'?t('重要語彙・4択穴埋めで定着','Key vocabulary and cloze practice'):t('長文読解に必要な語彙を学ぶ','Vocabulary for reading passages')):t('レベル・目的に合わせて学習','Study at your own level')):step===1?picked.label:item.sub}</small><div className="lh-deep-tags">{step===0&&<b>{count} {t('ユニット','units')}</b>}{step===1&&<b>{t('学習する','Study')}</b>}{step===2&&<b>{t('開始','Start')}</b>}{currentChoice&&<b className="lh-deep-current">{t('前回の教材','Last studied')}</b>}</div></div><i aria-hidden="true">›</i></button>})}{!visible.length&&<p className="lh-empty-routes">{t('利用できる教材がありません。','No available courses.')}</p>}</div>
 <div className="ls-dialog-nav">{step===0&&<button className="ls-back" onClick={()=>begin('learn')}>{t('← 学習ルート','← Learning routes')}</button>}{step>0&&<button className="ls-back" onClick={()=>{setStep(step===2&&picked?.units.length===1?0:step-1);setPage(0)}}>{t('← 戻る','← Back')}</button>}{pages>1&&<div><button disabled={!page} onClick={()=>setPage(p=>p-1)}>←</button><span>{page+1} / {pages}</span><button disabled={page+1>=pages} onClick={()=>setPage(p=>p+1)}>→</button></div>}</div>
 </>}</Dialog>}
 </div>;
}
