# Vocabulary master reconciliation and gap filling

This is an **incomplete, unreviewed content draft**, not a completed 8,653-word release.

## Added in this pass

- 574 previously undrafted headwords: 523 A1 and 51 B1.
- 574 sense records with original English definitions and Japanese meanings.
- 1,148 original English sentences with Japanese translations.
- 574 collocation examples and 574 Japanese usage notes.
- Context-limited synonym candidates where suitable; function words and specific names are not assigned artificial synonyms.
- Separate example exports and definition/synonym exports, checked against source batches.

Master word IDs were verified against the private reference spreadsheet. The complete externally sourced master is not copied into this repository. Grammatical descriptions correct several coarse source labels: contractions, interjections and the combining forms `-hearted` and `-ness` are explicitly described. Master spellings/IDs are retained for reconciliation, with display labels for slash-separated spellings and combining forms.

## Cumulative draft coverage

| Headword level | Reference target | Drafted | No draft |
| --- | ---: | ---: | ---: |
| A1 | 1,064 | 1,064 | 0 |
| A2 | 1,243 | 165 | 1,078 |
| B1 | 2,139 | 2,139 | 0 |
| B2 | 2,417 | 1,725 | 692 |
| C1 | 914 | 37 | 877 |
| C2 | 876 | 11 | 865 |
| Total | 8,653 | 5,141 | 3,512 |

There are 5,836 sense records and 11,672 distinct English examples with translations in 51 batches. A headword with one drafted sense is not equivalent to exhaustive coverage of all its senses. All records still require editorial review. In addition to 3,512 undrafted words, 53 existing headwords need a synonym candidate or an explicit explanation of why none is assigned. These are not silently treated as complete.

## Validation

- `node tools/validate-vocabulary.mjs`: zero errors and zero warnings, including example-ID uniqueness, required fields, language presence and current derived-export correspondence.
- Four new sentences matching older sentences were rewritten with corresponding Japanese translations.
- Full reference reconciliation: zero word-ID/headword mismatches.
- The sentence hash index now covers all 51 batches rather than only the initial seven.
- `node tools/audit-vocabulary-coverage.mjs --master PRIVATE_REFERENCE_JSON --require-complete` intentionally returns exit code 1 while the dataset is incomplete. It exports only master IDs and aggregate counts into `quality/master-coverage.json`; the reference file stays outside the repository.

## Remaining work

1. Draft the remaining 3,512 headwords, starting with A2 gaps, then B2/C1/C2.
2. Resolve the 53 existing headwords without synonym decisions.
3. Review sense fit, English naturalness, Japanese accuracy, synonym limits and lexical variants across the entire dataset.
4. Add any necessary missing senses; only mark approved records after review.

## Deployment

Only draft data and authoring validation tools are changed. No runtime imports, main-branch edits or deployment commands are part of this pass. This branch retains `vercel.json` with `git.deploymentEnabled: false`.
