# Voca Universe × Memory Engine v1

Work branch: `development/voca-universe-memory-no-deploy` (base main `52d6c90`). No merge, PR, hosting registration, or deployment. Existing vercel.json has `git.deploymentEnabled: false`; retain this before pushing. No GitHub Actions workflows were present.

## Branch investigation

Remote branch inventory inspected 2026-11-15 JST. Main already contains moving space, warp, manual voice activation, full-library lookup, paged related-term orbits and the expanded authored semantic networks. Universe feature/integration/master/sense/bulk, viewport-fix, release/voice-control and content/universe branches are historical development paths; do not merge their whole trees over current main. Vocabulary branches concern authored content rather than the new interaction layer.

Memory branch `development/memory-mission-no-deploy` at `ab70aab` adds MemoryTrainer and memoryEngine.js (two commits above the same main). Its records are `records[word.id].memory`; recall/mastery/scheduling remain owned there. This branch intentionally does not copy those equations or modify that branch. Content branch `content/vocabulary-c2-20261115` is independent and not merged.

## Integration contract

Register from the application that owns the current learner/store, once the Memory Engine is integrated:

```js
import {registerUniverseMemory} from './lib/universeMemory.js';
const disconnect = registerUniverseMemory({
  version: 1,
  async getSnapshot({now}) {
    // Return {[canonicalWordId]: {word, wordId, meaning, attempts,
    // retrievability: 0..1, mastered: boolean, weak: boolean, dueAt: epochMs}}.
    // Compute these through the engine's public API. Include all learned words
    // with their spelling to populate a map across courses, not just this unit.
    return engineSnapshotForCurrentLearner(now);
  },
  async recordAttempt(attempt) {
    // Persist before resolving. Throw if persistence fails.
    // Use attemptId as an idempotency key and resolve missing wordId by spelling.
    // This is relation recall, not proof that every sense of either word is mastered.
    await engineRecordAttemptForCurrentLearner(attempt);
  },
  subscribe(listener) { return subscribeCurrentLearnerRecords(listener); }
});
// Call disconnect() on logout/profile switch; register the new learner's adapter.
```

A component-specific `memoryAdapter` prop is also supported. `subscribe` is optional and must return an unsubscribe function. Async snapshot responses are guarded against unmount/provider replacement and out-of-order reads. Background tabs skip the minute refresh. After an answer, the snapshot is fetched again.

Attempt: `{version:1, attemptId, source:'universe', wordId:null|string, word, targetWord, kind:'synonym'|'family'|'collocation', correct, responseMs, hintUsed, answeredAt}`. Engine owner decides grading, retry scheduling, skill weighting and persistence. A resolved `recordAttempt` means saved, not merely queued. No pending attempts are silently stored in another learner's browser profile.

Snapshot keys accept canonical IDs or normalized spelling. IDs take precedence. No local FSRS implementation. `mastered` alone is insufficient: overdue/low recall is displayed as fading. Weak, fading, learned, mastered and new have text plus border/lighting differences. Existing `records` supply conservative legacy states; legacy level never claims long-term mastery. Without an adapter, quizzes are explicitly practice-only and do not alter memory records.

## Features and limits

- Center planet: select a word, then tap Review to open its relation recall quiz.
- My Universe and weak/due maps: at most 18 buttons per page. Existing app store supplies known IDs in loaded course words; an engine snapshot with word metadata supplies cross-course vocabulary. This is the current browser learner, not a new account/cloud synchronization service.
- Related-term tap still immediately warps to that term. Trail capped at 50; no navigation grows without bound.
- Synonym/family/collocation quizzes use authored Japanese cues and a typed registered expression; no ambiguous multiple-choice distractors. Hint records first-letter disclosure; double submits are locked. Alternative valid English answers are not semantically judged: feedback names the registered expression.
- Exploration mission: visit three distinct planets during the panel session. Exploration never awards long-term memory mastery.
- Dash: manually enable the existing voice interface; “Dash show my universe”, “Dash show weak words”, “Dash start mission”, “Dash start review”, “Dash quiz me”. Existing focus/filter/map commands preserved. No automatic microphone start.
- iPad: 44px minimum new touch controls, responsive overlay learning panel with a close button, internally scrolling panel, paged map, CSS-only lighting. One near-star layer is suppressed while learning is open. Existing reduced-motion support retained. No WebGL, canvas animation loop, new network polling, or new dependencies.
- Existing entry bundle remains large (~13.5 MB uncompressed); broad lexical-data splitting is a separate existing architecture concern. This work bounds visible nodes but does not claim to solve all startup costs.

## Validation

Unit suite includes memory mapping, unknown IDs, legacy/engine distinction, fading/brightness, exact answer normalization, adapter versioning and lifecycle, and new voice commands. Production build must pass. Browser smoke check: create → Universe → Review → type generate → correct response and practice-only notice. Actual iPad hardware and microphone recognition are not verified in this environment. Cross-chat engine integration is contract-ready, not yet wired to a deployed engine.
