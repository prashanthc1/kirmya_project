# Kirmya Analytics Architecture & Endpoints

## 1. Subsystem Domains & REST APIs

| Subsystem | Endpoint Path | Authorization Scope |
| :--- | :--- | :--- |
| **Executive Overview** | `/api/v1/admin/analytics/overview` | Super Admin / Analytics Admin |
| **User Funnel** | `/api/v1/admin/analytics/funnel` | Analytics Admin |
| **Recruiter Funnel** | `/api/v1/recruiter/analytics/jobs/:id` | Verified Recruiter (Org-Scoped) |
| **Personal Career** | `/api/v1/analytics/career` | Authenticated User |
| **System Telemetry** | `/api/v1/admin/analytics/performance` | Operations Admin |
