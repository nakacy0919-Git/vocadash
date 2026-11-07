import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { READING_LEVELS, READING_PASS_PERCENT, maskReadingSentence, scoreReading } from '../lib/reading';
import { assetImage, splitDialogueTurns } from '../lib/learning';
import './ReadingPractice.css';

let successAudioContext;
function primeReadingAudio(enabled) {
  if (!enabled || typeof window === 'undefined') return;
  const Context=window.AudioContext || window.webkitAudioContext;
  if (!Context) return;
  try {
    if (!successAudioContext) successAudioContext=new Context();
    if (successAudioContext.state === 'suspended') successAudioContext.resume().catch(()=>{});
  } catch { /* Browser may block sound; visual pass feedback still works. */ }
}
function playReadingSuccessSound(enabled, percent) {
  if (!enabled || typeof window === 'undefined') return;
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return;
  try {
    if (!successAudioContext) successAudioContext = new Context();
    if (successAudioContext.state === 'suspended') successAudioContext.resume().catch(() => {});
    const start = successAudioContext.currentTime;
    const notes = percent === 100 ? [523.25,659.25,783.99,1046.5] :
      percent >= 90 ? [493.88,622.25,739.99] : [440,554.37,659.25];
    notes.forEach((frequency,index)=>{
      const osc = successAudioContext.createOscillator();
      const vol = successAudioContext.createGain();
      const t = start + .115*index;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency,t);
      vol.gain.setValueAtTime(.0001,t);
      vol.gain.exponentialRampToValueAtTime(.07,t+.028);
      vol.gain.exponentialRampToValueAtTime(.0001,t+.32);
      osc.connect(vol);
      vol.connect(successAudioContext.destination);
      osc.start(t);
      osc.stop(t+.34);
    });
  } catch {
    // Sound is optional. Keep visible feedback available if blocked.
  }
}

