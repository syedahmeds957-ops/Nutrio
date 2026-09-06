import { ScanQuotaState } from './types.js';

export const DEFAULT_FREE_DAILY_SCANS = 3;

/**
 * Normalizes quota state for a given date (defaults to 100% Free, unlimited scans).
 */
export function initializeQuotaState(
  date = new Date().toISOString().split('T')[0],
  isPaid = true
): ScanQuotaState {
  return {
    date,
    usedCount: 0,
    maxFreeLimit: isPaid ? Infinity : DEFAULT_FREE_DAILY_SCANS,
    isPaid,
  };
}

/**
 * Checks if the user has remaining photo scans for today.
 */
export function canPerformPhotoScan(
  state: ScanQuotaState,
  currentDate = new Date().toISOString().split('T')[0]
): boolean {
  if (state.isPaid) return true;
  if (state.date !== currentDate) return true; // new day reset
  return state.usedCount < state.maxFreeLimit;
}

/**
 * Consumes a photo scan quota and returns the updated state.
 */
export function consumePhotoScan(
  state: ScanQuotaState,
  currentDate = new Date().toISOString().split('T')[0]
): ScanQuotaState {
  if (state.isPaid) return state;

  const isNewDay = state.date !== currentDate;
  const currentCount = isNewDay ? 0 : state.usedCount;

  return {
    ...state,
    date: currentDate,
    usedCount: currentCount + 1,
  };
}

/**
 * Returns the number of remaining free scans for today.
 */
export function getRemainingScans(
  state: ScanQuotaState,
  currentDate = new Date().toISOString().split('T')[0]
): number {
  if (state.isPaid) return Infinity;
  if (state.date !== currentDate) return state.maxFreeLimit;
  return Math.max(0, state.maxFreeLimit - state.usedCount);
}
