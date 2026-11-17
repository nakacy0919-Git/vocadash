# VocaRoots — master-first Word Breakdown development audit
Date: 2026-11-18. Branch: `content/voca-roots-20261117`. **Development data only. Not deployed.**

## Coverage and counts

| Metric | Before this session | After |
| --- | ---: | ---: |
| Word Breakdown source records | 3,474 | 3,920 |
| Distinct headwords with drafts | 3,471 | 3,917 |
| Exact-matched headwords in the 8,653-word master | 1,083 | 1,529 |
| Master headwords without a draft | 7,570 | 7,124 |
| Master headword coverage | 12.5% | 17.7% |
| Fully editorial-approved entries | 0 | 0 |

The master contains **8,653 headwords / 9,614 senses**; coverage of **17.7%** is *candidate draft coverage* and is not etymology accuracy or product availability.

## Added learning content

- **446 new canonical master-linked Word Breakdown drafts:** 86 prefix candidates, 276 suffix candidates and 84 compounds. All have a `wordId`, CEFR, reconstructed parts, Japanese explanation, learning question and image concept.
- **446 / 446** now have the original master's Japanese meaning, an existing English sentence and Japanese translation; each stores its source sense ID and source batch location rather than inventing an example.
- **870 unique master word IDs** (targets and their component bases) were found across **84 active vocabulary batch files**, stored in seven non-runtime source-evidence files.
- **84 compound entries** also have individual Japanese display meanings; **26** have specific lexicalized-meaning cautions.
- **28 affix entries** are specifically flagged for polysemy, nonliteral meaning, or ambiguous prefix/suffix scope. Together, **54** new entries are prioritized for linguistic review.
- **162 / 446** new records have candidate relations to existing VocaRoots morpheme links; **284** remain without any existing morpheme-family link and are **not** given guessed family memberships.
- **63 root-family learning story drafts** reference **86 candidate root-word memberships**. **18** root stories have at least two new member words; these are planning stories, not verified historical etymologies.

## Safety and editorial quality

Every new Word Breakdown has `status="draft-unreviewed"`, `productionEligible=false`, `historicalEtymologyVerified=false`, and `editorialReviewRequired=true`. Original vocabulary IDs, 84 original source batches, old Word Breakdown records, and active application source files remain unchanged.

String matching alone is **not** sufficient for word history: avoid false segmentation such as `flower = flow + -er`, `witness = wit + -ness`, or `unless = un- + less`. Also distinguish historical etymology, modern productive derivation, and lexicalized compound meanings. Existing root-family links have not yet been fact-checked by independent lexicographic sources.

## Checks performed

Connector-backed structural and provenance audits returned zero errors for new word IDs, base IDs, segment reconstruction, duplicate detection, draft/publication flags, reference sense IDs, 446 original examples, the 870-word evidence set, source batch count, and the updated CEFR coverage report.

Two reproducible repository validation scripts were added:
```bash
node tools/validate-voca-roots-word-breakdowns.mjs
node tools/validate-voca-roots-master-first.mjs
node tools/validate-voca-roots-family-bridge.mjs
```
**Important:** The scripts are committed for local/CI execution; the checks above were performed against fetched GitHub JSON by the connector, not by running `node` in a local clone.

## Next editorial tasks

1. Review high-priority 54 semantic/morphological caveats and approve exact sense-level explanation matches.
2. Audit uncertain historical root claims against dictionaries with documented source URLs; avoid invented origins.
3. Decide which among the remaining 7,124 master words are productively decomposable; do not force segmentation for opaque or monomorphemic words.
4. Author or generate actual images only after their linked word meanings and examples are approved.
5. Connect only approved data to the Word Breakdown UI and learning/review engine in a separately reviewed change. **No production merge or deploy is authorized by this draft batch.**
