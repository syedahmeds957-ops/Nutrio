import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { CoachContext } from '@nutrio/nutrition-core';
import { initI18n } from '../../i18n/config.js';
import { CoachChatScreen } from '../ui/CoachChatScreen.js';
import { StreakBadge } from '../../tracker/ui/StreakBadge.js';
import { TodayHeader } from '../../tracker/ui/TodayHeader.js';
import { ThemeProvider } from '../../theme.js';

const context: CoachContext = {
  displayName: 'Hamza',
  sex: 'male',
  ageYears: 28,
  weightKg: 80,
  goal: 'lose',
  region: 'PK',
  targets: { kcalTarget: 1950, proteinGrams: 145, fatGrams: 55, carbGrams: 220, waterMl: 3000 },
} as CoachContext;

const render = (node: React.ReactElement) =>
  renderToStaticMarkup(React.createElement(ThemeProvider, { initialMode: 'light', children: node }));

describe('coach composer, region pill and streak flame', () => {
  it('gives the send button an accessible name', () => {
    initI18n('en');
    const html = render(React.createElement(CoachChatScreen, { context, onBack: () => {} }));
    expect(html).toContain('aria-label="Send message"');
    expect(html).toMatch(/aria-label="Send message"[^>]*role="button"|role="button"[^>]*aria-label="Send message"/);
  });

  it('wraps the text field so the web focus ring hugs the pill, not the whole composer', () => {
    initI18n('en');
    const html = render(React.createElement(CoachChatScreen, { context, onBack: () => {} }));
    // The field's parent is its own wrapper, never the bar that holds the send button.
    expect(html).toMatch(/<div[^>]*><textarea/);
    expect(html).not.toMatch(/<\/textarea><button/);
  });

  it('names the region pill in full and says what a tap does', () => {
    initI18n('en');
    const html = render(
      React.createElement(TodayHeader, { userName: 'Hamza', region: 'PK', pendingSyncCount: 0, onOpenProfile: () => {}, onSwitchRegion: () => {} }),
    );
    expect(html).toContain('aria-label="Region: Pakistan. Tap to switch."');
    expect(html).toContain('>Pakistan<');
  });

  it('draws the streak flame in the warm warning colour, never the danger red', () => {
    initI18n('en');
    const html = render(
      React.createElement(StreakBadge, { streakDays: 3, consistencyPct: 80, completedDays: [0, 1, 2], currentDayIndex: 2 }),
    );
    expect(html.toLowerCase()).not.toContain('#ef4444');
    expect(html.toLowerCase()).not.toContain('#dc2626');
  });
});
