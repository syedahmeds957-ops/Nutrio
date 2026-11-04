import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { initI18n } from '../../i18n/config.js';
import { completedPercent, ProgressBar } from '../ui/ProgressBar.js';

initI18n('en');

describe('survey progress', () => {
  it('counts completed steps: 0% on the first screen, never 100% before the last is submitted', () => {
    expect(completedPercent(0, 6)).toBe(0);
    expect(completedPercent(3, 6)).toBe(50);
    expect(completedPercent(5, 6)).toBe(83);
    for (let step = 0; step < 6; step += 1) expect(completedPercent(step, 6)).toBeLessThan(100);
  });

  it('stays in range for odd input', () => {
    expect(completedPercent(-2, 6)).toBe(0);
    expect(completedPercent(99, 6)).toBe(83);
    expect(completedPercent(0, 0)).toBe(0);
  });

  it('renders "Step N of M" with the completed share, not 100% on the last step', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProgressBar, { currentStep: 5, totalSteps: 6, stepTitle: 'Preferences' })
    );
    expect(html).toContain('Step 6 of 6');
    expect(html).toContain('83%');
    expect(html).not.toContain('100%');
  });
});
