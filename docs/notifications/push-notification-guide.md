# Kirmya Web & Mobile Push Notification Manual

## 1. Push Notification Pipeline & Token Registration
- **Web Push (VAPID)**: Browser notifications with standard service-worker integration and user subscription management.
- **Payload Privacy**: Push notification titles and summaries contain actionable metadata without exposing private message bodies or sensitive resume data.
- **Device Management**: Automatic pruning of expired push subscription tokens upon receiving 410 Gone status codes from push gateways.
