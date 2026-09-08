# Kirmya project completion plan — 6 September 2026

The recommended release decision remains **HOLD for broad public launch**. Complete the core hiring journey and its security, persistence and release gates first; then finish and verify the remaining platform domains. Closing the latest audit findings is a milestone, not proof that the entire platform is finished.

## Evidence and interpretation

- Baseline: commit `5f6790a95ae02d74666b668ab62e140d861424ec`, also the current local HEAD. The working tree has existing report changes and staged CORS/generated-type changes; preserve and review them when establishing a release candidate.
- The [September 5 audit](../audit-review/reports/KIRMYA_AUDIT_REPORT_2026-09-05.md) has **20 findings: 15 P1 and 5 P2**. Its [reconciliation](../audit-review/reports/AUDIT_RECONCILIATION.md) covers 92 historical reports and supporting audit inventories. Prior readiness percentages are not current evidence.
- This planning review screened report scopes, claims, remaining-work sections and reconciliation mappings, read the current finding register and implementation guide, and spot-checked current source. It is not a fresh exhaustive code/security audit, a new test run, or deployment certification.
- Current source still drops the candidate ID in application timeline retrieval, contains unconditional no-op privacy writes, permits database-free CI, supplies an unversioned frontend API base, and suppresses security scan failures. These support keeping the latest release hold.
- The [Phase 1 security report](../SECURITY_PHASE1_COMPLETION.md) records additional residual identity, session, limiter, migration and provider work. Literal `GetString("user_id")` reads still occur in current handlers; exact affected routes and exploitability require focused tracing. Do not assume its historical count of 79 sites in 31 modules is a freshly verified count.
- [PLAN.md](../PLAN.md) is a historical database-connectivity plan, not a full-project roadmap. Do not use its migration/table totals as current schema targets.
- Password reset, mentorship identity, billing guards and SQL implementations have improved since the master audit. Retest these boundaries; do not blindly implement the old recovery plan again.
- Step 1 repaired misplaced addendum links and links into the absent `updated-audit-reports/` folder by pointing to the existing local reports. The unavailable historical `verification/` reference is recorded explicitly in the [missing-reference ledger](project-baseline-2026-09-06/MISSING_REFERENCES.md); it is not verification evidence.

## Completion rules

Create one module/route matrix with: user outcome, web/mobile route, API operation, service, database tables, provider dependency, role/ownership rules, automated tests, manual evidence, owner and status. Use `unverified`, `open`, `in progress`, `verified`, and `deferred` as distinct states. A disabled or deferred feature is not completed.

The working assumption is that the full project includes every existing product domain, including advanced career tools and mobile. New ideas in historical “top ten” lists are a separate enhancement backlog. Decide which are actual product commitments before adding them to the completion denominator. Preserve existing free-access promises until a product decision explicitly changes them; billing code alone does not authorize monetization.

Each implementation change must include its acceptance evidence, affected audit IDs and one responsible owner. Owner roles below are proposed responsibilities, not assignments to actual people. Prefer small dependency-ordered PRs over another numbered prompt campaign.

## Step 1 — Establish a trustworthy baseline and backlog

**Deliverables completed 6 September 2026:** [baseline, issue register and module/report ownership](project-baseline-2026-09-06/README.md). This completes Step 1 planning artifacts, not runtime verification or F20 release closure.

**Owner:** technical lead with QA. **Dependencies:** none. **Finding:** F20.

1. Capture HEAD, staged/unstaged changes, toolchain versions, route inventory and actual migration inventory without exposing environment secrets.
2. Import F01–F20 into one issue register; add the security residuals and historical unfinished work as items requiring verification.
3. Record existing fixes as historical/source-supported until their acceptance tests pass on the chosen candidate.
4. Repair audit links and classify each claim as historical, source-inspected, test-verified or unverified.
5. Define the core beta surface and the full-platform surface using the module matrix.

**Exit:** every report maps to an owner/workstream; every known finding has a testable closure condition. No unsupported completion percentage.

