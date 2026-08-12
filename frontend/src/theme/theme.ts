import { createTheme } from '@mui/material/styles';

export const getTheme = (mode: 'light' | 'dark') => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#6366f1' : '#818cf8', // Indigo
        light: '#a5b4fc',
        dark: '#4f46e5',
      },
      secondary: {
        main: mode === 'light' ? '#ec4899' : '#f472b6', // Pink/Fuchsia
      },
      background: {
        default: mode === 'light' ? '#f8fafc' : '#0f172a',
        // Solid, not translucent. A translucent default composites against
        // whatever happens to sit behind it, so text contrast on any Paper was
        // unpredictable — and Paper nests inside Card constantly, which is how
        // three layers of alpha ended up stacked in the hero.
        paper: mode === 'light' ? '#ffffff' : '#1e293b',
      },
      text: {
        primary: mode === 'light' ? '#0f172a' : '#f8fafc',
        secondary: mode === 'light' ? '#475569' : '#cbd5e1',
      },
    },
    typography: {
      fontFamily: 'var(--font-sans), sans-serif',
      h4: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h6: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      body1: {
        fontSize: '0.95rem',
        lineHeight: 1.6,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          // Single focus indicator for the whole app. Deliberately a high-contrast
          // neutral rather than the brand indigo: primary CTAs are indigo gradients,
          // and an indigo ring on an indigo button is invisible. The offset keeps the
          // ring on the page background rather than on the control itself.
          // Scoped under `body` on purpose: MUI's ButtonBase sets `outline: 0` at the
          // same specificity as a bare `*:focus-visible` and wins on source order, so
          // the ring silently vanished on exactly the controls that need it most.
          // The extra type selector outranks it without resorting to !important.
          'body *:focus-visible': {
            outline: `2px solid ${mode === 'light' ? '#0f172a' : '#f8fafc'}`,
            outlineOffset: '2px',
          },
          // Anchor targets sit below the sticky 1200-z navbar without this.
          ':target': {
            scrollMarginTop: '96px',
          },

          // --- OS accessibility preferences -------------------------------
          // Reduced motion does not mean no feedback: it means no vestibular
          // motion. Rather than zeroing every transition, narrow the animatable
          // set to colour and opacity, so state changes still read while
          // movement stops. Framer Motion's own animations are handled
          // separately by <MotionConfig reducedMotion="user"> in providers.
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

          // The design leans on translucency in 89 places. A user who has asked
          // the OS to reduce it should get solid surfaces, not frosted ones.
          '@media (prefers-reduced-transparency: reduce)': {
            '*': { backdropFilter: 'none !important' },
            '.MuiPaper-root, .MuiCard-root, .MuiAppBar-root': {
              backgroundColor: `${mode === 'light' ? '#ffffff' : '#1e293b'} !important`,
            },
          },

          // Layered alpha makes effective contrast unpredictable, so high
          // contrast gets solid grounds and a defined edge on every surface.
          '@media (prefers-contrast: more)': {
            '*': { backdropFilter: 'none !important' },
            '.MuiPaper-root, .MuiCard-root, .MuiAppBar-root': {
              backgroundColor: `${mode === 'light' ? '#ffffff' : '#0b1220'} !important`,
              borderColor: `${mode === 'light' ? '#0f172a' : '#f8fafc'} !important`,
            },
            'body *:focus-visible': { outlineWidth: '3px' },
          },
        },
      },
      // Cards are solid by default. Blurring every card meant blur communicated
      // no hierarchy — when every surface is glass, none of them reads as
      // elevated — and it put a backdrop-filter compositing pass on dense views
      // like the recruiter pipeline, which renders dozens of cards at once.
      //
      // Glass is now opt-in: components/landing/GlassCard and company/GlassPanel
      // set their own translucency, and they are the outermost layer where they
      // are used, never a surface stacked on another translucent surface.
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b',
            border: mode === 'light' ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: mode === 'light' 
              ? '0 8px 32px 0 rgba(31, 38, 135, 0.04)' 
              : '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
            borderRadius: '16px',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: mode === 'light' 
                ? '0 12px 40px 0 rgba(31, 38, 135, 0.08)' 
                : '0 12px 40px 0 rgba(0, 0, 0, 0.4)',
            },
          },
        },
      },
      // Press feedback. MUI's ripple already fires on pointer-down, but it is
      // faint and all but invisible on the indigo gradient CTAs, so the press
      // read as unacknowledged on touch. A small scale is instant, physical and
      // survives any background.
      //
      // Applied to the controls people actually press rather than to
      // MuiButtonBase, which would also scale full-width menu rows and tabs —
      // a whole row shrinking under the finger reads as a glitch, not a press.
      //
      // `&&` rather than `&`: 82 components set a hover transform through the
      // sx prop, and sx is injected after theme overrides at equal specificity,
      // so a plain `&:active` lost to them — pressing ThemeToggle scaled it UP
      // to its hover value. Doubling the class beats sx without !important.
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            padding: '8px 16px',
            transition: 'transform 100ms ease-out',
            '&&:active': { transform: 'scale(0.97)' },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: 'transform 100ms ease-out',
            // Small targets need a proportionally larger cue to register.
            '&&:active': { transform: 'scale(0.92)' },
          },
        },
      },
      MuiCardActionArea: {
        styleOverrides: {
          root: {
            transition: 'transform 100ms ease-out',
            // Large surfaces need the opposite: barely any, or it feels wobbly.
            '&&:active': { transform: 'scale(0.995)' },
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            transition: 'transform 100ms ease-out',
            '&&:active': { transform: 'scale(0.96)' },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            fontWeight: 500,
            // Only chips that are actually interactive — a plain label chip
            // shrinking under a stray tap would be feedback for nothing.
            '&.MuiChip-clickable': {
              transition: 'transform 100ms ease-out',
              '&&:active': { transform: 'scale(0.96)' },
            },
          },
        },
      },
    },
  });
};
