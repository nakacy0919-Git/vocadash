import React from 'react';

export default function PolicyModal({ isOpen, onClose, type }) {
  if (!isOpen) return null;

  const isTerms = type === 'terms';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-black/40 animate-fadeIn">
      {/* モーダルの外枠 */}
      <div className="bg-white/95 w-full max-w-2xl max-h-[85vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-white relative animate-popIn">
        
        {/* ヘッダー部分 */}
        <div className="flex justify-between items-center p-5 md:p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl md:text-2xl font-black text-gray-700 tracking-tight">
            {isTerms ? '利用規約' : 'プライバシーポリシー'}
          </h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200/50 text-gray-500 hover:bg-gray-200 active:scale-90 transition-all"
          >
            <span className="text-xl font-bold">✕</span>
          </button>
        </div>

        {/* 本文エリア（スクロール可能） */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar text-sm md:text-base text-gray-600 space-y-6 leading-relaxed">
          
          {isTerms ? (
            /* --- 利用規約のテキスト --- */
            <>
              <p>この利用規約（以下、「本規約」といいます。）は、当サイト（VocaDash）が提供するサービス（以下、「本サービス」といいます。）の利用条件を定めるものです。ユーザーの皆さまには、本規約に従って本サービスをご利用いただきます。</p>
              
              <div>
                <h3 className="font-bold text-gray-800 border-l-4 border-blue-400 pl-3 mb-2">第1条（適用）</h3>
                <p>本規約は、ユーザーと当サイトとの間の本サービスの利用に関わる一切の関係に適用されるものとします。</p>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-800 border-l-4 border-blue-400 pl-3 mb-2">第2条（禁止事項）</h3>
                <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>法令または公序良俗に違反する行為</li>
                  <li>犯罪行為に関連する行為</li>
                  <li>当サイト、他のユーザー、または第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                  <li>本サービスの運営を妨害するおそれのある行為</li>
                  <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                  <li>不正アクセスをし、またはこれを試みる行為</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 border-l-4 border-blue-400 pl-3 mb-2">第3条（本サービスの提供の停止等）</h3>
                <p>当サイトは、システム保守や天災などの不可抗力により、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 border-l-4 border-blue-400 pl-3 mb-2">第4条（免責事項）</h3>
                <p>当サイトは、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。当サイトは、本サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。</p>
              </div>
            </>
          ) : (
            /* --- プライバシーポリシーのテキスト --- */
            <>
              <p>当サイト（VocaDash）は、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下、「本ポリシー」といいます。）を定めます。</p>

              <div>
                <h3 className="font-bold text-gray-800 border-l-4 border-emerald-400 pl-3 mb-2">第1条（学習データの保存について）</h3>
                <p>当サイトは、ユーザーの利便性向上（学習進捗の保存など）のために、ブラウザのローカルストレージ（Local Storage）機能を利用してデータを保存します。これらのデータはお使いの端末内にのみ保存され、当サイトのサーバーに送信・収集されることはありません。</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 border-l-4 border-emerald-400 pl-3 mb-2">第2条（アクセス解析ツールについて）</h3>
                <p>当サイトでは、Googleによるアクセス解析ツール「Googleアナリティクス（GA4）」を利用しています。このツールはトラフィックデータの収集のためにCookieを使用しています。このトラフィックデータは匿名で収集されており、個人を特定するものではありません。この機能はCookieを無効にすることで収集を拒否することが出来ますので、お使いのブラウザの設定をご確認ください。</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 border-l-4 border-emerald-400 pl-3 mb-2">第3条（広告の配信について）</h3>
                <p>当サイトは、Google及びGoogleのパートナー（第三者配信事業者）の提供する広告を設置しております。その広告配信にはCookieを使用し、当サイトやその他のサイトへの過去のアクセス情報に基づいて広告を配信します。Google が広告 Cookie を使用することにより、ユーザーのアクセス情報に基づいて、Google やそのパートナーが適切な広告をユーザーに表示できます。ユーザーは<a href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Googleアカウントの広告設定ページ</a>で、パーソナライズ広告を無効にすることができます。</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 border-l-4 border-emerald-400 pl-3 mb-2">第4条（プライバシーポリシーの変更）</h3>
                <p>本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく、変更することができるものとします。</p>
              </div>
            </>
          )}

        </div>

        {/* フッター（閉じるボタン） */}
        <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-100 flex justify-center">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-gray-700 text-white font-bold rounded-xl shadow-md active:scale-95 transition-transform hover:bg-gray-800"
          >
            閉じる
          </button>
        </div>

      </div>
    </div>
  );
}