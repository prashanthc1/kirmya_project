# Kirmya Messaging, Notifications & Real-Time Communication Platform

## 1. Architectural Overview

The Kirmya Messaging and Real-Time Notification system provides professional direct messaging, thread conversations, real-time WebSocket event dispatching, multi-channel notifications (In-App, Email, Mobile/Web Push), quiet hours enforcement, and idempotency deduplication.

```
Client (Next.js / WebSocket)
        │
        ├─────────────────────────────┐
        ▼                             ▼
REST Messaging & Notifications     WebSocket Hub (Real-Time Events)
(/api/v1/messages, /notifications) (/api/v1/messages/ws)
        │                             ▲
        ▼                             │
Messaging & Notification Services ────┘
        │
        ├─────────────────────────────┬─────────────────────────────┐
        ▼                             ▼                             ▼
PostgreSQL / pgxpool          In-Memory / NATS Event Bus     Multi-Channel Delivery
(Persistence & Audit)         (PubSub & Event Routing)       (In-App, Email, Push)
```

---

## 2. Messaging & Conversation Lifecycle

1. **Direct Conversation Creation**: Enforces 2-party uniqueness per user pair to prevent duplicate conversations between the same individuals.
2. **Participant Authorization (IDOR Protected)**: A user can only access conversations, retrieve message histories, or send messages where `sender_id = userID` or `recipient_id = userID`.
3. **Message State Machine**: `sent` → `delivered` → `read`.
4. **Unread Counts**: Computed accurately per user context and updated atomically upon mark-read requests.
5. **WebSocket Lifecycle**: Authenticated via JWT context on upgrade; manages concurrent connections, heartbeat ping/pong, and clean unregistration on disconnect.

---

## 3. Notification Subsystem & Multi-Channel Delivery

1. **Event Ingestion & Deduplication**: All domain events pass through `ProcessEvent` with `IdempotencyKey` checking to guarantee zero duplicate alerts.
2. **Channel Routing**: Supports In-App, Email, and Push channels configurable per notification category.
3. **Quiet Hours Enforcement**: Non-critical alerts (e.g. job recommendations, networking suggestions) are deferred during user-configured Do Not Disturb hours, while high-priority Security and System Alerts bypass quiet hours immediately.
4. **Dead Letter Queue (DLQ)**: Retries failed asynchronous delivery payloads with exponential backoff and admin audit logging.

---

## 4. REST & WebSocket API Directory

| Method | Endpoint | Description | Auth Requirement |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/messages/ws` | WebSocket connection for real-time messaging & presence | Bearer Token |
| `GET` | `/api/v1/messages/conversations` | List user's active direct conversations | Bearer Token |
| `POST` | `/api/v1/messages/conversations` | Create or initiate direct conversation | Bearer Token |
| `GET` | `/api/v1/messages/conversations/:id/messages` | Paginated message thread history | Bearer Token (Participant) |
| `POST` | `/api/v1/messages/conversations/:id/messages` | Send message in conversation | Bearer Token (Participant) |
| `POST` | `/api/v1/messages/conversations/:id/read` | Mark all messages in conversation as read | Bearer Token (Participant) |
| `GET` | `/api/v1/messages/unread-count` | Total unread direct messages count | Bearer Token |
| `GET` | `/api/v1/notifications` | List user notifications with category and unread filters | Bearer Token |
| `GET` | `/api/v1/notifications/unread-count` | Unread notifications count | Bearer Token |
| `PATCH`| `/api/v1/notifications/:id/read` | Mark single notification as read | Bearer Token (Owner) |
| `POST` | `/api/v1/notifications/read-all` | Mark all notifications as read | Bearer Token |
| `DELETE`| `/api/v1/notifications/read` | Clear all read notifications | Bearer Token |
| `GET` | `/api/v1/notifications/preferences` | Get user channel delivery matrix preferences | Bearer Token |
| `PUT` | `/api/v1/notifications/preferences` | Update delivery matrix preferences | Bearer Token |
| `GET` | `/api/v1/notifications/quiet-hours` | Get Do Not Disturb quiet hours configuration | Bearer Token |
| `PUT` | `/api/v1/notifications/quiet-hours` | Update quiet hours settings | Bearer Token |
| `GET` | `/api/v1/notifications/digest` | Get daily/weekly digest configuration | Bearer Token |
| `PUT` | `/api/v1/notifications/digest` | Update digest settings | Bearer Token |
| `POST` | `/api/v1/notifications/devices` | Register mobile/web push device token | Bearer Token |
| `GET` | `/api/v1/notifications/dead-letters` | Admin DLQ inspection | Admin RBAC |
| `POST` | `/api/v1/notifications/dead-letters/:id/retry` | Retry failed DLQ notification | Admin RBAC |
| `POST` | `/api/v1/notifications/admin/announcement` | Broadcast platform-wide announcement | Admin RBAC |
