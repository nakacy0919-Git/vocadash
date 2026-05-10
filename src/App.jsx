import React, { useState, useEffect } from 'react';
import CourseSelect from './pages/CourseSelect';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Play from './pages/Play';
import Result from './pages/Result';
import BrowserGuide from './components/BrowserGuide';

// ▼ 修正①：本番環境（GitHub Pages）でデータが消えないように、最初からすべてのJSONを読み込んでおく
import regularData from './data/regular.json';
import eikenPre2Data from './data/eiken_pre2.json';
import eiken2Data from './data/eiken_2.json';
import eikenPre1Data from './data/eiken_pre1.json';
import eiken1Data from './data/eiken_1.json';

// コースIDと読み込んだデータを紐づける
const COURSE_DATA_MAP = {
  'regular': regularData,
  'eiken_pre2': eikenPre2Data,
  'eiken_2': eiken2Data,
  'eiken_pre1': eikenPre1Data,
  'eiken_1': eiken1Data,
};

const COURSE_MAP = {
  regular: '定期考査 KICK OFF',
  eiken_pre2: '英検 準2級',
  eiken_2: '英検 2級',
  eiken_pre1: '英検 準1級',
  eiken_1: '英検 1級',
};

function App() {
  const [appState, setAppState] = useState('course_select'); 
  
  const [currentCourse, setCurrentCourse] = useState(null);
  const [questionsData, setQuestionsData] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [currentMode, setCurrentMode] = useState(null); 
  const [playMode, setPlayMode] = useState('study'); 
  
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // ▼ 修正②：スパルタモードの解答時間を固定（10000）から可変（State）に変更
  const [targetTime, setTargetTime] = useState(10000); 
  const [timeLeft, setTimeLeft] = useState(10000);
  const [isFailed, setIsFailed] = useState(false);
  const [sessionResults, setSessionResults] = useState([]);

  useEffect(() => {
    if (currentCourse) {
      // 確実に取り込んだデータからセットする
      setQuestionsData(COURSE_DATA_MAP[currentCourse] || []);
    }
  }, [currentCourse]);

  // タイマー処理
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

  const goCourseSelect = () => {
    setCurrentCourse(null);
    setAppState('course_select');
  };

  const onSelectCourse = (courseId) => {
    setCurrentCourse(courseId);
    setAppState('home');
  };

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
      questions = [...questionsData].sort(() => Math.random() - 0.5).slice(0, count);
      id = `random-${count}`;
      label = `ランダム特訓 ${count === questionsData.length ? '全問' : count + '問'}`;
    }

    setSelectedQuestions(questions);
    setCurrentMode({ type: modeType, id, label });
    setAppState('settings'); 
  };

  // ▼ 修正③：Settings画面から、ユーザーが設定した「秒数」を受け取れるようにする
  const startGame = (selectedPlayMode, selectedTimeMs = null) => {
    const time = selectedTimeMs || targetTime;
    setPlayMode(selectedPlayMode);
    setTargetTime(time);
    setCurrentIndex(0);
    setTimeLeft(time);
    setIsFailed(false);
    setSessionResults([]);
    setAppState('play');
  };

  const submitRecord = (isCorrect, timeTaken) => {
    const newResults = [...sessionResults, { isCorrect, timeTaken }];
    setSessionResults(newResults);

    if (currentIndex < selectedQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setTimeLeft(targetTime); // ターゲット時間を復元
    } else {
      saveStats(newResults);
      setAppState('result');
    }
  };

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

  const calculateAverageTime = () => {
    if (sessionResults.length === 0) return 0;
    const validResults = sessionResults.filter(r => r.isCorrect);
    if (validResults.length === 0) return 0;
    const total = validResults.reduce((sum, record) => sum + record.timeTaken, 0);
    return (total / validResults.length / 1000).toFixed(1);
  };

  return (
    <div className="font-sans antialiased text-gray-900">
      <BrowserGuide />
      {appState === 'course_select' && <CourseSelect onSelectCourse={onSelectCourse} />}
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
          targetTime={targetTime} // 可変のターゲット時間をPlayに渡す
          isFailed={isFailed}
          submitRecord={submitRecord}
          handleFail={() => setIsFailed(true)}
          goHome={() => setAppState('home')}
          startGame={() => startGame(playMode, targetTime)}
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