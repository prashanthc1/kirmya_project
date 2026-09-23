# Kirmya Design System & Visual Specification (Prompt 13/50)

**Date**: August 30, 2026  
**Auditor**: Antigravity AI (Google DeepMind)  
**Status**: ACTIVE DESIGN SYSTEM FOUNDATION  
**Primary Engine**: Material UI v6 + Emotion + Next.js 16 (App Router) + TypeScript  

---

## 1. Design Principles

Kirmya blends **Apple-inspired design discipline** with **LinkedIn-grade professional information architecture**:

1. **Content Before Decoration**: Whitespace, crisp typography, and disciplined contrast guide user attention rather than noisy backgrounds, gratuitous borders, or saturated colors.
2. **Restrained Color Palette**: One blue accent (`#0066cc` / `#80bfff`), neutral secondary controls, and distinct semantic status colors.
3. **Refined Typography**: Native system fonts, size-dependent tracking, responsive headings, and structured weights (400–700). No font download on the critical rendering path.
4. **Physical & Purposeful Motion**: Critically damped springs, immediate press feedback (`0.97` on buttons, `0.96` on icon buttons), and reduced-motion alternatives. Static cards do not move on hover.
5. **Subtle Elevation & Depth**: Solid content surfaces; translucent navigation, menus and dialogs communicate hierarchy. Reduced-transparency and increased-contrast preferences restore solid surfaces.
6. **Ergonomic Accessibility**: Coarse-pointer touch targets, universal focus rings, skip-to-content links, and tested palette label contrast.

---

## 2. Color System & Semantic Tokens

### Light Theme
* **Page Ground**: `#f5f5f7`
* **Surface / Card Ground**: `#ffffff`
* **Primary Text**: `#1d1d1f`
* **Secondary Text**: `#626267`
* **Subtle Border / Divider**: `rgba(15, 23, 42, 0.08)`
* **Primary Brand**: `#0066cc`, hover `#0055aa`, light `#e6f2ff`
* **Semantic Status**:
  * Success: `#047857`
  * Warning: `#b45309`
  * Error: `#dc2626`
  * Info: `#1d4ed8`

### Dark Theme
* **Page Ground**: `#161617`
* **Surface / Card Ground**: `#242426`
* **Primary Text**: `#f5f5f7`
* **Secondary Text**: `#b8b8be`
* **Subtle Border / Divider**: `rgba(255, 255, 255, 0.08)`
* **Primary Brand**: `#80bfff`, hover `#a6d2ff`, light `#b3d9ff`. Filled primary controls use dark labels.
* **Semantic Status**:
  * Success: `#34d399` (Emerald 400)
  * Warning: `#fbbf24` (Amber 400)
  * Error: `#f87171` (Rose 400)
  * Info: `#60a5fa` (Blue 400)

---

## 3. Typography Scale & Optical Hierarchy

| Variant | Font Size | Line Height | Letter Spacing | Weight | Typical Usage |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **`h1`** | `clamp(2rem, 4vw, 2.75rem)` | 1.08 | -0.035em | 700 | Primary page titles |
| **`h2`** | `clamp(1.75rem, 3vw, 2.125rem)` | 1.12 | -0.030em | 700 | Major section headers |
| **`h3`** | $1.625\text{rem}$ ($26\text{px}$) | $1.15$ | $-0.025\text{em}$ | 700 | Dashboard widget titles, profile names |
| **`h4`** | $1.375\text{rem}$ ($22\text{px}$) | $1.20$ | $-0.020\text{em}$ | 700 | Card titles, group headings |
| **`h5`** | $1.125\text{rem}$ ($18\text{px}$) | $1.30$ | $-0.015\text{em}$ | 600 | List group titles, subheadings |
| **`h6`** | $1.0\text{rem}$ ($16\text{px}$) | $1.40$ | $-0.010\text{em}$ | 600 | Minor headers, form section labels |
| **`subtitle1`** | $1.0\text{rem}$ ($16\text{px}$) | $1.50$ | $-0.005\text{em}$ | 500 | Lead paragraphs, intro descriptions |
| **`body1`** | $0.95\text{rem}$ ($15.2\text{px}$) | $1.60$ | $0\text{em}$ | 400 | Standard body copy, job descriptions |
| **`body2`** | $0.875\text{rem}$ ($14\text{px}$) | $1.55$ | $0\text{em}$ | 400 | Compact table rows, metadata copy |
| **`button`** | $0.875\text{rem}$ ($14\text{px}$) | $1.50$ | $0\text{em}$ | 600 | Action buttons, tabs, interactive labels |
| **`caption`** | $0.75\text{rem}$ ($12\text{px}$) | $1.45$ | $+0.010\text{em}$ | 400 | Timestamps, helper text, badges |
| **`overline`** | $0.75\text{rem}$ ($12\text{px}$) | $1.40$ | $+0.080\text{em}$ | 600 | Eyebrows, categories, status labels |

