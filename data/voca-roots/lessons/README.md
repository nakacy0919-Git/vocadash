# VocaRoots bilingual study examples (development only)

- **88 original example sentences and Japanese translations** across **22** learning units (4 examples per unit).
- Each card uses an existing 8,653-word master `wordId` and CEFR label, with an exact candidate `sourceLinkId` to an existing root/prefix/suffix. No new vocabulary IDs are created.
- Cards are authored pedagogical drafts, not proof of historical etymology. All have `editorialReviewRequired=true`, `productionEligible=false` and `status=draft-unreviewed`.
- The quality gate rejects candidate links already flagged in `quality/editorial-issues-001.json`.
- Verify using `node tools/validate-voca-roots-lessons.mjs`. Structure passing does **not** certify sentence naturalness, translations or root claims.
- The lesson JSON files are not imported by the student application and must not be deployed or merged without separate review.
