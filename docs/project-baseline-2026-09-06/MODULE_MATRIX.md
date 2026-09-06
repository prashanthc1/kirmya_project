# Core beta and full-platform module matrix

Detailed [module-matrix.json](module-matrix.json) maps services, repository SQL table candidates, provider markers, authorization markers, web pages and existing tests. [inventories.json](inventories.json) lists every page file, golden API route, parsed API declaration and migration. Structural matches are candidates, not proof of routing, permissions, live tables or provider configuration. Empty mappings mean unverified, not unnecessary.

Core beta is the hiring loop and its required access/privacy/operations foundations. Core membership does not release every module feature: advanced admin, organization and security screens remain gated. All existing domains and the native client remain in the full-platform inventory; disabled/deferred features never count as complete.

| Module | Scope | Owner | Status | Page files | Declared API operations | Existing local tests |
|---|---|---|---|---|---|---|
| admin | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 137 | 50 | 3 |
| ai | full-platform expansion | Domain engineering lead | unverified | 0 | 7 | 1 |
| ai_job_match | full-platform expansion | Domain engineering lead | unverified | 0 | 3 | 1 |
| analytics | full-platform expansion | Domain engineering lead | unverified | 8 | 52 | 1 |
| applications | core-beta foundation or required hiring workflow | Hiring domain lead | open | 3 | 17 | 1 |
| assessment | full-platform expansion | Domain engineering lead | unverified | 1 | 5 | 0 |
| auth | core-beta foundation or required hiring workflow | Backend security lead | unverified | 12 | 10 | 5 |
| backup | core-beta foundation or required hiring workflow | Platform and QA lead | unverified | 0 | 13 | 1 |
| billing | full-platform expansion | Domain engineering lead | unverified | 5 | 9 | 3 |
| candidate_search | core-beta foundation or required hiring workflow | Frontend experience lead | unverified | 0 | 8 | 1 |
| career_ai | full-platform expansion | Domain engineering lead | unverified | 1 | 7 | 0 |
| career_companion | full-platform expansion | Domain engineering lead | unverified | 1 | 6 | 0 |
| common | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 0 | 0 | 0 |
| community | full-platform expansion | Domain engineering lead | unverified | 8 | 29 | 2 |
| company | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 25 | 83 | 9 |
| compliance | core-beta foundation or required hiring workflow | Backend privacy lead | unverified | 2 | 29 | 2 |
| cover_letter | full-platform expansion | Domain engineering lead | unverified | 0 | 17 | 1 |
| data_operations | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 0 | 11 | 1 |
| docs | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 0 | 0 | 0 |
| endorsement | full-platform expansion | Domain engineering lead | unverified | 0 | 7 | 0 |
| enterprise_hiring | full-platform expansion | Domain engineering lead | unverified | 2 | 6 | 1 |
| event | full-platform expansion | Domain engineering lead | unverified | 0 | 6 | 0 |
| freelance | full-platform expansion | Domain engineering lead | unverified | 1 | 8 | 0 |
| global_marketplace | full-platform expansion | Domain engineering lead | unverified | 0 | 4 | 0 |
| interview | core-beta foundation or required hiring workflow | Hiring domain lead | unverified | 1 | 11 | 1 |
| interview_prep | full-platform expansion | Hiring domain lead | unverified | 0 | 23 | 1 |
| job_alerts | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 0 | 15 | 0 |
| jobs | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 5 | 2 | 1 |
| landing | core-beta foundation or required hiring workflow | Frontend experience lead | unverified | 34 | 3 | 0 |
| learning | full-platform expansion | Domain engineering lead | unverified | 1 | 8 | 0 |
| legal | core-beta foundation or required hiring workflow | Backend privacy lead | open | 18 | 32 | 1 |
| media | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 0 | 7 | 2 |
| mentorship | full-platform expansion | Domain engineering lead | unverified | 4 | 18 | 2 |
| messaging | full-platform expansion | Frontend experience lead | open | 5 | 23 | 2 |
| mobile | full-platform expansion | Domain engineering lead | unverified | 0 | 4 | 0 |
| native_mobile | full-platform expansion | Domain engineering lead | unverified | 0 | 8 | 0 |
| networking | full-platform expansion | Frontend experience lead | unverified | 8 | 39 | 2 |
| notification | core-beta foundation or required hiring workflow | Frontend experience lead | unverified | 9 | 49 | 2 |
| onboarding | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 8 | 26 | 2 |
| organization | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 1 | 5 | 0 |
| profile | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 6 | 63 | 2 |
| recommendation | full-platform expansion | Domain engineering lead | unverified | 0 | 8 | 1 |
| recommendation_engine | full-platform expansion | Domain engineering lead | unverified | 0 | 8 | 0 |
| recruiter | core-beta foundation or required hiring workflow | Hiring domain lead | unverified | 35 | 51 | 1 |
| recruiter_ai | full-platform expansion | Hiring domain lead | unverified | 0 | 5 | 0 |
| referral | full-platform expansion | Domain engineering lead | unverified | 1 | 5 | 0 |
| resume | core-beta foundation or required hiring workflow | Hiring domain lead | unverified | 1 | 18 | 1 |
| resume_analysis | full-platform expansion | Hiring domain lead | unverified | 1 | 3 | 0 |
| router | core-beta foundation or required hiring workflow | Domain engineering lead | open | 0 | 7 | 7 |
| search | full-platform expansion | Frontend experience lead | unverified | 1 | 7 | 3 |
| security | core-beta foundation or required hiring workflow | Backend security lead | unverified | 23 | 38 | 2 |
| shared | core-beta foundation or required hiring workflow | Domain engineering lead | open | 0 | 5 | 13 |
| support | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 6 | 31 | 1 |
| system_health | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 0 | 11 | 1 |
| trust_safety | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 8 | 53 | 2 |
| verification | core-beta foundation or required hiring workflow | Domain engineering lead | unverified | 1 | 5 | 0 |
| workforce_intelligence | full-platform expansion | Domain engineering lead | unverified | 0 | 4 | 0 |
| web-shell | core-beta cross-cutting plus unclassified routes | Frontend experience lead | unverified | 12 | 0 | 56 |
| native-client | full-platform expansion | Mobile engineering lead | unverified | 0 | 1 | 0 |
