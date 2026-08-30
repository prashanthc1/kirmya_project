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
* `brand.primary.main`: `#6366f1` (Light) / `#818cf8` (Dark)
* `brand.primary.light`: `#a5b4fc` (Light) / `#c7d2fe` (Dark)
* `brand.primary.dark`: `#4f46e5` (Light) / `#6366f1` (Dark)
* `brand.secondary.main`: `#ec4899` (Light) / `#f472b6` (Dark)

### Neutral Grounds & Text
* `surface.background`: `#f8fafc` (Light) / `#0f172a` (Dark)
* `surface.paper`: `#ffffff` (Light) / `#1e293b` (Dark)
* `text.primary`: `#0f172a` (Light) / `#f8fafc` (Dark)
* `text.secondary`: `#475569` (Light) / `#cbd5e1` (Dark)
* `border.divider`: `rgba(15, 23, 42, 0.08)` (Light) / `rgba(255, 255, 255, 0.08)` (Dark)

### Semantic Status
* `status.success`: `#10b981` (Light) / `#34d399` (Dark)
* `status.warning`: `#f59e0b` (Light) / `#fbbf24` (Dark)
* `status.error`: `#ef4444` (Light) / `#f87171` (Dark)
* `status.info`: `#3b82f6` (Light) / `#60a5fa` (Dark)

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
* `tokens.radius.md`: `12px` (Default Button, Input, Menu)
* `tokens.radius.lg`: `16px` (Card, Modal, Dialog)
* `tokens.radius.xl`: `24px` (Pill containers)
* `tokens.radius.pill`: `9999px` (Avatars, full rounded buttons)

---

## 5. Motion & Spring Tokens

* `springs.entrance`: `{ type: 'spring', bounce: 0, duration: 0.4 }`
* `springs.hover`: `{ type: 'spring', bounce: 0, duration: 0.25 }`
* `springs.momentum`: `{ type: 'spring', bounce: 0.2, duration: 0.4 }`
* `transition.fast`: `'100ms ease-out'`
* `transition.standard`: `'200ms ease-in-out'`
* `transition.surface`: `'220ms ease'`
