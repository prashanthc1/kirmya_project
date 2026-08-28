# Kirmya Notification & Multi-Channel Communication Platform Audit

## Executive Summary
This document audits the Centralized Notification Platform, In-App Notification Center, Event-Driven NATS Architecture, Transactional Email Subsystem, Mobile Push Tokens, Channel Delivery Matrices, Idempotency & Deduplication Engine, and Admin Dead-Letter Queue (DLQ) operations.

---

## 1. Notification Infrastructure Overview
- **Persistent Source of Truth**: PostgreSQL stores all in-app notifications, delivery records, user preference matrices, and quiet hours schedules.
- **Event-Driven Broker**: NATS JetStream handles asynchronous dispatching of domain events (`job.alert`, `application.status_changed`, `interview.scheduled`, `security.login_alert`, `messaging.new_message`).
- **Channel Routing Engine**: Matrix-based routing evaluating user category preferences across In-App, Transactional Email, and Mobile Push.
- **Critical Security Override**: Account security and authentication notifications bypass quiet hours and opt-outs.
