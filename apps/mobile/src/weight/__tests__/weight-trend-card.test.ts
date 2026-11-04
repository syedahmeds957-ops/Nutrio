import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { initI18n } from '../../i18n/config.js';
import { WeightTrendChartCard } from '../ui/WeightTrendChartCard.js';
import { AdaptiveTDEECard } from '../ui/AdaptiveTDEECard.js';
import { WeightTrendEngine } from '../engine.js';
import type { WeighInEntry } from '../types.js';

initI18n('en');

const entry = (date: string, weightKg: number): WeighInEntry => ({ id: date, date, weightKg, loggedAt: `${date}T08:00:00Z` });
const summaryOf = (entries: WeighInEntry[]) =>
  new WeightTrendEngine({ weighIns: entries, intakeLogs: [], formulaTDEE: 2000, bmr: 1500 }).getSummary();
const render = (entries: WeighInEntry[]) =>
  renderToStaticMarkup(React.createElement(WeightTrendChartCard, { summary: summaryOf(entries) }));

describe('weight trend card with little data', () => {
  it('shows one reading once, with a prompt to log again, not three identical tiles', () => {
    const html = render([entry('2026-10-20', 62)]);
    expect(html.match(/Raw scale reading/g)?.length).toBe(1);
    expect(html).not.toContain('Overall progress');
    expect(html).not.toContain('Ignores water swings');
    expect(html).toContain('Weigh in again in a few days');
    // The chart exists from the first entry on.
    expect(html).toContain('role="img"');
    expect(html).toContain('Weight chart: 1 weigh-ins, from 62.0 kg to 62.0 kg');
  });

  it('shows the three tiles and the chart once there is a trend', () => {
    const html = render([entry('2026-10-20', 62), entry('2026-10-24', 61.4)]);
    expect(html).toContain('Ignores water swings');
    expect(html).toContain('Change');
    expect(html).not.toContain('Weigh in again in a few days');
    expect(html).toContain('role="img"');
  });
});

describe('calibration copy', () => {
  it('says the same true thing everywhere: starts at 7 days, builds up to 28', () => {
    const html = renderToStaticMarkup(
      React.createElement(AdaptiveTDEECard, { adaptiveResult: summaryOf([entry('2026-10-20', 62)]).adaptiveTDEE, formulaTDEE: 2000 })
    );
    expect(html).toContain('Building your estimate');
    expect(html).toContain('0 of 28 days');
    expect(html).toContain('7 days');
    expect(html).not.toContain('Learning window');
  });
});
