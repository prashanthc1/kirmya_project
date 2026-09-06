# Kirmya local implementation guide

**Target baseline:** GitHub commit `5f6790a95ae02d74666b668ab62e140d861424ec`  
**Current local baseline when this guide was created:** `4f6b79b`  
**Audit register:** [findings.json](findings.json)

This guide turns the audit into a safe implementation sequence. Complete the phases in order because later traffic and design work depends on reliable applications, privacy controls and release checks.

## 1. Protect the audit and synchronize the local repository

The `audit-review/` directory is currently untracked. Copy it outside the repository or commit it on a documentation branch before switching or cleaning branches. Do not run `git clean` while it is untracked.

From PowerShell in `C:\Users\PRASHANTH\Documents\My Site`:

```powershell
git status --short --branch
git fetch origin
git log --oneline --decorate --max-count=10 main..origin/main
git merge --ff-only origin/main
git log -1 --oneline
```

The last command must show `5f6790a` or a later reviewed commit. If the fast-forward fails, inspect local changes and reconcile them instead of resetting or deleting work.

Create the first implementation branch:

```powershell
git switch -c codex/audit-remediation-01-core-integrity
```

Keep each phase in a separate branch or pull request. This makes failures easier to isolate and review.

## 2. Prepare a repeatable local environment

Install the versions expected by the audited source: Go 1.25, Node.js compatible with Next.js 16, npm, Docker Desktop and Git. Then start infrastructure from the repository root:

```powershell
docker compose up -d postgres redis
docker compose ps
```

Create local environment files from the repository examples. Use development-only secrets and keep them out of Git. The backend database URL should point to the local PostgreSQL container, Redis to `localhost:6379`, and the frontend API URL to the mounted API prefix:

```text
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

Install dependencies and record the clean baseline:

```powershell
Set-Location frontend
npm ci
npm run lint
npx tsc --noEmit --incremental false
npm test
Set-Location ..\backend
go mod download
go test ./...
Set-Location ..
```

Some checks are expected to fail initially. Save the exact output and use the audit's verification record as the starting comparison.

## 3. Phase one: secure and persist the application journey

Address F01, F03, F04, F05, F13 and F17 together because they share application contracts and persistence.

### 3.1 Protect the application timeline

Primary files:

- `backend/internal/applications/delivery/http/applications_handler.go`
- `backend/internal/applications/service/applications_service.go`
- `backend/internal/applications/repository/applications_repository.go`

Pass the authenticated candidate ID from handler to service to repository. Change the timeline SQL so it joins `job_applications` and requires both application ID and candidate ID. Return the same not-found behavior for unknown and foreign records. Recruiter access should use a separately authorized method.

Required test:

1. Create candidate A, candidate B and an application owned by A.
2. Candidate A can read the timeline.
3. Candidate B receives 404 and no event or actor data.
4. An unknown application ID behaves consistently.

### 3.2 Persist registered documents

Replace the synthetic response in `applications_handler.go` with the canonical document/storage service. Verify that the object belongs to the candidate, obtain real MIME type, size and storage key, and insert the document record. A successful POST must appear in the subsequent GET and remain after API restart.

Reject foreign storage objects, unsupported file types, oversized documents and missing objects.

### 3.3 Define one application submission contract

Primary frontend file: `frontend/src/components/applications/ApplyJobModal.tsx`.

Decide whether contact information is copied from the profile at submission time or whether the form supports explicit overrides. Then make the UI and API agree:

- Send every editable value intentionally.
- Resolve `resume_id` on the server and verify candidate ownership.
- Store an immutable resume/application snapshot for recruiter review.
- Enforce required screening questions on the server.
- Reject a body `job_id` that differs from `/jobs/:id/apply`.
- Return a durable receipt containing application ID and submission time.

### 3.4 Correct saved-job DTO mapping

Keep bookmark ID and job ID as separate fields. Either map `SavedJobDTO` into the regular job-card model in `frontend/src/features/jobs/api.ts` or introduce a dedicated saved-job card. The title must come from `job_title`; navigation and unsave operations must use the actual job ID or explicit bookmark ID required by the endpoint.

### 3.5 Stop hiding database errors

Repository SELECT/INSERT failures must return errors. Handlers should distinguish empty results from temporarily unavailable data. Clients should show a retryable error instead of an empty state.

Phase-one exit gate:

```text
[ ] Two-user timeline ownership test passes
[ ] Document upload/list/restart journey passes
[ ] Apply/reload/recruiter-view journey passes
[ ] Required questions are enforced server-side
[ ] Saved job opens and removes the correct job
[ ] Forced database failures never return false success
```

## 4. Phase two: make privacy and production durability truthful

Address F02 and F18.

### 4.1 Implement privacy persistence

Primary file: `backend/internal/legal/repository/legal_repo.go`.

Add migrations and repository operations for:

- document acceptance with document version and timestamp;
- cookie consent with categories, source and timestamp;
- privacy preferences with read-after-write behavior;
- privacy requests with pending, processing, completed and failed states;
- export jobs with expiring signed download references;
- deletion requests with confirmation, scheduling and audit history.

Do not return synthetic completed exports or success before a write commits. Add user-isolation tests and restart/read-back tests. Treat legal interpretation as a separate review by the responsible specialist.

### 4.2 Fail closed when the database is unavailable

In `backend/cmd/kirmya/main.go`, reject `ALLOW_NO_DB=true` in production mode. Database failure must fail readiness and prevent write traffic. Keep in-memory repositories behind explicit test construction rather than nil production dependencies.

Phase-two exit gate:

```text
[ ] Preferences survive restart
[ ] Candidate A cannot read candidate B's requests or export
[ ] Failed worker jobs report failed, not completed
[ ] Production startup refuses an unavailable database
[ ] Readiness becomes unhealthy when required persistence is lost
```

## 5. Phase three: standardize frontend integration

Address F06 and F07.

Create one API-base utility and one authenticated Axios client. The environment variable should represent one documented convention—prefer the complete base `https://api.example.com/api/v1`. Remove hardcoded localhost URLs and fixed UUID bearer values from organization, referral, verification and any remaining imported clients.

