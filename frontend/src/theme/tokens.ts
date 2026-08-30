/**
 * Kirmya Platform Design Tokens (Prompt 13/50)
 * 
 * Apple-inspired design token architecture providing semantic constants
 * for spacing, radii, layout constraints, touch hit areas, and depth.
 */

export const tokens = {
  // Border Radii
  radius: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    pill: 9999,
  },

  // Layout Constraints
  layout: {
    narrowWidth: 640,
    standardWidth: 1024,
    wideWidth: 1280,
    maxWidth: 1440,
    headerHeight: 64,
    sidebarWidth: 260,
    collapsedSidebarWidth: 72,
  },

  // Z-Index Hierarchy
  zIndex: {
    base: 0,
    elevated: 10,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    drawer: 1300,
    modal: 1400,
    popover: 1500,
    snackbar: 1600,
    skipLink: 1700,
  },

  // Touch Target Minimums (Apple HIG & WCAG Compliance)
  touchTarget: {
    minHeight: 44,
    minWidth: 44,
  },

  // Transitions & Motion
  transition: {
    fast: '100ms ease-out',
    standard: '200ms ease-in-out',
    surface: '220ms ease',
    slow: '350ms cubic-bezier(0.16, 1, 0.3, 1)',
  },
} as const;

/**
 * Expands an element's hit target to >= 44x44px on coarse pointers
 * using an invisible pseudo-element without mutating visual geometry.
 */
export const touchHitArea = {
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

/**
 * Enforces >= 44px block height on touch devices.
 */
export const touchMinHeight = {
  '@media (pointer: coarse)': { minHeight: 44 },
};
