# Kirmya Employer & Company Recruitment Management — Architecture & Operational Guide

## Overview

The **Employer & Company Recruitment Management** module provides organizations, hiring managers, and recruiters with a centralized, privacy-first, enterprise-grade recruitment portal on Kirmya. It handles company profile branding, team administration, fine-grained RBAC, recruiter invitations, job ownership, candidate pipeline review, interview coordination, recruitment settings, analytics, audit logging, and data exports.

Kirmya is 100% free for candidates and employers. No subscription or payment features are present.

```
Frontend (Next.js + MUI v6)                      Backend (Go 1.26 + Gin)
┌─────────────────────────────────┐              ┌─────────────────────────────────────┐
│  /employer/dashboard            │─── HTTP ────▶│  ManagementHandler (delivery/http)  │
│  /employer/company              │              │         │                           │
│  /employer/jobs                 │              │  ManagementService (service)        │
│  /employer/applications         │              │         │                           │
│  /employer/candidates           │              │  ManagementRepository (repo)        │
│  /employer/interviews           │              │         │                           │
│  /employer/team                 │              │  PostgreSQL (pgxpool)               │
│  /employer/settings             │              │  OpenSearch (search integration)    │
└─────────────────────────────────┘              └─────────────────────────────────────┘
```

---

## Key Features & Functional Modules

### 1. Central Employer Portal (`/employer/dashboard`)
Command center for organization hiring activity:
- Overview KPI widgets: Active Jobs, Draft Jobs, Total Applicants, Candidates Requiring Review, Upcoming Interviews, Hires, Followers.
- Hiring Pipeline Funnel: Visual stage breakdown (`Applied` → `Viewed` → `Shortlisted` → `Interview` → `Offer` → `Accepted`).
- Recruiter Activity Summary: Throughput, jobs posted, reviews completed, interviews conducted per recruiter.
- Company Profile Completion Meter: Visual progress tracker with quick-action items.

### 2. Company Profile & Branding (`/employer/company` & `/company/[slug]`)
- Organization metadata: Legal name, slug/handle, logo URL, cover URL, tagline, industry, company size, founded year, website, headquarters.
- Public page vs Private data: Public company page (`/company/[slug]`) displays branding, active jobs, and public info. Internal notes, team member emails, and applicant analytics are strictly hidden from unauthenticated viewers.
- Verification Workflow: `Unverified`, `Pending`, `Verified`, `Rejected`, `Suspended`. Verified status unlocks official organization badge.

### 3. Recruiter Team & RBAC Management (`/employer/team`)
Fine-grained company-scoped Role-Based Access Control (RBAC):
- **Roles**:
  - `company_owner`: Full administrative rights including ownership transfer and company deletion.
  - `org_admin`: Organization administration except ownership transfer.
  - `recruiter_admin`: Recruiting team management, job approvals, candidate pipeline access.
  - `hiring_manager`: Owns requisitions, reviews applicants, conducts interviews.
  - `recruiter`: Manages candidates on assigned jobs.
  - `employee`: Approved employee association with public profile badge.
  - `viewer`: Read-only reporting access.
- **Owner Protection & Transfer**: Prevents accidental deletion of sole company owner. Requires explicit ownership transfer modal to assign a new owner.
- **Invitations**: Single-use cryptographically secure invitation tokens with 14-day expiry. Support for invite creation, resending, and revocation.

### 4. Job Management & Ownership (`/employer/jobs`)
- Full job lifecycle management: Create, edit, publish, pause, close, archive jobs.
- Recruiter assignment: Primary recruiter, hiring manager, recruitment team. Server-side authorization ensures recruiters only manage authorized jobs.

### 5. Candidate Experience & Application Review (`/employer/applications` & `/employer/candidates`)
- Direct integration with ATS pipeline.
- Private Recruiter Notes vs Candidate-Visible Information: Internal recruiter notes and evaluations are strictly segregated from candidate view.
- Interview Coordination (`/employer/interviews`): Assign interviewers, schedule virtual meeting links, track attendance.

### 6. Company Recruitment Settings (`/employer/settings`)
- Application notification behavior (New application, Candidate message, Interview reminders).
- Auto-acknowledgement message configuration.
- Default pipeline template & candidate visibility mode.
- Audit-logged company data export.

---

## Security, Privacy & Compliance

- **Organization Data Isolation**: Every SQL query and API check parameterizes `company_id = $1`. Company A cannot inspect Company B's jobs, applicants, notes, or recruiters.
- **IDOR Protection**: Server-side authorization verifies user membership and permissions for all company resources (`company_id`, `job_id`, `application_id`, `candidate_id`, `member_id`, `invitation_id`).
- **Audit Logging**: Sensitive actions (`company.created`, `role.changed`, `recruiter.invited`, `member.removed`, `ownership.transferred`, `data.exported`) write immutable audit entries.

---

## API Endpoints

### Employer Portal API (`/api/v1/employer/...`)
| Method | Route | Description | Permission Required |
|--------|-------|-------------|---------------------|
| `GET` | `/api/v1/employer/dashboard` | Get dashboard KPIs & funnel | `analytics:view` |
| `GET` | `/api/v1/employer/company` | Get employer company profile | `company:view` |
| `PUT` | `/api/v1/employer/company` | Update company profile & branding | `company:edit` |
| `GET` | `/api/v1/employer/team` | List recruiter team & permissions | `team:view` |
| `POST` | `/api/v1/employer/team/invite` | Invite recruiter or team member | `team:invite` |
| `POST` | `/api/v1/employer/team/invitations/:id/resend` | Resend invitation email | `team:invite` |
| `DELETE` | `/api/v1/employer/team/members/:id` | Remove recruiter / team member | `team:manage` |
| `PUT` | `/api/v1/employer/team/members/:id` | Update member role / status | `team:manage` |
| `POST` | `/api/v1/employer/team/transfer-ownership` | Transfer company ownership | Owner only |
| `GET` | `/api/v1/employer/jobs` | Get company jobs | `job:view` |
| `GET` | `/api/v1/employer/analytics` | Get aggregate recruitment analytics | `analytics:view` |
| `GET` | `/api/v1/employer/settings` | Get company recruitment settings | `settings:edit` |
| `PUT` | `/api/v1/employer/settings` | Update recruitment settings | `settings:edit` |
| `POST` | `/api/v1/employer/export` | Request company data export | `company:edit` |
