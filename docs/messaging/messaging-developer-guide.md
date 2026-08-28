# Kirmya Messaging Platform Developer Guide & Real-Time Protocols

## 1. WebSocket Protocol & Reconnection
- **Authentication**: Pass valid session bearer token in WebSocket upgrade handshake (`/ws/messages?token=...`).
- **Heartbeat & Keepalive**: Client transmits `ping` frames every 30 seconds; server responds with `pong` to prevent proxy timeouts.
- **Offline Sync**: Upon reconnection, clients fetch missed messages via `GET /api/v1/messages/conversations/:id/messages?after_id=...`.
