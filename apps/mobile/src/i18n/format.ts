import type { AppLanguage } from './languages.js';

/**
 * Locale-aware formatting that follows the region's language: PK reads
 * English (en), SA reads Arabic (ar). Pure functions with no imports beyond a
 * type, so they work outside React. Every function takes the language as an
 * optional argument that defaults to English.
 *
 * Digits are Western (0-9) in BOTH languages: the app has always shown
 * Western digits in Arabic screens (e.g. the "1,068" calorie hero), and Arabic
 * months and weekdays are written with the Gregorian calendar (ar-SA would
 * otherwise default to Hijri and Eastern Arabic-Indic digits). PK therefore
 * never sees an Arabic digit, month or weekday name.
 */
const NUMBER_LOCALE: Record<AppLanguage, string> = {
  en: 'en-US',
  ar: 'ar-SA-u-nu-latn',
};

const DATE_LOCALE: Record<AppLanguage, string> = {
  en: 'en-GB',
  ar: 'ar-SA-u-ca-gregory-nu-latn',
};

const TIME_LOCALE: Record<AppLanguage, string> = {
  en: 'en-US',
  ar: 'ar-SA-u-ca-gregory-nu-latn',
};

export function numberLocale(language: AppLanguage = 'en'): string {
  return NUMBER_LOCALE[language] ?? NUMBER_LOCALE.en;
}

export function dateLocale(language: AppLanguage = 'en'): string {
  return DATE_LOCALE[language] ?? DATE_LOCALE.en;
}

export function formatNumber(
  value: number,
  language: AppLanguage = 'en',
  options?: Intl.NumberFormatOptions
): string {
  return value.toLocaleString(numberLocale(language), options);
}

/** "25 Oct 2026" / "25 أكتوبر 2026" by default. */
export function formatDate(
  date: Date | number,
  language: AppLanguage = 'en',
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
): string {
  return new Intl.DateTimeFormat(dateLocale(language), options).format(date);
}

/** Clock time such as "9:05 PM" / "9:05 م". */
export function formatTime(
  date: Date | number,
  language: AppLanguage = 'en',
  options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' }
): string {
  return new Intl.DateTimeFormat(TIME_LOCALE[language] ?? TIME_LOCALE.en, options).format(date);
}

// 2026-01-05 is a Monday: a fixed UTC anchor so names never depend on the
// device time zone or today's date.
const MONDAY_ANCHOR_UTC = Date.UTC(2026, 0, 5);

/** Weekday name for a Monday-first index (0 = Monday ... 6 = Sunday). */
export function weekdayName(
  dayIndex: number,
  language: AppLanguage = 'en',
  style: 'short' | 'long' = 'short'
): string {
  const day = ((Math.trunc(dayIndex) % 7) + 7) % 7;
  const date = new Date(MONDAY_ANCHOR_UTC + day * 86_400_000);
  return new Intl.DateTimeFormat(dateLocale(language), { weekday: style, timeZone: 'UTC' }).format(date);
}

export const weekdayShort = (dayIndex: number, language: AppLanguage = 'en') =>
  weekdayName(dayIndex, language, 'short');

/** Month name for a 0-based month (0 = January), Gregorian. */
export function monthName(
  monthIndex: number,
  language: AppLanguage = 'en',
  style: 'short' | 'long' = 'long'
): string {
  const month = ((Math.trunc(monthIndex) % 12) + 12) % 12;
  const date = new Date(Date.UTC(2026, month, 1));
  return new Intl.DateTimeFormat(dateLocale(language), { month: style, timeZone: 'UTC' }).format(date);
}
