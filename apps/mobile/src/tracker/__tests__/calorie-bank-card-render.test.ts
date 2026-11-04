import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { initI18n } from '../../i18n/config.js';
import { WeeklyCalorieBankCard } from '../ui/WeeklyCalorieBankCard.js';
import { StreakBadge } from '../ui/StreakBadge.js';
import { weekStripFor } from '../weekStrip.js';
import { weekStartFor } from '../../workout/weekView.js';

const history = (region: 'PK' | 'SA') => {
  // Wed 2026-10-28: finished days logged, today partly logged.
  const strip = weekStripFor('2026-10-28', region);
  return strip.dateKeys.map((_, idx) => ({
    day: strip.weekdays[idx],
    consumed: idx < strip.todayIndex ? 1700 : idx === strip.todayIndex ? 600 : 0,
    target: 1850,
    isLogged: idx <= strip.todayIndex,
    isToday: idx === strip.todayIndex,
  }));
};
const card = (region: 'PK' | 'SA') =>
  React.createElement(WeeklyCalorieBankCard, {
    targetCalories: 1850,
    weekStart: weekStartFor(region),
    dailyHistory: history(region),
  });
const labels = (html: string) => (html.match(/(MON|TUE|WED|THU|FRI|SAT|SUN)(?=<)/g) ?? []).join(' ');

describe('weekly calorie bank card render', () => {
  it('starts the week on Monday for PK and Sunday for SA', () => {
    initI18n('en');
    expect(labels(renderToStaticMarkup(card('PK')))).toBe('MON TUE WED THU FRI SAT SUN');
    expect(labels(renderToStaticMarkup(card('SA')))).toBe('SUN MON TUE WED THU FRI SAT');
  });

  it('names the balance from finished days only and summarises the chart starting with its title', () => {
    initI18n('en');
    const html = renderToStaticMarkup(card('PK'));
    // Mon + Tue finished: 2 x (1850 - 1700) = 300 under; today is not banked.
    expect(html).toContain('300 kcal under');
    expect(html).toMatch(/aria-label="Weekly calorie bank, MON 1,700 of 1,850 kcal[^"]*" role="img"/);
    expect(html).toContain('THU not logged');
    expect(html).toContain('role="heading"');
  });

  it('uses theme colours only, no hard-coded palette literals', () => {
    initI18n('en');
    const html = renderToStaticMarkup(card('PK')) + renderToStaticMarkup(
      React.createElement(StreakBadge, { streakDays: 3, consistencyPct: 60, completedDays: [0, 1, 2], currentDayIndex: 2, showWeek: true })
    );
    for (const literal of ['#F59E0B', '#3B82F6', '#EF4444', '#FEE2E2', '#F7FEE7', '#0A0B0D']) {
      expect(html.toUpperCase()).not.toContain(literal);
    }
  });

  it('renders in Arabic with the Arabic day names and kcal wording', () => {
    initI18n('ar');
    const html = renderToStaticMarkup(card('SA'));
    expect(html).toContain('بنك السعرات الأسبوعي');
    expect(html).toContain('سعرة');
    expect(html.indexOf('أحد')).toBeLessThan(html.indexOf('إثنين'));
    initI18n('en');
  });

  it('shows the streak without the week dots unless asked', () => {
    initI18n('en');
    const base = { streakDays: 3, consistencyPct: 60, completedDays: [0, 1, 2], currentDayIndex: 2 };
    expect(renderToStaticMarkup(React.createElement(StreakBadge, base))).toContain('3 day streak');
    expect(renderToStaticMarkup(React.createElement(StreakBadge, base))).not.toContain('>M<');
    expect(renderToStaticMarkup(React.createElement(StreakBadge, { ...base, showWeek: true }))).toContain('>M<');
  });
});
