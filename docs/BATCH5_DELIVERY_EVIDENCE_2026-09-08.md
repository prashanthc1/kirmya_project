# Batch 5 delivery evidence — 8 September 2026

Steps 10 and 11 of the [completion plan](PROJECT_COMPLETION_PLAN_2026-09-06.md).

**This batch did not complete step 10.** It found and closed a class of defect
that ran through most of the domains step 10 covers, and it fixed several
domain-specific failures outright, but the majority of the eight groups are
still short of the plan's own bar: a working UI/API/service/storage journey with
owned, foreign, error and restart cases exercised. What is verified and what is
not is listed per group below, and the unverified rows stay unverified.

## How the work was found

The API was run against a disposable PostgreSQL database (`kirmya_batch5`, 98
migrations) with two registered accounts, and every reachable GET route was
called twice — once with a real access token, once with none. 466 routes
answered; 22 needed path parameters the probe could not invent and were skipped.
The same accounts then exercised write journeys by hand across communities,
networking, endorsements, referrals, events, mentorship, learning, freelance,
verification, trust and safety, and data export.

| Probe | Before | After |
|---|---|---|
| GET routes answering `null` where a list belongs | 63 | 0 |
| GET routes answering 5xx | 5 | 0 |
| Repository read methods that substitute seeded records for an empty table | 43 | 0 |
| Write paths naming a table or column the schema does not have | 15 | 0 |

The last row is now a required CI check
(`backend/test/ci/schema_conformance_test.go`), and the list contract is covered
for 55 endpoints by `backend/test/ci/batch5_domains_test.go`.

## What was wrong, and what closes it

### The list contract (all groups)

A Go nil slice marshals to `null`. Sixty-three list endpoints across twenty-two
modules answered `null`, or `{"data": null}`, for an account with no rows yet —
which is every new account. The reported symptom was the network dashboard
failing on `connections.length` before it rendered; assessments, communities,
mentorship, notifications, referrals, safety and the rest were waiting behind
it. `internal/shared/httpx.JSONList` normalizes nil slices where the response is
written, including inside maps and struct fields, and the list handlers use it.

`/api/v1/career-companion/roadmap` still answers `null` deliberately: it is a
single nullable object — a user with no roadmap has no roadmap — and its client
handles that. It is excluded from the guard for that reason.

### Tables and columns the code assumed (10B, 10C, 10F)

Comparing the SQL in `internal/*/repository` against the migrated schema found
three tables no migration ever created — `networking_goals`, `connection_notes`,
`connection_labels` — and twelve write paths naming columns that exist only in a
second `CREATE TABLE` for a name an earlier migration had already taken.
`CREATE TABLE IF NOT EXISTS` skips the later definition without a word, so the
module that expected it failed at runtime instead of at migration time. Fifteen
table names are defined twice across the migrations; the diverging ones are
addressed in migration `0096_close_schema_gaps_batch5`.

Consequences that were live before this batch:

- networking goals answered 500 (`relation "networking_goals" does not exist`), and notes and labels failed on write
- joining a community inserted `joined_at` into a table that has `created_at`
- MFA enrolment wrote the TOTP secret to columns that do not exist, discarded the error, returned success, and kept the secret in a process map the next restart cleared
- saving a privacy switch through the security module wrote nothing and answered from memory
- the recommendation engine read its preference vector from `user_preferences`, a table the profile system owns with an unrelated shape
- privacy incidents and retention policies were missing the governance module's columns

### Data that was invented (10A, 10B, 10C, 10F, onboarding)

Server side, 43 repository reads across 11 modules ran their query and then
`if len(list) > 0 { return list, nil }`, falling through to seeded records when
the table was empty and swallowing the error when the query failed. The
compliance console served third-party processor rows asserting signed DPAs and
SOC 2 certifications for named vendors on that path.

Surfaces that were answering with fiction:

| Surface | What it claimed |
|---|---|
| Recruiter pipeline | three candidates with names, addresses, avatars and a "94% match", whenever the real pipeline was empty |
| `/recruiter/applications/:id/ai-eval`, `/recruiter/jobs/:id/matches` | the same candidate, 96%, and "Hire" for every application on the platform |
| Recruiter team | two colleagues who do not exist, with addresses, for every recruiter |
| Onboarding resume step | seven skills, a post at "TechVentures Inc.", a degree and an AWS credential number, presented as what the uploaded file said — and the browser never called the server at all |
| Onboarding suggestions | four communities that do not exist, and three fictional people presented as staff at Stripe, Emaar Properties and Nexus AI |
| Endorsements page | endorsements from "Principal Architect at Google" and a recommendation from a named VP |
| Verification page | a "Verified Professional" badge and a trust score the server never issued |
| Organization page | an invented company, with invented members and permissions |
| Security, admin and privacy consoles | alerts with IP addresses, fraud cases, jobs, incidents, sessions and sign-in history, returned from every catch block |

