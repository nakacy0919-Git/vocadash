import React, { useState, useEffect } from 'react';
import questionsData from './data/questions.json';

import Home from './pages/Home';
import Settings from './pages/Settings';
import Play from './pages/Play';
import Result from './pages/Result';

export default function App() {
  const [appState, setAppState] = useState('home');
  const [targetTime, setTargetTime] = useState(5000); 
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [currentMode, setCurrentMode] = useState({ type: '', id: '', label: '' });
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(targetTime); 
  const [isFailed, setIsFailed] = useState(false);
  const [sessionData, setSessionData] = useState([]);

  const [masteryData, setMasteryData] = useState({}); 
  const [chunkStats, setChunkStats] = useState({});   

  useEffect(() => {
    const storedMastery = JSON.parse(localStorage.getItem('vocaDashMastery') || '{}');
    const storedStats = JSON.parse(localStorage.getItem('vocaDashChunkStats') || '{}');
    setMasteryData(storedMastery);
    setChunkStats(storedStats);
  }, [appState]);

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

  useEffect(() => {
    if (appState !== 'playing' || isFailed) return;
    
    if (timeLeft <= 0) {
      handleFail('timeout');
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 50);
    }, 50);
    
    return () => clearInterval(timer);
  }, [timeLeft, isFailed, appState]);

  // --- SLA視点を取り入れたデータ保存ロジック ---
  const saveProgress = (finalSessionData) => {
    const newMastery = { ...masteryData };
    let sessionTotalSLAScore = 0;

    finalSessionData.forEach(record => {
      let masteryScore = 0;
      
      if (record.correct) {
        const SLA_INSTANT_MS = 1000; // 1秒以内なら即答（100点）とみなす
        
        if (record.timeTaken <= SLA_INSTANT_MS) {
          masteryScore = 100;
        } else {
          // 1秒を超えた分だけペナルティ。制限時間ギリギリだと50点になる。
          const maxPenaltyTime = targetTime - SLA_INSTANT_MS;
          const penaltyTime = record.timeTaken - SLA_INSTANT_MS;
          masteryScore = 100 - Math.floor(50 * (penaltyTime / maxPenaltyTime));
        }
      }
      
      sessionTotalSLAScore += masteryScore;
      // 常に最新のスコアで上書き（忘却を表現）
      newMastery[record.id] = masteryScore;
    });

    setMasteryData(newMastery);
    localStorage.setItem('vocaDashMastery', JSON.stringify(newMastery));

    if (currentMode.type === 'chunk') {
      const newStats = { ...chunkStats };
      if (!newStats[currentMode.id]) newStats[currentMode.id] = { playCount: 0 };
      newStats[currentMode.id].playCount += 1;
      setChunkStats(newStats);
      localStorage.setItem('vocaDashChunkStats', JSON.stringify(newStats));
    }

    // グラフ用に今回のセッションの「平均SLAスコア」を履歴に保存
    const existingHistory = JSON.parse(localStorage.getItem('vocaDashHistory') || '[]');
    const sessionAverageSLA = finalSessionData.length > 0 
      ? Math.round(sessionTotalSLAScore / finalSessionData.length) 
      : 0;
    
    const newRecord = {
      date: new Date().toISOString(),
      targetTime: targetTime,
      slaRate: sessionAverageSLA, 
      details: finalSessionData
    };
    localStorage.setItem('vocaDashHistory', JSON.stringify([...existingHistory, newRecord]));
  };

  const handleFail = (reason = 'wrong_choice') => {
    setIsFailed(true);
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    
    const timeTaken = targetTime - Math.max(0, timeLeft);
    const record = { id: currentQuestion.id, timeTaken, correct: false, reason };
    const updatedSession = [...sessionData, record];
    
    setSessionData(updatedSession);
    saveProgress(updatedSession);
  };

  const handleAnswer = (selectedIndex) => {
    const timeTaken = targetTime - timeLeft; 
    const isCorrect = selectedIndex === currentQuestion?.correct;
    
    if (isCorrect) {
      const record = { id: currentQuestion.id, timeTaken, correct: true, reason: null };
      const updatedSession = [...sessionData, record];
      setSessionData(updatedSession);

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

  // チャンク内のSLAスコアの平均値を算出
  const getChunkMasteryRate = (chunkIndex) => {
    const start = chunkIndex * 10;
    const chunkQuestions = questionsData.slice(start, start + 10);
    let totalScore = 0;
    chunkQuestions.forEach(q => {
      totalScore += (masteryData[q.id] || 0);
    });
    return Math.round(totalScore / chunkQuestions.length) || 0;
  };

  const calculateAverageTime = () => {
    if (sessionData.length === 0) return 0;
    const total = sessionData.reduce((acc, curr) => acc + curr.timeTaken, 0);
    return (total / sessionData.length / 1000).toFixed(2);
  };

  if (appState === 'home') return <Home handleSelectMode={handleSelectMode} chunkStats={chunkStats} getChunkMasteryRate={getChunkMasteryRate} />;
  if (appState === 'settings') return <Settings currentMode={currentMode} targetTime={targetTime} setTargetTime={setTargetTime} startGame={startGame} goBack={() => setAppState('home')} />;
  if (appState === 'cleared') return <Result goHome={() => setAppState('home')} />;
  if (appState === 'playing') {
    return (
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
        calculateAverageTime={calculateAverageTime}
      />
    );
  }

  return null;
}