export interface BankDay {
  consumed: number;
  target: number;
  isLogged: boolean;
  /** The day still in progress. */
  isToday?: boolean;
}

export interface CalorieBank {
  /** Target minus eaten across the counted days: positive is under target. */
  balanceKcal: number;
  /** Finished, logged days the balance is built from. */
  countedDays: number;
}

/**
 * The week's calorie balance over days that are over and were logged.
 *
 * Today is left out until it ends: counting it banked the whole unspent target
 * at breakfast, so 212 kcal in, the card reported 1,235 kcal "banked" and
 * "On track!". Unlogged days are left out too, since an empty diary is not
 * evidence of eating nothing.
 */
export function weeklyCalorieBank(days: BankDay[]): CalorieBank {
  const counted = days.filter((d) => d.isLogged && !d.isToday && d.target > 0);
  return {
    balanceKcal: Math.round(counted.reduce((sum, d) => sum + (d.target - d.consumed), 0)),
    countedDays: counted.length,
  };
}
