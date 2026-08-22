# Kirmya API Pagination & Filtering Standards

## 1. Offset & Cursor Pagination Parameters
- `page`: Page index (1-based, default `1`).
- `pageSize`: Items per page (default `20`, maximum `100`).
- `cursor`: Opaque base64 token for high-volume infinite scroll datasets (e.g. messaging feeds).

## 2. Bounded Page Sizes
API endpoints enforce strict page size upper limits (`pageSize <= 100`) to prevent unbounded queries from exhausting database connection memory.

## 3. SQL Injection Defense
Filter parameters (`category`, `status`, `location`, `sort`) are validated against strict string allowlists in the service layer prior to SQL query construction.
