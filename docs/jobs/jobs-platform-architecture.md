# Kirmya Jobs Marketplace & Recruitment Platform Architecture

## 1. Multi-Tier Recruitment Architecture & Lifecycles

```
┌─────────────────────────────────────────────────────────────┐
│                    Candidate Discovery                      │
│      Semantic Search (OpenSearch + PostgreSQL Fallback)     │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
     ┌──────────────────┐           ┌──────────────────┐
     │  Job Application │           │  Saved Searches  │
     │  Tracking (ATS)  │           │   & Job Alerts   │
     └─────────┬────────┘           └──────────────────┘
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
