import React from 'react';

export default function Play({
  currentIndex, selectedQuestions, currentQuestion, timeLeft, targetTime,
  isFailed, handleAnswer, goHome, startGame, calculateAverageTime
}) {
  const timePercentage = (timeLeft / targetTime) * 100;
  const isDanger = timePercentage < 30;

  return (
    <div className={`h-screen w-screen flex flex-col justify-between font-sans overflow-hidden transition-colors duration-700 ${isFailed ? 'bg-mistake-gradient' : 'bg-macaron-gradient'}`}>
      
      {/* --- 画面上部：ヘッダーエリア --- */}
      <div className="p-4 md:p-6 z-10">
        <div className="flex items-center gap-4 mb-3">
          {/* 途中でやめるボタン */}
          <button 
            onClick={goHome}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md text-gray-600 border border-white/60 active:scale-90 transition-transform shadow-sm"
            aria-label="Quit"
          >
            <span className="text-xl font-bold">✕</span>
          </button>

          {/* ふんわりプログレスバー */}
          <div className="flex-1 bg-white/40 h-3 md:h-4 rounded-full overflow-hidden shadow-inner border border-white/60 relative backdrop-blur-sm">
            <div
              className={`h-full absolute left-0 top-0 transition-all duration-[50ms] ease-linear rounded-full
                ${isFailed ? 'bg-rose-400' : isDanger ? 'bg-orange-400' : 'bg-blue-400'}`}
              style={{ width: `${timePercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="text-right font-bold text-lg flex justify-between text-gray-600">
          <span className="bg-white/60 px-4 py-1 rounded-full text-xs backdrop-blur-sm shadow-sm text-gray-500 ml-14">
            Q {currentIndex + 1} / {selectedQuestions.length}
          </span>
          <span className={`text-xl font-mono ${isDanger && !isFailed ? 'text-orange-500 animate-pulse' : ''} ${isFailed ? 'text-rose-500' : 'text-blue-500'}`}>
            {(Math.max(0, timeLeft) / 1000).toFixed(1)}s
          </span>
        </div>
      </div>

      {/* --- 画面中央：問題文エリア --- */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
        {isFailed ? (
           <div className="animate-shake w-full max-w-md flex flex-col items-center text-center">
             <h2 className="text-6xl md:text-7xl font-black mb-2 text-white drop-shadow-md">Oops!</h2>
             <p className="text-rose-600 font-bold mb-8 tracking-widest bg-white/50 px-6 py-2 rounded-full shadow-sm">どんまい！次はいけるよ ✨</p>
             
             <div className="glass-panel-light rounded-3xl p-6 mb-8 w-full text-left">
               <h3 className="text-sm text-gray-400 font-bold border-b border-gray-200 pb-2 mb-4 text-center">今回の結果</h3>
               <div className="flex justify-between text-base mb-2 text-gray-600 font-medium">
                 <span>到達レベル:</span>
                 <span className="text-gray-800 font-bold">{currentIndex} 問</span>
               </div>
               <div className="mt-4 pt-4 border-t border-gray-200">
                 <span className="block text-xs text-rose-400 font-bold mb-1 uppercase">Check!</span>
                 <span className="font-black text-xl text-gray-700 leading-tight block mb-1">
                   {currentQuestion.english.replace('________', '(   )')}
                 </span>
                 <span className="text-sm text-gray-500">{currentQuestion.japanese}</span>
               </div>
             </div>

             <div className="flex w-full gap-3">
               <button onClick={goHome} className="flex-1 py-4 bg-white/60 text-gray-600 text-sm font-bold rounded-2xl active:scale-95 transition-transform hover:bg-white border border-white/80 shadow-sm">
                 やめる
               </button>
               <button onClick={startGame} className="flex-2 w-2/3 py-4 bg-rose-400 hover:bg-rose-500 text-white text-lg font-black rounded-2xl active:scale-95 transition-transform shadow-[0_4px_15px_rgba(251,113,133,0.4)]">
                 もう1回！
               </button>
             </div>
           </div>
        ) : (
          <div className="w-full max-w-4xl flex flex-col items-start text-left glass-panel-light p-8 md:p-12 rounded-[2.5rem] shadow-xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-2xl opacity-70"></div>
            
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-700 mb-8 leading-tight break-words w-full relative z-10">
              {currentQuestion.english.split('________').map((part, index, array) => (
                <React.Fragment key={index}>
                  {part}
                  {index < array.length - 1 && (
                    <span className="inline-block w-24 md:w-36 border-b-4 border-blue-300 mx-3 align-baseline rounded bg-blue-50/50"></span>
                  )}
                </React.Fragment>
              ))}
            </h1>
            <p className="text-lg md:text-2xl text-gray-500 font-medium w-full border-t border-gray-100 pt-6 relative z-10">
              {currentQuestion.japanese}
            </p>
          </div>
        )}
      </div>

      {/* --- 画面下部：選択肢ボタンエリア --- */}
      {!isFailed && (
        <div className="w-full max-w-4xl mx-auto p-4 pb-8 md:pb-12 z-10">
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {currentQuestion.choices.map((choice, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className="group relative touch-manipulation active:scale-[0.97] transition-all duration-200 py-8 md:py-10 text-xl md:text-2xl font-bold text-gray-600 bg-white/80 backdrop-blur-md rounded-3xl hover:bg-white hover:text-blue-500 border border-white shadow-sm hover:shadow-md overflow-hidden text-center"
              >
                <span className="absolute top-4 left-5 text-[11px] text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">{idx + 1}</span>
                <span className="relative z-10 transition-colors">{choice}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}