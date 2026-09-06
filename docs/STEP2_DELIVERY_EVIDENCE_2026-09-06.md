# Step 2 — delivery gate evidence

Owner: platform engineer with QA. Started 6 September 2026. Release remains HOLD.

## Baseline

The requested initial synchronization found a clean working tree. Fetch, non-forced push and remote readback confirmed `440af3fc46a598c90be5e72c5a03dd90908c99f1` on main. Existing secrets and local settings were not staged. The prior PR `9871f18` fixed the three transition lint violations; this batch preserves that fix.

## Required checks and policy

All workflows run on every main push and pull request, without path filters. Frontend lint, typecheck (including Next route generation), unit tests and production build have separate check names. PostgreSQL/Redis/HTTP integration and built-frontend Playwright are additional independent checks. Neither a health response nor database-free unit tests prove persistence. The integration harness verifies migration assets and tracking using the production migration runner, repeats migrations, exercises real Redis writes/readback, and issues actual HTTP requests.

The browser job installs root Playwright from its lockfile, builds Next with `/api/v1`, starts the real Go API and production Next server, and explicitly runs all root `test/e2e` specs on Chromium, Firefox, WebKit and mobile Chromium. Existing product/contract failures stay red. No fixture is reported as a successful product flow merely because a page loaded.

Security: npm HIGH/CRITICAL advisories across root and frontend, reachable govulncheck findings, and Trivy HIGH/CRITICAL vulnerabilities/secrets block. Scanner errors and missing diagnostics also block. npm 11.13.0, govulncheck v1.7.0, Trivy v0.69.3, Playwright 1.63.0 and action commit SHAs are pinned. Go CI and scanner jobs use backend/go.mod. There are no vulnerability exceptions. Any future exception requires an issue, named owner, reason, scope and expiry; this batch grants none.

Logs and JSON reports are uploaded even on failure, with 14-day retention. Playwright keeps failed traces, screenshots and videos. Mandatory integration/browser/unit reports reject skipped tests and empty results. Database-free Go unit output remains explicitly separate, including its visible skips.

Negative controls run against disposable fixtures: an invalid SQL migration must fail the production runner, an HTTP server omitting authorization must fail the exact HTTP assertion used for the API, and malformed/failed/skipped/missing test reports must be rejected. Their expected failures are evidence about the harness only.

## Local toolchain

Use `node scripts/npm.cjs ...` on Windows to invoke npm bundled with the selected Node binary, bypassing stale roaming npm launchers. Node is pinned in `.node-version`; package manifests document npm. No global machine settings are committed. A local clean install initially failed with EPERM because esbuild.exe was in use; incremental install restored dependencies. Sandboxed esbuild could not traverse the configuration directory, so unit/build verification requires normal process access. WSL also reported E_UNEXPECTED; CI uses isolated Linux service containers.

## Execution results

In progress. Only actual completed commands and remote job results will be recorded below. This document does not certify Step 2 or a product release until those results are inspected.
