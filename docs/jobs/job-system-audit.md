<!-- KIRMYA-AUDIT-RECONCILIATION-2026-09-05 -->
> **Current review addendum — 2026-09-05**
>
> Audited commit: `5f6790a95ae02d74666b668ab62e140d861424ec`. **Release verdict: HOLD for broad public launch; verified blockers remain.**
>
> This historical report is not re-certified for the current commit. Any original percentages, global PASS labels, absence-of-vulnerability claims, performance figures or restore timings require dated evidence before reuse. The current review is repository-wide automated screening plus focused source tracing and selected verification, not a complete manual review of every line.
>
> Relevant current findings: F04 (Application form drops contact edits and resume URL); F05 (Saved jobs use the wrong response shape); F10 (Search discovery is weakened by metadata and job indexing gaps); F17 (Job-specific apply alias validates the body before reading its path ID).
>
> Evidence and acceptance criteria: [current audit](../../audit-review/reports/KIRMYA_AUDIT_REPORT_2026-09-05.md). Original content below is retained as historical context, not current sign-off.

---

# Kirmya Job System & Recruiter Workflows Audit

## Executive Summary
This document provides a comprehensive audit of the Job Posting Engine, Recruiter Authorization, Organization Job Ownership, OpenSearch & PostgreSQL Search Fallback, Job Matching Algorithm, Saved Jobs, Job Alerts, Anti-Fraud Controls, and OpenTelemetry instrumentation for Kirmya.

---

## 1. Job Lifecycle & Status Machine

```
   [ Draft ] ──► (Publish Action) ──► [ Published ] ──► (Pause Action) ──► [ Paused ]
       │                                  │                                    │
       │                                  ▼                                    ▼
       └───► (Archive) ◄────────── [ Closed ] ◄────────────────────────────────┘
```

| Status State | Discovery Visibility | Applications Allowed | Recruiter Actions |
| :--- | :--- | :--- | :--- |
| `Draft` | Private (Owner Only) | No | Edit, Publish, Delete |
| `Published` | Public (OpenSearch/PG) | Yes | Edit, Pause, Close, Archive |
| `Paused` | Private (Owner Only) | No | Reopen, Close, Archive |
| `Closed` | Search Historical Only| No | Reopen, Archive |
| `Archived` | Hidden | No | Restore, Delete |

---

## 2. Organization Job Ownership & Recruiter Scoping

- **Server-Side Authority**: `organization_id` and `recruiter_id` parameters submitted by the client are ignored. The backend verifies the caller's JWT claims against `org_members` to ensure they are authorized to post or edit jobs for the target organization.
- **Closed Job Protection**: Applications targeting `Closed`, `Paused`, or `Archived` jobs are rejected server-side with `HTTP 409 Conflict` (`ErrJobNotAcceptingApplications`).
