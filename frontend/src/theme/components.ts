import { Components, Theme } from '@mui/material/styles';
import { touchHitArea, touchMinHeight } from './tokens';

/** Shared controls and material hierarchy for every application route. */

export const getComponentOverrides = (mode: 'light' | 'dark'): Components<Omit<Theme, 'components'>> => {
  const isLight = mode === 'light';

  return {
    MuiCssBaseline: {
      styleOverrides: {
        // Universal high-contrast focus indicator for keyboard navigation
        'body *:focus-visible': {
          outline: `2px solid ${isLight ? '#0066cc' : '#80bfff'}`,
          outlineOffset: '2px',
        },
        ':target': {
          scrollMarginTop: '96px',
        },
        body: {
          transition: 'background-color 220ms ease, color 220ms ease',
          fontOpticalSizing: 'auto',
          WebkitFontSmoothing: 'antialiased',
          '--font-sans': '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        },
        'h1, h2, h3, h4, h5, h6': {
          textWrap: 'balance',
        },
        'button, a, input, select, textarea, [role="button"]': {
          touchAction: 'manipulation',
        },
        '.MuiPaper-root': {
          transition: 'background-color 220ms ease, color 220ms ease',
        },

        // OS accessibility preferences
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionProperty:
              'opacity, color, background-color, border-color, box-shadow, fill, stroke !important',
            transitionDuration: '150ms !important',
            scrollBehavior: 'auto !important',
          },
          '.MuiButton-root:active, .MuiIconButton-root:active, .MuiCardActionArea-root:active, .MuiChip-clickable:active': {
            transform: 'none !important',
          },
        },
        '@media (prefers-reduced-transparency: reduce)': {
          '*': { backdropFilter: 'none !important', WebkitBackdropFilter: 'none !important' },
          '.MuiPaper-root, .MuiCard-root, .MuiAppBar-root, [data-material]': {
            backgroundColor: `${isLight ? '#ffffff' : '#242426'} !important`,
          },
        },
        '@media (prefers-contrast: more)': {
          '*': { backdropFilter: 'none !important', WebkitBackdropFilter: 'none !important' },
          '.MuiPaper-root, .MuiCard-root, .MuiAppBar-root, [data-material]': {
            backgroundColor: `${isLight ? '#ffffff' : '#242426'} !important`,
            border: `1px solid ${isLight ? '#1d1d1f' : '#f5f5f7'} !important`,
          },
          'body *:focus-visible': { outlineWidth: '3px' },
        },
      },
    },

    MuiButtonBase: {
      styleOverrides: {
        root: {
          '&:not(.Mui-disabled):active': { backgroundImage: 'linear-gradient(rgba(127,127,127,.1), rgba(127,127,127,.1))' },
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '0.75rem',
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 16px',
          transition: 'transform 100ms ease-out, background-color 150ms ease, border-color 150ms ease',
          '&&:active': { transform: 'scale(0.97)', transitionDuration: '0ms' },
          ...touchMinHeight,
        },
        containedPrimary: {
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'transform 100ms ease-out, background-color 150ms ease',
          '&&:active': { transform: 'scale(0.96)', transitionDuration: '0ms' },
          ...touchHitArea,
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: isLight ? '#ffffff' : '#242426',
          border: isLight ? '1px solid rgba(29, 29, 31, 0.06)' : '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: isLight ? '0 2px 12px rgba(29,29,31,0.03)' : '0 2px 12px rgba(0,0,0,0.12)',
          borderRadius: '1.25rem',
          transition: 'background-color 220ms ease, border-color 220ms ease',
        },
      },
    },

    MuiCardActionArea: {
      styleOverrides: {
        root: {
          transition: 'transform 100ms ease-out',
          '&&:active': { transform: 'scale(0.995)' },
        },
      },
    },

    MuiCardContent: {
      styleOverrides: {
        root: {
          '&:has(> table)': { overflowX: 'auto' },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          '&:has(> table)': { overflowX: 'auto' },
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        container: {
          '@media (max-width:599.95px)': { alignItems: 'flex-end' },
        },
        paper: {
          borderRadius: '1.5rem',
          backgroundColor: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(36,36,38,0.97)',
          backdropFilter: 'blur(24px) saturate(160%)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
          '@media (max-width:599.95px)': {
            margin: 0,
            width: '100%',
            maxWidth: '100%',
            maxHeight: '92dvh',
            borderRadius: '1.5rem 1.5rem 0 0',
          },
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          backgroundColor: isLight ? 'rgba(245,245,247,0.6)' : 'rgba(255,255,255,0.03)',
          ...touchMinHeight,
        },
      },
    },

    MuiCheckbox: { styleOverrides: { root: { ...touchHitArea } } },
    MuiRadio: { styleOverrides: { root: { ...touchHitArea } } },
    MuiSwitch: { styleOverrides: { root: { ...touchHitArea } } },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          fontWeight: 500,
          '&.MuiChip-clickable': {
            transition: 'transform 100ms ease-out',
            '&&:active': { transform: 'scale(0.96)' },
          },
        },
        label: {
          '@media (max-width:599.95px)': { fontSize: 'max(0.75rem, 1em)' },
        },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: '12px',
          backgroundColor: isLight ? 'rgba(255,255,255,0.94)' : 'rgba(36,36,38,0.96)',
          backdropFilter: 'blur(20px) saturate(160%)',
          border: isLight ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: isLight
            ? '0 10px 25px -5px rgba(15, 23, 42, 0.1)'
            : '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          margin: '2px 6px',
          padding: '8px 12px',
          ...touchMinHeight,
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: isLight ? '#0f172a' : '#1e293b',
          color: isLight ? '#ffffff' : '#f8fafc',
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '0.75rem',
          border: isLight ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
        },
        arrow: {
          color: isLight ? '#0f172a' : '#1e293b',
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          fontWeight: 500,
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 44,
        },
        flexContainer: { gap: '0.25rem' },
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.9rem',
          minHeight: 44,
          ...touchMinHeight,
        },
      },
    },
  };
};