All of it is gone. Where a real computation was possible it replaced the
fiction: the recruiter evaluation compares the skills the job states against the
skills the profile lists, names that method in the response, returns an explicit
insufficient-data state when either side is empty, and makes no hire
recommendation. Endorser identity now comes from the authenticated account
rather than the request body, which also closes a spoof — an endorsement could
be signed with any name and title the caller chose.

### Ownership boundaries (10A)

`GET /recruiter/jobs/:id` read any posting on the platform, drafts included.
Publish, pause and close updated any job by id. `GET /recruiter/pipeline/:jobId`
returned that job's candidates — names and email addresses — to any signed-in
recruiter. Stage history, evaluations and the AI evaluation had the same shape
on the application id. Ownership now comes from `jobs.recruiter_id`, and an
unowned id answers 404 exactly like an id that does not exist.

### The employer portal (10A)

Creating a company answered 500 and created nothing: the transaction granting
the creator the owner role inserted into `company_member_roles` without an id, a
primary key with no default, so the whole transaction rolled back. Every
`/api/v1/employer/*` route then answered "Invalid id", because those routes carry
no company id while the handlers behind them read one from the path. Both are
fixed and covered end to end.

### Contracts and duplicates (step 11)

- `/messaging/*` duplicated five conversation routes the web app addresses as `/messages`; `/networking/*` duplicated connections, requests and recommendations from `/network`. Nothing called either set except two blocking routes, which moved to `/network/blocks`. Both prefixes are gone, along with the dead `UpdateRequestLegacy` handler behind one of them.
- The privacy governance console addressed six endpoints the API does not serve (`/admin/privacy/inventory`, `legal-holds`, `access-reviews`, `processors`, `incidents`, `risk-summary`); every call answered 404, which is what kept the samples on screen. They are repointed at `/admin/compliance/...` and `/admin/data-governance/...`.
- Three separate company-id resolvers in the company module became one.
- Notification preferences are toggled per category by the settings screen, which sent a body the handler rejected with 400 and stored nowhere. Categories are stored now, merged over documented defaults, and consulted when a notification is delivered.
- The mentorship client answered from fixtures compiled into the bundle, mutated them so a write appeared to succeed, and under vitest never made a request at all. It calls the real routes; three of them were addressed to paths that do not exist. Deleting a goal had no endpoint at all — `DELETE /api/v1/mentorship/goals/:id` now exists, scoped to the mentorship's participants.
- Enrolling in a course that does not exist answered 500; it answers 404.

## Group status after this batch

`verified` means exercised against the running API with real accounts in this
batch, including a foreign-account or error case where one applies.

| Group | Status | What is verified | What is not |
|---|---|---|---|
| 10A company, enterprise, recruiter, candidate search | in progress | Company creation; the six employer portal reads; recruiter job, pipeline and application ownership across two accounts; recruiter listing and publication | Invitations and roles; talent pools; two isolated organizations sharing an enterprise; candidate search relevance |
| 10B networking, community, mentorship, endorsement, referral, event | in progress | Connection request, follow, block and unblock; community create, join, post, leave; endorsement and referral writes; mentorship profile and request; networking goal persistence; X-User-ID spoofing refused | Private groups; mentoring bookings end to end; endorsement and referral attribution; event participation; block and privacy rules applied everywhere |
| 10C AI, matching, career AI, recommendations, resume analysis, recruiter AI | open | The invented recruiter scores are gone, replaced by a stated-skill comparison that names its method | No provider is configured; career AI and companion journeys, evaluation, provenance, cancellation, timeouts and cost budgets are untested |
| 10D learning, assessments, skills, certificates | open | Course listing and enrolment answer honestly, including 404 for a course that does not exist | No catalogue content and no provider; server-scored attempts, repeat rules and verifiable completion are untested |
| 10E freelance and marketplace | open | Project creation and proposal submission answer; contracts list | Lifecycle transitions, delivery, disputes. No financial flows exist and none were added: free access is unchanged |
| 10F admin, security, verification, trust/safety, support, compliance, billing | in progress | Every admin route refuses an anonymous caller and a non-admin one — 155 routes, 403 each; support ticket, verification request, report and block writes; MFA and privacy settings now persist | Case and appeal workflows; audit history; approval controls; billing is untouched and stays outside the free-access scope |
| 10G analytics, data operations, backup, system health | in progress | Export request; notification category preferences stored and consulted; the consoles no longer invent their contents | Metric reconciliation to source events; consent and aggregation rules; import paths; recovery evidence |
| 10H mobile web, standalone mobile, native mobile | open | Nothing in this batch | Reproducible builds, device authentication, secure session storage, API parity, links, upload, offline recovery, push registration and delivery |

