import React from 'react';
// アセットフォルダに配置したロゴ画像をインポート
import titleLogo from '../assets/title-logo.png';
import Footer from '../components/Footer'; // ★ 追加：フッターのインポート

const CATEGORIES = [
  { 
    id: 'regular', 
    title: '定期考査', 
    subtitle: 'KICK OFF',
    badge: 'School', 
    fromColor: 'from-blue-400', 
    toColor: 'to-blue-600',
    shadowColor: 'shadow-blue-500/50' 
  },
  { 
    id: 'eiken_pre2', 
    title: '英検', 
    subtitle: '準2級',
    badge: 'Eiken', 
    fromColor: 'from-green-400', 
    toColor: 'to-green-600',
    shadowColor: 'shadow-green-500/50' 
  },
  { 
    id: 'eiken_2', 
    title: '英検', 
    subtitle: '2級',
    badge: 'Eiken', 
    fromColor: 'from-emerald-400', 
    toColor: 'to-emerald-600',
    shadowColor: 'shadow-emerald-500/50' 
  },
  { 
    id: 'eiken_pre1', 
    title: '英検', 
    subtitle: '準1級',
    badge: 'Eiken', 
    fromColor: 'from-purple-400', 
    toColor: 'to-purple-600',
    shadowColor: 'shadow-purple-500/50' 
  },
  { 
    id: 'eiken_1', 
    title: '英検', 
    subtitle: '1級',
    badge: 'Eiken', 
    fromColor: 'from-rose-400', 
    toColor: 'to-rose-600',
    shadowColor: 'shadow-rose-500/50' 
  },
];

export default function CourseSelect({ onSelectCourse }) {
  return (
    // ★ 修正：フッターが画面下部に追従するように min-h-screen を追加
    <div className="min-h-screen w-screen bg-macaron-gradient p-4 md:p-6 flex flex-col items-center justify-start overflow-y-auto font-sans">
      
      {/* 上部の余白調整（縦並びの中央寄せから、上寄せ＋余白に変更） */}
      <div className="pt-10 md:pt-16 flex flex-col items-center w-full max-w-4xl">
        {/* アプリタイトルロゴ */}
        <img 
          src={titleLogo} 
          alt="VocaDash Logo" 
          className="w-72 md:w-96 lg:w-[32rem] mb-6 drop-shadow-2xl pointer-events-none animate-fadeIn" 
        />

        <p className="text-gray-500 font-bold mb-8 md:mb-10 text-xs md:text-sm bg-white/40 px-6 py-1.5 rounded-full border border-white/60 shadow-sm backdrop-blur-sm">
          学習するコースを選択してください
        </p>
        
        {/* コース選択グリッド（正方形ボタン） */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 w-full px-2 md:px-4 mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => onSelectCourse(cat.id)}
              className={`
                group relative flex flex-col items-center justify-center text-center
                aspect-square rounded-[2rem] md:rounded-[2.5rem] p-3 sm:p-4 md:p-6
                transition-all duration-300 ease-out
                active:scale-95 active:translate-y-1
                
                /* 立体的なグラデーションと深い影 */
                bg-gradient-to-b ${cat.fromColor} ${cat.toColor}
                ${cat.shadowColor} shadow-[0_10px_20px_-5px] md:shadow-[0_15px_30px_-5px] hover:shadow-[0_25px_50px_-10px]
                
                /* ホバー時の挙動 */
                hover:-translate-y-2
                
                /* ツヤを出すための上部ハイライト */
                border-t-[2px] md:border-t-[3px] border-white/40
              `}
            >
              {/* 表面のグロス（光沢）エフェクト */}
              <div className="absolute inset-0 rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-b from-white/60 to-transparent opacity-30 group-hover:opacity-50 transition-opacity"></div>
              
              <div className="relative z-10 w-full flex flex-col items-center">
                {/* バッジラベル */}
                <span className="inline-block bg-white/20 text-white text-[9px] md:text-[11px] font-black px-2 md:px-3 py-0.5 rounded-full uppercase tracking-widest shadow-inner border border-white/30 whitespace-nowrap">
                  {cat.badge}
                </span>
                
                {/* メインテキスト：スマホでは text-2xl に縮小し、改行を禁止(whitespace-nowrap) */}
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mt-2 md:mt-4 tracking-tighter leading-none drop-shadow-md whitespace-nowrap">
                  {cat.title}
                </h2>
                
                {/* サブタイトル（級など）：こちらもはみ出さないように調整 */}
                <p className="text-base sm:text-lg md:text-2xl font-black text-white/90 tracking-tight mt-1 md:mt-2 leading-tight drop-shadow-sm whitespace-nowrap">
                  {cat.subtitle}
                </p>
                
                {/* 右下のアイコン装飾：スマホ画面では少し小さく・位置を調整 */}
                <span className="absolute bottom-[-15px] md:bottom-[-25px] right-[-5px] md:right-[-10px] text-2xl md:text-4xl text-white/20 group-hover:text-white/50 transition-colors duration-300">
                  →
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ★ 追加：フッターを一番下に配置 */}
      <Footer />
    </div>
  );
}