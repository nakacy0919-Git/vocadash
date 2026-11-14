# Vocadash mass vocabulary drafting — 2026-11-14

This branch contains a **working draft only**; production `main` is unchanged.

## New content from this round

| File | Previously uncovered headwords | New senses | Original EN+JA example pairs |
| --- | ---: | ---: | ---: |
| bulk-20261114-a1.json | 101 | 114 | 228 |
| bulk-20261114-b1-a.json | 83 | 90 | 180 |
| bulk-20261114-b1-b.json | 181 | 188 | 376 |
| **Added** | **365** | **392** | **784** |

The three new files contain original learner-oriented EN definitions, Japanese meanings, context-limited synonym hints, and image ideas. New headwords were checked against the latest batches 01–11 before selecting them.

## Full draft corpus on this branch

- Master catalog has 8,653 headwords (separate from GitHub).
- **1,225 distinct covered headwords (14.2%)**.
- **1,615 sense records**.
- **3,230 examples with Japanese translations**.
- **0 exact duplicate English sentences**.
- **0 missing required fields or translations**.
- 0 generated images; all data still `draft-unreviewed`.

## Release safeguards

* All new files are in `data/vocabulary-drafts/batches/`, **not** `src/data/`. The existing Vite app does not load them automatically.
* Run `node tools/validate-vocabulary.mjs` after cloning this branch, and review semantic correctness manually.
* Human editorial checks still needed: distinction among senses, natural example usage, grammar, Japanese translations, synonyms, CEFR appropriateness, source licensing.
* Do not add the external complete 8,653-entry master to a public repository before verifying permissions.
