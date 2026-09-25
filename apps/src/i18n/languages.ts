import type { Region } from '../common/region/index.js';

export const APP_LANGUAGES = ['en', 'ar'] as const;
export type AppLanguage = (typeof APP_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: AppLanguage = 'en';

export function isAppLanguage(value: unknown): value is AppLanguage {
  return typeof value === 'string' && (APP_LANGUAGES as readonly string[]).includes(value);
}

/**
 * Region picks the language: Saudi Arabia reads Arabic, Pakistan English.
 * Kept separate from the region context so a language override can be layered
 * on later without touching currency or food-database behaviour.
 */
export function languageForRegion(region: Region): AppLanguage {
  return region === 'SA' ? 'ar' : 'en';
}
