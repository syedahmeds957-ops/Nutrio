import { ALL_RESTAURANT_BRANDS } from '@nutrio/food-db';

import type { AppLanguage } from './languages.js';

/** Bilingual text as the workout catalogue stores it. */
export interface LocalizedPair {
  en: string;
  ar: string;
}

/** Anything with an English name and, optionally, an Arabic one. */
export interface NamedEntity {
  name: string | LocalizedPair;
  nameAr?: string;
}

/**
 * One piece of text in the effective language. Arabic only when the language
 * is Arabic (region SA) and an Arabic text exists; otherwise the English one,
 * so Pakistan never shows Arabic and Saudi Arabia is never blank.
 */
export function pickText(en: string, ar: string | undefined | null, lang: AppLanguage): string {
  const arabic = ar?.trim();
  return lang === 'ar' && arabic ? arabic : en;
}

/** A food, dish, restaurant, modifier or exercise name in the effective language. */
export function pickName(entity: NamedEntity, lang: AppLanguage): string {
  const { name } = entity;
  if (typeof name === 'string') return pickText(name, entity.nameAr, lang);
  return pickText(name.en, name.ar, lang);
}

let brandArByName: Map<string, string> | null = null;

/**
 * A restaurant's name in the effective language, from the English brand name a
 * food carries (`food.brand`). Unknown brands and brands with no Arabic name
 * keep the English one.
 */
export function brandDisplayName(brand: string, lang: AppLanguage): string {
  if (lang !== 'ar') return brand;
  if (!brandArByName) {
    brandArByName = new Map();
    for (const b of ALL_RESTAURANT_BRANDS) {
      if (b.nameAr) brandArByName.set(b.name.toLowerCase(), b.nameAr);
    }
  }
  return pickText(brand, brandArByName.get(brand.toLowerCase()), lang);
}
