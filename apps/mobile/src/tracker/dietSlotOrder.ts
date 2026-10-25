import type { MealSlot } from './types.js';

/** A diet-list section: only the group id matters for ordering. */
interface HasGroup {
  group: string;
}

// What people reach for first at each meal. The catalogue carries no mealtime
// tags, so this orders the sections rather than hiding any food: the sections
// not listed keep their usual order after the listed ones.
const FIRST_FOR_SLOT: Record<MealSlot, string[]> = {
  breakfast: ['dairy', 'grains', 'protein', 'fruits', 'beverages', 'meals'],
  lunch: ['meals', 'protein', 'legumes', 'vegetables', 'grains', 'salads', 'soups'],
  dinner: ['meals', 'protein', 'vegetables', 'soups', 'legumes', 'salads', 'grains'],
  snacks_chai: ['fruits', 'nuts_seeds', 'snacks', 'dairy', 'beverages'],
};

export function orderSectionsForSlot<T extends HasGroup>(sections: T[], slot: MealSlot | undefined): T[] {
  if (!slot) return sections;
  const first = FIRST_FOR_SLOT[slot];
  const rank = (group: string) => {
    const i = first.indexOf(group);
    return i === -1 ? first.length : i;
  };
  // Array.prototype.sort is stable, so unlisted sections keep their order.
  return [...sections].sort((a, b) => rank(a.group) - rank(b.group));
}
