<!-- KIRMYA-AUDIT-RECONCILIATION-2026-09-05 -->
> **Current review addendum — 2026-09-05**
>
> Audited commit: `5f6790a95ae02d74666b668ab62e140d861424ec`. **Release verdict: HOLD for broad public launch; verified blockers remain.**
>
> This historical report is not re-certified for the current commit. Any original percentages, global PASS labels, absence-of-vulnerability claims, performance figures or restore timings require dated evidence before reuse. The current review is repository-wide automated screening plus focused source tracing and selected verification, not a complete manual review of every line.
>
> Relevant current findings: F01 (Application timeline omits candidate ownership); F02 (Privacy and consent operations return success without persistence); F12 (Security workflow deliberately suppresses scan failures).
>
> Evidence and acceptance criteria: [current audit](../../audit-review/reports/KIRMYA_AUDIT_REPORT_2026-09-05.md). Original content below is retained as historical context, not current sign-off.

---

# Kirmya Access Control & RBAC Authorization Audit

## Executive Summary
This document provides a comprehensive audit of the Role-Based Access Control (RBAC), Attribute-Based Access Control (ABAC), Resource Ownership Verification, Tenant/Organization Isolation, IDOR/BOLA Mitigations, and Server-Side Authorization Enforcement for Kirmya.

---

## 1. Authentication vs Authorization Separation

- **Authentication**: "Who is the user?" (Handled by Bearer JWT & Session Middleware).
- **Authorization**: "Is the authenticated user permitted to perform action `A` on resource `R` in context `C`?" (Enforced in Service Layer & Database Query Scoping).

> [!IMPORTANT]
> Authentication status is NEVER treated as authorization permission. Every protected endpoint enforces explicit role or resource ownership checks on the server.

---

## 2. Authorization Hierarchy & Role Audit

| Role Category | Role Name | System Scope | Default Permission Level |
| :--- | :--- | :--- | :--- |
| **System Roles** | `Super Admin` | Platform-Wide | Full administrative & SOC controls |
| | `Platform Admin` | Platform-Wide | User, job, & system health management |
| | `Trust & Safety Admin` | Platform-Wide | Moderation, report resolution, bans |
| | `Support Admin` | Platform-Wide | Support impersonation (audited, 15m TTL) |
| **Business Roles**| `Recruiter` | Organization-Scoped | Job creation, applicant management, talent search |
| | `Job Seeker` | User-Scoped | Profile management, job search, applications |
| **Tenant Roles** | `Org Owner / Admin` | Organization-Scoped | Member invite, billing, job management |
| | `Org Member` | Organization-Scoped | View internal team jobs & applicants |
| **Community Roles**| `Community Owner/Admin` | Community-Scoped | Settings, member bans, post pinning/locking |
| | `Community Moderator` | Community-Scoped | Flagged post removal, member warning |
| | `Community Member` | Community-Scoped | Discussion posting, comment, event RSVP |
