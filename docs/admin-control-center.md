# Kirmya Admin Control Center & Platform Operations Architecture

## Overview
The **Kirmya Admin Control Center & Platform Operations Management System** is a centralized, security-first administrative suite designed to empower platform operators, trust & safety leads, compliance officers, and operations engineers to manage Kirmya safely and efficiently.

---

## 1. Role-Based Access Control (RBAC) & Permission Taxonomy

Kirmya enforces granular, server-validated permission checks across all administrative actions. Frontend navigation hiding is never trusted as security enforcement.

### System Roles
- **Super Admin (`super_admin`)**: Unrestricted platform access (`*` wildcard). Protected system role.
- **Platform Admin (`platform_admin`)**: Operational oversight across users, organizations, jobs, communities, and announcements.
- **Trust & Safety Admin (`trust_safety_admin`)**: Moderation queue, user restrictions, content reporting, and appeals handling.
- **Privacy & Compliance Admin (`privacy_admin`)**: Data Subject Access Requests (DSAR), legal hold shielding, data retention dry-runs, and compliance reporting.
- **Analytics & BI Admin (`analytics_admin`)**: Platform KPI dashboards, cohort retention, activation funnels, custom reports, and data export.
- **Operations & System Admin (`operations_admin`)**: Feature flag management, maintenance mode scheduling, background queue management, and system health diagnostics.
- **Support Admin (`support_admin`)**: Customer support ticket resolution and time-bounded (max 15-min) support impersonation sessions.

### Permission Tokens
```
admin.dashboard.view
users.view | users.manage | users.suspend | users.delete | users.impersonate
organizations.view | organizations.manage
jobs.view | jobs.manage | jobs.moderate
applications.view
communities.manage
messaging.manage
notifications.manage
trust_safety.manage
privacy.manage
analytics.view | analytics.export
audit.view
roles.manage
feature_flags.manage
system_config.view | system_config.manage
system_jobs.view | system_jobs.retry
```

---

## 2. Platform Operations & Feature Modules

### A. Executive Admin Dashboard (`/admin`)
Provides high-level platform statistics: Total & Active Users, Verified Organizations, Active Jobs, Pending Moderation Cases, Security Incident Alerts, Queue Depth, and Real-time System Health Status.

### B. User & Organization Management (`/admin/users`, `/admin/organizations`)
Search, filter, inspect status, verify, suspend, or restrict accounts. User deletion adheres strictly to Prompt 63 privacy erasure procedures and respects active legal hold locks (`ErrUserUnderLegalHold`).

### C. Trust & Safety Moderation (`/admin/trust-safety`)
Integrates automated risk scoring (0-100), report classification, independent reviewer constraints (preventing moderators from acting on their own reports), and appeals processing.

### D. Support Impersonation Protocol (`/admin/users/:id/impersonate`)
Allows support staff to initiate short-lived (15-minute expiration) impersonation sessions for troubleshooting. Requires an explicit justification reason, displays a sticky banner, logs all actions to the immutable audit log, and never leaks authentication secrets.

### E. Feature Flags Studio (`/admin/feature-flags`)
Enables dynamic rollout management (0% - 100%) by environment and target criteria with deterministic evaluation and safe default fallback.

### F. System Health & Infrastructure Diagnostics (`/admin/system/health`)
Aggregates health checks across PostgreSQL, Redis, NATS, OpenSearch, Background Workers, Storage, and OpenTelemetry. Displays pool latency and queue depths without exposing raw credentials or passwords.

### G. Background Queue Management (`/admin/system/jobs`)
Monitors worker queues, inspects failed jobs, and allows idempotent manual job retries with exponential backoff handling.

### H. Platform Maintenance Mode (`/admin/maintenance`)
Allows operators to schedule or trigger platform-wide maintenance mode with audit logging, explicit confirmation, and administrator bypass.

---

## 3. OpenAPI 3.0 Endpoints

```yaml
/api/v1/admin/dashboard: GET
/api/v1/admin/users: GET, PATCH
/api/v1/admin/organizations: GET, PATCH
/api/v1/admin/jobs: GET, PATCH
/api/v1/admin/roles: GET, POST, PATCH
/api/v1/admin/feature-flags: GET, POST, PATCH
/api/v1/admin/system/health: GET
/api/v1/admin/system/jobs: GET
/api/v1/admin/system/jobs/{id}/retry: POST
/api/v1/admin/maintenance: GET, PATCH
/api/v1/admin/announcements: GET, POST
```
