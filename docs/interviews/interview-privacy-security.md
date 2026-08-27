# Kirmya Interview Security & Privacy Architecture

## 1. Meeting Link Authorization
- Meeting URLs (Zoom, Google Meet, Microsoft Teams) are exposed only via authorized `GET /api/v1/interviews/:id/meeting-link` requests.
- Anonymous or unauthenticated requests are blocked with HTTP 401/403.

---

## 2. Notification Privacy
- Automated interview reminder emails and in-app alerts disclose only session date, time zone, format, and meeting instructions.
- Sensitive interviewer internal notes and candidate resume salary details are excluded from all notification templates.
