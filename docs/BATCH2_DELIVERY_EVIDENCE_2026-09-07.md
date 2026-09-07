# Delivery batch 2 — steps 3, 4 and 5 evidence

Owner: backend/security engineer with frontend integration. Delivered 7 September 2026.
Release remains **HOLD**. This batch closes identity, ownership, persistence and
contract defects; it does not complete the hiring journey (step 6), privacy
(step 7) or the public experience (step 8), and it is not a release decision.

## Scope

Steps 3, 4 and 5 of [the completion plan](PROJECT_COMPLETION_PLAN_2026-09-06.md).
Findings addressed: F01, F05, F06, F07, F13, F17, F18, and residuals R01 and R06.
R02 and R05 are assessed below and remain open with a recorded reason.

## Step 3 — identity, authorization and session

### Caller identity (F01, R01)

The authentication middleware publishes the caller as `c.Set("userID", uuid.UUID)`.
Sixty-eight sites across twenty-one modules instead read `c.GetString("user_id")`.
That key is set by nothing, and `GetString` also returns `""` for a `uuid.UUID`
value, so the read always failed. None of them refused the request:

| Fallback | Sites | Effect |
|---|---:|---|
| `uuid.MustParse("9a8b7c6d-…")` | 29 | every caller collapsed onto one shared account |
| `uuid.New()` | 43 | every request became a new owner; writes were unreadable |
| `uuid.MustParse("…0001")` | 3 helpers | same collapse, second synthetic identity |

The shared UUID was not arbitrary. Five frontend clients sent
`Authorization: Bearer 9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d`, which is not a JWT;
the backend ignored it, failed the context read and substituted the same value.
Frontend and backend agreed on a fictional user.

All sites now resolve through `middleware.GetUserID` and return 401 when it
reports failure. Eight helper methods that returned a substituted UUID now return
`(uuid.UUID, bool)`, and their callers stop.

**Evidence.** `backend/test/security/phase1_boundaries_test.go` scans `internal/`
for reads of the unset key. Before: 32 files. After: **0 sites across 0 files**,
so `knownBrokenIdentityFiles` is now empty. The scan and its ratchet remain, so a
module that reintroduces the pattern fails there.

### Public-profile subject versus caller

`endorsement` accepted `?user_id=` and fell back to the caller, then replaced an
unparseable value with `uuid.New()` — which returned an empty list rather than an
error. The subject and the caller are now separate: authentication is always
required, an explicit `?user_id=` names the profile being read, its absence means
the caller's own, and an invalid subject is a 400.

### Analytics authentication (verified before changing identity extraction)

Step 3 item 3 required checking this first, and the check found the larger
problem: `/analytics`, `/recruiter/analytics`, `/company/analytics`,
`/communities/:id/analytics` and `/internal/analytics/events` were registered
with **no authentication middleware at all**. Only `/admin/analytics` had
`RequireAdmin`. An anonymous caller could read personal analytics and, through
`PUT /analytics/consent`, write a stored preference. All groups now require
authentication.

### Organization isolation

`GetRecruiterAnalytics` took `requestingUserID` and never used it;
`GetCompanyAnalytics` took no caller at all. Both resolved the organization from
a query parameter that defaulted to a fixed identifier, so the URL alone selected
whose hiring data was returned. Both now verify membership against
`company_members` before reading, and the organization must be named explicitly —
an omitted parameter is a 400, not one particular organization's data.

### Application ownership (F01)

`GetApplicationTimeline` selected on `application_id` alone and the service
dropped the `candidateID` it was given. Ownership is now resolved in SQL. A
foreign application and an unknown one both return 404, so the response never
confirms that another candidate's application exists.

## Step 4 — persistence and migrations

### Production nil-database fallback (F18)

`ALLOW_NO_DB=true` allowed the process to continue past a failed database
connection in any environment. Every repository treats a nil pool as "use the
in-memory map", so applications, saved jobs and documents were accepted, reported
as created, and lost on restart. It is now a validated configuration field that
`LoadConfig` refuses outright in production, with a second guard in `main` that
refuses a nil pool there regardless of how it was reached.

### Honest database errors (F13)

`applications_repository.go` reported failure as absence: seven query errors
returned an empty slice with a nil error, five scan errors skipped the row, and
no method checked `rows.Err()`. A timeline, saved-job list or document list
rendered as "nothing here" during an outage. All are now wrapped and propagated;
the notes and interview loaders return an error instead of an empty slice; and
`GetApplicationStats`, `GetCareerAnalytics` and `GetAIInsights` no longer hide the
read failure behind a zeroed DTO.

### Migrations (R06)

Three defects:

1. A missing migrations directory logged a warning and returned nil, so a
   deployment whose assets never shipped passed a required migration step and
   served an empty schema. It now fails.
2. Nothing serialised migration, so concurrent replicas both executed the same
   DDL. Runs are now serialised on a Postgres advisory lock.
3. A scan error while reading applied versions silently marked a migration
   unapplied and re-ran it. That error and `rows.Err()` are now propagated.

## Step 5 — API clients and contracts

### One base convention (F06)