## Step 2 — Make failures visible in development and CI

**Delivery batch completed 7 September 2026:** the fail-closed harness is implemented and its runs are recorded in [Step 2 delivery evidence](STEP2_DELIVERY_EVIDENCE_2026-09-06.md). The harness applied and tracked all 94 migrations twice, verified PostgreSQL and Redis, exercised real HTTP persistence and authorization, reproduced the three historical lint failures, ran the built frontend against the real API, and rejected deliberately broken SQL, authorization, scanner and report fixtures. The initial unit stall was reproduced as an infinite render caused by an unstable authentication mock and fixed without changing product behavior. Browser product checks remain release blockers; completing this step does not make the release green.

**Owner:** platform engineer with QA. **Dependencies:** step 1. **Findings:** F11, F12, F19.

1. Reproduce and fix the three reported lint errors without disabling the rule. Triage remaining warnings by effect.
2. Run frontend lint, explicit typecheck, Vitest and production build as separate required checks.
3. Add a required isolated PostgreSQL/Redis integration job; run migrations and actual HTTP requests. Missing dependencies or skipped mandatory tests must fail this job.
4. Install Playwright reproducibly in the appropriate package/lockfile, launch the built web app and real API, and execute root `test/e2e` specifications explicitly. Add narrow/mobile viewports to existing browser coverage.
5. Make dependency/scanner failures block according to a documented policy; pin tool/action versions, align Go toolchains, and retain reports. Exceptions need owner, reason and expiry.
6. Verify that deliberate SQL/authorization failures in disposable test fixtures fail the relevant gate. Preserve traces, screenshots, logs and skipped-test counts.

**Exit:** the harness detects real failures. Product integration checks can remain red while defects are fixed; they must be green before release.

## Step 3 — Close identity, authorization and session gaps

**Delivery batch completed 7 September 2026:** recorded in [batch 2 delivery evidence](BATCH2_DELIVERY_EVIDENCE_2026-09-07.md). Every caller now resolves from the verified identity; the Phase 1 identity scan reports 0 residual sites, down from 32 files. The analytics route groups, which carried no authentication at all, are closed, and recruiter and company analytics verify organization membership instead of trusting a query parameter. Item 5 is partly complete: password reset, refresh rotation and logout are verified, and the discarded session-revocation error was fixed on the same day so a failed revocation can no longer be reported as a successful reset. The access-token revocation policy itself (R02) is **not** implemented — an issued JWT stays valid for its remaining 15-minute lifetime — and item 6's handler-registration completeness check (R05) is **not** implemented. Both remain open with reasons recorded in that document.

**Owner:** backend/security engineer. **Dependencies:** steps 1–2. **Finding:** F01 plus Phase 1 residuals.

1. Carry candidate ownership through the timeline service and SQL query. Foreign and unknown applications return a consistent not-found response.
2. Trace all legacy identity reads and synthetic UUID fallbacks. Use the shared verified identity accessor; distinguish the caller from a legitimate requested public-profile subject.
3. Verify analytics authentication and organization scoping before changing identity extraction.
4. Exercise candidate A/B, recruiter organization A/B, anonymous, suspended and administrative roles across all registered protected routes. Verify private notes and attachments separately from summary access.
5. Verify password reset, refresh rotation, logout and session revocation. Implement the chosen access-token revocation policy and test reset/logout across existing sessions.
6. Complete promised admin MFA/recovery controls, validate browser cookie/CORS behavior, and make required handler omissions fail startup or a completeness check. Review the existing staged CORS patch as part of this work.

**Exit:** no caller is assigned a synthetic identity; unauthorized reads/writes are denied; session behavior matches the documented policy and regression tests.

## Step 4 — Make persistence and migrations reliable

