import { ALL_SAUDI_FOODS, PAKISTANI_STAPLES_DATA, NormalizedFood } from '@nutrio/food-db';

/**
 * Categories a generated meal plan never draws from. The regional catalogues
 * also feed search and the log hub, so they keep these; a plan should not
 * prescribe a takeaway, a dessert or a jar of sauce.
 */
const NON_PLAN_CATEGORIES = new Set([
  'Pakistani Fast Food',
  'Sweets & Desserts',
  'Desserts',
  'Condiments',
]);

/**
 * Diet & Basics carries dishes from cuisines outside both regions (ramen egg,
 * teriyaki, gyeran-jjim). Search should find them; a Pakistani or Saudi plan
 * should not prescribe them. Levantine, Turkish, Persian and Greek dishes stay:
 * they sit close to Saudi home cooking.
 */
const FOREIGN_CUISINES = new Set([
  'Japanese', 'Korean', 'Chinese', 'Thai', 'Vietnamese', 'Indonesian', 'Asian',
  'Italian', 'French', 'Spanish', 'American', 'Mexican', 'Latin', 'Hawaiian',
  'South Indian', 'Fast Food',
]);

const isPlanFood = (food: NormalizedFood): boolean =>
  !food.brand &&
  !food.brandId &&
  !NON_PLAN_CATEGORIES.has(food.category) &&
  !(food.cuisineTags ?? []).some((tag) => FOREIGN_CUISINES.has(tag));

const pools: Partial<Record<'PK' | 'SA', NormalizedFood[]>> = {};

/**
 * The foods a region's meal plan is built from: home dishes plus the
 * region's Diet & Basics foods, without restaurant menus or desserts.
 *
 * Saudi plans used to come from the 33 traditional dishes alone, which have
 * no bread and nothing vegan; the full Saudi catalogue adds the region's
 * diet foods (eggs, oats, laban, khubz, salads).
 */
export function mealPlanFoodPool(region: 'PK' | 'SA'): NormalizedFood[] {
  return (pools[region] ??= (region === 'SA' ? ALL_SAUDI_FOODS : PAKISTANI_STAPLES_DATA).filter(isPlanFood));
}
