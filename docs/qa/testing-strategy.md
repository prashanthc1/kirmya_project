# Kirmya Quality Engineering Testing Strategy

## 1. Test Pyramid & Automation Hierarchy
- **Unit & Component Testing (60%)**: Fast Go service unit tests and Next.js Vitest component tests verifying business rules, hooks, and form validations.
- **Integration & API Contract Testing (30%)**: Real PostgreSQL repository integration tests and Gin HTTP contract tests matching OpenAPI schemas.
- **End-to-End User Journeys (10%)**: Critical user flows (Job Seekers, Recruiters, Communities) verified via automated browser harnesses.
