# Batch 6 — final full-platform acceptance and handover

**9 September 2026. Step 12 of the [completion plan](PROJECT_COMPLETION_PLAN_2026-09-06.md).**

## Verdict

**HOLD for broad public launch. Approved for a controlled internal release once
object storage, email and an alerting destination are configured.**

The engineering gates are green on one candidate and every one of them was run,
not quoted. The hold is unchanged because the reasons for it are unchanged, and
they are not code:

- Four of the eight step 10 domain groups have never had a journey exercised end
  to end. 10C, 10D, 10E and 10H are **open**; 10A, 10B, 10F and 10G are **in
  progress**. No group is verified.
- No object storage, email, AI or alerting provider is configured in any
  environment reachable from here. Candidate documents currently land on a
  container's own disk.
- The standalone mobile client cannot be built and authenticates nobody.
- Nothing pages a person when readiness flips.

**This release does not close the full-platform scope, and this document does
not claim it does.** What it closes is step 12's verification work: every check
was run on one SHA, every finding and residual is reconciled against actual
evidence, restore and rollback are rehearsed rather than described, and the
operational documents now say what the platform is instead of what an older
document hoped it was.

## The candidate

Every number below was produced on **`19da324ff67db57183274f2729520a139b882bc7`**,
the tip of `main` when this batch started, with the working tree clean. The
changes this batch then made are listed in [What this batch changed](#what-this-batch-changed);
CI re-runs everything on the release commit.

**Host for every local measurement:** 4 CPU, 15 GB RAM, Linux 6.18,
Go 1.26.8, Node 24.16.0, PostgreSQL 16.13, Redis 7.0.15. CI runs the same
suites on PostgreSQL 18.3 and Redis 7.4.8.

## 1. Required checks, run on one release SHA

| Check | How it was run | Result |
|---|---|---|
| Frontend lint | `npm --prefix frontend run lint` | **0 errors**, 126 warnings |
| Frontend typecheck | `next typegen && tsc --noEmit` | **0 errors** |
| Frontend unit | `vitest run` | **60 files, 567 tests, 567 passed, 0 skipped** |
| Frontend production build | `next build` (`output: 'standalone'`) | pass |
| Backend vet | `go vet ./...` | clean |
| Backend modules | `go mod verify` | all modules verified |
| Backend unit, no database | `ALLOW_NO_DB=true go test ./...` | **756 passed, 0 failed**; 24 skipped, all database- or Redis-gated |
| Backend, **with** PostgreSQL and Redis | `go test ./... -count=1` | **822 passed, 0 failed, 2 skipped** — the two skips need `MIGRATION_TEST_DATABASE_URL` and are run below |
| Backend build | `go build ./cmd/kirmya` | pass |
| API contract | `make swagger` then `make swagger-validate` | committed spec is current; **766 paths, 930 operations, 468 definitions, every one of the 961 registered routes documented** |
| Migrations, clean database | `tools/ci-migrate` | **98 applied**, second run 0 newly applied |
| Migration failure and concurrency | `go test ./internal/shared/database/...` | **4 passed, 0 skipped** |
| SQL and authorization negative controls | `scripts/ci/negative-gates.mjs` | both deliberately broken fixtures **rejected** |
| Real-API integration | `go test -tags=ciintegration ./test/ci` against the running API | **37 tests (58 with subtests), 0 failed, 0 skipped** |
| Restart durability | `POST_RESTART=1 … TestBatch3RestartReadback` after a real restart | pass |
| Company ownership and isolation | `go test ./internal/company/service` | **154 passed, 0 skipped** (the 12 database tests ran) |
| Report gate negative controls | `node --test scripts/ci/*.test.mjs` | pass — failure, skip, empty, malformed and missing evidence all rejected |
| Browser, production build, real API | Playwright, `chromium` + `mobile-chromium` + `a11y-desktop` + `a11y-mobile` | **96 passed, 0 failed, 0 skipped** |
| Browser, against the **standalone production server** | the same suite, `node .next/standalone/server.js` | **96 passed, 0 failed, 0 skipped** |
| npm dependency gate | `npm audit --audit-level=high`, root and frontend | **0 high, 0 critical** |
| Backup and restore | `scripts/ops/restore-rehearsal.sh` | no data loss, 6.1s recovery |
| Rollback | `scripts/ops/rollback-rehearsal.sh` | previous release serves the migrated schema |
| Capacity | `backend/tools/loadcheck`, 16 clients, 30s, 10% writes | 2556 req/s, 0.02% failed |

### Checks that could not run here, and who is authoritative for them

Stated rather than skipped over. CI runs all four on every commit; **CI is the
authority for each of them and none is waived.**

| Check | Why not here |
|---|---|
| `govulncheck` | This workstation's network policy refuses `vuln.go.dev` (403 at the proxy). The scan produced a report with no vulnerability data in it — see the finding below. |
| Trivy filesystem and secret scan | Not installed on this workstation. |
| Container image builds | No Docker daemon. |
| Playwright `firefox` and `webkit` projects | The Playwright CDN is blocked, so only the pre-installed Chromium is available. The four Chromium-family projects ran; CI installs all three engines and runs six projects. |

### Supported-device checks

`mobile-chromium` (Pixel 7) and `a11y-mobile` are **narrow-viewport browser**
coverage and they pass. They are not device testing, and this document does not
count them as such. **No test has run on a physical or emulated handset.** The
standalone mobile client cannot be built at all — see
[`mobile/README.md`](../mobile/README.md).

## 2. What this batch found

Four defects, all in the release path rather than in the product, which is where
a step-12 pass should find them.

### The Go vulnerability gate passed a scan that consulted no vulnerability data

`scripts/ci/check-govulncheck.mjs` accepted a report as clean if it carried a
`config` event, an SBOM and no findings. That is exactly what govulncheck emits
when it cannot reach `vuln.go.dev`: it announces "Fetching vulnerabilities from
the database…", the fetch is refused, and it stops. Config, SBOM, zero findings
— indistinguishable from a clean scan.

Reproduced here, because the proxy refuses that host: the blocked run produced a
16 KB report and the gate answered `{"reachable":[],"reportedFindings":0}` and
exited 0.

The gate now requires evidence that the scan got past fetching — govulncheck
emits a second progress event, "Checking the code against the vulnerabilities…",
only once it has the database. Replayed against the blocked report it now says
`Vulnerability database was never consulted` and exits 1. Covered by a new case
in `scripts/ci/check-govulncheck.test.mjs`, which runs in the required
`report-gates` job.

The workflow itself was never wrong — a govulncheck error exits non-zero and
fails the step under `bash -e` — so no release actually shipped past a blind
scan. The gate that exists to be the second line of defence was not one. This is
the same family as finding F12.

### The browser suite verified a server no deployment runs

`frontend/next.config.mjs` sets `output: 'standalone'` and `frontend/Dockerfile`
runs `node server.js` from that tree. The Playwright `webServer` ran
`next start`, which announces on every run:

```
⚠ "next start" does not work with "output: standalone" configuration.
  Use "node .next/standalone/server.js" instead.
```

So 168 browser assertions per CI run were made against a server that is not the
one production serves. `scripts/ci/start-standalone.mjs` now copies the static
assets and `public/` beside the standalone server exactly as the Dockerfile does
and starts the same entry point, and `playwright.config.ts` uses it.

Verified both ways on this candidate: **96 passed under `next start`, 96 passed
under the standalone server**, including the security headers, the sitemap,
`robots.txt` and the served-HTML indexing checks.

### The frontend image built and ran on a Node major nobody verified

`frontend/Dockerfile` pinned `node:20-alpine` in all three stages while
`.node-version`, `package.json` engines, CI and every check in section 1 use
**24.16.0**. Next 16 accepts Node 20, so nothing failed — the image simply
shipped a runtime no check had ever exercised. The backend Dockerfile carries an
explicit comment about keeping its toolchain in step with `go.mod`; the frontend
one had no equivalent.

All three stages are now `node:24.16.0-alpine` (tag confirmed to exist), with
the same kind of comment.

**And nothing built that image.** The backend pipeline has built its container
since the beginning; the frontend image was never built by any workflow, so a
broken Dockerfile — including this one — would have reached a deployment
untested. `.github/workflows/frontend.yml` now has an `image` job that builds it
and then starts it and requires `/signin` to answer. A `frontend/.dockerignore`
was added at the same time: the builder runs `COPY . .`, so without it a local
`node_modules` or `.next` overwrites what the deps and builder stages produced
and the image depends on whichever machine built it.

### R04: a panicking identity helper nobody called

`middleware.MustGetUserID` panicked on an unauthenticated caller and had zero
callers anywhere in the repository. Removed. `R04` is closed.

## 3. Restore and rollback, rehearsed

### Restore

`scripts/ops/restore-rehearsal.sh`, executed on this candidate against a
database holding the rows the integration and browser suites had just written:

```
source     users=128 jobs=41 job_applications=18 notifications=11 notification_deliveries=12
backup     0.2s, 1.1M (pg_dump -Fc)
restore    3.7s into an isolated database, 0 messages logged
data loss  none: every counted table restored with its full row count
journey    readiness 200; registration and sign-in, job published, posting
           publicly readable, application submitted (201)
recovery   6.1s from backup start to a serving, verified system
```

**6.1 seconds is not an RTO.** The source holds about a megabyte. A
production-scale restore is still unrehearsed, and this document does not
convert this figure into a recovery objective.

### Rollback — the procedure nothing had ever executed

`docs/deployment/rollback.md` claimed schema additions "remain backward
compatible with the previous application version" under an Expand/Contract
protocol. Nothing had tested it, and the tooling cannot help: the migration
runner applies `*.up.sql` only, it has no down path, **39 of the 98 up
migrations have no `.down.sql`**, and the 59 that exist are executed by nothing.
The only rollback this platform can perform is putting the previous binary in
front of the newer schema.

`scripts/ops/rollback-rehearsal.sh` now rehearses exactly that, and it ran:

```
candidate 19da324  previous ce94d6c
== 3. migrate a disposable database to the candidate schema ==
total=98 newly_applied=98
== 4. migrations the previous release does not know about ==
  0096_close_schema_gaps_batch5.up.sql
== 5. roll back: the PREVIOUS release against the candidate schema ==
  readiness 200; registration and sign-in; job published; publicly readable;
  application submitted (201)
== 6. roll forward again: the candidate against the same database ==
  readiness 200; … application submitted (201)
```

Run it before every release. A migration that drops or renames a column the
previous release reads fails step 5, which is the point of having it.

### Capacity

16 clients, 30s, 10% writes, the public hiring path, limiter raised so it did
not mask the application:

```
operation  count   ok     failed   req/s    p50    p95    p99
apply       7630   7623        7   254.1   11ms   24ms   32ms
board      34740  34736        4  1157.0    5ms   14ms   20ms
posting    34375  34370        5  1144.9    4ms   12ms   18ms
total     76745 requests, 2556.0 req/s, 0.02% failed
```

Consistent with the 2810 req/s batch 4 measured on the same host class, so this
release introduces no throughput regression. The same run at the integration
limiter setting (60000/min) admitted about 1400 req/s and answered the rest 429
— the limiter working, not a fault.

**No capacity target is set, and production-scale capacity is not verified.**
Both need a production-shaped host and a product decision.

## 4. Finding reconciliation

Every row was checked against the current source or a run in section 1, not
against the document that last claimed it.

| ID | Status | Evidence on this candidate |
|---|---|---|
| F01 | **closed** | `TestApplicationTimelineOwnership` passes against the running API. |
| F02 | **closed** | `TestBatch3HiringAndPrivacyLifecycle`, `TestBatch3DeletionWorkerFailureIsDurable` pass. |
| F03 | **closed** | Covered by the batch 3 lifecycle test; document bytes and metadata persist under ownership. |
| F04 | **closed** | Same test: contact edits, attachment, cover letter and answers survive. |
| F05 | **closed** | `TestSavedJobPersistsDurably` passes. |
| F06 | **closed** | The production build issues no doubled `/api/v1` requests — browser test, now also against the standalone server. |
| F07 | **closed for the web client.** Open for the unbuildable mobile prototype | `the production bundle carries no synthetic bearer identity` passes. `mobile/src/api/client.ts` still sends a constant bearer; it is excluded from the release and documented. |
| F08 | **closed** | `landing-honesty.test.tsx` in the passing unit suite. |
| F09 | **closed** | `TestNewsletterSubscriptionIsStoredAndRevocable` passes. |
| F10 | **closed** | `public-indexing.spec.ts` passes in the browser suite, including against the standalone server. |
| F11 | **closed** | The integration job is required, runs 98 real migrations and 37 real-API tests, and its result gate rejects a skip. Re-proved here: `{"pass":58,"fail":0,"skip":0}`. |
| F12 | **closed, and hardened this batch** | Scanner failures block. The one remaining way a scan could report clean without data is the govulncheck gate described above, now fixed. |
| F13 | **closed** | Query, scan and iteration errors propagate; covered by the integration suite. |
| F14 | **closed** | Counted funnel metrics with an explicit insufficient-data state. |
| F15 | **closed** | 24 axe checks over the core journey in both modes at two widths: 0 serious or critical. Re-run here, still 0. |
| F16 | **closed** | Redis pub/sub and the shared Lua token bucket; their tests ran with a real Redis in this batch (`internal/messaging/pubsub`, `internal/shared/middleware`), 0 skips. |
| F17 | **closed** | `TestJobApplyAliasAcceptsPathIdentifier` passes. |
| F18 | **closed** | Production refuses `ALLOW_NO_DB=true`; readiness fails closed on a nil pool. |
| F19 | **closed** | Lint 0 errors, typecheck 0 errors, 567/567 unit, build clean — all four re-run here. |
| F20 | **closed for the documents this project controls** | This document, the [handbook](operations/RELEASE_OPERATIONS_HANDBOOK.md) and [configuration](operations/CONFIGURATION_AND_PROVIDERS.md) state what was run and what was not. No readiness percentage appears anywhere in them. The historical reports that carry inflated scores are marked superseded rather than rewritten. |
| F21 | **closed** | `TestConcurrentApplicationsToOneJobDoNotDeadlock` and `TestRepeatedApplicationsFromOneCandidateAnswerConflict` pass; the load run above shows 99.9% application success where it was 0%. |
| F22 | **closed** | `/status` on the running API reports `postgresql/redis/realtime/storage/workers healthy`, `email/search disabled`. No invented figures. |

**All 20 findings from the September 5 audit, plus F21 and F22 found since, are
closed.** That closes the finding register. It does not close the platform: the
register never covered the four open domain groups.

### Historical residuals

| ID | Status | Evidence |
|---|---|---|
| R01 | **closed** | `grep 'GetString("user_id")'` over the backend returns **0**. The Phase 1 report's historical count of 79 sites in 31 modules is superseded by that measurement. |
| R02 | **open, by decision** | No revocation check exists on the request path. An issued access token stays valid for up to `ACCESS_TOKEN_TTL` (15m) after logout or password reset. The refresh token and stored sessions *are* revoked, transactionally. Closing this changes the authentication architecture and needs a product decision; it is recorded in the configuration document as a known limit rather than left implicit. |
| R03 | **closed** | Distributed rate limiting exists and its tests ran against a real Redis this batch: `TestTwoReplicasShareOneBudget`, `TestDifferentClientsGetSeparateBudgets`, `TestLimitersWithDifferentShapesDoNotShareABucket`, 0 skips. |
| R04 | **closed this batch** | `MustGetUserID` removed; it had no callers. |
| R05 | **open** | No handler-registration completeness check exists. Partial cover: `internal/router/admin_surface_completeness_test.go` and the golden route table (961 routes) fail on an unregistered or renamed route, and `swagger-validate` fails on an undocumented one. What is still missing is a check that a **nil handler** substituted into a route group fails startup — the analytics case batch 2 used as the worked example. |
| R06 | **closed** | Migration locking, concurrency and missing-asset behaviour: 4 tests, 0 skips, re-run here. |
| R07 | **open** | No AI provider is configured and no provider decision has been made. The surfaces are deterministic and say so. This is group 10C. |
| R08 | **closed** | The refresh cookie is `HttpOnly`, `Secure`, `SameSite=Lax` — deliberately not `Strict`, guarded by a test that fails if it is set back — and browser session persistence across reloads, tabs, direct protected URLs and sign-out passes on the production artifact. |
| H001–H0xx | **not committed scope** | The enhancement intake stays an enhancement backlog. None of it is counted in any completion claim. |

## 5. Module acceptance

The [module matrix](project-baseline-2026-09-06/MODULE_MATRIX.md) carries the
per-module rows. The honest summary against the plan's own bar — *a working
UI/API/service/storage journey with owned, foreign, error and restart cases
exercised*:

| Group | Status | Unchanged from batch 5? |
|---|---|---|
| 10A company, enterprise, recruiter, candidate search | in progress | yes |
| 10B networking, community, mentorship, endorsement, referral, event | in progress | yes |
| 10C AI, matching, career AI, recommendations, resume analysis, recruiter AI | **open** | yes — no provider decision was made in this batch |
| 10D learning, assessments, skills, certificates | **open** | yes |
| 10E freelance and marketplace | **open** | yes |
| 10F admin, security, verification, trust/safety, support, compliance, billing | in progress | yes |
| 10G analytics, data operations, backup, system health | in progress | **improved**: backup and recovery now have executed evidence rather than a runbook |
| 10H mobile web, standalone mobile, native mobile | **open** | **evidence added**: the reason it is open is now written down with the specific facts |

**No module is marked `verified`,** and this batch did not promote any. Step 12
is a verification pass over what the previous batches committed; it does not
turn an unexercised journey into an exercised one. Anyone reading a green CI run
as full-platform completion is reading it wrong, which is what finding F20 was
about.

## 6. What this batch changed

| Change | Why |
|---|---|
| `scripts/ci/check-govulncheck.mjs`, `.test.mjs` | Reject a scan that never reached the vulnerability database. |
| `scripts/ci/start-standalone.mjs`, `playwright.config.ts` | Drive the browser suite at the server production actually runs. |
| `frontend/Dockerfile` | Node 24.16.0 in all three stages, matching every check that clears the release. |
| `frontend/.dockerignore` | Stop a local `node_modules`/`.next` from deciding what ships. |
| `.github/workflows/frontend.yml` | Build the frontend image and require it to start and serve `/signin`. |
| `backend/internal/shared/middleware/auth.go` | Remove the unused panicking helper (R04). |
| `scripts/ops/rollback-rehearsal.sh` | Rehearse the rollback rather than describe it. |
| `docs/operations/RELEASE_OPERATIONS_HANDBOOK.md` | One authoritative operations document; supersedes the aspirational ones. |
| `docs/operations/CONFIGURATION_AND_PROVIDERS.md` | Every configuration key read out of the code that consumes it. |
| `mobile/README.md` | Say exactly why the mobile client is excluded. |

No product behaviour changed. Every change is in the release path, the
documentation, or dead code.

## 7. Explicitly excluded from this release

Excluded means: not delivered, not counted, and visible. None of it is hidden
inside a completion claim.

1. **The standalone mobile client.** Unbuildable — no native projects, no
   lockfile, no bundler configuration, an import of a package that does not
   exist. It opens already signed in and its sign-in button authenticates
   nobody. [`mobile/README.md`](../mobile/README.md) has the detail. The API half
   of mobile support is implemented and covered.
2. **Billing, subscriptions, checkout and premium features.** All flags off.
   The free-access promise is unchanged and no product decision has authorised
   monetisation.
3. **AI providers.** None configured, none chosen. The surfaces are
   deterministic and name their method.
4. **Search infrastructure, read replicas, service decomposition.** Not
   justified by any measurement taken.
5. **The historical enhancement backlog (H001 onwards).** Passkeys, magic links,
   enterprise SSO, partner SDKs and the rest. Not committed scope.
6. **A production deployment.** Not authorised for this batch. What is delivered
   instead is a reviewable handoff: the handbook, the configuration
   requirements, and the two rehearsal scripts.

## 8. Blockers before a public launch

In the order they have to be solved. None is a code defect.

1. **Object storage.** Configure `STORAGE_*` before any real candidate uploads a
   résumé. Today documents go to a container's own disk, which does not survive a
   restart and is not shared between replicas. `storage: healthy` with no
   endpoint set means only that the local directory is writable.
2. **Email.** No SMTP host and no Resend key anywhere. Password resets,
   interview notices and newsletter confirmations are queued durably and then
   dead-lettered. Nothing is lost and nothing claims success — and nothing
   arrives.
3. **An alerting destination.** Readiness flips and the component report
   degrades, so failure is detectable. Nothing pages anyone.
4. **Hosting topology confirmed against what is deployed.** Read-only, but it is
   a statement about production and should be made with the owner present.
5. **A production-scale restore.** The 6.1-second figure must not be quoted as
   an RTO until it is re-run against a production-sized snapshot.
6. **The four open domain groups.** 10C needs a provider decision; 10D, 10E and
   10H need the journeys the plan specifies. Only then is "full platform" a
   phrase this project can use.
