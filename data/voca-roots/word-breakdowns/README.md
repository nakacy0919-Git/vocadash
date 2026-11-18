# VocaRoots — Word Breakdown (development drafts)

This dataset supports the future **Word Breakdown** experience in VocaDash. It is separate from the original vocabulary master and from the live application. All entries are **unreviewed**, and `productionEnabled=false`.

## What is registered
- **3,350 modern derivation candidates** from the project's explicitly authored word-family groups. A candidate is included only if its base and derivative occur in the same authored family, their parts of speech fit a rule, and recorded spelling changes can reconstruct the word. This **does not verify the word's historical etymology** or its semantic suitability for publication.
- **361 individually written core teaching explanations, prefix-learning drafts and curated morphology candidates**, plus **429 master-sourced compound/phrase/adverb learning drafts**, including `transport`, `import`, `important`, `photograph`, `geography`, and `reconsider`.
- **4,586 source records / 4,583 distinct headwords**. Three headwords occur in both an authored core record and a candidate record; prefer the **core** record for display only after editorial approval.
- **2,197 records (2,195 distinct headwords)** match the complete 8,653-headword master by exact headword. Their IDs and CEFR values are recorded. The other **2,389 records (2,388 distinct headwords)** are useful extra word-family candidates but are not entries in the active 8,653-word master; their `wordId` remains `null`.

## Schema
- `headword`, `wordId`, `cefrHeadword`, `matchStatus`, `wordMeaningJa` or `meaningJa`.
- `analysisType` distinguishes **modern derivation candidates**, **historical components**, and **semantic shifts**.
- `parts[]`: `surface` reconstructs the spelling; `kind` distinguishes prefix, suffix, historical/combining form, and free base. `morphemeId` refers to existing VocaRoots units when applicable.
- `explanationJa` / `learningExplanationJa`, `familyEvidence` or `sourceRefs`, review flags.
- All items have `editorialReviewRequired=true`, `productionEligible=false`, `status=draft-unreviewed`.

## Additional batches 003–005 (2026-11-17)
- 1,565 additional draft candidates were extracted from 20 further, explicitly authored word-family source files; records have unique headwords not used by earlier batches.
- In addition to exact concatenation, some candidate spellings require **final -e deletion**, **-y to -i changes**, or **final-consonant doubling**. These spelling operations are encoded in `orthographicRule`; a reconstructed spelling alone is **not** proof of a valid etymology.
- All new entries remain `draft-unreviewed` and are excluded from production. The old 2,733-headword partial index was replaced for ID lookups by the full active 8,653-headword index. Additional candidates that are not in the active master remain supplemental study material.
- All source relationships and Japanese explanations require linguistic/editorial review before linking to the VocaDash learning UI.

## Full-master reconciliation (2026-11-17)
- All 84 active `data/vocabulary-drafts/manifest.json` batch files were indexed, totaling **8,653 unique headwords / 9,614 senses**.
- Canonical matching uses exact lowercased, trimmed headword strings; no fuzzy matching, no guessed IDs. The previous 2,733-word candidate index is retained only for historical reference.
- A separate reproducible script, `tools/build-voca-roots-master-index.mjs`, regenerates the index and can audit overlaps. It does not publish data.
- Matching a `wordId` does **not** mean that a word's etymology or derived explanation has been verified.

## Master-first batches 006–008 (2026-11-17)
- A further **213 draft Word Breakdown records** were added for distinct words that are **already present in the active 8,653-word master**. The 136/59/18 records were extracted from explicit JS `family` edges, not synonyms or collocations.
- Inflection-only links were excluded: in morphology review sources, the family edge must carry the `派生・語族` marker. Extra records use the canonical VocaRoots affix meanings with base-word and target-word IDs from the full master.
- Source evidence is checked as a specific base → target family link in its source JS object, and the normalized word reconstructs from its recorded parts. Linguistic review remains required before publication.
- The 2,197 matching records cover **2,195 distinct target headwords** in the master; the other 6,458 master headwords are not yet represented by approved (or candidate) Word Breakdown records. Not every master word is meaningfully decomposable.


## Master-first batch 009: original prefix explanations (2026-11-17)
- Added **89 new master-matched Word Breakdown drafts**, with separate human-authored examples and Japanese translations. Existing entries were left unchanged; the list was checked against the previous recorded headwords before writing.
- The prefix families taught are `un-` (negation vs reversal), `in-/im-/ir-` (negation), `re-`, `mis-`, `over-`, `under-`, and `inter-`. Each new item has a known master word ID and an existing prefix morpheme ID.
- Each record includes `exampleEn`, `exampleJa`, `imageHintJa`, `baseWordId` and original `explanationJa`. `historicalEtymologyVerified=false`, `referenceLookupPending=true`, `productionEligible=false` on every record. Modern spelling segmentation is only a **learning aid**, not a certified historical etymology.
- Current totals: **3,920 records / 3,917 distinct headwords**, with **1,531 records / 1,529 distinct words matched** against the full 8,653-word master. **6,458** master words currently lack any Word Breakdown draft.

