import { describe, expect, it } from 'vitest';
import { darkColors, lightColors } from '../../theme.js';

// Same method as theme-contrast.test.ts, plus the text's own opacity over the base.
const channel = (value: number) => {
  const v = value / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const luminance = (c: number[]) => 0.2126 * channel(c[0]) + 0.7152 * channel(c[1]) + 0.0722 * channel(c[2]);
const contrastOn = (text: string, alpha: number, bg: string) => {
  const b = rgb(bg);
  const blended = rgb(text).map((v, i) => v * alpha + b[i] * (1 - alpha));
  const [hi, lo] = [luminance(blended), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe.each([
  ['light', lightColors],
  ['dark', darkColors],
])('hero text contrast, %s theme', (_name, colors) => {
  // The big number is full black; the sub line is 0.9 and the weekday labels 0.92.
  it.each([1, 0.92, 0.9])('text at %s opacity is 4.5:1 on the hero card', (alpha) => {
    expect(contrastOn(colors.limeText, alpha, colors.heroCardBg)).toBeGreaterThanOrEqual(4.5);
  });
});
