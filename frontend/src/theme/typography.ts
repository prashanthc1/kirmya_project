import { TypographyOptions } from '@mui/material/styles/createTypography';

/**
 * Optical Typography Hierarchy (Prompt 13/50)
 * 
 * Scaled typography with size-dependent tracking, optical leading,
 * and semantic font weights.
 */

export const typography: TypographyOptions = {
  fontFamily: 'var(--font-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  h1: { fontWeight: 800, fontSize: '2.5rem', lineHeight: 1.05, letterSpacing: '-0.035em' },
  h2: { fontWeight: 800, fontSize: '2rem', lineHeight: 1.1, letterSpacing: '-0.03em' },
  h3: { fontWeight: 700, fontSize: '1.625rem', lineHeight: 1.15, letterSpacing: '-0.025em' },
  h4: { fontWeight: 700, fontSize: '1.375rem', lineHeight: 1.2, letterSpacing: '-0.02em' },
  h5: { fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.3, letterSpacing: '-0.015em' },
  h6: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.4, letterSpacing: '-0.01em' },
  subtitle1: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.5, letterSpacing: '-0.005em' },
  subtitle2: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.5, letterSpacing: '0em' },
  body1: { fontSize: '0.95rem', fontWeight: 400, lineHeight: 1.6, letterSpacing: '0em' },
  body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.55, letterSpacing: '0em' },
  button: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.5, letterSpacing: '0em', textTransform: 'none' },
  caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.45, letterSpacing: '0.01em' },
  overline: { fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.4, letterSpacing: '0.08em', textTransform: 'uppercase' },
};
