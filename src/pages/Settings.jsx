import React from 'react';

export default function Settings({ currentMode, targetTime, setTargetTime, startGame, goBack }) {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md flex flex-col items-center">
        <button onClick={goBack} className="self-start text-gray-400 font-bold mb-8 flex items-center">
          ← ダッシュボードに戻る
        </button>
        
        <span className="bg-blue-100 text-blue-600 px-4 py-1 rounded-full font-bold text-sm mb-4">
          {currentMode.label}
        </span>
        <h2 className="text-3xl font-black text-gray-800 mb-12">目標スピードを設定</h2>

        <div className="bg-white w-full rounded-3xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="flex items-center justify-center space-x-6 mb-6">
            <button 
              onClick={() => setTargetTime(Math.max(1000, targetTime - 1000))}
              className="w-14 h-14 rounded-full bg-gray-100 text-gray-600 text-3xl font-bold active:scale-90 flex items-center justify-center"
            >
              -
            </button>
            <div className="text-center w-32">
              <span className="text-5xl font-black text-blue-500">{(targetTime / 1000).toFixed(1)}</span>
              <span className="text-gray-400 font-bold ml-1">秒</span>
            </div>
            <button 
              onClick={() => setTargetTime(Math.min(10000, targetTime + 1000))}
              className="w-14 h-14 rounded-full bg-gray-100 text-gray-600 text-3xl font-bold active:scale-90 flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>

        <button 
          onClick={startGame}
          className="w-full py-5 bg-blue-600 text-white text-2xl font-black rounded-full shadow-[0_8px_30px_rgba(37,99,235,0.4)] active:scale-95 transition-all"
        >
          START
        </button>
      </div>
    </div>
  );
}