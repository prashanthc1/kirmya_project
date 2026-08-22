# Kirmya Frontend Architecture & Design System Documentation

Welcome to the Frontend Architecture, MUI v6 Design System, Glassmorphism Styling, and Accessibility documentation for Kirmya.

## Documentation Index

- [`frontend-audit.md`](frontend-audit.md): Complete audit of Next.js structure, MUI v6 tokens, and feature modules.
- [`frontend-architecture.md`](frontend-architecture.md): App Router boundaries, feature organization, and presentation layers.
- [`design-system.md`](design-system.md): Centralized MUI v6 theme tokens, dark/light mode, and glassmorphism.
- [`component-guidelines.md`](component-guidelines.md): Component reusability governance and MUI system props.
- [`accessibility.md`](accessibility.md): WCAG 2.2 AA compliance, contrast, focus traps, and keyboard navigation.
- [`responsive-design.md`](responsive-design.md): Breakpoint grid strategy and mobile card adaptations.

## Quick Execution Commands

### Component & Page Tests
```bash
# Run Vitest frontend test suite (37 files / 423 tests)
npx vitest run

# Run TypeScript type safety check
npx tsc --noEmit

# Run Next.js production build check
npm run build
```
