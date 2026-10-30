import { pickText } from '../i18n/displayName.js';

export interface FoodDisplayName {
  primary: string;
}

/**
 * One name per food, in the reader's language: the Arabic name when the app is
 * in Arabic (Saudi Arabia), the English name otherwise (Pakistan). A food with
 * no Arabic name falls back to its English one rather than showing blank.
 * Urdu names are never displayed.
 */
export function foodDisplayName(
  name: string,
  nameAr: string | undefined,
  arabic: boolean,
): FoodDisplayName {
  return { primary: pickText(name, nameAr, arabic ? 'ar' : 'en') };
}
