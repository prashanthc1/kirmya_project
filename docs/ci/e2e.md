# Browser E2E in CI

Two workflows run Playwright, and one file decides what is in them.

| | `05 E2E Browser Smoke` | `06 E2E Browser Full Suite` |
| --- | --- | --- |
| Runs on | every pull request to `main`, pushes to `main`, `workflow_dispatch` | pushes to `main` and `release/**`, `workflow_dispatch` |
| Split by | domain suite (5 jobs) | Playwright project (6 jobs) |
| Engines | Chromium only | Chromium, Firefox, WebKit, Pixel 7, and the two axe projects |
| Specs | the suites marked `pr` in `test/e2e/suites.json` | **every** spec under `test/e2e` |
| Selection | only the suites the diff can affect | always everything |

Both run against the real stack: PostgreSQL 18.3 and Redis 7.4.8 as services,
the real Go migrations, the real API binary, and the production Next standalone
build served the way `frontend/Dockerfile` serves it. Nothing is mocked, and
`scripts/ci/check-results.mjs` fails any job whose Playwright report contains a
failure, a skip, a flake, no tests at all, or that is missing entirely.

## Suite ownership

`test/e2e/suites.json` is the single source of truth. `scripts/ci/e2e-suites.mjs`
reads it to resolve specs, to plan a pull request, and to prove the partition is
complete; both workflows read it through that script. The smoke matrix is built
from it at run time — `05-e2e-smoke.yml` never restates the suite list, so there
is no second copy to drift.

| Suite | Pull-request check | Specs | Projects | Owns |
| --- | --- | --- | --- | --- |
| `auth` | **E2E / Auth** | `auth.spec.ts`<br>`auth-session.spec.ts` | chromium | Sign-in, registration, password reset, session persistence across reloads, and credentialed CORS. |
| `core-user` | **E2E / Core User** | `profile.spec.ts`<br>`empty-account-surfaces.spec.ts`<br>`navigation.spec.ts` | chromium | The signed-in person's own surfaces: profile, the pages a brand-new empty account lands on, and the navigation architecture across phone, tablet and desktop widths. |
| `jobs-recruiting` | **E2E / Jobs & Recruiting** | `jobs.spec.ts`<br>`recruiter-journey.spec.ts` | chromium | The job board and its filters, and the recruiter journey against real postings, applicants and applications. |
| `social-workspace` | **E2E / Social & Workspace** | `messaging.spec.ts`<br>`workspace-switcher.spec.ts` | chromium | Messaging access control and the workspace switcher: which workspaces an account holds, which one it enters, and what the switcher may and may not authorize. |
| `api-critical` | **E2E / API Critical** | `real-api.spec.ts` | chromium | The production bundle talking to the real API: one API base with no doubled `/api/v1`, no synthetic bearer identity in the shipped bundle, and an application receipt that survives a reload against real storage. |
| `accessibility` | _full regression only_ | `accessibility.spec.ts` | a11y-desktop, a11y-mobile | The axe WCAG 2.1 AA scan of the core journey in dark and light mode, the posting page itself, and keyboard access. Engine-independent and slow, so it runs on its own desktop and phone projects. |
| `discovery` | _full regression only_ | `public-indexing.spec.ts`<br>`ai.spec.ts` | chromium | What a crawler receives — server-rendered postings, `JobPosting` structured data, the sitemap and `robots.txt` — and the AI career assistant studio shell. Each test seeds several accounts and postings, so these run in the regression rather than on every pull request. |

Every `*.spec.ts` under `test/e2e` is claimed by exactly one suite. A spec claimed
by none, or by two, fails `npm run test:e2e:validate`, which runs in the
**E2E / Plan** job, in every full-regression job, and in
`07 Security Scans & Negative Controls`. There is no way to add a spec that
silently runs nowhere.

## Check names and branch protection

```
E2E / Plan
E2E / Auth
E2E / Core User
E2E / Jobs & Recruiting
E2E / Social & Workspace
E2E / API Critical
E2E / Smoke Gate          <- require this one
E2E Full / Chromium | Firefox | WebKit | Mobile Chromium | Accessibility Desktop | Accessibility Mobile
E2E Full / Regression Gate
```

The names come from the `label` field in `suites.json` and are stable.

**Require `E2E / Smoke Gate`, not the individual suites.** The suite jobs are
created from the plan's selection, so a suite that was not selected does not
report at all — and a required check that never reports blocks the pull request
forever. `E2E / Smoke Gate` always runs: it fails if the plan job failed, or if
any suite that did run did not pass, and passes when the plan correctly selected
nothing.

For the same reason `05-e2e-smoke.yml` carries no `paths:` filter. A workflow
skipped by a path filter reports nothing, so a documentation-only pull request
would sit on a permanently pending required check. Instead the workflow always
starts, and the ~1 minute **E2E / Plan** job decides whether any browser work is
needed.

## Which suites run on a pull request

**E2E / Plan** diffs the pull request against its merge base and maps each
changed path through `suites.json`:

| Change | Suites |
| --- | --- |
| `frontend/src/{app/signin,components/auth,features/auth}/…` | auth (+ api-critical) |
| `frontend/src/app/{profile,feed,network,…}`, `backend/internal/{profile,networking,notification,…}` | core-user (+ api-critical) |
| `frontend/src/app/{jobs,recruiter,applications,…}`, `backend/internal/{jobs,applications,recruiter,…}` | jobs-recruiting (+ api-critical) |
| `frontend/src/{app/messages,features/messaging}`, `backend/internal/{messaging,community,workspace,…}` | social-workspace (+ api-critical) |
| any other `backend/**` or `frontend/**` path | api-critical |
| `test/e2e/<spec>.spec.ts` | the suite that owns that spec, and nothing else |
| shared auth, middleware, database, migrations, router, API client, `shared/`, design system, shell layout, `playwright.config.ts`, `test/e2e/helpers.ts`, `scripts/ci/**`, `.github/**`, lockfiles | **all five** |
| anything matching no pattern at all | **all five** |
| the diff could not be computed | **all five** |
| `docs/**`, `k8s/**`, `monitoring/**`, `deployments/**`, `mobile/**`, `audit-review/**`, top-level `*.md`, other workflows | **none** — the gate goes green in about a minute |

