# Memory Engine implementation handoff — 2026-11-15

Base: `development/memory-mission-no-deploy` at `ab70aab5952979d05deedf4fb3fcbc3dfc9abcbe` (see exact base below).
Working branch: `development/memory-engine-20261115-no-deploy`.
No merge, pull request, deployment or deployment configuration change is included.
Inherited `vercel.json` has `git.deploymentEnabled: false`.

## Owned files / parallel development boundary

- `src/lib/memoryEngine.js`: equations, evidence grading, queue, plan, skill analytics, mastery, review history.
- `src/components/MemoryTrainer.jsx`: timing, adaptive questions, plan, weak-word/history display.
- `src/VocaDash.jsx`: only MemoryTrainer's onRecord callback, passing evidence to reviewMemory.
- `src/lib/memoryEngine.test.js`: regression and conformance tests.
- `src/lib/fixtures/fsrs6-reference.json`: independently generated reference states.
- `tools/generate-memory-reference.mjs`: optional fixture regeneration.
- This handoff document.

Vocabulary content, Universe, ordinary quizzes, reading, voice controller, dependencies,
lockfile, hosting and persistence infrastructure are outside this change. For parallel
integration, cherry-pick this commit, or transplant only the callback change if
`src/VocaDash.jsx` has other work. Do not replace that file wholesale.

## FSRS verification and deliberate policies

Compared the public FSRS-6 equations and the upstream TypeScript implementation:

- https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm
- https://github.com/open-spaced-repetition/ts-fsrs (inspected source commit
  `e74ffc7c944e8772fc3705d44723453ccb6d7fd0`)
- Installed **ts-fsrs 6.0.0 outside the app**, explicitly selected its **FSRS6Algorithm**,
  and generated 256 state-transition fixtures. The package's default model is no
  longer assumed to be FSRS-6. No runtime or paid API dependency was added.

The fixture matrix includes initial states and S=.001/.212/2.3065/30/365,
D=1/6.4/10, elapsed=0/1/7/90 days, and all four grades. State comparisons
allow relative/absolute 1e-6 for upstream eight-decimal rounding.

Fixed same-day Hard stability shrinking: current equations require a gain of at
least one for Hard/Good/Easy. Removed the extra 15% failure penalty from the
memory model; FSRS already computes failure stability. During comparison,
ts-fsrs 5.2.3 exhibited the older Hard behavior, so fixtures use 6.0.0.
Inverse forgetting curve now supports retention targets (.80–.97 on review,
default .90). Core transitions use elapsed whole 24-hour days, as before;
continuous recall probability is used for display and urgency.

Product policies, **not FSRS formulas or clinically calibrated predictions**:

- Wrong=Again; hints, self-report or slow correct=Hard; independent correct=Good.
  Speed never automatically awards Easy. Slow thresholds: meaning 12s, typing
  30s, cloze 20s, listening 40s, recall 20s. Hidden-tab timing is discarded.
- Again has a 10-minute learning step; same-day Hard has a 60-minute step.
  Other intervals use the inverse curve, rounded to at least one day.
- Due failed items lead other due reviews, then recall risk and overdue ratio.
  Future reviews stay excluded. Immediate session retries retain a maximum of
  two additional appearances per word, normally after three intervening items.
  Hard answers now also receive bounded retries.
- Every third question keeps the existing format rotation; other turns target
  the available format with lowest unaided success rate, then least-recent use.
- Plan estimates 20–90 seconds per item from the learner's latest format response
  times plus 10 seconds feedback (30s without data). Reviews consume the time
  budget first. New words are capped at ten per browser-local day across saved
  records. Current loaded course/unit bounds the words available to the plan;
  it does not load the entire vocabulary catalog automatically. The selector
  supplies a 3/5/10/15-minute budget. Duration estimates are heuristic and retries
  can make sessions longer.
- Long-term master: >=3 delayed unaided successes since last lapse, S>=30 days,
  last grade >=Good, >=2 unaided typing or listening successes in one productive
  format, and the existing conservative 30-day mastery score >=80. It can be
  revoked by forgetting/failure. This is an app threshold, not proof of permanence.

## Data and limitations

Existing per-word memory state and legacy numeric `skills` counts remain readable.
Version 2 adds `skillStats`, `introducedAt`, `retention`, and bounded `history`
(last 200 events per word). Each event records pre-review recall, grade, response
milliseconds, hint flag, stability, difficulty, next due and mastery. Legacy
format correctness and historical reviews are not fabricated. Legacy records
get no invented introduction date or productive mastery credit.

The ready screen shows the five highest-priority studied words in the loaded
unit and the latest five history events for each. Full retained history remains
in the memory record. Storage is still localStorage, device/browser specific,
with the existing save-failure alert. Large histories can exhaust browser quota;
cloud sync, IndexedDB and personalized FSRS weight fitting are not implemented.
The defaults adapt schedules to individual evidence; they do not fit weights.

Research rationale: repeated retrieval and spacing, rather than immediate
repetition alone, support long-term vocabulary retention:

- Karpicke & Roediger (2008), *The critical importance of retrieval for learning*:
  https://pubmed.ncbi.nlm.nih.gov/18276894/
- Karpicke & Bauernschmidt (2011), *Spaced retrieval: absolute spacing enhances
  learning regardless of relative spacing*: https://pubmed.ncbi.nlm.nih.gov/21574747/

These papers motivate delayed-retrieval requirements. They do not validate our
specific speed thresholds, mastery percentage or daily budget policy.

## Verification

- `node --test src/lib/memoryEngine.test.js`: 16 passing tests, including 256
  upstream conformance cases, inverse curve, hint/time grading, migration,
  history bound, daily rollover, priority, adaptive formats and mastery revocation.
- Full test suite: **87/87 passing**. Production build: **passed**, with the
  existing large-bundle warning. Targeted hooks/syntax ESLint check: passed.
- `npm run lint` is already broken at the base: flat-config ESLint rejects `--ext`.
  Kept the shared lint setup unchanged to avoid unrelated parallel conflicts.
- Browser smoke test attempted but Chromium could not start: the execution
  environment denied its process-singleton socket. No visual/browser interaction
  verification is claimed. Local Vite startup at 127.0.0.1 succeeded.
