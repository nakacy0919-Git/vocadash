import React from 'react';

const CATEGORIES = [
  { id: 'regular', title: '定期考査 KICK OFF', badge: 'School', color: 'bg-blue-400' },
  { id: 'eiken_pre2', title: '英検 準2級', badge: 'Eiken', color: 'bg-green-400' },
  { id: 'eiken_2', title: '英検 2級', badge: 'Eiken', color: 'bg-emerald-500' },
  { id: 'eiken_pre1', title: '英検 準1級', badge: 'Eiken', color: 'bg-purple-400' },
  { id: 'eiken_1', title: '英検 1級', badge: 'Eiken', color: 'bg-rose-500' },
];

export default function CourseSelect({ onSelectCourse }) {
  return (
    <div className="h-screen w-screen bg-macaron-gradient p-6 flex flex-col items-center justify-center overflow-y-auto">
      <h1 className="text-4xl font-black text-white mb-10 drop-shadow-md italic">Select Course</h1>
      <div className="grid gap-4 w-full max-w-md">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelectCourse(cat.id)}
            className="glass-panel-light p-6 rounded-3xl flex items-center justify-between active:scale-[0.98] transition-all hover:shadow-lg"
          >
            <div className="text-left">
              <span className={`${cat.color} text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest`}>
                {cat.badge}
              </span>
              <h2 className="text-xl font-black text-gray-700 mt-2">{cat.title}</h2>
            </div>
            <span className="text-2xl text-gray-300">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}