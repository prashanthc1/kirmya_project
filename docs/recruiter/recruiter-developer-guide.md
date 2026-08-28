# Kirmya Recruiter Platform Developer Guide & API Contracts

## 1. Recruiter API Integration & Multi-Tenant Scoping
- **Organization Scoping**: API endpoints under `/api/v1/recruiter/...` and `/api/v1/organization/...` extract the caller's authorized `organization_id` from the validated JWT claims.
- **Transactional Candidate Operations**: State transitions and private notes are written inside PostgreSQL transactions with outbox event emission.
