# Kirmya Frontend Architecture & Structural Specification (Prompt 12/50)

**Date**: August 30, 2026  
**Auditor**: Antigravity AI (Google DeepMind)  
**Status**: COMPLETE ARCHITECTURAL SPECIFICATION  

---

## 1. Directory Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router (270+ pages, route groups, layouts)
│   │   ├── (auth)/             # Authentication views (login, signup, verify)
│   │   ├── admin/              # Platform administration suite (464+ management views)
│   │   ├── jobs/               # Public and candidate job board
│   │   ├── profile/            # User profiles, portfolio, and settings
│   │   ├── network/            # Connection graph, invitations, messaging
│   │   ├── communities/        # Community groups, feeds, and discussions
│   │   ├── layout.tsx          # HTML root layout, Google fonts, skip-link
│   │   └── providers.tsx       # Theme, QueryClient, Auth, Motion, ErrorBoundary
│   ├── components/             # Reusable UI component library
│   │   ├── common/             # Universal UX patterns (EmptyState, ErrorState, LoadingState, ConfirmDialog)
│   │   └── <domain>/           # Domain-specific UI widgets (admin, jobs, profile, etc.)
│   ├── context/                # Global React contexts (AuthContext, ColorModeContext)
│   ├── features/               # Domain feature modules (api client, hooks, types per domain)
│   ├── hooks/                  # Global shared hooks (useAuth, useLogin, etc.)
│   ├── services/               # Centralized Axios API client with token interceptors
│   ├── shared/                 # Shared utilities, route constants, monitoring
│   ├── test/                   # Vitest testing suite
│   └── theme/                  # MUI v6 centralized theme, typography, motion, touch tokens
```

---

## 2. Routing & Navigation Architecture

* **Framework**: Next.js 16 App Router.
* **Central Route Constants**: All path generation is driven by [`frontend/src/shared/routes.ts`](file:///c:/Users/PRASHANTH/Documents/real/my_project/frontend/src/shared/routes.ts).
* **Route Protection Strategy**:
  * Client-side route guards in `AuthContext` intercept unauthorized access and redirect to `/login`.
  * Server-side backend authentication and RBAC middlewares enforce strict authoritative authorization on every API transaction.

---

## 3. State Management & Data Fetching Strategy

* **Server State**: Managed strictly via **TanStack React Query v5** (`staleTime: 60s`, automatic retry, granular query key invalidation on mutations).
* **Client / UI State**: Local React hooks (`useState`, `useReducer`, `useMemo`).
* **Authentication State**: Authoritative `AuthContext` holding active `UserProfile`, permissions, and unread notification counters.
* **Theme & Appearance State**: `ColorModeContext` with dark/light mode switching and `localStorage` persistence.

---

## 4. Theme & MUI v6 Foundation

* **Primary Component Engine**: Material UI v6 (`@mui/material`, `@mui/icons-material`, Emotion).
* **Design Token Centralization**:
  * Colors, spacing, radii, shadows, and typography letter-spacing configured in `theme/theme.ts`.
  * Motion and spring animation tokens configured in `theme/motion.ts`.
  * Mobile touch hit areas ($\ge 44\text{px}$) enforced on coarse pointers.
  * Universal focus ring indicator configured for WCAG AA/AAA compliance.

---

## 5. WebSockets & Real-Time Event Architecture

* **Connection Pool**: Single centralized WebSocket connection to `/api/v1/messages/ws?token=<jwt>` per authenticated session.
* **Event Ingress**: Events (`new_message`, `notification`, `presence`) update React Query cache directly using `queryClient.setQueryData` rather than triggering expensive full-app refetches.
