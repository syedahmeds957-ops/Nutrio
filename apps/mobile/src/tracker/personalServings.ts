import type { FoodServingItem, NormalizedFood } from '@nutrio/food-db';
import { authStorageAdapter } from '../supabase/client.js';
import { getAuthSession } from '../auth/authStorage.js';

/**
 * A user's own standard serving for a food — "my roti is 60g, not 45g", "my
 * katori of daal is 250g". Saved once from the customizer, it becomes that
 * food's default portion for this user, so every later log starts from their
 * real portion instead of the catalogue's.
 */
export interface PersonalServing {
  grams: number;
  savedAt: string;
}

/** Smallest and largest weight a single entry accepts, in grams. */
export const MIN_PORTION_GRAMS = 1;
export const MAX_PORTION_GRAMS = 3000;

const STORAGE_PREFIX = 'nutrio_personal_servings_';

/** Scoped per user, like presets: one device can hold two accounts. */
const storageKey = () => `${STORAGE_PREFIX}${getAuthSession()?.user?.id || 'guest'}`;

// In-memory mirror so reads stay synchronous during render, matching presets.
const memory = new Map<string, Record<string, PersonalServing>>();

function hasStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function isPersonalServing(value: unknown): value is PersonalServing {
  const v = value as PersonalServing;
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof v.grams === 'number' &&
    v.grams >= MIN_PORTION_GRAMS &&
    v.grams <= MAX_PORTION_GRAMS
  );
}

/** Keeps only well-formed entries, so a corrupted store cannot inject a bad serving. */
function sanitize(raw: unknown): Record<string, PersonalServing> {
  if (typeof raw !== 'object' || raw === null) return {};
  return Object.fromEntries(Object.entries(raw).filter(([, value]) => isPersonalServing(value)));
}

function readAll(): Record<string, PersonalServing> {
  const key = storageKey();
  const cached = memory.get(key);
  if (cached) return cached;

  let stored: Record<string, PersonalServing> = {};
  if (hasStorage()) {
    try {
      const raw = window.localStorage.getItem(key);
      stored = raw ? sanitize(JSON.parse(raw)) : {};
    } catch {
      stored = {};
    }
  }
  memory.set(key, stored);
  return stored;
}

function writeAll(next: Record<string, PersonalServing>): void {
  const key = storageKey();
  memory.set(key, next);
  const serialized = JSON.stringify(next);
  if (hasStorage()) {
    try {
      window.localStorage.setItem(key, serialized);
    } catch {
      // Storage full or blocked: the in-memory copy still serves this session.
    }
  }
  void authStorageAdapter.setItem(key, serialized).catch(() => {
    // The durable write failing leaves the local copy; it is retried on the next save.
  });
}

export function getPersonalServing(foodKey: string): PersonalServing | undefined {
  return readAll()[foodKey];
}

/** Saves `grams` as this user's standard serving for the food; rejects out-of-range values. */
export function savePersonalServing(foodKey: string, grams: number): PersonalServing | null {
  if (!foodKey || !Number.isFinite(grams) || grams < MIN_PORTION_GRAMS || grams > MAX_PORTION_GRAMS) {
    return null;
  }
  const serving: PersonalServing = { grams: Math.round(grams * 10) / 10, savedAt: new Date().toISOString() };
  writeAll({ ...readAll(), [foodKey]: serving });
  return serving;
}

/** Goes back to the catalogue's standard serving for the food. */
export function clearPersonalServing(foodKey: string): void {
  const { [foodKey]: _removed, ...rest } = readAll();
  writeAll(rest);
}

/** Pulls the durable copy into memory before first render. */
export async function hydratePersonalServings(): Promise<void> {
  const key = storageKey();
  if (memory.has(key)) return;
  try {
    const raw = await authStorageAdapter.getItem(key);
    if (raw) memory.set(key, sanitize(JSON.parse(raw)));
  } catch {
    // Unreadable durable copy: fall back to the local one on first read.
  }
}

/** Drops cached copies on logout, so the next account does not inherit them. */
export function releasePersonalServingCache(): void {
  memory.clear();
}

/** Marks the serving the user saved, so the customizer can label and reset it. */
export const PERSONAL_SERVING_ID = 'personal';

export interface LabelledServing extends FoodServingItem {
  personalId?: typeof PERSONAL_SERVING_ID;
}

/**
 * The food with the user's own serving first and default, ahead of the
 * catalogue's servings. Unchanged when the user has not saved one.
 */
export function withPersonalServing(
  food: NormalizedFood,
  personal: PersonalServing | undefined,
  label: string
): NormalizedFood {
  if (!personal) return food;
  const mine: LabelledServing = {
    label: `${label} (${personal.grams}g)`,
    grams: personal.grams,
    isDefault: true,
    personalId: PERSONAL_SERVING_ID,
  };
  return {
    ...food,
    servings: [mine, ...food.servings.map((s) => ({ ...s, isDefault: false }))],
  };
}

/**
 * The serving one tap logs for this food: the user's saved standard serving
 * when there is one, otherwise the catalogue's first. Every quick-log path
 * goes through here so a saved "my roti is 60g" applies everywhere.
 */
export function defaultServingFor(food: NormalizedFood, foodKey: string, label: string): FoodServingItem | undefined {
  return withPersonalServing(food, getPersonalServing(foodKey), label).servings[0];
}

/** Calories and macros for one of `serving`, from its own figures or the food's per-100g values. */
export function servingNutrition(food: NormalizedFood, serving: FoodServingItem | undefined) {
  const grams = serving?.grams ?? 100;
  const per = (per100: number) => (per100 * grams) / 100;
  return {
    kcal: serving?.kcal ?? per(food.kcal100g),
    protein: serving?.proteinGrams ?? per(food.protein100g),
    carbs: serving?.carbGrams ?? per(food.carb100g),
    fat: serving?.fatGrams ?? per(food.fat100g),
  };
}

/**
 * Reads what the user typed into the grams field: "137", "137g", "137.5 g",
 * "0,5 kg"-style commas. Null when it is not a weight in range, so the field
 * can show an error instead of logging a wrong amount.
 */
export function parseGramsInput(text: string): number | null {
  const match = text.trim().toLowerCase().replace(',', '.').match(/^(\d+(?:\.\d+)?)\s*(g|gm|gms|grams?|kg)?$/);
  if (!match) return null;
  const grams = Number(match[1]) * (match[2] === 'kg' ? 1000 : 1);
  if (!Number.isFinite(grams) || grams < MIN_PORTION_GRAMS || grams > MAX_PORTION_GRAMS) return null;
  return Math.round(grams * 10) / 10;
}
