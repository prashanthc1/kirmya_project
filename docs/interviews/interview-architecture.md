# Kirmya Interview Architecture & API Specifications

## 1. Domain Entities & Relationships
- **`Interview`**: Main scheduling record containing `ApplicationID`, `JobID`, `CandidateID`, `InterviewType`, `Stage`, `StartTime`, `EndTime`, `TimeZone`, `Status`, `MeetingUrl`.
- **`InterviewParticipant`**: Recruiter/panel members assigned to conduct the session (`InterviewID`, `InterviewerID`, `RoleName`).
- **`InterviewScorecard`**: Evaluation criteria and numerical/rubric ratings (`Competency`, `Score`, `Comments`, `Recommendation`).

---

## 2. Key API Endpoints

| Method | Endpoint | Description | Scope |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/recruiter/interviews` | Schedule new interview from application | Recruiter |
| `PATCH`| `/api/v1/recruiter/interviews/:id` | Reschedule, reassign, or cancel interview | Recruiter |
| `POST` | `/api/v1/recruiter/interviews/:id/feedback` | Submit interviewer scorecard feedback | Interviewer |
| `GET` | `/api/v1/applications/:id/interviews` | Candidate view of scheduled interviews | Candidate |
| `POST` | `/api/v1/interviews/:id/confirm` | Candidate attendance confirmation | Candidate |