## Master-first batches 010–011: structured affixes and compounds (2026-11-18)
- **446 non-overlapping, complete-master-matched draft headwords:** **86 prefix, 276 suffix, and 84 two-base compound** breakdown candidates.
- Target words and bases were looked up exactly in the canonical 8,653-headword master. Existing IDs and original sources were not replaced.
- These are **learning segmentation candidates, not verified etymologies**. `meaningSource: "master-wordId"` points to existing vocabulary senses, avoiding guessed Japanese headword translations and artificial example sentences.
- Each record contains a reconstructed `parts` sequence, original Japanese `explanationJa`, a comprehension prompt `learningQuestionJa`, an image concept `imageHintJa`, and editorial-safety flags.
- Explicit candidate allowlists prevent many deceptive string splits; e.g. `flower = flow + -er`, `witness = wit + -ness`, and `unless = un- + less` must NOT be automatically inferred. The selected candidate list still requires semantic review, especially for lexicalized compounds.
- **Now 3,920 records / 3,917 distinct headwords; 1,531 records / 1,529 distinct master headwords** matched. **7,124** of 8,653 master headwords lack any candidate breakdown. Not all are meaningfully decomposable.
- `historicalEtymologyVerified=false`, `editorialReviewRequired=true`, `productionEligible=false` remain in effect. **0 newly approved records**, and **0 production deploys**.

## Canonical meanings and teaching examples for batches 010–011 (2026-11-18)
- All **84 active vocabulary batches** were read, and seven scoped evidence files (`master-evidence-01.json` ... `master-evidence-07.json`) retain **870 exact master word IDs** (446 targets and their component bases) with source sense IDs, Japanese meanings, original example sentences and source batch paths.
- **All 446 new Word Breakdown drafts now have a master-sourced Japanese meaning, an existing English example and its existing Japanese translation.** Word-part base glosses are also populated from the corresponding canonical master sense. This is a copy/link from the project's own draft master, not a new generative example or a historical etymology verification.
- The 84 two-base compounds additionally have individually written Japanese display glosses. **26 lexicalized or easily misread compounds** have specific semantic cautions. Where the hand-authored display gloss differs from a master sense, both are retained for editorial reconciliation.
- The live application is not wired to these draft files. The original master files were not modified. Examples and definitions in the master itself also have draft editorial status.
- Run `node tools/validate-voca-roots-master-first.mjs` to verify full ID/source/example reference integrity for the new batch, as well as `node tools/validate-voca-roots-word-breakdowns.mjs` for the entire Word Breakdown dataset.

## Root and affix family bridges (2026-11-18)
- `master-first-family-bridge-20261118.json`: **162** of the 446 new master words link exactly to existing *candidate* VocaRoots family IDs. **284** have no confirmed candidate relationship and remain unlinked.
- `master-first-root-stories-20261118.json`: **63** draft root-family teaching stories formed from **86** existing candidate root-word memberships; **18** stories contain multiple new member words. Their original etymological assertions are **not yet verified**.
- `BULK_BREAKDOWN_AUDIT_20261118.md` records counts, provenance checks, 54 high-priority semantic-risk items, and the remaining editorial tasks.
- Validate the new family bridge with `node tools/validate-voca-roots-family-bridge.mjs`. No new family link may be published solely because an exact word-ID join exists.

## Critical editorial cautions
1. **Historical roots and today's morphological segmentation are different things.** Do not teach `important` as if today's meaning literally follows from `im + port + ant`.
2. A visual match in spelling cannot establish an etymological relationship. Even exact joined forms from an authored family are only candidate records.
3. Suffix meanings are general learning hints, not definitions of every derived word (e.g. `-ism` can denote a practice or condition rather than an ideology). Check every Japanese explanation before publishing.
4. Use `full-master-index.json` (8,653 words/9,614 senses) for canonical headword lookup. An unmatched candidate is supplemental, not part of the current active 8,653-word set. Do not substitute a different word or infer an ID.
5. Avoid publishing raw external dictionary text; retain original Japanese explanations and track actual verified URLs only.

## Next steps
- Verify all historical etymologies and ambiguous derivations against reliable dictionaries.
- Use the existing 84 active master batches to keep full-master index and exact headword-to-ID mappings current; run the regeneration script after changes.
- Extend core records to the full syllabus; attach images and examples only after editorial review.
- Connect only reviewed and approved records to the VocaRoots/VocaUniverse UI and quiz engine. **Do not automatically merge or deploy.**

## Validation
Run from the repository root:

```bash
node tools/validate-voca-roots-word-breakdowns.mjs
```

This checks structure, exact spelling reconstruction, unique IDs, source-family membership, morpheme references, master-index matching, counts and safe publication flags. Passing this check does **not** certify etymological accuracy.


