# Kirmya Data Architecture & Database Audit

## Executive Summary
This document audits the database schemas, table structures, foreign key constraints, PII classifications, soft-deletion semantics, and retention controls across the Kirmya data platform.

---

## 1. Database Schema Overview

| Schema Module | Migration File | Primary Tables | Foreign Key Integrity | Soft Deletion Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Users & Auth** | `0001` - `0005` | `users`, `profiles`, `auth_credentials` | FK to `users(id)` ON DELETE CASCADE | Anonymized or Hard-deleted |
| **Organizations & Jobs** | `0006` - `0015` | `organizations`, `jobs`, `applications` | FK to `organizations(id)`, `jobs(id)` | Soft-deleted (`deleted_at IS NULL`) |
| **Networking & Messaging** | `0016` - `0025` | `connections`, `conversations`, `messages` | FK to `users(id)`, `conversations(id)` | User-level message revocation |
| **Communities & Content** | `0026` - `0035` | `communities`, `community_posts`, `comments` | FK to `communities(id)`, `users(id)` | Author anonymized on account delete |
| **Notifications & Preferences**| `0036` - `0045` | `notifications`, `notification_preferences` | FK to `users(id)` ON DELETE CASCADE | Purged after 90 days via engine |
| **Security & Audits** | `0046` - `0055` | `security_events`, `audit_logs`, `mfa_secrets` | FK to `users(id)` | Immutable append-only audit trail |
| **Privacy & Governance** | `0056` - `0086` | `data_requests`, `legal_holds`, `retention_policies`| FK to `users(id)` | Shielded during active legal hold |

---

## 2. Integrity & Constraint Verification

1. **Foreign Key Enforcement**: All child records enforce `REFERENCES parent_table(id)` with explicit delete behaviors (`CASCADE`, `RESTRICT`, or `SET NULL`).
2. **Unique Constraints**: Email addresses (`users(email)`), usernames (`users(username)`), idempotency keys (`notification_deduplications(idempotency_key)`), and active legal hold records enforce strict SQL `UNIQUE` constraints.
3. **Index Optimization**: Indexes include `WHERE deleted_at IS NULL` partial index clauses to ensure high-performance query execution over non-deleted records.