---

## 4. Spacing, Shapes & Layout Constraints

### 8px Spacing Scale
* `0.5`: $4\text{px}$ (micro gaps, button icon spacing)
* `1.0`: $8\text{px}$ (chip padding, list item gaps)
* `1.5`: $12\text{px}$ (input internal padding, button x-padding)
* `2.0`: $16\text{px}$ (card padding, standard layout gaps)
* `3.0`: $24\text{px}$ (grid gutters, section padding)
* `4.0`: $32\text{px}$ (large card padding, page vertical rhythm)
* `6.0`: $48\text{px}$ (section vertical rhythm)
* `8.0`: $64\text{px}$ (major feature division)

### Standard Content Layout Widths
* **Narrow (`640px`)**: Single-column forms, authentication screens, article reading views.
* **Standard (`1024px`)**: Candidate feeds, settings panels, application detail views.
* **Wide (`1280px`)**: Two-column split recruiter views, ATS pipeline boards, dashboards.
* **Max (`1440px`)**: Global maximum layout container width preventing content stretching on ultra-wide displays.

### Shape Radii
* `radius.none`: $0\text{px}$
* `radius.xs`: $4\text{px}$
* `radius.sm`: $8\text{px}$ (chips, small badges, inline tags)
* `radius.md`: $12\text{px}$ (buttons, inputs, dropdown menus, dialogs)
* `radius.lg`: $16\text{px}$ (cards, modals, mobile bottom-sheets)
* `radius.xl`: $24\text{px}$ (floating pills, hero containers)
* `radius.pill`: $9999\text{px}$ (avatars, round badges, search bars)

---

## 5. Elevation, Motion & Physical Interaction

### Elevation Scale
Soft ambient shadows combined with 1px borders:
* `elevation[0]`: Flat surface (`box-shadow: none`).
* `elevation[1]`: `0 1px 3px 0 rgba(15, 23, 42, 0.08)` (subtle cards, menus).
* `elevation[2]`: `0 4px 6px -1px rgba(15, 23, 42, 0.08)` (elevated dropdowns, active cards).
* `elevation[3]`: `0 10px 25px -5px rgba(15, 23, 42, 0.10)` (floating dialogs, drawers).

### Physical Press Interaction
* **Buttons**: `active: scale(0.97)`
* **Icon Buttons**: `active: scale(0.96)`
* **Card Action Areas**: `active: scale(0.995)`
* **Clickable Chips**: `active: scale(0.96)`
* **Static Cards**: No hover translation. Interaction feedback belongs to actual controls.

---

## 6. Accessibility & Mobile Responsiveness

1. **Universal Focus Ring**: `2px` primary-blue outline with `2px` offset on `:focus-visible`.
2. **Touch Target Expansion**: Coarse pointer expansion to $\ge 44 \times 44\text{px}$ using centered pseudo-elements.
3. **Mobile Bottom Sheet Adaptation**: Dialogs use bottom-aligned surfaces below `600px`, with `1.5rem` upper corners and `maxHeight: 92dvh`. The navigation drawer uses an interruptible spring and retains MUI focus trapping and Escape dismissal.
4. **Table Auto-Scroll**: `.MuiCardContent:has(> table)` and `.MuiPaper:has(> table)` auto-enable horizontal scroll to prevent column clipping.
5. **OS Preferences**: Respects `prefers-reduced-motion`, `prefers-reduced-transparency`, and `prefers-contrast`.

### Persisted appearance

The root layout reads the `kirmya-theme-mode` preference cookie before rendering and passes the mode to the client provider. Appearance controls save the same cookie for one year, scoped to `/` with `SameSite=Lax` (and `Secure` on HTTPS). This replaces local-storage-only persistence, which could hydrate streamed authentication content with mismatched light/dark styles. Reading the preference makes root rendering request-dependent. Existing local-storage preferences are no longer read; users can select their preferred appearance again in Settings.
