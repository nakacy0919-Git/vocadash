import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Home({ handleSelectMode, chunkStats, getChunkMasteryRate, currentCourse, courseTitle, goCourseSelect, questionsData }) {
  const [chartData, setChartData] = useState([]);
  const [totalPlays, setTotalPlays] = useState(0);

  useEffect(() => {
    // コースごとの履歴を読み込む
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
  }, [currentCourse]); // currentCourseが変わるたびに再計算

  // データ数に応じてチャンク（10問ごとのブロック）を生成
  const chunks = Array.from({ length: Math.ceil((questionsData?.length || 0) / 10) }, (_, i) => i);

  const renderPlayCountIcons = (count) => {
    if (count === 0) return <span className="text-gray-300 text-xs">未学習</span>;
    const displayCount = Math.min(count, 5);
    const icons = Array(displayCount).fill('🔥').join('');
    return (
      <span className="text-orange-400 text-sm tracking-widest">
        {icons} {count > 5 && <span className="text-xs font-bold text-gray-400 ml-1">+{count - 5}</span>}
      </span>
    );
  };

  return (
    <div className="h-screen w-screen bg-macaron-gradient p-4 md:p-8 flex flex-col items-center overflow-y-auto">
      <div className="w-full max-w-3xl">
        
        {/* --- ヘッダー：コース変更ボタンとタイトル --- */}
        <header className="mb-8 mt-4 relative">
          <button 
            onClick={goCourseSelect}
            className="mb-4 text-sm font-bold text-gray-500 bg-white/50 px-4 py-2 rounded-full hover:bg-white transition-colors shadow-sm flex items-center"
          >
            ← コース選択に戻る
          </button>
          
          <div className="flex justify-between items-end border-b-2 border-gray-200/50 pb-4">
            <div>
              <p className="text-sm font-bold text-blue-400 mb-1">VocaDash</p>
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

        {/* --- 成長グラフエリア --- */}
        <div className="glass-panel-light rounded-3xl p-6 mb-10">
          <h2 className="text-lg font-bold text-gray-600 mb-4 flex items-center">
            <span className="text-xl mr-2">📈</span> 最近のSLAスコア（直近10回）
          </h2>
          {chartData.length > 0 ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)' }}
                    formatter={(value) => [`${value}点`, 'SLAスコア']}
                    labelStyle={{ color: '#6B7280', fontWeight: 'bold', marginBottom: '5px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#60A5FA" 
                    strokeWidth={4} 
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                    activeDot={{ r: 6, fill: '#60A5FA', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 font-bold bg-white/40 rounded-2xl border-2 border-dashed border-gray-300/50">
              まだ学習データがありません
            </div>
          )}
        </div>

        {/* --- 基礎トレーニングエリア --- */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-600 mb-4 flex items-center">
            <span className="bg-blue-400 text-white w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm shadow-md">1</span>
            基礎トレーニング (10問集中)
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {chunks.map(chunkIndex => {
              const chunkId = `${chunkIndex * 10 + 1}-${chunkIndex * 10 + 10}`;
              const playCount = chunkStats[chunkId]?.playCount || 0;
              const masteryRate = getChunkMasteryRate(chunkIndex);
              
              // 最終チャンクが10問未満の場合の表示制御
              const startQ = chunkIndex * 10 + 1;
              const endQ = Math.min(chunkIndex * 10 + 10, questionsData.length);

              return (
                <button 
                  key={chunkIndex}
                  onClick={() => handleSelectMode('chunk', chunkIndex)}
                  className="glass-panel-light p-5 rounded-3xl flex flex-col text-left active:scale-[0.98] transition-all hover:bg-white/80 relative overflow-hidden"
                >
                  {masteryRate === 100 && (
                    <div className="absolute top-0 right-0 w-16 h-16 bg-green-100/50 rounded-bl-full flex justify-end items-start p-2">
                      <span className="text-xl mr-1 mt-[-2px]">👑</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-extrabold text-xl text-gray-700 tracking-tight">Q{startQ} - Q{endQ}</span>
                  </div>
                  
                  <div className="mb-4 min-h-[24px]">
                    {renderPlayCountIcons(playCount)}
                  </div>

                  <div className="w-full mt-auto relative z-10">
                    <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                      <span>SLAスコア</span>
                      <span className={masteryRate === 100 ? "text-green-500 font-black" : "text-blue-500"}>{masteryRate}点</span>
                    </div>
                    <div className="w-full bg-gray-200/50 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${masteryRate === 100 ? 'bg-gradient-to-r from-green-300 to-green-400' : 'bg-gradient-to-r from-blue-300 to-blue-400'} transition-all duration-700 ease-out`}
                        style={{ width: `${masteryRate}%` }}
                      ></div>
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