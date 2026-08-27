# Kirmya Frontend Performance & Core Web Vitals Optimization

## 1. Performance Standards & Budgets
- **Largest Contentful Paint (LCP)**: < 1.8s via Next.js server-side font optimization and image preloading.
- **Interaction to Next Paint (INP)**: < 100ms via debounced search inputs (300ms) and memoized MUI component trees.
- **Cumulative Layout Shift (CLS)**: < 0.05 via structured skeleton placeholders on async card feeds.
- **Bundle Optimization**: Dynamic lazy loading (`next/dynamic`) for heavy charting libraries and admin consoles.
