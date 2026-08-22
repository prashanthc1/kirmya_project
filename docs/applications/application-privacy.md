# Kirmya Application Privacy & Recruiter Notes Isolation

## 1. Internal Recruiter Data Shielding
- **Internal Notes & Ratings**: Candidate applications support internal recruiter notes and 1-5 star ratings. These records are explicitly tagged `is_internal = true` and stripped from candidate-facing API payloads.
- **Interviewer Feedback**: Internal interview scorecards are visible ONLY to assigned recruiters and interviewers. Candidates see meeting details and instructions without internal feedback.
