# Kirmya Candidate Career Identity & Profile Platform Audit

## Executive Summary
This document audits the Candidate Professional Profile system, Multi-Version Resume Builder, Experience & Skills Taxonomy, Recruiter Visibility Controls, and AI Job Fit Assistance across Kirmya.

---

## 1. Profile Infrastructure Overview
- **Authoritative Persistence**: PostgreSQL is the transactional source of truth for user profiles, work experiences, education histories, skill proficiencies, and resume versions.
- **Privacy & Visibility Granularity**: Granular controls (`Public`, `Recruiter-Visible`, `Connections-Only`, `Private`) evaluated at query level to shield sensitive career history and contact details.
- **Secure Resume Management**: Pre-signed S3 download links with 15-minute expiration; public permanent file access is strictly blocked.
- **Explainable AI Career Fit**: AI assistance provides transparent skill-gap suggestions without driving irreversible hiring decisions.