**Delivery batch completed 7 September 2026:** recorded in [batch 2 delivery evidence](BATCH2_DELIVERY_EVIDENCE_2026-09-07.md). Production refuses `ALLOW_NO_DB` and a nil pool, the applications repository propagates query, scan and iteration errors instead of reporting them as empty data, and migrations fail on missing assets and serialise on an advisory lock with concurrency verified in CI. Item 5 is partly covered: restart durability and uniqueness are exercised, slow-query inspection is not.

**Owner:** backend/platform engineer. **Dependencies:** step 2. **Findings:** F13, F18.

1. Reject production `ALLOW_NO_DB=true`; refuse write traffic when required persistence is unavailable. Verify startup and runtime readiness separately.
2. Exercise clean-database installation and upgrades from the previous supported schema. Verify migration locking, failure recovery and schema tracking; missing migration assets cannot silently pass a required migration step.
3. Replace production nil-store/no-op paths with durable repository behavior or an explicit unavailable state. Trace actual methods, not just constructor names or registry entries.
4. Propagate query, scan, iteration and commit errors through stable API errors. Separate empty data from service failure.
5. Test foreign keys, uniqueness, transaction rollback, concurrent submissions and restart durability; inspect slow queries before adding indexes.

**Exit:** writes persist, failed writes do not report success, upgrades are reproducible, and API restarts do not erase business data.

## Step 5 — Standardize API clients and contracts

**Delivery batch completed 7 September 2026:** recorded in [batch 2 delivery evidence](BATCH2_DELIVERY_EVIDENCE_2026-09-07.md). One documented API base convention, thirteen feature clients moved onto the shared authenticated client, the synthetic bearer removed, saved-job bookmark and job identifiers mapped explicitly, and the apply alias reading its path before validating the body. Item 6, cache invalidation and cross-tab logout, is **not** covered by this batch.

**Owner:** frontend and backend engineers. **Dependencies:** steps 2–3. **Findings:** F05, F06, F07, F17.

1. Adopt one documented API base convention including `/api/v1` and use the shared authenticated client for protected calls.
2. Trace imports before deleting old clients. Remove reachable fixed bearer UUIDs, localhost destinations and caller-identity placeholders.
3. Map saved-job bookmark IDs and job IDs explicitly; verify display, navigation and removal with different IDs.
4. Fix `/jobs/:id/apply` path/body validation and document the canonical application contract.
5. Align route/status/error/pagination contracts and add generated or validated frontend DTOs from the canonical API specification.
6. Verify cache invalidation, retry handling, user-switch cache clearing and cross-tab logout.

**Exit:** the exact production build signs in, refreshes, searches, saves and applies through real mounted endpoints as the correct user.

## Step 6 — Finish the candidate-to-recruiter hiring journey

**Delivery batch completed 7 September 2026:** recorded in [batch 3 delivery evidence](BATCH3_DELIVERY_EVIDENCE_2026-09-07.md). The canonical flow now stores verified PDF bytes and metadata under candidate ownership, snapshots edited contact fields and the selected attachment, validates required answers and open jobs, rejects foreign documents, and makes retries idempotent. Recruiter reads and transitions are scoped to owned jobs; real interview scheduling uses timezone-aware instants, conflict locks and candidate-visible cancellation, and concurrent overlapping bookings are exercised. Publication itself was broken and is fixed: a new recruiter's first action failed on the organization and recruiter-profile foreign keys, a job published without skills made the whole public board return 500, and the recruiter's own listing answered with two jobs that do not exist. The suite had been seeding every job with direct SQL, which is why those defects survived; a test now publishes through the API. The production-build Playwright journey and the real PostgreSQL/Redis integration suite passed as required CI checks on the delivery commit `6b87eb1`: 64 browser tests across four projects and the Go integration gates with no failures and no skips. Two further defects were found by those CI runs and fixed — WebKit could not hold a session over the suite's plain-HTTP origin, and a page reload could revoke every session the account had.

**Owner:** hiring-domain engineer with frontend/QA. **Dependencies:** steps 3–5. **Findings:** F03, F04 and related F01/F05/F13/F17.

