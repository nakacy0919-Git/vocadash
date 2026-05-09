import React, { useState, useEffect } from 'react';
import CourseSelect from './pages/CourseSelect';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Play from './pages/Play';
import Result from './pages/Result';
import BrowserGuide from './components/BrowserGuide';

// コースIDと表示名のマッピング
const COURSE_MAP = {
  regular: '定期考査 KICK OFF',
  eiken_pre2: '英検 準2級',
  eiken_2: '英検 2級',
  eiken_pre1: '英検 準1級',
  eiken_1: '英検 1級',
};

// スパルタテストモードの制限時間（10秒 = 10000ミリ秒）
const TARGET_TIME = 10000;

function App() {
  // --- 画面遷移のステート ---
  // 'course_select', 'home', 'settings', 'play', 'result'
  const [appState, setAppState] = useState('course_select'); 
  
  // --- 学習データのステート ---
  const [currentCourse, setCurrentCourse] = useState(null);
  const [questionsData, setQuestionsData] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [currentMode, setCurrentMode] = useState(null); 
  const [playMode, setPlayMode] = useState('study'); // 'study' (じっくり) or 'test' (スパルタ)
  
  // --- プレイ中の状態管理 ---
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TARGET_TIME);
  const [isFailed, setIsFailed] = useState(false);
  const [sessionResults, setSessionResults] = useState([]);

  // 1. コースデータの非同期読み込み
  useEffect(() => {
    if (currentCourse) {
      import(`./data/${currentCourse}.json`)
        .then((data) => setQuestionsData(data.default))
        .catch((err) => console.error("データ読み込みエラー:", err));
    }
  }, [currentCourse]);

  // 2. タイマーのロジック（テストモード時のみ稼働）
  useEffect(() => {
    let timer;
    if (appState === 'play' && playMode === 'test' && !isFailed) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 100) {
            setIsFailed(true); // 時間切れ
            return 0;
          }
          return prev - 100;
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [appState, playMode, isFailed]);

  // --- 画面遷移ハンドラ ---
  const goCourseSelect = () => {
    setCurrentCourse(null);
    setAppState('course_select');
  };

  const onSelectCourse = (courseId) => {
    setCurrentCourse(courseId);
    setAppState('home');
  };

  // Home画面でチャンク（10問）かランダムかを選んだ時の処理
  const handleSelectMode = (modeType, value) => {
    let questions = [];
    let label = '';
    let id = '';

    if (modeType === 'chunk') {
      const start = value * 10;
      questions = questionsData.slice(start, start + 10);
      id = `chunk-${value}`;
      label = `Q${start + 1} - Q${Math.min(start + 10, questionsData.length)}`;
    } else if (modeType === 'random') {
      const count = value === 'ALL' ? questionsData.length : Math.min(value, questionsData.length);
      // ランダムにシャッフルして抽出
      questions = [...questionsData].sort(() => Math.random() - 0.5).slice(0, count);
      id = `random-${count}`;
      label = `ランダム特訓 ${count === questionsData.length ? '全問' : count + '問'}`;
    }

    setSelectedQuestions(questions);
    setCurrentMode({ type: modeType, id, label });
    // Settings（モード選択）画面へ遷移
    setAppState('settings'); 
  };

  // Settings画面から「じっくり」か「スパルタ」を選んでスタート
  const startGame = (selectedPlayMode) => {
    setPlayMode(selectedPlayMode || playMode);
    setCurrentIndex(0);
    setTimeLeft(TARGET_TIME);
    setIsFailed(false);
    setSessionResults([]);
    setAppState('play');
  };

  // --- 成績の記録と判定 ---
  const submitRecord = (isCorrect, timeTaken) => {
    const newResults = [...sessionResults, { isCorrect, timeTaken }];
    setSessionResults(newResults);

    if (currentIndex < selectedQuestions.length - 1) {
      // 次の問題へ
      setCurrentIndex(currentIndex + 1);
      setTimeLeft(TARGET_TIME);
    } else {
      // 全問終了！成績を保存してリザルト画面へ
      saveStats(newResults);
      setAppState('result');
    }
  };

  // LocalStorageへの成績保存ロジック
  const saveStats = (results) => {
    const correctCount = results.filter(r => r.isCorrect).length;
    const slaRate = Math.round((correctCount / results.length) * 100);
    
    const historyKey = `vocaDashHistory_${currentCourse}`;
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    history.push({
      date: new Date().toISOString(),
      modeId: currentMode.id,
      slaRate: slaRate,
      results: results
    });
    localStorage.setItem(historyKey, JSON.stringify(history));
  };

  const getChunkMasteryRate = (chunkIndex) => {
    const historyKey = `vocaDashHistory_${currentCourse}`;
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    const chunkId = `chunk-${chunkIndex}`;
    const chunkScores = history
      .filter(h => h.modeId === chunkId)
      .map(h => h.slaRate);
    return chunkScores.length > 0 ? Math.max(...chunkScores) : 0;
  };

  // リザルト画面用の平均解答時間の計算ロジック
  const calculateAverageTime = () => {
    if (sessionResults.length === 0) return 0;
    const validResults = sessionResults.filter(r => r.isCorrect);
    if (validResults.length === 0) return 0;
    const total = validResults.reduce((sum, record) => sum + record.timeTaken, 0);
    return (total / validResults.length / 1000).toFixed(1);
  };

  // --- レンダリング ---
  return (
    <div className="font-sans antialiased text-gray-900">
      
      {/* どの画面にいても一番上にガイドを重ねて表示できる */}
      <BrowserGuide />

      {appState === 'course_select' && (
        <CourseSelect onSelectCourse={onSelectCourse} />
      )}
      
      {appState === 'home' && (
        <Home 
          handleSelectMode={handleSelectMode} 
          currentCourse={currentCourse}
          courseTitle={COURSE_MAP[currentCourse]}
          goCourseSelect={goCourseSelect}
          questionsData={questionsData}
          getChunkMasteryRate={getChunkMasteryRate}
        />
      )}

      {appState === 'settings' && (
        <Settings 
          currentMode={currentMode}
          goHome={() => setAppState('home')}
          startGame={startGame}
        />
      )}
      
      {appState === 'play' && (
        <Play 
          playMode={playMode}
          currentIndex={currentIndex}
          selectedQuestions={selectedQuestions}
          currentQuestion={selectedQuestions[currentIndex]}
          timeLeft={timeLeft}
          targetTime={TARGET_TIME}
          isFailed={isFailed}
          submitRecord={submitRecord}
          handleFail={() => setIsFailed(true)}
          goHome={() => setAppState('home')}
          startGame={() => startGame(playMode)}
          calculateAverageTime={calculateAverageTime}
        />
      )}

      {appState === 'result' && (
        <Result 
          results={sessionResults}
          selectedQuestions={selectedQuestions}
          goHome={() => setAppState('home')}
          playMode={playMode}
          calculateAverageTime={calculateAverageTime}
          courseTitle={COURSE_MAP[currentCourse]}
          currentMode={currentMode}
        />
      )}
      
    </div>
  );
}

export default App;