# Delivery batch 3 — steps 6 and 7 evidence

Owner: hiring-domain and backend privacy engineering with frontend/QA. Delivered 7 September 2026.

Release remains **HOLD** for the later completion-plan steps. This batch verifies the hiring and privacy slices described below; it does not certify legal compliance and does not close the remaining public-experience or full-platform findings.

## Implemented behavior

- Candidate documents arrive as multipart PDF bytes. The service enforces the 10 MiB limit, the PDF signature and the test-signature scan policy before storing bytes, SHA-256, original name, media type, scan state and ownership in PostgreSQL. List, download and deletion queries all carry the candidate owner; deletion clears the bytes.
- Application submission validates active and unexpired jobs, required screening answers and a clean owned attachment inside one transaction. It persists edited name, email and phone, the cover letter, the answers and the immutable resume title and hash. Candidate/job and candidate/idempotency-key uniqueness protect concurrent retries.
- Recruiter application reads and stage changes require ownership of the canonical job, and transitions write stage history. Interview creation requires an application to an owned job, stores RFC3339 instants, serialises candidate and organiser checks behind advisory locks, rejects overlapping slots, and exposes scheduling and cancellation to the candidate's application view.
- Legal document acceptances resolve the published database version. Cookie choices, privacy preferences, histories and data-rights requests use stored rows. Candidate discovery, people search, conversation creation, optional analytics and the AI consent decision read those stored preferences.
- A background worker claims export and deletion rows with `FOR UPDATE SKIP LOCKED`, records attempts and errors, retries to a bounded maximum and resumes pending work after a process restart. Export payloads are owner-scoped, cancellable before processing and unavailable after expiry. Deletion honours active legal holds, preserves failure state, supports grace-period cancellation, anonymises the account and clears sessions, profiles, applications, preferences and document bytes.

## Defects found while verifying this batch

The batch's acceptance run was repeated against a disposable PostgreSQL 18.3 and Redis 7.4.8 pair matching the CI service versions. An earlier local run had been answered by a stale API process left listening on port 8080 from a previous session, which was writing to the developer database rather than the disposable one; every number below comes from a run where the API, the migrations and the tests all address the same fresh database.

| # | Defect | Root cause | Resolution |
|---|---|---|---|
| 1 | A deletion that failed for any reason other than a legal hold left the request in its pre-attempt state, with no recorded error and an attempt budget that never ran out, so the worker retried the same broken deletion forever | The failure was written inside the very transaction that was then rolled back | `recordDeletionFailure` abandons the work transaction and records the attempt and the diagnostic on a separate connection |
| 2 | A newly registered recruiter could not publish a job at all; the first recruiter action returned 500 | `GetOrCreateProfile` invented an `org_id` and inserted the profile without the `organizations` row it references, and `recruiter_jobs.recruiter_id` references `recruiter_profiles`, which was never created | The organisation, the recruiter profile and the organisation profile are created in one transaction, and the profile adopts an existing `recruiter_profiles` id when one exists |
| 3 | Publishing a job without skills made the entire public job board return 500 for every visitor: `cannot extract elements from a scalar` | A nil skill slice marshals to the JSON scalar `null`, while six listing queries expand `skills` as an array; `COALESCE` only guards a SQL NULL | The write stores `[]`, and all six read sites guard with `jsonb_typeof(...) = 'array'` so one malformed row cannot take down a listing |
| 4 | A recruiter with no postings was shown two jobs that do not exist, and a failed query was reported as a successful list | `GetJobs` fell back to hard-coded jobs whenever the query errored or returned nothing | The listing returns the recruiter's real rows and propagates the error; an empty list is the honest answer |
| 5 | A slow or failed registration was reported to the caller as a rejected registration, hiding a server fault behind a validation message | `Register` mapped every service error to 400, and the duplicate-email lookup discarded its own error | `RegistrationRejectedError` marks caller-fixable rejections (400); every other failure is logged and answered 500. The lookup error is propagated, and `ErrUserNotFound` distinguishes an absent user from a failed lookup |
| 6 | An export job id that does not exist, or belongs to someone else, returned 500 | `sql.ErrNoRows` fell through to the generic error branch | The handler answers 404 for that case |
| 7 | Candidate search dropped any row whose scan failed, which reads as "this candidate does not match" while privacy filtering is deciding who is visible | The scan error was only used to skip the row | The scan error is propagated |
| 8 | Every public profile answered not-found once the user had a privacy-preferences row, which the first preferences read creates | The column defaults to `Public` while the new visibility check compared against lowercase `public`, so it was false for everyone | The comparison is case-insensitive, in the profile repository and the search adapter alike, and both directions are asserted |
| 9 | A recruiter's second action failed with `cannot scan NULL into *string` | The organisation profile is created with its optional columns empty, and the read path scanned them straight into strings. That path was unreachable while the insert itself was failing | The optional columns are coalesced |
| 10 | A sign-in whose account lookup failed was answered "invalid email or password", telling a caller with correct credentials that they had them wrong | `Login` treated every lookup error as a credential failure | An absent user stays a 401; a failed lookup is logged and answered 500 |

