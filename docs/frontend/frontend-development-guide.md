# Kirmya Frontend Developer Guide & Component Conventions

## 1. Feature Module Organization
Frontend code is partitioned into domain-specific feature modules under `src/features/`:
- `src/features/auth`: User session, login, registration, email verification, MFA dialogs.
- `src/features/jobs`: Job search, filtering, salary sliders, bookmarking, and 1-Click apply.
- `src/features/community`: Group hubs, discussion threads, comment feeds, and moderation desk.
- `src/features/notifications`: Notification bell, category tabs, channel preferences matrix, and quiet hours.
- `src/features/security`: Multi-device manager, session revocation, API keys, and privacy consent.
- `src/features/admin`: System health studio, queue depths, incident manager, and support impersonation.
