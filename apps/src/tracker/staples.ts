import {
  DIET_BASICS_CATALOG,
  NormalizedFood,
  PAKISTANI_STAPLES_DATA,
  SAUDI_TRADITIONAL_FOODS,
  ServingUnit,
} from '@nutrio/food-db';
import { Region } from '../common/region/index.js';

export interface StapleItem {
  id: string;
  /** Localised short chip label, resolved from the id at render time. */
  label: string;
  name: string;
  /**
   * Exact `name` of the catalogue entry this chip stands for. The dashboard
   * matches on this verbatim: the old fuzzy `includes` match sent "Boiled Egg"
   * to "Nargisi Kofta (with Hard Boiled Egg inside)". Left out when the
   * catalogue has no clean entry, in which case the macros below are logged.
   */
  foodName?: string;
  calories: number;
  proteinGrams: number;
  fatGrams: number;
  carbGrams: number;
  icon: 'utensils' | 'coffee' | 'sun';
}

// Source rows carry the nutrition only; the visible label comes from i18n.
type StapleDefinition = Omit<StapleItem, 'label'>;

const PK_STAPLES: StapleDefinition[] = [
  {
    id: 'egg',
    foodName: 'Boiled Egg (Whole)',
    name: 'Boiled Egg',
    calories: 75,
    proteinGrams: 6.5,
    fatGrams: 5,
    carbGrams: 0.5,
    icon: 'sun',
  },
  {
    id: 'chai',
    foodName: 'Doodh Patti Chai (1 tsp Sugar / Kam Cheeni)',
    name: 'Chai (Doodh Patti)',
    calories: 85,
    proteinGrams: 2,
    fatGrams: 3,
    carbGrams: 12,
    icon: 'coffee',
  },
  {
    id: 'dahi',
    foodName: 'Plain Yogurt / Dahi',
    name: 'Plain Yogurt / Dahi',
    calories: 92,
    proteinGrams: 5.3,
    fatGrams: 5,
    carbGrams: 7,
    icon: 'utensils',
  },
  {
    id: 'banana',
    foodName: 'Banana',
    name: 'Banana',
    calories: 105,
    proteinGrams: 1.3,
    fatGrams: 0.4,
    carbGrams: 26.9,
    icon: 'sun',
  },
  {
    id: 'apple',
    foodName: 'Apple',
    name: 'Apple',
    calories: 95,
    proteinGrams: 0.5,
    fatGrams: 0.3,
    carbGrams: 25.1,
    icon: 'sun',
  },
  {
    id: 'almonds',
    foodName: 'Almonds',
    name: 'Almonds (10)',
    calories: 69,
    proteinGrams: 2.5,
    fatGrams: 6,
    carbGrams: 2.6,
    icon: 'sun',
  },
  {
    id: 'green_tea',
    foodName: 'Green Tea / Qahwa',
    name: 'Green Tea / Qahwa',
    calories: 0,
    proteinGrams: 0,
    fatGrams: 0,
    carbGrams: 0,
    icon: 'coffee',
  },
  {
    id: 'chana',
    foodName: 'Roasted Chana',
    name: 'Roasted Chana',
    calories: 109,
    proteinGrams: 6.2,
    fatGrams: 1.6,
    carbGrams: 17.3,
    icon: 'sun',
  },
  {
    id: 'popcorn',
    foodName: 'Air-Popped Popcorn (No Butter)',
    name: 'Popcorn (Air-Popped)',
    calories: 120,
    proteinGrams: 3.6,
    fatGrams: 1.4,
    carbGrams: 23.3,
    icon: 'sun',
  },
  {
    id: 'bhutta',
    foodName: 'Boiled Corn (Bhutta)',
    name: 'Boiled Corn (Bhutta)',
    calories: 167,
    proteinGrams: 5.1,
    fatGrams: 2.3,
    carbGrams: 31.5,
    icon: 'sun',
  },
  {
    id: 'dark_choc',
    foodName: 'Dark Chocolate (85%)',
    name: 'Dark Chocolate (85%)',
    calories: 58,
    proteinGrams: 1,
    fatGrams: 4.8,
    carbGrams: 2.5,
    icon: 'sun',
  },
];

