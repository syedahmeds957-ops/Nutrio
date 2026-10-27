/**
 * Day keys (`YYYY-MM-DD`) for the diary, weigh-ins and sync.
 *
 * A day is the user's local calendar day. `toISOString()` gives the UTC date,
 * which in Pakistan (UTC+5) filed everything logged between midnight and 5 am
 * under the previous day, and in Saudi Arabia (UTC+3) until 3 am.
 */

import { formatDate } from '../i18n/format.js';

const pad2 = (n: number) => String(n).padStart(2, '0');

/** The local calendar day of `date` (default: now) as `YYYY-MM-DD`. */
export function localDateKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetweenKeys(from: string, to: string): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/**
 * Shifts a day key by whole days. Pure calendar arithmetic: done in UTC so the
 * device's time zone and DST transitions cannot skip or repeat a day.
 */
export function addDaysToKey(key: string, days: number): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Day keys Monday to Sunday of the local calendar week that contains `date`
 * (default: now), matching the Mon-first day order the weekly plan uses.
 */
export function weekKeysFromMonday(date: Date = new Date()): string[] {
  const mondayOffset = (date.getDay() + 6) % 7;
  const monday = addDaysToKey(localDateKey(date), -mondayOffset);
  return Array.from({ length: 7 }, (_, i) => addDaysToKey(monday, i));
}

/**
 * A day key written for people: "25 Oct 2026", or the Arabic month name with
 * Western digits and the Gregorian calendar (ar-SA would otherwise default to
 * the Hijri calendar and Eastern digits). Formatted in UTC so the key's own
 * date is shown whatever the device's time zone.
 */
export function formatDayKey(key: string, language: 'en' | 'ar'): string {
  const date = new Date(`${key}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return key;
  return formatDate(date, language, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
