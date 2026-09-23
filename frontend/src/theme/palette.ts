import { PaletteOptions } from '@mui/material/styles';

/** Neutral materials, one blue accent, and distinct semantic status colors. */

export const getPalette = (mode: 'light' | 'dark'): PaletteOptions => {
  const isLight = mode === 'light';

  return {
    mode,
    primary: {
      main: isLight ? '#0066cc' : '#80bfff',
      light: isLight ? '#e6f2ff' : '#b3d9ff',
      dark: isLight ? '#0055aa' : '#a6d2ff',
      contrastText: isLight ? '#ffffff' : '#1d1d1f',
    },
    secondary: {
      main: isLight ? '#515154' : '#c7c7cc',
      light: isLight ? '#e8e8ed' : '#e5e5ea',
      dark: isLight ? '#3a3a3c' : '#e5e5ea',
      contrastText: isLight ? '#ffffff' : '#1d1d1f',
    },
    background: {
      default: isLight ? '#f5f5f7' : '#161617',
      paper: isLight ? '#ffffff' : '#242426',
    },
    text: {
      primary: isLight ? '#1d1d1f' : '#f5f5f7',
      secondary: isLight ? '#626267' : '#b8b8be',
      disabled: isLight ? '#86868b' : '#77777d',
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
      selected: isLight ? 'rgba(0, 102, 204, 0.08)' : 'rgba(128, 191, 255, 0.12)',
      disabled: isLight ? 'rgba(15, 23, 42, 0.26)' : 'rgba(255, 255, 255, 0.3)',
      disabledBackground: isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.08)',
      focus: isLight ? 'rgba(0, 102, 204, 0.12)' : 'rgba(128, 191, 255, 0.16)',
    },
  };
};
