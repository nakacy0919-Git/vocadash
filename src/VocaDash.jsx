import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CATALOG, firstUnit, sourcePath, normalizeWords, assetImage, safeLoad, safeSave, updateRecord, isDue, summaryFor, shuffled, splitDialogueTurns } from './lib/learning';
import './VocaDash.css';

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

const modes = [{ id: 'study', label: '覚える', icon: '▣' }, { id: 'quiz', label: '確認テスト', icon: '✦' }, { id: 'review', label: '復習', icon: '↻' }];
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
  const [queue, setQueue] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [quizCelebration, setQuizCelebration] = useState(null);
  const [quizReviewOpen, setQuizReviewOpen] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [wordListOpen, setWordListOpen] = useState(false);
  const [wordQuery, setWordQuery] = useState('');
  const [imageError, setImageError] = useState(false);
  const [savedError, setSavedError] = useState(false);
  const [session, setSession] = useState({ answered: 0, correct: 0 });
  const audio = useRef(null), quizTimer = useRef(null);

  const course = CATALOG.find(c => c.id === selection.courseId) || CATALOG[1];
  const unit = course.units.find(u => u.id === selection.unitId) || course.units[0];
  const current = queue[cursor];
  const isFinished = !loading && queue.length > 0 && cursor >= queue.length;
  const stats = useMemo(() => summaryFor(words, store.records), [words, store.records]);
  const today = useMemo(() => Object.values(store.records).filter(r => r?.lastSeenAt && new Date(r.lastSeenAt).toDateString() === new Date().toDateString()).length, [store.records]);
  const progress = queue.length ? Math.min(100, cursor / queue.length * 100) : 0;
  const filtered = useMemo(() => words.filter(w => (w.word + ' ' + w.meaning).toLowerCase().includes(wordQuery.toLowerCase())), [words, wordQuery]);
  const options = useMemo(() => current ? shuffled(current.choices.map((text, i) => ({ id: i, text, correct: i === current.correctIndex }))) : [], [current]);

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
    setQuizReviewOpen(false);
    setImageError(false);
  };
  useEffect(() => {
    setQueue(words); setCursor(0); setMode('study'); setRevealed(false);
    setFeedback(null); setQuizCelebration(null); setQuizReviewOpen(false);
    setAutoplay(false); setSession({ answered: 0, correct: 0 });
  }, [words]);

  const selectCourse = id => {
    resetCard(); setAutoplay(false);
    const next = { courseId: id, unitId: firstUnit(id) };
    setSelection(next); setStore(prev => ({ ...prev, lastSelection: next }));
  };
  const selectUnit = id => {
    resetCard(); setAutoplay(false);
    const next = { courseId: course.id, unitId: id };
    setSelection(next); setStore(prev => ({ ...prev, lastSelection: next }));
  };
  const startMode = name => {
    resetCard(); setAutoplay(false); setMode(name); setCursor(0);
    setSession({ answered: 0, correct: 0 });
    setQueue(name === 'review' ? shuffled(words.filter(w => isDue(store.records[w.id]))) : name === 'quiz' ? shuffled(words) : words);
  };
  const next = () => { resetCard(); setCursor(n => n + 1); };
  const previous = () => { resetCard(); setCursor(n => Math.max(0, n - 1)); };
  const rate = remembered => {
    if (!current) return;
    setStore(prev => updateRecord(prev, current.id, remembered));
    setSession(prev => ({ answered: prev.answered + 1, correct: prev.correct + (remembered ? 1 : 0) }));
    if (mode === 'review' && !remembered && queue.length < words.length * 3) setQueue(prev => [...prev, current]);
    next();
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
    if (!autoplay || mode !== 'study' || !current) return;
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
      if (mode === 'quiz' && feedback !== null) return;
      if (wordListOpen || e.altKey || e.ctrlKey || e.metaKey || /INPUT|SELECT|TEXTAREA/.test(e.target?.tagName || '')) return;
      if (e.key === 'ArrowRight' && current) { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); previous(); }
      if (e.code === 'Space' && current && mode === 'study') { e.preventDefault(); setRevealed(true); }
      if (mode === 'study' && revealed && current && !autoplay && e.key === '1') rate(false);
      if (mode === 'study' && revealed && current && !autoplay && e.key === '2') rate(true);
      if (mode === 'quiz' && feedback === null && /^[1-4]$/.test(e.key)) {
        const opt = options[Number(e.key) - 1]; if (opt) answer(opt);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const jumpTo = word => {
    setWordListOpen(false); setAutoplay(false); setMode('study'); setQueue(words);
    setCursor(words.findIndex(w => w.id === word.id)); resetCard();
  };

  return <div className="vd-app">
    <aside className="vd-sidebar">
      <Brand/>
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
        <div className="vd-top-right"><span>✦ 今日の学習 <strong>{today}語</strong></span><small>● 端末内に保存</small></div>
      </header>
      <div className="vd-page">
        <div className="vd-hero"><div><div className="vd-overline">MAKE EVERY WORD COUNT</div><h1>単語学習を、もっと自由に。</h1><p>覚える、確かめる、忘れたらもう一度。無理なく続くボキャブラリー学習。</p></div><div className="vd-hero-graphic">A<span>+</span></div></div>
        <div className="vd-mobile-course"><label htmlFor="vd-course">教材</label><select id="vd-course" value={course.id} onChange={e => selectCourse(e.target.value)}>{CATALOG.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
        <div className="vd-toolbar"><div className="vd-unit"><label htmlFor="vd-unit">学習ユニット</label><select id="vd-unit" value={unit.id} onChange={e => selectUnit(e.target.value)}>{course.units.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}</select></div>
          <div className="vd-tabs" aria-label="学習モード">{modes.map(m => <button key={m.id} aria-pressed={mode === m.id} className={mode === m.id ? 'selected' : ''} onClick={() => startMode(m.id)}><span>{m.icon}</span>{m.label}</button>)}</div></div>
        <div className="vd-columns"><section className="vd-study-panel">
          <div className="vd-panel-head"><span><i/> {mode === 'study' ? 'LEARN & REMEMBER' : mode === 'quiz' ? 'CHECK YOUR KNOWLEDGE' : 'SPACED REVIEW'}</span><button className="vd-list-button" onClick={() => {setWordListOpen(true);setWordQuery('');}}><Icon name="list" size={17}/> 単語一覧</button></div>
          <div className="vd-progress"><span style={{ width: progress + '%' }}/></div>
          <div className="vd-panel-counter"><small>{mode === 'study' ? 'WORD CARD' : mode === 'quiz' ? '4 CHOICE QUIZ' : 'REVIEW CARD'}</small><strong>{queue.length ? Math.min(cursor + 1, queue.length) : 0}<span> / {queue.length}</span></strong></div>
          {loading ? <div className="vd-empty"><div className="vd-spinner"/><h2>教材を準備しています</h2></div> :
            error ? <div className="vd-empty"><h2>読み込めませんでした</h2><p>{error}</p><button className="vd-primary" onClick={retry}>再試行</button></div> :
            mode === 'review' && !queue.length ? <div className="vd-empty"><div className="vd-confetti">✦</div><h2>今の復習は完了です！</h2><p>復習時期の単語はありません。新しい語彙に進みましょう。</p><button className="vd-primary" onClick={() => startMode('study')}>単語を覚える <Icon name="arrow"/></button></div> :
            !queue.length ? <div className="vd-empty"><h2>このユニットには問題がありません</h2><p>ほかのユニットを選択してください。</p></div> :
            isFinished ? <div className="vd-empty vd-finished"><div className="vd-done"><Icon name="check" size={38}/></div><div className="vd-overline">SESSION COMPLETE</div><h2>おつかれさまでした！</h2><p>{queue.length}枚のカードを確認しました。{session.answered ? '回答 ' + session.answered + '語 · 正解／覚えた ' + session.correct + '語' : '自動再生やスキップは習得判定されません。'}</p><div className="vd-finished-actions"><button className="vd-secondary" onClick={() => startMode('study')}>もう一度</button><button className="vd-primary" onClick={() => startMode('review')}>復習する <Icon name="arrow"/></button></div></div> :
            mode === 'quiz' ? (
              <div className="vd-quiz-body">
                <div className="vd-quiz-instruction">空欄に入る英単語を選んでください</div>
                <QuizSentence text={current.prompt.includes('________') ? current.prompt.replace('________', '＿＿＿＿') : current.english.replace(current.word, '＿＿＿＿')}/>
                <div className="vd-choice-grid">
                  {options.map((opt, i) => (
                    <button
                      disabled={feedback !== null}
                      key={opt.id}
                      onClick={() => answer(opt)}
                      className={'vd-choice ' + (feedback !== null && opt.correct ? 'is-correct' : '') + (feedback === opt.id && !opt.correct ? 'is-wrong' : '')}
                    >
                      <span>{i + 1}</span><strong>{opt.text}</strong>
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
              <div className="vd-word-card"><div className="vd-word-eyebrow"><span>TODAY’S VOCABULARY</span><span className="vd-course-badge">{course.short}</span></div>
                <div className="vd-word-heading"><h2>{current.word}</h2><button className="vd-sound" disabled={!store.settings.sound} aria-label="単語の発音を聞く" onClick={() => speak(current)}><Icon name="speaker" size={26}/></button></div>
                {current.pronunciation && <p className="vd-phonetic">{current.pronunciation}</p>}
                {revealed ? <div className="vd-word-detail"><div className="vd-meaning-caption">MEANING</div><h3>{current.meaning || current.japanese}</h3>
                  {current.image && !imageError && <img className="vd-word-image" src={assetImage(current.image)} alt={current.word + ' の参考画像'} onError={() => setImageError(true)}/>}
                  <div className="vd-example"><div><span>EXAMPLE SENTENCE</span><button disabled={!store.settings.sound} aria-label="例文を再生" onClick={() => speak(current, true)}><Icon name="speaker" size={17}/></button></div><p>{current.english}</p><small>{current.japanese}</small></div>
                  {current.etymology && <p className="vd-etymology"><strong>語源・ヒント</strong> {current.etymology}</p>}
                </div> : <div className="vd-card-unrevealed" onClick={() => setRevealed(true)}><span>✧</span><p>意味を思い浮かべてから確認しましょう</p></div>}
              </div>
              <div className="vd-actions">{autoplay ? <div className="vd-autoplay-running"><span>● 連続再生中 · 習得判定なし</span><button onClick={() => setAutoplay(false)}>停止</button></div> : !revealed ?
                <button className="vd-reveal" onClick={() => setRevealed(true)}><Icon name="cards" size={21}/> 意味を見る <kbd>SPACE</kbd></button> :
                <div className="vd-ratings"><button className="vd-again" onClick={() => rate(false)}><Icon name="repeat"/> もう一度 <kbd>1</kbd></button><button className="vd-remember" onClick={() => rate(true)}><Icon name="check"/> 覚えた！ <kbd>2</kbd></button></div>}
                <div className="vd-card-navigation"><button disabled={cursor === 0} onClick={previous}><Icon name="back" size={17}/> 前へ</button><span>{autoplay ? '自動再生では記録しません' : '自分のペースで、確実に。'}</span><button onClick={next}>スキップ <Icon name="arrow" size={17}/></button></div>
              </div>
            </div>
          }
        </section>
        <aside className="vd-stats">
          <div className="vd-info-card"><div className="vd-info-head"><div><span className="vd-overline">YOUR PROGRESS</span><h3>学習の進み具合</h3></div><span className="vd-info-icon">✦</span></div><div className="vd-mastered"><strong>{stats.known}</strong><span>/ {stats.total} 語</span></div><small>2回以上の成功で定着扱い</small><div className="vd-mini-progress"><span style={{ width: (stats.total ? stats.known * 100 / stats.total : 0) + '%' }}/></div><div className="vd-stat-row"><div><strong>{stats.seen}</strong><small>学習済み</small></div><div><strong>{stats.due}</strong><small>復習待ち</small></div><div><strong>{stats.accuracy}%</strong><small>回答正答率</small></div></div></div>
          <div className="vd-info-card vd-tool-card"><div className="vd-info-head"><div><span className="vd-overline">STUDY TOOLS</span><h3>自分好みに学習</h3></div><Icon name="sliders" size={19}/></div>
            <label className="vd-setting"><span><strong>発音・モデル音声</strong><small>既存音声を優先</small></span><input type="checkbox" checked={store.settings.sound} onChange={e => setSetting('sound', e.target.checked)}/></label>
            <div className="vd-setting"><span><strong>再生速度</strong><small>ゆっくり音声にも対応</small></span><select aria-label="再生速度" value={store.settings.speed} onChange={e => setSetting('speed', Number(e.target.value))}><option value="0.65">0.65×</option><option value="0.85">0.85×</option><option value="1">1.0×</option><option value="1.2">1.2×</option></select></div>
            <label className="vd-setting"><span><strong>連続再生モード</strong><small>自動で意味を表示・次へ</small></span><input type="checkbox" disabled={mode !== 'study' || !current} checked={autoplay} onChange={e => {setAutoplay(e.target.checked); if(e.target.checked) setRevealed(false);}}/></label>
            <p className="vd-setting-note">連続再生では覚えた扱いにしません。記憶の確認には4択テストをご利用ください。</p>
          </div>
          <button className="vd-review-link" onClick={() => startMode('review')}><span className="vd-review-icon"><Icon name="repeat" size={24}/></span><span><strong>苦手な単語を復習</strong><small>{stats.due}語が復習のタイミング</small></span><Icon name="arrow" size={18}/></button>
        </aside></div>
        <div className="vd-under-card"><span>✦ すばやく、何度でも。間違えた単語は復習に残ります。</span><small>← → カード移動 · SPACE 意味を表示</small></div>
        <footer className="vd-footer">VocaDash · Built for focused learning <span>学習データはこのブラウザ内に保存されます。端末間同期はありません。</span></footer>
      </div>
    </main>
    {quizReviewOpen && mode === 'quiz' && current && (
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
    {savedError && <div role="alert" className="vd-save-warning">学習記録を保存できません。ブラウザの設定をご確認ください。<button onClick={() => setSavedError(false)}>閉じる</button></div>}
    {wordListOpen && <div className="vd-modal-overlay" onClick={() => setWordListOpen(false)}><div className="vd-modal" role="dialog" aria-modal="true" aria-label="単語一覧" onClick={e => e.stopPropagation()}><div className="vd-modal-header"><div><div className="vd-overline">{course.label} / {unit.label}</div><h2>単語一覧 <small>{words.length}語</small></h2></div><button onClick={() => setWordListOpen(false)} aria-label="閉じる"><Icon name="close"/></button></div><input className="vd-search" autoFocus placeholder="英単語・日本語から探す" value={wordQuery} onChange={e => setWordQuery(e.target.value)}/><div className="vd-word-list">{filtered.map((w, i) => <button key={w.id} onClick={() => jumpTo(w)}><span className="vd-word-index">{i + 1}</span><span className="vd-word-list-label"><strong>{w.word}</strong><small>{w.meaning || '例文で確認'}</small></span><span className={'vd-learning-dot ' + ((store.records[w.id]?.level || 0) >= 2 ? 'known' : isDue(store.records[w.id]) ? 'due' : '')}/><Icon name="arrow" size={16}/></button>)}{filtered.length === 0 && <p className="vd-no-results">一致する単語がありません。</p>}</div></div></div>}
  </div>;
}