## Curated batch 012: high-utility transparent derivations (2026-11-18)
- Added **107 explicitly selected master-matched drafts:** **96 suffix** and **11 prefix** candidates. The original vocabulary master and pre-existing breakdowns were left intact.
- Distinct candidate breakdown coverage is now **1,636 / 8,653 (18.9%)**. This measures draft coverage only, not linguistic approval.
- The source file `master-curated-012.json` contains original Japanese learning glosses, exact base word IDs, spelling rules, comparison questions and notes about semantic change.
- False visual decompositions such as `flower = flow + -er`, `witness = wit + -ness`, `unless = un- + less` remain excluded by an explicit selection list.
- `meaningSource = original-editorial-draft-not-master-sense-verified` means **the Japanese gloss is not yet checked against the exact original master sense**. No source examples or historic etymologies have been invented or certified.
- All records remain `draft-unreviewed`, `editorialReviewRequired=true`, `historicalEtymologyVerified=false`, and `productionEligible=false`. No student UI or deployment.
- Validate using `node tools/validate-voca-roots-word-breakdowns.mjs` and `node tools/validate-voca-roots-curated-012.mjs`.


## Curated batch 013: transparent morphology and compounds (2026-11-18)
- Added **130 explicitly selected draft headwords**, with **88 suffix cases**, **19 prefixes** and **23 compound-like first elements**. All target and base IDs match the active 8,653-headword master exactly.
- Master candidate coverage now **1,766 / 8,653 (20.4%)** with **6,887** uncovered headwords. Coverage is not etymology review or classroom readiness.
- New source `master-curated-013.json` includes the whole-word Japanese gloss, base gloss, spelling-reconstruction rule, linguistic-learning question, original image concept, and editorial caution. Its glosses are original draft annotations, **not verified master sense definitions**.
- `false-split-exclusions-013.json` lists **26 explicit misleading splits** such as `flower = flow + er`, `university = universe + ity`, and `portable = port + able` (where port means a harbor), to avoid future false automatic morphological links. It is not part of the student-facing data.
- In modern teaching, `out-`, `up-`, and `down-` can be compound-like independent first elements; the dataset explicitly distinguishes these from prefixes rather than claiming shared historical etymology.
- All records remain `draft-unreviewed` with `productionEligible=false`, `historicalEtymologyVerified=false` and `editorialReviewRequired=true`. No live UI, learner quiz, main merge, or production deploy.
- Run `node tools/validate-voca-roots-curated-013.mjs` plus existing validation checks before any review or integration.

## Bulk batch 014: existing-master sense and example linkage (2026-11-18)
- **429 new unique exact-master-matched learning records**: **291** compound headwords, **95** multiword expressions and **43** adverb spelling/derivation patterns.
- The original **84 active vocabulary batches** provided sense-level meanings and paired original English/Japanese examples; **950 exact master IDs**, **1,075 source senses** were indexed in seven non-runtime evidence files. **429/429** records contain a target bilingual example plus one further sourced example. These examples were not generated from guesses in this batch.
- Each new breakdown includes original master sense IDs, component word IDs, component master sense candidates, original Japanese study prompts, a visual concept and an editorial caution. **61** entries have more specific semantic warning notes.
- Source selection was explicitly reviewed to exclude nonsense string matches, e.g. **father = fat + her** was rejected. A transparent spelling split is *not* certification of historical etymology. For `-ally` the split is a spelling-oriented learning pattern, not a claim that `ally` is an independent word in the adverb.
- Candidate master-headword coverage: **2,195 / 8,653 (25.4%)**; records total **4,586** including older out-of-master supplemental records. Not all master headwords are decomposable or suitable for Word Breakdown.
- No UI integration, main-branch merge, or live deploy; `productionEligible=false` and `historicalEtymologyVerified=false` for all new entries. Original source vocabulary itself remains draft/unreviewed.
- Validate with `node tools/validate-voca-roots-bulk-014.mjs` and the existing word-breakdown and master-first validators before review.

### Editorial review queue for batch 014
- `bulk-editorial-review-014.json` lists **all 429 new entries** by follow-up priority: **75 high**, **192 medium**, **162 low**. These are workflow priorities only, **not** linguistic approval or a CEFR confidence score.
- The queue flags 62 lexicalized-meaning cautions, 108 component-polysemy review cases, 95 phrase-vs-morpheme distinctions, 43 adverb-spelling cases, and 2 acronym capitalization comparisons. Multiple flags can occur on one entry.

## Bulk batch 015: master-sourced morphology and retrieval practice (2026-11-18)
- Added **134** non-overlapping active-master draft headwords, with exact master IDs, bilingual usage examples and curated morphology/usage prompts (including distinct -ing use types).
- Added **858** source-linked open-response practice prompts using the previous batch's **429** target words; English reconstructions accept valid paraphrases rather than strict text matching.
- Master evidence was read from **84** original source batches and retained for **266** canonical word IDs / **323** source senses in seven files.
- Candidate breakdown coverage is now **2,329 / 8,653** master words. Every record stays **draft-unreviewed**, **editorialReviewRequired=true**, and **productionEligible=false**.
- See `BULK_015_AUDIT_20261118.md`; validate with `node tools/validate-voca-roots-bulk-015.mjs`. No automatic merge or publication.
