# Kirmya Job Applications & ATS System Audit

## Executive Summary
This document provides a comprehensive audit of the Candidate Job Application Submission, Applicant Tracking System (ATS) Pipeline, Recruiter Screening, Internal Notes & Ratings Privacy, Secure Resume Access, Kanban Board UI, Audit Logging, and Cross-Organization Isolation for Kirmya.

---

## 1. Application Lifecycle & ATS Pipeline States

```
[ Applied ] ──► [ Under Review ] ──► [ Shortlisted ] ──► [ Interview ] ──► [ Offer ] ──► [ Hired ]
     │                │                    │                   │               │
     └────────────────┴────────────────────┴───────────────────┴───────────────┴──► [ Rejected ]
                                                                                       ▲
                                                                     (By Candidate) ───┼──► [ Withdrawn ]
```

| Application Stage | Permitted Transition Actions | Candidate Visibility | Recruiter Actions |
| :--- | :--- | :--- | :--- |
| `Applied` | Move to `Under Review`, `Rejected`, `Withdrawn` | Status: "Submitted" | Review resume, cover letter |
| `Under Review` | Move to `Shortlisted`, `Rejected` | Status: "Under Review" | Add internal note, rate candidate |
| `Shortlisted` | Move to `Interview`, `Assessment`, `Rejected` | Status: "Shortlisted" | Schedule interview |
| `Interview` | Move to `Assessment`, `Offer`, `Rejected` | Status: "Interview" | Submit interviewer feedback |
| `Offer` | Move to `Hired`, `Rejected`, `Withdrawn` | Status: "Offer Extended" | Extend offer details |
| `Hired` / `Rejected` | Final States (Archived) | Status: "Closed" | Archive application |
| `Withdrawn` | Final State (Candidate Action) | Status: "Withdrawn" | Retain historical record |
