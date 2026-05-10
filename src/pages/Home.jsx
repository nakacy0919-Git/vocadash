import React, { useEffect, useState } from 'react';

export default function Home({ handleSelectMode, currentCourse, courseTitle, goCourseSelect, questionsData, getChunkMasteryRate }) {
  const [totalPlays, setTotalPlays] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [nextChunk, setNextChunk] = useState(null);
  const [remainingChunks, setRemainingChunks] = useState(0);

  const chunkCount = Math.ceil((questionsData?.length || 0) / 10);
  const chunks = Array.from({ length: chunkCount }, (_, i) => i);

  useEffect(() => {
    const historyKey = `vocaDashHistory_${currentCourse}`;
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    setTotalPlays(history.length);

    // --- 1. 全体定着率と次やるべきセクションの計算 ---
    let totalMastery = 0;
    let nextSuggested = null;
    let uncompletedCount = 0;

    chunks.forEach(chunkIndex => {
      const mastery = getChunkMasteryRate(chunkIndex);
      totalMastery += mastery;
      
      if (mastery < 100) {
        uncompletedCount++;
        // まだ100%になっていない最初のセクションを「次のミッション」にする
        if (nextSuggested === null) nextSuggested = chunkIndex;
      }
    });

    const avgProgress = chunks.length > 0 ? Math.round(totalMastery / chunks.length) : 0;
    setOverallProgress(avgProgress);
    setNextChunk(nextSuggested);
    setRemainingChunks(uncompletedCount);

    // --- 2. 連続学習日数（ストリーク）の計算 ---
    if (history.length > 0) {
      // YYYY-MM-DD の形式でユニークな日付のリストを作る
      const dates = [...new Set(history.map(h => {
        const d = new Date(h.date);
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      }))];
      
      dates.sort((a, b) => new Date(b) - new Date(a)); // 新しい順に並べる

      const todayObj = new Date();
      const today = `${todayObj.getFullYear()}-${todayObj.getMonth() + 1}-${todayObj.getDate()}`;
      
      const yesterdayObj = new Date();
      yesterdayObj.setDate(yesterdayObj.getDate() - 1);
      const yesterday = `${yesterdayObj.getFullYear()}-${yesterdayObj.getMonth() + 1}-${yesterdayObj.getDate()}`;

      let streak = 0;
      // 今日または昨日に学習していればストリーク継続
      if (dates[0] === today || dates[0] === yesterday) {
        streak = 1;
        let currentDateObj = new Date(dates[0]);
        for (let i = 1; i < dates.length; i++) {
          currentDateObj.setDate(currentDateObj.getDate() - 1);
          const expectedDate = `${currentDateObj.getFullYear()}-${currentDateObj.getMonth() + 1}-${currentDateObj.getDate()}`;
          if (dates[i] === expectedDate) {
            streak++;
          } else {
            break;
          }
        }
      }
      setStreakDays(streak);
    }
  }, [currentCourse, questionsData]);

  // --- 3. 定着率に応じたランク（称号）の判定 ---
  const getRankInfo = (progress) => {
    if (progress === 100) return { title: 'レジェンド', icon: '👑', color: 'text-yellow-500', bg: 'bg-gradient-to-br from-yellow-100 to-amber-100', border: 'border-yellow-300' };
    if (progress >= 80) return { title: 'マスター', icon: '⭐', color: 'text-blue-500', bg: 'bg-gradient-to-br from-blue-50 to-blue-100', border: 'border-blue-200' };
    if (progress >= 50) return { title: 'チャレンジャー', icon: '🔥', color: 'text-rose-500', bg: 'bg-gradient-to-br from-rose-50 to-rose-100', border: 'border-rose-200' };
    if (progress >= 20) return { title: 'ラーナー', icon: '🌱', color: 'text-green-500', bg: 'bg-gradient-to-br from-green-50 to-green-100', border: 'border-green-200' };
    return { title: 'ビギナー', icon: '🐣', color: 'text-gray-500', bg: 'bg-white', border: 'border-gray-200' };
  };

  const rank = getRankInfo(overallProgress);

  return (
    <div className="h-screen w-screen bg-macaron-gradient p-4 md:p-8 flex flex-col items-center overflow-y-auto custom-scrollbar font-sans pb-20">
      <div className="w-full max-w-3xl">
        
        {/* --- ヘッダー領域 --- */}
        <header className="mb-6 mt-2 relative animate-fadeIn">
          <button 
            onClick={goCourseSelect}
            className="mb-4 text-xs font-black text-gray-500 bg-white/60 px-5 py-2 rounded-full hover:bg-white transition-all shadow-sm border border-white/80 active:scale-95 flex items-center gap-2"
          >
            ← コース選択に戻る
          </button>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-white/40 pb-4">
            <div>
              <p className="text-[10px] font-black text-blue-500 mb-1 tracking-[0.2em] uppercase">Learning Dashboard</p>
              <h1 className="text-3xl md:text-4xl font-black text-gray-700 tracking-tighter drop-shadow-sm">
                {courseTitle}
              </h1>
            </div>
          </div>
        </header>

        {/* --- ステータス・ダッシュボード（RPG風） --- */}
        <section className="glass-panel-light rounded-[2rem] p-6 mb-8 border border-white/60 shadow-xl relative overflow-hidden animate-fadeIn delay-100">
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-sm font-black text-gray-400 tracking-widest uppercase mb-1">現在のランク</h2>
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${rank.bg} ${rank.border} shadow-sm`}>
                <span className="text-xl">{rank.icon}</span>
                <span className={`font-black text-lg tracking-tight ${rank.color}`}>{rank.title}</span>
              </div>
            </div>

            <div className="text-right">
              <h2 className="text-sm font-black text-gray-400 tracking-widest uppercase mb-1">連続学習</h2>
              <div className="inline-flex items-center gap-1.5">
                <span className={`text-2xl ${streakDays > 0 ? 'animate-bounce' : 'opacity-50'}`}>🔥</span>
                <span className="text-2xl font-black text-gray-700 leading-none">{streakDays}</span>
                <span className="text-xs font-bold text-gray-500">days</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="font-black text-gray-600">全体定着率</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-black tracking-tighter ${overallProgress === 100 ? 'text-green-500' : 'text-blue-500'}`}>{overallProgress}</span>
                <span className="text-lg font-bold text-gray-400">%</span>
              </div>
            </div>
            
            {/* メインプログレスバー */}
            <div className="w-full bg-white/50 h-6 rounded-full overflow-hidden shadow-inner p-1 border border-white">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm relative overflow-hidden
                  ${overallProgress === 100 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-blue-400 to-indigo-500'}`} 
                style={{ width: `${overallProgress}%` }}
              >
                {/* プログレスバー内のキラキラアニメーション */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer"></div>
              </div>
            </div>
          </div>
        </section>

        {/* --- 次のミッション（ナビゲーション） --- */}
        {remainingChunks > 0 && nextChunk !== null ? (
          <section className="mb-10 animate-fadeIn delay-200">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-6 text-white shadow-[0_15px_30px_-10px_rgba(99,102,241,0.5)] relative overflow-hidden border border-indigo-400/50">
              <div className="absolute right-0 top-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎯</span>
                  <h3 className="font-black text-lg tracking-widest uppercase text-indigo-100">Next Mission</h3>
                </div>
                <h4 className="font-black text-2xl md:text-3xl mb-4 leading-tight">
                  100%定着まで<br />あと <span className="text-yellow-300 text-4xl">{remainingChunks}</span> セクション！
                </h4>
                <p className="font-medium text-indigo-100 mb-6 text-sm">
                  未クリアの問題が残っています。<br/>
                  まずは「Section {(nextChunk + 1).toString().padStart(2, '0')}」をマスターしよう！
                </p>
                <button 
                  onClick={() => handleSelectMode('chunk', nextChunk)} 
                  className="w-full bg-white text-indigo-600 font-black text-lg py-4 rounded-2xl active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  🚀 Section {(nextChunk + 1).toString().padStart(2, '0')} に挑戦
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="mb-10 animate-fadeIn delay-200">
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-[2rem] p-6 text-white shadow-[0_15px_30px_-10px_rgba(52,211,153,0.5)] text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')] opacity-30"></div>
              <div className="relative z-10">
                <span className="text-6xl block mb-4 animate-bounce">🏆</span>
                <h3 className="font-black text-2xl md:text-3xl mb-2">全セクション クリア！</h3>
                <p className="font-bold text-green-100">
                  おめでとうございます！100%定着を達成しました。<br/>
                  今後は「ランダム特訓」で忘却を防ぎましょう！
                </p>
              </div>
            </div>
          </section>
        )}

        {/* --- セクション学習（各チャンクの進捗） --- */}
        <section className="mb-10 animate-fadeIn delay-300">
          <h2 className="text-xl font-black text-gray-700 mb-4 flex items-center gap-2">
            📚 セクション別 定着度
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {chunks.map(chunkIndex => {
              const masteryRate = getChunkMasteryRate(chunkIndex);
              const startQ = chunkIndex * 10 + 1;
              const endQ = Math.min(chunkIndex * 10 + 10, questionsData.length);
              const isCleared = masteryRate === 100;

              return (
                <button 
                  key={chunkIndex}
                  onClick={() => handleSelectMode('chunk', chunkIndex)}
                  className={`
                    group relative bg-white/70 backdrop-blur-md p-5 rounded-3xl flex flex-col text-left 
                    transition-all duration-300 hover:bg-white border border-white shadow-sm hover:shadow-md
                    active:scale-[0.98] overflow-hidden
                  `}
                >
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                      <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Section {(chunkIndex + 1).toString().padStart(2, '0')}</span>
                      <h3 className="font-black text-xl text-gray-700 tracking-tighter">Q{startQ} - Q{endQ}</h3>
                    </div>
                    {isCleared && (
                      <span className="w-8 h-8 bg-yellow-100 flex items-center justify-center rounded-full text-sm shadow-inner border border-yellow-200">👑</span>
                    )}
                  </div>

                  <div className="w-full mt-auto relative z-10">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                      <span className="text-gray-400">定着度</span>
                      <span className={isCleared ? "text-green-500" : "text-blue-500"}>{masteryRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isCleared ? 'bg-green-400' : 'bg-blue-400'}`} 
                        style={{ width: `${masteryRate}%` }}
                      ></div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* --- ランダム特訓モード --- */}
        <section className="mb-8 animate-fadeIn delay-400">
           <h2 className="text-xl font-black text-gray-700 mb-4 flex items-center gap-2">
            🎲 ランダム特訓（総復習）
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {[10, 20, 'ALL'].map((val) => (
              <button
                key={val}
                onClick={() => handleSelectMode('random', val)}
                className="bg-white/80 backdrop-blur-sm border border-white/60 p-4 rounded-3xl shadow-sm hover:shadow-md active:scale-95 transition-all text-center flex flex-col items-center justify-center gap-1"
              >
                <span className="text-3xl font-black text-rose-500 drop-shadow-sm">{val === 'ALL' ? '∞' : val}</span>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{val === 'ALL' ? '全問テスト' : '問テスト'}</span>
              </button>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}