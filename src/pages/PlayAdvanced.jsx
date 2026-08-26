import React, { useState, useEffect, useRef } from 'react';

// === Web Audio API を使った効果音ジェネレーター ===
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const playCorrectSound = () => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, audioCtx.currentTime);
  osc.frequency.setValueAtTime(1108.73, audioCtx.currentTime + 0.1);
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.5);
};

const playIncorrectSound = () => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.3);
  setTimeout(() => {
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(150, audioCtx.currentTime);
    gain2.gain.setValueAtTime(0, audioCtx.currentTime);
    gain2.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start();
    osc2.stop(audioCtx.currentTime + 0.3);
  }, 150);
};
// ===============================================

function PlayAdvanced({ 
  currentQuestion, 
  allQuestions, 
  currentIndex, 
  onNext, 
  goHome 
}) {
  const [phase, setPhase] = useState('listening');
  const [imageOptions, setImageOptions] = useState([]);
  const [dictPopup, setDictPopup] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const [accuracy, setAccuracy] = useState(null);
  const [animatingIndex, setAnimatingIndex] = useState(null);
  const [animStatus, setAnimStatus] = useState(null);
  
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  const getActualImagePath = (rawPath) => {
    if (!rawPath) return '';
    const parts = rawPath.split('/');
    const fileName = parts.pop();
    const dirPath = parts.join('/');
    const match = fileName.match(/^(\d+)/);
    if (match) {
      return `${dirPath}/${match[1]}.webp`;
    }
    return encodeURI(rawPath);
  };

  useEffect(() => {
    if (!currentQuestion) return;

    const correctImage = getActualImagePath(currentQuestion.image);
    
    // ダミー画像を3つ選ぶ
    const otherImages = allQuestions
      .filter(q => q.id !== currentQuestion.id)
      .map(q => getActualImagePath(q.image))
      .sort(() => 0.5 - Math.random()) 
      .slice(0, 3);

    // ★ 修正: Fisher-Yatesアルゴリズムで4つの画像を「完全にランダム」にシャッフルする
    const options = [correctImage, ...otherImages];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    
    setImageOptions(options);
    setPhase('listening');
    setDictPopup(null);
    setTranscript('');
    finalTranscriptRef.current = ''; 
    setAccuracy(null);
    setAnimatingIndex(null);
    setAnimStatus(null);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
      audioRef.current.play().catch(e => console.log("音声再生エラー:", e));
    }
  }, [currentQuestion, allQuestions, currentIndex]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true; 
      recognition.continuous = true;

      recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript((finalTranscriptRef.current + interimTranscript).trim());
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [currentQuestion]);

  const handleImageClick = (imgSrc, idx) => {
    if (phase !== 'listening' || animStatus !== null) return; 
    
    if (imgSrc === getActualImagePath(currentQuestion.image)) {
      playCorrectSound();
      setAnimatingIndex(idx);
      setAnimStatus('correct');
      setTimeout(() => {
        setPhase('speaking');
        setAnimatingIndex(null);
        setAnimStatus(null);
      }, 1000);
    } else {
      playIncorrectSound();
      setAnimatingIndex(idx);
      setAnimStatus('incorrect');
      setTimeout(() => {
        setAnimatingIndex(null);
        setAnimStatus(null);
        if (audioRef.current) audioRef.current.play();
      }, 600);
    }
  };

  const calculateAccuracy = (target, spoken) => {
    const t = target.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const s = spoken.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    
    if (!s) return 0;
    if (s.includes(t)) return 100;
    
    const tWords = t.split(/\s+/);
    let sWords = s.split(/\s+/);
    let matchCount = 0;
    
    tWords.forEach(word => {
      const index = sWords.indexOf(word);
      if (index !== -1) {
        matchCount++;
        sWords.splice(index, 1); 
      }
    });
    
    return Math.round((matchCount / tWords.length) * 100);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      
      const score = calculateAccuracy(currentQuestion.english, transcript);
      setAccuracy(score);
      
      if (score >= 80) {
        playCorrectSound();
      } else {
        playIncorrectSound();
      }
    } else {
      setTranscript('');
      finalTranscriptRef.current = '';
      setAccuracy(null);
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const renderSentence = (sentence, dictionary) => {
    const words = sentence.split(' ');
    return words.map((word, index) => {
      const cleanWord = word.replace(/[.,!?'"]/g, '');
      const dictKey = Object.keys(dictionary || {}).find(k => k.toLowerCase() === cleanWord.toLowerCase());
      
      if (dictKey) {
        return (
          <span 
            key={index} 
            className="text-blue-600 font-bold border-b-[3px] border-blue-400/50 hover:bg-blue-100/50 hover:text-blue-700 cursor-pointer transition-colors px-0.5 rounded-sm"
            onClick={() => setDictPopup({ word: dictKey, meaning: dictionary[dictKey] })}
          >
            {word}
          </span>
        );
      }
      return <span key={index}>{word}</span>;
    }).reduce((prev, curr) => [prev, ' ', curr]); 
  };

  if (!currentQuestion) return <div>Loading...</div>;

  return (
    <div className="min-h-screen w-screen bg-macaron-gradient flex flex-col items-center py-6 md:py-8 px-4 font-sans relative overflow-x-hidden overflow-y-auto">
      <audio ref={audioRef} src={currentQuestion.audio} />

      {/* ヘッダー部分 */}
      <div className="w-full max-w-7xl flex justify-between items-center mb-6 md:mb-8 px-2 relative z-10">
        
        {/* ★ 修正: 中断ボタンをSVGアイコンに変更し、洗練されたデザインに */}
        <button 
          onClick={goHome} 
          className="flex items-center justify-center gap-1.5 bg-white/70 hover:bg-white text-gray-600 font-bold py-2.5 px-5 rounded-full shadow-sm backdrop-blur-sm transition-all active:scale-95 border border-white/50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">中断</span>
        </button>

        <div className="text-xl font-black text-gray-700 bg-white/50 px-6 py-1.5 rounded-full shadow-inner border border-white/60">
          {currentIndex + 1} <span className="text-sm text-gray-500 font-bold mx-1">/</span> {allQuestions.length}
        </div>
        
        {/* ★ 修正: 聞くボタンをSVGアイコンに変更し、よりクリアなデザインに */}
        <button 
          onClick={() => audioRef.current?.play()} 
          className="bg-gradient-to-r from-teal-400 to-teal-500 text-white font-bold px-6 py-2.5 rounded-full shadow-md hover:shadow-lg hover:from-teal-300 hover:to-teal-400 active:scale-95 transition-all flex items-center justify-center gap-2 border border-teal-300/50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          <span className="text-sm">聞く</span>
        </button>
      </div>

      {/* フェーズ１：リスニング */}
      {phase === 'listening' && (
        <div className="w-full max-w-5xl animate-fade-in flex flex-col items-center relative z-10">
          <h2 className="text-2xl md:text-3xl font-black text-gray-800 mb-8 text-center drop-shadow-sm bg-white/40 px-8 py-3 rounded-full backdrop-blur-sm border border-white/50">
            流れてきた音声に合う画像を選択！
          </h2>
          
          <div className="grid grid-cols-2 gap-4 md:gap-8 w-full px-2">
            {imageOptions.map((imgSrc, idx) => {
              let animClass = '';
              if (animatingIndex === idx) {
                animClass = animStatus === 'correct' ? 'anim-correct' : 'anim-incorrect';
              } else if (animStatus === 'correct') {
                animClass = 'opacity-40 scale-95'; 
              }

              return (
                <button 
                  key={idx} 
                  onClick={() => handleImageClick(imgSrc, idx)}
                  className={`
                    relative bg-white rounded-[2rem] shadow-[0_10px_20px_-5px_rgba(0,0,0,0.15)] overflow-hidden cursor-pointer 
                    border-[5px] border-white hover:border-teal-300 transition-all duration-300 aspect-video group
                    ${animClass}
                  `}
                >
                  <img src={imgSrc} alt={`option-${idx}`} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
                  
                  {animatingIndex === idx && animStatus === 'correct' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm animate-fade-in">
                      <span className="text-8xl md:text-9xl text-white font-black drop-shadow-[0_0_20px_rgba(74,222,128,1)]">⭕</span>
                    </div>
                  )}
                  {animatingIndex === idx && animStatus === 'incorrect' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 backdrop-blur-sm animate-fade-in">
                      <span className="text-8xl md:text-9xl text-white font-black drop-shadow-[0_0_20px_rgba(248,113,113,1)]">❌</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* フェーズ２：スピーキング */}
      {phase === 'speaking' && (
        <div className="w-full max-w-7xl bg-white/95 backdrop-blur-xl p-6 md:p-10 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-white/60 animate-fade-in flex flex-col lg:flex-row gap-8 lg:gap-12 relative z-10">
          
          <div className="flex-1 flex flex-col w-full">
            <div className="w-full mb-6 flex justify-center lg:justify-start">
              <img src={getActualImagePath(currentQuestion.image)} alt="correct" className="w-full max-w-2xl h-auto max-h-64 lg:max-h-[35vh] object-cover rounded-[1.5rem] shadow-sm border border-gray-100" />
            </div>
            
            <div className="w-full text-left">
              <div className="inline-block bg-indigo-50 border border-indigo-100 px-4 py-1.5 rounded-full mb-4">
                 <span className="text-indigo-500 font-black tracking-widest text-xs md:text-sm uppercase">Target Sentence</span>
              </div>
              
              <div className="w-full text-left text-2xl md:text-3xl lg:text-4xl font-black text-gray-800 mb-6 leading-relaxed break-words">
                {renderSentence(currentQuestion.english, currentQuestion.dictionary || {})}
              </div>

              <p className="text-left text-gray-500 font-bold mb-4 text-sm md:text-lg bg-gray-50 px-6 py-4 rounded-2xl w-full border border-gray-100">
                 {currentQuestion.japanese}
              </p>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center w-full relative">
            
            {dictPopup && (
              <div className="absolute top-0 z-30 bg-yellow-50/95 backdrop-blur-md border border-yellow-200 text-yellow-800 px-6 py-5 rounded-2xl mb-8 shadow-xl w-full max-w-md animate-fade-in">
                <button 
                  className="absolute top-3 right-4 text-yellow-500 hover:text-yellow-700 font-black text-xl transition-colors"
                  onClick={() => setDictPopup(null)}
                >
                  ×
                </button>
                <p className="font-black text-xl mb-1">{dictPopup.word}</p>
                <p className="font-medium">{dictPopup.meaning}</p>
              </div>
            )}

            <div className="w-full h-full min-h-[350px] bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-8 rounded-[2rem] flex flex-col items-center justify-center border border-gray-200/60 shadow-inner">
              
              {accuracy === null ? (
                <div className="flex flex-col items-center">
                  <button 
                    onClick={toggleListening}
                    className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-lg transition-all duration-300 transform ${isListening ? 'bg-red-500 text-white animate-pulse scale-110 shadow-red-500/50' : 'bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600 hover:scale-105'}`}
                  >
                    {isListening ? '⏹️' : '🎤'}
                  </button>
                  <p className="mt-6 font-bold text-gray-700 md:text-lg">
                    {isListening ? '録音中... もう一度押して判定！' : 'マイクを押して音読'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center animate-fade-in">
                  <div 
                    className="relative w-40 h-40 rounded-full flex items-center justify-center shadow-inner" 
                    style={{ background: `conic-gradient(${accuracy >= 80 ? '#4ade80' : '#f87171'} ${accuracy}%, #e5e7eb 0)` }}
                  >
                    <div className="absolute w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                      <span className={`text-5xl font-black ${accuracy >= 80 ? 'text-green-500' : 'text-red-500'}`}>
                        {accuracy}<span className="text-2xl">%</span>
                      </span>
                    </div>
                  </div>
                  
                  <p className={`mt-6 font-black text-2xl ${accuracy >= 80 ? 'text-green-500' : 'text-red-500'}`}>
                    {accuracy >= 80 ? 'CLEAR!✨' : 'TRY AGAIN!'}
                  </p>
                  
                  <div className="flex gap-4 mt-6">
                    <button 
                      onClick={() => setAccuracy(null)} 
                      className="px-6 py-3 rounded-full font-bold bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                    >
                      もう一度
                    </button>
                    {accuracy >= 80 && (
                      <button 
                        onClick={onNext} 
                        className="px-8 py-3 rounded-full font-black bg-green-500 text-white hover:bg-green-600 shadow-md hover:shadow-lg transition-all"
                      >
                        次へ進む ▶
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {transcript && (
                <p className="mt-6 text-gray-500 font-medium italic bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-100 text-center break-words w-full max-w-md">
                  "{transcript}"
                </p>
              )}
            </div>

            <button 
              onClick={onNext} 
              className="mt-6 text-gray-400 hover:text-gray-600 font-bold underline decoration-2 underline-offset-4 transition-colors"
            >
              強制スキップして次へ
            </button>
          </div>

        </div>
      )}

      {/* カスタムCSSアニメーション */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes correctFlash {
          0% { transform: scale(1); box-shadow: 0 0 0px rgba(74, 222, 128, 0); border-color: white; }
          50% { transform: scale(1.05); box-shadow: 0 0 40px rgba(74, 222, 128, 1); border-color: #4ade80; }
          100% { transform: scale(1.05); box-shadow: 0 0 20px rgba(74, 222, 128, 0.8); border-color: #4ade80; }
        }
        @keyframes incorrectShake {
          0%, 100% { transform: translateX(0); border-color: #f87171; }
          20%, 60% { transform: translateX(-15px); border-color: #f87171; }
          40%, 80% { transform: translateX(15px); border-color: #f87171; }
        }
        .anim-correct {
          animation: correctFlash 1s ease-out forwards;
          z-index: 20;
        }
        .anim-incorrect {
          animation: incorrectShake 0.6s ease-in-out forwards;
          border-color: #f87171 !important;
        }
      `}} />
    </div>
  );
}

export default PlayAdvanced;