# Kirmya Mobile Push Notification & Device Token Architecture

## 1. Device Token Lifecycle
- **Registration**: Authenticated clients register APNs/FCM device tokens via `POST /api/v1/notifications/devices`.
- **Token Rotation & Invalidation**: Expired or uninstalled tokens reported by push gateways are flagged and purged automatically.
- **Privacy Safeguards**: Push payloads contain minimal alerts without displaying full private message contents or sensitive user details.