## Step 11

| Item | Status |
|---|---|
| 1. Reconcile aliases, duplicate repositories, identity utilities, schema models, status vocabularies | Partly done: two route prefixes and two company resolvers removed, six console endpoints repointed, duplicate schema ownership resolved for the tables listed above. `company_members.status` still carries both `active` and `approved`; the reader accepts both and says so |
| 2. Measured performance work | Not done in this batch. No new measurements were taken beyond the indexes migration 0096 adds for its own tables |
| 3. Historical enhancement review | Not done |
| 4. Read replicas, new search infrastructure, decomposition | Not justified by any measurement, and not attempted |

## Checks run on this batch

- `go build ./...` and `go test ./...` on every commit: pass
- `go test -tags=ciintegration ./test/ci` against the disposable database and the running API: pass, including the new batch 5 domain tests and the schema conformance check
- `npx tsc --noEmit` and `npx vitest run` (60 files, 567 tests): pass
- The route sweep above, re-run after each change
- GitHub Actions on `18e5fdd` and `871b89d`: backend pipeline, frontend checks, integration (PostgreSQL/Redis HTTP plus the Playwright suite against the production build) and security workflows all green
- The integration run on `cf6ff30` failed on a pre-existing flake, not on this batch: `auth.spec.ts` clicked a bare `button[type="submit"]`, which also matches the landing footer's newsletter button, and mobile-chromium resolved two elements. The same code passed on the next commit. Every such click now names its button (`4d21494`)
- Final confirmation on `4d21494`, from the run's own artifacts: the integration suite reports 34 tests, 34 passed, 0 failed, 0 skipped - including all eight batch 5 checks and the schema conformance check - and the browser suite reports 168 passed, up from 152, with the four new pages green on chromium, firefox, webkit and mobile-chromium. All four workflows are green on `4d21494` and on `1c73cd2`

Local integration runs are advisory: this workstation has no Redis, so
`TestPostgresAndRedis` fails locally by design, and the API's five-second
request deadline flakes under a local browser suite. CI is the authority.

## Commits

    2a1e5c2 fix(api,schema): return lists as lists, and create the tables the code queries
    14b75cd fix(recruiter): scope jobs and pipelines to their owner, and stop inventing candidates
    ab8fece test(recruiter): assert the ownership gate instead of the fixtures it replaced
    ff406b0 fix(ui,endorsements): stop presenting invented people, badges and plans as real
    53eac5c fix(mentorship): call the API instead of the fixtures compiled into the client
    d037785 chore(router): record the new mentorship goal deletion route in the golden table
    8dccb53 chore(docs): regenerate the OpenAPI spec for the batch 5 contract changes
    02555db fix(consoles,repos): stop answering with sample data when the real data is empty
    18e5fdd refactor(routes): retire the duplicate prefixes and answer 404 for a missing course
    1066c19 fix(onboarding): stop handing new users a career they never had
    a4cecf2 fix(employer,company): let a company be created, and let its portal find it
    cf6ff30 test(ci): fail when repository SQL names a table or column the schema lacks
    871b89d docs(batch5): record what steps 10 and 11 actually got, and what they did not
    4d21494 test(e2e): open a new account's first pages in a browser, and stop the flake in the way

## Open, and why

1. **10H mobile was not started.** It needs device builds and devices; nothing in it was verified here, and it stays `open`.
2. **10C has no configured provider.** The deterministic replacement is honest about being a skill comparison, but evaluation, provenance, cancellation, timeouts and cost budgets remain untested, and no provider decision has been made.
3. **10D and 10E have no content or lifecycle.** The endpoints answer correctly and store what they are given; the product behaviour above them — scoring, repeat rules, certificates, contract transitions, disputes — is either not implemented or not verified.
4. **Browser acceptance for these domains is thin.** `test/e2e/empty-account-surfaces.spec.ts` now opens /network, /notifications, /communities and /endorsements as an account with no data and fails on any uncaught exception - the case the reported crash came from. Everything else these groups contain is still only covered at the HTTP level.
5. **The demo-user fallback still stands.** Anonymous callers to onboarding and profile completion share one profile, by the earlier decision recorded in `docs/decisions`. It is unchanged here.
