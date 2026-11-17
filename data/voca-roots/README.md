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

## Bulk-link evidence (batches 011+)
Extra associations are **editorial candidates** from explicitly authored lexical families, not verified historical etymologies. Each item has familyEvidence pointing at the source file and anchor; generic related, synonym and collocation links are excluded. IDs come only from exact matches in the incomplete candidate index. Never publish without editorial review. link-ledger.json is a derived deduplication index, not runtime data.

## Full-master link reconciliation (2026-11-17)
- Derived `full-master-word-links.json` resolves **3,328 existing relation candidates** to **2,697 distinct headwords** from the complete **8,653-word** master; **2,430 link IDs** are newly resolved beyond the older incomplete candidate index.
- Existing source batches, link-ledger and old ID assignments are unchanged. The original manifest's `matchedRelations` count describes the **legacy partial-index** state. The new `fullMasterReconciliation.counts` describes the complete-master view.
- This is **not** an etymological accuracy review, a new vocabulary addition, or a published learning feature. All source relationships remain draft-only; new `wordId` matches must not be exposed as approved breakdowns or quiz answers.
- Deterministic commands: `node tools/reconcile-voca-roots-word-links.mjs --check` verifies the committed index; `--write` regenerates it after source changes, without editing any source batch or publishing.


## CEFR study map (2026-11-17)
- `study-map-by-cefr.json` organizes all **800** existing learning units by A1–C2 master-word candidate links. **548** units have exact master-word candidate matches; **252** have none.
- Entries are planning metadata, **not reviewed etymologies**, not published questions, and are not imported by the live UI. The map references existing morpheme IDs without adding new root claims.
- Validate: `node tools/build-voca-roots-study-map.mjs --check`. Regenerate locally with `--write`.


## Teaching pilot — 32 editable lesson drafts (2026-11-17)
- Curated **32** lesson seeds (**16** roots, **7** prefixes, **9** suffixes) with **172** master-matched word placements (**166** distinct headwords).
- Each record includes an English inquiry question, original practice sentence, Japanese hint/caution, and exact existing word IDs/CEFR levels.
- All linguistic accuracy, meanings and sentences require editorial verification. These are **not** classroom-ready, not imported in the live application and not published.
- Run `node tools/validate-voca-roots-teaching-pilot.mjs` to verify structural links, word IDs, candidate placement and unpublished status.
