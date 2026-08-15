# Notifications, Alerts & Communication Preferences System

## Architectural Overview

The **Notifications, Alerts & Communication Preferences System** provides centralized event processing, multi-channel routing (In-App, Email, Push), category delivery matrices, Quiet Hours do-not-disturb schedule enforcement, Digest frequencies (Daily/Weekly), Idempotency deduplication, Dead Letter queue retry console, OpenTelemetry latency tracking, and integrations across Jobs, Applications, Networking, Mentorship, Communities, Messaging, Security, and System Announcements.

---

## Event Bus & Delivery Pipeline

```
Platform Event (NATS)
       │
       ▼
[ Notification Consumer ]
       │
       ├─► Idempotency Deduplication (Redis/In-Memory Key)
       ├─► Quiet Hours Check (Security/Critical bypasses)
       ├─► User Preference Check (In-App, Email, Push)
       │
       ├─► [ In-App Store ] (PostgreSQL + Real-Time WebSocket Publish)
       ├─► [ Email Adapter ] (Transactional Mail Template)
       └─► [ Push Adapter ] (FCM / Web Push Minimal Payload)
```

---

## Priority & Quiet Hours Policy

- **Critical & Security Priority**: Security alerts (`security_alert`, `new_login`, `password_changed`, `email_verification`) strictly bypass Quiet Hours schedules and cannot be disabled by user opt-outs.
- **High Priority**: Time-sensitive events (`interview_scheduled`, `interview_reminder`, `offer_received`, `application_status_changed`).
- **Normal & Low Priority**: Deferred during user-configured Quiet Hours.

---

## Deep Link Navigation & Security

Notifications include deep links to authorized application destinations:
- **Connection Request**: `/network/requests`
- **New Message**: `/messages`
- **Mentorship Session**: `/mentorship`
- **Community Update**: `/communities`
- **Job Alert Match**: `/jobs`
- **Application Status**: `/applications`
- **Career Milestone**: `/analytics/career`

> **Security Enforcement**: Destination pages re-authorize user access independently upon navigation to ensure no unauthorized access via notification links.

---

## API Endpoint Reference

### Notifications Management
- `GET /api/v1/notifications` — Fetch user notification history (filterable by category and unread status).
- `GET /api/v1/notifications/unread-count` — Get total unread badge count.
- `PATCH /api/v1/notifications/:id/read` — Mark notification as read.
- `PATCH /api/v1/notifications/:id/unread` — Mark notification as unread.
- `POST /api/v1/notifications/mark-all-read` — Mark all user notifications as read.
- `DELETE /api/v1/notifications/clear-read` — Clear read notifications.
- `DELETE /api/v1/notifications/:id` — Dismiss/delete notification.

### Preferences & Schedules
- `GET /api/v1/notifications/preferences` — Get category & channel delivery preferences.
- `PATCH /api/v1/notifications/preferences` — Update channel preference settings.
- `GET /api/v1/notifications/quiet-hours` — Get Quiet Hours schedule.
- `PATCH /api/v1/notifications/quiet-hours` — Update Quiet Hours schedule.

### Admin & Dead Letter Queue
- `GET /api/v1/notifications/admin/dead-letters` — Fetch failed delivery queue.
- `POST /api/v1/notifications/admin/dead-letters/:id/retry` — Retry failed delivery.
- `POST /api/v1/notifications/admin/announcements` — Broadcast platform-wide system announcement.
