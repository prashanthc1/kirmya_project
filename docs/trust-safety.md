# Kirmya Trust, Safety & Moderation — Architecture & Operational Guide

## Overview

The **Trust, Safety & Moderation** module protects users, recruiters, companies, communities, jobs, messages, and the platform from abuse, fraud, harassment, spam, malicious content, fake accounts, and suspicious recruitment activity while preserving privacy, fairness, transparency, and legitimate user activity.

Kirmya is 100% free for candidates and employers. No subscription or payment features are present.

```
Frontend (Next.js + MUI v6)                      Backend (Go 1.26 + Gin)
┌─────────────────────────────────┐              ┌─────────────────────────────────────┐
│  /safety                        │─── HTTP ────▶│  TrustSafetyHandler (delivery/http) │
│  /safety/reports                │              │         │                           │
│  /safety/blocked                │              │  TrustSafetyService (service)       │
│  /safety/appeals                │              │         │                           │
│  /safety/restricted             │              │  TrustSafetyRepository (repo)       │
│  /admin/trust-safety            │              │         │                           │
│  /admin/trust-safety/moderation │              │  PostgreSQL (pgxpool)               │
│  /admin/trust-safety/appeals    │              │  OpenSearch (search integration)    │
└─────────────────────────────────┘              └─────────────────────────────────────┘
```

---

## Key Features & Functional Modules

### 1. User Safety Center (`/safety`)
The candidate and recruiter self-service trust hub:
- **Active Restrictions Banner**: Transparently informs users of temporary restrictions (`messaging`, `community`, `job_posting`, `application`), reason, duration, and appeal link.
- **Reporting System** (`/safety/report` & `ReportDialog`): Allows reporting users, profiles, companies, jobs, messages, communities, and comments. Supports HTML sanitization, description length validation, evidence URL attachments, and reporter privacy notice.
- **Report Tracker** (`/safety/reports`): Displays status (`submitted`, `under_review`, `action_taken`, `dismissed`, `resolved`) without exposing internal moderator notes or reporter details.
- **Blocked Entities Manager** (`/safety/blocked`): Allows non-intrusive, non-notifying blocking of users and companies. Block lists remain strictly private to the user.
- **Appeals Submission** (`/safety/appeals`): Enables users to appeal moderation decisions by providing context and counter-evidence.

### 2. Executive Moderation Console (`/admin/trust-safety`)
Command center for authorized moderators (`trust_safety.*` permissions):
- **Summary Metrics**: Open Reports, High Risk Cases, Pending Appeals, User Blocks, Content Removals, Account Suspensions.
- **Moderation Queue** (`/admin/trust-safety/moderation`): Filterable queue displaying risk score badges (`low`, `normal`, `high`, `critical`), entity target, category, assigned moderator, case claim/assign actions, and enforcement modal.
- **Appeals Manager** (`/admin/trust-safety/appeals`): Review console for evaluating user appeals, reviewing counter-evidence, and approving/rejecting appeals (with automated restriction lifting upon approval).
- **Safety Rules Console** (`/admin/trust-safety/rules`): Policy rules management for automated detection triggers and scam scoring thresholds.

---

## Safety Policies & Enforcement Mechanisms

### 1. Reporter Privacy
- **Strict Anonymity**: Reporter identity is never exposed to reported entities or public APIs.
- **Private Evidence**: Evidence screenshots and documents are restricted to authorized moderators and malware-scanned.

### 2. Moderation Actions & RBAC
Only authorized moderators can execute enforcement actions:
- `warning`: Issued to user with clear policy guidelines.
- `content_removal`: Deletes offending posts, comments, or messages.
- `job_removal`: Removes suspicious job posting from public search and halts application intake while preserving historical records.
- `messaging_restriction`: Temporarily restricts direct messaging capabilities.
- `job_posting_restriction`: Restricts posting new jobs for recruiters.
- `community_restriction`: Restricts post/comment creation in communities.
- `temporary_suspension`: Temporarily restricts entire account access.
- `permanent_suspension`: Permanently bans user/company with audit trail.

### 3. Scam & Fraud Detection Signals
Heuristic and automated triggers evaluate risk scores:
- Advance fee requests ("wire transfer", "processing fee", "buy equipment").
- Suspicious contact emails (discrepancy between domain and company domain).
- Off-platform salary promises and mass-messaging patterns.

---

## API Endpoints

### User Safety API (`/api/v1/safety/...`)
| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| `POST` | `/api/v1/safety/reports` | Submit abuse report | Yes |
| `GET` | `/api/v1/safety/reports` | List user's submitted reports | Yes |
| `GET` | `/api/v1/safety/reports/:id` | Get report detail | Yes |
| `POST` | `/api/v1/safety/blocks` | Block user or company | Yes |
| `DELETE` | `/api/v1/safety/blocks/:userId` | Unblock user or company | Yes |
| `GET` | `/api/v1/safety/blocks` | List user's blocked entities | Yes |
| `POST` | `/api/v1/safety/mutes` | Mute user or community | Yes |
| `DELETE` | `/api/v1/safety/mutes/:id` | Unmute entity | Yes |
| `GET` | `/api/v1/safety/mutes` | List muted entities | Yes |
| `GET` | `/api/v1/safety/restrictions` | Get active user restrictions | Yes |
| `POST` | `/api/v1/safety/appeals` | Submit moderation appeal | Yes |
| `GET` | `/api/v1/safety/appeals` | List user's submitted appeals | Yes |
| `GET` | `/api/v1/safety/appeals/:id` | Get appeal detail | Yes |

### Admin Moderation API (`/api/v1/admin/trust-safety/...`)
| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| `GET` | `/api/v1/admin/trust-safety` | Moderation metrics summary | Moderator |
| `GET` | `/api/v1/admin/trust-safety/reports` | List reports queue | Moderator |
| `GET` | `/api/v1/admin/trust-safety/cases` | List moderation cases | Moderator |
| `POST` | `/api/v1/admin/trust-safety/cases/:id/claim` | Claim case for review | Moderator |
| `POST` | `/api/v1/admin/trust-safety/cases/:id/assign` | Assign case to admin/team | Moderator |
| `POST` | `/api/v1/admin/trust-safety/cases/:id/actions` | Execute moderation action | Moderator |
| `GET` | `/api/v1/admin/trust-safety/appeals` | List moderation appeals | Moderator |
| `POST` | `/api/v1/admin/trust-safety/appeals/:id/resolve` | Resolve appeal (approve/deny) | Moderator |
| `GET` | `/api/v1/admin/trust-safety/rules` | List safety policy rules | Moderator |
| `PUT` | `/api/v1/admin/trust-safety/rules` | Update safety policy rule | Moderator |
| `GET` | `/api/v1/admin/trust-safety/analytics` | Moderation trend analytics | Moderator |
