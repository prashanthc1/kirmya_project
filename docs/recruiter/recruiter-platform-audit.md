# Kirmya Recruiter, Employer & Organization Management Platform Audit

## Executive Summary
This document audits the Organization Hierarchy, Company Profiles, Multi-Tenant Hiring Workspaces, Recruiter RBAC Permissions, Job Ownership, Candidate Triage, and Auditability across Kirmya.

---

## 1. Recruiter Infrastructure Overview
- **Authoritative Persistence**: PostgreSQL is the transactional source of truth for organization structures, hiring workspaces, member roles, and candidate notes.
- **Strict Multi-Tenant Employer Isolation**: Scoped at the database query layer (`WHERE organization_id = $1`); recruiters from Organization A can never access Organization B's candidates, jobs, or private notes.
- **Granular RBAC Permission Matrix**: Explicit role assignments (`Owner`, `Admin`, `Recruiter`, `Hiring Manager`, `Interviewer`, `Viewer`) evaluated server-side on every API mutation.
- **Zero Fees Guarantee**: Employer workspaces, job postings, and candidate messaging are 100% free for organizations and job seekers.
