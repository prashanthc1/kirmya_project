<!-- KIRMYA-AUDIT-RECONCILIATION-2026-09-05 -->
> **Current review addendum — 2026-09-05**
>
> Audited commit: `5f6790a95ae02d74666b668ab62e140d861424ec`. **Release verdict: HOLD for broad public launch; verified blockers remain.**
>
> This historical report is not re-certified for the current commit. Any original percentages, global PASS labels, absence-of-vulnerability claims, performance figures or restore timings require dated evidence before reuse. The current review is repository-wide automated screening plus focused source tracing and selected verification, not a complete manual review of every line.
>
> Relevant current findings: F20 (Audit scores and operational claims exceed their evidence).
>
> Evidence and acceptance criteria: [current audit](../../audit-review/reports/KIRMYA_AUDIT_REPORT_2026-09-05.md). Original content below is retained as historical context, not current sign-off.

---

# Kirmya Professional Discovery & Networking System Audit

## Executive Summary
This document provides a comprehensive audit of the People Search, OpenSearch indexing, PostgreSQL search fallback, Connection Graph management, "People You May Know" recommendations, Mutual Connection calculations, anti-scraping rate limits, and privacy controls for Kirmya.

---

## 1. Professional Discovery Architecture Overview

```
User Query (Name, Headline, Company, Industry, Skills)
      │
      ▼
Rate Limiter & Anti-Scraping Protection (60 Req/Min per User)
      │
      ▼
Privacy & Blocking Filter (Exclude non-searchable profiles & blocked users)
      │
      ├── (OpenSearch Available) ──► OpenSearch Cluster (Fuzzy Match & Ranking)
      │                                       │
      └── (OpenSearch Down/Disabled) ─────────┼──► PostgreSQL Fallback (ILIKE / TSVector)
                                              │
                                              ▼
                                    Connection Graph Hydration
                                    (Not Connected, Pending, Connected, Blocked)
                                              │
                                              ▼
                                    Response Envelope (DTO Masking Private Fields)
```

---

## 2. Connection Lifecycle & Graph States

| State | Trigger Action | Permitted Transitions | Privacy & Access Controls |
| :--- | :--- | :--- | :--- |
| `Not Connected` | Default relationship | `Pending` (Send Request) | Public profile fields visible |
| `Pending (Outgoing)`| User A sends request | `Withdrawn` / `Accepted` | Request pending badge; rate-limited |
| `Pending (Incoming)`| User B receives request| `Accepted` / `Declined` | Actions: Accept, Decline |
| `Connected` | User B accepts request | `Removed` / `Blocked` | Full connections access, direct messaging |
| `Blocked` | User A or B blocks | Unblocked | Excluded from search, suggestions & messages |
