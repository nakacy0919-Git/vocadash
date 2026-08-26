import React, { useState, useEffect, useRef } from 'react';

function PlayAdvanced({ 
  currentQuestion, 
  allQuestions, 
  currentIndex, 
  onNext, 
  goHome 
}) {
  const [phase, setPhase] = useState('listening'); // 'listening' または 'speaking'
  const [imageOptions, setImageOptions] = useState([]);
  const [dictPopup, setDictPopup] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);

  // 1. 問題が切り替わるたびに、ダミー画像を3つ選んで四択を生成＆音声再生
  useEffect(() => {
    if (!currentQuestion) return;

    // 正解の画像
    const correctImage = currentQuestion.image;
    // 他の問題からダミー画像を3つランダムに抽出
    const otherImages = allQuestions
      .filter(q => q.id !== currentQuestion.id)
      .map(q => q.image)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    // 正解1つ ＋ ダミー3つ をシャッフル
    const options = [correctImage, ...otherImages].sort(() => 0.5 - Math.random());
    
    setImageOptions(options);
    setPhase('listening');
    setDictPopup(null);
    setTranscript('');
    setFeedback('');

    // 音声の自動再生
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
      audioRef.current.play().catch(e => console.log("音声再生エラー:", e));
    }
  }, [currentQuestion, allQuestions, currentIndex]);

  // 2. 音声認識（Web Speech API）のセットアップ
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true; // 喋っている途中でも結果を返す
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

  // 画像を選択したときの処理
  const handleImageClick = (imgSrc) => {
    if (phase !== 'listening') return;
    
    if (imgSrc === currentQuestion.image) {
      // 正解の場合、スピーキング（音読）フェーズへ
      setPhase('speaking');
    } else {
      // 不正解の場合は赤く光るなどのフィードバック（今回はアラート）
      alert('違います！音声をもう一度聞いてみましょう。');
      if (audioRef.current) audioRef.current.play();
    }
  };

  // 音読の判定処理（正解の英文と部分一致すればクリア）
  const checkPronunciation = (spokenText) => {
    if (!currentQuestion) return;
    const targetText = currentQuestion.english.toLowerCase().replace(/[.,!?'"]/g, '');
    const spokenTextClean = spokenText.toLowerCase().replace(/[.,!?'"]/g, '');

    // 喋った言葉の中に、ターゲットとなるチャンクが含まれていればOKとする（判定を少し甘めに）
    const targetChunk = currentQuestion.chunk.toLowerCase().replace(/[.,!?'"]/g, '');

    if (spokenTextClean.includes(targetChunk) || spokenTextClean.includes(targetText)) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      setFeedback('Excellent!! 発音バッチリです！');
      setTimeout(() => {
        onNext(); // 次の問題へ
      }, 1500);
    }
  };

  // マイクのON/OFF切り替え
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

  // 辞書クリック用の文生成（記号を除去して辞書マッチング）
  const renderSentence = (sentence, dictionary) => {
    const words = sentence.split(' ');
    return words.map((word, index) => {
      const cleanWord = word.replace(/[.,!?'"]/g, ''); // 記号を取り除く
      // 辞書データと一致するかチェック（大文字小文字無視）
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
      {/* 隠しオーディオタグ（自動再生用） */}
      <audio ref={audioRef} src={currentQuestion.audio} />

      {/* 上部ヘッダー */}
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

      {/* フェーズ１：画像四択（リスニング） */}
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
                {/* 実際の画像ファイルがない場合はaltテキストが出ます。画像を用意したら表示されます */}
                <img src={imgSrc} alt={`option-${idx}`} className="object-cover w-full h-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* フェーズ２：音読＆辞書確認（スピーキング） */}
      {phase === 'speaking' && (
        <div className="w-full max-w-2xl bg-white p-6 rounded-2xl shadow-lg animate-fade-in flex flex-col items-center text-center">
          <img src={currentQuestion.image} alt="correct" className="h-48 object-cover rounded-lg mb-6 shadow" />
          
          <p className="text-gray-500 mb-2 font-bold tracking-widest text-sm uppercase">TARGET SENTENCE</p>
          <div className="text-2xl font-medium text-gray-800 mb-4 leading-relaxed">
            {renderSentence(currentQuestion.english, currentQuestion.dictionary || {})}
          </div>

          <p className="text-gray-600 mb-6">{currentQuestion.japanese}</p>

          {/* 辞書ポップアップ */}
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

          {/* マイク判定UI */}
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