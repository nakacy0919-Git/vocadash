import React, { useState, useEffect } from 'react';

import CourseSelect from './pages/CourseSelect';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Play from './pages/Play';
import Result from './pages/Result';

import regularQuestions from './data/questions.json';
import eikenPre2Questions from './data/eiken_pre2.json';
import eiken2Questions from './data/eiken_2.json';
import eikenPre1Questions from './data/eiken_pre1.json';
import eiken1Questions from './data/eiken_1.json';

const COURSE_DATA_MAP = {
  'regular': regularQuestions,
  'eiken_pre2': eikenPre2Questions,
  'eiken_2': eiken2Questions,
  'eiken_pre1': eikenPre1Questions,
  'eiken_1': eiken1Questions,
};

const COURSE_TITLE_MAP = {
  'regular': '定期考査 KICK OFF',
  'eiken_pre2': '英検 準2級',
  'eiken_2': '英検 2級',
  'eiken_pre1': '英検 準1級',
  'eiken_1': '英検 1級',
};

export default function App() {
  const [appState, setAppState] = useState('courseSelect');
  const [currentCourse, setCurrentCourse] = useState(null);
  const [questionsData, setQuestionsData] = useState([]);

  // ★ 追加: プレイモード（'study' または 'test'）
  const [playMode, setPlayMode] = useState('test');
  
  const [targetTime, setTargetTime] = useState(5000); 
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [currentMode, setCurrentMode] = useState({ type: '', id: '', label: '' });
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(targetTime); 
  const [isFailed, setIsFailed] = useState(false);
  const [sessionData, setSessionData] = useState([]);

  const [masteryData, setMasteryData] = useState({}); 
  const [chunkStats, setChunkStats] = useState({});   

  const handleCourseSelect = (courseId) => {
    setCurrentCourse(courseId);
    setQuestionsData(COURSE_DATA_MAP[courseId] || []);
    setAppState('home');
  };

  useEffect(() => {
    if (!currentCourse) return;
    const masteryKey = `vocaDashMastery_${currentCourse}`;
    const statsKey = `vocaDashChunkStats_${currentCourse}`;
    setMasteryData(JSON.parse(localStorage.getItem(masteryKey) || '{}'));
    setChunkStats(JSON.parse(localStorage.getItem(statsKey) || '{}'));
  }, [currentCourse, appState]);

  const currentQuestion = selectedQuestions[currentIndex];

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

  // タイマー処理（学習モードの場合はタイマーを動かさない）
  useEffect(() => {
    if (appState !== 'playing' || isFailed || playMode === 'study') return;
    if (timeLeft <= 0) {
      handleFail('timeout');
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 50), 50);
    return () => clearInterval(timer);
  }, [timeLeft, isFailed, appState, playMode]);

  const saveProgress = (finalSessionData) => {
    if (finalSessionData.length === 0) return; 

    const statsKey = `vocaDashChunkStats_${currentCourse}`;
    
    // 学習モードの場合、学習回数だけ増やしてSLAスコア（グラフ）は更新しない
    if (playMode === 'study') {
      if (currentMode.type === 'chunk') {
        const newStats = { ...chunkStats };
        if (!newStats[currentMode.id]) newStats[currentMode.id] = { playCount: 0 };
        newStats[currentMode.id].playCount += 1;
        setChunkStats(newStats);
        localStorage.setItem(statsKey, JSON.stringify(newStats));
      }
      return;
    }

    const masteryKey = `vocaDashMastery_${currentCourse}`;
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

  // 正解した時や、学習モードで「次へ」を押した時に呼ばれる
  const submitRecord = (isCorrect, timeTaken) => {
    const record = { id: currentQuestion.id, timeTaken, correct: isCorrect };
    const updatedSession = [...sessionData, record];
    setSessionData(updatedSession);

    // 学習モードなら間違えてもゲームオーバーにならない
    if (isCorrect || playMode === 'study') {
      if (currentIndex + 1 < selectedQuestions.length) {
        setCurrentIndex(prev => prev + 1);
        setTimeLeft(targetTime); 
      } else {
        saveProgress(updatedSession);
        setAppState('cleared');
      }
    } else {
      handleFail('wrong_choice');
    }
  };

  const getChunkMasteryRate = (chunkIndex) => {
    const start = chunkIndex * 10;
    const chunkQuestions = questionsData.slice(start, start + 10);
    if (chunkQuestions.length === 0) return 0;
    const totalScore = chunkQuestions.reduce((acc, q) => acc + (masteryData[q.id] || 0), 0);
    return Math.round(totalScore / chunkQuestions.length);
  };

  if (appState === 'courseSelect') return <CourseSelect onSelectCourse={handleCourseSelect} />;
  
  if (appState === 'home') return (
    <Home 
      handleSelectMode={handleSelectMode} 
      chunkStats={chunkStats} 
      getChunkMasteryRate={getChunkMasteryRate}
      currentCourse={currentCourse} 
      courseTitle={COURSE_TITLE_MAP[currentCourse]}
      goCourseSelect={() => setAppState('courseSelect')}
      questionsData={questionsData}
    />
  );

  if (appState === 'settings') return (
    <Settings 
      currentMode={currentMode} 
      setPlayMode={setPlayMode} 
      startGame={startGame} 
      goBack={() => setAppState('home')} 
    />
  );

  if (appState === 'cleared') return <Result goHome={() => setAppState('home')} />;

  if (appState === 'playing') return (
    <Play
      playMode={playMode}
      currentIndex={currentIndex}
      selectedQuestions={selectedQuestions}
      currentQuestion={currentQuestion}
      timeLeft={timeLeft}
      targetTime={targetTime}
      isFailed={isFailed}
      submitRecord={submitRecord}
      handleFail={handleFail}
      goHome={() => setAppState('home')}
      startGame={startGame}
      calculateAverageTime={() => sessionData.length ? (sessionData.reduce((a, b) => a + b.timeTaken, 0) / sessionData.length / 1000).toFixed(2) : 0}
    />
  );

  return null;
}