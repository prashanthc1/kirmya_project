# Kirmya Complete Test Case Matrix & Quality Mapping

## 1. Feature to Test Type Matrix

| Domain Feature | Unit Test | Integration Test | E2E Browser Test | Security / IDOR Test | Performance Test | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication** | Passwords/JWT | PostgreSQL Session | Login / MFA Flow | Brute Force / Token | Latency <= 45ms | **VERIFIED** |
| **Profiles** | Validation | DB Update | Profile Edit Form | Privacy Scoping | Latency <= 60ms | **VERIFIED** |
| **Jobs System** | Status Machine | Search Index Sync | Recruiter Create Job | Recruiter Role Shield | Latency <= 50ms | **VERIFIED** |
| **Applications / ATS**| Eligibility Rules| Transaction & Outbox | Candidate Apply Flow | Internal Notes Shield| Latency <= 80ms | **VERIFIED** |
| **Networking** | Connection Graph| Friend Requests | Connect / Accept | Block Relationship Excl | Latency <= 65ms | **VERIFIED** |
| **Disaster Recovery** | Backup Specs | PITR Restore | Recovery Dashboard | Secret Protection | RPO <= 15m | **VERIFIED** |
| **Admin Operations** | RBAC Enforcer | Impersonation TTL | System Health Desk | Break-Glass Audit | Latency <= 90ms | **VERIFIED** |
