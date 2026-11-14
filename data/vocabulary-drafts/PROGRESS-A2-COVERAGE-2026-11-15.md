# Remaining A2 headwords drafted — 2026-11-15

## Added in this pass

- 578 previously undrafted A2 headwords, from **joy** through **zone** in the master sequence.
- 578 sense records, each with an original English definition, Japanese meaning, usage note and an English collocation.
- 1,156 original English examples with corresponding Japanese translations.
- 276 contextual synonym/paraphrase candidate fields. Other entries explicitly retain an unassigned-synonym status; none are treated as semantically approved.
- Derived example and definition/synonym exports, validated against their source batches.

The two internal batches contain 289 records each. Every record remains **draft-unreviewed**. Master levels describe headwords, not the difficulty of individual examples. Images are not generated.

## Current master coverage

| Level | Target | Drafted | No draft |
| --- | ---: | ---: | ---: |
| A1 | 1,064 | 1,064 | 0 |
| A2 | 1,243 | 1,243 | 0 |
| B1 | 2,139 | 2,139 | 0 |
| B2 | 2,417 | 1,725 | 692 |
| C1 | 914 | 37 | 877 |
| C2 | 876 | 11 | 865 |
| Total | 8,653 | 6,219 | 2,434 |

All A1/A2/B1 master headwords now have at least one draft sense. This is **not** exhaustive sense coverage or editorial approval. There are 6,914 sense records, 13,828 English examples and translations, and 55 batches. Editorial review remains pending throughout. An additional 53 older headwords still need a synonym candidate or explicit synonym-status note; the coverage report preserves that backlog separately.

## Quality checks and corrections

- Draft validator: zero errors and zero warnings for counts, required fields, unique sense/example IDs, English/Japanese text presence, exact duplicate sentences and current derived-export correspondence.
- Master reconciliation: zero word-ID/headword mismatches.
- Three English sentences colliding with older or newly authored sentences were rewritten, with Japanese translations updated.
- Corrected a noun/verb example mismatch for panic, an adjective/noun mismatch for public, and several unnatural or imprecise phrases before final validation.
- Corrected coarse source labels where necessary: weep is authored as a verb; short/shorts has a display form of shorts; the verb license/licence displays as license. IDs and source headword strings remain stable.
- Contextual candidates are explicitly restricted by sense, grammar or register. They include explanatory paraphrases as well as lexical synonyms and are not guaranteed substitutes in every sentence.
- The sentence hash index covers all 55 batches.

## Publication and next work

This pass is a private downloadable snapshot. No GitHub push, runtime import, main-branch update or deployment was performed. Vercel's existing `git.deploymentEnabled: false` is preserved. The complete private source master is excluded from the package.

The next headword drafting work is the remaining 692 B2, 877 C1 and 865 C2 entries. Full semantic review and missing-sense decisions are still required before any release can be called complete.
