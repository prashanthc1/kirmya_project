# Kirmya API Pagination, Filtering & Sorting Standards

## 1. Pagination Strategies

Kirmya implements two standardized pagination patterns depending on data characteristics and collection volume:

### 1.1 Offset-Based Pagination (Standard Catalogues & Directories)
Used for searchable directories, job boards, community listings, and application history where users need page numbers and jump-to-page navigation.

#### Query Parameters:
- `page`: 1-based page index (default: `1`, minimum: `1`).
- `limit` / `pageSize`: Number of items per page (default: `20`, maximum: `100`).

#### Response Metadata:
```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 184,
    "totalPages": 10,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

### 1.2 Cursor-Based Pagination (High-Volume Feeds & Messaging)
Used for infinite-scroll feeds, direct messaging chat history, and audit log streams where insertions are frequent and offset drift must be prevented.

#### Query Parameters:
- `cursor`: Opaque base64 encoded token representing the sort key of the last item.
- `limit`: Items per request (default: `20`, maximum: `100`).

#### Response Metadata:
```json
{
  "data": [ ... ],
  "meta": {
    "nextCursor": "ZXlKaGJHY2lPaUpTVXpVbkxhc3RNZXNzYWdlVGltZ...",
    "hasNext": true
  }
}
```

---

## 2. Parameter Validation & Safety Rules

1. **Upper Bound Enforcement**: All endpoints strictly constrain the maximum page size (`limit <= 100`). Values exceeding 100 are automatically clamped to 100 or rejected with `400 Bad Request`.
2. **Negative Index Rejection**: Page numbers `<= 0` are rejected or normalized to `1`.
3. **Expensive COUNT Suppression**: For high-velocity feeds with millions of rows, total count computation is skipped or estimated using materialized statistics to avoid PostgreSQL sequence scan overhead.

---

## 3. Filtering & Sorting Architecture

1. **Strict Sort Field Allowlists**: Handlers and repositories validate `sort` and `order` query parameters against predefined allowlists (e.g. `created_at`, `title`, `company`, `relevance`). Unrecognized sort parameters are rejected.
2. **Parameterized SQL Queries**: All dynamic filtering expressions (`status`, `category`, `industry`, `location`) are bound using parameterized SQL placeholders (`$1, $2, ...`) via `pgxpool`. Raw SQL string concatenation is strictly prohibited.