Search before editing:

```powershell
Get-ChildItem frontend\src -Recurse -File -Include *.ts,*.tsx |
  Select-String -Pattern 'localhost|Bearer [0-9a-f-]{36}|NEXT_PUBLIC_API_URL'
```

Add a production-build smoke test that asserts login, token refresh, job search and application submission use `/api/v1`. Test with two real test users so identity comes only from the signed token.

Phase-three exit gate:

```text
[ ] No reachable production client contains localhost or mock bearer identity
[ ] Login, refresh, jobs and applications reach /api/v1
[ ] Production build uses the documented base convention
[ ] Two test accounts remain isolated
```

## 6. Phase four: restore truthful public content

Address F08, F09 and F14 before polishing the homepage.

Remove fixed member, employer, hire, match-accuracy and response numbers unless they come from a defined query with a measurement date. Remove named testimonials unless consent and source evidence exist. An unavailable metrics service should omit the section or show a neutral unavailable state.

Connect the newsletter to a real endpoint that stores normalized email, consent text/version, source and timestamp. Send confirmation and provide unsubscribe handling. Display success only after the server accepts the subscription.

Replace synthetic application scores and fixed response times with observable calculations. Return an `insufficient_data` state when the sample is too small. Label rules-based advice separately from model predictions.

Phase-four exit gate:

```text
[ ] Offline landing API never produces invented social proof
[ ] Every displayed metric has definition, source and date
[ ] Every testimonial has publication consent
[ ] Newsletter persists, confirms and unsubscribes correctly
[ ] Zero-data users receive no fabricated prediction
```

## 7. Phase five: create a real release gate

Address F11, F12 and F19.

Fix the three current lint errors by replacing `transition: all` with explicit properties in:

- `frontend/src/app/jobs/recommendations/page.tsx`
- `frontend/src/components/recommendations/DiscoveryCard.tsx`
- `frontend/src/components/upload/FileUploadZone.tsx`

Update CI so a required job starts PostgreSQL and Redis, applies migrations, launches the API and built frontend, and runs the golden browser journey. Run root Playwright specifications explicitly; do not label Vitest as E2E.

Make npm audit, govulncheck and Trivy fail for the agreed severity policy. Pin action and scanner versions. Use an exception file containing owner, reason and expiry for temporarily accepted findings.

Required release commands:

```powershell
Set-Location frontend
npm run lint
npx tsc --noEmit --incremental false
npm test
npm run build
Set-Location ..\backend
go test ./...
Set-Location ..
```

The release commit must complete these checks plus PostgreSQL integration and Playwright in GitHub Actions.

## 8. Phase six: build search acquisition correctly

Address F10 after the application journey is dependable.

Convert public job detail pages to server-rendered content or server components. Generate unique title, description, canonical, Open Graph and social metadata from each published job. Add valid `JobPosting` JSON-LD only to active individual vacancies. Return 404 for unknown jobs and 410 or a clear expired state when appropriate.

Generate sitemaps from real public inventory:

- active jobs;
- public company profiles;
- useful editorial pages;
- role/location pages only when enough real inventory exists.

