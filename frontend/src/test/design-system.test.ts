import { describe, it, expect } from 'vitest';
import { getTheme, tokens, springs, layoutWidths } from '../theme';

describe('Design System Foundation (Prompt 13/50)', () => {
  it('instantiates light and dark themes successfully', () => {
    const lightTheme = getTheme('light');
    const darkTheme = getTheme('dark');

    expect(lightTheme.palette.mode).toBe('light');
    expect(darkTheme.palette.mode).toBe('dark');
    expect(lightTheme.palette.primary.main).toBe('#6366f1');
    expect(darkTheme.palette.primary.main).toBe('#818cf8');
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
