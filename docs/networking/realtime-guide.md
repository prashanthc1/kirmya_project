# Kirmya WebSocket & Real-Time Communication Guide

## 1. WebSocket Lifecycle & Resilient Sync
1. **Authenticated Connection**: Client connects via `GET /api/v1/ws` passing secure session cookie or bearer token in query parameter.
2. **Heartbeat Protocol**: Client/server ping-pong every 30 seconds to detect dead TCP sockets.
3. **Exponential Backoff Reconnect**: On disconnect, frontend retries at 1s, 2s, 4s, 8s (up to 30s max with jitter).
4. **Transient State Governance**: Typing indicators (`is_typing`) and online presence have 5-second Redis TTLs and are never written to PostgreSQL.
