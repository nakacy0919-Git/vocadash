import React from 'react';

// コースの表示名マッピング
const COURSE_NAMES = {
  regular: '定期考査 KICK OFF',
  eiken_pre2: '英検 準2級',
  eiken_2: '英検 2級',
  eiken_pre1: '英検 準1級',
  eiken_1: '英検 1級',
};

export default function StageSelect({ currentCourse, onSelectStage, goBack }) {
  // 1〜16までのステージ配列を生成
  const stages = Array.from({ length: 16 }, (_, i) => i + 1);

  // iOSSafariなどのダブルタップバグを防ぐ即時実行ラッパー
  const instantTrigger = (action) => (e) => {
    if (e.cancelable) e.preventDefault();
    action();
  };

  return (
    <div className="min-h-screen w-screen bg-macaron-gradient p-4 md:p-6 flex flex-col items-center overflow-y-auto font-sans">
      
      {/* 戻るボタン */}
      <div className="w-full max-w-4xl flex justify-start mb-4 mt-2 md:mt-4">
        <button 
          onTouchStart={instantTrigger(goBack)}
          onMouseDown={instantTrigger(goBack)}
          className="w-12 h-12 flex items-center justify-center bg-white/60 text-gray-500 rounded-full font-black active:bg-gray-200 active:scale-90 transition-all shadow-sm border border-white"
        >
          ←
        </button>
      </div>

      <div className="flex flex-col items-center w-full max-w-4xl">
        
        {/* 現在選択中のコース表示 */}
        <div className="mb-8 text-center animate-fadeIn">
          <span className="inline-block bg-white/40 text-blue-500 text-xs md:text-sm font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm border border-white/60 mb-3">
            Selected Course
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-gray-700 tracking-tight drop-shadow-sm">
            {COURSE_NAMES[currentCourse]}
          </h2>
        </div>

        {/* 16ステージのグリッド（スマホは3列、タブレット以上は4列） */}
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-5 w-full pb-20 px-2">
          {stages.map((stageNum) => (
            <button
              key={stageNum}
              onTouchStart={instantTrigger(() => onSelectStage(stageNum))}
              onMouseDown={instantTrigger(() => onSelectStage(stageNum))}
              className="
                group relative flex flex-col items-center justify-center
                aspect-square rounded-[1.5rem] md:rounded-[2rem] p-2
                transition-all duration-200 ease-out touch-manipulation
                active:scale-95 active:translate-y-1
                bg-white/80 backdrop-blur-sm border-2 border-white shadow-[0_8px_15px_-3px_rgba(0,0,0,0.1)]
                active:bg-blue-50 active:border-blue-300
              "
            >
              {/* 点線の内枠装飾 */}
              <div className="absolute inset-1 border-[1.5px] border-dashed border-gray-200/60 rounded-[1.2rem] md:rounded-[1.6rem] pointer-events-none group-active:border-blue-300/50 transition-colors"></div>
              
              <span className="relative z-10 text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                Stage
              </span>
              <span className="relative z-10 text-3xl md:text-4xl font-black text-gray-600 group-active:text-blue-500 transition-colors">
                {stageNum}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}