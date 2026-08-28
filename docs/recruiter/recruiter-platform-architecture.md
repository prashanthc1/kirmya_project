# Kirmya Recruiter Platform Architecture & Organization Hierarchy

## 1. Organization & Hiring Workspace Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Public Company Profile                   │
│       (Employer Branding, Verified Status, Active Jobs)     │
└──────────────────────────────┬──────────────────────────────┘
                               │ Associated
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Internal Hiring Organization                │
│    (Owner, Admins, Recruiters, Hiring Managers, Interviewers)│
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────┐             ┌───────────────────────┐
│     Jobs Ownership    │             │   Candidate Pipeline  │
│  (Draft, Active, ATS) │             │(Notes, Shortlist, RSVP)│
└───────────────────────┘             └───────────────────────┘
```
