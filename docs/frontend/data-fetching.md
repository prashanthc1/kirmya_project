# Kirmya Frontend Data Fetching & Typed API Clients

## 1. Typed API Client Architecture
All frontend network calls are executed through centralized typed API client modules (`securityApi.ts`, `privacyApi.ts`, `notificationApi.ts`, `communityApi.ts`, `adminApi.ts`). Ad-hoc `fetch()` calls inside React UI components are prohibited.

---

## 2. Retry & Backoff Strategy
- **Transient Failures (HTTP 502, 503, 504, Network Error)**: Automatically retried up to 3 times with exponential backoff and jitter (`1000ms`, `2000ms`, `4000ms`).
- **Permanent Business Errors (HTTP 401, 403, 404, 409, 422)**: Immediate failure execution without retrying. Returns structured error envelope to UI error boundaries.
