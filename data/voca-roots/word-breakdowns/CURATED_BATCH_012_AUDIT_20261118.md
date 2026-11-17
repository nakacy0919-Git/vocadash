# VocaRoots — curated Word Breakdown batch 012 audit
Date: 2026-11-18. Development branch: `content/voca-roots-curated-012-20261118`. No merge or deployment.

## Count changes

| Metric | Before | After |
| --- | ---: | ---: |
| All Word Breakdown source records | 3,920 | 4,027 |
| Distinct draft headwords | 3,917 | 4,024 |
| Distinct 8,653-word master headwords with a draft | 1,529 | 1,636 |
| Master headwords still without a draft | 7,124 | 7,017 |
| Draft headword coverage | 17.7% | 18.9% |
| Approved/public entries | 0 | 0 |

New draft records: **107** total: **96 suffix**, **11 prefix**. CEFR A1=8, A2=14, B1=24, B2=39, C1=17, C2=5.

## Data policy
- Existing 8,653-word/9,614-sense master unchanged.
- Added exact master word IDs and base word IDs; checked source spelling segmentation and prior-headword duplicates.
- Japanese learning glosses are editorial drafts, **not** verified original master sense definitions. Original sentence examples and source links are not invented.
- Historical etymologies and the semantic fit of each derivation remain for independent editorial review.
- Excludes tempting but false string splits (e.g., flower/flow, witness/wit, unless/un+less).
- All new data remain `draft-unreviewed`, `historicalEtymologyVerified=false`, `productionEligible=false`, with no live UI wiring.

## Reproducible validation
Run in a local clone or CI:
```bash
node tools/validate-voca-roots-word-breakdowns.mjs
node tools/validate-voca-roots-curated-012.mjs
node tools/validate-voca-roots-master-first.mjs
```
The connector-side checks inspect the retrieved repository JSON; Node script execution in a cloned repository has not been performed here.
