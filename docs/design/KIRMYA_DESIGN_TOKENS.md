# Kirmya Design Tokens Catalog & Implementation Reference (Prompt 13/50)

**Date**: August 30, 2026  
**Auditor**: Antigravity AI (Google DeepMind)  
**Status**: ACTIVE TOKEN REFERENCE  

---

## 1. Token Architecture Overview

All UI styles in Kirmya are driven by strongly typed constants under `frontend/src/theme/`:

```
frontend/src/theme/
├── tokens.ts         # Raw constants (radii, layout widths, z-indices, touch hit areas)
├── palette.ts        # Color tokens & semantic states (light/dark)
├── typography.ts     # Typography scale, line heights, letter-spacing
├── spacing.ts        # 8px spacing rhythm & layout boundaries
├── shape.ts          # Shape & border-radius defaults
├── shadows.ts        # Ambient elevation & shadow tokens
├── breakpoints.ts    # Responsive viewport boundaries
├── motion.ts         # Spring tokens, surface transitions, list stagger
├── components.ts     # MUI 6 component overrides & active press states
└── theme.ts          # Unified theme builder exporting getTheme(mode)
```

---

## 2. Palette Tokens

### Brand & Accents
* `primary.main`: `#0066cc` (Light) / `#80bfff` (Dark)
* `primary.light`: `#e6f2ff` (Light) / `#b3d9ff` (Dark)
* `primary.dark`: `#0055aa` (Light) / `#a6d2ff` (Dark)
* `secondary.main`: `#515154` (Light) / `#c7c7cc` (Dark)

### Neutral Grounds & Text
* `background.default`: `#f5f5f7` (Light) / `#161617` (Dark)
* `background.paper`: `#ffffff` (Light) / `#242426` (Dark)
* `text.primary`: `#1d1d1f` (Light) / `#f5f5f7` (Dark)
* `text.secondary`: `#626267` (Light) / `#b8b8be` (Dark)
* `border.divider`: `rgba(15, 23, 42, 0.08)` (Light) / `rgba(255, 255, 255, 0.08)` (Dark)

### Semantic Status
* `success.main`: `#047857` (Light) / `#34d399` (Dark)
* `warning.main`: `#b45309` (Light) / `#fbbf24` (Dark)
* `error.main`: `#dc2626` (Light) / `#f87171` (Dark)
* `info.main`: `#1d4ed8` (Light) / `#60a5fa` (Dark)

---

## 3. Layout & Dimension Tokens

* `tokens.layout.narrowWidth`: `640px`
* `tokens.layout.standardWidth`: `1024px`
* `tokens.layout.wideWidth`: `1280px`
* `tokens.layout.maxWidth`: `1440px`
* `tokens.layout.headerHeight`: `64px`
* `tokens.layout.sidebarWidth`: `260px`
* `tokens.layout.collapsedSidebarWidth`: `72px`

---

## 4. Radii & Shape Tokens

* `tokens.radius.none`: `0px`
* `tokens.radius.xs`: `4px`
* `tokens.radius.sm`: `8px`
* `tokens.radius.md`: `12px`
* `tokens.radius.lg`: `16px`
* `tokens.radius.xl`: `24px`
* `tokens.radius.pill`: `9999px` (Avatars, full rounded buttons)

Shared MUI component radii: buttons `0.75rem`, cards `1.25rem`, dialogs `1.5rem`, inputs `10px`, menus `12px`. Page-specific document previews retain their document styling.

---

## 5. Motion & Spring Tokens

* `springs.entrance`: `{ type: 'spring', bounce: 0, duration: 0.4 }`
* `springs.hover`: `{ type: 'spring', bounce: 0, duration: 0.25 }`
* `springs.momentum`: `{ type: 'spring', bounce: 0.2, duration: 0.4 }`
* `transition.fast`: `'100ms ease-out'`
* `transition.standard`: `'200ms ease-in-out'`
* `transition.surface`: `'220ms ease'`
