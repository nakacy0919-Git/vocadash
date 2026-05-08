import React from 'react';
// アセットフォルダに配置したロゴ画像をインポート
import titleLogo from '../assets/title-logo.png';

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
    <div className="h-screen w-screen bg-macaron-gradient p-6 flex flex-col items-center justify-center overflow-y-auto font-sans">
      
      {/* ▼ ここを修正！ロゴを大きくし、影を濃く（drop-shadow-2xl）しました */}
      <img 
        src={titleLogo} 
        alt="VocaDash Logo" 
        className="w-80 md:w-96 lg:w-[32rem] mb-6 drop-shadow-2xl pointer-events-none animate-fadeIn" 
      />

      {/* サブタイトルの余白もロゴの大きさに合わせて調整しています */}
      <p className="text-gray-500 font-bold mb-10 text-sm bg-white/40 px-6 py-1.5 rounded-full border border-white/60 shadow-sm backdrop-blur-sm">
        学習するコースを選択してください
      </p>
      
      {/* コース選択グリッド（正方形ボタン） */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-4xl px-4 pb-16">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelectCourse(cat.id)}
            className={`
              group relative flex flex-col items-center justify-center text-center
              aspect-square rounded-[2.5rem] p-6
              transition-all duration-300 ease-out
              active:scale-95 active:translate-y-1
              
              /* 立体的なグラデーションと深い影 */
              bg-gradient-to-b ${cat.fromColor} ${cat.toColor}
              ${cat.shadowColor} shadow-[0_15px_30px_-5px] hover:shadow-[0_25px_50px_-10px]
              
              /* ホバー時の挙動 */
              hover:-translate-y-2
              
              /* ツヤを出すための上部ハイライト */
              border-t-[3px] border-white/40
            `}
          >
            {/* 表面のグロス（光沢）エフェクト */}
            <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-white/60 to-transparent opacity-30 group-hover:opacity-50 transition-opacity"></div>
            
            <div className="relative z-10 w-full">
              {/* バッジラベル */}
              <span className="inline-block bg-white/20 text-white text-[11px] font-black px-3 py-0.5 rounded-full uppercase tracking-widest shadow-inner border border-white/30">
                {cat.badge}
              </span>
              
              {/* メインテキスト：視認性を高めた極太フォント */}
              <h2 className="text-3xl md:text-5xl font-black text-white mt-4 tracking-tighter leading-none drop-shadow-md">
                {cat.title}
              </h2>
              
              {/* サブタイトル（級など） */}
              <p className="text-xl md:text-2xl font-black text-white/90 tracking-tight mt-1 leading-tight drop-shadow-sm">
                {cat.subtitle}
              </p>
              
              {/* 右下のアイコン装飾 */}
              <span className="absolute bottom-[-25px] right-[-10px] text-4xl text-white/20 group-hover:text-white/50 transition-colors duration-300">
                →
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}