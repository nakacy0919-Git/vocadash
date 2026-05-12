import React, { useState, useEffect } from 'react';
import CourseSelect from './pages/CourseSelect';
import StageSelect from './pages/StageSelect';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Play from './pages/Play';
import Result from './pages/Result';
import BrowserGuide from './components/BrowserGuide';

// ▼ 修正①：定期考査（regular）のデータだけは従来通り最初に読み込んでおく
import regularData from './data/regular.json';

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
  const [currentStage, setCurrentStage] = useState(null); 
  
  const [questionsData, setQuestionsData] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [currentMode, setCurrentMode] = useState(null); 
  const [playMode, setPlayMode] = useState('study'); 
  
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [targetTime, setTargetTime] = useState(10000); 
  const [timeLeft, setTimeLeft] = useState(10000);
  const [isFailed, setIsFailed] = useState(false);
  const [sessionResults, setSessionResults] = useState([]);

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
    setCurrentStage(null);
    setAppState('course_select');
  };

  // ▼ 修正②：コース選択時の条件分岐
  const onSelectCourse = (courseId) => {
    setCurrentCourse(courseId);
    if (courseId === 'regular') {
      // 定期考査の場合はステージ選択をスキップして即ホーム画面へ
      setQuestionsData(regularData);
      setCurrentStage(null);
      setAppState('home');
    } else {
      // 英検の場合はステージ選択画面へ
      setAppState('stage_select');
    }
  };

  // ▼ 修正③：ホーム画面からの「戻る」ボタンの条件分岐
  const goStageSelect = () => {
    if (currentCourse === 'regular') {
      goCourseSelect(); // 定期考査ならコース選択へ戻る
    } else {
      setCurrentStage(null);
      setAppState('stage_select'); // 英検ならステージ選択へ戻る
    }
  };

  // 英検のステージを選択した際の処理（JSONの動的読み込み）
  const onSelectStage = async (stageNum) => {
    setCurrentStage(stageNum);
    try {
      const module = await import(`./data/${currentCourse}_stage${stageNum}.json`);
      setQuestionsData(module.default || module);
      setAppState('home');
    } catch (error) {
      console.error("データの読み込みに失敗しました:", error);
      alert(`Stage ${stageNum} のデータがまだありません。`);
    }
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
      setTimeLeft(targetTime); 
    } else {
      saveStats(newResults);
      setAppState('result');
    }
  };

  // ▼ 修正④：保存先キーの分岐（定期考査は従来通り、英検はStage別）
  const saveStats = (results) => {
    const correctCount = results.filter(r => r.isCorrect).length;
    const slaRate = Math.round((correctCount / results.length) * 100);
    
    const historyKey = currentCourse === 'regular' 
      ? `vocaDashHistory_${currentCourse}` 
      : `vocaDashHistory_${currentCourse}_stage${currentStage}`;
      
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    history.push({
      date: new Date().toISOString(),
      modeId: currentMode.id,
      slaRate: slaRate,
      results: results
    });
    localStorage.setItem(historyKey, JSON.stringify(history));
  };

  // ▼ 修正⑤：取得先キーの分岐
  const getChunkMasteryRate = (chunkIndex) => {
    const historyKey = currentCourse === 'regular' 
      ? `vocaDashHistory_${currentCourse}` 
      : `vocaDashHistory_${currentCourse}_stage${currentStage}`;
      
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

  // ▼ 修正⑥：画面タイトルの出し分け（定期考査はStage表示なし）
  const getDisplayTitle = () => {
    return currentCourse === 'regular' 
      ? COURSE_MAP[currentCourse] 
      : `${COURSE_MAP[currentCourse]} - Stage ${currentStage}`;
  };

  return (
    <div className="font-sans antialiased text-gray-900">
      <BrowserGuide />
      
      {appState === 'course_select' && (
        <CourseSelect onSelectCourse={onSelectCourse} />
      )}

      {appState === 'stage_select' && (
        <StageSelect 
          currentCourse={currentCourse} 
          onSelectStage={onSelectStage}
          goBack={goCourseSelect} 
        />
      )}

      {appState === 'home' && (
        <Home 
          handleSelectMode={handleSelectMode} 
          currentCourse={currentCourse}
          courseTitle={getDisplayTitle()}
          goCourseSelect={goStageSelect} 
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
          targetTime={targetTime}
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
          courseTitle={getDisplayTitle()}
          currentMode={currentMode}
        />
      )}
    </div>
  );
}

export default App;