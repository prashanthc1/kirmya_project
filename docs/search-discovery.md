# Kirmya Search, Discovery & Global Search Experience — Architecture & Operational Guide

## Overview

The **Search, Discovery & Global Search Experience** module provides fast, secure, relevant, and scalable search across jobs, people, companies, communities, and other publicly searchable Kirmya content while respecting privacy, blocking, Trust & Safety restrictions, permissions, ranking rules, and personalization.

Kirmya is 100% free for candidates and employers. No subscription, payment, or pay-to-rank features are present.

```
Frontend (Next.js + MUI v6)                      Backend (Go 1.26 + Gin)
┌─────────────────────────────────┐              ┌─────────────────────────────────────┐
│  /search                        │─── HTTP ────▶│  SearchHandler (delivery/http)      │
│  /search?q=...&category=...     │              │         │                           │
│  GlobalSearchBar                │              │  SearchService (service)          │
│  SearchResultCard               │              │         │                           │
│  SearchFiltersSidebar           │              │  SearchEngineAdapter (adapter)    │
│  RecentSearchesManager          │              │  ├── OpenSearch (primary cluster)   │
│  SearchEmptyState               │              │  └── PostgreSQL tsvector (fallback) │
└─────────────────────────────────┘              └─────────────────────────────────────┘
```

---

## Key Features & Functional Modules

### 1. Global Search Interface (`/search`)
Unified global search page and command bar:
- **Global Search Bar** (`GlobalSearchBar.tsx`): Polished MUI `Autocomplete` input with categorized live suggestions (Jobs, People, Companies, Communities), clear button, keyboard navigation, and recent search history dropdown.
- **Unified Results View** (`/search` & `SearchResultCard.tsx`): Mixed results prioritized by relevance with category tabs (`All`, `Jobs`, `People`, `Companies`, `Communities`), result count indicators, and dark/light Glassmorphism cards.
- **Facet Filters Sidebar** (`SearchFiltersSidebar.tsx`): Multi-select filters for location, work arrangement (Remote, Hybrid, On-site), employment type, experience level, industry, and skills.
- **Recent Searches Manager** (`RecentSearchesManager.tsx`): Self-service history manager allowing users to view, delete individual entries, or clear all search history.
- **Search Empty State** (`SearchEmptyState.tsx`): Helpful empty state with alternative keyword suggestions and filter reset triggers.

### 2. Search Engine Architecture & PostgreSQL Fallback
- **OpenSearch Cluster**: Primary search engine executing structured DSL queries across indices (`kirmya_jobs`, `kirmya_people`, `kirmya_companies`, `kirmya_communities`).
- **PostgreSQL Fallback**: When OpenSearch is offline or unconfigured, search seamlessly falls back to PostgreSQL Full-Text Search using `tsvector` and `GIN` indexes.

---

## Safety, Privacy & Ranking Rules

### 1. Privacy & Blocking Enforcement
- **Blocked Users & Companies**: Queries automatically cross-reference `IsBlocked(userID, targetID)`. Blocked users and companies never appear in search results or autocomplete suggestions.
- **Profile Visibility**: Respects user privacy settings (`public`, `connections_only`, `private`). Private profiles do not appear in public search.
- **Trust & Safety Restrictions**: Suspended accounts, suspended companies, and removed jobs are automatically excluded from search indexes and results.

### 2. Query Normalization & Typo Tolerance
- **Normalization**: Trims whitespace, lowercases input, and strips irrelevant punctuation while preserving search intent.
- **Typo Tolerance & Synonyms**: Maps common professional typos ("softwere" → "software") and occupational synonyms ("software developer" = "software engineer").

### 3. No Pay-To-Rank Guarantee
Kirmya search ranking is strictly based on text relevance, freshness, quality, and user skill match. No paid placements, sponsored results, or recruiter boosts exist.

---

## API Endpoints

### Unified Search API (`/api/v1/unified-search/...`)
| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| `GET` | `/api/v1/unified-search` | Execute global search with category & filters | Yes |
| `GET` | `/api/v1/unified-search/suggestions` | Get categorized autocomplete suggestions | Yes |
| `GET` | `/api/v1/unified-search/history` | Get user's recent search history | Yes |
| `DELETE` | `/api/v1/unified-search/history/:id` | Delete single search history item | Yes |
| `DELETE` | `/api/v1/unified-search/history` | Clear all user search history | Yes |
| `POST` | `/api/v1/unified-search/preferences` | Save search preference & alert criteria | Yes |
| `POST` | `/api/v1/unified-search/reindex` | Trigger search index synchronization | Admin |
