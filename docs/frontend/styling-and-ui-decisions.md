# Styling and UI decisions

**Status:** active. Supersedes the styling parts of
[`design-system.md`](design-system.md) and section 7.5 of
[`../architecture/05-frontend-architecture.md`](../architecture/05-frontend-architecture.md).
**Last measured:** 9 September 2026, against `frontend/src`.

## The rule

**Pick the technique the requirement needs. MUI is the default, not the
obligation.**

The standing instruction has been that everything is MUI v6 and `sx`, with
Tailwind explicitly ruled out. The first half of that is worth keeping as a
default — one component library, one theme, one set of accessibility
behaviours is genuinely better than five. The second half hardened into
something nobody decided: because `sx` was the only tool anyone reached for, it
became the tool for jobs it is bad at, and the result is a codebase that fights
its own design system.

This document says when to use what, and it is written from what the code
actually does rather than from what would be tidy.

## What the code does today

Measured across 958 `.tsx` files:

| | Count |
|---|---|
| Files importing `@mui/material` | 663 |
| Files using the `sx` prop | 650 |
| Files using `styled()` | 0 |
| CSS Module files | 0 |
| Plain `.css` files | 0 |
| **Hardcoded hex colours in components** | **2,892 occurrences, 121 distinct values** |
| `backdropFilter` (glassmorphism) | 260 occurrences across 184 files |
| Hand-written `isDark ? … : …` ternaries | 315 occurrences across 134 files |
| `borderRadius` as a string literal | 305 × `'12px'`, 195 × `'24px'`, 191 × `'16px'`, 122 × `'20px'`, 89 × `'10px'`, 54 × `'14px'` |

Read those last four rows together and the problem states itself. There is a
real design system in `src/theme/` — a palette whose contrast ratios were
computed and are recorded in comments, a `tokens.radius` scale, a `shape`
default of 12px, custom breakpoints. Almost nothing uses it. The theme is
reimplemented by hand, slightly differently, 2,892 times.

Two consequences, both concrete:

**Hardcoded colours cannot respond to the mode.** `RestoreTestModal` sets
`bgcolor: '#0f172a', color: '#f8fafc'` on its `Paper`. In light mode that
dialog is still dark. Several admin studios do the same at page level
(`bgcolor: '#090d16'`). Some of that may be deliberate — a dark-only operations
console is a legitimate choice — but the intent is written down nowhere, so a
reader cannot tell a decision from a bug, and neither can a reviewer.

**The accessibility work is bypassed.** F15 remediated contrast to WCAG AA and
the palette carries the measurements (`white on #4f46e5 = 6.29:1`). A component
that writes `color: '#94a3b8'` on some other background has opted out of that
work, and 331 places write exactly that colour.

## Which technique for which requirement

| Requirement | Use | Why |
|---|---|---|
| Anything with interaction semantics — dialog, menu, tabs, select, tooltip, snackbar, date picker | **MUI component** | Focus trapping, roving tabindex, `aria-*`, escape handling and screen-reader behaviour are the hard part and MUI has already done them. Rebuilding these by hand is how you end up with `<div onClick>`. |
| Colour, spacing, radius, elevation, breakpoint | **Theme token** — `theme.palette.*`, `theme.spacing()`, `tokens.radius.*`, `theme.breakpoints` | One definition, mode-aware, and the contrast ratios stay true. Never a hex literal. |
| A handful of one-off layout properties on a component | **`sx`** | This is what `sx` is for: `sx={{ mb: 3, display: 'flex', gap: 2 }}`. Short, local, using tokens. |
| The same visual treatment on more than two components | **A shared component**, not a copied `sx` block | 184 files independently reinventing a glass card is the failure mode. Put it in `components/` once. |
| Heavy static styling, keyframes, complex selectors, `:has()`, container queries, print styles | **A CSS Module** (`Thing.module.css`) | Next.js supports these with no dependency and no configuration. They are compiled and scoped, they cost nothing at runtime, and CSS does them better than a JS object literal. |
| A plain structural element — a wrapper, a grid, a spacer | **A plain `<div>` with a CSS Module class**, or `<Box>` if you need theme access | `<Box sx={{ display: 'flex' }}` for pure layout buys you an emotion class name for something `display: flex` already did. |
| A whole new UI framework | **Don't** — unless you can show the requirement is unmeetable otherwise, in writing, and get it agreed | Adding Tailwind or styled-components alongside 663 MUI files gives you two systems and two sources of truth. The gap is not the framework. |

## Where MUI specifically does not fit here

These are the cases that prompted this document. In each, the answer is not
"work around it in `sx`".