Two verification gaps were closed at the same time. The restart check previously asserted only that a directly inserted row survived, which proves that PostgreSQL kept it and nothing about the API's own writes; it now re-authenticates as the candidate after the restart and reads the application snapshot and the exact document bytes back over HTTP. The suite also seeded every job with direct SQL, which is why defects 2 and 3 — both on the publication path — reached the browser suite unnoticed; a test now publishes through the API and asserts that an empty recruiter is shown no invented jobs.

## Verification

Every gate below was executed locally against disposable containers on the service versions CI uses.

| Gate | Result | Evidence |
|---|---:|---|
| Migration application on an empty database, then repeat | PASS | `total=95 newly_applied=95`, then `newly_applied=0` on both the repeat run and process start |
| Batch 3 real HTTP/PostgreSQL/Redis acceptance | PASS | `go test -tags=ciintegration ./test/ci`: **36 passed, 0 failed, 0 skipped** through `scripts/ci/check-results.mjs` |
| Backend unit suite and route surface | PASS | `ALLOW_NO_DB=true go test ./...` across 66 packages; `testdata/routes.golden` regenerated for exactly the five new routes |
| OpenAPI contract | PASS | `make swagger` then `swaggercheck`: 764 paths, 927 operations, every registered route documented. The document-upload operation was corrected from the old JSON-by-reference body to the multipart contract it now serves |
| Public profile visibility | PASS | `TestBatch3PublicProfileVisibility`: readable while public, not-found once set to `Private`, with the stored preference asserted |
| Real API process restart and read-back | PASS | API stopped and restarted; `TestBatch3RestartReadback` re-signed in and matched the receipt fields and the document SHA-256 |
| Deletion worker failure and recovery | PASS | `TestBatch3DeletionWorkerFailureIsDurable`: durable `failed` state with a recorded attempt, account not anonymised, then completion once the forced failure was removed |
| Concurrent and cross-timezone interview booking | PASS | `TestBatch3ConcurrentInterviewBooking`: four overlapping bookings, exactly one accepted, one live interview stored, an overlapping `+04:00` slot rejected |
| Job publication through the API | PASS | `TestBatch3RecruiterPublishesRealJob`: 201, rows in `jobs` and `recruiter_jobs`, listed back, no invented jobs for an empty recruiter |
| Go affected packages | PASS | auth, applications, legal, recruiter, search and company service packages |
| Frontend lint | PASS | 0 errors; 141 pre-existing warnings remain visible for later steps |
| Frontend typecheck | PASS | Next route generation and `tsc --noEmit` |
| Frontend unit tests | PASS | **57 files, 539 tests**, no skipped-test substitution |
| Production frontend build | PASS | Next production build with the CI API base, **353 static pages** |
| Built frontend and real API browser journey | PASS (CI) | Playwright drives the production build against the real API in four browser projects |

The browser suite was run locally against the production build and the real API
several times. It found four genuine defects, all fixed and listed above: the
publication foreign keys, the public board's JSONB scalar, the hydration race the
new spec did not wait out, and sign-in reporting a stored-session failure as a
wrong password. What remained after those fixes was not a product defect. The API
applies one 5-second deadline to every request, and on this workstation — running
the database in Docker, the production Next server and four browser engines at
once — an empty job listing took 6.1 seconds and a sign-in 8.4 seconds, so those
requests failed on the deadline rather than on their own logic. Two specs were
also corrected for reasons unrelated to load: the board spec waited on a URL
prefix that also matched the authenticated siblings the page requests, and it
asserted an empty board, which stopped being true once this batch's journey began
publishing a real posting. **The browser gate is the CI job's result, recorded below.**

