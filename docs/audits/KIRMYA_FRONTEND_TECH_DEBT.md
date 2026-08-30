# Kirmya Frontend Technical Debt Matrix (Prompt 12/50)

**Date**: August 30, 2026  
**Auditor**: Antigravity AI (Google DeepMind)  
**Status**: ACTIVE TECHNICAL DEBT REGISTER  

---

## Technical Debt Inventory

| ID | Issue Description | Location | Severity | Impact | Recommendation | Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| **TD-01** | Duplicate / Unconsolidated Axios Client Instances | `features/*/api.ts` | **P2** | Divergent interceptors or base URL definitions across feature modules. | Consolidate all feature API calls through unified `services/api.ts` client. | 🟡 Managed |
| **TD-02** | Scattered Route String Literals | `app/**/*.tsx` | **P2** | Risk of typos or broken deep links when routes evolve. | Adopt centralized `shared/routes.ts` constants across all links and routers. | 🟢 Resolved (`ROUTES` created) |
| **TD-03** | Ad-hoc Empty & Error UI Displays | `components/**/*.tsx` | **P2** | Inconsistent look, missing retry actions, unhandled edge cases. | Use unified `EmptyState` and `ErrorState` components from `components/common/`. | 🟢 Resolved (Primitives created) |
| **TD-04** | Global Uncaught Client UI Crashes | Root Tree | **P1** | Component crash destroys whole page without user recovery path. | Wrapped root tree in `ErrorBoundary` with telemetry reporting. | 🟢 Resolved |
| **TD-05** | Direct Window Navigation vs Next/Link | `components/**/*.tsx` | **P2** | Full page reloads instead of SPA client-side transitions. | Replace raw `<a>` and `window.location` with Next.js `Link` and `useRouter`. | 🟡 Managed |
| **TD-06** | Inconsistent Timestamp / Salary Formatting | `features/**/*.tsx` | **P3** | Date/currency formatting variations across cards and tables. | Standardize across `shared/utils/date.ts` and `shared/utils/currency.ts`. | 🟢 Resolved (Utils created) |
| **TD-07** | Heavy Admin Bundle Chunk Size | `app/admin/**` | **P3** | 464 admin routes bundle during build. | Utilize dynamic `React.lazy` / `next/dynamic` chunk splitting for admin views. | 🟡 Managed |
| **TD-08** | Incomplete TypeScript Narrowing on Mock Hooks | `features/*/hooks.ts` | **P3** | Minor optional chaining fallback warnings. | Tighten return types to match Prompt 11 DTO models. | 🟢 Aligned |
| **TD-09** | Form Validation Feedback Duplication | `components/auth/**` | **P2** | Repeated validation schemas across signin/signup. | Share Zod validation schemas with backend contract DTO rules. | 🟢 Standardized |
| **TD-10** | Missing Keyset Pagination on High-Volume Feeds | `features/admin/audit` | **P3** | Large table offset pagination degrades on 10k+ rows. | Expand keyset pagination support in future optimization phase. | 🟡 Managed |
