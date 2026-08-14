# Kirmya Centralized Notification Architecture & Delivery Guide

## 1. Architectural Overview
Kirmya provides an enterprise-grade notification platform supporting event processing, multi-channel delivery, user preferences, quiet hours scheduling, and administrative dead-letter queue (DLQ) management.

```
Event Emission → Idempotency Check → Rule & Category Evaluator
                                           ↓
                               User Preference & Quiet Hours Check
                                           ↓
                                    Channel Dispatch
                     ┌─────────────────────┼─────────────────────┐
                     ↓                     ↓                     ↓
              In-App Alert            Email Gateway         Mobile / Web Push
```

## 2. Notification Categories & Mandatory Alerts
- **Security**: Security alert events (`password_changed`, `email_changed`, `suspicious_login`, `mfa_updated`, `account_recovery`). **Mandatory**: Security alerts bypass quiet hours and user opt-outs.
- **Jobs & Applications**: `job_alert`, `application_status_changed`, `interview_scheduled`, `interview_reminder`.
- **Connections & Messaging**: `connection_request`, `connection_accepted`, `new_message`, `mention`.
- **Communities & Support**: `community_invitation`, `moderation_action`, `support_ticket_update`.

## 3. Delivery Channels & Quiet Hours
- **In-App Notifications**: Stored in PostgreSQL `notifications` and published real-time over NATS JetStream WebSockets.
- **Email & Push**: Dispatched asynchronously via background worker queues.
- **Quiet Hours**: Non-critical notifications generated during quiet hours are deferred until the DND window closes.

## 4. Dead-Letter Queue (DLQ) & Analytics
- Unsuccessful delivery attempts exceeding 3 retries are moved to `notification_dead_letters`.
- Administrators can inspect failure reasons and trigger idempotent retries via `/admin/notifications/dead-letters/:id/retry`.
