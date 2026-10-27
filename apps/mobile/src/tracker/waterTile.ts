/** Share of the day's water goal reached, as a whole percent clamped to 0-100. A missing target counts as no progress. */
export function waterGoalPercent(consumedMl: number, targetMl: number): number {
  if (!(targetMl > 0)) return 0;
  return Math.min(100, Math.max(0, Math.round((consumedMl / targetMl) * 100)));
}
