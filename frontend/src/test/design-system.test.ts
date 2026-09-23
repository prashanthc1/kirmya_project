import { describe, it, expect } from 'vitest';
import { getTheme } from '../theme';

describe('Design System Foundation (Prompt 13/50)', () => {
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

});
