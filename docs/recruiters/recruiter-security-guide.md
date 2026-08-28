# Kirmya Recruiter Security, Tenant Isolation & Anti-Scraping Manual

## 1. Security Architecture & Threat Defenses
- **Strict Tenant Isolation**: Database queries enforce `WHERE organization_id = $1` preventing IDOR across organizations.
- **Candidate Privacy Boundaries**: Candidate search history, private bookmarks, and non-organization applications are blocked from recruiter access.
- **Export Throttling & Audit**: Bulk candidate data export operations require organization admin credentials and trigger audit log entries.
