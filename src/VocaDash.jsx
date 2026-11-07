import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CATALOG, firstUnit, sourcePath, normalizeWords, assetImage, safeLoad, safeSave, updateRecord, isDue, summaryFor, shuffled, splitDialogueTurns, makeSessionQueue } from './lib/learning';
import './VocaDash.css';
import ReadingPractice from './components/ReadingPractice';
import { saveReadingProgress, READING_SCORE_VERSION } from './lib/reading';

const MODULES = import.meta.glob('./data/*.json');

let quizEffectsAudioContext;
function playQuizFeedbackSound(correct, enabled) {
  if (!enabled || typeof window === 'undefined') return;
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return;
  try {
    if (!quizEffectsAudioContext) quizEffectsAudioContext = new Context();
    if (quizEffectsAudioContext.state === 'suspended') {
      quizEffectsAudioContext.resume().catch(() => {});
    }
    const now = quizEffectsAudioContext.currentTime;
    const notes = correct
      ? [[659.25, 0], [783.99, 0.105], [987.77, 0.21]]
      : [[392, 0], [329.63, 0.15]];
    notes.forEach(([frequency, delay]) => {
      const oscillator = quizEffectsAudioContext.createOscillator();
      const volume = quizEffectsAudioContext.createGain();
      const start = now + delay;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      volume.gain.setValueAtTime(0.0001, start);
      volume.gain.exponentialRampToValueAtTime(correct ? 0.075 : 0.052, start + 0.025);
      volume.gain.exponentialRampToValueAtTime(0.0001, start + (correct ? 0.28 : 0.31));
      oscillator.connect(volume);
      volume.connect(quizEffectsAudioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.34);
    });
  } catch {
    // Audio may be unavailable or blocked; the visual result always remains available.
  }
}

