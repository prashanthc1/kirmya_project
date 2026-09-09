# Consolidated issue register

**Reconciled 9 September 2026 against the batch 6 release candidate.** Every
F- and R- row below was checked against current source or against a run recorded
in the [batch 6 acceptance record](../BATCH6_RELEASE_ACCEPTANCE_2026-09-09.md),
not against the document that last claimed it. All 22 findings from the September 5 audit and the batches since are closed. Two more were found by the batch 6 acceptance pass: F23 is closed, F24 is open and is the one release blocker that is a code defect. Two
residuals stay open on purpose — R02 needs a product decision, R05 needs a
startup check nobody has written — and R07 is open because no AI provider has
been chosen. Enhancement intake (H-rows) remains uncommitted scope and is
counted in nothing.

Source of truth: [issue-register.json](issue-register.json). F01–F20 priorities are preserved. Historical rows are intake records, not a count of distinct confirmed bugs; related issue IDs retain overlaps. Previously claimed fixes await regression evidence. Enhancement candidates are not automatically committed scope. Owners are responsible roles; individual staffing remains pending. [Excluded metadata/prose](intake-exclusions.json) is retained separately.

| ID | Priority | Status | Owner | Workstream / steps | Work |
|---|---|---|---|---|---|
| F01 | P1 | verified | Backend security lead | Identity and access / 3 | Application timeline omits candidate ownership. [batch 2 evidence, 7 Sep 2026](../BATCH2_DELIVERY_EVIDENCE_2026-09-07.md) |
| F02 | P1 | verified | Backend privacy lead | Privacy and data lifecycle / 7 | Privacy and consent operations are durable and enforced. [batch 3 evidence, 7 Sep 2026](../BATCH3_DELIVERY_EVIDENCE_2026-09-07.md) |
| F03 | P1 | verified | Hiring domain lead | Hiring workflow / 6 | Owned PDF upload, registration, read, download and deletion persist actual bytes and metadata. Job publication and the public board were repaired in the same batch. [batch 3 evidence, 7 Sep 2026](../BATCH3_DELIVERY_EVIDENCE_2026-09-07.md) |
| F04 | P1 | verified | Hiring domain lead | Hiring workflow / 6 | Application snapshots retain contact edits, owned resume, cover letter and required answers. [batch 3 evidence, 7 Sep 2026](../BATCH3_DELIVERY_EVIDENCE_2026-09-07.md) |
| F05 | P1 | verified | Frontend integration lead | API contracts / 5 | Saved jobs use the wrong response shape. [batch 2 evidence, 7 Sep 2026](../BATCH2_DELIVERY_EVIDENCE_2026-09-07.md) |
| F06 | P1 | verified | Frontend integration lead | API contracts / 5 | Production frontend CI supplies an incompatible API base URL. [batch 2 evidence, 7 Sep 2026](../BATCH2_DELIVERY_EVIDENCE_2026-09-07.md) |
| F07 | P1 | verified | Frontend integration lead | API contracts / 5 | Several reachable feature clients still use mock authentication and localhost. [batch 2 evidence, 7 Sep 2026](../BATCH2_DELIVERY_EVIDENCE_2026-09-07.md) |
| F08 | P1 | verified | Frontend and communications lead | Public experience and communications / 8 | Public homepage presents real counted metrics; fabricated testimonials and fake connections removed. [batch 4 evidence, 8 Sep 2026](../PROJECT_COMPLETION_PLAN_2026-09-06.md#batch-4--steps-8-and-9) |
| F09 | P2 | verified | Frontend and communications lead | Public experience and communications / 8 | Newsletter subscriptions persist to PostgreSQL with rate limiting. [batch 4 evidence, 8 Sep 2026](../PROJECT_COMPLETION_PLAN_2026-09-06.md#batch-4--steps-8-and-9) |
| F10 | P1 | verified | Frontend and communications lead | Public experience and communications / 8 | Server-rendered public jobs with per-job metadata, self-canonicals, JobPosting JSON-LD, and dynamic sitemap. [batch 4 evidence, 8 Sep 2026](../PROJECT_COMPLETION_PLAN_2026-09-06.md#batch-4--steps-8-and-9) |
| F11 | P1 | verified | Platform and QA lead | Release gates / 2 | Database-free CI is mistaken for full workflow validation |
| F12 | P1 | verified | Platform and QA lead | Release gates / 2 | Security workflow deliberately suppresses scan failures |
| F13 | P1 | verified | Backend data lead | Persistence and migrations / 4 | Application data access hides database errors. [batch 2 evidence, 7 Sep 2026](../BATCH2_DELIVERY_EVIDENCE_2026-09-07.md) |
| F14 | P2 | verified | Frontend and communications lead | Public experience and communications / 8, 10C | Replaced synthetic scores with counted application funnel metrics and insufficient-data states. [batch 4 evidence, 8 Sep 2026](../PROJECT_COMPLETION_PLAN_2026-09-06.md#batch-4--steps-8-and-9) |
| F15 | P2 | verified | Frontend and communications lead | Public experience and communications / 8 | Contrast ratios remediated to WCAG AA across themes; 24 automated axe-core browser checks. [batch 4 evidence, 8 Sep 2026](../PROJECT_COMPLETION_PLAN_2026-09-06.md#batch-4--steps-8-and-9) |
| F16 | P2 | verified | Frontend and communications lead | Public experience and communications / 8, 9 | Multi-replica realtime delivery via Redis pub/sub and distributed Lua token bucket rate limiting. [batch 4 evidence, 8 Sep 2026](../PROJECT_COMPLETION_PLAN_2026-09-06.md#batch-4--steps-8-and-9) |
| F17 | P2 | verified | Frontend integration lead | API contracts / 5 | Job-specific apply alias validates the body before reading its path ID. [batch 2 evidence, 7 Sep 2026](../BATCH2_DELIVERY_EVIDENCE_2026-09-07.md) |
| F18 | P1 | verified | Backend data lead | Persistence and migrations / 4 | Production can enter unregistered nil-database fallback mode. [batch 2 evidence, 7 Sep 2026](../BATCH2_DELIVERY_EVIDENCE_2026-09-07.md) |
| F19 | P1 | verified | Platform and QA lead | Release gates / 2 | Frontend release checks verified green and re-run on the batch 6 candidate: ESLint (0 errors, 126 warnings), TypeScript (0 errors), Vitest (60 files, 567/567 pass, 0 skipped), Next.js production build clean. [Batch 6 acceptance](../BATCH6_RELEASE_ACCEPTANCE_2026-09-09.md) |
| F20 | P1 | verified | Technical lead | Evidence governance / 1, 12 | Audit scores and operational claims exceed their evidence. **Closed 9 Sep 2026** for the documents this project controls: the [batch 6 acceptance record](../BATCH6_RELEASE_ACCEPTANCE_2026-09-09.md), the [operations handbook](../operations/RELEASE_OPERATIONS_HANDBOOK.md) and the [configuration requirements](../operations/CONFIGURATION_AND_PROVIDERS.md) state what was run and what was not, and carry no readiness percentage. Historical reports carrying inflated scores are marked superseded, not rewritten. The full-platform release hold is unchanged and is stated as a verdict rather than a score. |
| F21 | P1 | verified | Platform and backend lead | Concurrency / 6, 9 | Deadlock on concurrent applications resolved with FOR NO KEY UPDATE; 2,810 req/s verified under load test. [batch 4 evidence, 8 Sep 2026](../PROJECT_COMPLETION_PLAN_2026-09-06.md#batch-4--steps-8-and-9) |
| F22 | P1 | verified | Platform and backend lead | Operations / 9 | System health fabrications replaced with real Redis, Object Storage, and Worker delivery queue probes. [batch 4 evidence, 8 Sep 2026](../operations/step9-readiness-evidence-2026-09-08.md) |
| F23 | P1 | verified | Domain engineering lead | Full-platform domain acceptance / 10 | Recommendation candidate queries had never executed - `column u.deleted_at does not exist` and `could not determine data type of parameter $1` on every request - and the service discarded both errors and served fixtures instead: invented people, communities and job postings, and a constant feed insight scored 95. **Closed 9 Sep 2026**; covered by `backend/test/ci/batch6_recommendations_test.go`, verified to fail against the unfixed build. [Batch 6 acceptance](../BATCH6_RELEASE_ACCEPTANCE_2026-09-09.md) |
| F24 | P1 | open | Frontend experience lead with hiring and admin domain leads | Full-platform domain acceptance / 10A, 10B, 10F | Fourteen files under `frontend/src` present invented people as real; ten make no API call at all, so reachable authenticated pages render fiction. Found 9 Sep 2026. **Not fixed:** each screen needs its own step 10 journey evidence before being wired to real data. Guarded against spreading by `frontend/src/test/invented-identities.test.ts`, whose quarantine list carries the group and responsible role for each file and may only shrink. [Batch 6 acceptance](../BATCH6_RELEASE_ACCEPTANCE_2026-09-09.md) |
| R01 | P1 | verified | Backend security lead | Identity and access / 3 | Identity resolution across remaining modules. [batch 2 evidence, 7 Sep 2026](../BATCH2_DELIVERY_EVIDENCE_2026-09-07.md) |
| R02 | P2 | open | Backend security lead | Identity and access / 3 | Access-token session revocation after password reset. **Partly closed 7 Sep 2026:** the discarded `RevokeAllUserSessions` error is fixed — the password change and session revocation are now one transaction, and reuse detection no longer claims a revocation it did not perform (`62c8347`, `98c5c78`). **Still open, by decision:** nothing on the request path consults revocation, so an issued access token stays valid for its remaining 15-minute lifetime. Closing it changes the authentication architecture and needs a product decision. Recorded as a known limit in the [configuration requirements](../operations/CONFIGURATION_AND_PROVIDERS.md). |
| R03 | P2 | verified | Platform and backend lead | Full-platform domain acceptance / 10 | Distributed rate limiting. Implemented as a Redis Lua token bucket in batch 4; its tests ran against a real Redis on the batch 6 candidate — `TestTwoReplicasShareOneBudget`, `TestDifferentClientsGetSeparateBudgets`, `TestLimitersWithDifferentShapesDoNotShareABucket`, 0 skips. [Batch 6 acceptance](../BATCH6_RELEASE_ACCEPTANCE_2026-09-09.md) |
| R04 | P3 | verified | Domain engineering lead | Full-platform domain acceptance / 10 | Unused `MustGetUserID` panic helper. **Removed 9 Sep 2026**; it had no callers anywhere in the repository. [Batch 6 acceptance](../BATCH6_RELEASE_ACCEPTANCE_2026-09-09.md) |
| R05 | P3 | open | Domain engineering lead | Full-platform domain acceptance / 10 | Required handler registration completeness. Assessed in batch 2 and not implemented; nil-handler substitution in analytics routes is the worked example. Partial cover confirmed in batch 6: `internal/router/admin_surface_completeness_test.go` and the 961-route golden table fail on an unregistered or renamed route, and `swagger-validate` fails on an undocumented one. Still missing: a nil handler substituted into a route group must fail startup. See [batch 2 evidence, 7 Sep 2026](../BATCH2_DELIVERY_EVIDENCE_2026-09-07.md) |
| R06 | P1 | verified | Backend data lead | Persistence and migrations / 4 | Migration concurrency and missing assets. [batch 2 evidence, 7 Sep 2026](../BATCH2_DELIVERY_EVIDENCE_2026-09-07.md) |
| R07 | P2 | open | Domain engineering lead | Full-platform domain acceptance / 10C | Mock AI providers and advertised capabilities. No provider is configured and no provider decision has been made. The AI surfaces answer deterministically and name their method; nothing invents a score. Group 10C stays open. [Batch 6 acceptance](../BATCH6_RELEASE_ACCEPTANCE_2026-09-09.md) |
| R08 | P2 | verified | Platform and QA lead | Release evidence and operations / 2, 9 | Refresh cookie deployment compatibility. The cookie is `HttpOnly`, `Secure`, `SameSite=Lax` — deliberately not `Strict`, guarded by a test that fails if it is set back — and browser session persistence across reloads, tabs, direct protected URLs and sign-out passes on the production artifact. [Batch 6 acceptance](../BATCH6_RELEASE_ACCEPTANCE_2026-09-09.md) |
| H001 | untriaged | unverified | Backend security lead | Identity and access / 3 | Add Redis-backed token blacklist for instant enterprise session revocation. |
| H002 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | Implement push notification worker queue for interview reminders. |
| H003 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Automated OpenAPI TypeScript Type Generation**: Automating `openapi-typescript` generation in frontend build pipelines. |
| H004 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **GraphQL / BFF Gateways**: Evaluating whether specific mobile screens require dedicated BFF aggregators (deferred for monolith simplicity). |
| H005 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Automated SDK Client Publishing**: Generating typed Go and TypeScript client SDKs for third-party ATS integrations. |
| H006 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Enhanced Swagger Try-It-Out UI Sandbox**: Pre-populating Swagger UI with sample JWT credentials in local environments. |
| H007 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Dynamic ETag & 304 Not Modified Caching**: Conditional GET requests for static profile and company assets. |
| H008 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Detailed OpenAPI Example Payloads**: Adding comprehensive request/response examples for all 464 admin analytics endpoints. |
| H009 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Webhook Subscription Management API**: Formalizing webhook registration and HMAC signature verification endpoints. |
| H010 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Cursor-Based Pagination for High-Volume Feeds**: Expanding keyset pagination across enterprise audit log feeds. |
| H011 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Granular API Scopes / OAuth2 Scopes**: Supporting fine-grained OAuth2 scopes for partner recruitment tools. |
| H012 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Rate Limit Response Headers in Swagger**: Documenting `X-RateLimit-Limit` and `X-RateLimit-Remaining` in OpenAPI specs. |
| H013 | untriaged | unverified | Backend data lead | Persistence and migrations / 4 | **Database Deep-Dive, Schema Alignment & Persistence Optimization**: |
| H014 | untriaged | unverified | Backend data lead | Persistence and migrations / 4 | Audit all 84+ migration files in `backend/scripts/migrations/`. |
| H015 | untriaged | unverified | Backend data lead | Persistence and migrations / 4 | Verify table column matching against repository SQL queries. |
| H016 | untriaged | unverified | Backend data lead | Persistence and migrations / 4 | Transition remaining in-memory repositories to full PostgreSQL persistence with connection pooling. |
| H017 | untriaged | unverified | Domain engineering lead | Full-platform domain acceptance / 10 | Validate foreign key indexes, constraints, and cascade delete rules. |
| H018 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Passkey / WebAuthn Biometric Support**: FIDO2 biometric authentication for Face ID / Touch ID sign-in. |
| H019 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Multi-Factor Authentication (MFA/TOTP)**: In-line authenticator app QR code generation during setup. |
| H020 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Magic Link Authentication**: Passwordless one-time login links sent via email. |
| H021 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Device Management & Session Revocation**: Viewer listing active sessions with 1-click remote termination. |
| H022 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Security Key Recovery Backup Codes**: 10 single-use emergency backup recovery codes. |
| H023 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Onboarding Social Proof Callouts**: Micro-testimonials highlighting recruiter match rates during onboarding. |
| H024 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Single-Sign-On (SSO) for Enterprise**: SAML 2.0 / OIDC integrations for enterprise employer accounts. |
| H025 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Suspicious Login Geolocation Alerts**: Email notifications for logins from unrecognized locations. |
| H026 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Interactive Onboarding Role Recommendations**: Dynamic career suggestions based on user title input. |
| H027 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Automated Session Inactivity Warning**: Subtle dialog prompting extension before token expiration. |
| H028 | untriaged | unverified | Backend data lead | Persistence and migrations / 4 | Add candidate cover letter upload handler connecting to S3/MinIO in document repository. |
| H029 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | Implement webhook event triggers upon recruiter stage updates. |
| H030 | untriaged | unverified | Backend data lead | Persistence and migrations / 4 | Add comprehensive integration test suite verifying end-to-end database writes against a local Dockerized PostgreSQL instance. |
| H031 | untriaged | unverified | Domain engineering lead | Full-platform domain acceptance / 10 | Implement composite indexes for multi-column job filter queries (`location + remote + salary`). |
| H032 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Global Shell & Navigation Bar Translation**: Applying the design tokens to the top app bar and mobile navigation drawer (Prompt 14). |
| H033 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Page-by-Page Card & Feed Migration**: Progressively updating existing feature cards to consume theme tokens instead of inline sx props. |
| H034 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Data Table Responsive Density Toggle**: Providing compact vs comfortable density modes in recruiter analytics. |
| H035 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Enhanced Chart Palette Theming**: Synchronizing Recharts / MUI X-Charts color schemes with `theme.palette`. |
| H036 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Dynamic Storybook / Showcase Integration**: Setting up an automated design system preview sandbox. |
| H037 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Custom Badge & Avatar Badging Variants**: Standardizing verified recruiter and company presence indicators. |
| H038 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Refined Code & JSON Preview Highlighting**: Adding themed syntax coloring for developer API documentation views. |
| H039 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Subtle Gradient Accent System**: Standardizing micro-gradients for primary promotional hero banners. |
| H040 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Form Error Popover Tooltips**: Adding floating accessible error tooltips on complex multi-step wizards. |
| H041 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Print Stylesheet Tokens**: Adding clean `@media print` rules for candidate resume exports. |
| H042 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Automated OpenAPI Type Generation**: Automating `openapi-typescript` build scripts from backend `swagger.json`. |
| H043 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Next.js Dynamic Imports on Admin Modules**: Lazy-loading heavy admin analytics tables to optimize initial bundle delivery. |
| H044 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Infinite Scroll Keyset Virtualization**: Adding `react-window` for high-volume enterprise audit streams. |
| H045 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Enhanced Offline Network Reconnection Banner**: Real-time toast feedback on browser connectivity change. |
| H046 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Granular URL Filter Synchronization**: Synchronizing multi-select facet filters with Next.js URL query params across candidate search. |
| H047 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Optimistic UI Mutation Patterns**: Adding optimistic updates for connection requests and message sending. |
| H048 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Cross-Tab Auth Synchronization**: Using `BroadcastChannel` to sync logout events across open browser tabs. |
| H049 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Automated E2E Playwright Suite**: Creating end-to-end browser regression tests for critical signup-to-apply journeys. |
| H050 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Image Lazy Loading & Blur Placeholders**: Pre-caching avatars and company logos with SVG blur placeholders. |
| H051 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Fine-Grained Breadcrumb Automation**: Deriving dynamic breadcrumbs directly from Next.js route segments. |
| H055 | P2 | unverified | Frontend integration lead | API contracts / 5 | \| **TD-01** \| Duplicate / Unconsolidated Axios Client Instances \| `features/*/api.ts` \| **P2** \| Divergent interceptors or base URL definitions across feature modules. \| Consolidate all feature API calls through unified `services/api.ts` client. \| 🟡 Managed \| |
| H056 | P2 | unverified | Domain engineering lead | Full-platform domain acceptance / 10 | \| **TD-02** \| Scattered Route String Literals \| `app/**/*.tsx` \| **P2** \| Risk of typos or broken deep links when routes evolve. \| Adopt centralized `shared/routes.ts` constants across all links and routers. \| 🟢 Resolved (`ROUTES` created) \| |
| H057 | P2 | unverified | Domain engineering lead | Full-platform domain acceptance / 10 | \| **TD-03** \| Ad-hoc Empty & Error UI Displays \| `components/**/*.tsx` \| **P2** \| Inconsistent look, missing retry actions, unhandled edge cases. \| Use unified `EmptyState` and `ErrorState` components from `components/common/`. \| 🟢 Resolved (Primitives created) \| |
| H058 | P1 | unverified | Frontend integration lead | API contracts / 5 | \| **TD-04** \| Global Uncaught Client UI Crashes \| Root Tree \| **P1** \| Component crash destroys whole page without user recovery path. \| Wrapped root tree in `ErrorBoundary` with telemetry reporting. \| 🟢 Resolved \| |
| H059 | P2 | unverified | Frontend integration lead | API contracts / 5 | \| **TD-05** \| Direct Window Navigation vs Next/Link \| `components/**/*.tsx` \| **P2** \| Full page reloads instead of SPA client-side transitions. \| Replace raw `<a>` and `window.location` with Next.js `Link` and `useRouter`. \| 🟡 Managed \| |
| H060 | P3 | unverified | Domain engineering lead | Full-platform domain acceptance / 10 | \| **TD-06** \| Inconsistent Timestamp / Salary Formatting \| `features/**/*.tsx` \| **P3** \| Date/currency formatting variations across cards and tables. \| Standardize across `shared/utils/date.ts` and `shared/utils/currency.ts`. \| 🟢 Resolved (Utils created) \| |
| H061 | P3 | unverified | Domain engineering lead | Full-platform domain acceptance / 10 | \| **TD-07** \| Heavy Admin Bundle Chunk Size \| `app/admin/**` \| **P3** \| 464 admin routes bundle during build. \| Utilize dynamic `React.lazy` / `next/dynamic` chunk splitting for admin views. \| 🟡 Managed \| |
| H062 | P3 | unverified | Domain engineering lead | Full-platform domain acceptance / 10 | \| **TD-08** \| Incomplete TypeScript Narrowing on Mock Hooks \| `features/*/hooks.ts` \| **P3** \| Minor optional chaining fallback warnings. \| Tighten return types to match Prompt 11 DTO models. \| 🟢 Aligned \| |
| H063 | P2 | unverified | Backend security lead | Identity and access / 3 | \| **TD-09** \| Form Validation Feedback Duplication \| `components/auth/**` \| **P2** \| Repeated validation schemas across signin/signup. \| Share Zod validation schemas with backend contract DTO rules. \| 🟢 Standardized \| |
| H064 | P3 | unverified | Domain engineering lead | Full-platform domain acceptance / 10 | \| **TD-10** \| Missing Keyset Pagination on High-Volume Feeds \| `features/admin/audit` \| **P3** \| Large table offset pagination degrades on 10k+ rows. \| Expand keyset pagination support in future optimization phase. \| 🟡 Managed \| |
| H065 | untriaged | unverified | Backend security lead | Identity and access / 3 | Redis-backed JWT token revocation blacklist for enterprise instant logout. |
| H066 | untriaged | unverified | Domain engineering lead | Full-platform domain acceptance / 10 | Background worker queue for async WebSocket broadcast fan-out. |
| H067 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Job Feed Filter Tabs**: Adding "Recent", "Best Match", and "Remote Only" pill filters above the recommended jobs feed. |
| H068 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Infinite Scroll Pagination on Feed**: Virtualizing job recommendation streams for active job seekers. |
| H069 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **One-Click Quick Apply Modal**: Triggering instant application drawer directly from feed job cards. |
| H070 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Interactive Skill Gap Pill Tags**: Highlighting matching vs missing skills directly on feed cards. |
| H071 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Dynamic Testimonial Carousel**: Adding auto-advancing spring animation for candidate stories. |
| H072 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Animated Counter on Landing Metrics**: Smooth numeric roll-up when metrics scroll into view. |
| H073 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Hero Video Preview Modal**: Lightweight modal demonstrating platform features in 60 seconds. |
| H074 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Real-Time Feed Activity Toast**: Toast notification when new matching jobs are posted while on `/feed`. |
| H075 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Personalized Next Action Widget**: Dynamic prompt suggesting specific profile fields to improve match score. |
| H076 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Resume Import Dropzone on Landing**: Direct drag-and-drop resume parser preview for visitors. |
| H077 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Split-Screen Desktop Discovery (List + Detail Pane)**: Adding an optional side-by-side split screen view for rapid job scanning on wide monitors. |
| H078 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Salary Slider Range Filter**: Adding an interactive dual-thumb slider for minimum and maximum salary filters. |
| H079 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **One-Click Quick Apply Drawer**: Slide-out drawer for instant profile submission without leaving `/jobs`. |
| H080 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Company Culture & Office Photos Preview**: Displaying verified office preview images inside `/jobs/:id`. |
| H081 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Skill Gap Analysis Matrix**: Visual match percentage comparing candidate profile skills against required skills. |
| H082 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Similar Job Recommendations Rail**: "People also viewed" recommendation card carousel on `/jobs/:id`. |
| H083 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Instant Job Alert Creation Trigger**: "Create alert for this search" pill button when search returns results. |
| H084 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Export / Share Job Card Image**: Social card preview generation for sharing jobs on LinkedIn/Twitter. |
| H085 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Recruiter Contact Lockup**: Direct messaging button to the assigned recruiter for verified postings. |
| H086 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Application Stage Timeline**: Embedded progress tracker for applied roles on the job detail header. |
| H087 | untriaged | unverified | Frontend integration lead | API contracts / 5 | \| **Real-Time Transport** \| Basic unmanaged WebSocket call without auto-reconnection \| Resilient `messagingApi.connectWebSocket` with exponential backoff, typing throttling, and presence synchronization \| **PASS** \| |
| H088 | untriaged | unverified | Domain engineering lead | Full-platform domain acceptance / 10 | \| **Unwired Handlers** \| 14 handlers were uninstantiated or passed as `nil` to `SetupRouter`. \| Instantiated all 14 handlers in `buildDependencies` (`cmd/kirmya/main.go`) and wired them into `RouterDependencies`. \| **VERIFIED CLEAN**: Zero nil pointer panics; all 56 domain packages fully mounted. \| |
| H089 | untriaged | unverified | Backend data lead | Persistence and migrations / 4 | **Schema & Migration Deep-Dive**: |
| H090 | untriaged | unverified | Backend data lead | Persistence and migrations / 4 | Audit all 84 migration scripts (`0001` through `0084`) against Go repository entity structs. |
| H091 | untriaged | unverified | Platform and QA lead | Release evidence and operations / 2, 9 | Verify foreign key indexes, constraints, and cascade delete rules. |
| H092 | untriaged | unverified | Backend data lead | Persistence and migrations / 4 | **Core Domain Repository Overhaul (Part 1)**: |
| H093 | untriaged | unverified | Backend privacy lead | Privacy and data lifecycle / 7 | Transition `admin`, `billing`, and `legal` repositories from `database/sql` to `*pgxpool.Pool`. |
| H094 | untriaged | unverified | Platform and QA lead | Release evidence and operations / 2, 9 | Implement `pgx.Tx` transaction support for multi-table updates. |
| H095 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Rich Text Formatting for Descriptions**: Markdown or rich text toolbar for experience bullets. |
| H096 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Interactive Skill Endorsements**: 1-click peer skill endorsement buttons with verified connection badges. |
| H097 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Custom Section Reordering**: Drag-and-drop handles for reordering experience or project entries. |
| H098 | untriaged | unverified | Backend privacy lead | Privacy and data lifecycle / 7 | **PDF Profile Resume Export**: 1-click generation of Apple-style PDF resumes directly from profile data. |
| H099 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Video Introduction Clip**: 30-second video elevator pitch attachment on the profile header. |
| H100 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **QR Code Profile Sharing Card**: Modal generating a scannable QR code linking to `/profile/[username]`. |
| H101 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Custom Profile Banner Image Themes**: Curated abstract gradient banners for user profile customization. |
| H102 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Direct Calendly / Interview Scheduler Integration**: Embedded booking link for verified recruiters. |
| H103 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **GitHub & Dribbble Portfolio Auto-Sync**: Webhook integration for automatically pulling public repositories. |
| H104 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Profile Verification Document Upload Modal**: Multi-step identity verification upload with preview. |
| H106 | untriaged | unverified | Platform and QA lead | Release evidence and operations / 2, 9 | **Redis Read-Through Caching**: Cache candidate profiles and unread counters with automated cache invalidation. |
| H107 | untriaged | unverified | Platform and QA lead | Release evidence and operations / 2, 9 | **Read Replica Query Routing**: Route high-volume search queries to PostgreSQL read replicas using `dbCluster.Replica()`. |
| H108 | untriaged | unverified | Platform and QA lead | Release evidence and operations / 2, 9 | **OpenTelemetry OTLP Exporter**: Exporting traces directly to Jaeger / Grafana Tempo backends. |
| H109 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **WebSocket Distributed Fan-out**: Redis / NATS PubSub backend for clustering WebSocket instances across multi-node deployments. |
| H110 | untriaged | unverified | Backend data lead | Persistence and migrations / 4 | **Background Dead Letter Queue**: Database-persisted failed notification retry runner. |
| H111 | untriaged | unverified | Backend data lead | Persistence and migrations / 4 | **Automated Database Index Maintenance**: Periodic `pg_stat_statements` analysis to identify slow query regressions. |
| H112 | untriaged | unverified | Frontend integration lead | API contracts / 5 | **Client-Side Request Deduplication**: React Query mutation debouncing for rapid double-click submissions. |
| H113 | untriaged | unverified | Platform and QA lead | Release evidence and operations / 2, 9 | **Dynamic Gzip Threshold Tuning**: Compression threshold tuned for responses $> 1\text{ KB}$ to reduce network egress. |
| H114 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | **Asset CDN Pre-warming**: CDN edge caching for static assets and documentation. |
| H115 | untriaged | unverified | Platform and QA lead | Release evidence and operations / 2, 9 | **Automated Load Testing CI Pipeline**: Automated k6 load tests running against staging environments before releases. |
| H116 | untriaged | unverified | Domain engineering lead | Full-platform domain acceptance / 10 | Add Redis-backed pub/sub adapter for multi-instance WebSocket broadcasts. |
| H117 | untriaged | unverified | Frontend experience lead | Public experience and communications / 8 | Implement push notification queue processor for FCM/APNs. |
| H118 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Redis-Backed Distributed Revocation**: In-memory/db session revocation operates reliably; distributed Redis blocklist recommended for multi-region clusters. |
| H119 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Virus / Malware Antivirus Scanner for Uploads**: ClamAV integration for scanning candidate-uploaded PDF resumes before processing. |
| H120 | untriaged | unverified | Backend security lead | Identity and access / 3 | **MFA / TOTP Implementation**: Multi-factor authentication support for enterprise recruiter and administrator logins. |
| H121 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Automated DSR Zipped Data Export**: Background worker generating encrypted zip packages for GDPR Article 15 SAR requests. |
| H122 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Direct-to-S3 Pre-signed Uploads**: Offloading heavy media uploads to pre-signed AWS S3 / Cloudflare R2 URLs. |
| H123 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Granular Scoped API Tokens**: Personal access tokens with fine-grained capability scopes for third-party ATS integrations. |
| H124 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Automated Credential Rotation**: Automatic KMS rotation for database and JWT secret keys. |
| H125 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Dynamic CSP Nonce Generation**: Per-request cryptographic nonces for script tags. |
| H126 | untriaged | unverified | Backend security lead | Identity and access / 3 | **IP Geolocation Anomaly Detection**: Flagging simultaneous logins from geographically distant IP addresses. |
| H127 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Automated SAST / DAST in CI/CD**: Periodic automated Semgrep / Trivy vulnerability scanning in deployment pipelines. |
| H128 | P0 | unverified | Backend security lead | Identity and access / 3 | \| 1 \| `admin` \| Delivery, Service, Repo, Models \| PostgreSQL (`pgxpool`) \| ⚠️ Unwired in `main.go` \| 🔴 **P0 RBAC Bypass** \| Handlers have `RequirePermission` helper, but `routes.go` does not enforce it \| |
| H129 | P0 | unverified | Backend security lead | Identity and access / 3 | \| 8 \| `backup` \| Delivery, Service, Repo, Models \| PostgreSQL (`pgxpool`) \| ⚠️ Unwired in `main.go` \| 🔴 **P0 RBAC Bypass** \| Admin backup export uses `AuthRequired()` only \| |
| H130 | P0 | unverified | Backend security lead | Identity and access / 3 | \| 9 \| `billing` \| Delivery, Service, Repo, Models \| PostgreSQL (`pgxpool`) \| ⚠️ Unwired in `main.go` \| 🔴 **P0 No Auth** \| Billing routes lack any auth middleware \| |
| H131 | P0 | unverified | Backend security lead | Identity and access / 3 | \| 18\| `data_operations`\| Delivery, Service, Repo, Models \| PostgreSQL (`pgxpool`) \| ⚠️ Unwired in `main.go` \| 🔴 **P0 RBAC Bypass** \| Bulk export/import uses `AuthRequired()` only \| |
| H132 | P0 | unverified | Backend privacy lead | Privacy and data lifecycle / 7 | \| 31\| `legal` \| Delivery, Service, Repo, Models \| PostgreSQL (`pgxpool`) \| ⚠️ Unwired in `main.go` \| 🔴 **P0 RBAC Bypass** \| Admin legal settings lack role check \| |
| H133 | P0 | unverified | Backend security lead | Identity and access / 3 | \| 52\| `support` \| Delivery, Service, Repo, Models \| PostgreSQL (`pgxpool`) \| ⚠️ Unwired in `main.go` \| 🔴 **P0 RBAC Bypass** \| Admin ticket management lacks role check \| |
| H134 | P0 | unverified | Backend security lead | Identity and access / 3 | \| 53\| `system_health`\| Delivery, Service, Repo, Models \| PostgreSQL (`pgxpool`) \| ⚠️ Unwired in `main.go` \| 🔴 **P0 RBAC Bypass** \| Admin diagnostics lack role check \| |
| H135 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Mentorship Identity Spoofing**: `mentorship_handler.go` allows client header `X-User-ID` to override auth context. |
| H136 | untriaged | unverified | Domain engineering lead | Full-platform domain acceptance / 10 | **Mentorship Router Nil Dereference**: `router.go` unconditionally calls `mentorshipHttp.RegisterRoutes` with nil handler. |
| H137 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Trust & Safety Admin RBAC Bypass**: `RegisterAdminSafetyRoutes` lacks role enforcement. |
| H138 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Core Admin Module RBAC Bypass**: `adminHttp.RegisterRoutes` lacks role enforcement. |
| H139 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Profile Admin Endpoint IDOR / RBAC Bypass**: `/admin/users/:id/profile` lacks role enforcement. |
| H140 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Unauthenticated Billing Module**: `/api/v1/billing/*` and `/api/v1/admin/billing/*` lack auth guards. |
| H141 | untriaged | unverified | Domain engineering lead | Full-platform domain acceptance / 10 | **Trust & Safety Route Omission Bug**: Type assertion mismatch prevents trust & safety routes from mounting. |
| H142 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Missing Password Reset Lifecycle**: `/auth/forgot-password` and `/auth/reset-password` endpoints and frontend pages missing. |
| H143 | untriaged | unverified | Domain engineering lead | Full-platform domain acceptance / 10 | **14 Ephemeral Mock Repositories**: Verification, Endorsement, Referral, Career AI, Companion, Marketplace, Mobile, etc., running in memory. |
| H144 | untriaged | unverified | Backend security lead | Identity and access / 3 | **Frontend `MOCK_USER_ID` Hardcoding**: 20+ feature API clients inject static mock user ID rather than session JWT. |
| H145 | untriaged | unverified | Frontend experience lead | Public experience and communications / 8 | **Frontend Route Duplication**: 7 duplicate route clusters causing UX fragmentation. |
| H146 | untriaged | unverified | Backend privacy lead | Privacy and data lifecycle / 7 | **Missing Top-Level `page.tsx` Files**: `/auth`, `/compliance`, `/employer`, `/enterprise`, `/recommendations`, `/settings` return 404. |
| H147 | untriaged | unverified | Platform and QA lead | Release evidence and operations / 2, 9 | **Single-Node WebSocket PubSub**: In-memory broker does not scale to multi-replica deployments. |
| H148 | untriaged | unverified | Frontend integration lead | API contracts / 5 | **Landing API Mock Fallback**: Masks backend outages with hardcoded mock data. |
| H149 | untriaged | unverified | Domain engineering lead | Full-platform domain acceptance / 10 | **Hardcoded UI Colors & Gradients**: Saturated gradients conflict with Apple calm palette. |
| H150 | untriaged | unverified | Domain engineering lead | Full-platform domain acceptance / 10 | **Duplicate Local Dark Mode States**: Page-level states desynchronize from global `ThemeProvider`. |
| H151 | untriaged | unverified | Frontend experience lead | Public experience and communications / 8 | **Bloated Monolithic Page Components**: `messaging/page.tsx` (990 lines) and `companies/[handle]/page.tsx` (635 lines). |
| H152 | untriaged | unverified | Platform and QA lead | Release evidence and operations / 2, 9 | **Zero Automated Playwright E2E Tests in CI**. |
| H153 | untriaged | unverified | Backend data lead | Persistence and migrations / 4 | **Duplicate Company Migrations**: Schema fragmentation across migrations 0011, 0043, 0052. |
| H154 | untriaged | unverified | Backend data lead | Persistence and migrations / 4 | **Missing `schema_migrations` Table**: `RunMigrations` executes 84 files sequentially on every server boot. |
| H155 | untriaged | unverified | Domain engineering lead | Full-platform domain acceptance / 10 | **Unused Imports & Dead Component Files**. |
| H156 | untriaged | unverified | Domain engineering lead | Full-platform domain acceptance / 10 | **Inconsistent Table Pagination Keys**. |
| H157 | untriaged | unverified | Backend security lead | Identity and access / 3 | *79 call sites across 31 modules** read the caller's identity from the gin context key `user_id`. Nothing sets that key: the authentication middleware publishes `userID`, holding a `uuid.UUID`. Every one of those reads therefore yields an empty value, and the handler falls through to a hardcoded or randomly generated UUID. |
| H159 | untriaged | unverified | Backend security lead | Identity and access / 3 | `analytics` has no authentication on 5 of its 6 route groups *and* a fallback identity, so every caller is served one synthetic user's metrics. |
| H160 | untriaged | unverified | Hiring domain lead | Hiring workflow / 6 | `interview` and `verification` fall back to `uuid.New()`, so they **write** rows attributed to a freshly invented user on every request — and since the persistence migration those rows survive restarts. |
| B01 | P1 | unverified | Platform and QA lead | Toolchain and release gates / 2 | Local npm shell launcher is broken |
| B02 | untriaged | unverified | Product owner | Scope and free-access commitments / 1, 10, 11 | Full-platform scope and monetization contradictions |
| B03 | untriaged | unverified | Mobile engineering lead | Mobile release acceptance / 10H | Native mobile authentication and release inventory need validation |
| B04 | P1 | unverified | Technical lead | Evidence governance / 1, 12 | Unavailable historical audit evidence |
| H161 | P2 | unverified | Domain engineering lead | Full-platform domain acceptance / 10 | Background worker for automatic DSR data package generation. |
| H162 | P3 | unverified | Domain engineering lead | Full-platform domain acceptance / 10 | Pre-signed URL generation for resume PDF uploads to S3/MinIO. |
| H163 | P2 | unverified | Backend data lead | Persistence and migrations / 4 | OpenSearch index synchronization on job creation. |
| H164 | P3 | unverified | Backend data lead | Persistence and migrations / 4 | Recruiter interview calendar ICS file generation. |
| H165 | P2 | unverified | Backend data lead | Persistence and migrations / 4 | OpenSearch read replica query routing. |
| H166 | P3 | unverified | Backend data lead | Persistence and migrations / 4 | Minor Swagger description tag refinements. |
| H167 | P2 | unverified | Domain engineering lead | Full-platform domain acceptance / 10 | Automated PDF generation for GDPR export files. |
| H168 | P3 | unverified | Domain engineering lead | Full-platform domain acceptance / 10 | S3 signed URLs for avatar/cover direct client uploads. |
| H169 | P2 | unverified | Backend data lead | Persistence and migrations / 4 | Automated spam heuristic scoring background worker. |
| H170 | P3 | unverified | Backend data lead | Persistence and migrations / 4 | Rich media attachment pre-signed URL generation. |

Each JSON row has source, acceptance, evidence classification and closure-evidence fields. No empty evidence array counts as PASS.

## Batch 5 outcomes — 8 September 2026

Evidence: [batch 5 delivery evidence](../BATCH5_DELIVERY_EVIDENCE_2026-09-08.md).
Closure here means the defect was reproduced against the running API, fixed, and
covered by a check that fails without the fix. Items whose scope is wider than
what was verified are recorded as partly addressed, not closed.

| Item | Outcome | Evidence |
|---|---|---|
| H143 (ephemeral repositories) | Already resolved before this batch; re-checked | `TestEveryMemoryOnlyRepositoryIsRegistered` reports no memory-only repository wired |
| H144 (frontend mock user IDs) | Partly addressed | The mentorship client's `MOCK_USER_ID` and its fixture set are gone; the security, admin and privacy clients no longer answer from samples. Hard-coded ids remain in some recruiter components |
| H145 (duplicate route clusters) | Partly addressed | `/messaging` and `/networking` API prefixes removed; the frontend page duplicates are deliberate redirects |
| H148 (landing API mock fallback) | Related surfaces closed | Nine pages and three console clients stopped substituting invented content on failure |
| H153 (duplicate company migrations) | Addressed for the diverging tables | Fifteen table names are defined twice; migration `0096` closes the ones whose columns diverge, and `TestRepositorySQLMatchesTheSchema` now fails on any new divergence |
| H120 (MFA/TOTP) | Persistence fixed, feature still incomplete | Enrolment wrote to non-existent columns and discarded the error; it now persists and propagates. The enrolment and challenge journey is still unverified end to end |
| H135 (mentorship identity spoofing) | Closed | `TestMentorshipIdentityCannotBeSpoofed` |
| H136 (mentorship router nil dereference) | Not reproducible | `RegisterRoutes` returns early on a nil handler |
| H141 (trust & safety route omission) | Not reproducible | The routes mount and answer; admin routes refuse non-admin callers |
| H146 (missing top-level pages) | Not reproducible | `/auth`, `/compliance`, `/employer`, `/enterprise`, `/recommendations` and `/settings` all resolve |
| H156 (inconsistent pagination keys) | Not addressed | Untouched by this batch |
| B03 (native mobile validation) | Not started | 10H was not attempted |

New items found by this batch and fixed in it — recorded so the register shows
what the probe exposed, not to imply they were known before:

| Item | What it was |
|---|---|
| B5-01 | 63 list endpoints answered `null` for an account with no rows; the network dashboard crashed on one |
| B5-02 | `networking_goals`, `connection_notes` and `connection_labels` were queried by the code and created by no migration |
| B5-03 | Creating a company answered 500 and created nothing: an owner-role insert omitted a primary key with no default |
| B5-04 | Every `/api/v1/employer/*` route answered "Invalid id"; the handlers read a company id from a path that has none |
| B5-05 | Recruiter job reads, status changes, pipelines, stage history and evaluations were not scoped to the owning recruiter |
| B5-06 | The recruiter pipeline, AI evaluation, job matches and team lists returned invented people and scores |
| B5-07 | The onboarding resume step returned an invented career, and the browser never called the server |
| B5-08 | 43 repository reads answered an empty table with seeded sample records, and swallowed query errors |
| B5-09 | Notification category preferences were rejected with 400 and never consulted at delivery |
| B5-10 | The security module wrote `privacy_preferences` and MFA rows to columns that do not exist, discarding the error |
