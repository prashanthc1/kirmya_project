# Kirmya Frontend Accessibility & WCAG 2.2 AA Compliance

## Accessibility Standards

1. **Contrast Ratio**: Text colors meet minimum 4.5:1 contrast against light and dark background surfaces.
2. **Keyboard Navigation**: All interactive MUI components (`Button`, `IconButton`, `Tab`, `Select`, `Dialog`) support `Tab`, `Enter`, `Space`, and `Escape` key navigation.
3. **Screen Reader Labels**: Form inputs provide explicit `aria-label` or `<InputLabel>` associations. Modals enforce focus trap and `aria-labelledby`.
4. **Reduced Motion**: Respects browser `prefers-reduced-motion` settings by disabling backdrop blur animations and transition transforms when requested.
