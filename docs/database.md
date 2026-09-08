# Kirmya PostgreSQL Schema Architecture, Indexing & Data Integrity Guide

## 1. Database Architecture Overview

Kirmya uses **PostgreSQL 16** as its authoritative primary system of record. Repositories access PostgreSQL using `pgxpool` with parameterized SQL queries, explicit transaction boundaries, and fail-closed persistence (`ALLOW_NO_DB=true` is rejected in production). All 98 migrations (`0001` through `0096`) are managed with transactional execution and PostgreSQL advisory locks.

```
Application Service Layer
        │
        ▼
pgxpool Connection Pool (Max/Min Connections, Lifetime Recycling, Ping Probes)
        │
        ├─────────────────────────────┬─────────────────────────────┐
        ▼                             ▼                             ▼
Relational Tables (PostgreSQL) Composite Indexes & GIN     Foreign Key Constraints
(98 Migrations, Normalized)    (B-tree, Trigram, Partial)   (ON DELETE RESTRICT/CASCADE)
```

---

## 2. Module-to-Table Ownership Directory

| Module | Primary Database Tables | Integrity & Foreign Key Rules |
| :--- | :--- | :--- |
| **`auth`** | `users`, `user_sessions`, `mfa_secrets`, `password_resets` | `users(id)` is root FK; sessions cascade delete |
| **`profile`** | `profiles`, `experiences`, `educations`, `skills`, `certifications` | `profile_id` FK to `profiles(id)` ON DELETE CASCADE |
| **`jobs`** | `jobs`, `saved_jobs`, `job_alerts` | `organization_id` FK to `organizations(id)` |
| **`applications`** | `applications`, `application_stages`, `candidate_notes` | Composite Unique `(job_id, candidate_id)` |
| **`recruiter`** | `recruiter_profiles`, `recruiter_scorecards`, `talent_pools` | Restricted to authorized `organization_id` |
| **`communities`** | `communities`, `community_members`, `community_posts` | Composite Unique `(community_id, user_id)` |
| **`networking`** | `connections`, `connection_requests`, `blocked_users` | Composite Unique `(requester_id, addressee_id)` |
| **`messaging`** | `conversations`, `conversation_members`, `messages` | `conversation_id` FK; messages indexed by timestamp |
| **`notification`** | `notifications`, `notification_preferences` | Indexed by `(user_id, is_read, created_at DESC)` |
| **`compliance`** | `data_requests`, `legal_holds`, `retention_policies` | Legal hold shields user deletion |
| **`billing`** | `plans`, `subscriptions`, `entitlements`, `webhook_events` | Webhook composite unique `(provider, event_id)` |

---

## 3. Indexing Strategy

1. **Composite B-Tree Indexes**: Query combinations such as `(user_id, status)`, `(job_id, created_at DESC)`, and `(conversation_id, created_at ASC)`.
2. **Partial Indexes**: Highly selective query acceleration (e.g. `WHERE is_read = false` on notifications, `WHERE deleted_at IS NULL` on soft-deleted entities).
3. **Full-Text & GIN Indexes**: PostgreSQL `pg_trgm` extension on profile headlines, job titles, and skill names for fast search fallback when OpenSearch is offline.

---

## 4. Financial & Numeric Integrity

- **Integer Minor Units**: All monetary values are strictly modeled in cents / integer minor units. Floating-point arithmetic (`FLOAT`/`DOUBLE PRECISION`) is strictly forbidden for financial calculations.

---

## 5. Account Deletion & Data Retention Protocol

- **Legal Hold Shielding**: When a user submits an account deletion request, the compliance service queries `legal_holds`. If an active hold exists, deletion is blocked with `ErrUserUnderLegalHold`.
- **Cascade Anonymization**: Upon approved deletion, profile PII, resume files, and session keys are purged while non-identifiable aggregated telemetry cohorts are preserved in compliance with data retention rules.

---

## 6. Schema Conformance & Migration Management

- **Automated Migration Runner**: Executes migrations from `0001` through `0096` using PostgreSQL session-level advisory locks (`pg_advisory_lock`), guaranteeing safe zero-downtime boots and multi-replica concurrency.
- **Automated Schema Conformance CI Gate** (`backend/test/ci/schema_conformance_test.go`): Compares all SQL queries in repository layers with the live `information_schema` tables and columns, guaranteeing that no write or read references non-existent columns or unmigrated tables.
- **Anti-Deadlock Application Locking**: Application submissions execute with upfront `FOR NO KEY UPDATE` row locking on job rows, preventing deadlock scenarios under high concurrent applicant traffic and achieving >2,800 req/s.
