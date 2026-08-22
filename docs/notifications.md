# Kirmya Notifications, Communication Preferences & Notification Intelligence Architecture

## Overview

The **Kirmya Notifications & Communication System** provides a centralized, event-driven, multi-channel notification engine for the Kirmya platform. It handles real-time in-app alerts, email notifications, push notifications, digest aggregations, user preference controls, quiet hours schedules, timezones, idempotency deduplication, exponential backoff retries, dead-letter queues, admin template versioning, and privacy-preserving data handling.

---

## 1. Domain Event Taxonomy

Notifications are triggered asynchronously by domain events published to NATS/Event Bus:

| Event Type | Category | Priority | Default Channels | Description |
| :--- | :--- | :--- | :--- | :--- |
| `user.created` | `System` | `Normal` | In-App, Email | Account registration welcome |
| `user.email_verified` | `Security` | `High` | In-App, Email | Email verification confirmation |
| `security.new_login` | `Security` | `Critical` | In-App, Email, Push | New device/IP login alert |
| `security.password_changed` | `Security` | `Critical` | In-App, Email | Account password updated |
| `job.recommended` | `Jobs` | `Normal` | In-App, Push | AI job match recommendation |
| `job.alert_match_found` | `Jobs` | `Normal` | In-App, Email | Saved search job alert match |
| `job.application_submitted` | `Applications` | `Normal` | In-App, Email | Application receipt confirmation |
| `job.application_status_changed` | `Applications` | `High` | In-App, Email, Push | Interview invite / status update |
| `connection.requested` | `Networking` | `Normal` | In-App, Push | Connection invitation received |
| `connection.accepted` | `Networking` | `Normal` | In-App | Connection invitation accepted |
| `message.received` | `Messaging` | `Normal` | In-App, Push | Direct message received |
| `community.invited` | `Communities` | `Normal` | In-App | Community group invite |
| `community.mentioned` | `Communities` | `Normal` | In-App, Push | Post comment mention |
| `trust.restriction_created` | `Trust & Safety` | `High` | In-App, Email | Account feature restriction applied |
| `trust.report_updated` | `Trust & Safety` | `Normal` | In-App | User report status updated |
| `trust.appeal_updated` | `Trust & Safety` | `High` | In-App, Email | Moderation appeal decision ready |
| `privacy.export_completed` | `Privacy` | `High` | In-App, Email | Personal DSAR data export download ready |
| `privacy.deletion_completed` | `Privacy` | `Critical` | Email | Account deletion confirmation |

---

## 2. Category Map & Priority Levels

### Categories
1. `Security`: Authentication, sessions, MFA, password updates. *(Mandatory override enabled)*
2. `Jobs`: Recommended jobs, job alerts, saved searches.
3. `Applications`: Application submissions, status changes, interview invites.
4. `Interviews`: Interview scheduling, reminders, feedback requests.
5. `Networking`: Connection requests, acceptances, profile views.
6. `Messaging`: Direct chat messages, unread reminders.
7. `Communities`: Group invitations, mentions, discussions.
8. `Career`: Skill recommendations, career goals, mentorship requests.
9. `Resume`: ATS analysis complete, resume optimization tips.
10. `Support`: Helpdesk ticket updates, support agent responses.
11. `System`: System maintenance, platform announcements.
12. `Privacy`: DSAR export downloads, privacy policy updates, consent changes. *(Mandatory override enabled)*
13. `Trust & Safety`: Account restrictions, report updates, appeal outcomes.

### Priority Levels & Overrides
- **`Critical`**: Bypasses Quiet Hours and user preference opt-outs (e.g. security breach alerts, unauthorized login attempts).
- **`High`**: High urgency (e.g. interview invitations, offer letters).
- **`Normal`**: Standard activity (e.g. connection requests, job alerts).
- **`Low`**: Low priority background updates.

---

## 3. Channel Provider Abstraction

The notification engine decouples domain logic from delivery providers:

```
[Domain Event] ➔ [Service / Pref Evaluator] ➔ [Channel Router]
                                                  ├── In-App Persistence (PostgreSQL / Redis WS)
                                                  ├── Email Provider (SendGrid / SMTP Abstraction)
                                                  └── Push Provider (FCM / WebPush Abstraction)
```

---

## 4. Quiet Hours & Timezone Schedule

- Users can configure a Do Not Disturb schedule (e.g. `22:00` to `07:00` in `America/New_York` timezone).
- During quiet hours, optional `Normal` and `Low` priority notifications are queued for morning delivery.
- `Critical` and `Security` alerts bypass quiet hours unconditionally.

---

## 5. Digest Notifications

- **Digest Frequencies**: `Instant`, `Daily Digest`, `Weekly Digest`, `Never`.
- **Digest Aggregator Worker**: Groups non-urgent job, networking, and community alerts into a single formatted daily or weekly summary email.

---

## 6. Deduplication & Idempotency

- Every incoming event accepts an `IdempotencyKey` (e.g. `evt-msg-rec-12345`).
- The system checks Redis / PostgreSQL deduplication store prior to processing.
- Duplicate events within a 24-hour window are safely suppressed.

---

## 7. Retries & Dead-Letter Queue (DLQ)

- Transient delivery failures (e.g. SMTP 503, FCM timeout) are retried up to 3 times with exponential backoff (`2s`, `8s`, `32s`).
- Exhausted deliveries are moved to `notification_dead_letters` table for administrator inspection and manual retry.

---

## 8. Admin Templates & System Announcements

- **Template Versioning**: Admin templates support version tracking (`v1.0`, `v1.1`), subject formatters, HTML body templates, and variable validation (`{{actorName}}`, `{{actionUrl}}`).
- **Safe Previews**: Template previews render with mock data.
- **System Announcements**: Controlled broadcast console with target role filtering (`All`, `Candidates`, `Recruiters`, `Admins`), audit logging, and rate limiting.

---

## 9. Privacy Safeguards (Prompt 63 Integration)

- Notifications **never** contain passwords, MFA secrets, private message body text, or sensitive moderation evidence.
- User account deletion automatically purges in-app notification logs, push tokens, and digest preferences.

---

## 10. OpenTelemetry Observability & OpenAPI Specs

- Telemetry traces spans for `notification.process_event`, `notification.deliver_email`, `notification.deliver_push`.
- Metrics track `notifications_created_total`, `notifications_sent_total`, `delivery_failure_total`, `dead_letter_queue_depth`.
