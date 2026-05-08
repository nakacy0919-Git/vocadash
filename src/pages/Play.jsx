import React, { useState, useEffect } from 'react';
import PronunciationCheck from '../components/PronunciationCheck';

export default function Play({
  playMode, currentIndex, selectedQuestions, currentQuestion, timeLeft, targetTime,
  isFailed, submitRecord, handleFail, goHome, startGame, calculateAverageTime
}) {
  const [studyPhase, setStudyPhase] = useState('question'); // 'question' | 'explanation'
  const [studySelected, setStudySelected] = useState(null);
  const [textSizeLevel, setTextSizeLevel] = useState(2);
  const [showJapanese, setShowJapanese] = useState(false);
  const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(null); // 'correct' | 'incorrect' | null

  const timePercentage = playMode === 'study' ? 100 : (timeLeft / targetTime) * 100;
  const isDanger = timePercentage < 30 && playMode === 'test';

  // --- 🔊 効果音再生（Web Audio APIを使用） ---
  const playSound = (type) => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'correct') {
      // ピンポン音（高い音の2連続）
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); 
      osc.frequency.setValueAtTime(1100, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } else {
      // ブブー音（低い音）
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    }
  };

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    setShowJapanese(false);
    setStudyPhase('question');
  }, [currentIndex]);

  const handleChoiceClick = (idx) => {
    const isCorrect = idx === currentQuestion.correct;
    
    if (playMode === 'study') {
      setStudySelected(idx);
      // 演出を表示
      setShowFeedbackOverlay(isCorrect ? 'correct' : 'incorrect');
      playSound(isCorrect ? 'correct' : 'incorrect');
      
      // 0.8秒後に解説画面へ
      setTimeout(() => {
        setShowFeedbackOverlay(null);
        setStudyPhase('explanation');
      }, 800);
    } else {
      // テストモード
      const timeTaken = targetTime - timeLeft;
      if (isCorrect) {
        submitRecord(true, timeTaken);
      } else {
        handleFail('wrong_choice');
      }
    }
  };

  const handleNextStudy = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel(); 
    const isCorrect = studySelected === currentQuestion.correct;
    submitRecord(isCorrect, 0); 
    setStudySelected(null);
  };

  const handleReadAloud = (textToRead) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'en-US';
    utterance.rate = 0.85; 
    window.speechSynthesis.speak(utterance);
  };

  // --- 文字サイズ設定 ---
  const getQuestionTextClass = () => {
    const sizes = [
      'text-base md:text-lg lg:text-xl',       
      'text-lg md:text-xl lg:text-2xl',        
      'text-xl md:text-2xl lg:text-3xl',       
      'text-2xl md:text-3xl lg:text-4xl',      
      'text-3xl md:text-4xl lg:text-5xl',      
      'text-4xl md:text-5xl lg:text-6xl'       
    ];
    return sizes[textSizeLevel];
  };

  // 日本語用の文字サイズ（英文より一回り小さく調整）
  const getJapaneseTextClass = () => {
    const sizes = [
      'text-sm md:text-base',
      'text-base md:text-lg',
      'text-lg md:text-xl',
      'text-xl md:text-2xl',
      'text-2xl md:text-3xl',
      'text-3xl md:text-4xl'
    ];
    return sizes[textSizeLevel];
  };

  const TextSizeControl = () => (
    <div className="flex bg-white/60 p-1 rounded-full border border-gray-200 shadow-sm backdrop-blur-sm items-center">
      <button 
        onClick={() => setTextSizeLevel(prev => Math.max(0, prev - 1))} 
        disabled={textSizeLevel === 0}
        className="flex items-center justify-center w-10 h-8 rounded-full transition-all disabled:opacity-30 text-gray-600 hover:bg-white hover:text-blue-500"
      >
        <span className="text-sm font-bold">A-</span>
      </button>
      <div className="w-px h-5 bg-gray-300 mx-1"></div>
      <button 
        onClick={() => setTextSizeLevel(prev => Math.min(5, prev + 1))} 
        disabled={textSizeLevel === 5}
        className="flex items-center justify-center w-10 h-8 rounded-full transition-all disabled:opacity-30 text-gray-600 hover:bg-white hover:text-blue-500"
      >
        <span className="text-lg font-black">A+</span>
      </button>
    </div>
  );

  const completeSentence = currentQuestion.english.replace('________', currentQuestion.choices[currentQuestion.correct]);
  const questionForSpeech = currentQuestion.english.replace('________', 'blank');

  return (
    <div className={`h-screen w-screen flex flex-col justify-between font-sans overflow-hidden transition-colors duration-700 ${isFailed ? 'bg-mistake-gradient' : 'bg-macaron-gradient'}`}>
      
      {/* --- 正解・不正解のオーバーレイ演出 --- */}
      {showFeedbackOverlay && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center animate-fadeOut backdrop-blur-sm ${showFeedbackOverlay === 'correct' ? 'bg-green-500/20' : 'bg-rose-500/20'}`}>
          <div className="animate-popIn text-[150px] md:text-[200px] drop-shadow-2xl">
            {showFeedbackOverlay === 'correct' ? '⭕' : '❌'}
          </div>
        </div>
      )}

      {/* --- ヘッダー --- */}
      <div className="p-4 md:p-6 z-10">
        <div className="flex items-center gap-4 mb-3">
          <button onClick={() => { window.speechSynthesis?.cancel(); goHome(); }} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md text-gray-600 border border-white/60 active:scale-90 transition-transform shadow-sm">
            <span className="text-xl font-bold">✕</span>
          </button>
          <div className="flex-1 bg-white/40 h-3 md:h-4 rounded-full overflow-hidden shadow-inner border border-white/60 relative backdrop-blur-sm">
            <div className={`h-full absolute left-0 top-0 transition-all duration-[50ms] ease-linear rounded-full ${playMode === 'study' ? 'bg-green-400' : isFailed ? 'bg-rose-400' : isDanger ? 'bg-orange-400' : 'bg-blue-400'}`} style={{ width: `${timePercentage}%` }}></div>
          </div>
        </div>
        <div className="text-right font-bold text-lg flex justify-between items-center text-gray-600">
          <span className="bg-white/60 px-4 py-1 rounded-full text-xs backdrop-blur-sm shadow-sm text-gray-500 ml-14">
            Q {currentIndex + 1} / {selectedQuestions.length} {playMode === 'study' && <span className="ml-2 text-green-600 font-black">📖 STUDY</span>}
          </span>
          {playMode === 'test' && (
            <span className={`text-xl font-mono ${isDanger && !isFailed ? 'text-orange-500 animate-pulse' : ''} ${isFailed ? 'text-rose-500' : 'text-blue-500'}`}>{(Math.max(0, timeLeft) / 1000).toFixed(1)}s</span>
          )}
        </div>
      </div>

      {/* --- メインコンテンツエリア --- */}
      <div className="flex-1 flex flex-col items-center p-4 md:p-6 z-10 overflow-hidden">
        
        {isFailed ? (
          /* テストモード：失敗画面（スクロール可） */
          <div className="w-full max-w-md overflow-y-auto pb-10 custom-scrollbar">
            <div className="animate-shake flex flex-col items-center text-center">
               <h2 className="text-6xl font-black mb-2 text-white drop-shadow-md">Oops!</h2>
               <p className="text-rose-600 font-bold mb-8 bg-white/50 px-6 py-2 rounded-full shadow-sm">どんまい！次はいけるよ ✨</p>
               <div className="glass-panel-light rounded-3xl p-6 mb-8 w-full text-left relative overflow-hidden border border-white/60 shadow-lg">
                 <div className="absolute inset-1.5 border-2 border-dashed border-rose-200/50 rounded-2xl pointer-events-none"></div>
                 <h3 className="text-sm text-gray-400 font-bold border-b border-gray-200 pb-2 mb-4 text-center relative z-10">今回の結果</h3>
                 <div className="flex justify-between text-base mb-4 text-gray-600 font-medium relative z-10">
                   <span>到達レベル:</span>
                   <span className="text-gray-800 font-bold">{currentIndex} 問</span>
                 </div>
                 <div className="mt-4 pt-4 border-t border-gray-200 relative z-10">
                   <span className="block text-xs text-rose-400 font-bold mb-1 uppercase tracking-widest">Check!</span>
                   <div className="flex items-start justify-between gap-3 mb-1">
                     <span className="font-black text-xl text-gray-700 leading-tight block">{completeSentence}</span>
                     <button onClick={() => handleReadAloud(completeSentence)} className="shrink-0 w-10 h-10 flex items-center justify-center bg-rose-100 text-rose-500 rounded-full shadow-sm">🔊</button>
                   </div>
                   <span className="text-sm text-gray-500">{currentQuestion.japanese}</span>
                 </div>
               </div>
               <div className="flex w-full gap-3">
                 <button onClick={goHome} className="flex-1 py-4 bg-white/60 text-gray-600 text-sm font-bold rounded-2xl border border-white/80 shadow-sm">やめる</button>
                 <button onClick={() => { window.speechSynthesis?.cancel(); startGame(); }} className="flex-2 w-2/3 py-4 bg-rose-400 text-white text-lg font-black rounded-2xl shadow-lg relative overflow-hidden">
                   <div className="absolute inset-1 border border-dashed border-white/50 rounded-xl pointer-events-none"></div>
                   <span className="relative z-10">もう1回！</span>
                 </button>
               </div>
            </div>
          </div>
        ) : studyPhase === 'explanation' ? (
          /* 学習モード：解説＆音読画面（全体スクロール） */
          <div className="w-full max-w-4xl flex flex-col glass-panel-light rounded-[2.5rem] shadow-xl relative overflow-hidden border border-white/60">
            <div className="absolute inset-2 border-[2px] border-dashed border-blue-200/40 rounded-[2.2rem] pointer-events-none"></div>
            
            {/* 解説画面内のコンテンツをスクロール可能に */}
            <div className="relative z-10 w-full p-6 md:p-10 overflow-y-auto custom-scrollbar flex-1 max-h-[65vh]">
              
              <div className="flex justify-between items-center mb-6">
                <span className={`font-black px-4 py-1.5 rounded-full text-sm border shadow-sm ${studySelected === currentQuestion.correct ? 'bg-green-100 text-green-600 border-green-200' : 'bg-rose-100 text-rose-600 border-rose-200'}`}>
                  {studySelected === currentQuestion.correct ? '⭕ 正解！' : `❌ 不正解（正解は: ${currentQuestion.choices[currentQuestion.correct]}）`}
                </span>
                <TextSizeControl />
              </div>

              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className={`font-extrabold text-gray-700 leading-snug tracking-tight flex-1 transition-all duration-300 ${getQuestionTextClass()}`} style={{ textWrap: 'balance' }}>
                  {completeSentence}
                </h1>
                <button onClick={() => handleReadAloud(completeSentence)} className="shrink-0 w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-500 rounded-full shadow-sm hover:bg-blue-200">
                  <span className="text-2xl">🔊</span>
                </button>
              </div>

              <p className={`${getJapaneseTextClass()} text-gray-500 font-medium mb-6 border-b border-gray-100 pb-6`}>
                {currentQuestion.japanese}
              </p>

              <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 mb-8">
                <p className="text-sm md:text-base text-gray-600 leading-relaxed font-medium">💡 {currentQuestion.explanation}</p>
              </div>

              {currentQuestion.word_details && (
                <div className="grid gap-3 mb-8">
                  {currentQuestion.word_details.map((detail, i) => (
                    <div key={i} className="relative p-3 rounded-2xl bg-white/60 border border-white shadow-sm flex justify-between items-center overflow-hidden">
                      <div className="absolute inset-1 border border-dashed border-blue-200/50 rounded-xl pointer-events-none"></div>
                      <div className="relative z-10 flex-1 pr-2">
                        <div className="flex justify-between font-bold mb-0.5">
                          <span className={i === currentQuestion.correct ? 'text-green-600' : 'text-gray-700'}>{detail.word}</span>
                          <span className="text-blue-500 text-xs md:text-sm">{detail.meaning}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-tight italic">{detail.etymology}</p>
                      </div>
                      <button onClick={() => handleReadAloud(detail.word)} className="relative z-10 w-8 h-8 rounded-full bg-white/80 border border-gray-200 text-gray-400 flex items-center justify-center shadow-sm">🔊</button>
                    </div>
                  ))}
                </div>
              )}

              <PronunciationCheck targetText={completeSentence} />
            </div>

            {/* 「次へ」ボタンをフッターとして固定 */}
            <div className="p-6 bg-white/40 backdrop-blur-md border-t border-white/60">
              <button onClick={handleNextStudy} className="w-full py-4 bg-gray-700 text-white font-black text-lg rounded-2xl shadow-lg relative overflow-hidden active:scale-95 transition-transform">
                <div className="absolute inset-1 border-2 border-dashed border-gray-500/50 rounded-xl pointer-events-none"></div>
                <span className="relative z-10">次の問題へ →</span>
              </button>
            </div>
          </div>
        ) : (
          /* 出題画面 */
          <div className="w-full max-w-4xl flex flex-col items-start text-left glass-panel-light p-6 md:p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden border border-white/60">
            <div className="absolute inset-2 border-[2px] border-dashed border-white/60 rounded-[2.2rem] pointer-events-none"></div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-2xl opacity-70"></div>
            
            <div className="w-full flex justify-end mb-4 relative z-10">
              <TextSizeControl />
            </div>

            <div className="flex items-start justify-between w-full relative z-10 mb-6 gap-4">
              <h1 className={`font-extrabold text-gray-700 leading-snug tracking-tight break-words flex-1 transition-all duration-300 ${getQuestionTextClass()}`} style={{ textWrap: 'balance' }}>
                {currentQuestion.english.split('________').map((part, index, array) => (
                  <React.Fragment key={index}>
                    {part}
                    {index < array.length - 1 && (
                      <span className="inline-block w-[3em] border-b-4 border-blue-300 mx-[0.2em] align-baseline rounded bg-blue-50/50"></span>
                    )}
                  </React.Fragment>
                ))}
              </h1>
              <button onClick={() => handleReadAloud(questionForSpeech)} className="shrink-0 w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-500 rounded-full shadow-sm hover:bg-blue-200">
                <span className="text-2xl">🔊</span>
              </button>
            </div>

            <div className="w-full border-t border-gray-100 pt-6 mt-2 relative z-10 min-h-[4rem]">
              <button onClick={() => setShowJapanese(!showJapanese)} className={`flex items-center gap-2 px-5 py-2.5 font-bold rounded-full text-sm transition-all shadow-sm border active:scale-95 ${showJapanese ? 'bg-blue-500 text-white border-blue-600' : 'bg-gray-100/80 text-gray-500 border-gray-200/80 hover:bg-white hover:text-blue-500'}`}>
                Japanese
              </button>
              {showJapanese && (
                <div className="animate-fadeIn mt-4">
                  <p className={`${getJapaneseTextClass()} text-gray-500 font-medium leading-relaxed`}>{currentQuestion.japanese}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- 選択肢エリア（出題中のみ） --- */}
      {!isFailed && studyPhase === 'question' && (
        <div className="w-full max-w-4xl mx-auto p-4 pb-8 md:pb-12 z-10">
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {currentQuestion.choices.map((choice, idx) => (
              <button key={idx} onClick={() => handleChoiceClick(idx)} className="group relative touch-manipulation active:scale-[0.97] transition-all duration-200 py-6 md:py-8 lg:py-10 text-lg md:text-xl lg:text-2xl font-bold text-gray-600 bg-white/90 backdrop-blur-md rounded-3xl hover:shadow-md overflow-hidden text-center border border-white/60">
                <div className="absolute inset-1.5 border-[1.5px] border-dashed border-gray-300/60 rounded-2xl pointer-events-none group-hover:border-blue-300/60 transition-colors"></div>
                <span className="absolute top-4 left-5 text-[11px] text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full z-10">{idx + 1}</span>
                <span className="relative z-10">{choice}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}