const SA_STAPLES: StapleDefinition[] = [
  {
    id: 'sa_tamees',
    foodName: 'Tamees Bread (Afghani/Saudi Oven Flatbread)',
    name: 'Tamees Bread (خبز تميس)',
    calories: 150,
    proteinGrams: 5,
    fatGrams: 1,
    carbGrams: 35,
    icon: 'utensils',
  },
  {
    id: 'sa_laban',
    foodName: 'Almarai Full Fat Fresh Laban',
    name: 'Almarai Laban (لبن المراعي)',
    calories: 120,
    proteinGrams: 8,
    fatGrams: 6,
    carbGrams: 10,
    icon: 'utensils',
  },
  {
    id: 'sa_gahwa',
    foodName: 'Saudi Gahwa with Cardamom & Saffron',
    name: 'Saudi Gahwa (فنجان قهوة سعودية)',
    calories: 2,
    proteinGrams: 0.1,
    fatGrams: 0,
    carbGrams: 0.5,
    icon: 'coffee',
  },
  {
    id: 'sa_dates',
    foodName: 'Sukari Dates (Al-Qassim)',
    name: 'Sukari Dates 3pc (تمر سكري)',
    calories: 75,
    proteinGrams: 0.6,
    fatGrams: 0.2,
    carbGrams: 19,
    icon: 'sun',
  },
  {
    id: 'sa_egg',
    foodName: 'Boiled Egg (Whole)',
    name: 'Boiled Egg (بيض مسلوق)',
    calories: 75,
    proteinGrams: 6.5,
    fatGrams: 5,
    carbGrams: 0.5,
    icon: 'sun',
  },
  {
    id: 'sa_kabsa_rice',
    name: 'Kabsa Rice Portion (أرز كبسة)',
    calories: 180,
    proteinGrams: 4,
    fatGrams: 4,
    carbGrams: 32,
    icon: 'utensils',
  },
  {
    id: 'sa_karak',
    foodName: 'Saudi Spiced Karak Tea (Cardamom & Milk)',
    name: 'Saudi Karak Tea (كرك)',
    calories: 102,
    proteinGrams: 3.1,
    fatGrams: 3.5,
    carbGrams: 14.7,
    icon: 'coffee',
  },
  {
    id: 'sa_yogurt',
    foodName: 'Greek Yogurt (Plain, Non-Fat)',
    name: 'Greek Yogurt (زبادي يوناني)',
    calories: 89,
    proteinGrams: 15.3,
    fatGrams: 0.6,
    carbGrams: 5.4,
    icon: 'utensils',
  },
  {
    id: 'sa_banana',
    foodName: 'Banana',
    name: 'Banana (موز)',
    calories: 105,
    proteinGrams: 1.3,
    fatGrams: 0.4,
    carbGrams: 26.9,
    icon: 'sun',
  },
  {
    id: 'sa_almonds',
    foodName: 'Almonds',
    name: 'Almonds 10pc (لوز)',
    calories: 69,
    proteinGrams: 2.5,
    fatGrams: 6,
    carbGrams: 2.6,
    icon: 'sun',
  },
  {
    id: 'sa_chana',
    foodName: 'Roasted Chana',
    name: 'Roasted Chana',
    calories: 109,
    proteinGrams: 6.2,
    fatGrams: 1.6,
    carbGrams: 17.3,
    icon: 'sun',
  },
  {
    id: 'sa_popcorn',
    foodName: 'Air-Popped Popcorn (No Butter)',
    name: 'Popcorn (Air-Popped)',
    calories: 120,
    proteinGrams: 3.6,
    fatGrams: 1.4,
    carbGrams: 23.3,
    icon: 'sun',
  },
  {
    id: 'sa_dark_choc',
    foodName: 'Dark Chocolate (85%)',
    name: 'Dark Chocolate (85%)',
    calories: 58,
    proteinGrams: 1,
    fatGrams: 4.8,
    carbGrams: 2.5,
    icon: 'sun',
  },
];

/** Fallback serving for a staple with no catalogue entry: the row's own macros. */
const STAPLE_SERVING: ServingUnit = { label: '1 serving', grams: 100, isDefault: true };

const stapleAsFood = (staple: StapleDefinition): NormalizedFood => ({
  name: staple.name,
  category: 'Quick Staple',
  cuisineTags: ['Staple'],
  kcal100g: staple.calories,
  protein100g: staple.proteinGrams,
  carb100g: staple.carbGrams,
  fat100g: staple.fatGrams,
  fibre100g: 0,
  sugar100g: 0,
  sodiumMg100g: 0,
  satFat100g: 0,
  source: 'pak_custom',
  oilAddedG: 0,
  servings: [STAPLE_SERVING],
});

export interface ResolvedStaple {
  food: NormalizedFood;
  serving: ServingUnit;
  /** Calories for exactly one of `serving` — what the chip shows and logs. */
  calories: number;
}

/**
 * Resolve a chip to the catalogue entry it stands for, by exact name.
 *
 * The lookup used to be `name.includes`, which sent "Boiled Egg" to
 * "Nargisi Kofta (with Hard Boiled Egg inside)" and dropped anything that
 * matched nothing onto `foodPool[0]` — an unrelated dish. Both the bar and the
 * logger go through here, so the calories on the chip are the calories logged.
 */
export function resolveStaple(
  staple: StapleDefinition,
  region: Region
): ResolvedStaple {
  const pool = region === 'SA' ? SAUDI_TRADITIONAL_FOODS : PAKISTANI_STAPLES_DATA;
  const target = (staple.foodName || staple.name).toLowerCase();
  const food =
    pool.find((f) => f.name.toLowerCase() === target) ||
    DIET_BASICS_CATALOG.find((f) => f.name.toLowerCase() === target);

  if (!food) {
    return { food: stapleAsFood(staple), serving: STAPLE_SERVING, calories: staple.calories };
  }

  // The chip's own `calories` says which portion it means ("+ 1 Roti", not a
  // whole tamees loaf), so pick the serving closest to it.
  const serving =
    food.servings.reduce<ServingUnit | null>((best, candidate) => {
      if (!best) return candidate;
      const diff = (sv: ServingUnit) =>
        Math.abs((food.kcal100g * sv.grams) / 100 - staple.calories);
      return diff(candidate) < diff(best) ? candidate : best;
    }, null) ||
    food.servings.find((sv) => sv.isDefault) ||
    STAPLE_SERVING;

  return {
    food,
    serving,
    calories: Math.round((food.kcal100g * serving.grams) / 100),
  };
}

/** Chips for a region, with labels resolved from i18n by the caller. */
export function getStapleDefinitions(region: Region): StapleDefinition[] {
  return region === 'SA' ? SA_STAPLES : PK_STAPLES;
}
