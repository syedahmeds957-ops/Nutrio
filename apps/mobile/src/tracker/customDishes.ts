import type { NormalizedFood } from '@nutrio/food-db';
import { authStorageAdapter } from '../supabase/client.js';
import { getAuthSession } from '../auth/authStorage.js';

const STORAGE_PREFIX = 'nutrio_custom_dishes_';

/** Past this a personal list stops being a shortcut and becomes a second catalogue. */
export const MAX_CUSTOM_DISHES = 100;

/**
 * Dishes a user added themselves because the catalogue did not have them.
 *
 * Private to the user who added them: the key is scoped by account, so a second
 * account on the same device never reads them, and nothing here is sent to the
 * shared catalogue. Logged entries keep their own copy of the numbers, so
 * deleting a dish never changes the diary.
 */
function scope(): string {
  return getAuthSession()?.user?.id || 'guest';
}

const dishesKey = () => `${STORAGE_PREFIX}${scope()}`;

// In-memory mirror so search can read synchronously during render, matching
// mealPresets. AsyncStorage (localStorage on web) is the durable copy.
const memoryDishes = new Map<string, NormalizedFood[]>();

let durableQueue: Promise<void> = Promise.resolve();

function persist(key: string, dishes: NormalizedFood[]): void {
  const serialized = JSON.stringify(dishes);
  durableQueue = durableQueue
    .then(() => authStorageAdapter.setItem(key, serialized))
    .catch(() => {
      // A failed write leaves the in-memory list; the next save retries it.
    });
}

const isStoredDish = (value: unknown): value is NormalizedFood => {
  const v = value as NormalizedFood;
  return (
    !!v &&
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.kcal100g === 'number' &&
    Array.isArray(v.servings) &&
    v.servings.length > 0
  );
};

/** On web the durable copy is localStorage, readable synchronously before hydration. */
function readLocal(key: string): NormalizedFood[] | undefined {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return undefined;
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : undefined;
    return Array.isArray(parsed) ? parsed.filter(isStoredDish) : undefined;
  } catch {
    return undefined;
  }
}

export function loadCustomDishes(): NormalizedFood[] {
  const key = dishesKey();
  const cached = memoryDishes.get(key);
  if (cached) return cached;
  const stored = readLocal(key);
  if (stored) memoryDishes.set(key, stored);
  return stored ?? [];
}

/**
 * Saves a dish, newest first. A dish with the same name replaces the old one:
 * adding "Malai Handi" again means the user wants the new breakdown.
 */
export function saveCustomDish(dish: NormalizedFood): void {
  const key = dishesKey();
  const name = dish.name.trim().toLowerCase();
  const next = [dish, ...loadCustomDishes().filter((d) => d.name.trim().toLowerCase() !== name)].slice(
    0,
    MAX_CUSTOM_DISHES
  );
  memoryDishes.set(key, next);
  persist(key, next);
}

export function deleteCustomDish(id: string): void {
  const key = dishesKey();
  const next = loadCustomDishes().filter((d) => d.id !== id);
  memoryDishes.set(key, next);
  persist(key, next);
}

/** The user's own dishes whose name contains every word of `query`. */
export function searchCustomDishes(query: string): NormalizedFood[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return loadCustomDishes().filter((d) => {
    const name = d.name.toLowerCase();
    return words.every((w) => name.includes(w));
  });
}

/** Pulls the durable copy into memory before the log hub first opens. */
export async function hydrateCustomDishes(): Promise<void> {
  const key = dishesKey();
  if (memoryDishes.has(key)) return;
  const raw = await authStorageAdapter.getItem(key);
  if (!raw) return;
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) memoryDishes.set(key, parsed.filter(isStoredDish));
}

/** Drops the cached copies on logout, so the next account starts clean. */
export function releaseCustomDishCache(): void {
  memoryDishes.clear();
}
