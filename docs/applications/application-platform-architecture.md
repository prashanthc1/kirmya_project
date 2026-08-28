# Kirmya Application Platform Architecture & Hiring Lifecycle

## 1. End-to-End Application & ATS Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    Candidate Submission                     │
│      (Validation, Custom Questions, Resume & Cover Letter)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Transactional Persistence                  │
│       PostgreSQL Application Record & Outbox Event Bus      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Recruiter Hiring Pipeline                  │
│    Submitted ──► Under Review ──► Shortlisted ──► Interview │
│                                         │                   │
│                                         ▼                   │
│                              Offer ──► Hired / Rejected     │
└─────────────────────────────────────────────────────────────┘
```
