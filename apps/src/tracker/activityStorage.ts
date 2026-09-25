import { LoggedItem } from './types.js';
import { ComputedUserPlan } from '../plan/types.js';
import { authStorageAdapter } from '../supabase/client.js';
import { getAuthSession } from '../auth/authStorage.js';

const STORAGE_PREFIX_ACTIVITIES = 'nutrio_daily_activities_';
const STORAGE_PREFIX_ACTIVE_PLAN = 'nutrio_active_user_plan_';
// Pre-scoping key. Still read so an install that saved a plan before the key
// was scoped per user does not lose it on upgrade.
const LEGACY_KEY_ACTIVE_PLAN = 'nutrio_active_user_plan';

function hasStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

// In-memory fallback for test runners or environments without localStorage
const memoryActivities = new Map<string, { items: LoggedItem[]; waterMl: number }>();
const memoryPlans = new Map<string, ComputedUserPlan>();

// window.localStorage exists on web only. On native these writes are the sole
// durable copy, so a log survives a cold start. Serialized through one chain so
// a logout clear cannot land after a later save and wipe it.
let durableQueue: Promise<void> = Promise.resolve();

function enqueueDurable(op: () => Promise<void>): Promise<void> {
  durableQueue = durableQueue.then(op).catch(() => {
    // Ignore storage error
  });
  return durableQueue;
}

/** Resolves once every queued durable write has landed. */
export function flushActivityWrites(): Promise<void> {
  return durableQueue;
}

/**
 * Activity keys are scoped per user: unscoped keys let two accounts on one
 * device read and overwrite the same day's log.
 */
function activityScope(): string {
  return getAuthSession()?.user?.id || 'guest';
}

function activityKey(date: string, region: 'PK' | 'SA'): string {
  return `${STORAGE_PREFIX_ACTIVITIES}${activityScope()}_${region}_${date}`;
}

/**
 * The plan is scoped per user for the same reason activities are: one device
 * can hold two accounts, and an unscoped key let the second one read the
 * first one's targets.
 */
function planKey(): string {
  return `${STORAGE_PREFIX_ACTIVE_PLAN}${activityScope()}`;
}

/**
 * Persists daily logged items and water intake to local storage.
 */
export function saveDailyActivities(
  date: string,
  region: 'PK' | 'SA',
  items: LoggedItem[],
  waterMl: number
): void {
  const key = activityKey(date, region);
  const payload = { items, waterMl, savedAt: new Date().toISOString() };
  memoryActivities.set(key, payload);

  const serialized = JSON.stringify(payload);
  if (hasStorage()) {
    try {
      window.localStorage.setItem(key, serialized);
    } catch (err) {
      console.warn('[ActivityStorage] Error saving daily activities:', err);
    }
  }
  void enqueueDurable(() => authStorageAdapter.setItem(key, serialized));
}

/**
 * Loads daily logged items and water intake from local storage.
 * Synchronous by design (the tracker engine is built during render), so the
 * durable copy must already be in memory — see hydrateActivityStorage.
 */
