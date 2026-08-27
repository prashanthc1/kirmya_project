# Kirmya Unified Notification & Communication Center Documentation Hub

Welcome to the Unified Notification Engine, Multi-Channel Delivery (In-App, Email, Push-Ready), Quiet Hours, and Dead Letter Queue documentation for Kirmya.

## Documentation Index

- [`notification-system-audit.md`](notification-system-audit.md): Complete audit of multi-channel routing, idempotency keys, and security bypasses.
- [`notification-architecture.md`](notification-architecture.md): Domain entity models, categories, severities, and REST API endpoints.
- [`notification-events.md`](notification-events.md): NATS domain event mapping, idempotency deduplication, and channel defaults.
- [`email-system.md`](email-system.md): HTML template engine, sanitization safeguards, and anti-spam rate limits.
- [`notification-preferences.md`](notification-preferences.md): Channel preference matrix, frequency controls, and quiet hours configuration.
- [`notification-privacy.md`](notification-privacy.md): Zero private message content exposure and organization isolation.
- [`notification-retry-strategy.md`](notification-retry-strategy.md): Exponential backoff algorithms and Dead Letter Queue (DLQ) operations.

## User & Admin Notification UI

- User Notification Center: `/notifications`
- Notification Preferences: `/settings/notifications`
- Admin Broadcast Desk: `/admin/notifications/broadcast`
- Admin DLQ Manager: `/admin/notifications/dlq`
