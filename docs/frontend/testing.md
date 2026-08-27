# Kirmya Frontend Testing & Component Governance

## 1. Vitest & React Testing Library
- **Unit & Component Testing**: All MUI v6 components, custom hooks (`useAuth`, `useNotification`), and API services are covered by Vitest suites (`npx vitest run`).
- **Accessibility Testing**: `@axe-core/react` integration validates WCAG 2.2 AA compliance across form controls, dialogs, and navigation elements during automated component test runs.

---

## 2. Vitest Test Execution Command
```bash
npx vitest run
```
