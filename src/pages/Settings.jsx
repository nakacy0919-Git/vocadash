import React from 'react';

export default function Settings({ currentMode, goHome, startGame, currentCourse }) {
  
  // 1級マスター選択時かどうかで、高速モードの挙動を切り替える
  const isMasterCourse = currentCourse === 'eiken1_master';

  const handleHighSpeedStart = () => {
    if (isMasterCourse) {
      // 1級マスターの場合は画像・音声・音読の Advanced モードへ
      startGame('advanced', null);
    } else {
      // それ以外のコースの場合は、強制的に5秒制限のスパルタテキストモードへ
      startGame('test', 5000);
    }
  };

  return (
    <div className="h-screen w-screen bg-macaron-gradient p-4 md:p-6 flex flex-col items-center justify-center font-sans overflow-y-auto">
      <div className="max-w-2xl w-full bg-white/80 backdrop-blur-xl p-6 md:p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/60 relative">
        
        {/* 戻るボタン */}
        <button 
          onClick={goHome} 
          className="absolute top-6 left-6 md:top-8 md:left-8 w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full font-bold active:scale-90 transition-all shadow-sm"
        >
          ←
        </button>

        <div className="text-center mt-10 md:mt-4 mb-10">
          <h2 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight mb-3">
            プレイスタイル選択
          </h2>
          <p className="text-gray-500 font-bold bg-white/60 py-2 px-6 rounded-full inline-block border border-white shadow-sm">
            {currentMode?.label}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          
          {/* --- パターンA: じっくり学習 --- */}
          <button
            onClick={() => startGame('study', null)}
            className="group relative flex flex-col items-center justify-center bg-gradient-to-br from-blue-400 to-indigo-500 p-8 md:p-10 rounded-[2.5rem] shadow-lg hover:shadow-2xl active:scale-95 transition-all duration-300 border-t-[3px] border-white/30 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>
            <div className="text-6xl mb-4 drop-shadow-md transform group-hover:-translate-y-2 transition-transform duration-300">
              📖
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight mb-2">じっくり学習</h3>
            <p className="text-blue-100 text-sm font-bold text-center leading-relaxed">
              時間制限なし<br/>自分のペースで意味を確認
            </p>
          </button>

          {/* --- パターンB: 高速・高負荷学習 --- */}
          <button
            onClick={handleHighSpeedStart}
            className="group relative flex flex-col items-center justify-center bg-gradient-to-br from-rose-500 to-orange-500 p-8 md:p-10 rounded-[2.5rem] shadow-lg hover:shadow-2xl active:scale-95 transition-all duration-300 border-t-[3px] border-white/30 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>
            <div className="text-6xl mb-4 drop-shadow-md transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
              ⚡
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight mb-2">
              {isMasterCourse ? '高速アサルト' : 'スピード特訓'}
            </h3>
            <p className="text-rose-100 text-sm font-bold text-center leading-relaxed">
              {isMasterCourse 
                ? <><span className="text-yellow-200">画像＆音声・音読</span><br/>脳に直接負荷をかける</>
                : <>極限の時間制限<br/>反射神経を鍛える</>
              }
            </p>
            
            {/* 装飾用のアニメーションエフェクト */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl group-hover:animate-pulse"></div>
          </button>

        </div>
      </div>
    </div>
  );
}