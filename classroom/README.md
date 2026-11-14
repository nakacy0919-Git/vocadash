# VocaDash Classroom — isolated development implementation

Branch: `development/classroom-no-deploy-20261115`. No production databases, accounts, environment variables, services, or hosting were changed. `vercel.json` retains `git.deploymentEnabled: false`; there are no deployment workflows in this branch. Do not merge or deploy this branch implicitly.

## Run privately

Requires Node.js 24. SQLite uses the built-in `node:sqlite` API. No database vendor account, AI API, external QR service, or paid dependency is required for local use.

```sh
npm ci
# Choose a fresh, long random key and distribute it only to approved teachers.
CLASSROOM_TEACHER_KEY='<private-teacher-registration-key>' npm run classroom:server
# Separate terminal:
npm run dev
```

Visit `http://localhost:5173/?classroom=1`. The default allowed origin is **localhost**, not `127.0.0.1`. Set `CLASSROOM_ORIGIN` explicitly if using another development origin. Vite proxies `/api/classroom` to port 8787. The API binds loopback only. Create a teacher account using the registration key, create a class, share the locally generated QR, register students in separate browser profiles, join, distribute an assignment, and choose **学習する** from the student's assignment list. The QR's origin must be reachable by the student's device; localhost links cannot be used on a different device. No publicly reachable test server has been provisioned.

A dedicated persistent file `.classroom-data/classroom.sqlite` is created on first start. It is ignored by Git. Do not use a Copeak database path. Nothing connects to Supabase or to existing VocaDash production services.

Configuration:

| Variable | Default / purpose |
| --- | --- |
| `CLASSROOM_DB` | `.classroom-data/classroom.sqlite`; persistent, private disk only |
| `CLASSROOM_PORT` | `8787`; loopback API port |
| `CLASSROOM_ORIGIN` | `http://localhost:5173`; exact write-request Origin |
| `CLASSROOM_TEACHER_KEY` | No default; teacher registration disabled without a key |
| `NODE_ENV` | Set `production` only behind a configured HTTPS reverse proxy; requires HTTPS origin and teacher key |

## Implemented behavior

- Nickname / school-assigned login IDs; no email, real name, date of birth, country, or audio collection. Passwords are salted with scrypt. Teacher creation requires a server-held registration key; students cannot promote themselves.
- Eight-hour opaque sessions in HttpOnly, SameSite=Strict cookies. Only a token hash is stored in SQLite. Production cookies additionally require Secure. Sessions are revoked on logout and account deletion.
- Classes belong to their creator. Students join using a cryptographically random 192-bit token with a seven-day expiry. Teachers can rotate it and remove memberships. A join token does not permit reading student records.
- Assignment title, existing course/unit, unique studied-word target and deadline. Only valid local vocabulary units can be assigned, and the target cannot exceed the unit's vocabulary count. Deadlines are displayed; late work is accepted for continued learning.
- Existing **rate** and **answer** actions send attempts only while learning the assigned course and unit. Other learning remains local. A separate per-user local progress key avoids carrying another student's progress into an assignment session. ReadingPractice and future Memory Mission question types are not yet captured.
- Browser outbox is namespaced by user and assignment, bounded to 500 items. It retries batches of at most 50, with a visible pending/error indicator. Unique record IDs prevent duplicated attempts. Failed batches remain available for retry. An expired login requires logging back in and reopening the same assignment to retry. Deleting an account clears its local outbox on the current browser.
- Server checks membership on every read/write, resolves word labels from the assigned catalog, limits duration and timestamps, and never accepts client-supplied user IDs, roles, mastery values or totals. Every student receives only their own individual rows and analytics. Students cannot obtain CSVs, invite tokens, or classmates' details.
- Teacher overview: eight-row pages, name filter, review-priority order, individual details, class aggregates, growth graph, weak vocabulary, assignments and events. Class retention averages are weighted by each learner's studied words; learners never advance each other's memory state. Class word counts and growth count learner–word pairs, not a global vocabulary union.
- Teacher-only UTF-8 BOM CSV with Excel formula neutralization and proper quoting. Personal JSON export is available to each account. Password-confirmed account deletion removes the account's attempts, membership and sessions; teacher deletion also removes their classes, assignments and linked submissions. A teacher's removal of a membership revokes access but retains historical attempts until account or class deletion.
- Cooperative event progress counts distinct learner–word pairs correctly answered during the event, rather than repeated tapping. Teachers see the class total; students see their own contribution. No public rankings.
- Visible dashboards poll every 15 seconds, background tabs stop polling. Student outboxes retry every 10 seconds and when coming online. This is near-real-time polling, not WebSocket streaming.

## Measurement definitions and limits

