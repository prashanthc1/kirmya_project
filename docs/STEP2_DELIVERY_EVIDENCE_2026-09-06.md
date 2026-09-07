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

The harness delivery criteria are complete. Release readiness is still red.

- Initial repository synchronization: local and remote `main` both resolved to `440af3fc46a598c90be5e72c5a03dd90908c99f1`; the tree was clean and the non-forced push was already up to date.
- First harness commit: `0abdb354e34ac351b58d47a810af7ac80aa88527`. Second diagnostic and toolchain commit: `e461a11b3ce578a728e8517b46c9b2541891f76d`.
- Backend workflow [34034881421](https://github.com/prashanthc1/kirmya_project/actions/runs/34034881421) passed tests, vet, OpenAPI validation, binary build and container build.
- Frontend workflow [34034881373](https://github.com/prashanthc1/kirmya_project/actions/runs/34034881373) passed lint, explicit typecheck and production build. ESLint reported 0 errors and 141 warnings. The required unit job failed with `UNIT_STALL` at `ApplicationDashboard` after the withdrawal-dialog test; the missing final JSON was rejected rather than treated as a pass.
- Integration workflow [34034881371](https://github.com/prashanthc1/kirmya_project/actions/runs/34034881371) passed the PostgreSQL/Redis/HTTP job and report negative controls. It applied all 94 migrations, checked repeatability, performed Redis write/read/delete, made real health and anonymous authorization requests, persisted a registered user, and ran 154 company SQL tests with zero skips.
- The same integration workflow ran every root Playwright specification against the built frontend and real API in Chromium, Firefox, WebKit and a Pixel 7 viewport. It correctly failed: 0 passed, 44 failed, 0 skipped. Evidence includes 404 `/career-ai`, stale/missing selectors and copy, absent seeded authenticated users/workflows, and the unfinished job, messaging, profile, recovery and upload journeys. Traces, screenshots, videos, logs and JSON/HTML reports were retained.
- Security workflow [34034881407](https://github.com/prashanthc1/kirmya_project/actions/runs/34034881407) proved the security checks block. npm and Trivy repository scans and vulnerable-fixture controls passed. The govulncheck fixture exposed that JSON output can return status 0 with findings; the workflow failed, and a structured source/symbol finding gate plus its own negative tests was added. Go was aligned to patched 1.26.8 and `x/crypto` to 0.55.0; a credential-shaped synthetic sample was replaced without claiming the unfinished export implementation is complete.
- Local database evidence: the production runner applied and tracked 94 migrations and its immediate repeat applied zero. Local type generation/typecheck and production build passed. The Windows unit run reproduced the CI stall. Sandboxed esbuild and WSL limitations are local-environment constraints, not substituted CI passes.

Deliberately broken fixtures produced the expected failures: invalid SQL returned PostgreSQL `42703`; an authorization fixture returning 200 for anonymous `/api/v1/auth/me` failed the expected-401 assertion; failed, skipped, missing, malformed and empty reports were rejected; npm, Trivy and govulncheck controls found reachable vulnerable fixtures. Expected fixture failures are recorded as harness evidence only.

The unresolved product failures belong to later completion steps and remain visible. F01–F10 and F13–F18 are not expanded or marked fixed by this batch. F19 remains in progress until all required frontend checks pass on one SHA. Broad release remains HOLD.
