# Kirmya Search, Discovery, Candidate Matching & Recommendation Engine

## 1. Architectural Overview

The Kirmya Search & Discovery subsystem provides unified, multi-entity search across Jobs, People, Organizations, and Communities, complemented by AI-assisted Candidate Discovery, Talent Pools, and Personalized Recommendations.

```
Search Client (Next.js / TypeScript / MUI v6)
        │
        ▼
Search Delivery Handler (/api/v1/search/...)
        │ (JWT Context Extraction & Privacy Filters)
        ▼
Search Service Layer (internal/search/service)
        │
        ├─────────────────────────────┬─────────────────────────────┐
        ▼                             ▼                             ▼
OpenSearch Engine             PostgreSQL Fallback            Recommendation Engine
(Vector & Full-Text Search)   (GIN Trigram & ILIKE)          (internal/recommendation)
```

---

## 2. Supported Entity Categories & Facets

1. **All (`CategoryAll`)**: Aggregated results across jobs, people, companies, and communities.
2. **Jobs (`CategoryJobs`)**: Filterable by title, skills, location, employment type, remote status, and salary range.
3. **People / Profiles (`CategoryPeople`)**: Professional identity search respecting public/private visibility and blocked status.
4. **Organizations / Companies (`CategoryCompanies`)**: Verified employers and organizations.
5. **Communities (`CategoryCommunities`)**: Public groups and professional discussion hubs.

---

## 3. OpenSearch & PostgreSQL Fallback Strategy

- **Primary Indexer**: When `OPENSEARCH_URL` is configured, search queries execute against clustered OpenSearch indexes with relevance scoring ($TF\text{-}IDF$ / BM25).
- **PostgreSQL Fallback**: When OpenSearch is disabled or offline, queries seamlessly degrade to PostgreSQL parameterized queries utilizing GIN full-text indexes and `pg_trgm` fuzzy matching without breaking the user experience.

---

## 4. Privacy & Authorization Boundaries

- **Blocked Entities**: Users blocked via the Trust & Safety module are automatically filtered from people search and recommendation results.
- **Private Profiles & Fields**: Sensitive contact details (phone, private email, exact salary requirements) are stripped from public search DTOs.
- **Moderated / Suspended Resources**: Closed jobs, banned users, and suspended communities are strictly excluded from index queries.

---

## 5. REST API Endpoint Directory

| Method | Endpoint | Description | Auth Requirement |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/search` | Unified global search across categories | Public / Auth |
| `GET` | `/api/v1/search/suggestions` | Typeahead autocomplete suggestions | Public / Auth |
| `GET` | `/api/v1/search/history` | User recent search history | Bearer Token |
| `DELETE` | `/api/v1/search/history/:id` | Remove item from search history | Bearer Token |
| `POST` | `/api/v1/search/saved` | Save search query and filters | Bearer Token |
| `GET` | `/api/v1/search/saved` | List saved searches | Bearer Token |
| `POST` | `/api/v1/search/candidates` | Recruiter candidate search | Recruiter RBAC |
| `POST` | `/api/v1/search/talent-pools` | Create recruiter talent pool | Recruiter RBAC |
| `POST` | `/api/v1/search/candidates/compare` | Compare candidates side-by-side | Recruiter RBAC |
| `GET` | `/api/v1/recommendations` | Personalized job & network recommendations | Bearer Token |
| `POST` | `/api/v1/recommendations/feedback` | Submit recommendation feedback (like/dismiss) | Bearer Token |
| `PUT` | `/api/v1/recommendations/preferences` | Update recommendation preference criteria | Bearer Token |
