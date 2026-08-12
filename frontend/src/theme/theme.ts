import { createTheme } from '@mui/material/styles';

/**
 * Expands an element's touch area to at least 44x44 without changing its
 * layout, by centring an invisible pseudo-element over it. Hit area and visual
 * size are separate concerns: a 24px icon button should stay visually 24px and
 * still be reliably tappable.
 *
 * Scoped to coarse pointers so dense mouse-driven views are untouched, and used
 * for inline controls — icon buttons, text links — where a minimum height would
 * disrupt the surrounding text flow.
 */
const touchHitArea = {
  '@media (pointer: coarse)': {
    position: 'relative' as const,
    '&::after': {
      content: '""',
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      width: 'max(100%, 44px)',
      height: 'max(100%, 44px)',
      transform: 'translate(-50%, -50%)',
    },
  },
};

/** For block controls, where growing the box is fine and simpler than a pseudo. */
const touchMinHeight = {
  '@media (pointer: coarse)': { minHeight: 44 },
};

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
    // Tracking is size-specific by nature: letters read further apart as type
    // grows, so display sizes need negative tracking and small text needs
    // slightly positive. Leading moves inversely — tight on headings, looser on
    // body. Previously only h4, h6 and body1 were tuned while h1, h2, h3 and h5
    // were used 101 times untuned, which left the two largest display sizes —
    // where tracking matters most — on browser defaults.
    //
    // fontSize is deliberately left to MUI's scale. Components override it
    // inline in most places, and changing it here would reflow 101 call sites
    // for no gain; the tracking, leading and weight are what was missing.
    typography: {
      fontFamily: 'var(--font-sans), sans-serif',
      h1: { fontWeight: 800, lineHeight: 1.02, letterSpacing: '-0.035em' },
      h2: { fontWeight: 800, lineHeight: 1.06, letterSpacing: '-0.03em' },
      h3: { fontWeight: 700, lineHeight: 1.12, letterSpacing: '-0.025em' },
      h4: { fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' },
      h5: { fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.015em' },
      h6: { fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.01em' },
      subtitle1: { lineHeight: 1.5, letterSpacing: '-0.005em' },
      subtitle2: { lineHeight: 1.5, letterSpacing: '0em' },
      body1: { fontSize: '0.95rem', lineHeight: 1.6, letterSpacing: '0em' },
      body2: { lineHeight: 1.55, letterSpacing: '0em' },
      // Small text is the one place tracking opens up rather than tightens.
      caption: { lineHeight: 1.45, letterSpacing: '0.01em' },
      overline: { lineHeight: 1.4, letterSpacing: '0.08em' },
      button: { letterSpacing: '0em' },
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
            ...touchMinHeight,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: 'transform 100ms ease-out',
            // Small targets need a proportionally larger cue to register.
            '&&:active': { transform: 'scale(0.92)' },
            ...touchHitArea,
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
      // Links are frequently used as controls here — "Forgot password?" and
      // "Create an Account" are both MuiLink with an onClick, and both measured
      // 22px tall. A min-height would turn inline links inside prose into
      // 44px blocks, so these get the pseudo-element instead.
      MuiLink: {
        styleOverrides: {
          root: {
            ...touchHitArea,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            ...touchMinHeight,
          },
        },
      },
      // Selection controls render a small box inside a ButtonBase; the visible
      // tick stays the size it is, the tappable region does not.
      MuiCheckbox: { styleOverrides: { root: { ...touchHitArea } } },
      MuiRadio: { styleOverrides: { root: { ...touchHitArea } } },
      MuiSwitch: { styleOverrides: { root: { ...touchHitArea } } },
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
