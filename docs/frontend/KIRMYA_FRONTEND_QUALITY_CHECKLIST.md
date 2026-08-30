# Kirmya Frontend Quality & Verification Checklist (Prompt 12/50)

**Date**: August 30, 2026  
**Auditor**: Antigravity AI (Google DeepMind)  
**Status**: OPERATIONAL QUALITY GATE  

---

## 1. Quality Verification Criteria

Every frontend page and component in Kirmya must satisfy all quality checks:

### Architecture & Framework
* [x] **Framework Standard**: Built strictly with Next.js 16 + React 18 + TypeScript + MUI v6.
* [x] **No Forbidden Frameworks**: Zero Tailwind, Bootstrap, Chakra, or styled-components.
* [x] **Route Constants**: Uses `shared/routes.ts` constants instead of scattered string literals.
* [x] **Layout Wrapping**: Appropriate layout shell applied (public, authenticated, recruiter, admin).

### State Management & Data Fetching
* [x] **Single Auth Source**: `AuthContext` is the single source of truth for session and token management.
* [x] **React Query Key Hierarchy**: Normalized query keys (`['jobs', { page, query }]`, `['profile', userId]`).
* [x] **Automatic Invalidation**: Mutations explicitly invalidate matching query keys.
* [x] **Error Handling**: Graceful error fallback using `ErrorState` or toast notifications.
* [x] **Loading Skeletons**: Uses `LoadingState` skeletons rather than blank white screens.
* [x] **Empty States**: Uses `EmptyState` with clear actionable CTA when collections are empty.

### Accessibility & Responsiveness
* [x] **Touch Targets**: Minimum $44 \times 44\text{px}$ touch hit area on coarse pointers.
* [x] **Focus Visible**: Universal high-contrast outline ring on focused interactive elements.
* [x] **Keyboard Navigation**: Dialogs, dropdowns, and menus close with `Escape` and trap focus properly.
* [x] **Responsive Grid**: Flexbox and MUI `Grid` with fluid breakpoints (`xs`, `sm`, `md`, `lg`, `xl`).
* [x] **Skip Link**: Accessible skip-to-content anchor present at the top of the HTML DOM.

### Code Quality & Testing
* [x] **TypeScript Strictness**: Zero `any` shortcuts in public interfaces; models match backend DTOs.
* [x] **Automated Tests**: Vitest unit and theme test suite passing (100% green).
* [x] **Clean Build**: `npx tsc --noEmit` exits with 0 errors.
