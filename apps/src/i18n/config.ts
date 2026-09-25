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

  i18n.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...APP_LANGUAGES],
    defaultNS: 'translation',
    // React already escapes anything rendered through a Text node.
    interpolation: { escapeValue: false },
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
