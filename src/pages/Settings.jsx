import React, { useState, useEffect } from 'react';

export default function Settings({ currentMode, goHome, startGame }) {
  // スパルタテストの秒数を管理するState（初期値は10秒）
  const [spartanTime, setSpartanTime] = useState(10);

  // 画面を開いた時に、前回保存した設定時間があれば読み込む
  useEffect(() => {
    const savedTime = localStorage.getItem('vocaDash_spartan_time');
    if (savedTime) {
      setSpartanTime(Number(savedTime));
    }
  }, []);

  // スパルタテストを開始する際の処理
  const handleStartSpartan = () => {
    // 今回設定した時間をローカルストレージに保存（次回用）
    localStorage.setItem('vocaDash_spartan_time', spartanTime);
    // 秒をミリ秒に変換してApp.jsxへ渡す
    startGame('test', spartanTime * 1000);
  };

  return (
    <div className="h-screen w-screen bg-macaron-gradient p-6 flex flex-col items-center justify-center font-sans overflow-y-auto">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.1)] border border-white/60 relative">
        
        {/* 戻るボタン（hoverを削除、activeを強化） */}
        <button 
          onClick={goHome} 
          className="absolute top-6 left-6 w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full font-bold active:bg-gray-200 active:scale-95 transition-all shadow-sm"
        >
          ←
        </button>

        <h2 className="text-2xl md:text-3xl font-black text-gray-700 mt-10 mb-2 text-center tracking-tight">
          学習モード選択
        </h2>
        <p className="text-gray-500 font-bold text-center mb-10 bg-white/50 py-1.5 px-4 rounded-full inline-block mx-auto border border-white shadow-sm w-full">
          {currentMode?.label}
        </p>

        <div className="space-y-6">
          {/* --- 1. じっくり学習 --- */}
          <button
            onClick={() => startGame('study', null)}
            className="w-full group relative bg-gradient-to-br from-green-400 to-emerald-500 p-6 rounded-3xl shadow-lg active:scale-95 active:opacity-90 transition-all border-t-2 border-white/30 text-left overflow-hidden"
          >
             <div className="absolute inset-1.5 border-2 border-dashed border-white/30 rounded-2xl pointer-events-none"></div>
             <div className="relative z-10 flex items-center gap-4">
               <span className="text-4xl bg-white/20 w-14 h-14 flex items-center justify-center rounded-2xl shadow-inner">📖</span>
               <div>
                 <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">じっくり学習</h3>
                 <p className="text-green-50 mt-1 text-xs md:text-sm font-medium">時間制限なし・解説と発音チェック</p>
               </div>
             </div>
          </button>

          {/* --- 2. スパルタテスト --- */}
          <div className="w-full relative bg-gradient-to-br from-rose-400 to-rose-600 p-6 rounded-3xl shadow-lg border-t-2 border-white/30 text-left overflow-hidden">
            <div className="absolute inset-1.5 border-2 border-dashed border-white/30 rounded-2xl pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-5">
                <span className="text-4xl bg-white/20 w-14 h-14 flex items-center justify-center rounded-2xl shadow-inner">🔥</span>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">スパルタテスト</h3>
                  <p className="text-rose-100 mt-1 text-xs md:text-sm font-medium">時間制限あり・実践演習</p>
                </div>
              </div>
              
              {/* 解答時間設定 UI */}
              <div className="w-full flex items-center justify-between bg-white/20 p-4 rounded-2xl mb-5 shadow-inner">
                <span className="text-white font-bold text-sm md:text-base">1問の解答時間</span>
                <div className="flex items-center gap-4">
                  {/* マイナスボタン（hover削除、active追加） */}
                  <button 
                    onClick={() => setSpartanTime(p => Math.max(3, p - 1))} 
                    className="w-10 h-10 rounded-full bg-white text-rose-500 font-black text-xl shadow-sm active:bg-gray-100 active:scale-90 transition-all flex items-center justify-center pb-1"
                  >
                    -
                  </button>
                  <div className="flex items-baseline gap-1 min-w-[3rem] justify-center">
                    <span className="text-2xl md:text-3xl font-black text-white">{spartanTime}</span>
                    <span className="text-rose-100 font-bold text-sm">秒</span>
                  </div>
                  {/* プラスボタン（hover削除、active追加） */}
                  <button 
                    onClick={() => setSpartanTime(p => Math.min(30, p + 1))} 
                    className="w-10 h-10 rounded-full bg-white text-rose-500 font-black text-xl shadow-sm active:bg-gray-100 active:scale-90 transition-all flex items-center justify-center pb-1"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* スタートボタン（hover削除、active追加） */}
              <button
                onClick={handleStartSpartan}
                className="w-full py-4 bg-white text-rose-500 font-black text-lg rounded-xl shadow-md active:bg-gray-50 active:scale-95 transition-all relative overflow-hidden"
              >
                <div className="absolute inset-1 border border-dashed border-rose-200 rounded-lg pointer-events-none"></div>
                スタート！
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}