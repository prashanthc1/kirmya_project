import { describe, it, expect } from 'vitest';
import { getTheme, tokens, springs, layoutWidths } from '../theme';

describe('Design System Foundation (Prompt 13/50)', () => {
  it('instantiates light and dark themes successfully', () => {
    const lightTheme = getTheme('light');
    const darkTheme = getTheme('dark');

    expect(lightTheme.palette.mode).toBe('light');
    expect(darkTheme.palette.mode).toBe('dark');
    expect(lightTheme.palette.primary.main).toBeTruthy();
    expect(darkTheme.palette.primary.main).toBeTruthy();
  });

  /*
   * F15. This test used to pin primary.main to '#6366f1', which asserted
   * nothing about the design beyond "nobody has changed it": the pinned value
   * was itself failing WCAG AA, white on it reading 4.47:1 against a required
   * 4.5:1, and the test passed the whole time.
   *
   * What matters about a palette entry is whether its label can be read on it.
   * MUI paints contrastText on `main` and on `dark` — `dark` is the hover fill —
   * so both are measured, in both modes.
   */
  it('every palette colour can carry its own label at WCAG AA', () => {
    const channels = (hex: string): [number, number, number] => {
      const value = hex.replace('#', '');
      const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
      return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as [number, number, number];
    };

    const relativeLuminance = (hex: string) => {
      const linear = channels(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    };

    const contrast = (a: string, b: string) => {
      const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };

    const AA_NORMAL_TEXT = 4.5;

    for (const mode of ['light', 'dark'] as const) {
      const palette = getTheme(mode).palette;

      for (const name of ['primary', 'secondary', 'error', 'warning', 'info', 'success'] as const) {
        const entry = palette[name];
        for (const shade of ['main', 'dark'] as const) {
          const background = entry[shade];
          const ratio = contrast(entry.contrastText, background);
          expect(
            ratio,
            `${mode}.${name}.${shade}: ${entry.contrastText} on ${background} is ${ratio.toFixed(2)}:1, under ${AA_NORMAL_TEXT}:1`
          ).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
        }
      }

      // Body text on the two surfaces it is actually drawn on.
      for (const surface of [palette.background.default, palette.background.paper]) {
        const ratio = contrast(palette.text.primary, surface);
        expect(ratio, `${mode}: body text on ${surface} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
          AA_NORMAL_TEXT
        );
      }
    }
  });

  it('verifies typography optical tracking and font stack', () => {
    const theme = getTheme('light');
    expect(theme.typography.fontFamily).toContain('var(--font-sans)');
    expect(theme.typography.h1.letterSpacing).toBe('-0.035em');
    expect(theme.typography.h2.letterSpacing).toBe('-0.03em');
    expect(theme.typography.h4.letterSpacing).toBe('-0.02em');
    expect(theme.typography.caption.letterSpacing).toBe('0.01em');
  });

  it('verifies layout constraints and spacing tokens', () => {
    expect(tokens.layout.narrowWidth).toBe(640);
    expect(tokens.layout.standardWidth).toBe(1024);
    expect(tokens.layout.wideWidth).toBe(1280);
    expect(tokens.layout.maxWidth).toBe(1440);
    expect(layoutWidths.max).toBe(1440);
  });

  it('verifies touch target minimums and radii', () => {
    expect(tokens.touchTarget.minHeight).toBe(44);
    expect(tokens.touchTarget.minWidth).toBe(44);
    expect(tokens.radius.sm).toBe(8);
    expect(tokens.radius.md).toBe(12);
    expect(tokens.radius.lg).toBe(16);
    expect(tokens.radius.pill).toBe(9999);
  });

  it('verifies motion springs configuration', () => {
    expect(springs.entrance).toBeDefined();
    expect(springs.hover).toBeDefined();
    expect(springs.momentum).toBeDefined();
    expect((springs.entrance as any).type).toBe('spring');
    expect((springs.hover as any).duration).toBe(0.25);
  });

  it('verifies component overrides for accessible focus and touch hit areas', () => {
    const theme = getTheme('light');
    expect(theme.components?.MuiCssBaseline).toBeDefined();
    expect(theme.components?.MuiButton).toBeDefined();
    expect(theme.components?.MuiIconButton).toBeDefined();
    expect(theme.components?.MuiDialog).toBeDefined();
    expect(theme.components?.MuiCard).toBeDefined();
    expect(theme.components?.MuiChip).toBeDefined();
  });
});