Exclude sign-in, sign-up, dashboards and account screens from acquisition sitemaps and apply appropriate indexing directives. Submit the sitemap through Google Search Console and validate representative jobs with Google's rich-result tools.

Build content around candidate intent: salary ranges, interview preparation, role guides, hiring timelines and location-specific market information. Each page must add original, maintained information rather than repeating templated text.

## 9. Phase seven: redesign the conversion path

Do this after phases one through six so the interface reflects truthful behavior.

### Homepage

- Use one direct promise and one primary job-search action.
- Show fresh verified jobs above decorative marketing sections.
- Keep a separate, visible employer path.
- Replace unsupported counters with useful inventory filters or measured facts.
- Use restrained motion, consistent spacing and a small type hierarchy.

### Job search and details

- Show title, company, location, work mode, salary, posted date and verification state.
- Keep one prominent Apply action and one secondary Save action.
- Preserve filters in the URL and make empty/error/loading states distinct.
- Explain expired roles and recommend close alternatives.

### Application flow

- Show steps, required fields, selected resume and upload progress.
- Save draft state safely.
- Prevent duplicate submission with an idempotency key.
- Provide a durable receipt and clear next steps.
- Let the candidate return to the same application status.

### Accessibility

Keep one `<main>` landmark and one `main-content` target. Add persistent form labels and descriptive names for icon buttons. Verify visible focus, keyboard order, 200% zoom, reduced motion and narrow touch layouts.

## 10. Phase eight: instrument growth and retention

Implement an event dictionary before setting targets:

```text
job_impression
job_view
save_job
apply_start
apply_validation_error
apply_submit
apply_success
recruiter_first_response
application_stage_changed
job_alert_opt_in
job_alert_click
newsletter_subscribed
newsletter_unsubscribed
```

Each event needs timestamp, anonymous/session identifier where appropriate, authenticated user identifier after consent, job/company IDs, acquisition channel, device class and failure reason. Avoid sending resume text, contact details or other sensitive payloads to general analytics.

Measure these operating KPIs:

| Funnel area | Primary metric | Guardrail |
|---|---|---|
| Discovery | Indexed active jobs and organic job-detail entrances | Valid job schema and Core Web Vitals pass rate |
| Intent | Job-detail to apply-start rate | Save errors and misleading inventory rate |
| Conversion | Apply-start to successful-submit rate | Submission error and duplicate rate |
| Marketplace quality | Recruiter response rate and median response time | Candidate complaints and expired-job rate |
| Retention | Seven-day candidate return rate | Notification unsubscribe/complaint rate |
| Content | Organic assisted application starts | Thin/duplicate indexed-page count |

Collect a stable two-to-four-week baseline before setting improvement targets. Optimize qualified application starts and successful submissions rather than raw sessions.

## 11. Branch and pull-request sequence

Recommended order:

1. `codex/audit-remediation-01-core-integrity` — F01, F03, F04, F05, F13, F17.
2. `codex/audit-remediation-02-privacy-durability` — F02, F18.
3. `codex/audit-remediation-03-api-clients` — F06, F07.
4. `codex/audit-remediation-04-trust-content` — F08, F09, F14.
5. `codex/audit-remediation-05-release-gates` — F11, F12, F19.
6. `codex/audit-remediation-06-seo` — F10.
7. `codex/audit-remediation-07-accessibility-realtime` — F15, F16.
8. `codex/audit-remediation-08-growth-design` — measurement and conversion redesign.

Each pull request should name the audit IDs, describe before/after behavior, include database/API/browser evidence as appropriate, and update `findings.json` only after the acceptance test passes on the reviewed commit.

## 12. Full-project definition of done

The project is ready for a controlled public launch when:

```text
[ ] All P1 findings are closed with linked evidence
[ ] No user-facing success state is synthetic or unpersisted
[ ] Authorization tests cover owner, foreign user and privileged roles
[ ] Production cannot serve writes without required persistence
[ ] Lint, typecheck, unit tests and production build pass on one commit
[ ] PostgreSQL migrations and real HTTP integration tests pass in CI
[ ] The golden Playwright journey passes on desktop and mobile widths
[ ] Security scans are blocking with reviewed, expiring exceptions
[ ] Public job pages have valid metadata, schema, sitemap entries and status codes
[ ] Homepage claims are sourced and consented
[ ] Funnel analytics and privacy-safe event definitions are deployed
[ ] Keyboard, screen-reader, zoom and reduced-motion checks pass
[ ] Observability, backup restore and rollback procedures are exercised
```

After this gate, begin organic acquisition first. Add paid campaigns only when application completion, recruiter response and retention metrics show that new visitors receive the promised value.
