# Core beta and full-platform module matrix

Detailed [module-matrix.json](module-matrix.json) maps services, repository SQL table candidates, provider markers, authorization markers, web pages and existing tests. [inventories.json](inventories.json) lists every page file, golden API route, parsed API declaration and migration. Structural matches are candidates, not proof of routing, permissions, live tables or provider configuration. Empty mappings mean unverified, not unnecessary.

Core beta is the hiring loop and its required access/privacy/operations foundations. Core membership does not release every module feature: advanced admin, organization and security screens remain gated. All existing domains and the native client remain in the full-platform inventory; disabled/deferred features never count as complete.

| Module | Scope | Owner | Status | Page files | Declared API operations | Existing local tests |
|---|---|---|---|---|---|---|
| admin | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 137 | 50 | 3 |
| ai | full-platform expansion | Domain engineering lead | unverified | 0 | 7 | 1 |
| ai_job_match | full-platform expansion | Domain engineering lead | unverified | 0 | 3 | 1 |
| analytics | full-platform expansion | Domain engineering lead | unverified | 8 | 52 | 1 |
| applications | core-beta foundation or required hiring workflow | Hiring domain lead | open | 3 | 17 | 1 |
| assessment | full-platform expansion | Domain engineering lead | unverified | 1 | 5 | 0 |
| auth | core-beta foundation or required hiring workflow | Backend security lead | unverified | 12 | 10 | 5 |
| backup | core-beta foundation or required hiring workflow | Platform and QA lead | unverified | 0 | 13 | 1 |
| billing | full-platform expansion | Domain engineering lead | unverified | 5 | 9 | 3 |
| candidate_search | core-beta foundation or required hiring workflow | Frontend experience lead | unverified | 0 | 8 | 1 |
| career_ai | full-platform expansion | Domain engineering lead | unverified | 1 | 7 | 0 |
| career_companion | full-platform expansion | Domain engineering lead | unverified | 1 | 6 | 0 |
| common | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 0 | 0 | 0 |
| community | full-platform expansion | Domain engineering lead | unverified | 8 | 29 | 2 |
| company | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 25 | 83 | 9 |
| compliance | core-beta foundation or required hiring workflow | Backend privacy lead | unverified | 2 | 29 | 2 |
| cover_letter | full-platform expansion | Domain engineering lead | unverified | 0 | 17 | 1 |
| data_operations | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 0 | 11 | 1 |
| docs | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 0 | 0 | 0 |
| endorsement | full-platform expansion | Domain engineering lead | unverified | 0 | 7 | 0 |
| enterprise_hiring | full-platform expansion | Domain engineering lead | unverified | 2 | 6 | 1 |
| event | full-platform expansion | Domain engineering lead | unverified | 0 | 6 | 0 |
| freelance | full-platform expansion | Domain engineering lead | unverified | 1 | 8 | 0 |
| global_marketplace | full-platform expansion | Domain engineering lead | unverified | 0 | 4 | 0 |
| interview | core-beta foundation or required hiring workflow | Hiring domain lead | unverified | 1 | 11 | 1 |
| interview_prep | full-platform expansion | Hiring domain lead | unverified | 0 | 23 | 1 |
| job_alerts | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 0 | 15 | 0 |
| jobs | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 5 | 2 | 1 |
| landing | core-beta foundation or required hiring workflow | Frontend experience lead | unverified | 34 | 3 | 0 |
| learning | full-platform expansion | Domain engineering lead | unverified | 1 | 8 | 0 |
| legal | core-beta foundation or required hiring workflow | Backend privacy lead | open | 18 | 32 | 1 |
| media | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 0 | 7 | 2 |
| mentorship | full-platform expansion | Domain engineering lead | unverified | 4 | 18 | 2 |
| messaging | full-platform expansion | Frontend experience lead | open | 5 | 23 | 2 |
| mobile | full-platform expansion | Domain engineering lead | unverified | 0 | 4 | 0 |
| native_mobile | full-platform expansion | Domain engineering lead | unverified | 0 | 8 | 0 |
| networking | full-platform expansion | Frontend experience lead | unverified | 8 | 39 | 2 |
| notification | core-beta foundation or required hiring workflow | Frontend experience lead | unverified | 9 | 49 | 2 |
| onboarding | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 8 | 26 | 2 |
| organization | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 1 | 5 | 0 |
| profile | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 6 | 63 | 2 |
| recommendation | full-platform expansion | Domain engineering lead | unverified | 0 | 8 | 1 |
| recommendation_engine | full-platform expansion | Domain engineering lead | unverified | 0 | 8 | 0 |
| recruiter | core-beta foundation or required hiring workflow | Hiring domain lead | unverified | 35 | 51 | 1 |
| recruiter_ai | full-platform expansion | Hiring domain lead | unverified | 0 | 5 | 0 |
| referral | full-platform expansion | Domain engineering lead | unverified | 1 | 5 | 0 |
| resume | core-beta foundation or required hiring workflow | Hiring domain lead | unverified | 1 | 18 | 1 |
| resume_analysis | full-platform expansion | Hiring domain lead | unverified | 1 | 3 | 0 |
| router | core-beta foundation or required hiring workflow | Domain engineering lead | open | 0 | 7 | 7 |
| search | full-platform expansion | Frontend experience lead | unverified | 1 | 7 | 3 |
| security | core-beta foundation or required hiring workflow | Backend security lead | unverified | 23 | 38 | 2 |
| shared | core-beta foundation or required hiring workflow | Domain engineering lead | open | 0 | 5 | 13 |
| support | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 6 | 31 | 1 |
| system_health | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 0 | 11 | 1 |
| trust_safety | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 8 | 53 | 2 |
| verification | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 1 | 5 | 0 |
| workforce_intelligence | full-platform expansion | Domain engineering lead | unverified | 0 | 4 | 0 |
| web-shell | core-beta cross-cutting plus unclassified routes | Frontend experience lead | unverified | 12 | 0 | 56 |
| native-client | full-platform expansion | Mobile engineering lead | unverified | 0 | 1 | 0 |

