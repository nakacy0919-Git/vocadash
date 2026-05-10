import React from 'react';

export default function GuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-black/40 animate-fadeIn">
      <div className="bg-white/95 w-full max-w-3xl max-h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white relative animate-popIn">
        
        {/* ヘッダー部分 */}
        <div className="flex justify-between items-center p-5 md:p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
          <h2 className="text-xl md:text-2xl font-black text-gray-700 tracking-tight flex items-center gap-2">
            <span>📘</span> VocaDash 活用ガイド
          </h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-gray-500 hover:bg-gray-100 active:scale-90 transition-all shadow-sm"
          >
            <span className="text-xl font-bold">✕</span>
          </button>
        </div>

        {/* 本文エリア */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar text-gray-600 space-y-8">
          
          {/* イントロダクション */}
          <div className="text-center space-y-3 mb-8">
            <h3 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
              英語の「瞬発力」を鍛えよう！
            </h3>
            <p className="text-sm md:text-base font-medium leading-relaxed">
              VocaDash（ボカダッシュ）は、英単語や文法を「知っている」状態から、<br className="hidden md:block"/>
              一瞬で「使える」状態へとレベルアップさせるためのトレーニングアプリです。
            </p>
          </div>

          {/* STEP 1 */}
          <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-blue-500 text-white font-black text-xl w-10 h-10 flex items-center justify-center rounded-2xl shadow-md">1</span>
              <h4 className="text-xl font-black text-gray-700">コースを選ぼう</h4>
            </div>
            <p className="text-sm md:text-base font-medium mb-4">
              定期考査に向けた学習から、英検（準2級〜1級）の対策まで対応！今の自分の目標に合ったコースを選んでスタートしましょう。
            </p>
          </div>

          {/* STEP 2 */}
          <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-emerald-500 text-white font-black text-xl w-10 h-10 flex items-center justify-center rounded-2xl shadow-md">2</span>
              <h4 className="text-xl font-black text-gray-700">2つのモードを使いこなそう</h4>
            </div>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📖</span>
                  <span className="font-black text-emerald-600 text-lg">じっくり学習モード</span>
                </div>
                <p className="text-sm font-medium">時間制限なし！まずはここで知識をインプット。間違えた問題は詳しい解説を読んで理解を深めましょう。音声（🔊）を聞いて発音チェックもできます。</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-rose-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🔥</span>
                  <span className="font-black text-rose-500 text-lg">スパルタテストモード</span>
                </div>
                <p className="text-sm font-medium">制限時間内に即答する実践トレーニング！頭で日本語に訳さず、英語を英語のまま理解する「英語脳」と「瞬発力」を極限まで高めます。</p>
              </div>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="bg-purple-50/50 p-6 rounded-3xl border border-purple-100">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-purple-500 text-white font-black text-xl w-10 h-10 flex items-center justify-center rounded-2xl shadow-md">3</span>
              <h4 className="text-xl font-black text-gray-700">便利な学習サポート機能</h4>
            </div>
            <ul className="space-y-3 text-sm font-medium">
              <li className="flex items-start gap-3 bg-white p-3 rounded-xl shadow-sm">
                <span className="text-xl">🔊</span>
                <span><strong className="text-purple-600">読み上げ機能:</strong> アイコンをタップすると、ネイティブスピーカーの音声で英文や単語を読み上げます。</span>
              </li>
              <li className="flex items-start gap-3 bg-white p-3 rounded-xl shadow-sm">
                <span className="text-xl">🔤</span>
                <span><strong className="text-purple-600">文字サイズ調整:</strong> 画面右上の「A+ / A-」ボタンで、自分が一番見やすい文字の大きさに変更できます。</span>
              </li>
              <li className="flex items-start gap-3 bg-white p-3 rounded-xl shadow-sm">
                <span className="text-xl">🇯🇵</span>
                <span><strong className="text-purple-600">日本語切り替え:</strong> 「Japanese」ボタンを押すと和訳が表示されます。どうしても意味が取れない時に活用しましょう。</span>
              </li>
            </ul>
          </div>

        </div>

        {/* フッター（閉じるボタン） */}
        <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-100 flex justify-center">
          <button 
            onClick={onClose}
            className="px-10 py-4 bg-gray-800 text-white font-black rounded-2xl shadow-md active:scale-95 transition-transform hover:bg-gray-900"
          >
            さっそく学習を始める！
          </button>
        </div>

      </div>
    </div>
  );
}