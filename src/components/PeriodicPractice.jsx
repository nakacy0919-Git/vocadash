import React, { useEffect, useMemo, useRef, useState } from 'react';
import { isDue, assetImage } from '../lib/learning.js';
import { gradeAnswer, reviewMemory, mastery } from '../lib/memoryEngine.js';
import {wordProgress,courseProgress,formatAnswerTime,libraryPage} from '../lib/courseLibrary.js';
import {ProgressRing,WordProgress,CourseProgress} from './WordProgress.jsx';
import {
  DEFAULT_PRACTICE_OPTIONS, PRACTICE_COUNTS, eligibleClozeWords,
  shuffledChoices, sessionItems, recoverSession, summarizePractice, prepareFastWords, timedPracticeSummary
} from '../lib/periodicPractice.js';
import './PeriodicPractice.css';
import RedSheet from './RedSheet.jsx';

const read = (key, fallback = null) => {
  try { const saved = JSON.parse(localStorage.getItem(key) || 'null'); return saved ?? fallback; }
  catch { return fallback; }
};
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private browsing can block storage */ }
};
const clear = key => {
  try { localStorage.removeItem(key); } catch { /* non-persistent browsing */ }
};
const LETTERS = ['A', 'B', 'C', 'D'];

function Metric({ icon, value, label, highlight = false }) {
  return <div className="px-metric"><span className="px-metric-icon" aria-hidden="true">{icon}</span>
    <span><small>{label}</small><strong className={highlight ? 'px-cyan' : ''}>{value}</strong></span></div>;
}
function Action({ children, onClick, disabled = false, accent = false, className = '' }) {
  return <button type="button" className={'px-button ' + (accent ? 'px-button-main ' : '') + className} disabled={disabled} onClick={onClick}>{children}</button>;
}
export default function PeriodicPractice({
  words, records, unitId, unitLabel, loading, error, onRetry, onClose,
  onRecord, onSpeak, onLegacyMemory, sound = true, courseId='regular', courseLabel='定期考査対策', autoStart=false, resumeOnStart=false, focusIds=null, onBack, onStopAudio
}) {
  const base = courseId==='regular'?'vd-periodic-v2:'+unitId:'vd-fast-v1:'+courseId+':'+unitId+(focusIds?.length?':page:'+focusIds[0]:'');
  const [stage, setStage] = useState('home');
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_PRACTICE_OPTIONS, ...(read(base + ':settings', {}) || {})
  }));
  const [saved, setSaved] = useState(() => read(base + ':session'));
  const [session, setSession] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [wrongIds, setWrongIds] = useState(() => read(base + ':wrong', []));
  const [lastResult, setLastResult] = useState(() => read(base + ':last'));
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [listView,setListView]=useState('cards'),[sheetExamples,setSheetExamples]=useState(false);
  const [notice, setNotice] = useState('');
  const locked = useRef(false), startedAt = useRef(null), autoStarted=useRef(false);
  const [resultPage,setResultPage]=useState(0),[resultTab,setResultTab]=useState('wrong');
  const available = useMemo(() => {const scope=focusIds?words.filter(w=>focusIds.includes(w.id)):words;return courseId==='regular'?eligibleClozeWords(scope):prepareFastWords(scope);}, [words,focusIds,courseId]);
  const byId = useMemo(() => new Map(available.map(w => [w.id, w])), [available]);
  const recoverable = useMemo(() => recoverSession(saved, available), [saved, available]);
  const current = session && stage === 'quiz' ? byId.get(session.ids[session.cursor]) : null;
  const [failedImage,setFailedImage]=useState('');
  const picture=current?.image?assetImage(current.image):'';
  const showPicture=!!picture&&failedImage!==picture;
  const keepAudioFeedback=courseId==='eiken1_master'&&!!current?.audio&&sound&&settings.audio&&settings.instantFeedback;
  const options = useMemo(() => current ? shuffledChoices(current, session.seed) : [], [current, session?.seed]);
  const done = (session?.answers || []).filter(a => a.correct).length;
  const currentProgress=current?wordProgress(records[current.id]):null;
  const answerEvidence=feedback?session?.answers.at(-1):null;
  const seenCount = available.filter(w => (records[w.id]?.seen || 0) > 0 || (records[w.id]?.memory?.attempts || 0) > 0).length;
  const dueCount = available.filter(w => isDue(records[w.id])).length;
  const unitTitle = courseLabel + ' / ' + unitLabel;
  const wrongAvailable = available.filter(w => wrongIds.includes(w.id)).length;
  const wordList = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source=listView==='sheet'?words:available;
    return !q ? source : source.filter(w => [w.word, w.meaning, w.prompt,w.english].join(' ').toLowerCase().includes(q));
  }, [available, words,query,listView]);
  const listPage=libraryPage(wordList,page,listView==='sheet'&&sheetExamples?6:12);
  const totalPages=listPage.pages,visibleWords=listPage.items;
  useEffect(()=>{if(page!==listPage.page)setPage(listPage.page);},[page,listPage.page]);
  function changeListView(next){if(next===listView)return;setPage(Math.floor(listPage.start/(next==='sheet'&&sheetExamples?6:12)));setListView(next);}
  function changeSheetExamples(next){setPage(Math.floor(listPage.start/(next?6:12)));setSheetExamples(next);}

  useEffect(() => { write(base + ':settings', settings); }, [base, settings]);
  useEffect(() => { write(base + ':wrong', wrongIds); }, [base, wrongIds]);
  useEffect(() => { if (session && stage === 'quiz') { write(base + ':session', session); setSaved(session); } }, [base, session, stage]);
  useEffect(() => {
    if (!feedback || stage !== 'quiz' || keepAudioFeedback) return;
    const timer = window.setTimeout(() => advance(), !settings.instantFeedback ? 220 : feedback.correct ? 1100 : 2200);
    return () => window.clearTimeout(timer);
  }, [feedback, stage, settings.instantFeedback, keepAudioFeedback]);

  useEffect(() => {
    if (stage !== 'quiz') return;
    const key = event => {
      if (/INPUT|TEXTAREA|SELECT/.test(event.target?.tagName || '') || event.altKey || event.ctrlKey || event.metaKey) return;
      if (feedback && event.key === 'Enter') { event.preventDefault(); advance(); return; }
      if (!feedback && /^[1-4]$/.test(event.key)) {
        const option = options[Number(event.key) - 1];
        if (option) { event.preventDefault(); choose(option.index); }
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  useEffect(()=>{if(!autoStart||autoStarted.current||loading||error||!available.length)return;autoStarted.current=true;if(resumeOnStart&&recoverable)resume();else start();},[autoStart,resumeOnStart,loading,error,available,recoverable]);
  useEffect(()=>{startedAt.current=stage==='quiz'&&current&&!feedback&&!document.hidden?performance.now():null;},[stage,current?.id,session?.cursor,feedback]);
  useEffect(()=>{const invalidate=()=>{startedAt.current=null;};document.addEventListener('visibilitychange',invalidate);return()=>document.removeEventListener('visibilitychange',invalidate);},[]);
  function start(ids = null) {
    const eligibleIds = ids || sessionItems(available, settings);
    if (!eligibleIds.length) return;
    const next = { ids: eligibleIds, cursor: 0, answers: [], seed: Date.now(), startedAt: Date.now() };
    setSession(next); setSaved(next); setFeedback(null); locked.current = false;
    setStage('quiz'); setNotice('');
  }
  function resume() {
    if (!recoverable) return;
    let next = recoverable;
    // An answered question cannot be answered again after a page reload.
    if (next.answers.some(a => a.id === next.ids[next.cursor])) {
      if (next.cursor === next.ids.length - 1) {
        setSession(next); finish(next); return;
      }
      next = { ...next, cursor: next.cursor + 1 };
    }
    setSession(next); setFeedback(null); locked.current = false; setStage('quiz');
  }
  function startWrong() {
    const ids = available.filter(w => wrongIds.includes(w.id)).map(w => w.id);
    if (!ids.length) { setNotice('復習対象はありません。まず4択問題に挑戦してください。'); return; }
    start(settings.random ? [...ids].sort(() => Math.random() - 0.5) : ids);
  }
  function choose(index) {
    if (locked.current || feedback || !current || !session) return;
    locked.current = true;
    const correct = index === current.correctIndex;
    const skipped=index===-1, at=Date.now();
    const responseMs=skipped||startedAt.current===null?null:Math.max(0,Math.round(performance.now()-startedAt.current));
    const kind=current.practiceKind||'cloze';
    const grade=gradeAnswer({correct,responseMs,kind});
    const predicted=skipped?null:mastery(reviewMemory(records[current.id]?.memory,grade,kind,at,{responseMs}),at);
    const answer = { id: current.id, correct, selectedIndex: index, skipped, responseMs, mastery:predicted, at };
    const updated = { ...session, answers: [...session.answers, answer] };
    setSession(updated);
    setFeedback({ index, correct });
    if (settings.retryWrong) setWrongIds(old => correct ? old.filter(id => id !== current.id) : [...new Set([...old, current.id])]);
    if(!skipped)onRecord(current, correct, {responseMs,kind,grade,at});
  }
  function finish(value) {
    const summary = summarizePractice(value.answers);
    const next = { ...summary, ...timedPracticeSummary(value.answers), at: Date.now() };
    setResultPage(0);setResultTab('wrong');
    setLastResult(next);
    write(base + ':last', next);
    clear(base + ':session');
    setSaved(null);
    setFeedback(null);
    locked.current = false;
    setStage('result');
  }
  function advance() {
    if (!session) return;
    onStopAudio?.();
    locked.current = false;
    setFeedback(null);
    if (session.cursor >= session.ids.length - 1) finish(session);
    else setSession(old => ({ ...old, cursor: old.cursor + 1 }));
  }
  function showList() { onStopAudio?.(); setQuery(''); setPage(0); setListView('cards'); setStage('list'); setNotice(''); }
  function showSheet() { onStopAudio?.(); setQuery(''); setPage(0); setListView('sheet'); setStage('list'); setNotice(''); }
  function returnHome() { onStopAudio?.(); setFeedback(null); locked.current = false; if(autoStart&&onBack){onBack();return;}setStage('home'); }
  function changeSetting(key, value) { setSettings(prev => ({ ...prev, [key]: value })); }

  return <main className={"px-root px-stage-"+stage}>
    <header className="px-topbar">
      <div className="px-brand"><span className="px-mark" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="M24 38c-6-5-13-7-21-5V12c8-2 15 0 21 5 6-5 13-7 21-5v21c-8-2-15 0-21 5Zm0 0V17" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M24 13C24 6 29 3 37 2c-1 7-5 11-13 11ZM23 13C15 13 11 9 10 4c7 0 12 3 13 9Z" fill="#91ae70"/></svg></span><strong>VocaDash</strong><span className="px-brand-note">VOCABULARY STUDIO</span></div>
      <nav aria-label="学習画面ナビゲーション"><button onClick={onClose}>⌂ ホーム</button><button onClick={returnHome}>▤ コース</button><button onClick={showList}>☷ 単語一覧</button><button className="px-sheet-nav" onClick={showSheet}>▰ 赤シート</button></nav>
    </header>
    <div className="px-shell">
      <div className="px-breadcrumb"><button onClick={stage === 'home' ? onClose : returnHome}>← {stage === 'home' ? '教材選択に戻る' : 'コースに戻る'}</button></div>
      <div className="px-hero">
        <div><p className="px-kicker">{unitTitle}</p><h1>{stage === 'quiz' ? '4択穴埋め' : stage === 'setup' ? '4択穴埋めスタート' : stage === 'result' ? '練習結果' : stage === 'list' ? (listView==='sheet'?'赤シート学習':'収録単語一覧') : courseLabel}</h1>
          <p className="px-subtitle">{stage === 'quiz' ? '英文の空欄に入る英単語を、4つの選択肢から選ぼう。' : '重要語彙を、例文の穴埋めでテンポよく練習しよう。'}</p>
        </div>
        <div className="px-book-decoration" aria-hidden="true"><svg viewBox="0 0 210 140" fill="none"><defs><linearGradient id="px-book" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff9db"/><stop offset="1" stopColor="#e6c784"/></linearGradient></defs><ellipse cx="105" cy="120" rx="90" ry="9" fill="#a87a3d" opacity=".14"/><circle cx="106" cy="64" r="56" fill="#e5c77f" opacity=".19"/><path d="M105 47Q72 23 19 36l9 71q42-14 77 5 35-19 77-5l9-71Q138 23 105 47Z" fill="#698352" stroke="#4d6743" strokeWidth="3"/><path d="M105 42Q70 16 27 28l9 68q37-11 69 9 32-20 69-9l9-68Q140 16 105 42Z" fill="url(#px-book)" stroke="#b59a63" strokeWidth="2"/><path d="M105 43v62M44 47q29-6 48 9M46 61q29-6 46 8M48 75q27-6 44 7M118 56q21-15 48-9M118 69q21-15 46-8M118 82q21-15 44-7" stroke="#b49b6b" strokeWidth="2" strokeLinecap="round"/><path d="M148 44V22l15 3v48l-8-5-7 7Z" fill="#9b6841"/><path d="M12 16v14m-7-7h14M191 4v20m-10-10h20" stroke="#cda54c" strokeWidth="2" strokeLinecap="round"/></svg></div>
      </div>
      {loading || error ? <section className="px-panel px-status"><h2>{loading ? '教材を読み込んでいます…' : '教材の読み込みに失敗しました'}</h2>{error && <><p>{error}</p><Action onClick={onRetry}>再試行</Action></>}</section> :
      available.length === 0 ? <section className="px-panel px-status"><h2>4択穴埋め問題が見つかりません</h2><p>この教材には4択の穴埋め問題がありません。別の教材をご利用ください。</p><Action onClick={onClose}>教材選択へ戻る</Action></section> :
      <>
        {stage === 'home' && <>
          <div className="px-hero-actions">
            <Action accent className="px-start" onClick={() => start()}><span aria-hidden="true">▶</span><strong className="px-cta-label">4択穴埋めを今すぐ始める</strong><span aria-hidden="true">→</span></Action>
            <div className="px-small-actions">
              <Action onClick={resume} disabled={!recoverable}>▷ <span>前回の続き</span></Action>
              <Action onClick={showList}>▤ <span>単語一覧</span></Action>
              <Action onClick={startWrong} disabled={!wrongAvailable}>↻ <span>まちがい復習</span></Action>
            </div>
          </div>
          <div className="px-secondary-row"><button className="px-sheet-entry" onClick={showSheet}>▰ 赤シートで覚える →</button><button onClick={() => setStage('setup')}>⚙ 出題数・出題順などを設定する →</button><details className="px-legacy"><summary>その他の練習</summary><button onClick={onLegacyMemory}>記憶ミッション（従来の学習方法）</button></details>{recoverable && <span>続きから再開できます：{recoverable.answers.length} / {recoverable.ids.length}問</span>}</div>
          <div className="px-metrics">
            <Metric icon="▱" value={available.length} label="総問題数"/>
            <Metric icon="▤" value={available.length - seenCount} label="未学習" highlight/>
            <Metric icon="◷" value={dueCount} label="復習待ち"/>
            <Metric icon="◎" value={lastResult?.total ? lastResult.rate + '%' : '—'} label="前回の正答率"/>
          </div>
          {notice && <p className="px-notice" role="status">{notice}</p>}
          <div className="px-bottom-grid">
            <section className="px-panel"><h2>◎ おすすめの学習フロー</h2><p>最初から問題に挑戦して、間違えた単語を集中的に復習。</p>
              <div className="px-flow"><span className="px-flow-active"><b>1</b> 4択穴埋め</span><i>→</i><span><b>2</b> まちがい復習</span><i>→</i><span><b>3</b> 単語確認</span></div>
            </section>
            <section className="px-panel"><h2>▤ 収録語の例</h2><p>今回の問題で学習する単語</p><div className="px-chips">{available.slice(0, 5).map(w => <span key={w.id}>{w.word}</span>)}</div><button className="px-link" onClick={showList}>収録語をすべて見る →</button></section>
          </div>
        </>}
        {stage === 'setup' && <>
          <div className="px-metrics">
            <Metric icon="▱" value={available.length} label="総問題数"/><Metric icon="▤" value={available.length - seenCount} label="未学習" highlight/>
            <Metric icon="◷" value={dueCount} label="復習待ち"/><Metric icon="◎" value={lastResult?.total ? lastResult.rate + '%' : '—'} label="前回の正答率"/>
          </div>
          <section className="px-panel px-settings"><h2>⚙ 練習の設定</h2><div className="px-settings-grid">
            <fieldset><legend>▤ 出題数</legend><div className="px-choice-row">{PRACTICE_COUNTS.filter(n => n <= available.length).map(n => <button type="button" key={n} aria-pressed={settings.count === n} onClick={() => changeSetting('count', n)}>{n}問</button>)}{!PRACTICE_COUNTS.includes(available.length) && available.length < 10 && <button type="button" aria-pressed="true">{available.length}問</button>}</div><small>20問がおすすめ。全問も選べます。</small></fieldset>
            <fieldset><legend>⤨ 出題順</legend><div className="px-choice-row"><button type="button" aria-pressed={!settings.random} onClick={() => changeSetting('random', false)}>順番</button><button type="button" aria-pressed={settings.random} onClick={() => changeSetting('random', true)}>ランダム</button></div></fieldset>
            <fieldset><legend>⚙ オプション</legend><div className="px-toggle-list">
              <label><input type="checkbox" checked={settings.audio} onChange={e => changeSetting('audio', e.target.checked)}/> 音声ボタンを表示</label>
              <label><input type="checkbox" checked={settings.retryWrong} onChange={e => changeSetting('retryWrong', e.target.checked)}/> まちがいを復習に保存</label>
              <label><input type="checkbox" checked={settings.instantFeedback} onChange={e => changeSetting('instantFeedback', e.target.checked)}/> 1問ごとに正誤と解説を表示</label>
            </div></fieldset>
          </div><div className="px-recommend">✦ おすすめ設定：20問・ランダム・まちがい復習</div></section>
          <div className="px-setup-footer"><Action accent onClick={() => start()}>▶ 4択練習を開始 →</Action><Action onClick={showList}>▤ 単語一覧を見る</Action><Action onClick={showSheet}>▰ 赤シート</Action></div>
        </>}
        {stage === 'quiz' && session && current && <>
          <div className="px-quiz-progress"><strong>{session.cursor + 1} <small>/ {session.ids.length} 問</small></strong><div className="px-track"><span style={{ width: String((session.cursor + 1) / session.ids.length * 100) + '%' }}/></div><span>正解 <b>{done}</b></span><span>あと <b>{session.ids.length - session.cursor - 1}問</b></span></div>
          <section className={"px-panel px-question"+(feedback?" px-has-feedback":"")+(feedback?.correct?" px-question-success":"")+(showPicture?" px-with-picture":"")}><div className="px-question-head"><span className="px-qbadge">Q{session.cursor + 1}</span><strong>{current.practiceKind==='meaning'?'日本語の意味に合う英単語を選ぼう':'意味に合う語を選ぼう'}</strong>{currentProgress&&<div className="px-question-progress" role="status"><span>{answerEvidence?(answerEvidence.skipped?'スキップ':answerEvidence.correct?'正解時間':'解答時間'):'定着度（推定）'}<b>{answerEvidence?formatAnswerTime(answerEvidence.responseMs):currentProgress.attempts?currentProgress.percent+'%':'未計測'}</b></span>{answerEvidence&&!answerEvidence.skipped&&answerEvidence.mastery!=null&&<ProgressRing value={answerEvidence.mastery}/>}</div>}</div>
            <div className="px-question-context">{showPicture&&<figure className="px-illustration"><img key={picture} src={picture} alt="例文の場面を表すイラスト" onError={()=>setFailedImage(picture)}/><figcaption>VISUAL VOCABULARY</figcaption></figure>}<div className="px-prompt-block"><p className="px-sentence" lang={current.practiceKind==="meaning"?"ja":"en"}>{current.practiceKind==="meaning"?current.meaning:current.prompt}</p>{current.practiceKind!=="meaning"&&<p className="px-translation">{current.japanese}</p>}{keepAudioFeedback&&feedback&&<button type="button" className="px-model-audio" onClick={()=>onSpeak(current,true)}>♫ 合成音声で例文を聞く</button>}</div></div>
            <div className="px-answer-grid">{options.map((option, i) => {
              const selected = feedback?.index === option.index;
              const isRight = feedback && option.index === current.correctIndex;
              return <button type="button" key={option.index} className={'px-answer ' + (isRight ? 'px-right ' : '') + (selected && !feedback.correct ? 'px-wrong ' : '')} disabled={!!feedback} onClick={() => choose(option.index)}><span>{LETTERS[i]}</span><b className="px-answer-word">{option.text}</b>{isRight&&<i aria-hidden="true" className="px-answer-check">✓</i>}</button>;
            })}</div>
            {feedback && settings.instantFeedback && <div className={'px-feedback ' + (feedback.correct ? 'px-feedback-right' : 'px-feedback-wrong')} role="status">
              <strong>{feedback.correct ? '✓ 正解です！' : feedback.index === -1 ? 'スキップしました' : 'もう一度覚えよう'}</strong>
              <span>正解：{current.word}　{current.meaning}{session.answers.at(-1)?.responseMs!=null&&<small className="px-answer-time"> · {(session.answers.at(-1).responseMs/1000).toFixed(1)}秒</small>}</span>
              {settings.instantFeedback && <p>{current.explanation || current.english}</p>}
              <button onClick={advance}>次の問題へ →</button>
            </div>}
            <div className="px-question-footer"><div className="px-tools">
              {settings.audio && feedback && !keepAudioFeedback && <button onClick={() => onSpeak(current, true)} disabled={!sound}>♫ 正しい英文を聞く</button>}
              <button onClick={() => setWrongIds(old => [...new Set([...old, current.id])])}>▤ あとで復習</button>
              {!feedback && <button onClick={() => choose(-1)}>≫ スキップ</button>}
            </div>
              <span className="px-quiz-help">{feedback ? (keepAudioFeedback?'例文の音声を確認し、次の問題へ進もう':'正解と意味を確認して次へ進もう') : '選択肢を押すだけで解答できます · キーボード 1〜4'}</span>
            </div>
          </section>
          <button className="px-exit-quiz" onClick={returnHome}>← 途中で終了（続きから再開できます）</button>
        </>}
        {stage === 'result' && session && (() => {
          const summary = summarizePractice(session.answers), timing=timedPracticeSummary(session.answers);
          const wrongRows=session.answers.filter(a=>!a.correct);
          const rows=resultTab==='wrong'?wrongRows:session.answers;
          const row=rows[Math.min(resultPage,Math.max(0,rows.length-1))], w=row&&byId.get(row.id);
          const seconds=n=>n==null?'—':(n/1000).toFixed(1)+'秒';
          return <section className="px-panel px-result px-result-dashboard">
            <div className="px-result-overview">
              <div className="px-result-gauge"><span className="px-result-kicker">✦ MISSION COMPLETE</span><div className="px-gauge-art"><svg viewBox="0 0 240 137" role="img" aria-label={'正答率 '+summary.rate+'%'}><defs><linearGradient id="px-gauge-green"><stop stopColor="#b3c981"/><stop offset="1" stopColor="#52743e"/></linearGradient></defs><path d="M18 120 A102 102 0 0 1 222 120" fill="none" stroke="#e5dac2" strokeWidth="17" strokeLinecap="round"/><path d="M18 120 A102 102 0 0 1 222 120" pathLength="100" fill="none" stroke="url(#px-gauge-green)" strokeWidth="17" strokeLinecap="round" strokeDasharray={summary.rate+' 100'} className="px-gauge-fill"/></svg><div className="px-gauge-number"><small>正答率</small><strong>{summary.rate}<em>%</em></strong></div></div><p>{summary.correct} / {summary.total} 問 正解</p></div>
              <div className="px-result-stat-grid"><div><small>平均解答時間</small><strong>{seconds(timing.averageMs)}</strong><span>計測 {timing.timedCount} 問</span></div><div><small>最速解答</small><strong>{seconds(timing.fastestMs)}</strong><span>正誤を問わず計測</span></div><div><small>語彙定着度（推定）</small><strong>{timing.mastery==null?'—':timing.mastery+'%'}</strong><span>記憶履歴・正誤・時間</span></div><div><small>要復習</small><strong>{wrongRows.length}<em> 語</em></strong><span>スキップ {timing.skipped} 問を含む</span></div></div>
            </div>
            <div className="px-result-review"><div className="px-result-review-head"><h2>学習の振り返り</h2><div className="px-choice-row"><button aria-pressed={resultTab==='wrong'} onClick={()=>{setResultTab('wrong');setResultPage(0)}}>まちがい {wrongRows.length}</button><button aria-pressed={resultTab==='all'} onClick={()=>{setResultTab('all');setResultPage(0)}}>全結果 {session.answers.length}</button></div></div>
            {w?<article className="px-result-word"><div className="px-result-word-heading"><strong>{w.word}</strong><span>{row.skipped?'スキップ':row.correct?'✓ 正解':'要復習'} · {seconds(row.responseMs)} · 定着度 {row.mastery==null?'—':row.mastery+'%'}</span></div><p lang="en">{w.english||w.prompt}</p><small>{w.meaning} {w.japanese&&' · '+w.japanese}</small></article>:<p className="px-result-empty">すべて正解です！ 次の学習に進みましょう。</p>}
            <div className="px-pagination"><button disabled={resultPage===0} onClick={()=>setResultPage(n=>n-1)}>← 前へ</button><span>{rows.length?resultPage+1:0} / {rows.length}</span><button disabled={resultPage>=rows.length-1} onClick={()=>setResultPage(n=>n+1)}>次へ →</button></div></div>
            <div className="px-result-actions"><Action accent onClick={()=>start()}>もう一度4択で練習 →</Action><Action onClick={()=>start(wrongRows.map(a=>a.id))} disabled={!wrongRows.length}>まちがいだけ復習</Action><Action onClick={returnHome}>コースに戻る</Action></div>
          </section>;
        })()}
        {stage === 'list' && <section className={"px-panel px-library"+(listView==='sheet'?' px-sheet-library':'')}><div className="px-library-top"><div><h2>▤ {listView==='sheet'?words.length:available.length}語</h2><div className="px-list-switch" role="group" aria-label="学習表示"><button type="button" aria-pressed={listView==='cards'} onClick={()=>changeListView('cards')}>▦ 単語一覧</button><button type="button" aria-pressed={listView==='sheet'} onClick={()=>changeListView('sheet')}>▰ 赤シート</button></div></div><label>検索 <input type="search" value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} placeholder="英語・日本語で検索"/></label></div>
          {listView==='sheet'?(visibleWords.length>0&&<RedSheet items={visibleWords} start={listPage.start} page={listPage.page} total={wordList.length} onSpeak={onSpeak} sound={sound} showExamples={sheetExamples} onShowExamples={changeSheetExamples}/>):<><CourseProgress data={courseProgress(available,records)}/><div className="px-word-grid">{visibleWords.map((w,i) => <article key={w.id}><small>{listPage.start + i + 1}</small><h3>{w.word}</h3><p>{w.meaning}</p><WordProgress data={wordProgress(records[w.id])}/><details><summary>例文を見る</summary><p lang="en">{w.english}</p><p>{w.japanese}</p><small>{w.explanation}</small></details></article>)}</div></>}
          {wordList.length === 0 && <p>該当する単語がありません。</p>}
          <div className="px-pagination"><button disabled={listPage.page === 0} onClick={() => setPage(p => p - 1)}>← 前へ</button><span>{listPage.page + 1} / {totalPages} · {wordList.length}語</span><button disabled={listPage.page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>次へ →</button></div>
          <div className="px-setup-footer"><Action accent disabled={!available.length} onClick={() => start()}>▶ 4択練習を始める</Action><Action onClick={returnHome}>コースに戻る</Action></div>
        </section>}
      </>}
    </div>
  </main>;
}
