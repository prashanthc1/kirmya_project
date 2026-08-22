# Kirmya Applicant Tracking System (ATS) Architecture

## 1. Domain Entities (`backend/internal/applications/models/applications.go`)
- `Application`: `ID`, `JobID`, `CandidateID`, `ResumeID`, `CoverLetterHTML` (Sanitized), `Status` (`applied`, `under_review`, `shortlisted`, `interview`, `offer`, `hired`, `rejected`, `withdrawn`), `AppliedAt`, `UpdatedAt`.
- `ApplicationNote`: `ID`, `ApplicationID`, `AuthorID`, `Content`, `CreatedAt` (Internal Recruiter Only).
- `ApplicationRating`: `ID`, `ApplicationID`, `RaterID`, `Rating` (1-5 Stars), `Evaluation` (Internal Recruiter Only).
- `ApplicationTimeline`: `ID`, `ApplicationID`, `EventType`, `ActorID`, `Description`, `IsCandidateVisible`, `CreatedAt`.
