import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveDailyActivities,
  loadDailyActivities,
  clearDailyActivities,
  primeActivitiesFromRemote,
  hydrateActivityStorage,
  flushActivityWrites,
} from '../activityStorage.js';
import { saveAuthSession, clearAuthSession } from '../../auth/authStorage.js';
import { LoggedItem } from '../types.js';
import { AuthSession } from '../../auth/types.js';

const DATE = '2026-09-21';

function sessionFor(id: string, email: string): AuthSession {
  return {
    token: `tok_${id}`,
    user: { id, name: id, email, isRegistered: true, surveyCompleted: true },
    createdAt: new Date().toISOString(),
  };
}

function item(name: string, calories: number): LoggedItem {
  return {
    id: `item_${name}`,
    mealSlot: 'lunch',
    foodName: name,
    servingLabel: '1 plate',
    servingGrams: 200,
    quantity: 1,
    totalGrams: 200,
    calories,
    proteinGrams: 10,
    fatGrams: 5,
    carbGrams: 40,
    loggedAt: new Date().toISOString(),
    syncStatus: 'pending',
  };
}

describe('Tracker activity persistence', () => {
  beforeEach(async () => {
    await clearDailyActivities();
    await clearAuthSession();
  });

  it('keeps each account’s log separate on a shared device', async () => {
    saveAuthSession(sessionFor('user_a', 'a@nutrio.app'));
    saveDailyActivities(DATE, 'PK', [item('biryani', 600)], 500);

    saveAuthSession(sessionFor('user_b', 'b@nutrio.app'));
    // Second account must not inherit or overwrite the first account's day.
    expect(loadDailyActivities(DATE, 'PK')).toBeNull();

    saveDailyActivities(DATE, 'PK', [item('karahi', 700)], 250);
    expect(loadDailyActivities(DATE, 'PK')?.items[0].foodName).toBe('karahi');

    saveAuthSession(sessionFor('user_a', 'a@nutrio.app'));
    expect(loadDailyActivities(DATE, 'PK')?.items[0].foodName).toBe('biryani');
    expect(loadDailyActivities(DATE, 'PK')?.waterMl).toBe(500);
  });

  it('survives a cold start by rehydrating from durable storage', async () => {
    saveAuthSession(sessionFor('user_cold', 'cold@nutrio.app'));
    saveDailyActivities(DATE, 'PK', [item('nihari', 800)], 1000);
    await flushActivityWrites();

    // hydrateActivityStorage is what the app calls on boot; it must find the
    // day even though nothing is in the in-memory cache yet.
    await hydrateActivityStorage([DATE]);
    const restored = loadDailyActivities(DATE, 'PK');
    expect(restored).not.toBeNull();
    expect(restored?.items[0].foodName).toBe('nihari');
    expect(restored?.waterMl).toBe(1000);
  });

  it('seeds history fetched from the backend after a re-login', () => {
    saveAuthSession(sessionFor('user_remote', 'remote@nutrio.app'));
    primeActivitiesFromRemote([
      { date: DATE, region: 'PK', items: [item('haleem', 550)], waterMl: 750 },
      { date: '2026-09-20', region: 'SA', items: [item('kabsa', 900)], waterMl: 400 },
    ]);

    expect(loadDailyActivities(DATE, 'PK')?.items[0].foodName).toBe('haleem');
    expect(loadDailyActivities('2026-09-20', 'SA')?.waterMl).toBe(400);
  });

  it('clears logs on logout so the next account starts clean', async () => {
    saveAuthSession(sessionFor('user_out', 'out@nutrio.app'));
    saveDailyActivities(DATE, 'PK', [item('paratha', 300)], 200);
    expect(loadDailyActivities(DATE, 'PK')).not.toBeNull();

    await clearDailyActivities();
    await hydrateActivityStorage([DATE]);
    expect(loadDailyActivities(DATE, 'PK')).toBeNull();
  });
});
