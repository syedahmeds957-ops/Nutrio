import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { initI18n } from '../../i18n/config.js';
import { RegionProvider } from '../../common/region/index.js';
import { DailyProgressHeader } from '../ui/DailyProgressHeader.js';
import type { DailyTrackerSummary } from '../types.js';

const summary: DailyTrackerSummary = {
  date: '2026-10-29',
  targetCalories: 1350,
  targetProteinGrams: 124,
  targetFatGrams: 45,
  targetCarbGrams: 150,
  totalCaloriesConsumed: 0,
  remainingCalories: 1350,
  totalProteinConsumed: 0,
  totalFatConsumed: 0,
  totalCarbConsumed: 0,
  waterMlConsumed: 0,
  targetWaterMl: 2500,
  items: [],
  pendingSyncCount: 0,
};

const render = (firstDay: boolean) => {
  initI18n('en');
  return renderToStaticMarkup(
    React.createElement(
      RegionProvider,
      null,
      React.createElement(DailyProgressHeader, { summary, firstDay })
    )
  );
};

describe('the day-0 dashboard header', () => {
  it('shows the targets in one card instead of three zero macro tiles', () => {
    const html = render(true);
    expect(html).toContain('Your daily targets');
    expect(html).toContain('124');
    expect(html).not.toContain('progressbar');
    expect(html).not.toContain('Consumed today');
  });

  it('keeps the macro progress tiles once something is logged', () => {
    const html = render(false);
    expect(html).not.toContain('Your daily targets');
    expect(html).toContain('progressbar');
  });
});
