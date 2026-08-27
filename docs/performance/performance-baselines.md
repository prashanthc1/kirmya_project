# Kirmya Performance Baselines, Latency SLOs & Resource Budgets

## 1. Latency Service Level Objectives (SLOs)

| Endpoint Category | P50 (Target) | P95 (Target) | P99 (Target) | Error Budget (Monthly) |
| :--- | :--- | :--- | :--- | :--- |
| **Job Search & Filters** (`/api/v1/jobs`) | < 35ms | < 120ms | < 250ms | 99.9% availability |
| **User Profile Retrieval** (`/api/v1/profile/*`)| < 20ms | < 80ms | < 180ms | 99.95% availability |
| **Application Submission** (`/api/v1/applications`) | < 45ms | < 150ms | < 300ms | 99.99% availability |
| **Real-Time Messages** (`/api/v1/messages/*`)| < 15ms | < 50ms | < 120ms | 99.95% availability |

---

## 2. Frontend Performance Budgets
- **First Contentful Paint (FCP)**: < 1.2s
- **Largest Contentful Paint (LCP)**: < 2.2s
- **Cumulative Layout Shift (CLS)**: < 0.05
- **Interaction to Next Paint (INP)**: < 150ms
- **Total JavaScript Bundle Size**: < 180KB (gzipped per route)
