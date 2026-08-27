# Kirmya Notification Communication Preferences & Quiet Hours

## 1. Channel Matrix & Granular Controls
Users configure delivery channels (`In-App`, `Email`, `Push`) independently across each functional category at `/settings/notifications`.

---

## 2. Quiet Hours (Do Not Disturb)
- Users specify daily start and end times (e.g. `22:00` to `08:00`) in their configured local IANA time zone.
- Non-critical alerts arriving during quiet hours are queued and delivered as a morning batch digest at `08:00`.
- Critical security notifications immediately bypass quiet hours to protect account integrity.
