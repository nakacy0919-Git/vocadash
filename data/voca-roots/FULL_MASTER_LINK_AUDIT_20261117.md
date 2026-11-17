# VocaRoots — complete-master relation match audit (2026-11-17)

Source: development branch `content/voca-roots-20261117`. No production deployment.

| Metric | Count |
| --- | ---: |
| Existing draft relation candidates | 10697 |
| Matching complete 8,653-word master | 3328 |
| Unique master words with one or more links | 2697 |
| Legacy partial-index matches | 898 |
| Newly resolved exact-ID relation candidates | 2430 |
| Draft relations not present in complete master | 7369 |
| Master words with no matching VocaRoots link | 5956 |

**Correction:** The first draft mistakenly treated JavaScript's inherited `constructor` property as a master headword. `root:struct/constructor` and `suffix:or-agent/constructor` are NOT master-matched. Own-property matching now prevents this false positive.

**Interpretation:** This audit improves word-ID coverage, not the number of distinct etymological facts. All linked relationships remain candidates requiring linguistic review. New index is non-runtime metadata and must not be shipped in a published VocaRoots feature without review.

Generator: `node tools/reconcile-voca-roots-word-links.mjs --check`.
