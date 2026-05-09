import React, { useState, useEffect, useRef } from 'react';
// ★ 追加：親要素から脱出して最前面に描画するための機能をインポート
import { createPortal } from 'react-dom';

export default function PronunciationCheck({ targetText }) {
  const [speechText, setSpeechText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [accuracyScore, setAccuracyScore] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const recognitionRef = useRef(null);
  const speechTextRef = useRef('');

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  useEffect(() => {
    setIsExpanded(false);
  }, [targetText]);

  // --- 文字列の正規化（小文字化 ＆ 記号除去） ---
  const normalize = (str) => {
    return str.toLowerCase().replace(/[.,!?;:]/g, "").trim();
  };

  // --- 正確性の計算ロジック（大文字・小文字を無視） ---
  const calculateAccuracy = (expected, actual) => {
    if (!expected || !actual) return 0;
    
    const expWords = normalize(expected).split(/\s+/);
    const actWords = normalize(actual).split(/\s+/);
    
    if (expWords.length === 0) return 0;

    let matches = 0;
    const actWordsCopy = [...actWords];
    
    expWords.forEach(word => {
      const index = actWordsCopy.indexOf(word);
      if (index !== -1) {
        matches++;
        actWordsCopy.splice(index, 1);
      }
    });
    
    return Math.round((matches / expWords.length) * 100);
  };

  // --- マッチする単語を青く表示する関数 ---
  const renderHighlightedSpeech = (speech, target) => {
    if (!speech) return null;
    
    const targetWordsNormalized = normalize(target).split(/\s+/);
    const speechWords = speech.split(/\s+/);

    return speechWords.map((word, index) => {
      const isMatch = targetWordsNormalized.includes(normalize(word));
      return (
        <span 
          key={index} 
          className={isMatch ? "text-blue-400 font-bold" : "text-gray-400"}
        >
          {word}{" "}
        </span>
      );
    });
  };

  const openAndStart = () => {
    setIsExpanded(true); 
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setErrorMessage("お使いのブラウザは音声認識に対応していません。");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.lang = 'en-US';
    recognition.continuous = true;      
    recognition.interimResults = true;  
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      setIsListening(true);
      setSpeechText('');
      speechTextRef.current = ''; 
      setAccuracyScore(null);
      setErrorMessage('');
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(res => res[0].transcript)
        .join(' ');
        
      setSpeechText(transcript);
      speechTextRef.current = transcript; 
      const score = calculateAccuracy(targetText, transcript);
      setAccuracyScore(score);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error !== 'aborted') {
        setErrorMessage("通信環境が良い場所を選んで再度挑戦してください。");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (!speechTextRef.current) {
        setErrorMessage("音声が認識されませんでした。通信環境（WiFi）やマイク設定を確認してください。");
      }
    };
    
    try {
      recognition.start();
    } catch (e) {
      setIsListening(false);
      setErrorMessage("音声認識の起動に失敗しました。");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const closeOverlay = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsExpanded(false);
  };

  return (
    <>
      {!isExpanded && (
        <div className="bg-white/80 p-4 md:p-5 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm w-full gap-3">
          <div className="flex-1 pr-2">
            <p className="text-gray-500 font-bold text-sm mb-1">スピーキング練習</p>
            {accuracyScore !== null ? (
              <span className={`text-xs md:text-sm font-black px-3 py-0.5 rounded-full border inline-block ${
                accuracyScore === 100 ? 'bg-green-100 text-green-600 border-green-200' :
                accuracyScore >= 80 ? 'bg-blue-100 text-blue-600 border-blue-200' : 
                accuracyScore >= 50 ? 'bg-yellow-100 text-yellow-600 border-yellow-200' : 
                'bg-gray-100 text-gray-600 border-gray-200'
              }`}>
                前回スコア: {accuracyScore}%
              </span>
            ) : (
              <span className="text-xs text-gray-400">マイクで発音を採点できます</span>
            )}
          </div>
          <button 
            onClick={openAndStart}
            className="shrink-0 w-12 h-12 flex items-center justify-center bg-blue-500 hover:bg-blue-600 rounded-full text-white shadow-md active:scale-95 transition-all text-xl"
          >
            🎤
          </button>
        </div>
      )}

      {/* ★ 変更箇所：createPortal を使って、document.body（画面の一番上の層）に直接描画する */}
      {isExpanded && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-xl flex flex-col justify-between animate-fadeIn">
          
          <button 
            onClick={closeOverlay} 
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full text-white text-xl flex justify-center items-center transition-colors z-[10000]"
          >
            ✕
          </button>

          <div className="flex-1 overflow-y-auto flex flex-col justify-center items-center w-full max-w-4xl mx-auto my-6 px-6">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-white leading-snug tracking-tight text-center mb-8 drop-shadow-lg">
              {targetText}
            </h2>
            
            <div className="min-h-[6rem] w-full flex flex-col items-center justify-center">
              {speechText ? (
                <p className="text-xl md:text-3xl font-medium text-center leading-relaxed">
                  {renderHighlightedSpeech(speechText, targetText)}
                </p>
              ) : isListening ? (
                <div className="flex flex-col items-center gap-2 opacity-60">
                  <span className="text-4xl animate-bounce">🎙️</span>
                  <p className="text-lg text-gray-400 font-bold tracking-widest">Listening...</p>
                </div>
              ) : null}
            </div>

            {!isListening && accuracyScore !== null && !errorMessage && (
              <div className="mt-8 animate-popIn flex flex-col items-center text-center">
                <span className={`text-2xl md:text-4xl font-black px-6 py-2 rounded-full border-4 shadow-lg whitespace-nowrap ${
                  accuracyScore === 100 ? 'bg-green-500/20 text-green-400 border-green-400' :
                  accuracyScore >= 80 ? 'bg-blue-100 text-blue-600 border-blue-200' : 
                  'bg-gray-500/20 text-gray-400 border-gray-400'
                }`}>
                  Accuracy: {accuracyScore}%
                </span>
                
                <p className={`mt-6 font-bold text-lg md:text-xl px-4 ${
                  accuracyScore === 100 ? 'text-green-300' : 
                  accuracyScore >= 80 ? 'text-blue-300' : 'text-gray-300'
                }`}>
                  {accuracyScore === 100 ? '👑 Perfect!!' 
                    : accuracyScore >= 80 ? '✨ Excellent!' 
                    : accuracyScore >= 1 ? '👍 Good Try! マッチした単語を意識してもう一度！'
                    : '💪 Try again! 英語で話しかけてみよう！'}
                </p>
              </div>
            )}

            {errorMessage && !isListening && (
              <div className="mt-8 text-orange-200 bg-orange-500/20 p-5 rounded-2xl border border-orange-500/40 text-center font-bold">
                ⚠️ {errorMessage}
              </div>
            )}
          </div>

          {/* ★ 下部の余白(pb)を少し増やして、iPhoneのホームバーに被らないように調整 */}
          <div className="w-full max-w-md mx-auto pb-12 pt-4 px-4 z-[10000] bg-gradient-to-t from-slate-900 via-slate-900 to-transparent">
            {isListening ? (
              <button 
                onClick={stopRecording} 
                className="w-full py-5 bg-rose-500 hover:bg-rose-600 text-white text-2xl font-black rounded-[2rem] shadow-[0_0_40px_rgba(244,63,94,0.6)] animate-pulse"
              >
                🛑 終了する
              </button>
            ) : (
              <div className="flex gap-3">
                <button 
                  onClick={closeOverlay} 
                  className="flex-1 py-4 bg-white/10 text-white font-bold rounded-[1.5rem] active:scale-95 transition-transform"
                >
                  戻る
                </button>
                <button 
                  onClick={openAndStart} 
                  className="flex-2 w-2/3 py-4 bg-blue-500 text-white text-xl font-black rounded-[1.5rem] active:scale-95 transition-transform"
                >
                  🎤 もう一度
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body // ★ ここで body（最前面）を指定
      )}
    </>
  );
}