`classroom-spaced-v1` is a versioned **pilot** model in `analytics.js`, not FSRS, a calibrated vocabulary examination, or a medical/cognitive measurement. Recall is an estimated decay curve (90% after the scheduled stability interval following a successful recall). Incorrect answers reset the level and estimated recall. Long-term mastery requires level 5+, five distinct UTC study dates and a future review due time. Only successful reviews at/after the prior due time, at least one day after the previous attempt, advance the level. The 1, 3, 7, 14, 30, 60, 120-day intervals are explicit. Very early correct reviews do not advance the level or postpone the scheduled due date. Incorrect answers reset it. Historical graphs show cumulative learned vocabulary, not standardized proficiency.

The existing `development/memory-mission-no-deploy` branch was inspected. Its `src/lib/memoryEngine.js` implements FSRS-6-oriented state and mastery functions. It is **not merged** into this branch. Before combining the projects, replace the pilot analytics adapter with the agreed Memory Engine version, replay attempt history, and maintain a migration/model version. No local personal history is silently uploaded.

Durations are capped per question at two minutes. They estimate question interaction time, not whole-session attendance, and may include time spent away from a visible tab. Offline client timestamps are accepted within 90 days and 60 seconds future drift; timestamps and correct/incorrect results remain client-reported. This is practice tracking, not tamper-proof grading. Teachers should review before using it for consequential assessment.

## Privacy and operations

Only the owning teacher may see a class roster. Other teachers, even if approved, cannot read it. Students cannot inspect other students. Parameterized SQL, foreign keys, append-only attempts, atomic batch inserts, exact Origin checks, per-session API throttles, per-ID login throttles, request-size limits, and generic internal errors are included. QR generation happens locally; tokens and roster data are not sent to third-party image services. The API does not log submitted bodies or credentials.

The initial backend is a **single-host SQLite pilot**, suitable for local integration and controlled school trials. It is not yet a nationwide multi-region service. A multi-school organization administrator, co-teachers, SSO, email recovery, centrally managed roster deletion/retention, audit trails, managed backups, data residency, consent/guardian notices, localization and national-scale load validation remain release work. The teacher key is an initial approval gate, not a complete institution-verification workflow. Lost-password recovery requires a secured administrative process; no unauthenticated recovery endpoint is provided.

For a school pilot, establish a school retention policy before entering real records. Limit disk and backup access to operators; encrypt the volume and backups. SQLite isn't encrypted by this code. Never serve the database or its WAL files from the web root. Back up via SQLite's online-backup operation / a consistent maintenance snapshot, and test restoration. Account deletion affects live storage; expire old backups according to policy. Rotate the registration key after onboarding. Shared devices should use separate OS/browser profiles and log out; the per-user outbox prevents accidental account mixing but isn't encrypted against a person controlling the device.

## Cost and scaling plan

Local development introduces no external API usage or hosting charges. This is not a promise of perpetual free hosting. No paid service or free-tier account was created. Hosting prices, quotas and terms need confirmation when choosing a provider; no unverified current pricing is baked into the design.

Cost controls implemented: no AI calls; no audio/image upload; no per-answer serverless function dependency; batched retries; indexed relational data; paused hidden-tab polling; bounded HTTP bodies and outboxes; CSV generated on demand. Current dashboards replay a class's attempts and return the roster to the authorized teacher, then paginate in the browser. This deliberately simple implementation must not be described as load-tested national infrastructure.

Before broad rollout: move storage to a separately provisioned PostgreSQL service or per-school SQLite shards behind a durable API; retain the identity/membership predicates and isolation tests; add incremental word-state and daily aggregate tables; query/paginate on the server; enforce per-school quotas; measure query/polling volume; add adaptive polling or class-scoped streams; implement administrative lifecycle, monitored rate limiting and disaster recovery. Set budget ceilings and alerts before any hosting upgrade. Do not reuse Copeak credentials or apply SQL to its databases.

## Reference and verification

Copeak Classroom was read through GitHub only. The reference design was its `profiles`, `classes`, `class_members`, `assignments` relationships in [schema.sql](https://github.com/nakacy0919-Git/copeak-classroom/blob/main/supabase/schema.sql), role-specific UI in [auth.js](https://github.com/nakacy0919-Git/copeak-classroom/blob/main/js/auth.js), and class metadata in [class-manager.js](https://github.com/nakacy0919-Git/copeak-classroom/blob/main/js/class-manager.js). No production API or database calls were made.

```sh
npm run test:classroom
npm test
npm run build
```

Integration tests use in-memory SQLite and real local HTTP requests, covering teacher/student isolation, unauthorized class access, joining, assignment delivery, duplicate synchronization, cross-user record IDs, origin checks, CSV access, membership revocation and session logout. Analytics tests cover spaced mastery, relapse, expiry and separate learner memory states. Additional tests cover account deletion, event/assignment validation, persistent SQLite restarts and offline outbox isolation. The existing repository-wide lint command is blocked by its ESLint flat-config/CLI mismatch; a targeted legacy-config lint pass is run on the new Classroom files. The production build is verified. Browser visual verification could not run in this execution environment (Chromium process/socket restrictions); iPad dimensions and touch styles are implemented but still require live device validation.
