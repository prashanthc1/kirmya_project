# Kirmya Search, Discovery & Intelligent Matching Comprehensive Audit

## Executive Summary
This document audits the Global Search Bar, OpenSearch Multi-Cluster Indices, PostgreSQL Trigram/GIN Fallback Engine, Explainable Job & Candidate Match Scoring, and Privacy-Scoped Autocomplete across Kirmya.

---

## 1. Search Ecosystem Overview
- **Hybrid Search Architecture**: Primary high-throughput query routing through OpenSearch with automatic, zero-downtime failover to PostgreSQL full-text and trigram GIN indexes.
- **Strict Authorization & Visibility Boundaries**: Search results strictly filter by viewer authorization; private profiles, hidden resumes, and non-organization applications are excluded prior to result ranking.
- **Fairness & Non-Discrimination**: Demographic attributes and protected characteristics are strictly barred from ranking algorithms, semantic matching vectors, and suggestion models.
- **100% Free Search & Matching**: Universal multi-facet search, candidate discovery, and job alerts are 100% free with zero paywalls.
