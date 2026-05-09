import React, { useState, useEffect } from 'react';

export default function BrowserGuide() {
  const [showGuide, setShowGuide] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    // ユーザーの利用環境（ブラウザ情報）を取得
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    
    // LINE, Instagram, Facebook, ロイロノート, X(Twitter) などのアプリ内ブラウザを検知
    const inApp = /Line|Instagram|FBAN|FBAV|Loilo|Twitter/i.test(ua);
    
    // ホーム画面から起動しているか（PWAとしてインストール済みか）を判定
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    setIsInAppBrowser(inApp);
    setIsStandalone(standalone);

    // 毎回表示されるとうるさいので、1回のセッションで1度だけ表示する
    const hasSeenGuide = sessionStorage.getItem('vocaDashGuideSeen');
    
    // ホーム画面から起動していない場合、またはアプリ内ブラウザの場合はガイドを表示
    if (!standalone && !hasSeenGuide) {
      setShowGuide(true);
    }
  }, []);

  const handleClose = () => {
    sessionStorage.setItem('vocaDashGuideSeen', 'true');
    setShowGuide(false);
  };

  if (!showGuide) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full z-[999] p-4 md:p-6 animate-slideUp pointer-events-none">
      <div className="max-w-2xl mx-auto bg-white/95 backdrop-blur-xl p-5 md:p-6 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-white pointer-events-auto relative overflow-hidden">
        
        {/* 閉じるボタン */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-95 transition-all font-bold"
        >
          ✕
        </button>

        {isInAppBrowser ? (
          /* アプリ内ブラウザ向けの強い警告 */
          <div className="pr-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl animate-bounce">⚠️</span>
              <h3 className="text-rose-500 font-black text-lg md:text-xl tracking-tight">ブラウザを変更してください</h3>
            </div>
            <p className="text-gray-600 text-sm md:text-base font-medium leading-relaxed mb-4">
              現在、LINEやロイロノート等の「アプリ内ブラウザ」で開いています。このままでは<strong className="text-rose-500">マイク（音声認識）が正常に動かない</strong>場合があります。
            </p>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm text-gray-500 font-bold">
              👉 画面右下（または右上）の <span className="text-lg">︙</span> や <span className="text-lg">↑</span> マークを押して、<br/>
              <strong className="text-blue-500">「Safariで開く」</strong> または <strong className="text-blue-500">「ブラウザで開く」</strong> を選んでください。
            </div>
          </div>
        ) : (
          /* 通常ブラウザ向けのホーム画面追加の推奨 */
          <div className="pr-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl animate-bounce">💡</span>
              <h3 className="text-blue-500 font-black text-lg md:text-xl tracking-tight">ホーム画面に追加して便利に！</h3>
            </div>
            <p className="text-gray-600 text-sm md:text-base font-medium leading-relaxed">
              このページを<strong className="text-blue-500">「ホーム画面に追加」</strong>すると、専用アプリのように全画面で、よりサクサクと快適に学習できるようになります。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}