`api-critical` deliberately claims every `backend/**` and `frontend/**` path: the
claim it verifies — that the shipped bundle addresses one real API base — belongs
to no single domain.

The bias is one-directional and intentional. A suite that runs when it did not
need to costs runner minutes; a suite that does not run when it was needed costs
a regression on `main`. Every ambiguous case therefore runs everything.

Pushes to `main` and `workflow_dispatch` always run the full critical set;
`workflow_dispatch` also takes a `suites` input (`auth,api-critical`, or `all`).

## When the full regression runs

On every push to `main` and to `release/**`, and on demand via
`workflow_dispatch`. It is deliberately **not** a pull-request check: it is six
jobs across three engines and two viewports, and blocking a one-line change on it
buys nothing that the smoke suites do not already cover.

There is no nightly schedule, because no workflow in this repository is
scheduled. If one is wanted, it is one block in `06-e2e-full.yml`:

```yaml
on:
  schedule:
    - cron: '0 3 * * *'
```

## Running it locally

The specs drive a real stack, so bring the same one up that CI does. Playwright
starts the frontend itself through `scripts/ci/start-standalone.mjs`; everything
else you start yourself.

```bash
# 1. Services
docker compose up -d postgres redis

# 2. Environment, matching .github/workflows/05-e2e-smoke.yml
export DATABASE_URL='postgres://postgres:postgrespassword@127.0.0.1:5432/kirmya?sslmode=disable'
export REDIS_HOST=127.0.0.1 REDIS_PORT=6379 REDIS_ENABLED=true ALLOW_NO_DB=false
export APP_ENV=test SERVER_PORT=8080 OTEL_ENABLED=false ENABLE_TRACING=false
export JWT_SECRET='disposable-local-jwt-key-not-for-deployment-0123456789'
export TEST_API_URL='http://127.0.0.1:8080'
export NEXT_PUBLIC_API_URL='http://127.0.0.1:8080/api/v1'
export CORS_ALLOWED_ORIGINS='http://127.0.0.1:3000'

# 3. Migrations and the API
(cd backend && go run ./tools/ci-migrate && go run ./cmd/kirmya &)

# 4. Browsers and the production frontend build Playwright will serve
npm ci && npm ci --prefix frontend
npx playwright install --with-deps chromium
npm --prefix frontend run build
```

`DATABASE_URL` above matches the `postgres` service in `docker-compose.yml`;
CI uses its own disposable database and credentials instead.

One suite, exactly as its CI job runs it:

```bash
npm run test:e2e:suite -- auth
npm run test:e2e:suite -- jobs-recruiting
npm run test:e2e:suite -- accessibility          # picks the axe projects on its own
```

Anything after the suite name goes through to Playwright:

```bash
npm run test:e2e:suite -- auth --headed
npm run test:e2e:suite -- auth --project=firefox
npm run test:e2e:suite -- core-user -g 'lands a normal user on the feed'
```

Everything, on every project — what `06 E2E Browser Full Suite` covers between
its six jobs:

```bash
npm run test:e2e
```

One project only:

```bash
npx playwright test --project=webkit
```

Locally the config uses one worker, no retries, a 20s test timeout and video on
failure. In CI it uses two workers, one retry, a 30s timeout and video on the
retry. `PLAYWRIGHT_WORKERS=4 npm run test:e2e` overrides the worker count.

## Assigning a new spec

1. Write `test/e2e/<name>.spec.ts`. Seed everything it needs through the API with
   a unique suffix — `registerAccount`, `publishJob` and
   `seedRecruiterWithApplicant` in `test/e2e/helpers.ts` already do this. Never
   depend on data another spec left behind: suites run in separate jobs against
   separate databases, and files inside a suite run on parallel workers.
2. Add it to the suite in `test/e2e/suites.json` whose `owns` sentence already
   describes it. If none does, and it is fast and guards a critical journey, add a
   suite — the matrix and the check name come from `suites.json`, so no workflow
   edit is needed. If it is slow, engine-independent, or
   guards something a broken pull request would not ship, put it in
   `accessibility` or `discovery` so it runs in the regression only.
3. If the new suite needs its own path mapping, add `pathPatterns` for it. Leave
   a path out rather than guessing: an unmatched path runs every suite, which is
   the safe direction. Only add to `ignoredPathPatterns` when a path genuinely
   cannot change anything a browser sees.
4. Run `npm run test:e2e:validate` and `npm run test:gates`.

## Retries do not hide anything

`check-results.mjs` rejects a report with `flaky` set, so a test that fails and
then passes on its retry still fails the job. The single CI retry exists to
produce a second trace and a video, and to say whether the failure reproduces.
The same gate rejects skips, so `test.skip` in a spec that CI runs is a build
failure, by design.

## Diagnostics

A failing smoke job uploads `playwright-smoke-<suite>-<sha>`; every full-suite
job uploads `playwright-full-<project>-<sha>` whether it passed or not. Both
contain the Playwright HTML report, the traces, screenshots and videos under
`test-results/`, and `artifacts/` with the frontend build log, the migration log,
the API log, the Playwright log and the PostgreSQL and Redis container logs.

The `|| true` on the two `docker logs` lines is the only one in these workflows,
and it is there so that a container that has already exited cannot turn a green
run red on its way out. No test command is allowed one.
