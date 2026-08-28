# Kirmya Recruiter Security & Organization Isolation Guide

## 1. Security Safeguards & Tenant Isolation
- **Strict Query Scoping**: Every database lookup enforces `WHERE organization_id = $1` preventing IDOR and cross-tenant leakage.
- **Candidate PII Shielding**: Contact information and resumes are accessible exclusively within active application evaluation windows.
- **Audit Logging**: Sensitive actions (member invitations, role modifications, job closures, candidate exports) generate immutable audit records.
