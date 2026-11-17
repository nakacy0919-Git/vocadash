# VocaRoots — high-volume curated master-sourced batch 014

Date: 2026-11-18. Base: `content/voca-roots-curated-013-20261118`. Head: `content/voca-roots-bulk-014-20261118`.

## New data
- **429 unique new Word Breakdown study drafts**, selected manually and matched exactly to the existing 8,653-headword master: **291 compounds**, **95 multiword expressions** and **43 adverb -ally spelling/derivation patterns**.
- Target and component evidence is copied from **all 84 active, original draft vocabulary source batches**, not guessed: **951 word IDs** and **1,076 original sense records** in seven evidence files.
- **429/429** new entries have an existing English example and its Japanese translation; **429/429** have one additional exact source-linked bilingual example: **858 paired example uses**. Every entry also has a learning prompt, meaning comparison, visual concept and linguistic caution.
- Explicit errors caught and fixed during selection: `father = fat + her` was removed, and `nowhere` was corrected from the spurious `now + here` split to **no + where** with canonical component sense IDs.
- Terms with lexicalized, figurative or socially contextual meanings are annotated for future review, such as **breakfast, deadline, honeymoon, first floor, native speaker, copyright, wordsmith, climate change**.
- All raw source meanings and examples themselves are **drafts, not linguistically approved**. No external dictionary passages, unsupported dictionary URLs or new examples are fabricated.
- The `wb:curated:` ID namespace distinguishes manual selection from the older `wb:modern:` automated candidate dataset.

## Counts
| Metric | Before batch 014 | After |
| --- | ---: | ---: |
| Word Breakdown source records | 4,157 | **4,586** |
| Distinct draft headwords | 4,154 | **4,583** |
| Distinct active-master headwords with candidate draft | 1,766 | **2,195** |
| Master headwords without candidate | 6,887 | **6,458** |
| Candidate coverage | 20.4% | **25.4%** |
| Editorially approved | 0 | **0** |

## Integrity & caveats
- All new records are `draft-unreviewed`, `historicalEtymologyVerified=false`, `editorialReviewRequired=true` and `productionEligible=false`.
- Existing master IDs, master vocabulary files, Voca Universe UI and production settings are untouched.
- A two-word split or transparent spelling cue does **not** prove historical etymology. `-ally` is an adverb **spelling-learning** segmentation, and multiword expressions are *phrases*, not morphological roots.
- Master first-sense glosses are references and other senses are retained; meaning priorities, examples, polysemy and language usage still require human checking.

## Validation
```bash
node tools/validate-voca-roots-word-breakdowns.mjs
node tools/validate-voca-roots-bulk-014.mjs
node tools/validate-voca-roots-curated-012.mjs
node tools/validate-voca-roots-curated-013.mjs
node tools/validate-voca-roots-master-first.mjs
```
The connector-backed checks should be reported separately from an executed Node run; the latter has not been performed in an offline checkout.

## Editorial review queue
`bulk-editorial-review-014.json` records the follow-up queue for all 429 additions: **75 high**, **192 medium**, **162 low** priority. **None is approved.** Priorities identify lexicalized or ambiguous word meanings, component polysemy, phrase-vs-morphology issues and acronym casing. This does not certify that the low-priority rows are historically correct.
