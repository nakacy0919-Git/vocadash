import React, { useState, useEffect } from 'react';

// 分割した画面コンポーネントを読み込む
import CourseSelect from './pages/CourseSelect';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Play from './pages/Play';
import Result from './pages/Result';

// 各コースの問題データを読み込む（ファイルを用意したらここに追加）
import regularQuestions from './data/questions.json';
// import eikenPre2Questions from './data/eiken_pre2.json';
// import eiken2Questions from './data/eiken_2.json';

// コースIDとデータのマッピング
const COURSE_DATA_MAP = {
  'regular': regularQuestions,
  // 'eiken_pre2': eikenPre2Questions,
  // 'eiken_2': eiken2Questions,
};

export default function App() {
  // アプリの画面状態: 'courseSelect', 'home', 'settings', 'playing', 'cleared'
  const [appState, setAppState] = useState('courseSelect');
  
  // 現在選択中のコース情報
  const [currentCourse, setCurrentCourse] = useState(null);
  const [questionsData, setQuestionsData] = useState([]);

  // ゲーム設定・プレイ状態
  const [targetTime, setTargetTime] = useState(5000); 
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [currentMode, setCurrentMode] = useState({ type: '', id: '', label: '' });
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(targetTime); 
  const [isFailed, setIsFailed] = useState(false);
  const [sessionData, setSessionData] = useState([]);

  // 学習記録（LocalStorageと同期）
  const [masteryData, setMasteryData] = useState({}); 
  const [chunkStats, setChunkStats] = useState({});   

  // 1. コースが選択された時の処理
  const handleCourseSelect = (courseId) => {
    setCurrentCourse(courseId);
    setQuestionsData(COURSE_DATA_MAP[courseId] || []);
    setAppState('home');
  };

  // 2. 学習データの読み込み（コース切り替え時や画面遷移時に実行）
  useEffect(() => {
    if (!currentCourse) return;
    
    // コースごとに個別の保存キーを使用する
    const masteryKey = `vocaDashMastery_${currentCourse}`;
    const statsKey = `vocaDashChunkStats_${currentCourse}`;
    
    setMasteryData(JSON.parse(localStorage.getItem(masteryKey) || '{}'));
    setChunkStats(JSON.parse(localStorage.getItem(statsKey) || '{}'));
  }, [currentCourse, appState]);

  const currentQuestion = selectedQuestions[currentIndex];

  // 3. モード選択（チャンク or ランダム）
  const handleSelectMode = (modeType, value) => {
    let questions = [];
    let label = '';
    let id = '';

    if (modeType === 'chunk') {
      const start = value * 10;
      questions = questionsData.slice(start, start + 10);
      id = `${start + 1}-${start + 10}`;
      label = `Q${start + 1} - Q${start + 10}`;
    } else if (modeType === 'random') {
      questions = [...questionsData].sort(() => 0.5 - Math.random()).slice(0, value);
      id = `random-${value}`;
      label = `ランダム ${value}問`;
    }

    setSelectedQuestions(questions);
    setCurrentMode({ type: modeType, id, label });
    setAppState('settings'); 
  };

  const startGame = () => {
    setCurrentIndex(0);
    setTimeLeft(targetTime);
    setIsFailed(false);
    setSessionData([]);
    setAppState('playing');
  };

  // 4. タイマーロジック
  useEffect(() => {
    if (appState !== 'playing' || isFailed) return;
    if (timeLeft <= 0) {
      handleFail('timeout');
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 50), 50);
    return () => clearInterval(timer);
  }, [timeLeft, isFailed, appState]);

  // 5. SLAベースの保存ロジック
  const saveProgress = (finalSessionData) => {
    const masteryKey = `vocaDashMastery_${currentCourse}`;
    const statsKey = `vocaDashChunkStats_${currentCourse}`;
    const historyKey = `vocaDashHistory_${currentCourse}`;

    const newMastery = { ...masteryData };
    let sessionTotalSLAScore = 0;

    finalSessionData.forEach(record => {
      let masteryScore = 0;
      if (record.correct) {
        const SLA_INSTANT_MS = 1000;
        if (record.timeTaken <= SLA_INSTANT_MS) {
          masteryScore = 100;
        } else {
          const penaltyRatio = (record.timeTaken - SLA_INSTANT_MS) / (targetTime - SLA_INSTANT_MS);
          masteryScore = 100 - Math.floor(50 * penaltyRatio);
        }
      }
      sessionTotalSLAScore += masteryScore;
      newMastery[record.id] = masteryScore;
    });

    setMasteryData(newMastery);
    localStorage.setItem(masteryKey, JSON.stringify(newMastery));

    if (currentMode.type === 'chunk') {
      const newStats = { ...chunkStats };
      if (!newStats[currentMode.id]) newStats[currentMode.id] = { playCount: 0 };
      newStats[currentMode.id].playCount += 1;
      setChunkStats(newStats);
      localStorage.setItem(statsKey, JSON.stringify(newStats));
    }

    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    const slaRate = Math.round(sessionTotalSLAScore / finalSessionData.length) || 0;
    localStorage.setItem(historyKey, JSON.stringify([...history, {
      date: new Date().toISOString(),
      slaRate,
      details: finalSessionData
    }]));
  };

  const handleFail = (reason) => {
    setIsFailed(true);
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    const updatedSession = [...sessionData, { id: currentQuestion.id, timeTaken: targetTime - timeLeft, correct: false, reason }];
    setSessionData(updatedSession);
    saveProgress(updatedSession);
  };

  const handleAnswer = (selectedIndex) => {
    const isCorrect = selectedIndex === currentQuestion?.correct;
    const record = { id: currentQuestion.id, timeTaken: targetTime - timeLeft, correct: isCorrect };
    const updatedSession = [...sessionData, record];
    
    if (isCorrect) {
      setSessionData(updatedSession);
      if (currentIndex + 1 < selectedQuestions.length) {
        setCurrentIndex(prev => prev + 1);
        setTimeLeft(targetTime); 
      } else {
        saveProgress(updatedSession);
        setAppState('cleared');
      }
    } else {
      setSessionData(updatedSession);
      saveProgress(updatedSession);
      setIsFailed(true);
    }
  };

  const getChunkMasteryRate = (chunkIndex) => {
    const start = chunkIndex * 10;
    const chunkQuestions = questionsData.slice(start, start + 10);
    if (chunkQuestions.length === 0) return 0;
    const totalScore = chunkQuestions.reduce((acc, q) => acc + (masteryData[q.id] || 0), 0);
    return Math.round(totalScore / chunkQuestions.length);
  };

  // --- 画面分岐 ---
  if (appState === 'courseSelect') return <CourseSelect onSelectCourse={handleCourseSelect} />;
  
  if (appState === 'home') return (
    <Home 
      handleSelectMode={handleSelectMode} 
      chunkStats={chunkStats} 
      getChunkMasteryRate={getChunkMasteryRate}
      currentCourse={currentCourse} // グラフ用
    />
  );

  if (appState === 'settings') return (
    <Settings 
      currentMode={currentMode} 
      targetTime={targetTime} 
      setTargetTime={setTargetTime} 
      startGame={startGame} 
      goBack={() => setAppState('home')} 
    />
  );

  if (appState === 'cleared') return <Result goHome={() => setAppState('home')} />;

  if (appState === 'playing') return (
    <Play
      currentIndex={currentIndex}
      selectedQuestions={selectedQuestions}
      currentQuestion={currentQuestion}
      timeLeft={timeLeft}
      targetTime={targetTime}
      isFailed={isFailed}
      handleAnswer={handleAnswer}
      goHome={() => setAppState('home')}
      startGame={startGame}
      calculateAverageTime={() => (sessionData.reduce((a, b) => a + b.timeTaken, 0) / sessionData.length / 1000).toFixed(2)}
    />
  );

  return null;
}