import { describe, it, expect } from 'vitest';
import { getTheme, darkColors, lightColors, theme } from '../theme.js';

describe('Solid Lime Dual Theme System (Task 1)', () => {
  it('provides dark theme with solid lime hero, obsidian canvas, and 22px card radius', () => {
    const dark = getTheme('dark');
    expect(dark.colors.canvas).toBe('#0C0D10');
    expect(dark.colors.surface).toBe('#18191E');
    expect(dark.colors.primaryLime).toBe('#A4EB3F');
    expect(dark.colors.heroCardBg).toBe('#A4EB3F');
    expect(dark.colors.limeText).toBe('#0A0B0D');
    expect(dark.colors.textPrimary).toBe('#FFFFFF');
    expect(dark.colors.floatingBarBg).toBe('#18191E');
    expect(dark.radii.card).toBe(22);
  });

  it('provides light theme with solid lime hero, alabaster canvas, and pure white cards', () => {
    const light = getTheme('light');
    expect(light.colors.canvas).toBe('#F6F7FB');
    expect(light.colors.surface).toBe('#FFFFFF');
    expect(light.colors.primaryLime).toBe('#A4EB3F');
    expect(light.colors.heroCardBg).toBe('#A4EB3F');
    expect(light.colors.limeText).toBe('#0A0B0D');
    expect(light.colors.textPrimary).toBe('#0F172A');
    expect(light.colors.floatingBarBg).toBe('#111215');
    expect(light.radii.card).toBe(22);
  });

  it('exports a default theme object backward compatible with existing consumers', () => {
    expect(theme).toBeDefined();
    expect(theme.colors).toBeDefined();
    expect(theme.radii).toBeDefined();
    expect(theme.typography).toBeDefined();
  });

  it('supports Apple HIG design tokens: tabular-nums, modern boxShadow, and accessible tints', () => {
    const dark = getTheme('dark');
    const light = getTheme('light');

    // Tabular numbers for telemetry stability
    expect(dark.typography.heroKcal.fontVariant).toContain('tabular-nums');
    expect(dark.typography.metricValue.fontVariant).toContain('tabular-nums');
    expect(dark.typography.bodyMetric.fontVariant).toContain('tabular-nums');

    // Modern boxShadow without deprecated shadow* props
    expect(dark.shadows.soft.boxShadow).toBeDefined();
    expect('shadowColor' in dark.shadows.soft).toBe(false);

    // High-contrast accessible accents
    expect(dark.colors.primaryAccessible).toBe('#A4EB3F');
    expect(light.colors.primaryAccessible).toBe('#4B6200');
  });

  it('keeps text colours at WCAG AA (4.5:1) on every surface they sit on', () => {
    for (const colors of [lightColors, darkColors]) {
      const surfaces = [colors.canvas, colors.surface, colors.surfaceSecondary];
      for (const fg of [colors.textPrimary, colors.textSecondary, colors.textMuted, colors.primaryAccessible]) {
        for (const bg of surfaces) {
          expect(contrastRatio(fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });
});

function contrastRatio(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
