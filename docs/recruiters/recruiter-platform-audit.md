# Kirmya Recruiter & Employer Platform Comprehensive Audit

## Executive Summary
This document audits the Multi-Tenant Organization Hierarchy, Company Profiles, Employer Verification, Recruiter RBAC Permissions, Talent Pools, Saved Candidate bookmarks, and Anti-Scraping controls across Kirmya.

---

## 1. Recruiter Ecosystem Overview
- **Authoritative Source of Truth**: PostgreSQL persists organizations, hiring teams, role permissions, talent pool bookmarks, and private candidate notes.
- **Strict Multi-Tenant Query Boundaries**: Queries enforce `WHERE organization_id = $1` preventing cross-tenant leakage of candidate evaluations or job openings.
- **Candidate Privacy Boundaries**: Candidate private search behavior, bookmark history, and unshared application records are never exposed to recruiters.
- **Free for Job Seekers & Employers**: Zero candidate search paywalls, zero resume viewing fees, and zero recruiter seat monetization.
