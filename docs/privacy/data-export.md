# Kirmya Data Subject Access Request (DSAR) & Data Export

## 1. Machine-Readable Export Schema
Users can request a complete ZIP archive of their personal data (`/settings/privacy/export`) containing structured JSON files:
- `profile.json`: Full biographical details, contact info, and education.
- `experience.json`: Job history and project achievements.
- `applications.json`: Application history, submitted resumes, and statuses.
- `connections.json`: 1st-degree connection network.
- `consent_records.json`: Chronological audit log of accepted terms and cookie preferences.

---

## 2. Secure Temporary Delivery
Export archives are encrypted at rest with AES-256 and accessible via pre-signed URLs expiring in 24 hours.
