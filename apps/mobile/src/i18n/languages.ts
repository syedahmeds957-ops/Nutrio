import type { Region } from '../common/region/index.js';

export const APP_LANGUAGES = ['en', 'ar'] as const;
export type AppLanguage = (typeof APP_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: AppLanguage = 'en';

/**
 * Region picks the language: Saudi Arabia reads Arabic, Pakistan English.
 * Kept separate from the region context so a language override can be layered
 * on later without touching currency or food-database behaviour.
 */
export function languageForRegion(region: Region): AppLanguage {
  return region === 'SA' ? 'ar' : 'en';
}

/** What the user chose: a language, or "auto" to follow the region as before. */
export type LanguagePreference = 'auto' | AppLanguage;

export function isLanguagePreference(value: unknown): value is LanguagePreference {
  return value === 'auto' || value === 'en' || value === 'ar';
}

/** An explicit choice wins; otherwise the region decides. */
export function resolveLanguage(preference: LanguagePreference, region: Region): AppLanguage {
  return preference === 'auto' ? languageForRegion(region) : preference;
}
