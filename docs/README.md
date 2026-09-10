# Kirmya Documentation Hub

Welcome to the comprehensive documentation directory for the Kirmya AI Career Companion and Talent Platform.

---

## 🏛️ System Architecture & Engineering

- [**Implementation & Verification Walkthrough**](walkthrough.md): Full platform implementation status, subsystem breakdown, and latest test verification metrics.
- [**Backend Architecture Guide**](backend-architecture.md): Modular Monolith design, Gin HTTP handlers, domain service layer, and fail-closed persistence.
- [**Single Identity, Multiple Workspaces**](architecture/26-workspace-architecture.md): one account, many capabilities and scoped memberships, and the workspace model that lets a person move between Professional, Freelancing, Recruiting, company, community and platform administration without logging out. Decision: [ADR 0002](decisions/0002-single-identity-multi-workspace-access.md).
- [**REST API & OpenAPI 3.0 Contract**](api.md): Endpoint standards, standardized error format, authentication requirements, and Swagger UI.
- [**Frontend Architecture & Styling**](frontend/): styling decisions (MUI, theme tokens, `sx`, CSS Modules — and where each fits), accessibility standards (WCAG AA), and API client centralization. Styling starts at [styling-and-ui-decisions.md](frontend/styling-and-ui-decisions.md).
- [**System Health & Diagnostics**](system-health-diagnostics.md): Health probe contracts (`/health/live`, `/health/ready`, `/health/dependencies`) and telemetry.

---

## 🗄️ Database & Schema Management

- [**Database Schema & Architecture Guide**](database.md): PostgreSQL 16 schema, 98 migrations, advisory locking, composite indexes, and concurrency.
- [**Database Schema & ER Diagram**](database_schema_and_er_diagram.md): Entity-relationship diagrams and table relationships.
- [**Data Governance & Privacy**](data-governance.md): Retention policies, legal hold enforcement, and cascade anonymization.
- [**Data Import & Export**](data-import-export.md): Asynchronous bulk data processing and export workers.

---

## 🎯 Core Domains & Product Features

### Hiring & Recruitment
- [**Candidate Experience & ATS**](candidate-experience.md): Candidate profile, resume management, and application workflows.
- [**Recruiter Operations**](recruiter.md): Recruiter workspaces, talent pools, candidate search, and scorecards.
- [**Employer Management**](employer-management.md): Company profiles, team permissions, and job lifecycle management.
- [**Jobs & Discovery**](jobs.md): Job search, filters, server-rendered SEO, and JSON-LD schema.
- [**Interviews & Scheduling**](interviews.md): Conflict-locked, timezone-aware interview scheduling and feedback.

### Community & Social
- [**Communities & Knowledge Collaboration**](communities.md): Public and private groups, discussions, pinned posts, and content moderation.
- [**Networking & Professional Relationships**](networking.md): Connection requests, private notes, labels, and networking goals.
- [**Mentorship System**](mentorship.md): Mentor profiles, session bookings, and collaborative goal tracking.
- [**Real-Time Messaging**](messaging.md): WebSocket and Redis pub/sub chat delivery, message history, and presence.

---

## 🔒 Security, Privacy & Compliance

- [**Security & Identity Architecture**](security.md): JWT tokens, refresh rotation, Bcrypt password hashing, and MFA TOTP.
- [**Security Hardening Protocol**](security-hardening.md): Threat mitigation, SQL injection prevention, and HTTP security headers.
- [**Privacy & GDPR/CCPA Compliance**](privacy.md): User consent history, DSR data export and deletion lifecycles.
- [**Trust & Safety Center**](trust-safety.md): Report handling, moderation queues, appeals desk, and automated policy studio.

---

## 🛠️ Operations & DevOps

- [**Production Deployment Guide**](production_deployment_guide.md): Containerization, environment variable configurations, and deployment topologies.
- [**Environment Variables Guide**](environment_variables_guide.md): Canonical reference for backend and frontend environment configuration.
- [**Disaster Recovery & Business Continuity**](disaster-recovery.md): PostgreSQL backup strategies, PITR restoration, and recovery objectives.
- [**Incident Response Runbook**](incident_response_guide.md): Operational triage procedures, severity levels, and communication channels.
- [**Step 9 Readiness Evidence**](operations/step9-readiness-evidence-2026-09-08.md): Verified measurements for dependency probes, load benchmarks, and fail-closed readiness.

---

## 📋 Delivery Batches & Audit History

- [**Project Completion Plan (September 2026)**](PROJECT_COMPLETION_PLAN_2026-09-06.md): 12-step remediation roadmap, finding registers, and milestone exit gates.
- [**Batch 5 Delivery Evidence (8 Sep 2026)**](BATCH5_DELIVERY_EVIDENCE_2026-09-08.md): List contract repairs (`httpx.JSONList`), migration 0096, sample-data elimination, and recruiter ownership scoping.
- [**Batch 4 Delivery Evidence (8 Sep 2026)**](PROJECT_COMPLETION_PLAN_2026-09-06.md#batch-4--steps-8-and-9): SEO server-rendering, accessibility contrast, Redis broker, and deadlock remediation (2,810 req/s).
- [**Batch 3 Delivery Evidence (7 Sep 2026)**](BATCH3_DELIVERY_EVIDENCE_2026-09-07.md): Candidate document persistence, application snapshots, and privacy workers.
- [**Batch 2 Delivery Evidence (7 Sep 2026)**](BATCH2_DELIVERY_EVIDENCE_2026-09-07.md): Identity verification, fail-closed database guards, and API client consolidation.
- [**Step 2 Delivery Evidence (7 Sep 2026)**](STEP2_DELIVERY_EVIDENCE_2026-09-06.md): Fail-closed CI test harness and isolated PostgreSQL/Redis integration.
- [**Project Baseline (6 Sep 2026)**](project-baseline-2026-09-06/README.md): Baseline capture, issue register, and module matrix.
- [**Master Audit Report**](../KIRMYA_MASTER_AUDIT_REPORT.md): Historical master audit analysis and finding inventory.
