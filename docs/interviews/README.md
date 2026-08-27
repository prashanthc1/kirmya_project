# Kirmya Interview Management & Scheduling Documentation Hub

Welcome to the Interview Scheduling, Scorecards, Assessment Tracking, and Privacy-Shielded Hiring Workflows documentation for Kirmya.

## Documentation Index

- [`interview-system-audit.md`](interview-system-audit.md): Complete audit of interview entities, candidate workflows, and scorecard privacy.
- [`interview-architecture.md`](interview-architecture.md): Entity relationships, REST API endpoints, and participant role definitions.
- [`interview-lifecycle.md`](interview-lifecycle.md): State transitions (`Scheduled`, `Confirmed`, `Completed`, `Cancelled`), and ATS synchronization.
- [`scorecards-and-feedback.md`](scorecards-and-feedback.md): 5-category evaluation criteria, scoring rubrics, and recruiter feedback shielding.
- [`timezone-and-scheduling.md`](timezone-and-scheduling.md): UTC normalization, IANA time-zone rendering, and SQL range conflict detection.
- [`interview-privacy-security.md`](interview-privacy-security.md): Meeting link authorization, notification privacy, and dual-ownership IDOR prevention.

## User & Recruiter Interview UI

- Candidate Interviews Hub: `/applications/[id]/interviews`
- Recruiter Interview Dashboard: `/recruiter/interviews`
- Interview Evaluation Desk: `/recruiter/interviews/[id]/scorecard`
