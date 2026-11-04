import { NormalizedFood } from './types.js';
import { getFoodsForRegion } from './data/index.js';

/** Order the picker offers meats in. */
const LABEL_ORDER = ['Mutton', 'Beef', 'Chicken'];

let groupsCache: Map<string, NormalizedFood[]> | null = null;

function getGroups(): Map<string, NormalizedFood[]> {
  if (groupsCache) return groupsCache;
  groupsCache = new Map();
  for (const food of [...getFoodsForRegion('PK'), ...getFoodsForRegion('SA')]) {
    if (!food.variantGroup) continue;
    const members = groupsCache.get(food.variantGroup) ?? [];
    if (!members.some((m) => m.id === food.id)) groupsCache.set(food.variantGroup, [...members, food]);
  }
  for (const [group, members] of groupsCache) {
    groupsCache.set(
      group,
      [...members].sort(
        (a, b) => LABEL_ORDER.indexOf(a.variantLabel ?? '') - LABEL_ORDER.indexOf(b.variantLabel ?? '')
      )
    );
  }
  return groupsCache;
}

/**
 * Every way a dish is cooked — Aloo Gosht with mutton, beef or chicken — for a
 * search result's picker, `food` included. Empty when the dish has no variants.
 */
export function getFoodVariants(food: NormalizedFood): NormalizedFood[] {
  if (!food.variantGroup) return [];
  return getGroups().get(food.variantGroup) ?? [];
}
