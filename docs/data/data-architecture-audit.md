# Kirmya Data Architecture, Governance & Privacy-by-Design Audit

## Executive Summary
This document audits the authoritative PostgreSQL schema, referential integrity rules, 5-tier data classification hierarchy, automated retention engines, DSAR machine-readable exports, 30-day graceful deletion workflows, and irreversibly anonymized analytics aggregates.

---

## 1. Five-Tier Data Classification Hierarchy

| Level | Classification | Examples | Storage & Encryption | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **L1** | **Public** | Approved Job Postings, Public Organization Profiles | PostgreSQL, OpenSearch, CDN Cached | World-readable |
| **L2** | **Internal** | Application Categories, Industry Skill Taxonomies | PostgreSQL, Redis In-Memory | Authenticated Users |
| **L3** | **Confidential**| User Profile Bios, Work Experience, Education | PostgreSQL, At-Rest Encrypted | Resource Owner + Connections |
| **L4** | **Sensitive** | Job Applications, Resumes, Candidate Scorecards | PostgreSQL, S3 Encrypted, Pre-Signed URLs | Candidate + Hiring Org Recruiter |
| **L5** | **Highly Sensitive**| Bcrypt Password Hashes, MFA TOTP Secrets, Audit Logs | PostgreSQL Dedicated Tablespace, Redacted in Logs | Auth Subsystem / Super Admin Only |
