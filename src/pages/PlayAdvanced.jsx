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

  // ▼ 新規追加：JSONの長い画像パスから、先頭の数字だけを抜き出して正しいパス(例: 1.webp)を生成する関数
  const getActualImagePath = (rawPath) => {
    if (!rawPath) return '';
    const parts = rawPath.split('/');
    const fileName = parts.pop();
    const dirPath = parts.join('/');
    
    // ファイル名の先頭にある数字の塊(1桁以上)を抽出
    const match = fileName.match(/^(\d+)/);
    if (match) {
      // ディレクトリパス ＋ 抽出した数字 ＋ .webp に変換して返す
      return `${dirPath}/${match[1]}.webp`;
    }
    // もし数字がなければエンコードしてそのまま返す
    return encodeURI(rawPath);
  };

  useEffect(() => {
    if (!currentQuestion) return;

    // 正解の画像（番号のみに変換）
    const correctImage = getActualImagePath(currentQuestion.image);
    
    // ダミーの画像（番号のみに変換）
    const otherImages = allQuestions
      .filter(q => q.id !== currentQuestion.id)
      .map(q => getActualImagePath(q.image))
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    // 正解とダミーを混ぜてシャッフル
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
    
    // クリックした画像が、正解の画像（パス変換後）と一致するか判定
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

  const renderSentence = (sentence, dictionary) => {
    const words = sentence.split(' ');
    return words.map((word, index) => {
      const cleanWord = word.replace(/[.,!?'"]/g, '');
      const dictKey = Object.keys(dictionary).find(k => k.toLowerCase() === cleanWord.toLowerCase());
      
      if (dictKey) {
        return (
          <span 
            key={index} 
            className="text-blue-600 font-bold border-b border-blue-400 cursor-pointer mx-1 hover:bg-blue-50"
            onClick={() => setDictPopup({ word: dictKey, meaning: dictionary[dictKey] })}
          >
            {word}
          </span>
        );
      }
      return <span key={index} className="mx-1">{word}</span>;
    });
  };

  if (!currentQuestion) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-6 px-4">
      {/* 音声ファイルのパス（001.mp3 の形式で読み込み） */}
      <audio ref={audioRef} src={currentQuestion.audio} />

      <div className="w-full max-w-2xl flex justify-between items-center mb-6">
        <button onClick={goHome} className="text-gray-500 font-bold hover:text-gray-700">
          ◀ 中断して戻る
        </button>
        <div className="text-lg font-bold text-gray-700">
          {currentIndex + 1} / {allQuestions.length}
        </div>
        <button onClick={() => audioRef.current?.play()} className="bg-teal-500 text-white px-4 py-2 rounded-full shadow hover:bg-teal-600">
          🔊 もう一度聞く
        </button>
      </div>

      {phase === 'listening' && (
        <div className="w-full max-w-2xl animate-fade-in flex flex-col items-center">
          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
            流れてきた音声に合う画像を<br/>選んでください
          </h2>
          <div className="grid grid-cols-2 gap-4 w-full">
            {imageOptions.map((imgSrc, idx) => (
              <div 
                key={idx} 
                onClick={() => handleImageClick(imgSrc)}
                className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer border-4 border-transparent hover:border-teal-400 transition transform hover:scale-105 aspect-video flex items-center justify-center bg-gray-200"
              >
                {/* 変換済みの画像パス(1.webp等)を表示 */}
                <img src={imgSrc} alt={`option-${idx}`} className="object-cover w-full h-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === 'speaking' && (
        <div className="w-full max-w-2xl bg-white p-6 rounded-2xl shadow-lg animate-fade-in flex flex-col items-center text-center">
          {/* スピーキングフェーズでも変換済みの正解画像を表示 */}
          <img src={getActualImagePath(currentQuestion.image)} alt="correct" className="h-48 object-cover rounded-lg mb-6 shadow" />
          
          <p className="text-gray-500 mb-2 font-bold tracking-widest text-sm uppercase">TARGET SENTENCE</p>
          <div className="text-2xl font-medium text-gray-800 mb-4 leading-relaxed">
            {renderSentence(currentQuestion.english, currentQuestion.dictionary || {})}
          </div>

          <p className="text-gray-600 mb-6">{currentQuestion.japanese}</p>

          {dictPopup && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-xl mb-6 shadow-sm w-full max-w-md relative">
              <button 
                className="absolute top-2 right-3 text-yellow-600 font-bold text-xl"
                onClick={() => setDictPopup(null)}
              >
                ×
              </button>
              <p className="font-bold text-lg">{dictPopup.word}</p>
              <p>{dictPopup.meaning}</p>
            </div>
          )}

          <div className="w-full bg-gray-50 p-4 rounded-xl flex flex-col items-center">
            <button 
              onClick={toggleListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-lg transition-transform transform ${isListening ? 'bg-red-500 text-white animate-pulse scale-110' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
            >
              🎤
            </button>
            <p className="mt-4 font-bold text-gray-700">
              {isListening ? '聞き取っています...音読してください' : 'マイクを押して音読'}
            </p>
            
            {transcript && <p className="mt-2 text-gray-500 italic">"{transcript}"</p>}
            {feedback && <p className="mt-2 text-red-500 font-bold text-lg">{feedback}</p>}
          </div>

          <button 
            onClick={onNext} 
            className="mt-8 text-gray-400 hover:text-gray-600 font-bold underline"
          >
            音読をスキップして次へ
          </button>
        </div>
      )}

    </div>
  );
}

export default PlayAdvanced;