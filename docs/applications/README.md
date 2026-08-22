# Kirmya Job Applications & ATS System Documentation

Welcome to the Candidate Application Management, Applicant Tracking System (ATS), Recruiter Screening, and Resume Security documentation for Kirmya.

## Documentation Index

- [`application-ats-audit.md`](application-ats-audit.md): Complete audit of ATS pipeline states, candidate submission flow, and internal note isolation.
- [`application-lifecycle.md`](application-lifecycle.md): Application eligibility checks, closed job protection, and duplicate prevention.
- [`ats-architecture.md`](ats-architecture.md): Domain entity models (`Application`, `ApplicationNote`, `ApplicationRating`, `ApplicationTimeline`).
- [`recruiter-workflow.md`](recruiter-workflow.md): Recruiter ATS console (`/recruiter/applications`), Kanban desk, and bulk operations.
- [`candidate-workflow.md`](candidate-workflow.md): Candidate dashboard (`/applications`) and application withdrawal workflows.
- [`application-privacy.md`](application-privacy.md): Internal recruiter notes shielding and interviewer feedback isolation.
- [`application-security.md`](application-security.md): Dual-ownership IDOR prevention and 15-minute expiring signed resume downloads.
- [`application-events.md`](application-events.md): NATS domain event routing and candidate/recruiter notification triggers.

## User & Recruiter ATS UI

- Candidate Applications Hub: `/applications`
- Candidate Detail Timeline: `/applications/:id`
- Recruiter ATS Console: `/recruiter/applications`
- Job-Specific Applicant Desk: `/recruiter/jobs/:jobId/applications`
