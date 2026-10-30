import { WeeklyWorkoutPlan, WorkoutSettings } from './types.js';

export interface RamadanDates {
  hijriYear: number;
  /** First and last day of Ramadan (YYYY-MM-DD). */
  start: string;
  end: string;
}

/**
 * Ramadan by the Umm al-Qura calendar (Saudi Arabia's official one), worked
 * out once with ICU's islamic-umalqura calendar and kept as data so phones
 * don't depend on calendar support. Countries that sight the moon locally
 * (Pakistan) may start or end a day later.
 */
export const RAMADAN_DATES: readonly RamadanDates[] = [
  { hijriYear: 1446, start: '2025-03-01', end: '2025-03-29' },
  { hijriYear: 1447, start: '2026-02-18', end: '2026-03-19' },
  { hijriYear: 1448, start: '2027-02-08', end: '2027-03-08' },
  { hijriYear: 1449, start: '2028-01-28', end: '2028-02-25' },
  { hijriYear: 1450, start: '2029-01-16', end: '2029-02-13' },
  { hijriYear: 1451, start: '2030-01-05', end: '2030-02-03' },
  { hijriYear: 1452, start: '2030-12-26', end: '2031-01-23' },
  { hijriYear: 1453, start: '2031-12-16', end: '2032-01-13' },
  { hijriYear: 1454, start: '2032-12-04', end: '2033-01-02' },
  { hijriYear: 1455, start: '2033-11-23', end: '2033-12-22' },
  { hijriYear: 1456, start: '2034-11-12', end: '2034-12-11' },
  { hijriYear: 1457, start: '2035-11-01', end: '2035-11-30' },
  { hijriYear: 1458, start: '2036-10-21', end: '2036-11-18' },
  { hijriYear: 1459, start: '2037-10-10', end: '2037-11-08' },
  { hijriYear: 1460, start: '2038-09-30', end: '2038-10-28' },
  { hijriYear: 1461, start: '2039-09-19', end: '2039-10-18' },
  { hijriYear: 1462, start: '2040-09-08', end: '2040-10-06' },
];

/** The Ramadan a date falls in, if any. */
export function ramadanOn(dateKey: string): RamadanDates | null {
  return RAMADAN_DATES.find((r) => dateKey >= r.start && dateKey <= r.end) ?? null;
}

export function isRamadan(dateKey: string): boolean {
  return ramadanOn(dateKey) !== null;
}

/** The Ramadan happening now, or the next one; null past the end of the table. */
export function currentOrNextRamadan(dateKey: string): RamadanDates | null {
  return RAMADAN_DATES.find((r) => dateKey <= r.end) ?? null;
}

/**
 * The settings as they apply on a date. `ramadan.enabled` in the saved
 * settings means "use Ramadan mode during Ramadan"; the fasting caps only
 * apply on Ramadan days.
 */
export function settingsOn(settings: WorkoutSettings, dateKey: string): WorkoutSettings {
  const fasting = settings.ramadan.enabled && isRamadan(dateKey);
  return fasting === settings.ramadan.enabled ? settings : { ...settings, ramadan: { ...settings.ramadan, enabled: fasting } };
}

/** The settings a plan was built with: fasting caps on only if they were applied. */
export function planSettings(plan: WeeklyWorkoutPlan): WorkoutSettings {
  const fasting = plan.fasting ?? plan.settings.ramadan.enabled;
  return fasting === plan.settings.ramadan.enabled ? plan.settings : { ...plan.settings, ramadan: { ...plan.settings.ramadan, enabled: fasting } };
}