1. Implement one canonical owned-document flow: upload, verify object/type/size, register actual metadata, list, download and delete. Apply the upload scanning policy before processing untrusted documents.
2. Define and persist the application snapshot: intentional contact edits, owned resume attachment, cover letter and screening answers. Never drop editable inputs.
3. Enforce required screening answers and job eligibility server-side; reject foreign attachments, closed jobs and invalid state transitions.
4. Prevent duplicate submissions with a durable idempotency/uniqueness strategy; show a persistent receipt and the actual submitted attachment after reload.
5. Complete recruiter review, notes visibility, authorized stage changes, interview scheduling, cancellation and candidate notification. Test timezones and concurrent slot booking.
6. Run the entire journey with fresh accounts and real storage/database records, including API restart and retry failures.

**Exit:** job publication → discovery → account/profile → document → application → recruiter review → interview/stage response → candidate update passes in browser and HTTP tests.

## Step 7 — Complete privacy controls and data lifecycle

**Delivery batch completed 7 September 2026:** recorded in [batch 3 delivery evidence](BATCH3_DELIVERY_EVIDENCE_2026-09-07.md). Legal-version acceptance, cookie consent, consent history, preferences and privacy requests now read and write PostgreSQL records. Recruiter/person search, conversation initiation, AI consent decisions and optional analytics consume those preferences. Export and deletion workers claim durable jobs, record attempts and failures, resume after restart, support authorized cancellation, enforce legal holds, expire owner-only downloads and remove candidate document bytes during deletion. A deletion that failed for any reason other than a legal hold used to lose both its recorded error and its consumed attempt with the rolled-back transaction, so the worker retried the same broken deletion indefinitely; the failure is now recorded outside that transaction and is covered by a test that fails against the unfixed code. Document scanning remains a PDF-signature and test-signature check rather than an antivirus integration. This is implementation verification, not legal certification.

**Owner:** backend engineer with product/privacy owner. **Dependencies:** steps 3–4. **Finding:** F02.

1. Persist document/version acceptances, consent history and privacy preferences.
2. Enforce preferences in profiles, recruiter search, messaging, AI and optional analytics; saving a switch is not sufficient.
3. Implement export/deletion jobs with real pending/processing/completed/failed states, durable retries, cancellation where supported and expiring authorized downloads.
4. Verify retention and legal-hold behavior against the agreed product policy; keep implementation verification distinct from legal certification.
5. Test account isolation, restart/read-back, worker failure, deletion propagation to storage/search/cache and export expiry.

**Exit:** every displayed privacy state corresponds to durable records and actual downstream behavior.

## Step 8 — Complete communications and the public experience

**Owner:** frontend/product engineer with platform support. **Dependencies:** steps 5–7. **Findings:** F08, F09, F10, F14, F15, F16.

1. Remove unsupported counters, testimonials and personalized probabilities immediately. Replace them only with sourced content or reproducible metrics; use insufficient-data/error states.
2. Wire newsletter and saved-search alerts to persistent subscriptions, confirmation, real delivery, preferences and unsubscribe handling.
3. Implement durable notification jobs, retry/dead-letter handling and correct unread/read state. Before multiple API replicas, add shared realtime transport, catch-up and shared rate limiting; test overload, reconnect and broker outage.
4. Render public jobs and route-specific metadata on the server; use self-canonicals, correct not-found/expired handling and a sitemap of public inventory. Validate current search-engine requirements at implementation time.
5. Simplify the homepage/search/apply path using existing MUI tokens. Consolidate duplicate navigation, preserve job/filter context through sign-in, and provide honest loading/empty/error states.
6. Fix duplicate landmarks and unnamed controls; test keyboard, screen reader, zoom, reduced motion, touch layouts and both themes.

**Exit:** a visitor can discover and complete a real application accessibly; communications arrive accurately; outages never invent successful activity.

## Step 9 — Prove operational readiness and run a controlled core beta

**Owner:** platform engineer, QA and product owner. **Dependencies:** steps 2–8.