`NEXT_PUBLIC_API_URL` includes `/api/v1`, and every environment file and CI
workflow sets it that way. Five telemetry and web-vitals callers assumed the
opposite and built `${NEXT_PUBLIC_API_URL}/api/v1/telemetry/…`, producing
`/api/v1/api/v1/…` — a 404 on every client error report from a real deployment.
`frontend/src/shared/api_base.ts` now documents the convention and provides
`apiUrl()`; the telemetry, vitals and WebSocket callers use it.

### Authenticated clients (F07)

Thirteen feature clients created their own axios instance on a hardcoded
`http://localhost:8080/api/v1`, which a production build can never reach, and
five of them attached the synthetic bearer described above. All now use the
shared `authApiClient`, which carries the signed-in user's access token and its
refresh handling.

### Saved-job identifiers (F05)

`GET /api/v1/jobs/saved` returns `saved_jobs` rows: `id` is the bookmark and
`job_id` is the posting. The response was typed as `JobSummary[]` and used
unmapped, so the card linked to `/jobs/<bookmark-id>`, the remove button issued
`DELETE /jobs/<bookmark-id>/save` and deleted nothing, and the title was
undefined because the row calls it `job_title`. An explicit
`toSavedJobSummary` mapping now keeps the two identifiers apart and names them,
and removal calls the API rather than only mutating local state.

### Apply contract (F17)

`POST /jobs/:id/apply` bound a body requiring `job_id` before reading the path,
so every correct request to that alias was rejected as an invalid payload. The
path identifier is resolved first; the body binds without that constraint when
the path supplies the job; a body identifier conflicting with the path is a 400.

## Verification

### Automated checks run locally

| Check | Result |
|---|---|
| `go build ./...` | pass |
| `go vet ./...` | pass |
| `go test ./...` (backend) | pass, no failures |
| Phase 1 security boundary suite | pass; residual identity defect 0 sites / 0 files |
| `TestRunMigrationsFailsWithoutAssets` | pass |
| frontend `tsc --noEmit` | pass |
| frontend `npm run lint` | 0 errors (141 pre-existing warnings) |
| frontend unit tests | 57 files, 539 tests, all pass |
| frontend `npm run build` | compiled successfully |
| `test/e2e/real-api.spec.ts` new specs, chromium | pass |

### Acceptance cases added

`backend/test/ci/batch2_boundaries_test.go` runs under the `ciintegration` tag in
the required integration job, against the real API and real PostgreSQL. Every
account is registered and signed in over HTTP, so no assertion can pass on a
synthetic identity.

- **Anonymous** — seven analytics routes, including `PUT /analytics/consent`,
  must return 401.
- **Owner** — reads its own application timeline and receives the seeded history.
- **Foreign user** — receives 404 for another candidate's application, and the
  same 404 for an application that does not exist.
- **Foreign organization** — a non-member receives 403 for both recruiter and
  company analytics; a member is not refused; an omitted `organization_id` is 400.
- **Durability** — a saved job is read back on a connection the API does not own,
  which a write to an in-memory branch cannot satisfy. The same test pins that
  the bookmark id and job id stay distinct.
- **Apply contract** — the alias accepts a body with no `job_id`, and rejects one
  naming a different job than the path.

`internal/shared/database/migrate_test.go` adds the migration cases:
`TestRunMigrationsFailsWithoutAssets` (runs everywhere) and
`TestRunMigrationsIsSerialisedAcrossProcesses`, which resets a dedicated
disposable database, runs two migrators concurrently on separate pools, and
requires both to succeed with every version recorded exactly once. CI creates
`kirmya_migrationtest` for it so it can never touch the database the rest of the
job uses; its report goes through the same fail-closed gate.

`test/e2e/real-api.spec.ts` adds two checks against the **production build**:
every request to the API host must sit under a single `/api/v1` and none may
contain a doubled prefix, and no served script may embed the synthetic bearer
UUID.

## Open items from this batch

- **R02, access-token revocation after password reset.** `ResetPassword` revokes
  every session, but an already-issued access token is a stateless JWT and stays
  valid for the remainder of its 15-minute lifetime, because nothing on the
  request path consults revocation. Closing it means checking revocation on every
  authenticated request — a change to the authentication architecture, and a
  product decision about the latency and Redis dependency it adds. Not attempted
  here. A smaller related defect was found and is also open: the reset flow
  discards the error from `RevokeAllUserSessions`, so a failed revocation still
  reports a successful reset.
- **R05, required handler registration completeness.** Not implemented. The
  analytics module shows why it matters — `RegisterAnalyticsRoutes` substitutes
  no-op handlers when the handler is nil, so a missing dependency registers
  routes that silently return nothing. A completeness check that fails startup is
  the right fix and is larger than this batch.
- **`/internal/analytics/events` now requires authentication.** It is named
  internal and accepted arbitrary events from anyone. If anonymous client
  telemetry is a product requirement, it belongs on the existing `/telemetry/*`
  endpoints rather than on an unauthenticated write to the analytics store. This
  is a product decision to confirm.
- **Seed data still uses the synthetic UUID.** Fourteen occurrences remain in
  repository `seedDefaultData` functions. They are demo rows, not caller
  identity, and were left alone; they should go when those repositories become
  durable.
- **`analyticsApi.ingestEvent` reports success on failure.** It catches the error
  and returns `{ message: 'Event ingested successfully' }`. That is the F02 class
  of defect and belongs to step 7; recorded here because it was found during
  this work.
