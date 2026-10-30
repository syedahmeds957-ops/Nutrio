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

interface TaggedFood {
  name: string;
  cuisineTags?: string[];
}

interface Section<F extends TaggedFood> {
  group: string;
  foods: F[];
}

// Groups that suit a meal outright, and groups that suit it only when the food
// itself says so (a "Breakfast" or "Snack" tag, or an egg on the plate). Drinks
// and add-ons (oils, sauces, sweeteners) go with every meal.
const ALWAYS = new Set(['beverages', 'extras']);
const RULES: Record<MealSlot, { groups: Set<string>; byTag: Set<string>; tag: string }> = {
  breakfast: {
    groups: new Set(['dairy', 'grains', 'fruits', 'nuts_seeds']),
    byTag: new Set(['protein', 'meals', 'legumes', 'snacks']),
    tag: 'Breakfast',
  },
  lunch: {
    groups: new Set(['meals', 'protein', 'legumes', 'vegetables', 'grains', 'salads', 'soups', 'dairy', 'fruits']),
    byTag: new Set(),
    tag: 'Lunch',
  },
  dinner: {
    groups: new Set(['meals', 'protein', 'legumes', 'vegetables', 'grains', 'salads', 'soups', 'dairy', 'fruits']),
    byTag: new Set(),
    tag: 'Dinner',
  },
  snacks_chai: {
    groups: new Set(['fruits', 'nuts_seeds', 'snacks', 'dairy']),
    byTag: new Set(['protein', 'meals', 'grains']),
    tag: 'Snack',
  },
};

const EGG = /\b(egg|eggs|omelette|omelet)\b/i;

/** Whether a diet-list food fits a meal. Inferred from its group and tags: the catalogue has no mealtime field. */
export function slotAllows(group: string, food: TaggedFood, slot: MealSlot): boolean {
  if (ALWAYS.has(group)) return true;
  const rule = RULES[slot];
  if (rule.groups.has(group)) return true;
  if (!rule.byTag.has(group)) return false;
  if ((food.cuisineTags ?? []).includes(rule.tag)) return true;
  return slot === 'breakfast' && EGG.test(food.name);
}

/** The sections' foods that fit the meal; sections left empty are dropped. */
export function filterSectionsForSlot<F extends TaggedFood, S extends Section<F>>(
  sections: S[],
  slot: MealSlot | undefined
): S[] {
  if (!slot) return sections;
  return sections
    .map((section) => ({ ...section, foods: section.foods.filter((f) => slotAllows(section.group, f, slot)) }))
    .filter((section) => section.foods.length > 0);
}
