import { foodDisplayName } from '../tracker/foodDisplayName.js';

interface TitleItem {
  foodName: string;
  foodNameAr?: string;
}

const shortName = (name: string) => name.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * The swap option's heading in the reader's language. The planner builds an
 * English one ("Rice & Chicken Tikka"); Arabic readers get the same list from
 * the items' Arabic names, joined the Arabic way. Falls back to the planner's
 * title when no item has an Arabic name.
 */
export function swapTitleFor(items: TitleItem[], language: 'en' | 'ar', fallback: string): string {
  if (language !== 'ar' || !items.some((i) => i.foodNameAr)) return fallback;
  const names = Array.from(
    new Set(items.map((i) => shortName(foodDisplayName(i.foodName, i.foodNameAr, true).primary)))
  );
  if (names.length <= 1) return names[0] ?? fallback;
  return `${names.slice(0, -1).join('، ')} و${names[names.length - 1]}`;
}
