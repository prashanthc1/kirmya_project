# Kirmya People Search & OpenSearch Engine Specifications

## 1. Search Query Parameters & Filters
- `q`: Free-text search string matching Name, Headline, Current Role, Company, Industry, and Skills.
- `location`: Geographical location filter.
- `industry`: Industry category filter.
- `company`: Target company filter.
- `skills`: Required skills array.
- `page` & `pageSize`: Scalable page index (default `page=1`, `pageSize=20`, max `pageSize=100`).

---

## 2. Search Engine Dual Strategy
- **OpenSearch (Primary)**: Uses structured multi-match queries with typo-tolerance (`fuzziness: "AUTO"`), boosting exact name matches by `3.0x` and current job title by `2.0x`.
- **PostgreSQL Fallback (Resilience)**: When OpenSearch is unconfigured or offline, queries execute via parameterized PostgreSQL `ILIKE` / `tsvector` indexes.
