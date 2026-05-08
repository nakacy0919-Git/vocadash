import React from 'react';

export default function Result({ goHome }) {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-blue-500 text-white p-6 text-center">
      <h1 className="text-5xl md:text-7xl font-black mb-4">CLEAR!!</h1>
      <p className="text-xl md:text-2xl mb-8 font-bold">圧倒的な集中力でした。</p>
      <button onClick={goHome} className="px-8 py-4 bg-white text-blue-500 font-bold rounded-full shadow-lg active:scale-95 transition-transform">
        ダッシュボードへ
      </button>
    </div>
  );
}