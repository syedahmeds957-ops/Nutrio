import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { burnBreakdown } from '../burnBreakdown.js';
import { computePlan } from '../engine.js';
import { PlanRevealView } from '../ui/PlanRevealView.js';
import { initI18n } from '../../i18n/config.js';
import { RegionProvider } from '../../common/region/index.js';
import { ThemeProvider, darkColors, lightColors } from '../../theme.js';
import type { PlanUserContext } from '../types.js';

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe('burnBreakdown', () => {
  it('splits rest + activity = burn and puts the marker at the target', () => {
    const b = burnBreakdown({ bmr: 1350, tdee: 1787, kcalTarget: 1500 });
    expect(b.rest).toBe(1350);
    expect(b.activity).toBe(437);
    expect(b.burn).toBe(1787);
    expect(b.deficit).toBe(287);
    expect(b.surplus).toBe(0);
    const bars = b.pieces.filter((p) => p.kind !== 'marker');
    expect(sum(bars.map((p) => p.fraction))).toBeCloseTo(1, 10);
    expect(sum(bars.map((p) => p.kcal))).toBe(1787);
    // Pieces before the marker add up to the target.
    const markerIndex = b.pieces.findIndex((p) => p.kind === 'marker');
    expect(sum(b.pieces.slice(0, markerIndex).map((p) => p.kcal))).toBe(1500);
    expect(b.pieces.filter((p) => p.kind === 'marker')).toHaveLength(1);
  });

  it('clamps the deficit when the target sits at the safety floor', () => {
    // Target equals BMR: the marker lands exactly on the rest/activity edge.
    const b = burnBreakdown({ bmr: 1350, tdee: 1787, kcalTarget: 1350 });
    expect(b.deficit).toBe(437);
    expect(b.pieces.map((p) => p.kind)).toEqual(['rest', 'marker', 'activity']);
    // A target of zero or less can never push the deficit past the burn.
    expect(burnBreakdown({ bmr: 1350, tdee: 1787, kcalTarget: 0 }).deficit).toBe(1787);
    expect(burnBreakdown({ bmr: 1350, tdee: 1787, kcalTarget: -50 }).deficit).toBe(1787);
  });

  it('shows a surplus as its own segment past the burn, with no deficit', () => {
    const b = burnBreakdown({ bmr: 1600, tdee: 2200, kcalTarget: 2500 });
    expect(b.deficit).toBe(0);
    expect(b.surplus).toBe(300);
    expect(b.pieces.map((p) => p.kind)).toEqual(['rest', 'activity', 'surplus', 'marker']);
    expect(sum(b.pieces.map((p) => p.fraction))).toBeCloseTo(1, 10);
  });

  it('keeps rest within the burn when BMR is reported above it', () => {
    const b = burnBreakdown({ bmr: 2000, tdee: 1800, kcalTarget: 1800 });
    expect(b.rest).toBe(1800);
    expect(b.activity).toBe(0);
    expect(sum(b.pieces.map((p) => p.fraction))).toBeCloseTo(1, 10);
  });

  it('returns no pieces for empty input', () => {
    expect(burnBreakdown({ bmr: 0, tdee: 0, kcalTarget: 0 }).pieces).toEqual([]);
  });
});

describe('plan reveal bar', () => {
  const context: PlanUserContext = {
    weightKg: 70,
    heightCm: 170,
    ageYears: 30,
    sex: 'female',
    bmr: 1350,
    tdee: 1787,
    chaiSugarKcalPerDay: 0,
    weeklyChaiSugarKcal: 0,
    isNightShift: false,
    dailySittingHours: 6,
  };
  const plan = computePlan(context, { goal: 'lose', targetRateKgPerWeek: 0.5 });

  const render = (lang: 'en' | 'ar') => {
    initI18n(lang);
    return renderToStaticMarkup(
      React.createElement(
        RegionProvider,
        null,
        React.createElement(ThemeProvider, {
          initialMode: 'light',
          children: React.createElement(PlanRevealView, { plan, onAcceptPlan: () => {}, onAdjustGoal: () => {} }),
        }),
      ),
    );
  };

  it('gives the bar a text equivalent built from the plan numbers only', () => {
    const html = render('en');
    const rest = plan.userContext.bmr;
    const burn = plan.userContext.tdee;
    expect(html).toContain(
      `aria-label="At rest ${rest.toLocaleString('en-US')} + activity ${(burn - rest).toLocaleString('en-US')} = ${burn.toLocaleString('en-US')} kcal burned; target ${plan.targetResult.kcalTarget.toLocaleString('en-US')} kcal"`,
    );
    expect(html).toContain('How your target adds up');
    expect(html).toContain('>Activity ');
    expect(html).toContain('>Target ');
  });

  it('renders one marker and segment widths that add up', () => {
    const html = render('en');
    expect(html.match(/data-testid="burn-bar-marker"/g)).toHaveLength(1);
    const flexes = [...html.matchAll(/style="([^"]*)" data-testid="burn-bar-(?:rest|activity|surplus)"/g)].map((m) =>
      Number(/flex:([0-9.]+)/.exec(m[1])?.[1]),
    );
    expect(flexes.length).toBeGreaterThanOrEqual(2);
    expect(sum(flexes)).toBeCloseTo(1, 5);
  });

  it('drops the stray bullet and the double negative', () => {
    const html = render('en');
    expect(html).not.toContain('•');
    expect(html).not.toContain('−');
    expect(html).toMatch(/\d kcal below your daily burn/);
  });

  it('is translated, with no Latin words in the Arabic copy', () => {
    const html = render('ar');
    expect(html).toContain('كيف يتكوّن هدفك');
    expect(html).toContain('أثناء الراحة');
    expect(html).toContain('أقل من حرقك اليومي');
  });

  it('keeps 3:1 between the segment colours and against the card, in both themes', () => {
    const channel = (v: number) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    const lum = (hex: string) => {
      const n = parseInt(hex.slice(1), 16);
      return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
    };
    const contrast = (a: string, b: string) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    for (const c of [lightColors, darkColors]) {
      expect(contrast(c.textPrimary, c.protein)).toBeGreaterThanOrEqual(3);
      expect(contrast(c.textPrimary, c.surface)).toBeGreaterThanOrEqual(3);
      expect(contrast(c.protein, c.surface)).toBeGreaterThanOrEqual(3);
    }
  });
});
