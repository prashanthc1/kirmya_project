<!-- KIRMYA-AUDIT-RECONCILIATION-2026-09-05 -->
> **Current review addendum — 2026-09-05**
>
> Audited commit: `5f6790a95ae02d74666b668ab62e140d861424ec`. **Release verdict: HOLD for broad public launch; verified blockers remain.**
>
> This historical report is not re-certified for the current commit. Any original percentages, global PASS labels, absence-of-vulnerability claims, performance figures or restore timings require dated evidence before reuse. The current review is repository-wide automated screening plus focused source tracing and selected verification, not a complete manual review of every line.
>
> Relevant current findings: F01 (Application timeline omits candidate ownership); F03 (Candidate document registration returns 201 without saving); F04 (Application form drops contact edits and resume URL); F05 (Saved jobs use the wrong response shape); F13 (Job alert writes and several reads hide database errors); F14 (Application analytics present synthetic scores as personalized measurements); F17 (Job-specific apply alias validates the body before reading its path ID).
>
> Evidence and acceptance criteria: [current audit](../../audit-review/reports/KIRMYA_AUDIT_REPORT_2026-09-05.md). Original content below is retained as historical context, not current sign-off.

---

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
