import React, { useEffect, useState } from 'react';
import questionsData from '../data/questions.json';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Home({ handleSelectMode, chunkStats, getChunkMasteryRate }) {
  const [chartData, setChartData] = useState([]);
  const [totalPlays, setTotalPlays] = useState(0);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('vocaDashHistory') || '[]');
    setTotalPlays(history.length);

    const formattedData = history.slice(-10).map((session, index) => {
      const dateStr = new Date(session.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
      return {
        name: `${index + 1}回目`,
        date: dateStr,
        // ここを正答率ではなく、App.jsxで計算したSLAスコアに変更
        rate: session.slaRate || 0, 
      };
    });

    setChartData(formattedData);
  }, []);

  const chunks = Array.from({ length: Math.ceil(questionsData.length / 10) }, (_, i) => i);

  const renderPlayCountIcons = (count) => {
    if (count === 0) return <span className="text-gray-300 text-xs">未学習</span>;
    const displayCount = Math.min(count, 5);
    const icons = Array(displayCount).fill('🔥').join('');
    return (
      <span className="text-orange-500 text-sm tracking-widest">
        {icons} {count > 5 && <span className="text-xs font-bold text-gray-500 ml-1">+{count - 5}</span>}
      </span>
    );
  };

  return (
    <div className="h-screen w-screen bg-gray-100 p-4 md:p-8 flex flex-col items-center overflow-y-auto">
      <div className="w-full max-w-3xl">
        <header className="flex justify-between items-end mb-8 mt-4 border-b-2 border-gray-200 pb-4">
          <h1 className="text-4xl md:text-5xl font-black text-blue-600 tracking-tighter italic">
            VocaDash
          </h1>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-500">総学習回数</p>
            <p className="text-2xl font-black text-gray-800">{totalPlays} <span className="text-base font-medium text-gray-500">回</span></p>
          </div>
        </header>

        <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100 mb-10">
          <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center">
            <span className="text-xl mr-2">📈</span> 最近のSLAスコア（直近10回）
          </h2>
          {chartData.length > 0 ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    formatter={(value) => [`${value}点`, 'SLAスコア']}
                    labelStyle={{ color: '#6B7280', fontWeight: 'bold', marginBottom: '5px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#3B82F6" 
                    strokeWidth={4} 
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                    activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 font-bold bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              まだ学習データがありません
            </div>
          )}
        </div>

        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
            <span className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm shadow-md">1</span>
            基礎トレーニング (10問集中)
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {chunks.map(chunkIndex => {
              const chunkId = `${chunkIndex * 10 + 1}-${chunkIndex * 10 + 10}`;
              const playCount = chunkStats[chunkId]?.playCount || 0;
              const masteryRate = getChunkMasteryRate(chunkIndex);

              return (
                <button 
                  key={chunkIndex}
                  onClick={() => handleSelectMode('chunk', chunkIndex)}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col text-left active:scale-[0.98] transition-all hover:border-blue-400 hover:shadow-md relative overflow-hidden"
                >
                  {masteryRate === 100 && (
                    <div className="absolute top-0 right-0 w-16 h-16 bg-green-100 rounded-bl-full flex justify-end items-start p-2">
                      <span className="text-xl mr-1 mt-[-2px]">👑</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-extrabold text-xl text-gray-800 tracking-tight">Q{chunkIndex * 10 + 1} - Q{chunkIndex * 10 + 10}</span>
                  </div>
                  
                  <div className="mb-4 min-h-[24px]">
                    {renderPlayCountIcons(playCount)}
                  </div>

                  <div className="w-full mt-auto">
                    <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                      <span>SLAスコア</span>
                      <span className={masteryRate === 100 ? "text-green-600 font-black" : "text-blue-600"}>{masteryRate}点</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={`h-full ${masteryRate === 100 ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-blue-400 to-blue-500'} transition-all duration-700 ease-out`}
                        style={{ width: `${masteryRate}%` }}
                      ></div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
            <span className="bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm shadow-md">2</span>
            実力テスト (ランダム出題)
          </h2>
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {[10, 20, 50].map(num => (
              <button
                key={num}
                onClick={() => handleSelectMode('random', num)}
                className="bg-white border-2 border-purple-100 text-purple-600 font-bold py-4 rounded-xl shadow-sm active:scale-95 transition-all hover:bg-purple-50 hover:border-purple-300 flex flex-col items-center justify-center"
              >
                <span className="text-sm text-purple-400 mb-1">Shuffle</span>
                <span className="text-xl md:text-2xl">{num === 50 ? '全問' : `${num}問`}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}