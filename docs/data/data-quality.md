# Kirmya Data Quality & Integrity Assurance

## Data Quality Checks & Monitoring

| Quality Rule | Validation Criteria | Automated Enforcement | Diagnostic Action |
| :--- | :--- | :--- | :--- |
| **Email Format** | RFC 5322 regex validation | API Handler & DB CHECK constraint | Rejection on ingest |
| **URL Integrity** | Valid HTTP/HTTPS format | Service Layer validation | Sanitize or reject |
| **Orphan Record Guard**| FK integrity across all tables | Database FK constraints (`ON DELETE CASCADE/RESTRICT`) | Nightly integrity check |
| **Null Rate Audit** | Critical columns marked `NOT NULL` | PostgreSQL Schema Definition | Migration block |
| **Search Sync Sync** | PostgreSQL vs OpenSearch count mismatch | Scheduled sync reconciler | Re-index queued records |
