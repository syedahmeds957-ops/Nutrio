import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { initI18n } from '../../i18n/config.js';
import { RegionProvider } from '../../common/region/index.js';
import { QuickStaplesBar } from '../ui/QuickStaplesBar.js';
import { MAX_USUAL_CHAI_CUPS, usualChaiCups, usualChaiServing } from '../staples.js';
import { CHAI_CUP } from '../../common/ritualDrinks.js';

const render = (chaiCups: number | undefined, region: 'PK' | 'SA' = 'PK') => {
  initI18n('en');
  const bar = React.createElement(QuickStaplesBar, {
    onQuickLog: vi.fn(),
    chaiCups,
    onQuickLogChai: vi.fn(),
  });
  return renderToStaticMarkup(React.createElement(RegionProvider, { initialRegion: region, children: bar }));
};

describe('usualChaiCups', () => {
  const survey = (cups: number | undefined) => ({ lifestyleDesi: { chaiWithSugarCupsPerDay: cups } });

  it('reads the survey cups a day', () => {
    expect(usualChaiCups(survey(3), 'PK')).toBe(3);
  });

  it('is 0 with no survey, no answer or none a day', () => {
    expect(usualChaiCups(null, 'PK')).toBe(0);
    expect(usualChaiCups(undefined, 'PK')).toBe(0);
    expect(usualChaiCups(survey(undefined), 'PK')).toBe(0);
    expect(usualChaiCups(survey(0), 'PK')).toBe(0);
    expect(usualChaiCups(survey(Number.NaN), 'PK')).toBe(0);
  });

  it('rounds and caps the count', () => {
    expect(usualChaiCups(survey(2.6), 'PK')).toBe(3);
    expect(usualChaiCups(survey(500), 'PK')).toBe(MAX_USUAL_CHAI_CUPS);
  });

  it('has no chai chip in Saudi Arabia, where the survey counts gahwa finjans', () => {
    expect(usualChaiCups(survey(3), 'SA')).toBe(0);
  });
});

describe('the usual chai serving', () => {
  it('is the catalogue sweet chai cup, with its calories from food-db', () => {
    const { food, calories } = usualChaiServing('PK');
    expect(food.name).toBe(CHAI_CUP.foodName);
    expect(calories).toBeGreaterThan(0);
  });
});

describe('the "Chai ×N today" chip', () => {
  it('is pinned first when the survey says 3 cups, with the catalogue calories times 3', () => {
    const html = render(3);
    const kcal = usualChaiServing('PK').calories * 3;
    expect(html).toContain('data-testid="chai-chip"');
    expect(html).toContain('Chai ×3 today');
    expect(html).toContain(`${kcal} kcal`);
    expect(html.indexOf('chai-chip')).toBeLessThan(html.indexOf('Egg'));
  });

  it('is hidden at 0 cups, or when not passed', () => {
    expect(render(0)).not.toContain('chai-chip');
    expect(render(undefined)).not.toContain('chai-chip');
  });

  it('replaces the single-cup chai chip when shown, and keeps it when not', () => {
    expect(render(3)).not.toContain('+ 1 Chai');
    expect(render(0)).toContain('1 Chai');
  });
});
