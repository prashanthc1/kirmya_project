# Kirmya Data Integrity, Concurrency Invariants & State Transition Guide

## 1. Data Integrity Architecture

Kirmya enforces data integrity through a dual-defense model: **Database-Level Invariants** (PostgreSQL Constraints, Composite Unique Keys, Foreign Keys, Check Constraints) coupled with **Domain-Level Invariants** (Service-layer transition validation and optimistic concurrency).

```
                      Client Request
                            │
                            ▼
              ┌───────────────────────────┐
              │ Service Domain Validation │
              │ (State Transition Matrix) │
              └─────────────┬─────────────┘
                            │
                            ▼
              ┌───────────────────────────┐
              │ Atomic Transaction Block  │
              │ (pgx Tx / sync.RWMutex)   │
              └─────────────┬─────────────┘
                            │
                            ▼
              ┌───────────────────────────┐
              │ PostgreSQL Constraints    │
              │ (Unique, FK, Check, Null) │
              └───────────────────────────┘
```

---

## 2. Business Invariant & Constraint Directory

| Domain Entity | Critical Invariant | Database Constraint | Service-Level Rule |
| :--- | :--- | :--- | :--- |
| **Auth** | Single account per email | `UNIQUE(email)` | Email format and lowercase validation |
| **Applications** | 1 active application per job/candidate | `UNIQUE(job_id, candidate_id)` | Block re-application while active |
| **Networking** | 1 relationship between 2 users | `UNIQUE(requester_id, addressee_id)` | Prevent self-connections & duplicates |
| **Communities** | 1 membership record per user/community | `UNIQUE(community_id, user_id)` | Validate private community approval |
| **Financials** | Non-negative integer minor amounts | `CHECK(amount_cents >= 0)` | Integer arithmetic only; float forbidden |
| **Compliance** | Deletion blocked if active hold exists | `legal_holds` FK check | Return `ErrUserUnderLegalHold` |
| **Webhooks** | Idempotent event processing | `UNIQUE(provider, event_id)` | Deduplicate before state mutation |

---

## 3. State Transition Matrix

### 3.1 Job Application State Machine
```
[submitted] ──► [reviewed] ──► [interview] ──► [offered] ──► [hired]
     │              │              │              │
     └──────────────┴──────────────┴──────────────┴─────────► [rejected] / [withdrawn]
```
- **Invariant Rules**:
  - A candidate cannot jump directly from `submitted` to `hired` without recruiter review.
  - Final terminal states (`hired`, `rejected`, `withdrawn`) cannot transition to previous active stages.

### 3.2 Job Publishing State Machine
```
[draft] ──► [published] ──► [closed] ──► [archived]
```
- **Invariant Rules**:
  - Closed jobs reject new application submissions.
  - Archived jobs are excluded from candidate discovery search.

---

## 4. Transaction Boundaries & Isolation

- **Transaction Scope**: Multi-query operations (e.g. application submission, stage updates, relationship acceptance) execute within atomic transaction blocks (`tx.Begin() ... tx.Commit()`).
- **Zero External Deadlocks**: External API calls (AI, Mailer, WebSockets) are strictly executed **outside** database transaction blocks to prevent connection starvation and prolonged locks.
- **Rollback Safety**: Any step failure automatically issues `tx.Rollback()`, leaving database state unmutated.
