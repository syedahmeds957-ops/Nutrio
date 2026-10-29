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

const LRM = '\u200E';

/**
 * "25%" as ONE left-to-right unit. In an Arabic (RTL) line the percent sign
 * can otherwise land on the wrong side of the number ("%25"), especially
 * inside parentheses. Arabic gets a left-to-right mark on each side so the
 * number and its sign stay together and in order; English is returned bare.
 * Western digits and "%" in both languages, like formatNumber.
 *
 * Unless the caller passes options, one decimal rule applies everywhere:
 * whole numbers from 10 up ("37%"), one decimal below 10 ("4.5%"), so a share
 * never reads "36.7%" next to "37%".
 */
export function formatPercent(
  value: number,
  language: AppLanguage = 'en',
  options?: Intl.NumberFormatOptions
): string {
  const digits = options ?? { maximumFractionDigits: Math.abs(value) < 10 ? 1 : 0 };
  const text = `${formatNumber(value, language, digits)}%`;
  return language === 'ar' ? `${LRM}${text}${LRM}` : text;
}

/**
 * Weight-change pace in kg per week, e.g. 0.5 or 0.25, never 0.62 or 0.4999.
 * Rounded to the nearest 0.05 so the picker steps (0.25, 0.5, 0.75, 1) stay
 * exact and anything else shows at most two digits ("0.6"). Pass 'down' for a
 * safety LIMIT, so the figure shown never exceeds the real limit.
 */
export function formatRate(
  value: number,
  language: AppLanguage = 'en',
  rounding: 'nearest' | 'down' = 'nearest'
): string {
  const steps = value / 0.05;
  // The small epsilon keeps 0.15 / 0.05 (2.9999999999999996) from rounding down a whole step.
  const rounded = (rounding === 'down' ? Math.floor(steps + 1e-9) : Math.round(steps)) * 0.05;
  return formatNumber(Number(rounded.toFixed(2)), language, { maximumFractionDigits: 2 });
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
