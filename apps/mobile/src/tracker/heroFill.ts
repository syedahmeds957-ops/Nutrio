/**
 * Pure maths behind the draining calorie hero on Today: how much of the day's
 * target has been eaten, and how much of the card is still filled.
 */

/** Share of the daily target eaten, clamped to 0..1. No target (or a bad number) reads as 0. */
export function caloriesEatenFraction(consumed: number, target: number): number {
  if (!Number.isFinite(consumed) || !Number.isFinite(target) || target <= 0) return 0;
  return Math.min(1, Math.max(0, consumed / target));
}

/** Share of the card that is still filled: full at 0 eaten, empty at or over the target. */
export function heroFillFraction(consumed: number, target: number): number {
  return 1 - caloriesEatenFraction(consumed, target);
}

/** Whole percent eaten (0..100), for the progress bar's accessibility value. */
export function caloriesEatenPercent(consumed: number, target: number): number {
  return Math.round(caloriesEatenFraction(consumed, target) * 100);
}
