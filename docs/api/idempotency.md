# Kirmya API Idempotency & Deduplication Standards

## 1. Overview & Rationale

Network retries and multiple button submissions can cause unintended duplicate operations on mutating endpoints (such as job applications, connection requests, and notification events). Kirmya enforces idempotency via the `Idempotency-Key` HTTP header.

---

## 2. Idempotency Key Specification

- **Header Name**: `Idempotency-Key`
- **Format**: UUID v4 or arbitrary string (max 64 characters)
- **TTL**: Cached in Redis for 24 hours
- **Scope**: Tied to the authenticated user ID and target route URI

---

## 3. Supported Idempotent Operations

| Module | Endpoint | Idempotent Behavior |
| :--- | :--- | :--- |
| **Job Applications** | `POST /api/v1/applications` | If an application with the same `(userId, jobId)` or idempotency key exists, returns the original application record without creating a duplicate. |
| **Connection Requests** | `POST /api/v1/network/requests` | If a connection request between the two users is already pending or accepted, returns the existing request status. |
| **Direct Messaging** | `POST /api/v1/messages/conversations/:id/messages`| Prevents duplicate message bubbles from appearing during network reconnection retries. |
| **Notifications** | `POST /api/v1/internal/notifications/events` | Deduplicates notification dispatching using `IdempotencyKey` field. |
| **Community Membership** | `POST /api/v1/communities/:id/join` | Idempotent join action; re-requesting returns current active membership status. |

---

## 4. Concurrent Request Locks

When an idempotent request is in-flight, subsequent requests with the identical key receive a temporary `409 Conflict` or wait on a distributed mutex lock until the first request completes, returning the cached result.