export default function ReadingPractice({
  item, record = {}, soundEnabled, speed, onModelAudio, onBeforeRecording, onResult, onNext
}) {
  const [level,setLevel] = useState(1);
  const [phase,setPhase] = useState('idle');
  const [transcript,setTranscript] = useState('');
  const [score,setScore] = useState(null);
  const [status,setStatus] = useState('お手本を聞いてから、全文を音読しましょう。');
  const [celebrate,setCelebrate] = useState(false);
  const [wpm,setWpm] = useState(0);
  const mic = useRef(null);
  const token = useRef(0);
  const session = useRef(null);
  const celebrationTimer = useRef(null);

  const cleared = Math.max(0, Number(record.readingClearedLevel) || 0);
  const best = (record.readingBestByLevel || [])[level-1] || 0;
  const spokenDisplay = useMemo(() => {
    const turns=splitDialogueTurns(item.english);
    return turns ? turns.map(turn=>turn.speaker+': '+turn.text).join('\n') : item.english;
  },[item.english]);
  const parts = useMemo(() => maskReadingSentence(spokenDisplay, level), [spokenDisplay, level]);

  const releaseMic = useCallback(() => {
    token.current++;
    const running=session.current;
    session.current=null;
    if (running) {
      clearTimeout(running.restartTimer);
      clearTimeout(running.finishTimer);
      if (running.recognition) {
        const r=running.recognition;
        r.onresult=r.onerror=r.onend=null;
        try { r.abort(); } catch { /* already stopped */ }
      }
    }
    mic.current=null;
  },[]);

  useEffect(() => {
    releaseMic();
    clearTimeout(celebrationTimer.current);
    setLevel(1);setPhase('idle');setScore(null);setTranscript('');setCelebrate(false);setWpm(0);
    setStatus('お手本を聞いてから、全文を音読しましょう。');
    return () => { releaseMic();clearTimeout(celebrationTimer.current); };
  },[item.id,releaseMic]);

  function finishSpeech(expectedToken) {
    const s=session.current;
    if(!s || !s.stopping || token.current!==expectedToken || s.finished) return;
    s.finished=true;
    const heard=[s.base,s.final,s.interim].filter(Boolean).join(' ').trim();
    const seconds=Math.max(1,(Date.now()-s.startAt)/1000);
    const result=scoreReading(item.english,heard);
    releaseMic();
    setPhase('idle');
    setTranscript(heard);
    setScore(result);
    setWpm(Math.round(result.recognizedCount*60/seconds));
    if(!heard) {
      setStatus('音声が認識されませんでした。マイクの許可を確認し、もう一度音読してください。');
      return;
    }
    onResult(item.id,level,result.percent);
    if(result.passed) {
      setStatus('CLEAR！ Accuracy ' + result.percent + '%。次のレベルに進めます。');
      setCelebrate(true);
      playReadingSuccessSound(soundEnabled,result.percent);
      clearTimeout(celebrationTimer.current);
      celebrationTimer.current=setTimeout(()=>setCelebrate(false),1400);
    } else {
      setStatus('Accuracy ' + result.percent + '%。あと ' + (READING_PASS_PERCENT-result.percent) + 'ポイントで合格です。');
    }
  }

  function startSpeech() {
    if (phase!=='idle') return;
    const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Speech){
      setStatus('このブラウザーでは音声認識を利用できません。Chromeまたは対応するSafariでマイクの許可を確認してください。');
      return;
    }
    primeReadingAudio(soundEnabled);
    onBeforeRecording();
    releaseMic();
    clearTimeout(celebrationTimer.current);
    setScore(null);setWpm(0);setCelebrate(false);setTranscript('');setPhase('listening');
    setStatus('音読中です。読み終えたら、同じボタンで「終了・判定」を押してください。');
    const id=token.current;
    const s={base:'',final:'',interim:'',stopping:false,finished:false,recognition:null,restartTimer:null,finishTimer:null,restarts:0,startAt:Date.now()};
    session.current=s;

    const connect=()=>{
      if(token.current!==id||session.current!==s||s.stopping)return;
      let recognizer;
      try {
        recognizer=new Speech();
        recognizer.lang='en-US';
        recognizer.continuous=true;
        recognizer.interimResults=true;
        recognizer.maxAlternatives=1;
        mic.current=recognizer;
        s.recognition=recognizer;
      } catch {
        releaseMic();setPhase('idle');setStatus('マイクの準備に失敗しました。ブラウザーの設定をご確認ください。');
        return;
      }
      const prefix=s.base;
      const isCurrent=()=>token.current===id&&session.current===s&&s.recognition===recognizer;
      recognizer.onresult=event=>{
        if(!isCurrent())return;
        const finals=[],interims=[];
        for(let i=0;i<event.results.length;i++){
          const result=event.results[i];
          const value=String(result?.[0]?.transcript||'').trim();
          if(value)(result.isFinal?finals:interims).push(value);
        }
        s.final=finals.join(' ');
        s.interim=interims.join(' ');
        setTranscript([prefix,s.final,s.interim].filter(Boolean).join(' '));
      };
      recognizer.onerror=event=>{
        if(!isCurrent())return;
        const e=event.error||'unknown';
        if(['not-allowed','service-not-allowed','audio-capture','language-not-supported'].includes(e)){
          releaseMic();setPhase('idle');
          setStatus(e==='not-allowed'||e==='service-not-allowed'?
            'マイクへのアクセスが許可されていません。ブラウザーのマイク設定を確認してください。':
            '音声認識を利用できません（'+e+'）。接続やマイクを確認してください。');
        } else if(e!=='no-speech'&&e!=='aborted') {
          setStatus('音声認識を再接続しています（'+e+'）。');
        }
      };
      recognizer.onend=()=>{
        if(!isCurrent())return;
        s.recognition=null;mic.current=null;
        if(s.stopping){
          finishSpeech(id);
          return;
        }
        // Service-side silence is not the learner choosing to stop.
        const chunk=[s.final,s.interim].filter(Boolean).join(' ').trim();
        if(chunk)s.base=[s.base,chunk].filter(Boolean).join(' ');
        s.final='';s.interim='';
        s.restarts++;
        if(s.restarts>8){
          setStatus('認識サービスが繰り返し停止しました。「終了・判定」で確認するか、もう一度始めてください。');
          return;
        }
        s.restartTimer=setTimeout(connect,260);
      };
      try { recognizer.start(); }
      catch {
        releaseMic();setPhase('idle');setStatus('音声認識を開始できませんでした。もう一度お試しください。');
      }
    };
    connect();
  }

  function stopSpeech() {
    const s=session.current;
    if(phase!=='listening'||!s||s.stopping)return;
    primeReadingAudio(soundEnabled);
    s.stopping=true;
    setPhase('stopping');
    setStatus('認識結果を確定して、Accuracyを計算しています…');
    clearTimeout(s.restartTimer);
    const id=token.current;
    s.finishTimer=setTimeout(()=>finishSpeech(id),1500);
    if(s.recognition){
      try { s.recognition.stop(); } catch { finishSpeech(id); }
    } else finishSpeech(id);
  }

  function openLevel(selected) {
    if(phase!=='idle'||selected>Math.min(5,cleared+1))return;
    clearTimeout(celebrationTimer.current);
    setLevel(selected);setScore(null);setTranscript('');setWpm(0);setCelebrate(false);
    setStatus('Level '+selected+'。お手本を聞いて、80%以上を目指しましょう。');
  }

  const complete = score?.passed || cleared>=level;
  const allowedNextLevel=level<5&&cleared>=level;
  return (
    <div className="vd-reading">
      <div className="vd-reading-toolbar">
        <div><span className="vd-overline">SENTENCE READING</span><h2>例文を音読する</h2></div>
        <span className="vd-reading-goal">合格基準 {READING_PASS_PERCENT}% 以上</span>
      </div>
      <div className="vd-reading-levels" aria-label="音読レベル">
        {READING_LEVELS.map(entry=>(
          <button type="button" key={entry.level}
            disabled={entry.level>Math.min(5,cleared+1)||phase!=='idle'}
            className={'vd-reading-level'+(level===entry.level?' is-active':'')+(cleared>=entry.level?' is-cleared':'')}
            onClick={()=>openLevel(entry.level)}
            aria-pressed={level===entry.level}>
            {cleared>=entry.level?'✓ ':''}Level {entry.level}
          </button>
        ))}
      </div>
      <div className="vd-reading-sentence">
        <div className="vd-reading-sentence-top">
          <span>基本例文 · Level {level} / 5</span>
          <button type="button" disabled={phase!=='idle'||!soundEnabled} onClick={()=>onModelAudio(item)}>
            <span aria-hidden="true">♫</span> お手本を聞く
          </button>
        </div>
        {item.image && <img className="vd-reading-picture" src={assetImage(item.image)} alt={item.word+'の例文イメージ'}/>}
        <p className="vd-reading-english" lang="en">
          {parts.map((part,i)=>part.hidden?
            <span key={i} className="vd-reading-mask" role="img" aria-label="隠された単語"
              style={{'--mask-length':Math.min(13,Math.max(2,part.text.length))+'ch'}}/>:
            <React.Fragment key={i}>{part.text}</React.Fragment>)}
        </p>
        <p className="vd-reading-japanese">{item.japanese}</p>
      </div>
      <div className="vd-reading-actions">
        <button type="button"
          className={'vd-reading-record'+(phase==='listening'?' is-recording':'')}
          disabled={phase==='stopping'}
          onClick={phase==='listening'?stopSpeech:startSpeech}>
          <span className="vd-reading-record-dot" aria-hidden="true"/>
          {phase==='stopping'?'判定中…':phase==='listening'?'終了・判定':'音読スタート'}
        </button>
        {complete && <span className="vd-reading-complete"><span aria-hidden="true">✓</span> CLEAR · {score?.passed ? score.percent+'%' : '合格済み'}</span>}
        {allowedNextLevel &&
          <button type="button" disabled={phase!=='idle'} className="vd-reading-advance" onClick={()=>openLevel(level+1)}>
            次のレベルへ →
          </button>}
      </div>
      <p role="status" aria-live="polite" className="vd-reading-status">{status}</p>
      <div className="vd-reading-results">
        <div className="vd-reading-transcript">
          <div className="vd-reading-section-label">VOICE TRANSCRIPT <small>認識された英文</small></div>
          {score?.wordMatches?.length?
            <p lang="en">{score.wordMatches.map((w,i)=><span key={i} className={w.matched?'vd-reading-word-ok':'vd-reading-word-missed'}>{i?' ':''}{w.value}</span>)}</p>:
            <p className="vd-reading-placeholder" lang={transcript?'en':'ja'}>{transcript||'音読すると、認識された英語がここに表示されます。'}</p>}
          {score?.missedWords?.length>0 && <div className="vd-reading-missed"><strong>読み落とし・不一致候補</strong> {score.missedWords.slice(0,12).join(' · ')}</div>}
        </div>
        <div className="vd-reading-score">
          <div className="vd-reading-section-label">ACCURACY <small>単語一致率</small></div>
          <div className={'vd-reading-score-ring'+(score?.passed?' is-pass':'')} style={{'--score':(score?.percent||0)+'%'}} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score?.percent||0} aria-label="音読単語一致率">
            <div><strong>{score?score.percent+'%':'—'}</strong><small>{score?.passed?'CLEAR!':'目標 80%'}</small></div>
          </div>
          {score && <div className="vd-reading-wpm">WPM {wpm} <span>・語順一致 {score.matchCount}/{score.targetCount}</span></div>}
          <p>認識された単語と語順の一致率です。発音の質や抑揚の採点ではありません。</p>
          {best>0 && <span className="vd-reading-best">このレベルのBEST {best}%</span>}
        </div>
      </div>
      <div className="vd-reading-bottom">
        {cleared>=5?<span className="vd-reading-all-clear">✓ LEVEL 5 COMPLETE</span>:<span>左から右に段階的にチャレンジできます。</span>}
        <button type="button" disabled={phase!=='idle'} onClick={onNext}>次の英文へ →</button>
      </div>
      {celebrate && <div className="vd-reading-celebration" role="status" aria-live="polite">
        <div className="vd-reading-celebration-inner">
          <div className="vd-reading-celebration-check" aria-hidden="true">✓</div>
          <strong>CLEAR!</strong><span>Accuracy {score?.percent}%</span>
        </div>
      </div>}
    </div>
  );
}
