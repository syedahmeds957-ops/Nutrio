import { afterEach, describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import i18n from 'i18next';
import { initI18n } from '../../i18n/config.js';
import { TrainingCard } from '../ui/TrainingCard.js';

initI18n('en');

const render = (training: React.ComponentProps<typeof TrainingCard>['training']) =>
  renderToStaticMarkup(React.createElement(TrainingCard, { training }));

afterEach(async () => {
  await i18n.changeLanguage('en');
});

describe('TrainingCard', () => {
  const training = {
    planned: 4,
    done: 3,
    missed: [
      { template: 'lower' as const, variant: 'b' as const },
      { template: 'upper' as const, variant: 'a' as const },
    ],
  };

  it('shows done of planned, one segment per session, and the missed sessions', () => {
    const html = render(training);
    expect(html).toContain('Workouts');
    expect(html).toContain('3 of 4');
    expect(html).toContain('Missed: Lower body B, Upper body A');
    expect(html).toMatch(/role="progressbar"[^>]*aria-valuenow="3"|aria-valuenow="3"[^>]*role="progressbar"/);
  });

  it('leaves out the missed line when nothing was missed', () => {
    expect(render({ planned: 3, done: 3, missed: [] })).not.toContain('Missed');
  });

  it('reads in Arabic with the Arabic comma', async () => {
    await i18n.changeLanguage('ar');
    const html = render(training);
    expect(html).toContain('3 من 4');
    expect(html).toContain('فائت: ');
    expect(html).toContain('، ');
  });
});
