import { PaletteOptions } from '@mui/material/styles';

/**
 * Restrained Light and Dark Mode Color Palettes (Prompt 13/50)
 * 
 * Philosophy:
 * - Neutral page backgrounds with subtle contrast against elevated surfaces.
 * - Single recognizable primary brand color (Indigo) with refined states.
 * - High-contrast text meeting WCAG AA/AAA standards.
 * - Restrained semantic status colors (Success, Warning, Error, Info).
 */

export const getPalette = (mode: 'light' | 'dark'): PaletteOptions => {
  const isLight = mode === 'light';

  return {
    mode,
    /*
     * F15. Every filled button on the site failed WCAG AA on contrast.
     *
     * White on the dark-mode primary #818cf8 measures 2.98:1 against a required
     * 4.5:1, and white on the light-mode #6366f1 measures 4.47:1 — just under.
     * That is not an edge case: it is the submit button on sign-in and
     * registration, and every primary call to action on the marketing pages.
     *
     * The two modes are fixed differently on purpose. Light mode deepens the
     * indigo so white text passes. Dark mode keeps the bright indigo the design
     * is built around and flips the label to the dark ink instead, which reads
     * at 5.98:1 — darkening it there would have made every button muddy against
     * the dark ground for no accessibility gain.
     */
    primary: {
      main: isLight ? '#4f46e5' : '#818cf8',
      light: isLight ? '#a5b4fc' : '#c7d2fe',
      // `dark` is the hover fill, and it has to move *away* from the label, not
      // toward it. In light mode the label is white, so hover deepens; in dark
      // mode the label is the dark ink, so hover lightens. Keeping the usual
      // darker shade there put #0f172a on #6366f1 at 4.00:1 — every primary
      // button in dark mode failed AA the moment a pointer touched it.
      dark: isLight ? '#4338ca' : '#a5b4fc',
      // white on #4f46e5 = 6.29:1, on #4338ca = 7.53:1
      // #0f172a on #818cf8 = 5.98:1, on #a5b4fc = 8.96:1
      contrastText: isLight ? '#ffffff' : '#0f172a',
    },
    secondary: {
      main: isLight ? '#db2777' : '#f472b6',
      light: isLight ? '#f472b6' : '#fbcfe8',
      dark: isLight ? '#be185d' : '#f9a8d4',
      // white on #db2777 = 4.60:1, on #be185d = 6.05:1
      // #0f172a on #f472b6 = 6.74:1, on #f9a8d4 = 9.84:1
      contrastText: isLight ? '#ffffff' : '#0f172a',
    },
    background: {
      default: isLight ? '#f8fafc' : '#0f172a',
      paper: isLight ? '#ffffff' : '#1e293b',
    },
    text: {
      primary: isLight ? '#0f172a' : '#f8fafc',
      secondary: isLight ? '#475569' : '#cbd5e1',
      disabled: isLight ? '#94a3b8' : '#64748b',
    },
    divider: isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)',
    /*
     * The semantic colours follow the same rule as the brand ones, and for the
     * same reason: `contrastText` is what MUI paints on `main` *and* on `dark`,
     * so a hover state that darkens the fill but keeps a label that was already
     * marginal is how a button passes a static check and fails in use. Both
     * shades are measured here.
     *
     * Success was the worst of them: white on #10b981 reads 2.54:1, well under
     * half the required 4.5:1, and that is the colour on every confirmation
     * chip and "Application submitted" state.
     */
    error: {
      main: isLight ? '#dc2626' : '#f87171',
      light: isLight ? '#fee2e2' : '#7f1d1d',
      dark: isLight ? '#b91c1c' : '#ef4444',
      // white on #dc2626 = 4.83:1, on #b91c1c = 6.47:1
      // #0f172a on #f87171 = 6.45:1, on #ef4444 = 4.74:1
      contrastText: isLight ? '#ffffff' : '#0f172a',
    },
    warning: {
      main: isLight ? '#b45309' : '#fbbf24',
      light: isLight ? '#fef3c7' : '#78350f',
      dark: isLight ? '#92400e' : '#f59e0b',
      // white on #b45309 = 5.02:1, on #92400e = 7.09:1
      // #0f172a on #fbbf24 = 10.69:1, on #f59e0b = 8.31:1
      contrastText: isLight ? '#ffffff' : '#0f172a',
    },
    info: {
      main: isLight ? '#1d4ed8' : '#60a5fa',
      light: isLight ? '#dbeafe' : '#1e3a8a',
      dark: isLight ? '#1e40af' : '#3b82f6',
      // white on #1d4ed8 = 6.70:1, on #1e40af = 8.72:1
      // #0f172a on #60a5fa = 7.02:1, on #3b82f6 = 4.85:1
      contrastText: isLight ? '#ffffff' : '#0f172a',
    },
    success: {
      main: isLight ? '#047857' : '#34d399',
      light: isLight ? '#d1fae5' : '#064e3b',
      dark: isLight ? '#065f46' : '#10b981',
      // white on #047857 = 5.48:1, on #065f46 = 7.68:1
      // #0f172a on #34d399 = 9.29:1, on #10b981 = 7.04:1
      contrastText: isLight ? '#ffffff' : '#0f172a',
    },
    action: {
      active: isLight ? 'rgba(15, 23, 42, 0.54)' : 'rgba(255, 255, 255, 0.7)',
      hover: isLight ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.06)',
      selected: isLight ? 'rgba(99, 102, 241, 0.08)' : 'rgba(129, 140, 248, 0.12)',
      disabled: isLight ? 'rgba(15, 23, 42, 0.26)' : 'rgba(255, 255, 255, 0.3)',
      disabledBackground: isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.08)',
      focus: isLight ? 'rgba(99, 102, 241, 0.12)' : 'rgba(129, 140, 248, 0.16)',
    },
  };
};
