import React from 'react';
import titleLogo from '../assets/title-logo.png';
import Footer from '../components/Footer'; 

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
    id: 'reading', 
    title: '長文読解', 
    subtitle: '業後補習',
    badge: 'Reading', 
    fromColor: 'from-teal-400', 
    toColor: 'to-teal-600',
    shadowColor: 'shadow-teal-500/50' 
  },
  { 
    id: 'eiken_pre2', 
    title: '英語レベル', 
    subtitle: '準2級相当',
    badge: 'Level Pre-2', 
    fromColor: 'from-green-400', 
    toColor: 'to-green-600',
    shadowColor: 'shadow-green-500/50' 
  },
  { 
    id: 'eiken_2', 
    title: '英語レベル', 
    subtitle: '2級相当',
    badge: 'Level 2', 
    fromColor: 'from-emerald-400', 
    toColor: 'to-emerald-600',
    shadowColor: 'shadow-emerald-500/50' 
  },
  { 
    id: 'eiken_pre1', 
    title: '英語レベル', 
    subtitle: '準1級相当',
    badge: 'Level Pre-1', 
    fromColor: 'from-purple-400', 
    toColor: 'to-purple-600',
    shadowColor: 'shadow-purple-500/50' 
  },
  { 
    id: 'eiken_1', 
    title: '英語レベル', 
    subtitle: '1級相当',
    badge: 'Level 1', 
    fromColor: 'from-rose-400', 
    toColor: 'to-rose-600',
    shadowColor: 'shadow-rose-500/50' 
  },
  { 
    id: 'eiken1_master', 
    title: '1級マスター', 
    subtitle: '画像・音声・音読',
    badge: 'Advanced', 
    fromColor: 'from-amber-400', 
    toColor: 'to-amber-600',
    shadowColor: 'shadow-amber-500/50' 
  },
];

export default function CourseSelect({ onSelectCourse }) {
  return (
    <div className="min-h-screen w-screen bg-macaron-gradient p-4 md:p-6 flex flex-col items-center justify-start overflow-y-auto font-sans">
      
      <div className="pt-10 md:pt-16 flex flex-col items-center w-full max-w-4xl flex-grow">
        <img 
          src={titleLogo} 
          alt="VocaDash Logo" 
          className="w-72 md:w-96 lg:w-[32rem] mb-6 drop-shadow-2xl pointer-events-none animate-fadeIn" 
        />

        <p className="text-gray-500 font-bold mb-8 md:mb-10 text-xs md:text-sm bg-white/40 px-6 py-1.5 rounded-full border border-white/60 shadow-sm backdrop-blur-sm">
          学習するコースを選択してください
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 w-full px-2 md:px-4 mb-12">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => onSelectCourse(cat.id)}
              className={`
                group relative flex flex-col items-center justify-center text-center
                aspect-square rounded-[2rem] md:rounded-[2.5rem] p-3 sm:p-4 md:p-6
                transition-all duration-300 ease-out
                active:scale-95 active:translate-y-1
                bg-gradient-to-b ${cat.fromColor} ${cat.toColor}
                ${cat.shadowColor} shadow-[0_10px_20px_-5px] md:shadow-[0_15px_30px_-5px] hover:shadow-[0_25px_50px_-10px]
                hover:-translate-y-2
                border-t-[2px] md:border-t-[3px] border-white/40
              `}
            >
              <div className="absolute inset-0 rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-b from-white/60 to-transparent opacity-30 group-hover:opacity-50 transition-opacity"></div>
              
              <div className="relative z-10 w-full flex flex-col items-center">
                <span className="inline-block bg-white/20 text-white text-[9px] md:text-[11px] font-black px-2 md:px-3 py-0.5 rounded-full uppercase tracking-widest shadow-inner border border-white/30 whitespace-nowrap">
                  {cat.badge}
                </span>
                
                <h2 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-black text-white mt-2 md:mt-4 tracking-tighter leading-none drop-shadow-md whitespace-nowrap">
                  {cat.title}
                </h2>
                
                <p className="text-sm sm:text-base md:text-xl font-black text-white/90 tracking-tight mt-1 md:mt-2 leading-tight drop-shadow-sm whitespace-nowrap">
                  {cat.subtitle}
                </p>
              </div>
            </button>
          ))}
        </div>
        
        {/* ★ 免責事項（注意書き）を追加 */}
        <div className="w-full max-w-2xl bg-white/40 backdrop-blur-sm p-4 rounded-xl border border-white/50 text-center mb-8">
          <p className="text-gray-500 text-[10px] md:text-xs leading-relaxed font-medium">
            ※本アプリ内の「英語レベル」および「級」の表記は、各学習段階における語彙レベルの目安を示す独自の基準です。公益財団法人日本英語検定協会の承認、推奨、その他の検討を受けたものではありません。
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}