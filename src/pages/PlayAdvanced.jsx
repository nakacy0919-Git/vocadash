import React, { useState, useEffect, useRef } from 'react';

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
  const [feedback, setFeedback] = useState('');
  
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);

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
    const otherImages = allQuestions
      .filter(q => q.id !== currentQuestion.id)
      .map(q => getActualImagePath(q.image))
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const options = [correctImage, ...otherImages].sort(() => 0.5 - Math.random());
    
    setImageOptions(options);
    setPhase('listening');
    setDictPopup(null);
    setTranscript('');
    setFeedback('');

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
        const currentTranscript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setTranscript(currentTranscript);
        checkPronunciation(currentTranscript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setFeedback('※お使いのブラウザは音声認識に対応していません。スキップしてください。');
    }
  }, [currentQuestion]);

  const handleImageClick = (imgSrc) => {
    if (phase !== 'listening') return;
    
    if (imgSrc === getActualImagePath(currentQuestion.image)) {
      setPhase('speaking');
    } else {
      alert('違います！音声をもう一度聞いてみましょう。');
      if (audioRef.current) audioRef.current.play();
    }
  };

  const checkPronunciation = (spokenText) => {
    if (!currentQuestion) return;
    const targetText = currentQuestion.english.toLowerCase().replace(/[.,!?'"]/g, '');
    const spokenTextClean = spokenText.toLowerCase().replace(/[.,!?'"]/g, '');
    const targetChunk = currentQuestion.chunk.toLowerCase().replace(/[.,!?'"]/g, '');

    if (spokenTextClean.includes(targetChunk) || spokenTextClean.includes(targetText)) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      setFeedback('Excellent!! 発音バッチリです！');
      setTimeout(() => {
        onNext(); 
      }, 1500);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setFeedback('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  // ★ 修正箇所：本物のスペースで単語を繋ぐことで、綺麗に改行されるようにしました
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
    }).reduce((prev, curr) => [prev, ' ', curr]); // ここでスペースを追加して結合
  };

  if (!currentQuestion) return <div>Loading...</div>;

  return (
    <div className="min-h-screen w-screen bg-macaron-gradient flex flex-col items-center py-8 px-4 font-sans">
      <audio ref={audioRef} src={currentQuestion.audio} />

      {/* ヘッダー部分 */}
      <div className="w-full max-w-3xl flex justify-between items-center mb-8 px-2">
        <button 
          onClick={goHome} 
          className="flex items-center gap-2 bg-white/60 hover:bg-white/90 text-gray-600 font-bold py-2 px-4 rounded-full shadow-sm backdrop-blur-sm transition-all"
        >
          <span>◀</span> 戻る
        </button>
        <div className="text-xl font-black text-gray-700 bg-white/50 px-6 py-1.5 rounded-full shadow-inner border border-white/60">
          {currentIndex + 1} <span className="text-sm text-gray-500 font-bold mx-1">/</span> {allQuestions.length}
        </div>
        <button 
          onClick={() => audioRef.current?.play()} 
          className="bg-gradient-to-r from-teal-400 to-teal-500 text-white font-bold px-5 py-2.5 rounded-full shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-2"
        >
          🔊 聞く
        </button>
      </div>

      {/* フェーズ１：リスニング */}
      {phase === 'listening' && (
        <div className="w-full max-w-3xl animate-fade-in flex flex-col items-center">
          <h2 className="text-2xl md:text-3xl font-black text-gray-800 mb-8 text-center drop-shadow-sm">
            流れてきた音声に合う画像を<br/>選んでください
          </h2>
          <div className="grid grid-cols-2 gap-4 md:gap-6 w-full">
            {imageOptions.map((imgSrc, idx) => (
              <button 
                key={idx} 
                onClick={() => handleImageClick(imgSrc)}
                className="relative bg-white rounded-[2rem] shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] overflow-hidden cursor-pointer border-4 border-transparent hover:border-teal-400 active:scale-95 transition-all aspect-video group"
              >
                <img src={imgSrc} alt={`option-${idx}`} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* フェーズ２：スピーキング */}
      {phase === 'speaking' && (
        <div className="w-full max-w-3xl bg-white/95 backdrop-blur-xl p-6 md:p-10 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-white/60 animate-fade-in flex flex-col items-center text-center">
          
          <img src={getActualImagePath(currentQuestion.image)} alt="correct" className="w-full h-48 md:h-64 object-cover rounded-[1.5rem] mb-8 shadow-sm border border-gray-100" />
          
          <div className="inline-block bg-indigo-50 border border-indigo-100 px-4 py-1.5 rounded-full mb-4">
             <span className="text-indigo-500 font-black tracking-widest text-xs md:text-sm uppercase">Target Sentence</span>
          </div>
          
          {/* ★ 修正箇所：w-full と break-words を追加し、はみ出しを防止 */}
          <div className="w-full text-2xl md:text-3xl font-black text-gray-800 mb-6 leading-normal md:leading-relaxed break-words px-2 md:px-4">
            {renderSentence(currentQuestion.english, currentQuestion.dictionary || {})}
          </div>

          <p className="text-gray-500 font-bold mb-10 text-sm md:text-base bg-gray-50 px-6 py-4 rounded-2xl w-full border border-gray-100">
             {currentQuestion.japanese}
          </p>

          {/* 辞書ポップアップ */}
          {dictPopup && (
            <div className="bg-yellow-50/90 backdrop-blur-md border border-yellow-200 text-yellow-800 px-6 py-5 rounded-2xl mb-8 shadow-md w-full max-w-md relative animate-fade-in">
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

          {/* マイク判定UI */}
          <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-8 rounded-[2rem] flex flex-col items-center border border-gray-200/60 shadow-inner">
            <button 
              onClick={toggleListening}
              className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-lg transition-all duration-300 transform ${isListening ? 'bg-red-500 text-white animate-pulse scale-110 shadow-red-500/50' : 'bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600 hover:scale-105'}`}
            >
              🎤
            </button>
            <p className="mt-6 font-bold text-gray-700 md:text-lg">
              {isListening ? '聞き取っています...音読してください' : 'マイクを押して音読'}
            </p>
            
            {transcript && <p className="mt-3 text-gray-500 italic bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">"{transcript}"</p>}
            {feedback && <p className="mt-4 text-rose-500 font-black text-xl bg-rose-50 px-6 py-2 rounded-full border border-rose-100">{feedback}</p>}
          </div>

          <button 
            onClick={onNext} 
            className="mt-8 text-gray-400 hover:text-gray-600 font-bold underline decoration-2 underline-offset-4 transition-colors"
          >
            音読をスキップして次へ
          </button>
        </div>
      )}

    </div>
  );
}

export default PlayAdvanced;