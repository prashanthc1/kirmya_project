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
    primary: {
      main: isLight ? '#6366f1' : '#818cf8',
      light: isLight ? '#a5b4fc' : '#c7d2fe',
      dark: isLight ? '#4f46e5' : '#6366f1',
      contrastText: '#ffffff',
    },
    secondary: {
      main: isLight ? '#ec4899' : '#f472b6',
      light: isLight ? '#f472b6' : '#fbcfe8',
      dark: isLight ? '#db2777' : '#ec4899',
      contrastText: '#ffffff',
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
    error: {
      main: isLight ? '#ef4444' : '#f87171',
      light: isLight ? '#fee2e2' : '#7f1d1d',
      dark: isLight ? '#dc2626' : '#ef4444',
      contrastText: '#ffffff',
    },
    warning: {
      main: isLight ? '#f59e0b' : '#fbbf24',
      light: isLight ? '#fef3c7' : '#78350f',
      dark: isLight ? '#d97706' : '#f59e0b',
      contrastText: '#ffffff',
    },
    info: {
      main: isLight ? '#3b82f6' : '#60a5fa',
      light: isLight ? '#dbeafe' : '#1e3a8a',
      dark: isLight ? '#2563eb' : '#3b82f6',
      contrastText: '#ffffff',
    },
    success: {
      main: isLight ? '#10b981' : '#34d399',
      light: isLight ? '#d1fae5' : '#064e3b',
      dark: isLight ? '#059669' : '#10b981',
      contrastText: '#ffffff',
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
