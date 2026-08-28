# Kirmya Notification Platform Developer Guide

## 1. Publishing Typed Notification Events
- **Event Contracts**: Use the standard `events.Publish(ctx, eventType, payload)` helper in `internal/shared/events`.
- **Deduplication Key**: Always include a deterministic `IdempotencyKey` formatted as `{entity}:{id}:{action}` to prevent duplicate alerts.
- **Deep Links**: Provide safe relative paths (e.g. `/jobs/view/123`, `/network/requests`) that revalidate authorization upon navigation.
