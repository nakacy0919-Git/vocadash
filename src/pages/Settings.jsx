import React from 'react';

export default function Settings({ currentMode, setPlayMode, startGame, goBack }) {
  return (
    <div className="h-screen w-screen bg-macaron-gradient p-6 flex flex-col items-center justify-center overflow-y-auto relative">
      
      <button 
        onClick={goBack}
        className="absolute top-6 left-6 w-12 h-12 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md text-gray-600 border border-white/60 active:scale-90 transition-transform shadow-sm"
      >
        <span className="text-xl font-bold">←</span>
      </button>

      <div className="text-center mb-10 w-full max-w-md">
        <span className="inline-block bg-white/60 px-4 py-1.5 rounded-full text-sm font-bold text-gray-500 mb-4 shadow-sm border border-white">
          {currentMode.label}
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-gray-700 tracking-tight">
          どのモードで学ぶ？
        </h1>
      </div>

      <div className="grid gap-6 w-full max-w-md">
        
        {/* --- じっくり学習モードボタン --- */}
        <button 
          onClick={() => { setPlayMode('study'); startGame(); }}
          className="group relative bg-white/80 backdrop-blur-md p-8 rounded-3xl text-left shadow-md hover:shadow-xl active:scale-[0.98] transition-all border border-white overflow-hidden"
        >
          {/* 内側のステッチ装飾 */}
          <div className="absolute inset-2 border-2 border-dashed border-blue-300/50 rounded-2xl pointer-events-none group-hover:border-blue-400 transition-colors duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-center mb-3">
              <span className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center text-xl mr-3 shadow-inner">📖</span>
              <h2 className="text-2xl font-black text-gray-700">じっくり学習</h2>
            </div>
            <p className="text-sm text-gray-500 font-medium leading-relaxed pl-13">
              タイマーなし。間違えてもOK。<br/>
              構造や語源を確認しながら、音読チェックも行えるインプット用モードです。
            </p>
          </div>
        </button>

        {/* --- スパルタテストモードボタン --- */}
        <button 
          onClick={() => { setPlayMode('test'); startGame(); }}
          className="group relative bg-rose-400 p-8 rounded-3xl text-left shadow-[0_4px_20px_rgba(251,113,133,0.4)] hover:shadow-[0_8px_30px_rgba(251,113,133,0.6)] hover:bg-rose-500 active:scale-[0.98] transition-all overflow-hidden"
        >
          {/* 内側のステッチ装飾 */}
          <div className="absolute inset-2 border-2 border-dashed border-white/50 rounded-2xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex items-center mb-3">
              <span className="bg-white/20 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl mr-3 shadow-inner">⚡</span>
              <h2 className="text-2xl font-black text-white">スパルタテスト</h2>
            </div>
            <p className="text-sm text-rose-100 font-medium leading-relaxed pl-13">
              1秒以内の即答を目指すアウトプット用。<br/>
              SLAスコアが記録され、1問でも間違えると即終了の厳しいモードです。
            </p>
          </div>
        </button>

      </div>
    </div>
  );
}