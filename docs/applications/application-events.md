# Kirmya Application Events & Notification Dispatch

## Domain Events & Transports

| Event Name | Trigger Condition | Recipient | Notification Channel |
| :--- | :--- | :--- | :--- |
| `application.submitted` | Candidate submits application | Hiring Recruiter | In-App & Email Alert |
| `application.stage_changed` | Recruiter moves candidate stage | Candidate | In-App Notification |
| `application.interview_scheduled` | Recruiter schedules interview | Candidate & Recruiter | Calendar Invite + In-App |
| `application.withdrawn` | Candidate withdraws application | Hiring Recruiter | In-App Update |
