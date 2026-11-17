# VocaRoots batch 013 — development-only addition (2026-11-18)

## Registered data
- Base: `content/voca-roots-curated-012-20261118`; head: `content/voca-roots-curated-013-20261118`
- 130 new manually selected breakdown candidate records: suffix 88, prefix 19, compound-like 23.
- The 8,653-headword / 9,614-sense active vocabulary master remains unchanged.
- Draft source records rise from **4,027 to 4,157**, distinct draft headwords from **4,024 to 4,154**.
- Exact-master distinct headword coverage rises **1,636 → 1,766 (18.9% → 20.4%)**.
- Master headwords with no breakdown candidate fall **7,017 → 6,887**. Not all headwords are decomposable.

## Quality control
- 26 tempting false splits are explicitly documented in `false-split-exclusions-013.json` (separate reference-only metadata), including `flower/flow`, `unless/less`, `university/universe` and `portable/port`.
- `out-`, `down-`, and `up-` first-elements are tagged as compound-like constructions where appropriate, not all conflated with productive prefixes.
- All target and base word IDs were obtained through exact matching against the canonical master index.
- Every pair reconstructs its target spelling from the stored parts; duplicates were rejected before writing.
- Japanese meanings, semantic cautions and learning questions are original drafts. They have **not** been matched to the master sense or verified against dictionaries.
- No source dictionary URL or example sentence was invented. `sourceRefs=[]` and `referenceLookupPending=true` explicitly mark missing linguistic verification.
- No file from the active master was edited. All 130 records remain unreviewed, not production eligible, and disconnected from student UI.

## Repeatable checks
```bash
node tools/validate-voca-roots-word-breakdowns.mjs
node tools/validate-voca-roots-curated-012.mjs
node tools/validate-voca-roots-curated-013.mjs
node tools/validate-voca-roots-master-first.mjs
```

The connector-backed JSON checks are separate from actual Node execution; run these scripts in local checkout or CI before merging.
