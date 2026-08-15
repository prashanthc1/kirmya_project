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

          // Ease the dark/light switch. Toggling used to jump the full viewport
          // from near-black to near-white in a single frame — measured as two
          // background values with no intermediate ones. A large, abrupt
          // brightness change is a comfort problem, especially at night.
          //
          // The reduced-motion rule above keeps background-color and color in
          // the animatable set on purpose, so the fade is still configured
          // there — a colour change is not vestibular motion, and easing it is
          // gentler than cutting. In practice it is hard to perceive under that
          // preference: the shortened 150ms duration is comparable to the
          // ~140ms main-thread stall while Emotion regenerates the stylesheet,
          // so it largely completes before a frame can paint. Switching the
          // theme to MUI v6 CSS variables would remove that stall and is the
          // real fix if the reduced-motion case matters.
          body: {
            transition: 'background-color 220ms ease, color 220ms ease',
          },
          '.MuiPaper-root': {
            transition: 'background-color 220ms ease, color 220ms ease',
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
            transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 220ms ease, border-color 220ms ease',
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
      // --- Mobile adaptation ------------------------------------------------
      // A centred dialog on a 390px screen is a 326px card with 32px of dead
      // margin either side — the least usable width on the smallest screen.
      // Below the sm breakpoint these become bottom sheets: full width,
      // anchored to the thumb, rounded only at the top edge so the surface
      // reads as having risen from below rather than as a floating card.
      //
      // Done in CSS rather than the fullScreen prop because that prop needs a
      // hook at every one of the 324 call sites; this reaches all of them.
      MuiDialog: {
        styleOverrides: {
          container: {
            '@media (max-width:599.95px)': { alignItems: 'flex-end' },
          },
          paper: {
            '@media (max-width:599.95px)': {
              margin: 0,
              width: '100%',
              maxWidth: '100%',
              // dvh, not vh: a sheet sized against the hidden-chrome viewport
              // would push its own actions off the bottom of the screen.
              maxHeight: '92dvh',
              borderRadius: '16px 16px 0 0',
            },
          },
        },
      },
      // Tables laid straight into a card were not merely overflowing, they were
      // being clipped: a 398px table inside a 356px CardContent whose Paper sets
      // overflow hidden, so the right-hand columns could not be reached at all.
      // :has() lets the container opt itself into scrolling without touching the
      // 13 pages that do this.
      MuiCardContent: {
        styleOverrides: {
          root: {
            '&:has(> table)': { overflowX: 'auto' },
          },
        },
      },
      // Same clipping, one level up: some tables sit straight inside the Paper,
      // which sets overflow hidden, so a 484px table in a 358px card simply lost
      // its right-hand columns.
      MuiPaper: {
        styleOverrides: {
          root: {
            '&:has(> table)': { overflowX: 'auto' },
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
          // Legibility floor for phones. Chips carry the densest labels in the
          // app and several call sites shrink them to 0.6-0.72rem, which
          // measured as low as 9.6px — below any reasonable reading size.
          //
          // max(0.75rem, 1em) reads as "at least 12px, otherwise inherit what
          // the call site asked for": 1em resolves against the chip root, where
          // the sx font-size lands, so larger chips keep their size and only the
          // too-small ones are lifted.
          label: {
            '@media (max-width:599.95px)': { fontSize: 'max(0.75rem, 1em)' },
          },
        },
      },
    },
  });
};
