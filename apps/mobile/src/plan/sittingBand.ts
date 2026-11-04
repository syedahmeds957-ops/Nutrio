/**
 * Display bands for the "Daily sitting time" row of the plan analysis.
 * Labels only: no calorie or activity calculation reads this. The activity
 * factor and the sedentary-worker flag come from `survey/nutrition-bridge.ts`
 * (which has its own 8-hour rule) and `@nutrio/nutrition-core`.
 */
export const SITTING_ACTIVE_MAX_HOURS = 4;
export const SITTING_MOSTLY_SEATED_MIN_HOURS = 8;

export type SittingBand = 'active' | 'moderate' | 'sedentary';

/** Up to 4 h is active, 5 to 7 h some sitting, 8 h or more mostly seated. */
export function sittingBand(hours: number): SittingBand {
  if (hours >= SITTING_MOSTLY_SEATED_MIN_HOURS) return 'sedentary';
  if (hours > SITTING_ACTIVE_MAX_HOURS) return 'moderate';
  return 'active';
}