1. Verify the actual hosting topology and environment mapping; reconcile conflicting deployment diagrams with deployed facts.
2. Build immutable artifacts, rehearse promotion and rollback, and verify migrations, health/readiness, secrets injection, storage signing, email and provider configuration.
3. Connect logs, metrics, tracing and actionable alerts; prove alerts fire on injected failures and redact private payloads.
4. Restore an actual backup into isolation, including required objects/configuration, and run the hiring journey against the restored system. Measure recovery time and data loss; do not reuse historical claims.
5. Load-test representative data and write/read mixes, query plans, connections and websockets. Choose capacity/SLO targets explicitly and record hardware, workload and results.
6. Run a bounded beta with real maintained jobs and responsive employers. Track completed applications, missing documents, recruiter responses and delivery failures. Resolve launch-blocking defects before wider access.

**Exit:** all core release gates pass on one immutable candidate, rollback/restore are exercised, and beta users can receive the promised outcome. This is core launch readiness, not full-platform completion.

## Step 10 — Finish every remaining product domain in vertical slices

**Owner:** designated domain engineers with QA. **Dependencies:** shared foundations in steps 3–8. Sequence the groups below; do not enable an unverified domain just because its pages compile.

| Order | Domain coverage | Required completion proof |
|---|---|---|
| 10A | Company, organization, enterprise hiring, recruiter, candidate search | Employer onboarding/verification, invitations and roles, job lifecycle, talent pools and private recruiter workspaces work across two isolated organizations. |
| 10B | Networking, community, mentorship, endorsement, referral, event | Requests/join/leave/block/report, private groups, mentoring bookings, endorsement/referral attribution and event participation persist; block/privacy rules apply everywhere. |
| 10C | AI, AI matching, career AI/companion, recommendation engines, resume analysis, cover letters, recruiter AI, workforce intelligence | Real configured providers or clearly described deterministic behavior; evaluated outputs, provenance, user isolation, minimized context, cancellation, timeouts and cost/rate budgets. No unsupported outcome guarantees. |
| 10D | Learning, assessments, skills, certificates | Real catalog/provider behavior, saved progress, server-scored attempts, repeat-attempt rules and verifiable completion records; private learning data stays private. |
| 10E | Freelance and global marketplace | Owned listings/proposals/contracts, valid lifecycle transitions, delivery/dispute behavior and any explicitly supported financial flows are complete and tested. |
| 10F | Admin, security, verification, trust/safety, support, compliance/legal, billing | Real case/appeal/support workflows, scoped administration, audit history and documented approval controls. Verify any enabled billing/webhook behavior with duplicate/signature/isolation tests; resolve free-access/product-scope contradictions explicitly. |
| 10G | Analytics/BI, data operations, backup, system health | Metrics reconcile to source events; consent and aggregation rules apply; exports/imports and operational actions have real implementations, ownership and recovery evidence. |
| 10H | Mobile web, standalone mobile, backend mobile/native-mobile | Reproducible app builds, real authentication, secure session storage, API parity, links, upload, offline recovery and push registration/delivery on supported devices. Separate device testing from narrow-browser testing. |

For each group: inventory reachable features → trace UI/API/service/storage/provider → fix gaps → run owned/foreign/error/restart tests → perform browser/device acceptance → record evidence → enable the feature. Search and document services must be reused consistently across groups.

**Exit:** every committed module and reachable route is verified or explicitly remains unfinished. Deferred work stays visible and does not count as delivered.

## Step 11 — Close architecture and enhancement debt deliberately

**Owner:** technical lead with domain/product owners. **Dependencies:** relevant step 10 domains.

1. Reconcile old route aliases, duplicate repositories/providers, API identity utilities, schema models and status vocabularies against actual use.
2. Finish measured performance work: query indexes, pagination, heavy UI loading, cache invalidation, search-index synchronization and asset handling.
3. Review historical enhancements individually: passkeys, magic links, enterprise SSO, partner SDKs/webhooks/scopes, richer profile editing, design previews and advanced discovery. Implement committed requirements; list optional ideas separately with a reason.
4. Add read replicas, new search infrastructure or service decomposition only when measured requirements justify them. Keep the modular monolith while it serves the agreed scope.

