// Hermes ships Intl, but the polyfill is a no-op where PluralRules already
// exists and is what keeps Arabic's six plural forms correct on older engines.
import 'intl-pluralrules';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ar from './locales/ar.json';
import { APP_LANGUAGES, AppLanguage, DEFAULT_LANGUAGE } from './languages.js';

export const resources = {
  en: { translation: en },
  ar: { translation: ar },
} as const;

/** Grouped, Latin digits, and no rounding beyond what the caller already did. */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 10 });
}

/**
 * Every number a string interpolates reads the same way (1,350, never 1350),
 * in Latin digits in both languages like the rest of the app. Anything that is
 * not a number passes through untouched. Replaces i18next's built-in
 * formatter, so the `{{value, format}}` syntax is not available.
 */
const UNGROUPED_KEYS = new Set(['year', 'day', 'month']);

const numberFormatter = {
  type: 'formatter' as const,
  init() {},
  add() {},
  addCached() {},
  format(value: unknown, _format: unknown, _lng: unknown, options?: { interpolationkey?: string }) {
    if (typeof value !== 'number') return value;
    // A year is not a quantity: 2,027 is wrong.
    if (options?.interpolationkey && UNGROUPED_KEYS.has(options.interpolationkey)) return String(value);
    return formatNumber(value);
  },
};

let initialized = false;

/**
 * Idempotent. The module initialises itself on import so that non-React
 * callers (the offline coach, for one) always have a usable t(); calling this
 * again only switches the language.
 */
export function initI18n(language: AppLanguage = DEFAULT_LANGUAGE) {
  if (initialized) {
    if (i18n.language !== language) {
      void i18n.changeLanguage(language);
    }
    return i18n;
  }
  initialized = true;

  i18n.use(numberFormatter).use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...APP_LANGUAGES],
    defaultNS: 'translation',
    // React already escapes anything rendered through a Text node.
    // alwaysFormat sends every interpolated value through the formatter below.
    interpolation: { escapeValue: false, alwaysFormat: true },
    returnNull: false,
    // A key that never resolves should be loud in development and inert in
    // production, never a blank label on screen.
    parseMissingKeyHandler: (key: string) => {
      if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
        console.warn(`[i18n] Missing translation for "${key}"`);
      }
      return key.split('.').pop() ?? key;
    },
  });

  return i18n;
}

initI18n();

export { i18n };
