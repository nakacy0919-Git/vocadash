import React, { useState, useEffect, useRef } from 'react';

export default function PronunciationCheck({ targetText }) {
  const [speechText, setSpeechText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [accuracyScore, setAccuracyScore] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  // ★ 新設：全画面モードを開いているかどうかの状態
  const [isExpanded, setIsExpanded] = useState(false);
  
  const recognitionRef = useRef(null);

  // コンポーネントが消える時や、問題が変わった時は確実にリセットする
  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  useEffect(() => {
    setIsExpanded(false);
  }, [targetText]);

  // --- 100%満点で正確性を計算するロジック ---
  const calculateAccuracy = (expected, actual) => {
    if (!expected || !actual) return 0;
    
    const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
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

  // --- 録音の開始処理 ---
  const openAndStart = () => {
    setIsExpanded(true); // 全画面モードを開く
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage("お使いのブラウザは音声認識に対応していません。（ChromeやSafariをご利用ください）");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.lang = 'en-US';
    recognition.continuous = true;      // 手動で停止するまで聞き取りを続ける
    recognition.interimResults = true;  // 話している途中経過もリアルタイムで取得
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      setIsListening(true);
      setSpeechText('');
      setAccuracyScore(null);
      setErrorMessage('');
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(res => res[0].transcript)
        .join(' ');
        
      setSpeechText(transcript);
      const score = calculateAccuracy(targetText, transcript);
      setAccuracyScore(score);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error !== 'aborted') {
        if (event.error === 'network' || event.error === 'no-speech' || event.error === 'audio-capture') {
          setErrorMessage("通信環境が良い場所を選んで再度挑戦してください。（またはマイクの接続を確認してください）");
        } else {
          setErrorMessage(`認識エラーが発生しました（${event.error}）。再度ボタンを押して挑戦してください。`);
        }
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (recognitionRef.current) {
        // 自然終了時にスコアが0ならエラー表示
        if (accuracyScore === 0 || speechText === '') {
          setErrorMessage("音声がうまく認識できませんでした。通信環境が良い場所を選ぶか、マイクに近づいて再度挑戦してください。");
        }
      }
    };
    
    try {
      recognition.start();
    } catch (e) {
      setIsListening(false);
      setErrorMessage("音声認識の起動に失敗しました。少し待ってから再度お試しください。");
    }
  };

  // --- 録音の手動停止処理 ---
  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    
    if (accuracyScore === 0 || speechText === '') {
      setErrorMessage("音声がうまく認識できませんでした。通信環境が良い場所を選ぶか、マイクに近づいて再度挑戦してください。");
    }
  };

  // --- 全画面モードを閉じる処理 ---
  const closeOverlay = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsExpanded(false);
  };

  return (
    <>
      {/* --- 通常表示（解説画面に埋め込まれるボタン） --- */}
      {!isExpanded && (
        <div className="bg-white/80 p-5 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm w-full">
          <div>
            <p className="text-gray-500 font-bold text-sm mb-1">スピーキング練習</p>
            {accuracyScore !== null ? (
              <span className={`text-sm font-black px-3 py-0.5 rounded-full border ${
                accuracyScore === 100 ? 'bg-green-100 text-green-600 border-green-200' :
                accuracyScore >= 80 ? 'bg-blue-100 text-blue-600 border-blue-200' : 
                accuracyScore >= 50 ? 'bg-yellow-100 text-yellow-600 border-yellow-200' : 
                'bg-gray-100 text-gray-600 border-gray-200'
              }`}>
                前回スコア: {accuracyScore}%
              </span>
            ) : (
              <span className="text-xs text-gray-400">マイクを使って発音を採点できます</span>
            )}
          </div>
          
          <button 
            onClick={openAndStart}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-full font-bold text-white shadow-md active:scale-95 transition-all flex items-center gap-2"
          >
            🎤 挑戦する
          </button>
        </div>
      )}

      {/* --- 全画面録音モード（オーバーレイ） --- */}
      {isExpanded && (
        <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-xl flex flex-col justify-between p-6 animate-fadeIn">
          
          {/* 閉じるボタン（右上） */}
          <button 
            onClick={closeOverlay} 
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full text-white text-xl flex justify-center items-center transition-colors z-10"
          >
            ✕
          </button>

          {/* 中央エリア：英文と結果表示 */}
          <div className="flex-1 flex flex-col justify-center items-center w-full max-w-4xl mx-auto mt-10">
            
            {/* 大きく表示される英文 */}
            <h2 
              className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white leading-snug tracking-tight text-center mb-10 drop-shadow-lg" 
              style={{ textWrap: 'balance' }}
            >
              {targetText}
            </h2>
            
            {/* 聞き取ったテキストのリアルタイム表示 */}
            <div className="min-h-[6rem] w-full flex flex-col items-center justify-center px-4">
              {speechText ? (
                <p className="text-xl md:text-3xl text-blue-300 font-medium text-center">{speechText}</p>
              ) : isListening ? (
                <div className="flex flex-col items-center gap-2 opacity-60">
                  <span className="text-4xl animate-bounce">🎙️</span>
                  <p className="text-lg text-gray-400 font-bold tracking-widest">Listening...</p>
                </div>
              ) : null}
            </div>

            {/* スコアとフィードバック（録音終了時のみ表示） */}
            {!isListening && accuracyScore !== null && !errorMessage && (
              <div className="mt-10 animate-popIn flex flex-col items-center">
                <span className={`text-4xl md:text-5xl font-black px-8 py-3 rounded-full border-4 shadow-lg ${
                  accuracyScore === 100 ? 'bg-green-500/20 text-green-400 border-green-400 shadow-green-500/50' :
                  accuracyScore >= 80 ? 'bg-blue-500/20 text-blue-400 border-blue-400 shadow-blue-500/50' : 
                  accuracyScore >= 50 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400 shadow-yellow-500/50' : 
                  'bg-rose-500/20 text-rose-400 border-rose-400 shadow-rose-500/50'
                }`}>
                  Accuracy: {accuracyScore}%
                </span>
                
                <p className={`mt-6 font-bold text-xl md:text-2xl ${
                  accuracyScore === 100 ? 'text-green-300' : 
                  accuracyScore >= 80 ? 'text-blue-300' : 
                  accuracyScore >= 50 ? 'text-yellow-300' : 
                  'text-rose-300'
                }`}>
                  {accuracyScore === 100 ? '👑 Perfect!! ネイティブ級の完璧な発音です！' 
                    : accuracyScore >= 80 ? '✨ Excellent! とても綺麗に発音できています！' 
                    : accuracyScore >= 50 ? '👍 Good! あと少し！細かい単語を意識してみよう！' 
                    : '💪 もう一度、お手本の音声を聞いてからトライしてみよう！'}
                </p>
              </div>
            )}

            {/* エラーメッセージ */}
            {errorMessage && !isListening && (
              <div className="mt-8 text-orange-200 bg-orange-500/20 p-5 rounded-2xl border border-orange-500/40 text-center font-bold">
                ⚠️ {errorMessage}
              </div>
            )}
          </div>

          {/* 下部コントロールエリア：一番押しやすい位置 */}
          <div className="w-full max-w-md mx-auto pb-8 pt-4 z-10">
            {isListening ? (
              <button 
                onClick={stopRecording} 
                className="w-full py-6 bg-rose-500 hover:bg-rose-600 text-white text-2xl font-black rounded-[2rem] shadow-[0_0_40px_rgba(244,63,94,0.6)] animate-pulse active:scale-95 transition-all"
              >
                🛑 終了する
              </button>
            ) : (
              <div className="flex gap-4">
                <button 
                  onClick={closeOverlay} 
                  className="flex-1 py-5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-[1.5rem] transition-colors active:scale-95"
                >
                  戻る
                </button>
                <button 
                  onClick={openAndStart} 
                  className="flex-2 w-2/3 py-5 bg-blue-500 hover:bg-blue-600 text-white text-xl font-black rounded-[1.5rem] shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-colors active:scale-95"
                >
                  🎤 もう一度
                </button>
              </div>
            )}
          </div>

        </div>
      )}
    </>
  );
}