# Vocadash vocabulary draft content

This directory is **not used by the running app**. The original spreadsheet is preserved as a backup. Content is stored in GitHub to make large-batch drafting and validation easier.

- `manifest.json` — totals and ordered batch filenames
- `batches/batch-XX.json` — one record per **specific sense**, each with a headword ID, sense ID, part of speech, Japanese meaning, concise original English definition, context-limited synonym(s), two English examples with Japanese translations, and an optional image idea
- `../../tools/validate-vocabulary.mjs` — validator for missing data, duplicate IDs, exact duplicate sentences, and manifest counts

### Workflow

1. Write 100–500 sense records per new JSON file. Generate **new original** English sentences and Japanese translations.
2. Keep `wordId` stable; create a unique `senseId` per meaning, not per spelling. Record both simple and alternative-context examples.
3. Update `manifest.json` and run `node tools/validate-vocabulary.mjs`.
4. Review semantic fit, grammar, translation accuracy, synonym restrictions, duplicate meanings, and rights to all imported material.
5. Only after editorial review, export an approved package and wire it into the application deliberately.

The current records are `draft-unreviewed`. No images exist yet. Headword CEFR is not the difficulty of individual senses or sentences.

**Important:** This existing repository is public, including this branch. Confirm the rights to any externally sourced master word lists before adding them. Do not add private student information. Do not import `data/vocabulary-drafts` into `src/data` as part of Vite's glob: the app currently imports `src/data/*.json`.