const modes = [
  { id: 'study', label: '単語で覚える', icon: '▣' },
  { id: 'sentence', label: '例文で覚える', icon: '▤' },
  { id: 'reading', label: '例文を音読', icon: '◉' },
  { id: 'quiz', label: '確認テスト', icon: '✦' },
  { id: 'listening', label: '音声×画像', icon: '♫', masterOnly: true },
  { id: 'review', label: '復習', icon: '↻' }
];
const icons = {
  speaker: <><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></>,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6"/>,
  back: <path d="m15 18-6-6 6-6"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  repeat: <><path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-3v2a3 3 0 0 1-3 3H3"/></>,
  cards: <><rect x="3" y="4" width="17" height="14" rx="2"/><path d="M7 22h11a3 3 0 0 0 3-3V8"/></>,
  list: <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></>,
  close: <path d="M18 6 6 18M6 6l12 12"/>,
  sliders: <><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="17" r="2"/></>,
};
function Icon({ name, size = 19 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" aria-hidden="true">{icons[name] || icons.cards}</svg>;
}
function QuizSentence({ text }) {
  const turns = splitDialogueTurns(text);
  return (
    <h2 className={'vd-quiz-sentence' + (turns ? ' vd-quiz-dialogue' : '')}>
      {turns ? turns.map((turn, index) => (
        <span className="vd-quiz-turn" key={index}>
          <span className="vd-quiz-speaker">{turn.speaker}:</span>
          <span className="vd-quiz-utterance">{turn.text}</span>
        </span>
      )) : text}
    </h2>
  );
}

function ProgressMedallion({ value, title, detail, variant }) {
  const percent = Math.max(0, Math.min(100, Number(value) || 0));
  const circumference = 2 * Math.PI * 67;
  const dash = circumference * percent / 100;
  const id = variant === 'reading' ? 'vd-reading' : 'vd-mastery';
  return (
    <div className={'vd-progress-medallion '+(variant === 'reading' ? 'is-reading' : 'is-mastery')}
      role="meter" aria-label={title} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
      <div className="vd-medallion-visual">
        <svg className="vd-medallion-svg" viewBox="0 0 180 180" aria-hidden="true">
          <defs>
            <linearGradient id={id+'-fill'} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={variant === 'reading' ? '#0e9b83' : '#425ed5'}/>
              <stop offset="47%" stopColor={variant === 'reading' ? '#43eac0' : '#7dccff'}/>
              <stop offset="100%" stopColor={variant === 'reading' ? '#0fba89' : '#5971ec'}/>
            </linearGradient>
            <linearGradient id={id+'-glass'} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fff" stopOpacity=".78"/>
              <stop offset="100%" stopColor="#fff" stopOpacity="0"/>
            </linearGradient>
            <radialGradient id={id+'-face'} cx="35%" cy="15%" r="85%">
              <stop offset="0%" stopColor="#ffffff"/>
              <stop offset="100%" stopColor={variant === 'reading' ? '#f1faf7' : '#f1f5ff'}/>
            </radialGradient>
          </defs>
          <circle cx="90" cy="90" r="79" fill="none" stroke="#fff" strokeWidth="2" opacity=".85"/>
          <circle cx="90" cy="90" r="67" fill="none" stroke="#dce6f3" strokeWidth="15" />
          <circle cx="90" cy="90" r="67" fill="none" stroke={'url(#'+id+'-fill)'} strokeWidth="15"
            strokeLinecap="round" strokeDasharray={dash+' '+circumference}
            transform="rotate(-90 90 90)" className="vd-medallion-progress"/>
          <circle cx="90" cy="90" r="67" fill="none" stroke={'url(#'+id+'-glass)'}
            strokeWidth="5" strokeDasharray={dash+' '+circumference} transform="rotate(-90 90 90) translate(0 -3)"
            className="vd-medallion-reflection"/>
          <circle cx="90" cy="90" r="54" fill={'url(#'+id+'-face)'} stroke="#fff" strokeWidth="2"/>
          <ellipse cx="90" cy="65" rx="43" ry="17" fill="#fff" opacity=".4"/>
        </svg>
        <div className="vd-medallion-value">
          <strong>{percent}<span>%</span></strong>
          <small>{detail}</small>
        </div>
      </div>
      <strong className="vd-medallion-label">{title}</strong>
      <span className="vd-medallion-subtitle">{percent === 100 ? '目標達成！' : percent > 0 ? '積み重ねが成果に' : 'ここからスタート'}</span>
    </div>
  );
}
function Brand() { return <div className="vd-brand"><span className="vd-brandmark"><Icon name="cards" size={23}/></span><div><strong>VocaDash</strong><small>VOCABULARY STUDIO</small></div></div>; }
function useVocabulary(selection) {
  const [data, setData] = useState({ words: [], loading: true, error: '' });
  const [retryCount, setRetryCount] = useState(0);
  useEffect(() => {
    let active = true;
    const loader = MODULES[sourcePath(selection.courseId, selection.unitId)];
    setData({ words: [], loading: true, error: '' });
    if (!loader) { setData({ words: [], loading: false, error: '教材データが見つかりません。' }); return; }
    loader().then(mod => {
      if (!active) return;
      setData({ words: normalizeWords(mod.default || mod, selection.courseId, selection.unitId), loading: false, error: '' });
    }).catch(() => { if (active) setData({ words: [], loading: false, error: '教材の読み込みに失敗しました。' }); });
    return () => { active = false; };
  }, [selection.courseId, selection.unitId, retryCount]);
  return { ...data, retry: () => setRetryCount(n => n + 1) };
}

export default function VocaDash() {
  const [store, setStore] = useState(safeLoad);
  const [selection, setSelection] = useState(() => store.lastSelection);
  const { words, loading, error, retry } = useVocabulary(selection);
  const [mode, setMode] = useState('study');
  const [dashboardOpen, setDashboardOpen] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [queue, setQueue] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [quizCelebration, setQuizCelebration] = useState(null);
  const [ratingFeedback, setRatingFeedback] = useState(null);
  const [quizReviewOpen, setQuizReviewOpen] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [wordListOpen, setWordListOpen] = useState(false);
  const [wordQuery, setWordQuery] = useState('');
  const [imageError, setImageError] = useState(false);
  const [savedError, setSavedError] = useState(false);
  const [session, setSession] = useState({ answered: 0, correct: 0 });
  const audio = useRef(null), quizTimer = useRef(null);
  const swipeStart = useRef(null);
  const readingCounted = useRef(new Set());

  const course = CATALOG.find(c => c.id === selection.courseId) || CATALOG.find(c => c.id === 'eiken_2');
  const unit = course.units.find(u => u.id === selection.unitId) || course.units[0];
  const current = queue[cursor];
  const isFinished = !loading && queue.length > 0 && cursor >= queue.length;
  const stats = useMemo(() => summaryFor(words, store.records), [words, store.records]);
  const today = useMemo(() => Object.values(store.records).filter(r => [r?.lastSeenAt,r?.readingLastAt].some(at => at && new Date(at).toDateString() === new Date().toDateString())).length, [store.records]);
  const progress = queue.length ? Math.min(100, cursor / queue.length * 100) : 0;
  const masteryPercent = stats.total ? Math.round(stats.known / stats.total * 100) : 0;
  const readingPassed = useMemo(
    () => words.filter(w => store.records[w.id]?.readingScoreVersion === READING_SCORE_VERSION && (store.records[w.id]?.readingClearedLevel || 0) >= 1).length,
    [words,store.records]
  );
  const readingPercent = stats.total ? Math.round(readingPassed / stats.total * 100) : 0;
  const filtered = useMemo(() => words.filter(w => (w.word + ' ' + w.meaning).toLowerCase().includes(wordQuery.toLowerCase())), [words, wordQuery]);
  const options = useMemo(() => current ? shuffled(current.choices.map((text, i) => ({ id: i, text, correct: i === current.correctIndex }))) : [], [current]);
  const imageOptions = useMemo(() => {
    if (!current?.image || mode !== 'listening') return [];
    const distractors = shuffled(words.filter(w => w.id !== current.id && w.image && w.image !== current.image));
    return shuffled([current, ...distractors.slice(0, 3)]).map(w => ({
      id: w.id, image: assetImage(w.image), correct: w.id === current.id, text: w.word
    }));
  }, [mode, current, words]);

  useEffect(() => { if (!safeSave(store)) setSavedError(true); }, [store]);
  const stopAudio = useCallback(() => {
    if (audio.current) { audio.current.pause(); audio.current = null; }
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
  }, []);
  useEffect(() => () => { clearTimeout(quizTimer.current); stopAudio(); }, [stopAudio]);
  const resetCard = () => {
    clearTimeout(quizTimer.current);
    stopAudio();
    setRevealed(false);
    setFeedback(null);
    setQuizCelebration(null);
    setRatingFeedback(null);
    setQuizReviewOpen(false);
    setImageError(false);
  };
  useEffect(() => {
    setQueue(makeSessionQueue(words, 'study', store.records, store.settings)); setCursor(0); setMode('study'); setRevealed(false);
    setFeedback(null); setQuizCelebration(null); setRatingFeedback(null); setQuizReviewOpen(false);
    setAutoplay(false); setSession({ answered: 0, correct: 0 });
  }, [words]);

  const selectCourse = id => {
    resetCard(); readingCounted.current.clear(); setAutoplay(false); setDashboardOpen(false);
    const next = { courseId: id, unitId: firstUnit(id) };
    setSelection(next); setStore(prev => ({ ...prev, lastSelection: next }));
  };
  const selectUnit = id => {
    resetCard(); readingCounted.current.clear(); setAutoplay(false); setDashboardOpen(false);
    const next = { courseId: course.id, unitId: id };
    setSelection(next); setStore(prev => ({ ...prev, lastSelection: next }));
  };
  const startMode = name => {
    resetCard(); readingCounted.current.clear(); setDashboardOpen(false); setAutoplay(false); setMode(name); setCursor(0);
    setSession({ answered: 0, correct: 0 });
    setQueue(makeSessionQueue(words, name, store.records, store.settings));
  };
  const openReadingFromSentence = () => {
    resetCard();setAutoplay(false);setMode('reading');
    readingCounted.current.clear();
    setSession({answered:0,correct:0});
  };
  const onReadingResult = (wordId,level,percent) => {
    setStore(previous => saveReadingProgress(previous,wordId,level,percent));
    if(percent >= 80 && !readingCounted.current.has(wordId)){
      readingCounted.current.add(wordId);
      setSession(previous=>({answered:previous.answered+1,correct:previous.correct+1}));
    }
  };
  const next = () => { resetCard(); setCursor(n => n + 1); };
  const previous = () => { resetCard(); setCursor(n => Math.max(0, n - 1)); };
  const handleSwipeStart = event => {
    const point = event.touches[0];
    swipeStart.current = point ? { x: point.clientX, y: point.clientY } : null;
  };
  const handleSwipeEnd = event => {
    const start = swipeStart.current;
    swipeStart.current = null;
    const point = event.changedTouches[0];
    if (!start || !point || mode === 'reading' || advancedOpen || wordListOpen || quizReviewOpen || autoplay || feedback !== null) return;
    const dx = point.clientX - start.x, dy = point.clientY - start.y;
    if (Math.abs(dx) < 85 || Math.abs(dx) < Math.abs(dy) * 1.45) return;
    if (dx < 0 && cursor < queue.length - 1) next();
    if (dx > 0 && cursor > 0) previous();
  };
  const rate = remembered => {
    if (!current || ratingFeedback !== null) return;
    clearTimeout(quizTimer.current);
    setRatingFeedback(remembered ? 'correct' : 'retry');
    playQuizFeedbackSound(remembered,store.settings.sound);
    setStore(prev => updateRecord(prev, current.id, remembered));
    setSession(prev => ({ answered: prev.answered + 1, correct: prev.correct + (remembered ? 1 : 0) }));
    if (mode === 'review' && !remembered && queue.length < words.length * 3) setQueue(prev => [...prev, current]);
    quizTimer.current=setTimeout(next,remembered?1150:800);
  };
  const answer = option => {
    if (feedback !== null || !current) return;
    clearTimeout(quizTimer.current);
    setFeedback(option.id);
    setQuizCelebration(option.correct ? 'correct' : 'incorrect');
    playQuizFeedbackSound(option.correct, store.settings.sound);
    setStore(prev => updateRecord(prev, current.id, option.correct));
    setSession(prev => ({ answered: prev.answered + 1, correct: prev.correct + (option.correct ? 1 : 0) }));
    if (option.correct) {
      quizTimer.current = setTimeout(next, 1450);
    } else {
      // Never move past a wrong answer before the learner reads the translation.
      quizTimer.current = setTimeout(() => {
        setQuizCelebration(null);
        setQuizReviewOpen(true);
      }, 750);
    }
  };
  const speak = (item = current, sentence = false) => {
    if (!item || !store.settings.sound) return;
    stopAudio();
    const value = sentence ? item.english : item.word;
    const fallback = () => {
      if (!window.speechSynthesis) return;
      const speech = new SpeechSynthesisUtterance(value);
      speech.lang = 'en-US'; speech.rate = Number(store.settings.speed) || 0.85;
      window.speechSynthesis.speak(speech);
    };
    if (sentence && item.audio) {
      const player = new Audio(encodeURI(item.audio));
      audio.current = player; player.playbackRate = Number(store.settings.speed) || 0.85;
      player.play().catch(fallback);
    } else fallback();
  };
  const setSetting = (key, value) => setStore(prev => ({ ...prev, settings: { ...prev.settings, [key]: value } }));
  useEffect(() => {
    if (mode !== 'listening' || !current || !store.settings.sound) return;
    const timer = setTimeout(() => speak(current, true), 200);
    return () => clearTimeout(timer);
  }, [mode, cursor, current?.id, store.settings.sound, store.settings.speed]);

  useEffect(() => {
    if (!autoplay || !['study','sentence'].includes(mode) || !current) return;
    if (store.settings.sound) speak(current, true);
    const show = setTimeout(() => setRevealed(true), 1600);
    const advance = setTimeout(() => { setCursor(n => n + 1); setRevealed(false); }, 4900);
    return () => { clearTimeout(show); clearTimeout(advance); };
  }, [autoplay, mode, cursor, current?.id, store.settings.sound, store.settings.speed]);

  useEffect(() => {
    const handler = e => {
      if (quizReviewOpen) {
        if (e.key === 'Escape') { e.preventDefault(); next(); }
        return;
      }
      if (mode === 'reading' || ratingFeedback !== null) return;
      if ((mode === 'quiz' || mode === 'listening') && feedback !== null) return;
      if (advancedOpen || dashboardOpen || wordListOpen || e.altKey || e.ctrlKey || e.metaKey || /INPUT|SELECT|TEXTAREA/.test(e.target?.tagName || '')) return;
      if (e.key === 'ArrowRight' && current) { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); previous(); }
      if (e.code === 'Space' && current && (mode === 'study' || mode === 'sentence')) { e.preventDefault(); setRevealed(true); }
      if ((mode === 'study' || mode === 'sentence') && revealed && current && !autoplay && e.key === '1') rate(false);
      if ((mode === 'study' || mode === 'sentence') && revealed && current && !autoplay && e.key === '2') rate(true);
      if ((mode === 'quiz' || mode === 'listening') && feedback === null && /^[1-4]$/.test(e.key)) {
        const opt = (mode === 'listening' ? imageOptions : options)[Number(e.key) - 1]; if (opt) answer(opt);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const jumpTo = word => {
    setWordListOpen(false); setAutoplay(false); setMode('study'); setQueue(words);
    setCursor(words.findIndex(w => w.id === word.id)); resetCard(); setDashboardOpen(false);
  };

  return <div className={'vd-app'+(!dashboardOpen ? (mode === 'reading' ? ' is-reading-view' : ' is-focus-view') : '')}>
    <aside className="vd-sidebar">
      <Brand/>
      <button className={'vd-dashboard-nav' + (dashboardOpen ? ' is-active' : '')}
        onClick={() => { resetCard(); setAutoplay(false); setDashboardOpen(true); }}>
        <span aria-hidden="true">◉</span> ダッシュボード
      </button>
      <div className="vd-overline vd-library-label">YOUR LIBRARY</div>
      {['英検対策', '発展学習', '学校教材'].map(group => <nav key={group} aria-label={group} className="vd-nav-group">
        <h3>{group}</h3>
        {CATALOG.filter(c => c.group === group).map(c => <button key={c.id} className={'vd-nav-item ' + (course.id === c.id ? 'is-active' : '')} onClick={() => selectCourse(c.id)}>
          <span className="vd-nav-glyph">{c.id === 'eiken1_master' ? '✧' : c.id === 'reading' ? '▤' : c.id === 'regular' ? '▦' : 'A'}</span><span>{c.label}</span>{course.id === c.id && <span className="vd-nav-dot"/>}
        </button>)}
      </nav>)}
      <div className="vd-sidebar-bottom"><span>✦</span><strong>Small steps. Big words.</strong><p>毎日少しずつ、確かな語彙力へ。</p></div>
    </aside>
    <main className="vd-main">
      <header className="vd-topbar">
        <div className="vd-mobile-brand"><Brand/></div>
        <div className="vd-breadcrumb"><span>LEARNING SPACE</span><b>/</b><strong>{course.label}</strong></div>

      </header>
      <div className="vd-page">
        {dashboardOpen ? (
          <div className="vd-dashboard-page">
            <div className="vd-dashboard-title">
              <div><span className="vd-overline">YOUR LEARNING DASHBOARD</span><h1>学習ダッシュボード</h1><p>学ぶ級を選ぶと、すぐに学習を始められます。</p></div>
              <span className="vd-dashboard-today">今日の学習 <strong>{today}語</strong></span>
            </div>
            <div className="vd-dashboard-summary">
              <div className="vd-medallion-group">
                <ProgressMedallion value={masteryPercent} title="語彙の定着率" detail="MASTERED" variant="mastery"/>
                <ProgressMedallion value={readingPercent} title="音読の合格率" detail="READING" variant="reading"/>
              </div>
              <div className="vd-dashboard-summary-text">
                <span className="vd-overline">{course.label} / {unit.label}</span>
                <h2>このユニットの進捗</h2>
                <p>学習済み <strong>{stats.seen}</strong> / {stats.total}語　·　復習待ち <strong>{stats.due}</strong>語</p>
                <div className="vd-dashboard-metrics">
                  <span>音読合格 <strong>{readingPassed}/{stats.total}</strong></span>
                  <span>正答率 <strong>{stats.accuracy}%</strong></span>
                  <span>累計回答 <strong>{store.totalAnswers}</strong></span>
                  <span>1回の学習 <strong>{store.settings.questionCount === 'all' ? '全問' : (store.settings.questionCount ?? 10) + '問'}</strong></span>
                </div>
                <button className="vd-dashboard-primary" onClick={() => startMode('study')}>この教材で学習を始める <Icon name="arrow"/></button>
              </div>
            </div>
            <div className="vd-dashboard-course-heading"><h2>教材を選ぶ</h2><button onClick={() => setAdvancedOpen(true)}><Icon name="sliders" size={16}/> 学習設定</button></div>
            <div className="vd-dashboard-courses">
              {CATALOG.map(item => (
                <button key={item.id} onClick={() => selectCourse(item.id)}>
                  <span className="vd-dashboard-course-icon">{item.id === 'eiken1_master' ? '✧' : 'A'}</span>
                  <strong>{item.label}</strong><small>{item.units.length}ユニット</small><Icon name="arrow" size={18}/>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
        <div className="vd-mobile-course"><label htmlFor="vd-course">教材</label><select id="vd-course" value={course.id} onChange={e => selectCourse(e.target.value)}>{CATALOG.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
        <div className="vd-toolbar"><div className="vd-unit"><label htmlFor="vd-unit">学習ユニット</label><select id="vd-unit" value={unit.id} onChange={e => selectUnit(e.target.value)}>{course.units.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}</select></div>
          <div className="vd-tabs" aria-label="学習モード">{modes.filter(m => !m.masterOnly || course.id === 'eiken1_master').map(m => <button key={m.id} aria-pressed={mode === m.id} className={mode === m.id ? 'selected' : ''} onClick={() => startMode(m.id)}><span>{m.icon}</span>{m.label}</button>)}</div></div>
        <div className="vd-columns"><section className="vd-study-panel" onTouchStart={handleSwipeStart} onTouchEnd={handleSwipeEnd}>
          <div className="vd-panel-head">
            <span><i/> {mode === 'study' ? 'WORD STUDY' : mode === 'sentence' ? 'SENTENCE STUDY' : mode === 'reading' ? '音読 · 80%以上で合格' : mode === 'quiz' ? 'CHECK YOUR KNOWLEDGE' : mode === 'listening' ? 'LISTEN & MATCH' : 'SPACED REVIEW'}</span>
            <div className="vd-panel-head-actions">
              {mode === 'reading' && <strong className="vd-reading-session-count">{queue.length ? Math.min(cursor+1,queue.length) : 0}<span> / {queue.length}</span></strong>}
              <button className="vd-reading-settings-button" aria-label="学習の詳細設定を開く" onClick={() => setAdvancedOpen(true)}><Icon name="sliders" size={17}/></button>
              <button className="vd-list-button" onClick={() => {setWordListOpen(true);setWordQuery('');}}><Icon name="list" size={17}/> 単語一覧</button>
            </div>
          </div>
          <div className="vd-progress"><span style={{ width: progress + '%' }}/></div>
          <div className="vd-panel-counter"><small>{mode === 'study' ? 'WORD CARD' : mode === 'sentence' ? 'SENTENCE CARD' : mode === 'reading' ? 'READ ALOUD' : mode === 'quiz' ? '4 CHOICE QUIZ' : mode === 'listening' ? 'IMAGE LISTENING' : 'REVIEW CARD'}</small><strong>{queue.length ? Math.min(cursor + 1, queue.length) : 0}<span> / {queue.length}</span></strong></div>
          {loading ? <div className="vd-empty"><div className="vd-spinner"/><h2>教材を準備しています</h2></div> :
            error ? <div className="vd-empty"><h2>読み込めませんでした</h2><p>{error}</p><button className="vd-primary" onClick={retry}>再試行</button></div> :
            mode === 'review' && !queue.length ? <div className="vd-empty"><div className="vd-confetti">✦</div><h2>今の復習は完了です！</h2><p>復習時期の単語はありません。新しい語彙に進みましょう。</p><button className="vd-primary" onClick={() => startMode('study')}>単語を覚える <Icon name="arrow"/></button></div> :
            !queue.length ? <div className="vd-empty"><h2>このユニットには問題がありません</h2><p>ほかのユニットを選択してください。</p></div> :
            isFinished ? <div className="vd-empty vd-finished"><div className="vd-done"><Icon name="check" size={38}/></div><div className="vd-overline">SESSION COMPLETE</div><h2>おつかれさまでした！</h2><p>{queue.length}枚のカードを確認しました。{mode === 'reading' ? '音読合格 ' + session.correct + '語（80%以上）' : session.answered ? '回答 ' + session.answered + '語 · 正解／覚えた ' + session.correct + '語' : '自動再生やスキップは習得判定されません。'}</p><div className="vd-finished-actions"><button className="vd-secondary" onClick={() => startMode('study')}>もう一度</button><button className="vd-primary" onClick={() => startMode('review')}>復習する <Icon name="arrow"/></button></div></div> :
            mode === 'reading' ? (
              <ReadingPractice
                key={current.id}
                item={current}
                record={store.records[current.id] || {}}
                soundEnabled={store.settings.sound}
                onModelAudio={(item) => speak(item,true)}
                onBeforeRecording={stopAudio}
                onResult={onReadingResult}
                onNext={next}
              />
            ) :
            (mode === 'quiz' || mode === 'listening') ? (
              <div className="vd-quiz-body">
                {mode === 'listening' ? (
                  <div className="vd-listening-intro">
                    <span>モデル音声を聞いて、合う画像を選びましょう</span>
                    <button className="vd-listening-replay" onClick={() => speak(current, true)} disabled={!store.settings.sound}>
                      <Icon name="speaker" size={23}/> もう一度聞く
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="vd-quiz-instruction">空欄に入る英単語を選んでください</div>
                    <QuizSentence text={current.prompt.includes('________') ? current.prompt.replace('________', '＿＿＿＿') : current.english.replace(current.word, '＿＿＿＿')}/>
                  </>
                )}
                <div className={mode === 'listening' ? 'vd-listening-grid' : 'vd-choice-grid'}>
                  {(mode === 'listening' ? imageOptions : options).map((opt, i) => (
                    <button
                      disabled={feedback !== null}
                      key={opt.id}
                      onClick={() => answer(opt)}
                      className={(mode === 'listening' ? 'vd-image-choice ' : 'vd-choice ') + (feedback !== null && opt.correct ? 'is-correct' : '') + (feedback === opt.id && !opt.correct ? 'is-wrong' : '')}
                    >
                      {mode === 'listening' ? (
                        <><span className="vd-image-letter">{String.fromCharCode(65 + i)}</span><img src={opt.image} alt={'選択肢 ' + String.fromCharCode(65 + i)}/></>
                      ) : (
                        <><span>{i + 1}</span><strong>{opt.text}</strong></>
                      )}
                      {feedback !== null && opt.correct && <Icon name="check"/>}
                    </button>
                  ))}
                </div>
                {quizCelebration && (
                  <div className={'vd-quiz-burst vd-quiz-burst-' + quizCelebration} role="status" aria-live="polite">
                    <div className="vd-quiz-burst-content">
                      <div className="vd-quiz-result-symbol" aria-hidden="true">
                        {quizCelebration === 'correct' ? '✓' : '×'}
                      </div>
                      <strong>{quizCelebration === 'correct' ? '正解！' : 'もう一度確認しよう'}</strong>
                    </div>
                  </div>
                )}
                <div className="vd-quiz-next">
                  <button disabled={feedback !== null} onClick={next}>スキップ <Icon name="arrow" size={16}/></button>
                </div>
              </div>
            ) :
            <div className="vd-card-area">
              <div className="vd-word-card">
                {mode === 'sentence' ? (
                  <div className="vd-sentence-study">
                    <div className="vd-word-eyebrow"><span>LEARN IN CONTEXT</span><span className="vd-course-badge">{course.short}</span></div>
                    {current.image && !imageError && <img className="vd-sentence-picture" src={assetImage(current.image)} alt={current.word + ' の参考画像'} onError={() => setImageError(true)}/>}
                    <div className="vd-sentence-content">
                      <QuizSentence text={current.english}/>
                      <div className="vd-sentence-tools">
                        <button className="vd-sentence-audio" disabled={!store.settings.sound} onClick={() => speak(current, true)}><Icon name="speaker" size={19}/> 例文を聞く</button>
                        <button className="vd-sentence-read-link" onClick={openReadingFromSentence}><Icon name="arrow" size={16}/> この例文を音読する</button>
                      </div>
                    </div>
                    {revealed && (
                      <div className="vd-sentence-meaning">
                        <strong>{current.word}{current.meaning ? ' — ' + current.meaning : ''}</strong>
                        <p>{current.japanese}</p>
                        {current.explanation && <small>{current.explanation}</small>}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                <div className="vd-word-eyebrow"><span>TODAY’S VOCABULARY</span><span className="vd-course-badge">{course.short}</span></div>
                <div className="vd-word-heading"><h2>{current.word}</h2><button className="vd-sound" disabled={!store.settings.sound} aria-label="単語の発音を聞く" onClick={() => speak(current)}><Icon name="speaker" size={26}/></button></div>
                {current.pronunciation && <p className="vd-phonetic">{current.pronunciation}</p>}
                {revealed ? <div className="vd-word-detail"><div className="vd-meaning-caption">MEANING</div><h3>{current.meaning || current.japanese}</h3>
                  {current.image && !imageError && <img className="vd-word-image" src={assetImage(current.image)} alt={current.word + ' の参考画像'} onError={() => setImageError(true)}/>}
                  <div className="vd-example"><div><span>EXAMPLE SENTENCE</span><button disabled={!store.settings.sound} aria-label="例文を再生" onClick={() => speak(current, true)}><Icon name="speaker" size={17}/></button></div><p>{current.english}</p><small>{current.japanese}</small></div>
                  {current.etymology && <p className="vd-etymology"><strong>語源・ヒント</strong> {current.etymology}</p>}
                </div> : <div className="vd-card-unrevealed" onClick={() => setRevealed(true)}><span>✧</span><p>意味を思い浮かべてから確認しましょう</p></div>}
                  </>
                )}
              </div>
              {ratingFeedback && (
                <div className={'vd-rating-celebration'+(ratingFeedback === 'retry'?' is-retry':'')} role="status" aria-live="polite">
                  <div className="vd-rating-symbol" aria-hidden="true">{ratingFeedback === 'correct'?'✓':'↻'}</div>
                  <strong>{ratingFeedback === 'correct'?'CORRECT!':'もう一度！'}</strong>
                </div>
              )}
              <div className="vd-actions">{autoplay ? <div className="vd-autoplay-running"><span>● 連続再生中 · 習得判定なし</span><button onClick={() => setAutoplay(false)}>停止</button></div> : !revealed ?
                <button className="vd-reveal" onClick={() => setRevealed(true)}><Icon name="cards" size={21}/> 意味を見る <kbd>SPACE</kbd></button> :
                <div className="vd-ratings"><button className="vd-again" disabled={ratingFeedback !== null} onClick={() => rate(false)}><Icon name="repeat"/> もう一度 <kbd>1</kbd></button><button className="vd-remember" disabled={ratingFeedback !== null} onClick={() => rate(true)}><Icon name="check"/> 覚えた！ <kbd>2</kbd></button></div>}
                <div className="vd-card-navigation"><button disabled={cursor === 0} onClick={previous}><Icon name="back" size={17}/> 前へ</button><span>{autoplay ? '自動再生では記録しません' : '自分のペースで、確実に。'}</span><button onClick={next}>スキップ <Icon name="arrow" size={17}/></button></div>
              </div>
            </div>
          }
        </section>
        <aside className="vd-stats">
          <div className="vd-info-card"><div className="vd-info-head"><div><span className="vd-overline">YOUR PROGRESS</span><h3>学習の進み具合</h3></div><span className="vd-info-icon">✦</span></div><div className="vd-mastered"><strong>{stats.known}</strong><span>/ {stats.total} 語</span></div><small>2回以上の成功で定着扱い</small><div className="vd-mini-progress"><span style={{ width: (stats.total ? stats.known * 100 / stats.total : 0) + '%' }}/></div><div className="vd-stat-row"><div><strong>{stats.seen}</strong><small>学習済み</small></div><div><strong>{stats.due}</strong><small>復習待ち</small></div><div><strong>{stats.accuracy}%</strong><small>回答正答率</small></div></div></div>
          <div className="vd-reading-side-progress">
              <div><strong>音読ミッション</strong><span>{readingPassed} / {stats.total}語 合格</span></div>
              <div className="vd-reading-side-track"><span style={{width:readingPercent+'%'}}/></div>
              <button onClick={() => startMode('reading')}>例文を音読する <Icon name="arrow" size={16}/></button>
            </div>
          <div className="vd-info-card vd-tool-card"><div className="vd-info-head"><div><span className="vd-overline">STUDY TOOLS</span><h3>自分好みに学習</h3></div><button className="vd-settings-expand" aria-label="詳細設定を開く" onClick={() => setAdvancedOpen(true)}><Icon name="sliders" size={20}/></button></div>
            <button className="vd-settings-summary" onClick={() => setAdvancedOpen(true)}>出題数 <strong>{store.settings.questionCount === 'all' ? '全問' : (store.settings.questionCount ?? 10) + '問'}</strong> · 出題順 <strong>{store.settings.randomOrder ? 'ランダム' : '順番どおり'}</strong> <Icon name="arrow" size={15}/></button>
            <label className="vd-setting"><span><strong>発音・モデル音声</strong><small>既存音声を優先</small></span><input type="checkbox" checked={store.settings.sound} onChange={e => setSetting('sound', e.target.checked)}/></label>
            <div className="vd-setting"><span><strong>再生速度</strong><small>ゆっくり音声にも対応</small></span><select aria-label="再生速度" value={store.settings.speed} onChange={e => setSetting('speed', Number(e.target.value))}><option value="0.65">0.65×</option><option value="0.85">0.85×</option><option value="1">1.0×</option><option value="1.2">1.2×</option></select></div>
            <label className="vd-setting"><span><strong>連続再生モード</strong><small>自動で意味を表示・次へ</small></span><input type="checkbox" disabled={(mode !== 'study' && mode !== 'sentence') || !current} checked={autoplay} onChange={e => {setAutoplay(e.target.checked); if(e.target.checked) setRevealed(false);}}/></label>
            <p className="vd-setting-note">連続再生では覚えた扱いにしません。記憶の確認には4択テストをご利用ください。</p>
          </div>
          <button className="vd-review-link" onClick={() => startMode('review')}><span className="vd-review-icon"><Icon name="repeat" size={24}/></span><span><strong>苦手な単語を復習</strong><small>{stats.due}語が復習のタイミング</small></span><Icon name="arrow" size={18}/></button>
        </aside></div>
        <div className="vd-under-card"><span>✦ すばやく、何度でも。間違えた単語は復習に残ります。</span><small>← → カード移動 · SPACE 意味を表示</small></div>
          </>
        )}
        <footer className="vd-footer">VocaDash · Built for focused learning <span>学習データはこのブラウザ内に保存されます。端末間同期はありません。</span></footer>
      </div>
    </main>
    {quizReviewOpen && (mode === 'quiz' || mode === 'listening') && current && (
      <div className="vd-quiz-review-backdrop">
        <section className="vd-quiz-review-dialog" role="dialog" aria-modal="true" aria-labelledby="vd-quiz-review-title" aria-describedby="vd-quiz-review-description">
          <header className="vd-quiz-review-header">
            <span className="vd-quiz-review-symbol" aria-hidden="true">×</span>
            <div>
              <div className="vd-quiz-review-eyebrow">LEARN FROM YOUR ANSWER</div>
              <h2 id="vd-quiz-review-title">日本語訳を確認しよう</h2>
              <p id="vd-quiz-review-description">正しい英文と訳を読んで、次の問題に進みましょう。</p>
            </div>
          </header>
          <div className="vd-quiz-review-scroll">
            <div className="vd-quiz-review-word">
              <span>正解の単語</span>
              <strong>{current.word}</strong>
              {current.meaning && <p>{current.meaning}</p>}
            </div>
            <div className="vd-quiz-review-section">
              <span>COMPLETE SENTENCE</span>
              <div className="vd-quiz-review-english"><QuizSentence text={current.english}/></div>
            </div>
            <div className="vd-quiz-review-section vd-quiz-review-translation">
              <span>日本語訳</span>
              <p>{current.japanese || 'この例文の日本語訳はまだ登録されていません。'}</p>
            </div>
            {current.explanation && (
              <div className="vd-quiz-review-section vd-quiz-review-hint">
                <span>解き方のヒント</span>
                <p>{current.explanation}</p>
              </div>
            )}
            {!current.explanation && current.etymology && (
              <div className="vd-quiz-review-section vd-quiz-review-hint">
                <span>語源・使い方のヒント</span>
                <p>{current.etymology}</p>
              </div>
            )}
          </div>
          <footer className="vd-quiz-review-footer">
            <button autoFocus onClick={next}>訳を確認した・次の問題へ <Icon name="arrow" size={18}/></button>
          </footer>
        </section>
      </div>
    )}
    {advancedOpen && (
      <div className="vd-modal-overlay" onClick={() => setAdvancedOpen(false)}>
        <section className="vd-settings-modal" role="dialog" aria-modal="true" aria-labelledby="vd-settings-title" onClick={e => e.stopPropagation()}>
          <div className="vd-settings-modal-head">
            <div><div className="vd-overline">PERSONALIZE YOUR SESSION</div><h2 id="vd-settings-title">学習の詳細設定</h2></div>
            <button aria-label="設定を閉じる" onClick={() => setAdvancedOpen(false)}><Icon name="close"/></button>
          </div>
          <div className="vd-settings-modal-body">
            <div className="vd-settings-audio-row">
              <label>再生速度
                <select aria-label="モデル音声の速度" value={store.settings.speed} onChange={e => setSetting('speed',Number(e.target.value))}>
                  <option value="0.65">0.65×</option><option value="0.85">0.85×</option><option value="1">1.0×</option><option value="1.2">1.2×</option>
                </select>
              </label>
              <label>お手本・効果音
                <input type="checkbox" checked={store.settings.sound} onChange={e => setSetting('sound',e.target.checked)}/>
              </label>
            </div>
            <h3>1回に出題する問題数</h3>
            <p>英検1級マスターの100問も、少しずつ進められます。</p>
            <div className="vd-count-options">
              {[5,10,20,25,50,100,'all'].map(count => (
                <button key={count} aria-pressed={String(store.settings.questionCount ?? 10) === String(count)}
                  className={String(store.settings.questionCount ?? 10) === String(count) ? 'selected' : ''}
                  onClick={() => setSetting('questionCount',count)}>
                  {count === 'all' ? '全問' : count + '問'}
                </button>
              ))}
            </div>
            <label className="vd-random-setting">
              <span><strong>問題の順番をランダムにする</strong><small>確認テストとリスニングは毎回シャッフルされます</small></span>
              <input type="checkbox" checked={Boolean(store.settings.randomOrder)} onChange={e=>setSetting('randomOrder',e.target.checked)}/>
            </label>
            <p className="vd-settings-hint">設定はこの端末に保存されます。変更後に開始すると、新しい問題数が適用されます。</p>
          </div>
          <div className="vd-settings-modal-foot"><button onClick={() => {
              setAdvancedOpen(false);
              if (dashboardOpen) startMode('study');
              else if (mode !== 'reading') startMode(mode);
            }}>{mode === 'reading' && !dashboardOpen ? '設定を適用して戻る' : 'この設定で学習を開始'} <Icon name="arrow"/></button></div>
        </section>
      </div>
    )}
    {savedError && <div role="alert" className="vd-save-warning">学習記録を保存できません。ブラウザの設定をご確認ください。<button onClick={() => setSavedError(false)}>閉じる</button></div>}
    {wordListOpen && <div className="vd-modal-overlay" onClick={() => setWordListOpen(false)}><div className="vd-modal" role="dialog" aria-modal="true" aria-label="単語一覧" onClick={e => e.stopPropagation()}><div className="vd-modal-header"><div><div className="vd-overline">{course.label} / {unit.label}</div><h2>単語一覧 <small>{words.length}語</small></h2></div><button onClick={() => setWordListOpen(false)} aria-label="閉じる"><Icon name="close"/></button></div><input className="vd-search" autoFocus placeholder="英単語・日本語から探す" value={wordQuery} onChange={e => setWordQuery(e.target.value)}/><div className="vd-word-list">{filtered.map((w, i) => <button key={w.id} onClick={() => jumpTo(w)}><span className="vd-word-index">{i + 1}</span><span className="vd-word-list-label"><strong>{w.word}</strong><small>{w.meaning || '例文で確認'}</small></span><span className={'vd-learning-dot ' + ((store.records[w.id]?.level || 0) >= 2 ? 'known' : isDue(store.records[w.id]) ? 'due' : '')}/><Icon name="arrow" size={16}/></button>)}{filtered.length === 0 && <p className="vd-no-results">一致する単語がありません。</p>}</div></div></div>}
  </div>;
}
