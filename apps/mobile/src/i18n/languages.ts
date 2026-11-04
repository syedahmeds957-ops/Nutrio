import type { Region } from '../common/region/index.js';

export const APP_LANGUAGES = ['en', 'ar'] as const;
export type AppLanguage = (typeof APP_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: AppLanguage = 'en';

/**
 * The region alone picks the language: Pakistan is English only, Saudi Arabia
 * is Arabic only. There is no per-user language choice.
 */
export function languageForRegion(region: Region): AppLanguage {
  return region === 'SA' ? 'ar' : 'en';
}

/**
 * Older builds let people pick a language ("auto", "en" or "ar"). That choice
 * is still read back from storage by nothing, and never deleted, so it is
 * kept only as a type for the test that proves it no longer matters.
 */
export type LegacyLanguagePreference = 'auto' | AppLanguage;

export interface LanguageHints {
  /** A previously stored pick. Ignored: the region decides. */
  preference?: LegacyLanguagePreference | null;
  /** The phone's own language (for example "ar-SA"). Ignored: the region decides. */
  deviceLanguage?: string | null;
}

/**
 * The language the UI shows. Pure and total: any stored preference or device
 * language is accepted and ignored, so PK is always English and SA always
 * Arabic, live as the region switches.
 */
export function resolveLanguage(region: Region, _hints?: LanguageHints): AppLanguage {
  return languageForRegion(region);
}
