import React, { useState, useEffect } from 'react';
import CourseSelect from './pages/CourseSelect';
import StageSelect from './pages/StageSelect';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Play from './pages/Play';
import Result from './pages/Result';
import BrowserGuide from './components/BrowserGuide';

// 定期考査のデータ
import regularData from './data/regular.json';
import regular2Data from "./data/regular2.json"; // ← ★第2回のデータを追加
// Lesson取りまとめファイルを読み込む
import { readingLessons } from './data/lessons';

const COURSE_MAP = {
  regular: '第1回 定期対策 KICK OFF', // ★画面表示が分かりやすいように名前を調整しました
  regular2: '第2回 定期対策 KICK OFF', // ★追加
  eiken_pre2: '英検 準2級',
  eiken_2: '英検 2級',
  eiken_pre1: '英検 準1級',
  eiken_1: '英検 1級',
  reading: '業後補習用（長文読解）',
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

  useEffect(() => {
    let timer;
    if (appState === 'play' && playMode === 'test' && !isFailed) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 100) {
            setIsFailed(true); 
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

  // ▼ 修正：コース選択時の分岐（定期考査を選んだらサブメニューへ）
  const onSelectCourse = (courseId) => {
    if (courseId === 'regular') {
      setAppState('regular_select'); // 第1回・第2回の選択画面へ
    } else if (courseId === 'reading') {
      setCurrentCourse(courseId);
      setAppState('lesson_select');
    } else {
      setCurrentCourse(courseId);
      setAppState('stage_select');
    }
  };

  // ▼ 新規追加：定期考査の第1回・第2回が選ばれたときの処理
  const onSelectRegular = (type) => {
    setCurrentCourse(type);
    if (type === 'regular') {
      setQuestionsData(regularData);
    } else if (type === 'regular2') {
      setQuestionsData(regular2Data);
    }
    setCurrentStage(null);
    setAppState('home');
  };

  // ▼ 修正：戻るボタンの分岐（定期考査ならサブメニューへ戻る）
  const goStageSelect = () => {
    if (currentCourse === 'regular' || currentCourse === 'regular2') {
      setAppState('regular_select');
    } else if (currentCourse === 'reading') {
      setCurrentStage(null);
      setAppState('lesson_select');
    } else {
      setCurrentStage(null);
      setAppState('stage_select');
    }
  };

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

  const onSelectLesson = (lessonNum) => {
    setCurrentStage(lessonNum); 
    setQuestionsData(readingLessons[lessonNum]);
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

  // ▼ 修正：保存と取得用のキーに regular2 を追加
  const getHistoryKey = () => {
    if (currentCourse === 'regular') return `vocaDashHistory_regular`;
    if (currentCourse === 'regular2') return `vocaDashHistory_regular2`;
    if (currentCourse === 'reading') return `vocaDashHistory_reading_lesson${currentStage}`;
    return `vocaDashHistory_${currentCourse}_stage${currentStage}`;
  };

  const saveStats = (results) => {
    const correctCount = results.filter(r => r.isCorrect).length;
    const slaRate = Math.round((correctCount / results.length) * 100);
    const historyKey = getHistoryKey();
      
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
    const historyKey = getHistoryKey();
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

  // ▼ 修正：画面タイトルの出し分けに regular2 を追加
  const getDisplayTitle = () => {
    if (currentCourse === 'regular' || currentCourse === 'regular2') return COURSE_MAP[currentCourse];
    if (currentCourse === 'reading') return `${COURSE_MAP[currentCourse]} - Lesson ${currentStage}`;
    return `${COURSE_MAP[currentCourse]} - Stage ${currentStage}`;
  };

  return (
    <div className="font-sans antialiased text-gray-900">
      <BrowserGuide />
      
      {appState === 'course_select' && (
        <CourseSelect onSelectCourse={onSelectCourse} />
      )}

      {/* ▼ 新規追加：定期考査専用の選択画面 */}
      {appState === 'regular_select' && (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-gray-800">
          <h2 className="text-2xl font-bold mb-6 text-blue-600">定期考査対策 - コース選択</h2>
          <div className="flex flex-col gap-4 w-full max-w-md">
            <button
              onClick={() => onSelectRegular('regular')}
              className="bg-white border-2 border-blue-500 text-blue-600 font-bold py-4 rounded-xl shadow-sm hover:bg-blue-50 transition"
            >
              第1回 定期対策
            </button>
            <button
              onClick={() => onSelectRegular('regular2')}
              className="bg-white border-2 border-blue-500 text-blue-600 font-bold py-4 rounded-xl shadow-sm hover:bg-blue-50 transition"
            >
              第2回 定期対策
            </button>
          </div>
          <button
            onClick={goCourseSelect}
            className="mt-8 text-gray-500 underline"
          >
            コース選択に戻る
          </button>
        </div>
      )}

      {/* 長文読解専用のLesson選択画面 */}
      {appState === 'lesson_select' && (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-gray-800">
          <h2 className="text-2xl font-bold mb-6 text-teal-600">業後補習用 - Lesson選択</h2>
          <div className="grid grid-cols-2 gap-4 w-full max-w-md h-[60vh] overflow-y-auto pr-2 pb-4">
            {/* ※スクロールできるように overflow-y-auto などを追加しています */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(num => (
              <button
                key={num}
                onClick={() => onSelectLesson(num)}
                className="bg-white border-2 border-teal-500 text-teal-600 font-bold py-4 rounded-xl shadow-sm hover:bg-teal-50 transition"
              >
                Lesson {num}
              </button>
            ))}
          </div>
          <button
            onClick={goCourseSelect}
            className="mt-6 text-gray-500 underline"
          >
            コース選択に戻る
          </button>
        </div>
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