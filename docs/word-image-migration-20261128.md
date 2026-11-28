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

## Review before further renames

- `detech.webp`: detach or detect (detect.webp already exists).
- `monkery.webp`: monkey likely, but monkery is also a word.
- `plan trees.webp`: plant trees likely; confirm picture.
- `play player.webp`: unclear intended word.
- `see saw.webp`: see/saw or seesaw.
- `hot2.webp`: additional image for hot or different asset; hot.webp already exists.

These files are preserved, without automatic fuzzy reassignment. Explicit spelling/inflection aliases are used only when no exact image exists. Run `npm run audit:word-images` for review-only 80–100% candidates against the active draft and course JSON vocabulary. Similarity is not proof of a matching image; no arbitrary fuzzy lookup is used on learner screens.
