# Kirmya Enterprise Compliance & Privacy Framework Specification

This document details technical specifications and compliance workflows for **GDPR (General Data Protection Regulation)** and **CCPA (California Consumer Privacy Act)** enforcement across the Kirmya Enterprise Platform.

---

## 🔒 1. Privacy & GDPR Readiness Architecture

### Right to Access (Article 15) - Data Export Engine
- **Endpoint**: `POST /api/v1/compliance/export`
- **Output**: Complete structured JSON package containing:
  - User profile details & contact information.
  - Job application history & status timestamps.
  - Uploaded resume metadata & CDN URLs.
  - Recruiter messaging history.
  - Privacy consent records & audit event logs.

### Right to be Forgotten (Article 17) - Account Deletion SLA
- **Endpoint**: `POST /api/v1/compliance/delete-account`
- **SLA Timeline**: 30-day graceful deletion window.
- **Execution Workflow**:
  1. Status marked `pending` in `data_requests` table.
  2. PII (Personally Identifiable Information) in `users`, `profiles`, and `resumes` tables obfuscated/anonymized.
  3. Hard purge executed across S3/CDN storage and PostgreSQL databases after 30 days.

### Consent Management (Article 7)
- **Endpoint**: `POST /api/v1/compliance/consent`
- **Consent Categories**:
  - `analytics`: Performance & backend latency tracking.
  - `marketing`: AI job match recommendations & email alerts.
  - `third_party_sharing`: Anonymous skill gap sharing with training providers.

---

## 🛡️ 2. Security & Encryption Standards

### Data at Rest
- All database columns containing sensitive fields (passwords, tokens, verification IDs) are encrypted using **AES-256-GCM**.

### Data in Transit
- Mandatory **TLS 1.3** across all HTTP REST API endpoints and WebSockets.

### Audit Logging
- Immutable security audit records captured in `audit_events` table capturing `user_id`, `event_type`, `resource`, `ip_address`, and `timestamp`.
