# Kirmya Analytics Privacy Controls & User Consent

## 1. Consent-Aware Telemetry
- **Essential Metrics**: Server health, API latency, crash diagnostics (active by default for platform reliability).
- **Optional Analytics**: Feature clickstream, recommendation telemetry (enabled only when user grants analytics cookie consent at `/settings/privacy/cookies`).

---

## 2. Organization Boundary Protection
Recruiters and hiring managers query analytics strictly scoped to their verified organization jobs (`WHERE organization_id = recruiter_org_id`).
