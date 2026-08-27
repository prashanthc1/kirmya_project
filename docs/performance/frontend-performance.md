# Kirmya Frontend Performance & MUI v6 Optimization

## 1. Bundle & Render Optimization
- **Next.js App Router**: Route-level code splitting ensures page bundles load only necessary components.
- **Dynamic Lazy Loading**: Heavy admin analytics charts, security dashboards, and PDF viewer modules are lazy-loaded via `next/dynamic`.
- **MUI v6 Theme Caching**: Theme objects and glassmorphic aesthetic tokens are memoized outside component render loops to avoid re-instantiating emotion style sheets.

---

## 2. Core Web Vitals Targets
- **Largest Contentful Paint (LCP)**: <= 1.8 seconds.
- **Interaction to Next Paint (INP)**: <= 100 milliseconds.
- **Cumulative Layout Shift (CLS)**: <= 0.05.
- **Time to First Byte (TTFB)**: <= 200 milliseconds.
