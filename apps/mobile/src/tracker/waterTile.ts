/** Share of the day's water goal reached, as a whole percent clamped to 0-100. A missing target counts as no progress. */
export function waterGoalPercent(consumedMl: number, targetMl: number): number {
  if (!(targetMl > 0)) return 0;
  return Math.min(100, Math.max(0, Math.round((consumedMl / targetMl) * 100)));
}

/** The daily water goal to show when the plan has none. */
export const DEFAULT_WATER_TARGET_ML = 2500;

/** The goal in ml, falling back to the default when the plan gives none. */
export function waterTargetMl(targetMl: number | null | undefined): number {
  return typeof targetMl === 'number' && targetMl > 0 ? targetMl : DEFAULT_WATER_TARGET_ML;
}

/**
 * Water in litres, rounded to one decimal: the one unit every screen shows
 * (the dashboard read "2.2 L" while the profile read "2,170 ml"). Pass 2
 * decimals for the amount drunk so a 250 ml glass reads as 0.25, not 0.3.
 */
export function waterLitres(ml: number, decimals: 1 | 2 = 1): number {
  const scale = decimals === 2 ? 100 : 10;
  return Math.round((ml / 1000) * scale) / scale;
}
