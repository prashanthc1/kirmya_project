# Kirmya Frontend Performance & Bundle Optimization

## 1. Code Splitting & Dynamic Imports
- **Route-Based Splitting**: Next.js App Router automatically code-splits pages at route boundaries.
- **Component Dynamic Imports**: Heavy visual modules (e.g. `Recharts` analytics graphs, PDF resume renderers, admin security dashboards) are lazy-loaded via `next/dynamic` with skeleton fallbacks.

---

## 2. MUI v6 Render & Theme Optimization
- Theme objects and glassmorphic aesthetic tokens are memoized outside component render loops to avoid re-instantiating Emotion style sheets.
- List virtualization (`react-window`) is enforced for high-cardinality tables and notification popovers (> 50 items).
