# Kirmya Job Discovery, Search & Recommendations Platform Audit

## Executive Summary
This document audits the Global Job Search engine, Advanced Filter facets, OpenSearch multi-field indexer, Deterministic & AI Job Recommendations, Saved Search Alerts, and Fair Ranking controls across Kirmya.

---

## 1. Job Discovery Ecosystem Overview
- **Authoritative Source vs Index**: PostgreSQL is the transactional source of truth; OpenSearch acts as a performant search and autocomplete layer with automated event synchronization.
- **Fair & Objective Ranking**: Search rankings rely exclusively on skill match, experience fit, location proximity, and job freshness; protected demographic attributes are strictly excluded.
- **Privacy-Safe User Personalization**: Candidate search history, saved jobs, and recommendation interactions remain private and are never disclosed to recruiters.
- **Zero-Fee Career Recovery**: Job discovery, personalized alerts, and search recommendations remain 100% free with no paid boosting or sponsored post monetization.
