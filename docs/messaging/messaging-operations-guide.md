# SRE Operations Guide: WebSocket Hub, Redis Pub/Sub & Delivery Monitoring

## 1. WebSocket Health & Ephemeral State Monitoring
1. **Concurrent Connection Metrics**: Monitor active WebSocket connection counts and Redis pub/sub channel subscriptions.
2. **Slow Consumer Handling**: Terminate stalled WebSocket client connections that exceed the 100-message buffer threshold.
3. **Redis Cluster Failover**: Transparent fallback to long-polling mode if Redis pub/sub temporarily drops.
