import { LoggedItem } from './types.js';
import { ComputedUserPlan } from '../plan/types.js';

const STORAGE_PREFIX_ACTIVITIES = 'nutrio_daily_activities_';
const STORAGE_KEY_ACTIVE_PLAN = 'nutrio_active_user_plan';

function hasStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

// In-memory fallback for test runners or environments without localStorage
const memoryActivities = new Map<string, { items: LoggedItem[]; waterMl: number }>();
let memoryPlan: ComputedUserPlan | null = null;

/**
 * Persists daily logged items and water intake to local storage.
 */
export function saveDailyActivities(
  date: string,
  region: 'PK' | 'SA',
  items: LoggedItem[],
  waterMl: number
): void {
  const key = `${STORAGE_PREFIX_ACTIVITIES}${region}_${date}`;
  const payload = { items, waterMl, savedAt: new Date().toISOString() };
  memoryActivities.set(key, payload);

  if (hasStorage()) {
    try {
      window.localStorage.setItem(key, JSON.stringify(payload));
    } catch (err) {
      console.warn('[ActivityStorage] Error saving daily activities:', err);
    }
  }
}

/**
 * Loads daily logged items and water intake from local storage.
 */
export function loadDailyActivities(
  date: string,
  region: 'PK' | 'SA'
): { items: LoggedItem[]; waterMl: number } | null {
  const key = `${STORAGE_PREFIX_ACTIVITIES}${region}_${date}`;
  if (memoryActivities.has(key)) {
    return memoryActivities.get(key)!;
  }

  if (hasStorage()) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        memoryActivities.set(key, parsed);
        return parsed;
      }
    } catch (err) {
      console.warn('[ActivityStorage] Error loading daily activities:', err);
    }
  }

  return null;
}

/**
 * Persists computed user plan to local storage.
 */
export function savePersistedPlan(plan: ComputedUserPlan): void {
  memoryPlan = plan;
  if (hasStorage()) {
    try {
      window.localStorage.setItem(STORAGE_KEY_ACTIVE_PLAN, JSON.stringify(plan));
    } catch (err) {
      console.warn('[ActivityStorage] Error saving active plan:', err);
    }
  }
}

/**
 * Loads computed user plan from local storage.
 */
export function loadPersistedPlan(): ComputedUserPlan | null {
  if (memoryPlan) return memoryPlan;

  if (hasStorage()) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_ACTIVE_PLAN);
      if (raw) {
        const parsed = JSON.parse(raw);
        memoryPlan = parsed;
        return parsed;
      }
    } catch (err) {
      console.warn('[ActivityStorage] Error loading active plan:', err);
    }
  }

  return null;
}

/**
 * Clears local tracker activity storage (for test resets or account wipe).
 */
export function clearDailyActivities(): void {
  memoryActivities.clear();
  memoryPlan = null;
  if (hasStorage()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY_ACTIVE_PLAN);
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX_ACTIVITIES)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch {
      // Ignore cleanup error
    }
  }
}
