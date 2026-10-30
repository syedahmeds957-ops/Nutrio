import type { MealSlot } from './types.js';

/** The four slots of a day, in the order the meals card lists them. */
export const MEAL_SLOTS: readonly MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snacks_chai'];

/** The meal people most likely mean at this hour (0-23), used to preselect the hub and tag "Next". */
export function defaultSlotForHour(hour: number): MealSlot {
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 19) return 'snacks_chai';
  return 'dinner';
}

/** The slot to tag "Next": the one for this hour, but only while nothing is logged in it. */
export function nextSlotToLog(now: MealSlot, itemCountBySlot: Record<MealSlot, number>): MealSlot | null {
  return itemCountBySlot[now] > 0 ? null : now;
}

export interface MealSegment {
  slot: MealSlot;
  kcal: number;
  /** Share of the bar (0-1) this slot fills. */
  fraction: number;
}

/**
 * The slots' share of the "Calories by meal" bar. The bar stands for the day's
 * target, so a slot's width is its kcal over the target; once the day goes
 * over (or no target is set yet) the bar stands for what was eaten instead, so
 * the segments never overflow it. Slots with nothing logged get no segment.
 */
export function mealSegments(kcalBySlot: Record<MealSlot, number>, targetCalories: number): MealSegment[] {
  const total = MEAL_SLOTS.reduce((sum, slot) => sum + Math.max(0, kcalBySlot[slot]), 0);
  const basis = Math.max(total, targetCalories > 0 ? targetCalories : 0);
  if (basis <= 0) return [];
  return MEAL_SLOTS.filter((slot) => kcalBySlot[slot] > 0).map((slot) => ({
    slot,
    kcal: kcalBySlot[slot],
    fraction: kcalBySlot[slot] / basis,
  }));
}

/**
 * How many staple chips fit on one line. `widths` are the chips' estimated
 * widths in order; chips are added while they fit in `available` (with `gap`
 * between), and at least one is always kept.
 */
export function chipsThatFit(widths: readonly number[], available: number, gap: number): number {
  let used = 0;
  let count = 0;
  for (const width of widths) {
    const next = used + (count > 0 ? gap : 0) + width;
    if (next > available && count > 0) break;
    used = next;
    count += 1;
  }
  return count;
}
