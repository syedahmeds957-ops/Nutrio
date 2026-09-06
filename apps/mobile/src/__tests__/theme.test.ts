import { describe, it, expect } from 'vitest';
import { getTheme, darkColors, lightColors, theme } from '../theme.js';

describe('Solid Lime Dual Theme System (Task 1)', () => {
  it('provides dark theme with solid lime hero, obsidian canvas, and 22px card radius', () => {
    const dark = getTheme('dark');
    expect(dark.colors.canvas).toBe('#0C0D10');
    expect(dark.colors.surface).toBe('#18191E');
    expect(dark.colors.primaryLime).toBe('#D4FF00');
    expect(dark.colors.heroCardBg).toBe('#D4FF00');
    expect(dark.colors.limeText).toBe('#0A0B0D');
    expect(dark.colors.textPrimary).toBe('#FFFFFF');
    expect(dark.colors.floatingBarBg).toBe('#18191E');
    expect(dark.radii.card).toBe(22);
  });

  it('provides light theme with solid lime hero, alabaster canvas, and pure white cards', () => {
    const light = getTheme('light');
    expect(light.colors.canvas).toBe('#F6F7FB');
    expect(light.colors.surface).toBe('#FFFFFF');
    expect(light.colors.primaryLime).toBe('#D4FF00');
    expect(light.colors.heroCardBg).toBe('#D4FF00');
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
});
