# Voca Roots — development-only dataset

既存の VocaDash の語彙IDを変更せず、語根・接頭辞・接尾辞・関連単語・学習イメージ・クイズを独立管理する。既存教材の上書きや main / 本番への反映はしない。

## Schema
- morpheme ID: kind:key. 同じ綴りでも意味や由来が異なる場合はIDを分ける（例: in-negative / in-inward、un-negative / un-reversal）。
- roots / prefixes / suffixes: forms, origin (or resulting part of speech), meaningJa / meaningEn, examples, image hint where applicable, review status. ギリシャ語系の結合形式も学習上の root / prefix として分類する場合がある。
- word links: wordId を候補索引で完全一致確認できた場合のみ入れる。未照合は null。歴史的な関係と現代の形態分解を混同しない。単純な文字列一致で新しい関連語を登録しない。
- quizzes: draft only, quizEligible=false until editorial review. 選択肢の意味が重なる問題は人手で修正する。構造検査は意味の正確さを保証しない。
- 画像: 語根の場面案のみ。このバッチには画像実体なし。

## Editorial workflow
1. 既存バッチの ID・語根異形・意味を検索し、重複を避ける。
2. 原語・語史・現代の派生関係を辞書等で語ごとに確認し、参照URLと独自の日本語解説を記録。一般教材の参照URLは個々の語の検証済みという意味ではない。
3. 8,653語の完全なマスターを用意し、候補索引未照合のリンクを照合する。品詞や同綴異義も区別する。誤記は元IDを保持し保留。
4. Sources and license: 外部辞書の定義文や表をコピーしない。事実を独自に説明し、外部データ取り込み時はライセンスを確認する。
5. 例文・日本語訳・画像は既存学習データのIDで連携。歴史的解説と学習イメージを別フィールドで管理。
6. 構造検査と編集レビュー後、UI / Voca Universe / spaced repetition に接続する。本番は別途明示的に許可された場合のみ。

Run `node tools/validate-voca-roots.mjs` from repository root.
