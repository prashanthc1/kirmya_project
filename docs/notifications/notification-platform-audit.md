# Kirmya Notification, Alerts & Communication Preferences Audit

## Executive Summary
This document audits the complete Notification Pipeline, In-App Delivery Center, Email Service, Channel Delivery Matrix (In-App, Email, Push), Deduplication Engine, Quiet Hours Enforcer, and Admin Dead-Letter Queue across Kirmya.

---

## 1. Notification Capabilities Overview
- **Multi-Channel Delivery Engine**: In-app notifications with real-time WebSocket sync, responsive email notifications via SMTP/SendGrid, and browser push notification readiness.
- **Event-Driven Architecture**: Decoupled NATS JetStream event publishing with deterministic `IdempotencyKey` deduplication.
- **Granular User Preferences**: Channel delivery matrix per category (`Security`, `Jobs`, `Applications`, `Interviews`, `Networking`, `Messaging`, `Communities`), Do Not Disturb Quiet Hours, and Daily/Weekly Digest settings.
- **Critical Alert Guarantees**: High-priority security and account recovery notifications bypass normal quiet hours and marketing toggles.