## Batch 5 status changes — 8 September 2026

Statuses below were revised against the evidence in
[batch 5 delivery evidence](../BATCH5_DELIVERY_EVIDENCE_2026-09-08.md). A module
is `in progress` when at least one of its journeys was exercised against the
running API with real accounts in that batch and a defect in it was closed; it
stays `unverified` when nothing in it was exercised. Nothing is marked
`verified`: no module in this batch had its full journey - UI, API, service,
storage, provider, owned and foreign cases, restart - checked end to end.

| Module | Was | Now | Why |
|---|---|---|---|
| company | unverified | in progress | Company creation answered 500 and created nothing; fixed and covered by a CI test |
| recruiter | unverified | in progress | Job, pipeline and application reads and status writes were unscoped; ownership added, foreign access answered 404, covered by a CI test |
| networking | unverified | in progress | `networking_goals`, `connection_notes` and `connection_labels` did not exist; created, and goal persistence covered by a CI test |
| notification | unverified | in progress | Category preferences were rejected with 400 and never consulted at delivery; stored and consulted, covered by a CI test |
| mentorship | unverified | in progress | Client answered from bundled fixtures and addressed three routes that do not exist; rewritten, goal deletion endpoint added, header spoofing covered by a CI test |
| onboarding | unverified | in progress | Resume step, community and connection suggestions returned invented records; replaced with real queries and an empty extraction |
| endorsement | unverified | in progress | Endorser identity came from the request body; now from the authenticated account |
| security | unverified | in progress | MFA enrolment and privacy settings wrote to columns that do not exist and discarded the error; both persist now |
| compliance | unverified | in progress | Console addressed six endpoints the API does not serve and showed samples instead; repointed |
| admin | unverified | in progress | Console answered from bundled samples on failure; now surfaces the failure. Every admin route refuses anonymous and non-admin callers (155 routes checked) |
| community, event, freelance, learning, organization, trust_safety, verification, referral, enterprise_hiring, workforce_intelligence, recommendation_engine, ai_job_match, career_ai, career_companion, resume_analysis, recruiter_ai, assessment, messaging, interview, data_operations, landing | unverified | unverified | Their list contract and, where applicable, their repository reads were corrected in this batch, but no journey in them was exercised end to end |
| mobile, native_mobile, native-client | unverified | unverified | Not started in this batch |

## Batch 6 acceptance review — 9 September 2026

Step 12 asks that every module row carry current evidence covering permissions,
persistence, failure/retry behaviour and the promised user outcome. This review
checked the rows against the [batch 6 acceptance record](../BATCH6_RELEASE_ACCEPTANCE_2026-09-09.md)
and **promoted nothing**.

Step 12 is a verification pass over what earlier batches committed. It re-ran
every gate on one candidate and it rehearsed restore and rollback; it did not
exercise a journey that had not been exercised before, so it cannot turn an
`unverified` or `in progress` row into a `verified` one. The bar is unchanged:
UI, API, service, storage, provider, owned and foreign cases, and restart.

| | |
|---|---|
| `verified` | **0 modules.** No module has had its full journey checked end to end. |
| `in progress` | The 10 modules batch 5 promoted: company, recruiter, networking, notification, mentorship, onboarding, endorsement, security, compliance, admin — plus `recommendation`, whose server side was repaired in this batch. |
| `unverified` / `open` | Everything else, unchanged. |

What every module row *does* now have, from the batch 6 candidate:

