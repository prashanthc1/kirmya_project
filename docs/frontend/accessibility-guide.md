# Kirmya Accessibility (a11y) & WCAG 2.2 AA Compliance Guide

## 1. Accessibility Engineering Standards
- **Keyboard Navigation**: All interactive elements (buttons, inputs, tabs, dropdowns) navigable via `Tab` and triggered via `Enter` / `Space`.
- **Focus Trap Management**: Modals and drawers trap keyboard focus cleanly and return focus to trigger upon dismissal (`Escape`).
- **Color Contrast**: 4.5:1 minimum contrast across all MUI theme tokens in both light and dark mode.
- **ARIA Semantics**: Live regions (`aria-live="polite"`) for async notifications and form validation error banners.
