# Kirmya Application Lifecycle & Candidate Tracking (ATS) Manual

## 1. Application Stages & State Transitions
- **Submission**: Deduplicated via deterministic `IdempotencyKey` to prevent double submissions.
- **Review & Shortlisting**: Recruiters view candidate resumes and profiles without accessing unshared personal contacts.
- **Interview Scheduling**: Syncs candidate and interviewer calendars with instant notification triggers.
- **Decision & Hiring**: Updates candidate status and archives application history safely.
