# VocaDash 多角度語彙クイズ v1

専用ブランチ `feature/multiformat-quiz-no-deploy-20261115`。main を基点に、
`content/vocabulary-c2-20261115` の追加 batch JSON 13ファイルをそのまま再利用。
既存 batch・Memory Engine・旧学習記録は変更していない。
`vercel.json` の `git.deploymentEnabled: false` を維持する。マージ・デプロイはしない。

## 入口と学習動作

ホーム下部の「多角度語彙クイズ」。英単語の部分一致と形式で絞り込める。
ミックスは最大5語義に絞って形式を変え、最大20問で練習する。
単一形式は最大20語義。データ量によって20問未満になる。
誤答後は約3問空けて同じ語義の別形式を再出題（最大26問、別形式がない場合は同問）。
ヒント表示・聞き直し回数・所要時間を回答ごとに記録する。
語順問題はトークンをタップして並べ、選択済みトークンをタップすると戻る。
大文字・全半角・余分な空白は正規化するが、綴り間違いは正解にしない。
スキップは回答記録・習得判定に含めない。

## 収録数（2026-11-15時点）

5,317語義 / 4,622 wordId、32,229問。これは異なる単語32,229語ではない。

| 形式 | 問題数 | 生成方針 |
|---|---:|---|
| 英日 | 12 | 編集済み選択肢 |
| 日英 | 12 | 編集済み選択肢 |
| スペリング | 5,189 | 登録語義・頭文字・文字数から見出し語再現 |
| リスニング | 5,189 | 見出し語読み上げ、入力回答 |
| 例文穴埋め | 8,300 | 原文中に見出し語が1回だけ現れる例文 |
| 英英定義 | 5,189 | 登録英英定義と頭文字・文字数 |
| 類義語 | 7 | 根拠付き編集問題 |
| 対義語 | 7 | 根拠付き編集問題 |
| ニュアンス | 4 | 語義・文体・慣用表現の違いを限定 |
| コロケーション | 6 | 根拠付き編集問題 |
| 派生語 | 6 | 品詞と求める語義を明示 |
| 語形変化 | 8 | 時制・単複・比較を明示 |
| 語順 | 8,299 | 原文再現、4–18トークン |
| 画像想起 | 1 | 目視確認できる本のオリジナルSVG |

専門形式の編集問題は合計63問。画像の大量生成や全8,653語対応は未完了。
音声は SpeechSynthesis の英語音声を利用し、外部有料APIは使わない。
API非対応時はリスニングを除外。実際の音声有無は端末依存で、再生エラー時はスキップ可能。

## 品質管理と限界

`validateQuestion()` はID・語義・答え・根拠・重複選択肢・正答選択肢数・
既知の不適切選択肢・語順トークン・画像確認フラグ・専門形式の確認フラグを検証する。
不合格問題は `buildQuestions().rejected` に理由付きで隔離。
全コーパスの検査は `node tools/quiz-quality.mjs`、回帰試験は `npm test`。

類義語リストからランダムに誤答選択肢を作らない。編集問題にのみ選択肢を持たせる。
原稿は依然として `draft-unreviewed` であり、構造検査に通ったことは意味・訳の
専門家による校閲完了を意味しない。教材確認用の自動問題であることを画面にも明記。
穴埋め・語順は「唯一の自然な英語」を判定する課題ではなく登録原文再現。
自由作文としての妥当性は採点しない。見出し語と完全一致しない活用形を勝手に推測しない。
画像は `imageHint` だけから生成せず、対応確認済みの実ファイルを必須にする。

## Memory Engine 接続契約

`src/lib/quiz/engine.js` は独立した純粋関数群。
`memoryEngine.js` を import せず、FSRS・復習間隔・マスター判定を実装しない。
`adaptVocabulary(record)` はドラフトの `senseId` / `wordId` を保持する。
旧コースのローカルIDと VD ID は自動的には同一と見なさない。

問題オブジェクト：

```js
{
  id, wordId, senseId,
  format, // FORMATSのキー。形容詞/名詞ではなく出題技能
  prompt, answers: ['accepted answer'],
  options, tokens, image, audioText, hint, translation, explanation,
  evidence: {source, rationale, reviewed, imageVerified}
}
```

`answers` は明示された別解を複数登録できる。
選択問題は、そのうち選択肢内に存在する正解が厳密に1つであることを必須とする。
`forbiddenDistractors` には同義語など誤答にしてはいけない既知の候補を指定できる。

`planSession(questions, {senseIds, limit, maxSenses})`：
Memory Engine で優先順に並べた senseId を渡す。空配列なら0問。
maxSenses を指定するとその数の語義を形式ごとに巡回する。
適切な出題時期・難易度は呼び出し側が決める。

UIは回答ごとに `onAttempt(attempt)`（任意prop）および
`window` の `vocadash:quiz-attempt-v1` CustomEvent を通知する。
どちらか一方を接続し、両方を購読する場合は attemptId で重複排除する。

```js
{
  schemaVersion: 1,
  attemptId, // UUID: 再取込時の重複排除に使用
  questionId, wordId, senseId, format,
  correct, responseMs, hintCount, audioPlays,
  answeredAt, // Unix milliseconds
  source
}
```

ヒント・時間からFSRS評価へ変換する処理はMemory Engine側の責任。
誤答語の再出題はこの練習セッション内のみで、長期スケジュールは更新しない。
ローカル保存キー `vocadash-quiz-attempts-v1` は直近2,000件を保持。
これは端末内の練習記録で、クラウド同期・無制限履歴・配送保証ではない。
接続時は回答イベントを重複排除付きで取り込む永続outboxを別途実装すること。

## 検証

全データのID一意性、14形式の生成、選択肢の重複と正解数、未確認画像と関係問題の隔離、
原文トークン一致、語義ID保持、時刻・ヒント入力検査、形式巡回を自動テストする。
既存の学習・音読・Universe・音声操作の回帰試験も実行する。
`npm run build` でコンパイル確認。

既存 `npm run lint` は flat config と `--ext` の不整合で実行不可。
追加コンポーネントは既存依存のESLintを個別設定で実行し、Hooks規則を確認。
Chromiumは実行環境の socket 権限制限で起動できず、ブラウザによる操作・表示確認は未完了。
本番公開前にiPadで音声、キーボード、語順トークン操作と画面幅を確認する必要がある。
