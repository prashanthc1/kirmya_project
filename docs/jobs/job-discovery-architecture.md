# Kirmya Job Discovery Architecture & Recommendation Pipelines

## 1. Search & Recommendation Engine Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Candidate Discovery UI                   │
│        (MUI v6 Glassmorphism, Filters, Feed & Alerts)       │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
┌───────────────────────┐┌───────────┐┌───────────────────────┐
│  OpenSearch Indexer   ││ Redis Feeds││  PostgreSQL Fallback  │
│(Fuzzy, Synonyms, Boost││(Ephemeral)││(Full-Text & GIN Index)│
└───────────────────────┘└───────────┘└───────────────────────┘
```
