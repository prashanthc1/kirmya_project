# Kirmya Search Platform Architecture & Query Pipelines

## 1. Search Engine Architecture & Failover Mechanics

```
┌─────────────────────────────────────────────────────────────┐
│                 Client Search Input (/search)               │
│        (Global Bar, Autocomplete, Debounce & Categories)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Search Service Gateway & Router             │
│   (Query Sanitization, Synonyms, Typo Tolerance, RBAC Check)│
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────┐             ┌───────────────────────┐
│  OpenSearch Cluster   │  (Failover) │  PostgreSQL Full-Text │
│ (Edge-Ngrams & BM25)  │ ──────────> │ (tsvector & pg_trgm)  │
└───────────────────────┘             └───────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              Authorization-Filtered Result Ranking          │
│         (Freshness, Match Quality, Trust & Safety Desk)     │
└─────────────────────────────────────────────────────────────┘
```
