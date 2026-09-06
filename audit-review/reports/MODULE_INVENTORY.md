# Kirmya module inventory

**Audited commit:** `5f6790a95ae02d74666b668ab62e140d861424ec`  
**Purpose:** structural map and validation handoff for the repository audit dated 5 September 2026.

The backend is a modular Go monolith mounted below `/api/v1`; the frontend is a large Next.js App Router application. The 57 directories below are structural namespaces, not 57 separately deployed services. Automated screening covered every selected text file. Focused manual source inspection covered the runtime and documentation paths connected to the reported findings; this inventory does not mark every module functionally certified.

## Modules requiring release-blocking work

| Module or surface | Why it matters | Current audit result | Required proof |
|---|---|---|---|
| `applications` | Candidate conversion, documents, saved jobs and timeline | Ownership gap, dropped form fields, unsaved document registration, saved-job contract mismatch and hidden SQL errors | Two-user PostgreSQL HTTP tests plus apply/reload/recruiter journey |
| `legal` | Consent, privacy preferences, export and deletion requests | Several repository methods return success or synthetic records without persistence | Persist/restart/read-back tests, worker failure states and user isolation |
| Frontend API configuration | Connects every browser journey to the API | CI build base omits `/api/v1`; some reachable clients use localhost and a fixed UUID bearer | Production-artifact request inspection and authenticated smoke suite |
| Public landing content | First impression and trust | Unverified counters, testimonials and synthetic analytics are presented as measured outcomes | Replace with sourced, dated evidence or remove |
| Public jobs and SEO | Search acquisition | Job pages lack server metadata and JobPosting markup; sitemap omits job inventory | Initial-HTML, status, canonical, schema and Search Console validation |
| CI and security workflows | Release decision evidence | Frontend is red; database and browser coverage are incomplete; security failures are masked | Required green lint/test/build, real DB/browser job and blocking scans |

## Backend structural inventory

| Domain group | Directories found | Audit interpretation |
|---|---|---|
| Identity and access | `auth`, `onboarding`, `profile`, `organization`, `admin`, `security`, `verification` | Authentication has substantial middleware and SQL code. Reachable organization and verification frontend clients still bypass the shared authenticated client. |
| Candidate workflow | `applications`, `jobs`, `job_alerts`, `candidate_search`, `resume`, `resume_analysis`, `cover_letter`, `interview`, `interview_prep` | Core job and application paths exist, but the release-blocking contract, persistence and authorization issues in the main report affect the central conversion journey. |
| Recruiter and company | `company`, `recruiter`, `recruiter_ai`, `enterprise_hiring`, `workforce_intelligence` | Broad recruiter capability is present. Full candidate-to-recruiter browser validation with a real database remains outstanding. |
| Network and community | `networking`, `community`, `mentorship`, `endorsement`, `referral`, `messaging`, `notification`, `event` | Mentorship identity handling has improved. Realtime composition is still process-local, so multi-replica delivery needs a shared broker and catch-up test. |
| AI and recommendations | `ai`, `ai_job_match`, `career_ai`, `career_companion`, `recommendation`, `recommendation_engine`, `analytics` | Provider and fallback structure exists. Application analytics currently returns synthetic scores that must not be presented as personalized measurement. |
| Learning and work markets | `assessment`, `learning`, `freelance`, `global_marketplace` | SQL paths exist in several modules, but the audit did not certify their complete user journeys. Promote them only after focused contract and persistence tests. |
| Trust, compliance and operations | `legal`, `compliance`, `trust_safety`, `billing`, `backup`, `data_operations`, `media`, `support`, `system_health` | Billing and trust route guards improved compared with the old audit. Privacy persistence and recovery evidence remain material gaps. |
| Composition and shared code | `router`, `shared`, `common`, `docs`, `landing`, `mobile`, `native_mobile` | The modular-monolith approach is suitable. Production must fail closed when the database is unavailable; generated and mobile surfaces need their own release evidence. |

## Frontend surface inventory

The snapshot contains 394 `page.tsx` files and 940 TSX files. These counts show breadth rather than production readiness. The public acquisition path is the homepage, job search, job detail, company content and sharing metadata. The activation path is sign-up, profile/resume completion, saved jobs and application submission. The retention path is application status, recruiter response, alerts, recommendations, messaging and useful email/push notifications.

The most useful next testing slice is one instrumented golden journey: organic job landing → job detail → account creation → resume selection → application → recruiter stage update → candidate notification. It crosses the highest-value modules and provides a measurable funnel for both reliability and growth.

## Remaining validation scope

- Run migrations against disposable PostgreSQL and exercise every registered HTTP route with owned, foreign and missing records.
- Run the built frontend against that API with Playwright, including mobile widths, keyboard navigation and real status codes.
- Trace every non-shared API client and remove literal localhost URLs, mock identities and duplicate DTOs.
- Verify production environment variables, proxy rules, Redis use, storage signing, email delivery and observability.
- Reconcile performance, recovery, privacy and accessibility claims only after fresh measurements on the audited release candidate.
