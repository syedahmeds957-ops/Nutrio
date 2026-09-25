import { I18nManager, Platform } from 'react-native';
import type { AppLanguage } from './languages.js';

export type Direction = 'ltr' | 'rtl';

const RTL_LANGUAGES: readonly AppLanguage[] = ['ar'];

export function directionForLanguage(language: AppLanguage): Direction {
  return RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';
}

export function isRtlLanguage(language: AppLanguage): boolean {
  return directionForLanguage(language) === 'rtl';
}

/**
 * True when the native layout engine is currently mirroring. Reading
 * I18nManager rather than the active language matters: forceRTL only takes
 * effect after a reload, so during the gap between the two the UI is still
 * laid out left-to-right.
 */
export function isLayoutRtl(): boolean {
  return Boolean(I18nManager.isRTL);
}

/**
 * Whether the running layout disagrees with the language. Pure so the rule can
 * be exercised without a native layout engine.
 */
export function needsDirectionChange(currentlyRtl: boolean, language: AppLanguage): boolean {
  return currentlyRtl !== isRtlLanguage(language);
}

/**
 * Applies the native mirroring preference. Returns true when the preference
 * changed, which means the running UI is now stale and needs a reload before
 * rows, paddings and margins flip.
 *
 * allowRTL is a no-op unless the build opted in; app.json enables it through
 * the expo-localization plugin (supportsRTL).
 */
export function applyNativeDirection(language: AppLanguage): boolean {
  const shouldBeRtl = isRtlLanguage(language);

  if (Platform.OS === 'web') {
    // React Native Web reads the document direction, and I18nManager.forceRTL
    // does not reach it.
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('dir', shouldBeRtl ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', language);
    }
    return false;
  }

  if (!needsDirectionChange(isLayoutRtl(), language)) {
    return false;
  }

  try {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(shouldBeRtl);
  } catch {
    return false;
  }

  return true;
}

/**
 * Restarts the JS runtime so a direction change takes effect.
 *
 * expo-updates owns reloadAsync but is not a dependency here and rejects
 * unless the project is configured for updates, so it is resolved lazily and
 * DevSettings covers development. When neither works the caller has to ask the
 * user to reopen the app by hand — the return value says which happened.
 */
export async function reloadApp(): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const updates = require('expo-updates');
    if (updates?.reloadAsync) {
      await updates.reloadAsync();
      return true;
    }
  } catch {
    // expo-updates absent or not enabled for this build
  }

  try {
    const { DevSettings } = require('react-native');
    if (DevSettings?.reload) {
      DevSettings.reload();
      return true;
    }
  } catch {
    // DevSettings is unavailable in release builds
  }

  return false;
}
