# Kirmya Interview Scheduling & Assessment System Audit

## Executive Summary
This document audits the interview scheduling domain entities, candidate and recruiter workflows, time-zone conversion standards, scorecards and evaluation frameworks, calendar synchronization pipelines, and feedback privacy shielding in Kirmya.

---

## 1. Interview Data Architecture

```
                 Job Application (`applications`)
                                │
                                ▼
                   Interview Stage (`interviews`)
                    ├── Interview Participants (`interview_participants`)
                    ├── Interviewer Scorecards (`interview_scorecards`)
                    ├── Structured Evaluations (`interview_evaluations`)
                    ├── Meeting Access Tokens (`interview_meetings`)
                    └── Candidate Availability Slots (`interview_availability`)
```

---

## 2. Security & Privacy Safeguards
- **Dual-Ownership Authorization**: Candidates can only view interviews scheduled for their own applications (`candidate_id = caller_id`); recruiters access interviews strictly through verified organization job ownership (`recruiter_org_id = job_org_id`).
- **Internal Scorecard & Feedback Shielding**: Reviewer ratings, notes, and hire/no-hire recommendations are strictly internal and never exposed to candidate-facing endpoints or notifications.
- **Meeting Link Security**: Meeting URLs are served only to verified participants within a 30-minute window of the scheduled start time.
