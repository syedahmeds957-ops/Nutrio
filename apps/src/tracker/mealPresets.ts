import { authStorageAdapter } from '../supabase/client.js';
import { getAuthSession } from '../auth/authStorage.js';

const STORAGE_PREFIX_PRESETS = 'nutrio_meal_presets_';
const STORAGE_PREFIX_USAGE = 'nutrio_food_usage_';

/** Most-logged list length. Beyond this the tail is noise, not a shortcut. */
export const MAX_RECENT_FOODS = 12;
/** Presets past this point stop being a shortcut and become a second catalogue. */
export const MAX_PRESETS = 20;

export interface MealPresetEntry {
  foodId: string;
  foodName: string;
  quantity: number;
}

export interface MealPreset {
  id: string;
  name: string;
  entries: MealPresetEntry[];
  createdAt: string;
}

function hasStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/**
 * Scoped per user for the same reason activities are: one device can hold two
 * accounts, and an unscoped key would let the second read the first's presets.
 */
function scope(): string {
  return getAuthSession()?.user?.id || 'guest';
}

const presetsKey = () => `${STORAGE_PREFIX_PRESETS}${scope()}`;
const usageKey = () => `${STORAGE_PREFIX_USAGE}${scope()}`;

// In-memory mirror so reads stay synchronous during render, matching
// activityStorage. The durable copy is the source of truth across devices.
const memoryPresets = new Map<string, MealPreset[]>();
const memoryUsage = new Map<string, Record<string, number>>();

let durableQueue: Promise<void> = Promise.resolve();

function enqueueDurable(op: () => Promise<void>): Promise<void> {
  durableQueue = durableQueue.then(op).catch(() => {
    // Ignore storage error
  });
  return durableQueue;
}

/** Resolves once every queued durable write has landed. */
export function flushPresetWrites(): Promise<void> {
  return durableQueue;
}

function readJson<T>(key: string, fallback: T): T {
  if (!hasStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  const serialized = JSON.stringify(value);
  if (hasStorage()) {
    try {
      window.localStorage.setItem(key, serialized);
    } catch {
      // Ignore storage error
    }
  }
  void enqueueDurable(() => authStorageAdapter.setItem(key, serialized));
}

// ---------------------------------------------------------------- Presets

/**
 * A user's saved meal combinations ("My usual breakfast").
 *
 * The custom-meal basket already lets someone stack 2 eggs + cucumber + greek
 * yogurt; without this they rebuild that stack every morning. Saving it makes
 * the catalogue self-extending per user, which is worth more than another
 * hundred catalogue entries for the foods people actually repeat.
 */
export function loadMealPresets(): MealPreset[] {
  const key = presetsKey();
  const cached = memoryPresets.get(key);
  if (cached) return cached;

  const stored = readJson<MealPreset[]>(key, []);
  const presets = Array.isArray(stored) ? stored : [];
  memoryPresets.set(key, presets);
  return presets;
}

export function saveMealPreset(name: string, entries: MealPresetEntry[]): MealPreset | null {
  const trimmed = name.trim();
  if (!trimmed || entries.length === 0) return null;

  const key = presetsKey();
  const existing = loadMealPresets();

  const preset: MealPreset = {
    id: `preset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: trimmed,
    entries,
    createdAt: new Date().toISOString(),
  };

  // Same name replaces rather than duplicates — someone re-saving "My usual
  // breakfast" after changing it means to update it, not to keep both.
  const withoutDuplicate = existing.filter(
    (p) => p.name.toLowerCase() !== trimmed.toLowerCase()
  );
  const next = [preset, ...withoutDuplicate].slice(0, MAX_PRESETS);

  memoryPresets.set(key, next);
  writeJson(key, next);
  return preset;
}

export function deleteMealPreset(id: string): void {
  const key = presetsKey();
  const next = loadMealPresets().filter((p) => p.id !== id);
  memoryPresets.set(key, next);
  writeJson(key, next);
}

/** Pulls the durable copy into memory before first render. */
export async function hydrateMealPresets(): Promise<void> {
  const key = presetsKey();
  if (memoryPresets.has(key)) return;
  try {
    const raw = await authStorageAdapter.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as MealPreset[];
      if (Array.isArray(parsed)) memoryPresets.set(key, parsed);
    }
  } catch {
    // Ignore hydration error
  }
}

// ---------------------------------------------------------------- Usage counts

/**
 * How often each food has been logged, so the hub can lead with the ~15 things
 * this user actually eats instead of the top of an alphabetical catalogue.
 */
export function recordFoodUsage(foodIds: string[]): void {
  const ids = foodIds.filter(Boolean);
  if (ids.length === 0) return;

  const key = usageKey();
  const counts = { ...getFoodUsageCounts() };
  for (const id of ids) {
    counts[id] = (counts[id] || 0) + 1;
  }
  memoryUsage.set(key, counts);
  writeJson(key, counts);
}

export function getFoodUsageCounts(): Record<string, number> {
  const key = usageKey();
  const cached = memoryUsage.get(key);
  if (cached) return cached;

  const stored = readJson<Record<string, number>>(key, {});
  const counts = stored && typeof stored === 'object' ? stored : {};
  memoryUsage.set(key, counts);
  return counts;
}

/** Food ids ordered by how often they've been logged, most frequent first. */
export function getMostLoggedFoodIds(limit: number = MAX_RECENT_FOODS): string[] {
  return Object.entries(getFoodUsageCounts())
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
}

/** Pulls the durable copy into memory before first render. */
export async function hydrateFoodUsage(): Promise<void> {
  const key = usageKey();
  if (memoryUsage.has(key)) return;
  try {
    const raw = await authStorageAdapter.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, number>;
      if (parsed && typeof parsed === 'object') memoryUsage.set(key, parsed);
    }
  } catch {
    // Ignore hydration error
  }
}

/**
 * Drops this device's cached copies. Called on logout alongside the activity
 * cache, so the next account on the device doesn't inherit these presets.
 */
export function releasePresetCache(): void {
  memoryPresets.clear();
  memoryUsage.clear();
}
