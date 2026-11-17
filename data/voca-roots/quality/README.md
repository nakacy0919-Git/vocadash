# VocaRoots: editorial review queue — 2026-11-17

This is a **draft-only** learning-quality audit for candidate etymology/affix links. It does not delete or silently relabel any existing data.

- 25 exact candidate links flagged, including 23 high-priority likely misclassifications and 2 semantic-shift cautions.
- Examples: `immigrate` is not the negative `in-`; verbal `unlock` uses reversal `un-` rather than simple negation; `approval` is a noun and should not be taught as adjectival `-al`.
- Each flag records the original `linkId`, current vocabulary `wordId`, review reason and optional **proposed** morpheme reclassification. Proposed IDs are not automatically applied.
- `node tools/validate-voca-roots-editorial-issues.mjs` checks the queue. To check a prospective approved-only list, provide `--approved-file filename.json` with `{"linkIds":["..."]}`. It fails when the list contains a currently blocked link.
- This protects only explicitly flagged cases. **Unflagged draft associations are not verified**. Dictionary-based human linguistic review is still required before student display or any production merge.
