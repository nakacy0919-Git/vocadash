# Vocabulary authoring handoff — 2026-11-15

The user has explicitly requested saving the content produced in this conversation to Git. The target is the public repository `nakacy0919-Git/vocadash`, branch `content/vocabulary-completion-20261114`. This authorizes repository storage, not deployment or a main-branch merge.

## Authoritative draft state

- `manifest.json`: 7,019 headwords, 7,714 sense/draft records, 15,428 distinct English examples with Japanese translations, 59 batches.
- `batches/`: original definitions, Japanese meanings, contextual synonym/paraphrase candidates, examples, collocations and usage notes.
- `exports/examples/` and `exports/synonyms/`: separate derived data for downstream integration.
- `quality/master-coverage.json`: 1,634 master headwords still undrafted: 769 C1 and 865 C2.
- `PROJECT_PROGRESS_20261115_JA.md` and `quality/project-status-20261115.json`: source/test-based project status snapshot, including the difference between privately authored content and the inspected main branch.

All entries remain `draft-unreviewed`. Full semantic and translation review, sense-boundary decisions and the historical 53-headword synonym-status backlog remain outstanding. The earlier 170 B2 definition flags remain an editorial queue, not resolved errors.

Historical progress reports describe the state when each was written. Statements that no GitHub push had been performed refer to those authoring passes. This handoff records the later explicit authorization to save the cumulative work to Git.

## Validation

Run from the repository root:

```sh
node tools/validate-vocabulary.mjs
```

The current draft validator reports zero errors and zero warnings. It checks required fields, counts, IDs, language presence, exact duplicate sentences and the newest derived exports. These checks do not amount to editorial approval.

The private 8,653-row reference master is retained in its original Google spreadsheet and is not included in this public repository. If an authenticated local copy is available, run:

```sh
node tools/audit-vocabulary-coverage.mjs --master PRIVATE_REFERENCE_JSON
```

Do not invent master IDs. Continue C1/C2 drafting against the verified private reference.

## Integration and publication

No runtime source changes are included in this cumulative content save. New content is not automatically a new normal-learning course. Course assignment and Memory Mission integration remain separate tasks.

The branch keeps `vercel.json` with `git.deploymentEnabled: false`. No deployment or main-branch merge is authorized by this handoff. Previously inspected main tests passed 71 cases, and the separate Memory Mission branch passed 78; see the project status snapshot for the inspected commits and limits.
