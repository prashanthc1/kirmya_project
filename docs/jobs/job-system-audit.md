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
