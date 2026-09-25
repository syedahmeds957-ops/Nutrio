import { describe, it, expect, afterAll } from 'vitest';
import { Platform } from 'react-native';
import { i18n, initI18n } from '../config.js';
import { APP_LANGUAGES, languageForRegion } from '../languages.js';
import {
  applyNativeDirection,
  directionForLanguage,
  isRtlLanguage,
  needsDirectionChange,
} from '../rtl.js';
import en from '../locales/en.json';
import ar from '../locales/ar.json';

/** Flattens a nested locale object into dotted leaf keys. */
function leafKeys(node: unknown, prefix = ''): string[] {
  if (typeof node !== 'object' || node === null) {
    return [prefix];
  }
  return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
    leafKeys(value, prefix ? `${prefix}.${key}` : key)
  );
}

// Arabic has six plural forms; i18next resolves <key>_one, _two, _few and so on
// from a single call site, so those suffixes are not expected to line up 1:1.
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;
const base = (key: string) => key.replace(PLURAL_SUFFIX, '');

describe('i18n catalogue', () => {
  const enKeys = leafKeys(en);
  const arKeys = leafKeys(ar);

  it('translates every English key into Arabic', () => {
    const arBases = new Set(arKeys.map(base));
    const missing = enKeys.map(base).filter((key) => !arBases.has(key));
    expect(missing).toEqual([]);
  });

  it('has no Arabic keys the English catalogue does not define', () => {
    const enBases = new Set(enKeys.map(base));
    const orphans = arKeys.map(base).filter((key) => !enBases.has(key));
    expect(orphans).toEqual([]);
  });

  it('keeps interpolation placeholders identical across languages', () => {
    const placeholders = (value: string) =>
      (value.match(/\{\{\s*\w+\s*\}\}/g) ?? []).sort().join(',');

    const mismatches: string[] = [];
    for (const key of enKeys) {
      const enValue = i18n.getResource('en', 'translation', key);
      const arValue = i18n.getResource('ar', 'translation', key);
      if (typeof enValue !== 'string' || typeof arValue !== 'string') continue;
      if (placeholders(enValue) !== placeholders(arValue)) {
        mismatches.push(key);
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('leaves no empty strings in either catalogue', () => {
    const empties = [...enKeys, ...arKeys].filter((key) => {
      const value = i18n.getResource('en', 'translation', key) as unknown;
      const arValue = i18n.getResource('ar', 'translation', key) as unknown;
      return value === '' || arValue === '';
    });
    expect(empties).toEqual([]);
  });
});

describe('language selection', () => {
  it('reads Arabic in Saudi Arabia and English in Pakistan', () => {
    expect(languageForRegion('SA')).toBe('ar');
    expect(languageForRegion('PK')).toBe('en');
  });

  it('resolves real strings in both languages', () => {
    initI18n('en');
    expect(i18n.t('common.today')).toBe('Today');
    expect(i18n.t('tracker.water.title')).toBe('Water Hydration');

    initI18n('ar');
    expect(i18n.t('common.today')).toBe('اليوم');
    expect(i18n.t('tracker.water.title')).toBe('ترطيب الجسم والتوازن المائي');
  });

  it('interpolates values into translated sentences', () => {
    initI18n('ar');
    expect(i18n.t('survey.progress.step', { current: 2, total: 6 })).toBe('الخطوة 2 من 6');

    initI18n('en');
    expect(i18n.t('survey.progress.step', { current: 2, total: 6 })).toBe('Step 2 of 6');
  });

  it('selects the Arabic dual form, which English does not have', () => {
    initI18n('ar');
    expect(i18n.t('tracker.diary.dishCount', { count: 2 })).toBe('طبقان');
    expect(i18n.t('tracker.diary.dishCount', { count: 5 })).toBe('5 أطباق');
  });
});

describe('text direction', () => {
  it('marks Arabic as right-to-left and English as left-to-right', () => {
    expect(directionForLanguage('ar')).toBe('rtl');
    expect(directionForLanguage('en')).toBe('ltr');
    expect(isRtlLanguage('ar')).toBe(true);
    expect(isRtlLanguage('en')).toBe(false);
  });

  it('covers every shipped language', () => {
    for (const language of APP_LANGUAGES) {
      expect(['ltr', 'rtl']).toContain(directionForLanguage(language));
    }
  });

  it('reports whether the native layout still needs a restart', () => {
    // Switching to Arabic while the layout is left-to-right is a change the
    // running UI cannot apply on its own — it needs a reload.
    expect(needsDirectionChange(false, 'ar')).toBe(true);
    expect(needsDirectionChange(true, 'en')).toBe(true);
    // Asking for the direction the layout already has is not.
    expect(needsDirectionChange(true, 'ar')).toBe(false);
    expect(needsDirectionChange(false, 'en')).toBe(false);
  });

  it('never claims a native direction change on web, where CSS carries it', () => {
    // react-native-web reads the document direction; I18nManager.forceRTL does
    // not reach it, so there is nothing for a reload to pick up.
    expect(Platform.OS).toBe('web');
    expect(applyNativeDirection('ar')).toBe(false);
    expect(applyNativeDirection('en')).toBe(false);
  });
});

afterAll(() => {
  initI18n('en');
});
