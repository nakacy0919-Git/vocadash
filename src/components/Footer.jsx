import React, { useState } from 'react';
import PolicyModal from './PolicyModal';
import GuideModal from './GuideModal'; // ★ 追加：ガイドモーダルをインポート

export default function Footer() {
  const [policyState, setPolicyState] = useState({ isOpen: false, type: 'terms' });
  const [isGuideOpen, setIsGuideOpen] = useState(false); // ★ 追加：ガイドの開閉状態

  const openPolicy = (type) => setPolicyState({ isOpen: true, type });
  const closePolicy = () => setPolicyState({ isOpen: false, type: 'terms' });

  return (
    <>
      <footer className="w-full pb-8 pt-12 px-4 mt-auto relative z-10">
        <div className="max-w-4xl mx-auto bg-white/40 backdrop-blur-md rounded-3xl p-6 border border-white/60 shadow-sm text-center">
          
          {/* ▼ アプリ連携・活用ガイド ▼ */}
          <div className="flex flex-wrap justify-center gap-4 mb-6 text-sm font-bold text-gray-600">
            {/* ★ 修正：ガイドモーダルを開く処理を追加 */}
            <button 
              onClick={() => setIsGuideOpen(true)}
              className="hover:text-blue-500 active:text-blue-600 transition-colors flex items-center gap-1"
            >
              <span>📘</span> VocaDash活用ガイド
            </button>
            <a href="https://pic-speak-story.com/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 active:text-blue-600 transition-colors flex items-center gap-1">
              <span>🗣️</span> PicSpeak
            </a>
            <a href="https://copeak.pic-speak-story.com/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 active:text-blue-600 transition-colors flex items-center gap-1">
              <span>🏔️</span> Copeak
            </a>
          </div>

          {/* ▼ ポリシー・規約関連 ▼ */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mb-6 text-xs font-medium text-gray-500">
            <button 
              onClick={() => openPolicy('terms')}
              className="hover:text-gray-800 active:text-gray-900 transition-colors underline underline-offset-2 decoration-gray-300"
            >
              利用規約
            </button>
            <button 
              onClick={() => openPolicy('privacy')}
              className="hover:text-gray-800 active:text-gray-900 transition-colors underline underline-offset-2 decoration-gray-300"
            >
              プライバシーポリシー
            </button>
          </div>

          {/* ▼ コピーライト ▼ */}
          <div className="text-[11px] text-gray-400 font-medium">
            &copy; {new Date().getFullYear()}{' '}
            <a 
              href="https://sites.google.com/view/koheinakashima/bio" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-gray-600 active:text-gray-800 transition-colors underline decoration-gray-300 underline-offset-2 font-bold"
            >
              Kohei Nakashima
            </a>
            {' '}All Rights Reserved.
          </div>

        </div>
      </footer>

      {/* ポリシーモーダル */}
      <PolicyModal 
        isOpen={policyState.isOpen} 
        onClose={closePolicy} 
        type={policyState.type} 
      />

      {/* ★ 追加：ガイドモーダル */}
      <GuideModal 
        isOpen={isGuideOpen} 
        onClose={() => setIsGuideOpen(false)} 
      />
    </>
  );
}