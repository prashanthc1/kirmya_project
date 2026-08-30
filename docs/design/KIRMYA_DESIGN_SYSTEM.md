# Kirmya Design System & Visual Specification (Prompt 13/50)

**Date**: August 30, 2026  
**Auditor**: Antigravity AI (Google DeepMind)  
**Status**: ACTIVE DESIGN SYSTEM FOUNDATION  
**Primary Engine**: Material UI v6 + Emotion + Next.js 16 (App Router) + TypeScript  

---

## 1. Design Principles

Kirmya blends **Apple-inspired design discipline** with **LinkedIn-grade professional information architecture**:

1. **Content Before Decoration**: Whitespace, crisp typography, and disciplined contrast guide user attention rather than noisy backgrounds, gratuitous borders, or saturated colors.
2. **Restrained Color Palette**: One distinct, polished primary brand color (Indigo: `#6366f1` / `#818cf8`) complemented by calm neutral surfaces and semantic status colors.
3. **Refined Typography**: Optical size-dependent tracking, tightened display line-heights, and structured weights (400, 500, 600, 700, 800) built on Plus Jakarta Sans with native system fallbacks.
4. **Physical & Purposeful Motion**: Spring-driven transitions (`duration: 0.25s–0.4s`, `bounce: 0`), active press physical scale feedback (`0.97` on buttons, `0.92` on icon buttons), and full support for `prefers-reduced-motion`.
5. **Subtle Elevation & Depth**: Soft ambient occlusion and 1px border contrast instead of harsh black drops or generic blur effects.
6. **Ergonomic Accessibility**: Minimum $44 \times 44\text{px}$ touch targets on coarse pointers, universal focus rings, skip-to-content links, and full WCAG AA/AAA contrast compliance.

---

## 2. Color System & Semantic Tokens

### Light Theme
* **Page Ground**: `#f8fafc` (Slate 50)
* **Surface / Card Ground**: `#ffffff` (Solid, high-contrast)
* **Primary Text**: `#0f172a` (Slate 900 — $15.8:1$ contrast)
* **Secondary Text**: `#475569` (Slate 600 — $5.6:1$ contrast)
* **Subtle Border / Divider**: `rgba(15, 23, 42, 0.08)`
* **Primary Brand**: `#6366f1` (Indigo 500), Dark: `#4f46e5`, Light: `#a5b4fc`
* **Semantic Status**:
  * Success: `#10b981` (Emerald 500)
  * Warning: `#f59e0b` (Amber 500)
  * Error: `#ef4444` (Rose 500)
  * Info: `#3b82f6` (Blue 500)

### Dark Theme
* **Page Ground**: `#0f172a` (Slate 900)
* **Surface / Card Ground**: `#1e293b` (Slate 800)
* **Primary Text**: `#f8fafc` (Slate 50 — $14.2:1$ contrast)
* **Secondary Text**: `#cbd5e1` (Slate 300 — $9.1:1$ contrast)
* **Subtle Border / Divider**: `rgba(255, 255, 255, 0.08)`
* **Primary Brand**: `#818cf8` (Indigo 400), Dark: `#6366f1`, Light: `#c7d2fe`
* **Semantic Status**:
  * Success: `#34d399` (Emerald 400)
  * Warning: `#fbbf24` (Amber 400)
  * Error: `#f87171` (Rose 400)
  * Info: `#60a5fa` (Blue 400)

---

## 3. Typography Scale & Optical Hierarchy

| Variant | Font Size | Line Height | Letter Spacing | Weight | Typical Usage |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **`h1`** | $2.5\text{rem}$ ($40\text{px}$) | $1.05$ | $-0.035\text{em}$ | 800 | Landing hero titles, primary page titles |
| **`h2`** | $2.0\text{rem}$ ($32\text{px}$) | $1.10$ | $-0.030\text{em}$ | 800 | Major section headers, modal headers |
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
* **Icon Buttons**: `active: scale(0.92)`
* **Card Action Areas**: `active: scale(0.995)`
* **Clickable Chips**: `active: scale(0.96)`
* **Cards Hover**: `translateY(-2px)` with subtle shadow lift.

---

## 6. Accessibility & Mobile Responsiveness

1. **Universal Focus Ring**: `outline: 2px solid ${text.primary}`, `outlineOffset: 2px` on `:focus-visible`.
2. **Touch Target Expansion**: Coarse pointer expansion to $\ge 44 \times 44\text{px}$ using centered pseudo-elements.
3. **Mobile Bottom Sheet Adaptation**: Dialogs transform into thumb-friendly bottom-sheets on mobile viewports ($< 600\text{px}$) with `borderRadius: 16px 16px 0 0` and `maxHeight: 92dvh`.
4. **Table Auto-Scroll**: `.MuiCardContent:has(> table)` and `.MuiPaper:has(> table)` auto-enable horizontal scroll to prevent column clipping.
5. **OS Preferences**: Respects `prefers-reduced-motion`, `prefers-reduced-transparency`, and `prefers-contrast`.