export function loadDailyActivities(
  date: string,
  region: 'PK' | 'SA'
): { items: LoggedItem[]; waterMl: number } | null {
  const key = activityKey(date, region);
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
 * Pulls the current user's persisted days out of durable native storage into
 * memory, so the synchronous loaders above can see them after a cold start.
 */
export async function hydrateActivityStorage(dates: string[]): Promise<void> {
  await durableQueue;

  const regions: Array<'PK' | 'SA'> = ['PK', 'SA'];
  for (const date of dates) {
    for (const region of regions) {
      const key = activityKey(date, region);
      if (memoryActivities.has(key)) continue;
      try {
        const raw = await authStorageAdapter.getItem(key);
        if (raw) {
          memoryActivities.set(key, JSON.parse(raw));
        }
      } catch {
        // Ignore hydration error for this day
      }
    }
  }
}

/**
 * Seeds local storage from records fetched off the backend, so a fresh device
 * or a re-login shows the user's existing history.
 */
export function primeActivitiesFromRemote(
  records: Array<{ date: string; region: 'PK' | 'SA'; items: LoggedItem[]; waterMl: number }>
): void {
  records.forEach((record) => {
    const key = activityKey(record.date, record.region);
    const payload = {
      items: record.items,
      waterMl: record.waterMl,
      savedAt: new Date().toISOString(),
    };
    memoryActivities.set(key, payload);
    const serialized = JSON.stringify(payload);
    if (hasStorage()) {
      try {
        window.localStorage.setItem(key, serialized);
      } catch {
        // Ignore storage error
      }
    }
    void enqueueDurable(() => authStorageAdapter.setItem(key, serialized));
  });
}

/**
 * Persists computed user plan to local storage.
 */
export function savePersistedPlan(plan: ComputedUserPlan): void {
  const key = planKey();
  memoryPlans.set(key, plan);
  const serialized = JSON.stringify(plan);
  if (hasStorage()) {
    try {
      window.localStorage.setItem(key, serialized);
    } catch (err) {
      console.warn('[ActivityStorage] Error saving active plan:', err);
    }
  }
  void enqueueDurable(() => authStorageAdapter.setItem(key, serialized));
}

/**
 * Loads computed user plan from local storage.
 */
export function loadPersistedPlan(): ComputedUserPlan | null {
  const key = planKey();
  const cached = memoryPlans.get(key);
  if (cached) return cached;

  if (hasStorage()) {
    try {
      const raw =
        window.localStorage.getItem(key) ??
        window.localStorage.getItem(LEGACY_KEY_ACTIVE_PLAN);
      if (raw) {
        const parsed = JSON.parse(raw);
        memoryPlans.set(key, parsed);
        return parsed;
      }
    } catch (err) {
      console.warn('[ActivityStorage] Error loading active plan:', err);
    }
  }

  return null;
}

/** Restores the persisted plan from durable native storage on boot. */
export async function hydratePersistedPlan(): Promise<ComputedUserPlan | null> {
  const key = planKey();
  const cached = memoryPlans.get(key);
  if (cached) return cached;
  await durableQueue;
  try {
    const raw =
      (await authStorageAdapter.getItem(key)) ??
      (await authStorageAdapter.getItem(LEGACY_KEY_ACTIVE_PLAN));
    if (raw) {
      const parsed = JSON.parse(raw) as ComputedUserPlan;
      memoryPlans.set(key, parsed);
      return parsed;
    }
  } catch {
    // Ignore hydration error
  }
  return null;
}

/**
 * Clears local tracker activity storage (for test resets or account wipe).
 * Called on logout so the next account does not inherit these logs.
 */
export async function clearDailyActivities(): Promise<void> {
  const keys = Array.from(memoryActivities.keys());
  const planKeys = Array.from(memoryPlans.keys());
  memoryActivities.clear();
  memoryPlans.clear();

  if (hasStorage()) {
    try {
      window.localStorage.removeItem(LEGACY_KEY_ACTIVE_PLAN);
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (
          key &&
          (key.startsWith(STORAGE_PREFIX_ACTIVITIES) || key.startsWith(STORAGE_PREFIX_ACTIVE_PLAN))
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch {
      // Ignore cleanup error
    }
  }

  await enqueueDurable(async () => {
    await authStorageAdapter.removeItem(LEGACY_KEY_ACTIVE_PLAN);
    for (const key of [...keys, ...planKeys]) {
      await authStorageAdapter.removeItem(key);
    }
  });
}

/**
 * Logout path. Drops the in-memory caches so the next account on this device
 * starts clean, but leaves the durable per-user records in place: the keys are
 * scoped by user id, so nothing leaks, and signing back in restores the plan
 * and the logged days instead of re-running onboarding.
 */
export function releaseLocalUserCache(): void {
  memoryActivities.clear();
  memoryPlans.clear();
}
