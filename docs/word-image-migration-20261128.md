# Word image migration — 2026-11-28

1215 WebP blobs preserved (verified by SHA multiset). 1212 files moved into a–z folders; three authored important assets remain at the original paths. Largest folder: c (175). No duplicate destination paths.

## Filename corrections (inferred from spelling, not visual review)

- `comflict.webp` → `conflict.webp`
- `coutries.webp` → `countries.webp`
- `gradparents.webp` → `grandparents.webp`
- `incrase.webp` → `increase.webp`
- `incscribe.webp` → `inscribe.webp`
- `moutain.webp` → `mountain.webp`
- `omlet.webp` → `omelet.webp`
- `school princial's office.webp` → `school principal's office.webp`
- `sinstitute.webp` → `institute.webp`
- `srong.webp` → `strong.webp`
- `tomoto.webp` → `tomato.webp`
- `track and filed.webp` → `track and field.webp`
- `track and filed team.webp` → `track and field team.webp`
- `umbrealla.webp` → `umbrella.webp`
- `violion.webp` → `violin.webp`

## Additional image-content verification

- `detech.webp` → `detach.webp` (person opening a backpack buckle).
- `monkery.webp` → `monkey.webp` (monkey illustration).
- `plan trees.webp` → `plant trees.webp` (children planting a tree).
- `play player.webp` → `play.webp` (children playing soccer and with blocks).
- `see saw.webp`: paired verb illustrations, not a playground seesaw. Retain original filename and index `see` and `saw` as aliases; exact images take precedence.
- `hot2.webp`: alternate image of hot weather. Retain it; do not index as a separate headword.

Run `npm run audit:word-images` for review-only 80–100% candidates against the active draft and course JSON vocabulary. Similarity is not proof of a matching image; arbitrary fuzzy lookup is not used on learner screens.
