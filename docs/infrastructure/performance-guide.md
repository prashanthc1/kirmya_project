# Kirmya High-Performance Engineering & Web Vitals Manual

## 1. Web Vitals & Backend Performance Baselines
- **Core Web Vitals**: Largest Contentful Paint (LCP) < 2.0s, First Input Delay (FID) / INP < 100ms, Cumulative Layout Shift (CLS) < 0.05.
- **Backend Latency Budget**: Auth endpoints P95 < 150ms, search endpoints P95 < 300ms, application submit P95 < 250ms.
- **Frontend Optimization**: MUI v6 tree-shaking, dynamic route code-splitting, Next.js image optimization, and font preloading.
