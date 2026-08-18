# Kirmya Compliance Operations & Risk Management

## Overview
The Kirmya Compliance System handles regulatory oversight, compliance scoring, risk monitoring, privileged access reviews, privacy incident handling, and policy versioning.

## Compliance Overview & Health Score

`ComplianceOverview` synthesizes real-time regulatory readiness:
- **GDPR & CCPA Compliance Indicators**: Evaluates active legal holds, DPA completeness, and DSR fulfillment rates.
- **DSR Order Fulfillment SLA**: Tracks `AverageDSROrderFulfillmentDays` against regulatory SLA targets (30 days max).
- **Active Legal Holds & Retention Policies**: Overview of accounts under hold and automated retention policies in effect.

## Privacy Risk Monitoring & Scoring Engine

`PrivacyRiskSummary` aggregates weighted risk factors:
- **High / Medium / Low Risk Count**: Classifies unassigned DPAs, overdue DSR requests, unencrypted legacy columns, and open privacy incidents.
- **Automated Alerts**: Flags overdue DSR requests exceeding 25 days, missing DPA signatures on active sub-processors, or unresolved high-severity privacy incidents.

## Privileged RBAC Access Reviews
- Security team conducts periodic reviews (`data_access_reviews`) of administrative and support access roles.
- Tracks reviewer decisions (`approved`, `revoked`, `flagged`), role scopes, target user accounts, and audit notes.

## Privacy Incident Management
- System records privacy incidents (`privacy_incidents`) including breach type, severity (`low`, `medium`, `high`, `critical`), impacted user count, reporter details, and remediation timeline.
- Integrates with automated incident notification channels for regulatory breach reporting (72-hour GDPR notification window).

## Policy Versioning
- `privacy_policy_versions` maintains formal version history (`version_string`, `effective_date`, `changes_summary`, `status`).
- Enables mandatory consent re-acknowledgement when major policy changes take effect.

## API Endpoint Reference

### End-User Privacy API (`/api/v1/compliance/...` & `/api/v1/privacy/...`)
- `POST /api/v1/compliance/consent` - Update user privacy consent
- `GET /api/v1/compliance/consent` - Retrieve current consents
- `POST /api/v1/compliance/export` - Trigger GDPR data export package generation
- `GET /api/v1/compliance/export/download` - Download exported data package
- `POST /api/v1/compliance/delete-account` - Request account deletion (Right to be Forgotten)
- `GET /api/v1/compliance/requests` - List user's DSR history

### Admin Data Governance & Compliance API (`/api/v1/admin/...`)
- `GET/POST /api/v1/admin/data-governance/inventory` - Manage data catalog & classifications
- `GET/PATCH /api/v1/admin/compliance/dsr` - Review and assign DSR requests
- `GET/PUT/POST /api/v1/admin/data-governance/retention` - Manage retention policies & execute dry-runs/purges
- `GET/POST/PATCH /api/v1/admin/compliance/legal-holds` - Create and release legal holds
- `GET/POST /api/v1/admin/compliance/access-reviews` - Audit privileged access reviews
- `GET/POST /api/v1/admin/data-governance/processors` - Track third-party sub-processors & DPAs
- `GET/POST /api/v1/admin/data-governance/quality-checks` - Execute data quality checks
- `GET /api/v1/admin/compliance/risk-summary` - Fetch privacy risk score breakdown
- `GET /api/v1/admin/compliance/overview` - Fetch compliance status overview
- `GET/POST /api/v1/admin/compliance/incidents` - Log and resolve privacy incidents
- `GET/POST /api/v1/admin/compliance/policy-versions` - Manage policy versions
