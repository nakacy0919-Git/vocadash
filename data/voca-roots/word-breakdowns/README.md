# VocaRoots — Word Breakdown (development drafts)

This dataset supports the future **Word Breakdown** experience in VocaDash. It is separate from the original vocabulary master and from the live application. All entries are **unreviewed**, and `productionEnabled=false`.

## What is registered
- **3,137 modern derivation candidates** from the project's explicitly authored word-family groups. A candidate is included only if its base and derivative occur in the same authored family, their parts of speech fit a rule, and the letters concatenate exactly. This **does not verify the word's historical etymology** or its semantic suitability for publication.
- **35 individually written teaching explanations**, including `transport`, `import`, `important`, `photograph`, `geography`, and `reconsider`.
- **3,172 source records / 3,169 distinct headwords**. Three headwords occur in both an authored core record and a candidate record; prefer the **core** record for display only after editorial approval.
- 219 records (217 distinct headwords) have a `wordId` matched exactly in the *incomplete* 2,733-entry candidate index. Unresolved rows remain `wordId: null`; do not invent or deduce a master ID.

## Schema
- `headword`, `wordId`, `cefrHeadword`, `matchStatus`, `wordMeaningJa` or `meaningJa`.
- `analysisType` distinguishes **modern derivation candidates**, **historical components**, and **semantic shifts**.
- `parts[]`: `surface` reconstructs the spelling; `kind` distinguishes prefix, suffix, historical/combining form, and free base. `morphemeId` refers to existing VocaRoots units when applicable.
- `explanationJa` / `learningExplanationJa`, `familyEvidence` or `sourceRefs`, review flags.
- All items have `editorialReviewRequired=true`, `productionEligible=false`, `status=draft-unreviewed`.

## Additional batches 003–005 (2026-11-17)
- 1,565 additional draft candidates were extracted from 20 further, explicitly authored word-family source files; records have unique headwords not used by earlier batches.
- In addition to exact concatenation, some candidate spellings require **final -e deletion**, **-y to -i changes**, or **final-consonant doubling**. These spelling operations are encoded in `orthographicRule`; a reconstructed spelling alone is **not** proof of a valid etymology.
- All new entries remain `draft-unreviewed` and are excluded from production. The present 2,733-headword candidate index matched 35 of the new records; unmatched words must not be treated as absent from the full 8,653-word master.
- All source relationships and Japanese explanations require linguistic/editorial review before linking to the VocaDash learning UI.

## Critical editorial cautions
1. **Historical roots and today's morphological segmentation are different things.** Do not teach `important` as if today's meaning literally follows from `im + port + ant`.
2. A visual match in spelling cannot establish an etymological relationship. Even exact joined forms from an authored family are only candidate records.
3. Suffix meanings are general learning hints, not definitions of every derived word (e.g. `-ism` can denote a practice or condition rather than an ideology). Check every Japanese explanation before publishing.
4. Treat the current 2,733-word index as incomplete relative to the 8,653-word learning target. An unmatched candidate may still exist in the full master.
5. Avoid publishing raw external dictionary text; retain original Japanese explanations and track actual verified URLs only.

## Next steps
- Verify all historical etymologies and ambiguous derivations against reliable dictionaries.
- Acquire the complete 8,653-word master and reconcile exact headwords, senses, and IDs.
- Extend core records to the full syllabus; attach images and examples only after editorial review.
- Connect only reviewed and approved records to the VocaRoots/VocaUniverse UI and quiz engine. **Do not automatically merge or deploy.**

## Validation
Run from the repository root:

```bash
node tools/validate-voca-roots-word-breakdowns.mjs
```

This checks structure, exact spelling reconstruction, unique IDs, source-family membership, morpheme references, master-index matching, counts and safe publication flags. Passing this check does **not** certify etymological accuracy.
