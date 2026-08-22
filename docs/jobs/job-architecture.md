# Kirmya Job Domain Architecture & OpenSearch Indexing

## 1. Domain Entity Definition (`backend/internal/jobs/models/job.go`)
- **Core Attributes**: `ID`, `OrganizationID`, `RecruiterID`, `Title`, `DescriptionHTML` (Sanitized), `EmploymentType` (`full_time`, `part_time`, `contract`, `internship`), `WorkMode` (`remote`, `hybrid`, `on_site`), `Location`, `Department`, `ExperienceLevel` (`entry`, `mid`, `senior`, `lead`, `executive`), `Skills` ([]string), `SalaryRange`, `Status` (`draft`, `published`, `paused`, `closed`, `archived`), `PublishedAt`, `ClosedAt`.

---

## 2. Search Index Synchronization
- **Event-Driven Indexing**: Job creation, updates, and status transitions emit NATS events (`job.published`, `job.closed`) to update the OpenSearch `kirmya_jobs` index.
- **PostgreSQL Fallback**: If OpenSearch is offline, job search seamlessly falls back to parameterized SQL queries with full-text search indexes (`tsvector`).
