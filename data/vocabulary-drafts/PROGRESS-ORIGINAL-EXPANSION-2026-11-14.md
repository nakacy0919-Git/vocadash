# Original vocabulary expansion — 2026-11-14 (continuation)

New original learner English examples and Japanese translations are in six standalone JSON batches.

| Batch | New headwords | New senses | New EN + JA pairs |
| --- | ---: | ---: | ---: |
| original-20261114-b1-07 | 27 | 30 | 60 |
| original-20261114-b1-08 | 39 | 47 | 94 |
| original-20261114-b1-09 | 28 | 32 | 64 |
| original-20261114-b1-10 | 37 | 43 | 86 |
| original-20261114-b1-11 | 55 | 65 | 130 |
| original-20261114-b1-12 | 38 | 42 | 84 |
| **New total** | **224** | **259** | **518** |

Nine previously covered headwords were removed before committing: financial, forecast, forgive, foundation, gain, generate, global, govern, habitat. Their existing content remains unchanged.

All records include an original English definition, Japanese meaning, part of speech, contextual synonym where appropriate, image idea, two distinct original English examples, and corresponding Japanese translations.

## Full draft corpus
- **1,939 distinct headwords** / 8,653 in separate reference master (**22.4%**).
- **2,426 senses**.
- **4,852 English sentence and Japanese translation pairs**.
- **29 batch JSON files**.
- Exact English sentence duplicates: **0**.
- Missing required fields and ID collisions: **0**.
- Generated image assets: **0**. Human editorial checks pending.

Kept under `data/vocabulary-drafts/`, outside `src/data/`; `main` and production app remain untouched. Run `node tools/validate-vocabulary.mjs` locally after checkout. Do not import the externally sourced master list wholesale without confirming redistribution permissions.
