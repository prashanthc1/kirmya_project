# Design system — superseded

> **This document is out of date and was wrong in two ways. Do not follow it.**
>
> - Its palette is incorrect. It lists the primary as `#2563eb`/`#3b82f6`; the
>   theme actually uses `#4f46e5`/`#818cf8`, chosen and contrast-measured
>   during the F15 accessibility work.
> - It prescribes glassmorphism — translucent cards and
>   `backdropFilter: blur(16px)` — as the house style. The navigation brief
>   later asked for the opposite: calm, minimal, no glass effects. That brief
>   is the newer decision.
>
> **Colour, spacing, radius and elevation:** read `frontend/src/theme/`, which
> is the only source of truth. The palette carries its measured contrast
> ratios in comments.
>
> **When to use MUI, theme tokens, `sx`, or a CSS Module:** see
> [Styling and UI decisions](styling-and-ui-decisions.md).

The original contents are kept below so that references to them can be
recognised as stale rather than merely missing.

---

## Centralized Design Tokens (`src/theme/theme.ts`)

### Palette Definitions
- **Primary Brand**: Kirmya Deep Indigo (`#2563eb` light / `#3b82f6` dark).
- **Secondary Accent**: Professional Emerald (`#059669` light / `#10b981` dark).
- **Glass Card Background**:
  - Light Mode: `rgba(255, 255, 255, 0.75)` with `1px solid rgba(226, 232, 240, 0.8)`.
  - Dark Mode: `rgba(15, 23, 42, 0.75)` with `1px solid rgba(51, 65, 85, 0.8)`.
- **Backdrop Blur Filter**: `backdropFilter: 'blur(16px)'`.

### Elevation & Border Radius
- Card & Paper Border Radius: `16px` (`borderRadius: 2`).
- Button Border Radius: `8px` (`borderRadius: 1`).
- Dialog Border Radius: `20px`.
