import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Home({ handleSelectMode, chunkStats, getChunkMasteryRate, currentCourse, courseTitle, goCourseSelect, questionsData }) {
  const [chartData, setChartData] = useState([]);
  const [totalPlays, setTotalPlays] = useState(0);

  useEffect(() => {
    const historyKey = `vocaDashHistory_${currentCourse}`;
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    setTotalPlays(history.length);

    const formattedData = history.slice(-10).map((session, index) => {
      const dateStr = new Date(session.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
      return {
        name: `${index + 1}回目`,
        date: dateStr,
        rate: session.slaRate || 0, 
      };
    });
    setChartData(formattedData);
  }, [currentCourse]);

  const chunks = Array.from({ length: Math.ceil((questionsData?.length || 0) / 10) }, (_, i) => i);

  return (
    <div className="h-screen w-screen bg-macaron-gradient p-4 md:p-8 flex flex-col items-center overflow-y-auto custom-scrollbar">
      <div className="w-full max-w-3xl">
        
        <header className="mb-8 mt-4 relative">
          <button 
            onClick={goCourseSelect}
            className="mb-4 text-sm font-bold text-gray-500 bg-white/50 px-4 py-2 rounded-full hover:bg-white transition-colors shadow-sm flex items-center"
          >
            ← コース選択に戻る
          </button>
          
          <div className="flex justify-between items-end border-b-2 border-gray-200/50 pb-4">
            <div>
              <p className="text-sm font-bold text-blue-400 mb-1 tracking-widest uppercase">VocaDash</p>
              <h1 className="text-3xl md:text-4xl font-black text-gray-700 tracking-tight">
                {courseTitle}
              </h1>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400">総学習回数</p>
              <p className="text-2xl font-black text-gray-700">{totalPlays} <span className="text-sm font-medium text-gray-400">回</span></p>
            </div>
          </div>
        </header>

        {/* 成長グラフエリア */}
        <div className="glass-panel-light rounded-3xl p-6 mb-10 border border-white/60 shadow-lg">
          <h2 className="text-lg font-bold text-gray-600 mb-4 flex items-center">
            <span className="text-xl mr-2">📈</span> 最近のSLAスコア（直近10回）
          </h2>
          {chartData.length > 0 ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)' }}
                    formatter={(value) => [`${value}点`, 'SLAスコア']}
                  />
                  <Line type="monotone" dataKey="rate" stroke="#60A5FA" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 font-bold bg-white/40 rounded-2xl border-2 border-dashed border-gray-300/50">
              まだ学習データがありません
            </div>
          )}
        </div>

        {/* ★ 新設：ランダム特訓エリア */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-600 mb-4 flex items-center">
            <span className="bg-rose-400 text-white w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm shadow-md">1</span>
            ランダム特訓（総数: {questionsData.length}問）
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {[10, 20, 'ALL'].map((val) => (
              <button
                key={val}
                onClick={() => handleSelectMode('random', val === 'ALL' ? questionsData.length : val)}
                className="group relative bg-white/80 p-6 rounded-3xl text-center active:scale-95 transition-all shadow-md hover:shadow-lg border border-white"
              >
                <div className="absolute inset-1.5 border-2 border-dashed border-rose-200/40 rounded-2xl pointer-events-none"></div>
                <span className="block text-2xl font-black text-gray-700">{val}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Questions</span>
              </button>
            ))}
          </div>
        </div>

        {/* 基礎トレーニングエリア */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-600 mb-4 flex items-center">
            <span className="bg-blue-400 text-white w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm shadow-md">2</span>
            セクション学習（10問ずつ）
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {chunks.map(chunkIndex => {
              const chunkId = `${chunkIndex * 10 + 1}-${chunkIndex * 10 + 10}`;
              const masteryRate = getChunkMasteryRate(chunkIndex);
              const startQ = chunkIndex * 10 + 1;
              const endQ = Math.min(chunkIndex * 10 + 10, questionsData.length);

              return (
                <button 
                  key={chunkIndex}
                  onClick={() => handleSelectMode('chunk', chunkIndex)}
                  className="glass-panel-light p-5 rounded-3xl flex flex-col text-left active:scale-[0.98] transition-all hover:bg-white/80 relative overflow-hidden shadow-sm"
                >
                  <div className="absolute inset-1.5 border-2 border-dashed border-blue-200/20 rounded-2xl pointer-events-none"></div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-extrabold text-xl text-gray-700 tracking-tight">Q{startQ} - Q{endQ}</span>
                    {masteryRate === 100 && <span className="text-xl">👑</span>}
                  </div>
                  <div className="w-full mt-auto">
                    <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                      <span>SLAスコア</span>
                      <span className={masteryRate === 100 ? "text-green-500 font-black" : "text-blue-500"}>{masteryRate}点</span>
                    </div>
                    <div className="w-full bg-gray-200/50 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${masteryRate === 100 ? 'bg-green-400' : 'bg-blue-400'} transition-all duration-700`} style={{ width: `${masteryRate}%` }}></div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}