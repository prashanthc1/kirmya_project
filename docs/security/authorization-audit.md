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