## CI results

The required checks were run three times, each push fixing what the previous run
exposed. All four workflows are green on `6b87eb1`.

| Commit | Backend | Frontend | Security | Integration |
|---|---|---|---|---|
| `674a0b8` | pass | pass | pass | **fail** — Playwright 63/64, WebKit journey |
| `51c5a8e` | pass | pass | pass | **fail** — Playwright 63/64, Firefox journey |
| `6b87eb1` | pass | pass | pass | **pass** |

On `6b87eb1` the integration workflow reports **154, 4 and 1 Go tests passed with
0 failed and 0 skipped** across its three gates, and the browser job reports
**64 passed, 0 unexpected, 0 skipped, 0 flaky** across chromium, firefox, webkit
and mobile-chromium against the production build and the real API.

Two further defects were found by those CI runs and fixed:

- WebKit held no session across a page load, because the refresh cookie is issued
  `Secure` while the suite serves the app over plain HTTP. Chromium and Firefox
  make a localhost exception; WebKit does not. The flag is now relaxed only under
  `APP_ENV=test`; development and production keep it.
- **A page reload could revoke every session the account had.** One load issues
  two refreshes with the same cookie; the first rotates and revokes it, and the
  second then looked exactly like a stolen token, so reuse detection signed the
  user out everywhere. Whether it happened depended on how the browser scheduled
  the two requests, which is why it presented as one browser failing per run. A
  token presented within ten seconds of its own rotation is now treated as that
  race — refused, but without the containment step — and a replay after the
  window is reuse detection as before. This belongs to step 5's item 6, which
  batch 2 recorded as not covered; the reload gate is what surfaced it.

## Negative controls exercised

- EICAR test-signature PDF rejected before registration.
- Missing required answer, foreign document, closed job and duplicate application rejected; the same idempotency key returns the same receipt.
- A foreign recruiter cannot list, transition or cancel the owned workflow, and an overlapping interview booking fails.
- A hidden candidate does not appear in recruiter search and cannot receive a new conversation when messaging permission is `None`.
- Foreign and expired export downloads return not found; pending export and grace-period deletion cancellation persist.
- An active legal hold makes deletion fail with a stored error; releasing the hold and resetting its retry budget completes the same job and clears document bytes.
- Exporting an anonymised account fails exactly three attempts and remains `failed` with diagnostic state.
- The two new checks were confirmed to fail against the unfixed code rather than passing vacuously: with the deletion fix reverted the request stayed `grace_period` with `attempts=0` and no recorded error, and with the stored document bytes altered the restart read-back reported the SHA-256 mismatch.

## Remaining visible work

- Document scanning is a PDF-signature and EICAR test-signature check. No antivirus engine is integrated, and this is not equivalent to one.
- The API applies a single 5-second request deadline to every route (`backend/internal/router/router.go`), while registration performs a bcrypt hash at cost 12 plus several queries. On a loaded workstation running the database, the production frontend and four browser engines at once, registration exceeded that deadline and now correctly answers 500 with `timeout: context deadline exceeded` logged, where it previously reported the same failure as a rejected registration. Whether one deadline suits both a cheap read and a deliberately expensive password hash is a tuning decision for a later step, not something this batch changes.
- The legal repository still answers with synthetic documents, cookie entries, consent history and privacy requests when it holds no database handle. That branch is reachable only with `ALLOW_NO_DB` outside production, which production refuses outright, but it remains a place where a degraded deployment could display invented privacy state.
- Recruiter candidate search still attaches a fixed skill list and a fixed match score to every result, and `CanProcessWithAI` ignores its `feature` argument. Both belong to F14 and step 8.
- Hard-coded placeholder identifiers remain in other modules this batch does not cover; they are step 8 and step 10 work.
- The frontend lint baseline of 141 warnings and the later public, communications and accessibility findings remain open.
- CI results for the delivery commit are recorded after push; the local runs above do not substitute for the required checks.
