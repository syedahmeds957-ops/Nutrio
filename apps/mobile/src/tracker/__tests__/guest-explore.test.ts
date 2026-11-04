import { beforeEach, describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PAKISTANI_STAPLES_DATA } from '@nutrio/food-db';
import { initI18n } from '../../i18n/config.js';
import { localDateKey } from '../../common/dateKey.js';
import { TrackerEngine } from '../engine.js';
import { releaseLocalUserCache, saveDailyActivities } from '../activityStorage.js';
import { TrackerDashboardScreen } from '../ui/TrackerDashboardScreen.js';

initI18n('en');

const targets = { targetCalories: 2000, targetProteinGrams: 140, targetFatGrams: 55, targetCarbGrams: 235, targetWaterMl: 3000 };
const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

/** Today's diary as a guest on this device logged it before guests became explore-only. */
function storeGuestDay(): string {
  const food = PAKISTANI_STAPLES_DATA[0];
  const engine = new TrackerEngine(targets);
  engine.logItem('breakfast', food, food.servings[0], 2);
  saveDailyActivities(localDateKey(), 'PK', engine.getSummary().items, 750);
  return food.name;
}

const render = (isGuest: boolean) =>
  renderToStaticMarkup(React.createElement(TrackerDashboardScreen, { userName: 'Guest', targets, isGuest, onRequireAuth: () => {} }));

describe('guests explore the tracker; logging needs an account', () => {
  beforeEach(async () => {
    releaseLocalUserCache();
    await AsyncStorage.clear();
  });

  // Runs first: the diary start date is cached in memory once any non-guest render has read it.
  it('writes nothing for a guest, not even the diary start date', async () => {
    render(true);
    await settle();
    expect((await AsyncStorage.getAllKeys()).filter((key) => key.startsWith('nutrio_'))).toEqual([]);
  });

  it('shows a guest an empty day, never meals or water saved on the device', () => {
    const name = storeGuestDay();
    const guest = render(true);
    expect(guest).not.toContain(name);
    expect(guest).not.toContain('750');

    // The same device data still shows outside guest mode, so the guard is what hides it.
    expect(render(false)).toContain(name);
  });
});
