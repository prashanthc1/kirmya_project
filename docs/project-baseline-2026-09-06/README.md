# Step 1 baseline and backlog

Captured 2026-09-06T06:28:26.374Z from commit `5f6790a95ae02d74666b668ab62e140d861424ec` plus the existing working tree. **Step 1 deliverables complete; release HOLD remains.** No application fixes, tests, migrations, deployment, credentials or production data were changed/executed as part of this capture. Inventory validation is separate from application verification.

- [Baseline and toolchains](baseline.json): HEAD, branch, full staged/unstaged/untracked path inventory, installed/declared versions and source hashes.
- [Consolidated issue register](ISSUE_REGISTER.md): 197 intake items, including F01–F20, 8 security residuals, 165 historical backlog/fix-verification statements and four baseline findings. Every row has a responsible role, workstream, source and acceptance condition.
- [Module and scope matrix](MODULE_MATRIX.md): 57 backend namespaces plus web-shell and native-client; 395 web page files and 963 committed API route expectations.
- [Exact structural inventories](inventories.json): 149 migration files (94 up / 55 down), routes, screens and declarations. Table names are not a live database count.
- [Report ownership](REPORT_OWNERSHIP.md): all 92 reconciled reports and 3585 classified historical source statements.
- [Existing fixes](existing-fixes.json): source-supported boundaries awaiting release-candidate regression evidence.
- [Link repair log](link-repairs.json): 244 local link replacements; [1 unavailable reference](MISSING_REFERENCES.md) are explicitly recorded. External links were not tested.

## Working scope

Core beta: real public jobs/company details → valid account/profile/document → save/apply → scoped recruiter review/interview → candidate update, supported by privacy, moderation, support and recovery controls. Full platform adds all remaining existing domains and native mobile. Proposed capabilities in draft product specifications (including monetization, escrow and enterprise expansion) require an explicit scope decision before they become commitments. Current free-access assumptions remain.

## Baseline discoveries

The shell npm launcher is broken; Node's bundled npm CLI works. Installed Node/Go differ from CI declarations. Docker CLI availability does not establish daemon access. The native app starts with an authenticated UI boolean; server behavior is untested. See B01–B04 for closure requirements. Missing legacy verification files are not reconstructed as PASS results.

## Step 1 exit check

1. Repository/changes/toolchains/routes/migrations captured without environment secrets.
2. Current findings, explicit historical residual work and enhancement candidates retained with acceptance criteria.
3. Existing fixes classified source-supported/historical, never newly test-verified.
4. Audit-local links repaired or redirected to an explicit unavailable-reference record.
5. Core/full scope and responsible owner roles recorded for all reports and inventory rows. Individual staffing is pending; it does not turn findings into completed work.

Validate with `node scripts/build-project-baseline.cjs --check` from the repository root. The generator intentionally refuses to overwrite the dated initial snapshot. Future captures belong in a new dated directory; maintain issue closure evidence deliberately.

Next action: Step 2 — fix the local npm entry point/use the documented bundled CLI, reproduce frontend checks and establish required real PostgreSQL/Redis/Playwright gates. F20 remains open until release evidence is complete in Step 12.

The intake was refined to exclude metadata and explanatory prose, retain inline residuals, and link overlapping records. Intake totals are not distinct confirmed defect counts.
