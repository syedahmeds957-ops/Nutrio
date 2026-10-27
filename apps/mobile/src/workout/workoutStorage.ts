import type { WeeklyWorkoutPlan } from '@nutrio/workout-core';
import { planForDate, upgradePlan } from './core.js';
import { localDateKey } from '../common/dateKey.js';
import { authStorageAdapter } from '../supabase/client.js';
import { getAuthSession } from '../auth/authStorage.js';

const STORAGE_PREFIX_WORKOUT_PLAN = 'nutrio_workout_plan_';

/**
 * The user's weekly workout plan. Mirrors weightStorage: an in-memory copy so
 * reads stay synchronous during render, localStorage for web, and the durable
 * adapter as the copy that survives a cold start on native.
 */

function hasStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/** Scoped per user, so two accounts on one device never read each other's plan. */
function scope(): string {
  return getAuthSession()?.user?.id || 'guest';
}

const planKey = () => `${STORAGE_PREFIX_WORKOUT_PLAN}${scope()}`;

/** `null` is a real value here: "this user has no plan yet". */
const memoryPlans = new Map<string, WeeklyWorkoutPlan | null>();

let durableQueue: Promise<void> = Promise.resolve();

function enqueueDurable(op: () => Promise<void>): Promise<void> {
  durableQueue = durableQueue.then(op).catch(() => {
    // Ignore storage error
  });
  return durableQueue;
}

/** Resolves once every queued durable write has landed; lets tests simulate a cold start. */
export function flushWorkoutWrites(): Promise<void> {
  return durableQueue;
}

/**
 * A stored plan we can trust enough to render; anything else reads as no plan.
 * Plans saved before the cardio block (phase 6b) come back upgraded.
 */
function readPlan(value: unknown): { plan: WeeklyWorkoutPlan; upgraded: boolean } | null {
  const parsed = value as WeeklyWorkoutPlan;
  if (parsed?.version !== 1 || !Array.isArray(parsed.sessions) || !parsed.settings) return null;
  // Older plans gain what the generator now adds, and every plan follows the calendar (Ramadan mode).
  const plan = planForDate(upgradePlan(parsed), localDateKey());
  return { plan, upgraded: plan !== parsed };
}

function parsePlan(raw: string | null): { plan: WeeklyWorkoutPlan; upgraded: boolean } | null {
  if (!raw) return null;
  try {
    return readPlan(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** A plan from the cloud backup, checked and brought up to date like a stored one; null when unusable. */
export function planFromBackup(value: unknown): WeeklyWorkoutPlan | null {
  try {
    return readPlan(value)?.plan ?? null;
  } catch {
    return null;
  }
}

export function loadWorkoutPlan(): WeeklyWorkoutPlan | null {
  const key = planKey();
  if (memoryPlans.has(key)) {
    const cached = memoryPlans.get(key) ?? null;
    // An app left open across the start or end of Ramadan catches up on the next read.
    const dated = cached ? planForDate(cached, localDateKey()) : null;
    if (dated && dated !== cached) saveWorkoutPlan(dated);
    return dated;
  }

  let stored: ReturnType<typeof parsePlan> = null;
  if (hasStorage()) {
    try {
      stored = parsePlan(window.localStorage.getItem(key));
    } catch {
      // Ignore storage error
    }
  }
  if (stored?.upgraded) saveWorkoutPlan(stored.plan);
  else memoryPlans.set(key, stored?.plan ?? null);
  return stored?.plan ?? null;
}

export function saveWorkoutPlan(plan: WeeklyWorkoutPlan): void {
  const key = planKey();
  memoryPlans.set(key, plan);

  const serialized = JSON.stringify(plan);
  if (hasStorage()) {
    try {
      window.localStorage.setItem(key, serialized);
    } catch (err) {
      console.warn('[WorkoutStorage] Error saving workout plan:', err);
    }
  }
  void enqueueDurable(() => authStorageAdapter.setItem(key, serialized));
}

export function clearWorkoutPlan(): void {
  const key = planKey();
  memoryPlans.set(key, null);
  if (hasStorage()) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage error
    }
  }
  void enqueueDurable(() => authStorageAdapter.removeItem(key));
}

/**
 * Pulls the durable copy into memory before it is read, so a returning user on
 * a cold start sees the plan they already made. Safe to call more than once.
 */
export async function hydrateWorkoutPlan(): Promise<void> {
  const key = planKey();
  if (memoryPlans.get(key)) return;
  try {
    const stored = parsePlan(await authStorageAdapter.getItem(key));
    if (stored?.upgraded) saveWorkoutPlan(stored.plan);
    else if (stored) memoryPlans.set(key, stored.plan);
  } catch {
    // Ignore hydration error
  }
}

/** Drops the cached copy on logout. The durable per-user record stays for their next sign-in. */
export function releaseWorkoutCache(): void {
  memoryPlans.clear();
}
