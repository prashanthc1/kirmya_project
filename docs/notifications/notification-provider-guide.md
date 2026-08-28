# Kirmya Notification Provider Abstraction & Dispatcher Guide

## 1. Provider-Agnostic Channel Dispatching
- **Channel Routing**: Centralized notification engine selects appropriate delivery channels (In-App, Email, Push) based on user channel preferences.
- **Circuit Breakers & Retries**: Transient provider outages trigger exponential backoff retries without blocking core transactional pipelines.
- **Dead-Letter Queue (DLQ)**: Permanently un-deliverable notifications are persisted in PostgreSQL DLQ tables for administrative diagnostics.
