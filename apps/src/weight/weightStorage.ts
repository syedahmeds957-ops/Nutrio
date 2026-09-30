import { WeighInEntry } from './types.js';
import { authStorageAdapter } from '../supabase/client.js';
import { getAuthSession } from '../auth/authStorage.js';

const STORAGE_PREFIX_WEIGH_INS = 'nutrio_weigh_ins_';

/**
 * Weigh-ins had no storage at all: the screen built a `WeightTrendEngine` in
 * component state and App.tsx handed it a freshly fabricated "initial weigh-in"
 * every time the screen mounted. So a user could log their weight three times,
 * navigate away, come back, and find a single synthetic entry, 0 kg of net
 * change, and nothing for the adaptive TDEE to calibrate against.
 *
 * Mirrors activityStorage: an in-memory copy so reads stay synchronous during
 * render, localStorage for web, and the durable adapter as the cross-device copy.
 */

function hasStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/** Scoped per user, so two accounts on one device never read each other's log. */
function scope(): string {
  return getAuthSession()?.user?.id || 'guest';
}

const weighInsKey = () => `${STORAGE_PREFIX_WEIGH_INS}${scope()}`;

const memoryWeighIns = new Map<string, WeighInEntry[]>();

let durableQueue: Promise<void> = Promise.resolve();

function enqueueDurable(op: () => Promise<void>): Promise<void> {
  durableQueue = durableQueue.then(op).catch(() => {
    // Ignore storage error
  });
  return durableQueue;
}

/** Resolves once every queued durable write has landed. */
export function flushWeightWrites(): Promise<void> {
  return durableQueue;
}

function sortByDate(entries: WeighInEntry[]): WeighInEntry[] {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}

/** Every weigh-in this user has recorded, oldest first. */
export function loadWeighIns(): WeighInEntry[] {
  const key = weighInsKey();
  const cached = memoryWeighIns.get(key);
  if (cached) return cached;

  let stored: WeighInEntry[] = [];
  if (hasStorage()) {
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) stored = parsed;
    } catch {
      // Ignore storage error
    }
  }

  const entries = sortByDate(stored);
  memoryWeighIns.set(key, entries);
  return entries;
}

/**
 * Replaces the stored log with `entries`.
 *
 * Takes the whole list rather than appending, because the engine already owns
 * the rules — one entry per date, sorted, deletions applied — and a second
 * implementation here would be a second chance to disagree with it.
 */
export function saveWeighIns(entries: WeighInEntry[]): void {
  const key = weighInsKey();
  const sorted = sortByDate(entries);
  memoryWeighIns.set(key, sorted);

  const serialized = JSON.stringify(sorted);
  if (hasStorage()) {
    try {
      window.localStorage.setItem(key, serialized);
    } catch (err) {
      console.warn('[WeightStorage] Error saving weigh-ins:', err);
    }
  }
  void enqueueDurable(() => authStorageAdapter.setItem(key, serialized));
}

/**
 * Pulls the durable copy into memory before first render, so a returning user
 * on a cold start or a new device sees the weigh-ins they already recorded.
 */
export async function hydrateWeighIns(): Promise<void> {
  const key = weighInsKey();
  if (memoryWeighIns.has(key)) return;
  try {
    const raw = await authStorageAdapter.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as WeighInEntry[];
      if (Array.isArray(parsed)) memoryWeighIns.set(key, sortByDate(parsed));
    }
  } catch {
    // Ignore hydration error
  }
}

/**
 * Drops this device's cached copy on logout, alongside the activity and preset
 * caches. The durable per-user record stays — it is keyed by user id, and the
 * same person signing back in must find their history intact.
 */
export function releaseWeightCache(): void {
  memoryWeighIns.clear();
}
