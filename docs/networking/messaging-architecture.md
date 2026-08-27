# Kirmya Direct Messaging & Conversation Architecture

## 1. Storage & Delivery Separation
- **Persistent Source of Truth**: PostgreSQL `messages` and `conversations` tables store all message contents, server timestamps, sender IDs, and read receipts.
- **Real-Time Distribution Layer**: Redis Pub/Sub + WebSocket hub dispatches instant events to connected client instances.
- **Offline & Reconnection Guarantee**: Clients fetch authoritative unread messages from REST API upon reconnection (`GET /api/v1/messages/conversations/:id/messages?after=last_seen_id`).
