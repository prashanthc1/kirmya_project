# Kirmya Company & Employer Brand Platform Comprehensive Audit

## Executive Summary
This document audits the Public Company Profiles, Employer Branding Showcase, Organization Verification Badges, Company Following mechanics, Moderated Employee Reviews, and OpenSearch Company Discovery across Kirmya.

---

## 1. Company Ecosystem Overview
- **Authoritative Persistence**: PostgreSQL is the transactional source of truth for company legal profiles, verified badges, follower associations, and moderated reviews.
- **Strict Public vs Private Boundaries**: Public company pages display exclusively verified public metadata, culture statements, and active job openings; internal hiring team discussions and recruiter notes are completely sealed.
- **Verification Integrity**: Company verification badges are granted exclusively through Platform Admin review workflows; self-verification by company admins is blocked.
- **100% Free Employer Presence**: Public branding pages, company following, and job listings are free with zero paid placement fees or sponsored review monetization.