**Exit:** no unresolved debt compromises a promised workflow; optional future features have a separate backlog and are not hidden inside completion claims.

## Step 12 — Final full-platform acceptance and handover

**Owner:** QA/release lead with product and operations owners. **Dependencies:** steps 1–11.

1. Run required lint/type/unit/integration/contract/security/build checks on one release SHA; run cross-module browser and supported-device suites against those built artifacts.
2. Verify every module row has current evidence covering permissions, persistence, failure/retry behavior and the promised user outcome.
3. Rehearse full-platform restore/rollback with all enabled dependencies and verify production-scale capacity for the agreed launch envelope.
4. Publish operational runbooks, provider/configuration requirements, issue ownership and incident support procedures. Update audit statuses and portable evidence links.
5. Promote in controlled stages, verify post-deployment journeys and monitor for agreed rollback triggers. Record the final release decision and remaining explicitly excluded enhancements.

**Exit:** all 20 current findings are closed for the full-platform scope, historical residuals are resolved or evidenced as already fixed, all committed domains pass acceptance, and operational owners can support and recover the release.

## Execution order and estimation

The critical dependency chain is **baseline → reliable tests → identity/persistence/contracts → hiring/privacy → public experience/communications → operational core beta → remaining domains → full-platform acceptance**. Step 4 and step 5 can be separate engineering workstreams after the necessary boundaries are defined; privacy work can progress alongside the hiring flow. Each slice still needs its own acceptance proof.

Start with these concrete delivery batches: (1) evidence register and CI harness; (2) timeline/identity protection and production DB guard; (3) API clients and saved-job mapping; (4) document/application persistence; (5) privacy workers; (6) release-quality public experience and delivery; (7) operational beta gate; (8+) one PR series per remaining domain group.

Do not treat the old “weeks 1–8” illustration as a full-project estimate. Team capacity, provider readiness and unverified module gaps are unknown. Size the first batches after reproducing their tests, then estimate each domain using its verified inventory and observed delivery rate. Use milestone exit criteria to control release decisions.

No implementation fixes, dependency changes, external campaigns or deployments were performed by this planning task.

## Finding-to-step coverage

The [report review index](AUDIT_REPORT_REVIEW_INDEX_2026-09-06.md) lists all 92 reconciled documents and their local hashes. The table below preserves the priority from the September 5 finding register; it does not upgrade source findings into fresh runtime verification.

| Finding | Priority | Work | Plan steps |
|---|---|---|---|
| F01 | P1 (batch 2) | Application timeline omits candidate ownership | 3, 6 |
| F02 | P1 (batch 3) | Privacy and consent operations return success without persistence | 7 |
| F03 | P1 (batch 3) | Candidate document registration returns 201 without saving | 6 |
| F04 | P1 (batch 3) | Application form drops contact edits and resume URL | 6 |
| F05 | P1 (batch 2) | Saved jobs use the wrong response shape | 5, 6 |
| F06 | P1 (batch 2) | Production frontend CI supplies an incompatible API base URL | 5 |
| F07 | P1 (batch 2) | Several reachable feature clients still use mock authentication and localhost | 5, 10 |
| F08 | P1 (batch 4) | Public homepage presents hardcoded social proof as real | 8 |
| F09 | P2 (batch 4) | Newsletter success does not capture a subscription | 8 |
| F10 | P1 (batch 4) | Search discovery is weakened by metadata and job indexing gaps | 8 |
| F11 | P1 | Database-free CI is mistaken for full workflow validation | 2, 12 |
| F12 | P1 | Security workflow deliberately suppresses scan failures | 2, 12 |
| F13 | P1 (batch 2) | Application data access hides database errors | 4, 6 |
| F14 | P2 (batch 4) | Application analytics present synthetic scores as personalized measurements | 8, 10C |
| F15 | P2 (batch 4) | Duplicate landmarks and unlabeled controls contradict accessibility claims | 8 |
| F16 | P2 (batch 4) | Realtime delivery is process-local despite distributed-broker documentation | 8, 9 |
| F17 | P2 (batch 2) | Job-specific apply alias validates the body before reading its path ID | 5, 6 |
| F18 | P1 (batch 2) | Production can enter unregistered nil-database fallback mode | 4 |
| F19 | P1 | Frontend release check currently fails at linting | 2 |
| F20 | P1 | Audit scores and operational claims exceed their evidence | 1, 12 |
| F21 | P1 (batch 4) | Concurrent applications to one job deadlock and return a database error to the applicant | 6, 9 |
| F22 | P1 (batch 4) | System health reports six unprobed dependencies as healthy with invented figures | 9 |

