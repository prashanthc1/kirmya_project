# Kirmya Real-Time Event & Cross-Tab State Synchronization

## 1. Cross-Tab Synchronization (`BroadcastChannel`)
- **Logout Event**: When a user logs out in Tab A, a `KIRMYA_AUTH_LOGOUT` broadcast message forces Tab B to clear local session state and navigate to `/login`.
- **Theme Sync**: Theme preferences (`light`, `dark`, `system`) broadcast across open tabs instantly using the `storage` event listener.

---

## 2. Real-Time Event Invalidation (NATS / WebSockets)
- Server-sent events or WebSocket notifications invalidates specific SWR/React Query keys (e.g. `kirmya:notifications:unread`, `kirmya:messages:latest`) without forcing a full page reload or broad cache purge.
