import type { WorkoutLog } from '@nutrio/workout-core';
import { authStorageAdapter } from '../supabase/client.js';
import { getAuthSession } from '../auth/authStorage.js';
import { addDaysToKey, localDateKey } from '../common/dateKey.js';

const STORAGE_PREFIX_WORKOUT_LOGS = 'nutrio_workout_logs_';
/** A year of workouts is plenty for progression and the week view. */
const KEEP_DAYS = 365;

/**
 * Finished workouts, newest first. Same shape as workoutStorage: an in-memory
 * copy for synchronous reads during render, localStorage on web, and the
 * durable adapter for a cold start on native.
 */

function hasStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/** Scoped per user, so two accounts on one device never read each other's logs. */
function scope(): string {
  return getAuthSession()?.user?.id || 'guest';
}

const logsKey = () => `${STORAGE_PREFIX_WORKOUT_LOGS}${scope()}`;

const memoryLogs = new Map<string, WorkoutLog[]>();

let durableQueue: Promise<void> = Promise.resolve();

function enqueueDurable(op: () => Promise<void>): Promise<void> {
  durableQueue = durableQueue.then(op).catch(() => {
    // Ignore storage error
  });
  return durableQueue;
}

/** Resolves once every queued durable write has landed; lets tests simulate a cold start. */
export function flushWorkoutLogWrites(): Promise<void> {
  return durableQueue;
}

function isLog(value: unknown): value is WorkoutLog {
  const log = value as WorkoutLog;
  return Boolean(log && typeof log.dateKey === 'string' && typeof log.day === 'string' && Array.isArray(log.exercises));
}

function parseLogs(raw: string | null): WorkoutLog[] | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isLog) : null;
  } catch {
    return null;
  }
}

const newestFirst = (a: WorkoutLog, b: WorkoutLog) =>
  b.dateKey.localeCompare(a.dateKey) || (b.finishedAt ?? b.startedAt).localeCompare(a.finishedAt ?? a.startedAt);

export function loadWorkoutLogs(): WorkoutLog[] {
  const key = logsKey();
  const cached = memoryLogs.get(key);
  if (cached) return cached;

  let stored: WorkoutLog[] = [];
  if (hasStorage()) {
    try {
      stored = parseLogs(window.localStorage.getItem(key)) ?? [];
    } catch {
      // Ignore storage error
    }
  }
  memoryLogs.set(key, stored);
  return stored;
}

function persist(key: string, logs: WorkoutLog[]): void {
  memoryLogs.set(key, logs);
  const serialized = JSON.stringify(logs);
  if (hasStorage()) {
    try {
      window.localStorage.setItem(key, serialized);
    } catch (err) {
      console.warn('[WorkoutLogStorage] Error saving workout logs:', err);
    }
  }
  void enqueueDurable(() => authStorageAdapter.setItem(key, serialized));
}

/**
 * Saves a finished workout. One planned session done on one date is one log:
 * saving it again replaces it. Logs older than a year are dropped.
 */
export function saveWorkoutLog(log: WorkoutLog, todayKey: string = localDateKey()): WorkoutLog[] {
  const key = logsKey();
  const cutoff = addDaysToKey(todayKey, -KEEP_DAYS);
  const kept = loadWorkoutLogs().filter(
    (existing) => !(existing.dateKey === log.dateKey && existing.day === log.day) && existing.dateKey >= cutoff
  );
  const next = [log, ...kept].sort(newestFirst);
  persist(key, next);
  return next;
}

/** Pulls the durable copy into memory before it is read. Safe to call more than once. */
export async function hydrateWorkoutLogs(): Promise<void> {
  const key = logsKey();
  if (memoryLogs.get(key)?.length) return;
  try {
    const logs = parseLogs(await authStorageAdapter.getItem(key));
    if (logs) memoryLogs.set(key, logs.sort(newestFirst));
  } catch {
    // Ignore hydration error
  }
}

/** Drops the cached copy on logout. The durable per-user record stays for their next sign-in. */
export function releaseWorkoutLogCache(): void {
  memoryLogs.clear();
}
