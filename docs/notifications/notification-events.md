# Kirmya Notification Event Routing & Deduplication

## 1. Subscribed Domain Events

| Domain Event | Notification Category | Target Recipient | Channel Default |
| :--- | :--- | :--- | :--- |
| `auth.password_changed` | `Security` | Account Owner | In-App + Email (Mandatory) |
| `job.alert_match` | `Jobs` | Alert Subscriber | In-App + Digest Email |
| `application.submitted` | `Applications` | Hiring Recruiter | In-App + Email |
| `interview.scheduled` | `Interviews` | Candidate + Panel | In-App + Email |
| `network.connection_request`| `Networking` | Target Professional | In-App |
| `message.received` | `Messaging` | Conversation Recipient | In-App (Metadata only) |

---

## 2. Deduplication & Idempotency Keys
Every event payload includes a deterministic idempotency key (`hash(event_type + recipient_id + entity_id + date)`). Redis caches processed keys with a 24-hour TTL to prevent duplicate notifications during network retries.
