import { describe, expect, it } from 'vitest';
import {
  ALL_EXPANDED_PAKISTANI_FOODS,
  ALL_FOODS_CATALOG,
  ALL_SAUDI_FOODS,
  CALORIFY_BRANDS,
  PAKISTANI_EXPANDED_BRANDS,
  PAKISTANI_RESTAURANT_BRANDS,
  SAUDI_RESTAURANT_BRANDS,
} from '@nutrio/food-db';
import en from '../../i18n/locales/en.json';
import ar from '../../i18n/locales/ar.json';

const EN: Record<string, string> = en.tracker.brandGroups;
const AR: Record<string, string> = ar.tracker.brandGroups;

/** Every label the food hub and brand menus pass to `tracker.brandGroups.*` for one region. */
function labelsFor(brands: readonly { brandGroup?: string; categories?: string[] }[], foods: readonly { brandCategory?: string }[]) {
  const labels = new Set<string>(['All', 'Other', 'Diet & Basics', 'Home Food']);
  for (const brand of brands) {
    if (brand.brandGroup) labels.add(brand.brandGroup);
    for (const category of brand.categories ?? []) labels.add(category);
  }
  for (const food of foods) if (food.brandCategory) labels.add(food.brandCategory);
  return [...labels];
}

const missing = (labels: string[], pack: Record<string, string>) => labels.filter((label) => !pack[label]);

describe('brand group and menu section labels', () => {
  const regions = {
    // Each region's own brands and menus only: one region's items never show in another.
    PK: labelsFor([...PAKISTANI_RESTAURANT_BRANDS, ...PAKISTANI_EXPANDED_BRANDS, ...CALORIFY_BRANDS], [...ALL_FOODS_CATALOG, ...ALL_EXPANDED_PAKISTANI_FOODS]),
    SA: labelsFor(SAUDI_RESTAURANT_BRANDS, ALL_SAUDI_FOODS),
  };

  for (const [region, labels] of Object.entries(regions)) {
    it(`has English and Arabic for every ${region} label`, () => {
      expect(missing(labels, EN)).toEqual([]);
      expect(missing(labels, AR)).toEqual([]);
    });
  }

  it('never uses a label with a dot, which i18next would read as a nested key', () => {
    expect([...regions.PK, ...regions.SA].filter((label) => label.includes('.'))).toEqual([]);
  });
});
