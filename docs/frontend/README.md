# Kirmya Frontend Architecture & MUI v6 Design System Hub

Welcome to the Next.js Frontend Architecture, MUI v6 Glassmorphic Design System, State Management, Accessibility (WCAG 2.2 AA), and Performance Guidelines for Kirmya.

## Documentation Index

- [`frontend-architecture-audit.md`](frontend-architecture-audit.md): Complete audit of Next.js routes, components, and zero-Tailwind compliance.
- [`frontend-architecture.md`](frontend-architecture.md): High-level frontend architecture, data fetching pipelines, and state isolation.
- [`frontend-development-guide.md`](frontend-development-guide.md): Developer guide, feature module directories, and component conventions.
- [`styling-and-ui-decisions.md`](styling-and-ui-decisions.md): **Start here for styling.** When to use an MUI component, a theme token, `sx`, or a CSS Module; where MUI does not fit this codebase; and the constraints that hold whichever you choose.
- [`design-system.md`](design-system.md): **Superseded** — stale palette and prescribes the glassmorphism the navigation brief rules out. Kept only so references to it are recognisable as stale.
- [`component-guidelines.md`](component-guidelines.md): Reusable component hierarchy, props contracts, and variants.
- [`accessibility-guide.md`](accessibility-guide.md): WCAG 2.2 AA compliance standards, keyboard navigation, and ARIA attributes.
- [`accessibility.md`](accessibility.md): Focus trap management, color contrast standards, and screen reader live regions.
- [`frontend-performance.md`](frontend-performance.md): Core Web Vitals targets (LCP, INP, CLS) and dynamic bundle optimization.
- [`performance.md`](performance.md): Route-level code splitting, lazy loading, and asset caching strategies.
- [`data-fetching.md`](data-fetching.md): Server and client data fetching patterns, SWR/React Query caching, and offline mocks.
- [`state-management.md`](state-management.md): Domain-scoped React Context and Zustand state management rules.
- [`state-audit.md`](state-audit.md): Audit of application state stores, optimistic UI updates, and cache lifecycles.
- [`error-handling.md`](error-handling.md): Error boundary hierarchy, toast notifications, and recoverable error cards.
- [`responsive-design.md`](responsive-design.md): Breakpoint standards (mobile, tablet, desktop) and touch-target sizing.
- [`frontend-security.md`](frontend-security.md): XSS sanitization, CSP compliance, and HttpOnly session cookie handling.
- [`browser-storage.md`](browser-storage.md): Local/Session storage governance and zero sensitive token persistence.
- [`offline-ux.md`](offline-ux.md): Offline banner feedback, network error recovery, and cached card display.
- [`realtime-sync.md`](realtime-sync.md): WebSocket connection lifecycle, reconnect backoff, and cleanup.
- [`testing.md`](testing.md): Vitest component unit tests, accessibility tests, and E2E automation workflows.