## Batch 4 — steps 8 and 9

Closed: F08, F09, F10, F14, F15, F16, and F21 and F22 which this batch found.

| Finding | What it was | What closes it |
|---|---|---|
| F08 | Landing page invented statistics, testimonials, job postings at real named employers, and a "People You May Know" panel of three fictional people with mutual-connection counts and live Connect buttons | Figures are counted from the same rows the public board serves, using its exact predicate; with no data the section renders nothing. `frontend/src/test/landing-honesty.test.tsx` |
| F09 | The newsletter form reported success and stored nothing | Subscriptions persist, with a configurable limiter on the public endpoint |
| F10 | Every page was a client component, so a crawler received an empty shell. No `generateMetadata` anywhere; the sitemap listed six hardcoded URLs and not one job | Job pages render on the server with per-job metadata, self-canonicals, JobPosting JSON-LD and a sitemap built from real open inventory. `test/e2e/public-indexing.spec.ts` |
| F14 | Application analytics presented invented match scores and success probabilities as personal measurement | Replaced with counted response, interview and offer rates, and an explicit insufficient-data state below a minimum sample |
| F15 | Recorded as duplicate landmarks and unlabelled controls — both already gone. Scanning found what the finding had missed: every filled button failed WCAG AA on contrast, including the sign-in and registration submit buttons, and no automated accessibility check ran anywhere | Per-mode palette with measured ratios on `main` and on the hover shade, and `test/e2e/accessibility.spec.ts`: 24 checks over the core journey in both modes at two widths, 0 serious or critical violations |
| F16 | Realtime delivery and rate limiting were process-local, so a message reached one replica's subscribers and a documented "5 sign-in attempts per minute" admitted 5N | Redis pub/sub behind the existing interface and a Lua-scripted shared token bucket, both falling back to per-process rather than failing closed |
| F21 | Found by the batch's own load test. `CreateApplication` took `FOR SHARE` on the job row then upgraded it to increment `applications_count`, so simultaneous applicants deadlocked: eight of eight failed, each receiving `{"error":"ERROR: deadlock detected (SQLSTATE 40P01)"}`. Throughput on the hiring mix was 28 req/s | `FOR NO KEY UPDATE` taken up front, the unique index translated into a 409, and the raw error kept out of the response. 2810 req/s after. `backend/test/ci/apply_concurrency_test.go` |
| F22 | Redis, the event bus, search, storage, email and the workers all reported healthy from constants, with invented figures beside them; readiness answered 200 with no database handle; the build SHA was a literal string | Real probes supplied by the composition root, `disabled` for what this deployment does not have, and readiness that fails closed. `internal/system_health/service/health_probes_test.go` |

Step 9's remaining items need production access or contact with real users and were not attempted. What was executed, with measurements, is in [docs/operations/step9-readiness-evidence-2026-09-08.md](operations/step9-readiness-evidence-2026-09-08.md), which also records the beta-readiness verdict: not ready, and what is missing is access and configuration rather than code.
