# Kirmya Notification Architecture & REST APIs

## 1. Domain Entities & Taxonomy
- **Categories**: `Security`, `Jobs`, `Applications`, `Interviews`, `Networking`, `Messaging`, `Communities`, `Career`, `System`.
- **Severity Levels**: `Critical` (immediate delivery), `Important`, `Normal`, `Low`.
- **Sub-Resources**: `NotificationPreference`, `QuietHoursSettings`, `DigestSchedule`, `DeliveryRecord`.

---

## 2. API Endpoints Overview

| Method | Endpoint | Description | Scope |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/notifications` | List user notifications with cursor pagination | User |
| `GET` | `/api/v1/notifications/unread-count` | Fetch current unread notification count | User |
| `PATCH`| `/api/v1/notifications/:id/read` | Mark individual notification as read | User |
| `POST` | `/api/v1/notifications/mark-all-read` | Mark all unread notifications as read | User |
| `GET` | `/api/v1/notifications/preferences` | Retrieve user notification channel matrix | User |
| `PUT` | `/api/v1/notifications/preferences` | Update category/channel delivery preferences | User |
