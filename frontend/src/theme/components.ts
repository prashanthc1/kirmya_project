import { Components, Theme } from '@mui/material/styles';
import { touchHitArea, touchMinHeight } from './tokens';

/**
 * MUI 6 Component Overrides & Global Defaults (Prompt 13/50)
 * 
 * Centralized component behavior ensuring accessibility, refined interactive states,
 * and responsive mobile ergonomics across all MUI primitives.
 */

export const getComponentOverrides = (mode: 'light' | 'dark'): Components<Omit<Theme, 'components'>> => {
  const isLight = mode === 'light';

  return {
    MuiCssBaseline: {
      styleOverrides: {
        // Universal high-contrast focus indicator for keyboard navigation
        'body *:focus-visible': {
          outline: `2px solid ${isLight ? '#0f172a' : '#f8fafc'}`,
          outlineOffset: '2px',
        },
        ':target': {
          scrollMarginTop: '96px',
        },
        body: {
          transition: 'background-color 220ms ease, color 220ms ease',
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
        },
        '@media (prefers-reduced-transparency: reduce)': {
          '*': { backdropFilter: 'none !important' },
          '.MuiPaper-root, .MuiCard-root, .MuiAppBar-root': {
            backgroundColor: `${isLight ? '#ffffff' : '#1e293b'} !important`,
          },
        },
        '@media (prefers-contrast: more)': {
          '*': { backdropFilter: 'none !important' },
          '.MuiPaper-root, .MuiCard-root, .MuiAppBar-root': {
            backgroundColor: `${isLight ? '#ffffff' : '#0b1220'} !important`,
            borderColor: `${isLight ? '#0f172a' : '#f8fafc'} !important`,
          },
          'body *:focus-visible': { outlineWidth: '3px' },
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 16px',
          transition: 'transform 100ms ease-out, background-color 150ms ease, border-color 150ms ease',
          '&&:active': { transform: 'scale(0.97)' },
          ...touchMinHeight,
        },
        containedPrimary: {
          boxShadow: isLight
            ? '0 2px 8px 0 rgba(99, 102, 241, 0.25)'
            : '0 2px 8px 0 rgba(0, 0, 0, 0.4)',
          '&:hover': {
            boxShadow: isLight
              ? '0 4px 14px 0 rgba(99, 102, 241, 0.35)'
              : '0 4px 14px 0 rgba(0, 0, 0, 0.6)',
          },
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'transform 100ms ease-out, background-color 150ms ease',
          '&&:active': { transform: 'scale(0.92)' },
          ...touchHitArea,
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: isLight ? '#ffffff' : '#1e293b',
          border: isLight ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: isLight 
            ? '0 4px 20px 0 rgba(15, 23, 42, 0.04)' 
            : '0 4px 20px 0 rgba(0, 0, 0, 0.25)',
          borderRadius: '16px',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 220ms ease, border-color 220ms ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: isLight 
              ? '0 8px 30px 0 rgba(15, 23, 42, 0.08)' 
              : '0 8px 30px 0 rgba(0, 0, 0, 0.4)',
          },
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
          borderRadius: '16px',
          '@media (max-width:599.95px)': {
            margin: 0,
            width: '100%',
            maxWidth: '100%',
            maxHeight: '92dvh',
            borderRadius: '16px 16px 0 0',
          },
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
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
