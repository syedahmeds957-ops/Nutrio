import { describe, expect, it } from 'vitest';
import { darkColors, lightColors, type ThemeColors } from '../theme.js';

const channel = (value: number) => {
  const v = value / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const SURFACES: (keyof ThemeColors)[] = ['canvas', 'surface', 'surfaceSecondary'];
const TEXT: (keyof ThemeColors)[] = [
  'textPrimary',
  'textSecondary',
  'textMuted',
  'primaryAccessible',
  'proteinText',
  'carbsText',
  'fatText',
  'successText',
  'waterText',
  'warningText',
  'warning',
  'danger',
];

// Icons, bars and rings only need 3:1 (WCAG 1.4.11).
const GRAPHICS: (keyof ThemeColors)[] = ['progressTrack', 'protein'];

describe.each([
  ['light', lightColors],
  ['dark', darkColors],
])('%s theme contrast', (_name, colors) => {
  it.each(TEXT)('%s is at least 4.5:1 on every surface', (token) => {
    for (const surface of SURFACES) {
      expect(contrast(colors[token] as string, colors[surface] as string), `${token} on ${surface}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(GRAPHICS)('%s is at least 3:1 on every surface', (token) => {
    for (const surface of SURFACES) {
      expect(contrast(colors[token] as string, colors[surface] as string), `${token} on ${surface}`).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps the lime icon colour used on grey rows visible', () => {
    // Row icons on surfaceSecondary use primaryAccessible, not the raw lime (1.30:1 on light grey).
    expect(contrast(colors.primaryAccessible, colors.surfaceSecondary)).toBeGreaterThanOrEqual(3);
    expect(contrast(colors.textMuted, colors.surfaceSecondary)).toBeGreaterThanOrEqual(3);
  });

  it('keeps tinted callout text readable on its own tint', () => {
    expect(contrast(colors.successText, colors.successLight)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.warningText, colors.warningLight)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.primaryTintText, colors.limeTint)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.primaryAccessible, colors.limeTint)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps warning and danger readable on their own tinted backgrounds', () => {
    expect(contrast(colors.warning, colors.warningLight)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.danger, colors.dangerLight)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the floating bar labels and hero text readable', () => {
    expect(contrast(colors.floatingBarInactive, colors.floatingBarBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.limeText, colors.heroCardBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.textInverse, colors.warning)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('light error and warning tokens', () => {
  it('use the darker values that pass on the pale canvas', () => {
    expect(lightColors.danger).toBe('#B91C1C');
    expect(lightColors.warning).toBe('#B45309');
  });
});
