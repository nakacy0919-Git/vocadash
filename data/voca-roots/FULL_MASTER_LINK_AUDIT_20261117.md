# VocaRoots — complete-master relation match audit (2026-11-17)

Source: development branch `content/voca-roots-20261117`. No production deployment.

| Metric | Count |
| --- | ---: |
| Existing draft relation candidates | 10697 |
| Matching complete 8,653-word master | 3330 |
| Unique master words with one or more links | 2698 |
| Legacy partial-index matches | 898 |
| Newly resolved exact-ID relation candidates | 2432 |
| Draft relations not present in complete master | 7367 |
| Master words with no matching VocaRoots link | 5955 |

**Interpretation:** This audit improves word-ID coverage, not the number of distinct etymological facts. All linked relationships remain candidates requiring linguistic review; spelling resemblance and explicitly authored families are not proof of historical derivation. New index is non-runtime metadata and must not be shipped in a published VocaRoots feature without review.

Generator: `node tools/reconcile-voca-roots-word-links.mjs --check`.
