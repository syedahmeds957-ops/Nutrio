import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { initI18n } from '../../i18n/config.js';
import { RegionProvider } from '../../common/region/index.js';
import { DailyProgressHeader } from '../ui/DailyProgressHeader.js';
import { caloriesEatenFraction, caloriesEatenPercent, heroFillFraction } from '../heroFill.js';
import { darkColors, lightColors } from '../../theme.js';
import type { DailyTrackerSummary } from '../types.js';

const summaryWith = (eaten: number, target = 2000): DailyTrackerSummary => ({
  date: '2026-10-29',
  targetCalories: target,
  targetProteinGrams: 124,
  targetFatGrams: 45,
  targetCarbGrams: 150,
  totalCaloriesConsumed: eaten,
  remainingCalories: target - eaten,
  totalProteinConsumed: 0,
  totalFatConsumed: 0,
  totalCarbConsumed: 0,
  waterMlConsumed: 0,
  targetWaterMl: 2500,
  items: [],
  pendingSyncCount: 0,
});

const render = (summary: DailyTrackerSummary, firstDay = false) => {
  initI18n('en');
  return renderToStaticMarkup(
    React.createElement(RegionProvider, null, React.createElement(DailyProgressHeader, { summary, firstDay }))
  );
};

/** Height of the hero fill, as the percent string in the markup. */
const fillHeight = (html: string): string | null => {
  const tag = html.match(/<div[^>]*data-testid="hero-fill"[^>]*>/)?.[0] ?? '';
  return tag.match(/height:\s*([\d.]+%)/)?.[1] ?? null;
};

describe('hero fill maths', () => {
  it('is full at 0 eaten, half at half, empty at the target', () => {
    expect(heroFillFraction(0, 2000)).toBe(1);
    expect(heroFillFraction(1000, 2000)).toBe(0.5);
    expect(heroFillFraction(2000, 2000)).toBe(0);
  });

  it('never goes negative over the target, and never above 1', () => {
    expect(heroFillFraction(3500, 2000)).toBe(0);
    expect(caloriesEatenFraction(3500, 2000)).toBe(1);
    expect(caloriesEatenFraction(-50, 2000)).toBe(0);
    expect(caloriesEatenPercent(3500, 2000)).toBe(100);
  });

  it('reads no target, zero target and bad numbers as nothing eaten', () => {
    expect(caloriesEatenFraction(500, 0)).toBe(0);
    expect(caloriesEatenFraction(500, -10)).toBe(0);
    expect(caloriesEatenFraction(Number.NaN, 2000)).toBe(0);
    expect(heroFillFraction(500, 0)).toBe(1);
  });

  it('rounds the percent eaten', () => {
    expect(caloriesEatenPercent(500, 1350)).toBe(37);
  });
});

describe('the draining hero card', () => {
  it('has a fill and a progress bar with the percent eaten', () => {
    const html = render(summaryWith(500));
    expect(html).toContain('data-testid="hero-fill"');
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('Calories eaten, as a share of your daily target');
    expect(fillHeight(html)).toBe('75%');
  });

  it('is full when nothing is eaten', () => {
    expect(fillHeight(render(summaryWith(0)))).toBe('100%');
  });

  it('is empty, never negative, over the target', () => {
    const html = render(summaryWith(3200));
    expect(fillHeight(html)).toBe('0%');
    expect(html).toContain('calories over limit');
  });

  it('stays full on the first day, without a progress bar on the card', () => {
    const html = render(summaryWith(0), true);
    expect(fillHeight(html)).toBe('100%');
    expect(html).not.toContain('role="progressbar"');
  });
});

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
  it.each([1, 0.92, 0.9])('text at %s opacity is 4.5:1 on the fill and on the drained part', (alpha) => {
    expect(contrastOn(colors.limeText, alpha, colors.heroCardBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastOn(colors.limeText, alpha, colors.heroCardDrained)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the fill visibly apart from the drained part', () => {
    const [hi, lo] = [luminance(rgb(colors.heroCardBg)), luminance(rgb(colors.heroCardDrained))].sort((x, y) => y - x);
    expect((hi + 0.05) / (lo + 0.05)).toBeGreaterThanOrEqual(1.5);
  });
});