**Glassmorphism.** `design-system.md` prescribes
`backdropFilter: 'blur(16px)'` and translucent card backgrounds as the house
style, and 184 files apply some version of it. The navigation brief then asked
for the opposite: *premium, calm, minimal; avoid glass effects and a
dashboard-template appearance.* Those two instructions cannot both be followed.
The brief is the newer decision and the one to follow. `backdropFilter` also
costs a compositor layer per element and degrades badly on low-end devices, so
this is a performance question as much as a taste one. **Do not add new
`backdropFilter`. When you touch a component that has one, take it out.**

**`Grid` is mid-migration and the codebase has not moved.** 216 files use the
legacy `<Grid item xs={12}>` API; none uses the MUI v6 `<Grid size={12}>` API.
Mixing them in one file is a type error, which is a real trap when editing —
copy the API the file already uses, and do not convert a file to `size=` as a
drive-by. A deliberate migration is fine; an accidental half of one is not.
For simple one- or two-column layouts, CSS Grid in a CSS Module is less
machinery than either.

**Breakpoints are not MUI's defaults.** This theme sets `sm: 640, md: 768`
where MUI ships `sm: 600, md: 900`. Anyone reasoning from the MUI docs, or
writing a media query by hand, will be wrong by 40–130px. Always go through
`theme.breakpoints`; in a CSS Module, comment the pixel value with the token it
mirrors.

**The `sx` prop is not a stylesheet.** It is fine for a few properties. It is
the wrong home for a 15-property object repeated across a module, for
`@keyframes`, or for anything with descendant selectors. Those belong in a CSS
Module or a shared component.

## What does not bend, whichever you choose

These hold for MUI, CSS Modules and plain elements alike:

- **Colour comes from the palette.** If a value is not in the theme, add it to
  the theme with its measured contrast ratio, the way `palette.ts` already
  does. No hex literals in components.
- **Both modes must work.** If a surface is deliberately single-mode, say so in
  a comment at the top of the file. An undocumented hardcoded dark panel is
  indistinguishable from a mistake.
- **WCAG AA, verified.** Contrast is checked by the axe-core browser suite
  (`test/e2e/accessibility.spec.ts`) in light and dark, desktop and mobile. A
  new colour pairing is not done until that passes.
- **Navigation is links.** `<a>`/`next/link` for destinations, `<button>` for
  actions. No clickable `<div>`. This is already asserted by the navigation
  browser tests.
- **Write RTL-ready.** Arabic is in scope in the architecture doc and the
  stylis RTL plugin it describes is **not currently wired up**. Do not add new
  physical-direction properties: prefer `marginInlineStart` over `marginLeft`,
  `paddingInlineEnd` over `paddingRight`, `inset-inline-start` over `left`.
  This costs nothing now and is most of the work when RTL is turned on.
- **Touch targets ≥ 44×44px**, per `tokens`. The mobile navigation uses 48px.

## Adding a stylesheet

No dependency, no config — Next.js 16 handles this already:

```
src/components/thing/Thing.tsx
src/components/thing/Thing.module.css
```

```css
/* Thing.module.css */
.panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: var(--kirmya-gap, 1rem);
  border-radius: 12px; /* tokens.radius.md */
}

/* 768px is theme.breakpoints md — not MUI's default 900px. */
@media (min-width: 768px) {
  .panel { gap: 1.5rem; }
}
```

```tsx
import styles from './Thing.module.css';

export function Thing() {
  return <div className={styles.panel}>…</div>;
}
```

Class names are hashed, so there is no global collision risk, and nothing about
this bypasses the theme: use it for layout and static presentation, and keep
colour on theme tokens. Where a CSS Module needs a themed colour, pass it in as
a CSS custom property from the component rather than hardcoding it.

## Migration: this is not a rewrite

663 files import MUI and that is fine. Nobody should open a pull request that
converts them.

The rules above apply to **new code, and to code you are already editing for
another reason**. When you touch a component:

1. Replace the hex literals it contains with palette tokens.
2. Remove `backdropFilter` if it has one.
3. If you find the same `sx` block in a third file, extract a component.

That is the same ratchet the invented-data work used, and for the same reason:
a standard nobody can meet in one pass is met incrementally or not at all. If
a mechanical check is wanted later, a test that fails on new hex literals in
changed files is the shape it should take — a snapshot of the current 2,892
that may only shrink.

## What this supersedes

- **`design-system.md`** is stale and prescribes the glassmorphism the
  navigation brief rules out. Its palette is also wrong: it lists the primary
  as `#2563eb`/`#3b82f6`, where `theme/palette.ts` actually uses
  `#4f46e5`/`#818cf8` — values chosen and measured during the F15 contrast
  work. **Read `src/theme/palette.ts` for colour, not that document.**
- **Section 7.5 of the frontend architecture doc** states the frontend is
  "styled using MUI v6 … avoiding Tailwind CSS". Avoiding Tailwind still
  stands. "Everything is MUI and `sx`" is replaced by the decision table above.