- **Permissions.** Every admin route refuses an anonymous and a non-admin caller (155 routes). Recruiter jobs, pipelines, applications and evaluations are scoped to `jobs.recruiter_id`, and a foreign id answers 404. Analytics route groups authenticate and verify organization membership. Identity resolves from the verified account everywhere: 0 remaining `GetString("user_id")` sites.
- **Persistence.** 98 migrations apply on a clean database and are idempotent on a second run. Repository SQL is checked against the migrated schema by a required CI test. A restart read-back test proves business data survives an API restart.
- **Failure and retry.** Query, scan and iteration errors propagate as stable API errors rather than as empty data. Notification delivery retries and dead-letters, does not double-send under concurrent workers, and dead-letters an unconfigured channel rather than claiming success. Deletion-worker failures are recorded outside the rolled-back transaction.
- **The promised user outcome.** The hiring journey — publication, discovery, account, document, application, recruiter review, interview — passes in HTTP tests and in the browser against the production artifact, and again against a restored database, and again under the previous release binary on the migrated schema.

What no row has, and what keeps them all short of `verified`: a browser or
device acceptance pass over the module's own screens, and for 10C, 10D, 10E and
10H, a configured provider or a completed lifecycle. Those are named per group
in the acceptance record.

### 10H, restated with evidence

`mobile`, `native_mobile` and `native-client` stay `unverified` and the reason is
now written down rather than inferred: the standalone client has no native
projects, no lockfile, no bundler configuration, imports a package that does not
exist, opens already signed in, and its sign-in button authenticates nobody. See
[`mobile/README.md`](../../mobile/README.md). The API half — device registration
scoped to `(user_id, device_id)` and a push that refuses a body naming somebody
else — is implemented and covered by CI.

### Correction: invented people were live on fourteen surfaces — now fixed

Batch 5 recorded that the fabricated candidates, colleagues, endorsers and
suggestions were gone — *"All of it is gone."* That was true of the server for
the modules it named, and true of the public homepage. It was **not** true of
the web client.

Scanning `frontend/src` for the specific fabricated identities found fourteen
files still carrying them (F24). Ten made no API call at all; four were API
clients that fell back to it. Fixing them found nine more components the scan
had missed, because its name list was drawn from those fourteen files and did
not include the recruiter personas (F25) — and then found that the API itself
was fabricating, so a frontend-only fix would have replaced browser-side fiction
with server-side fiction (F26).

**All three are fixed**, with evidence in the
[batch 6 acceptance record](../BATCH6_RELEASE_ACCEPTANCE_2026-09-09.md#7a-addendum--f24-closed-and-what-closing-it-found).
The rows below stay where they are, and the reason has changed: it is no longer
that these screens invent people, it is that their journeys have not been
exercised end to end.

| Module | Status | What was invented, and what it does now |
|---|---|---|
| recruiter | in progress | `/recruiter/candidates`, `/recruiter/offers`, and the pipeline, team, profile, application, interview, scorecard, notes, offer and message components: candidates and colleagues who do not exist, with employers, match ratings and résumé URLs, and no API calls. All now read from their endpoints, and **ten journeys prove they read** rather than only that they no longer invent. The scorecard and the notes panels reported writes that never happened; a note now posts to the server and survives a reload, which is asserted. Offers cannot be listed — no endpoint returns them — and the page says so rather than showing two invented offers. |
| company (employer portal) | in progress | `/employer/applications` listed an invented applicant. Now reads the API. |
| admin | in progress | The dashboard and user management presented invented accounts; `features/admin/services/adminApi.ts` fell back to them. Fallbacks removed. |
| onboarding | in progress | `ConnectionsStep` suggested invented people to every new user. Now real, or empty. |
| networking | in progress | `features/networking/services/networkingApi.ts` answered connection recommendations and people search from arrays compiled into the bundle. The `mockState` is deleted; the client went from 698 lines to 242. |
| search / candidate discovery | unverified → **in progress** | The engine reporting itself as `postgresql-tsvector-v2` was constructed with a `nil` pool, so it never reached PostgreSQL in any environment and always served three invented candidates. Saving a candidate returned the success value without writing. Now database-backed, and refused where no store exists. |
| compliance, trust_safety | unverified | An invented reviewer and an invented moderator in their clients' fallbacks. Removed. |
| recommendation | unverified → **in progress** | Fixed in batch 6: both candidate queries had never executed, the errors were discarded, and fixtures were served in their place. Now real, or empty. Covered by `backend/test/ci/batch6_recommendations_test.go`. |

The recruiter module now has journey evidence: seven browser journeys and three
API journeys seed a real posting and a real applicant and require that person
everywhere a fabrication used to be, each verified to fail against the pre-fix
build. Writing them found that the recruiter and ATS clients had never been
authenticated (F27) — the fabrications had been concealing a 401 on every screen
— and that four frontend stage vocabularies matched none of the server's (F28),
so a real applicant matched no kanban column and rendered nowhere.

No module moves to `verified` yet. Two ratchets hold the fixes in place
(`invented-identities.test.ts`, whose quarantine list may only shrink, and
`api-clients-do-not-invent.test.ts`), and the recruiter journey is evidenced;
the employer portal, admin console, onboarding and networking client still need
the same treatment before step 10 can call any of this verified.
