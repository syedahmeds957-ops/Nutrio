import {
  DailyMealPlanResult,
  MealPlanSolverInput,
  PlannedMealItem,
  PlannedMealSlot,
} from './types.js';
import { isSuitableForDiet } from './diet-suitability.js';

export interface SolverFoodCandidate {
  id?: string;
  name: string;
  nameUr?: string;
  nameAr?: string;
  region?: string;
  category: string;
  cuisineTags: string[];
  kcal100g: number;
  protein100g: number;
  carb100g: number;
  fat100g: number;
  fibre100g: number;
  sugar100g: number;
  oilAddedG: number;
  servings: Array<{
    label: string;
    labelUr?: string;
    grams: number;
    isDefault: boolean;
  }>;
}

export function filterFoodPool(
  foods: SolverFoodCandidate[],
  input: MealPlanSolverInput
): SolverFoodCandidate[] {
  const { dietPreference, dislikedFoods = [], medicalConditions = [] } = input;
  const dislikedLower = dislikedFoods.map((d) => d.toLowerCase());

  return foods.filter((food) => {
    const nameLower = food.name.toLowerCase();

    // 1. Check dislikes
    if (dislikedLower.some((d) => nameLower.includes(d))) {
      return false;
    }

    // 2. Check diet preference.
    //
    // Delegated to diet-suitability.ts. This used to be three inline blocks
    // matching English words against Urdu dish names, plus a category check
    // for categories that do not exist in the catalogue — between them they
    // left 140 meat and fish dishes in the vegetarian pool.
    if (!isSuitableForDiet(food, dietPreference)) {
      return false;
    }

    // 3. Clinical checks
    if (medicalConditions.includes('diabetes_type_2')) {
      // Exclude high sugar desserts and sweet lassi
      if (food.sugar100g > 15 || food.category.includes('Desserts')) {
        return false;
      }
    }

    return true;
  });
}

export function createPlannedItem(
  food: SolverFoodCandidate,
  servingIndex: number,
  quantity: number
): PlannedMealItem {
  const serving = food.servings[servingIndex] || food.servings[0];
  const totalGrams = Math.round(serving.grams * quantity);
  const mult = totalGrams / 100;

  return {
    foodName: food.name,
    foodNameUr: food.nameUr,
    foodNameAr: food.nameAr,
    category: food.category,
    servingLabel: serving.label,
    servingGrams: serving.grams,
    quantity,
    totalGrams,
    calories: Math.round(food.kcal100g * mult),
    proteinGrams: Number((food.protein100g * mult).toFixed(1)),
    fatGrams: Number((food.fat100g * mult).toFixed(1)),
    carbGrams: Number((food.carb100g * mult).toFixed(1)),
    fibreGrams: Number((food.fibre100g * mult).toFixed(1)),
    oilAddedG: Number(((food.oilAddedG * totalGrams) / 100).toFixed(1)),
  };
}

export interface MealPlanSolverOptions {
  dayIndex?: number;
  /**
   * Which regional plan to build. Pass it — the caller always knows, and the
   * fallback below has to guess from the pool's contents.
   */
  region?: 'PK' | 'SA';
}

/**
 * Last-resort region guess for callers that don't declare one.
 *
 * Deliberately a majority test rather than "contains any Saudi food". The
 * Diet & Basics catalogue is region-neutral and merges into *both* regional
 * pools, so the Pakistani pool legitimately contains foul medames, labneh,
 * qahwa and tabbouleh. Under a `.some()` test those few entries flipped an
 * entire Pakistani week to Saudi meal titles and a foul-medames breakfast,
 * while the dishes underneath stayed nihari and sajji.
 */
function isPredominantlySaudi(foodPool: SolverFoodCandidate[]): boolean {
  if (foodPool.length === 0) return false;
  const saudiCount = foodPool.filter(
    (f) =>
      f.region === 'SA' ||
      (f.cuisineTags?.some((t) => t.toLowerCase() === 'saudi') ?? false)
  ).length;
  return saudiCount * 2 > foodPool.length;
}

// Food roles. Matched on the real catalogue's categories ("Karahi & Handi",
// "Sabzi & Lentils", "Rice & Meat") as well as the older fixture names
// ("Curries & Meat Dishes", "Daals & Pulses"): matching only the latter left
// the daal and sabzi pools empty, so a vegetarian's lunch "main" fell back
// to a roti.
const nameOf = (f: SolverFoodCandidate) => f.name.toLowerCase();
const catOf = (f: SolverFoodCandidate) => f.category.toLowerCase();
const servingKcal = (f: SolverFoodCandidate) =>
  (f.kcal100g * (f.servings[0]?.grams ?? 100)) / 100;
const isSweet = (f: SolverFoodCandidate) =>
  /dessert|sweet|mithai/.test(catOf(f)) ||
  /halwa|kheer|custard|jalebi|zarda/.test(nameOf(f)) ||
  f.sugar100g > 15;
const isDrink = (f: SolverFoodCandidate) => /beverage|drink/.test(catOf(f));
const isRiceDish = (f: SolverFoodCandidate) =>
  /rice|chawal|pulao|biryani|kabsa|mandi|bukhari|madhbi|sayyadiyah/.test(nameOf(f)) &&
  !/rice cake/.test(nameOf(f));
const isMixedRiceDish = (f: SolverFoodCandidate) =>
  /biryani|pulao|kabsa|mandi|bukhari|madhbi|sayyadiyah/.test(nameOf(f));

/** Protein's share of a food's energy less half its fat share: lean dishes rank first. */
const leanScore = (f: SolverFoodCandidate) =>
  f.kcal100g > 0 ? (f.protein100g * 4 - 0.5 * f.fat100g * 9) / f.kcal100g : -1;
/** The leaner part of a pool, still wide enough to rotate through a week. */
export const leanRotation = (foods: SolverFoodCandidate[]) => {
  const sorted = [...foods].sort((a, b) => leanScore(b) - leanScore(a));
  return sorted.slice(0, Math.max(Math.min(sorted.length, 7), Math.ceil(sorted.length * 0.4)));
};
/** The `i`th food of a rotation, wrapping; undefined for an empty one. */
export const pick = (foods: SolverFoodCandidate[], i: number) =>
  foods.length > 0 ? foods[i % foods.length] : undefined;

/**
 * The pool split into the roles a meal is built from. Shared by the solver and
 * the swapper so both read the catalogue the same way.
 */
export function classifyFoodRoles(foods: SolverFoodCandidate[]) {
  const breads = foods.filter(
    (f) =>
      (f.category.includes('Breads') ||
        /tamees|khubz|roti|chapati|naan|phulka|pita|\bsaj\b/.test(nameOf(f))) &&
      !isRiceDish(f) &&
      !isSweet(f)
  );
  const rices = foods.filter(
    (f) => (f.category.includes('Breads') || f.category.includes('Rice')) && isRiceDish(f)
  );
  // Rice on its own: a rice dish naming meat, fish or daal is a second main.
  const plainRices = foods.filter(
    (f) =>
      isRiceDish(f) &&
      !isMixedRiceDish(f) &&
      !isSweet(f) &&
      !/chicken|mutton|beef|gosht|sajji|prawn|fish|daal|keema|egg|combo/.test(nameOf(f))
  );
  const curries = foods.filter(
    (f) =>
      (/curr|karahi|handi|bbq|grill|barbecue|stew|meat/.test(catOf(f)) ||
        // Lean grilled plates from Diet & Basics. Saudi mains are otherwise
        // almost all rice dishes, which cannot reach a cutting protein target.
        (catOf(f) === 'diet & basics' &&
          /grilled|tawook|shish|kebab|tikka|roast|hammour/.test(nameOf(f)) &&
          !/turkey/.test(nameOf(f)) &&
          (f.protein100g * 4) / Math.max(1, f.kcal100g) >= 0.4)) &&
      !isSweet(f) &&
      servingKcal(f) >= 80
  );
  const daals = foods.filter(
    (f) =>
      (/daal|pulse|lentil/.test(catOf(f)) ||
        /daal|\bdal\b|lentil|chana|cholay|lobia|rajma|moong|masoor|soya|paneer|tofu|chickpea/.test(nameOf(f))) &&
      !isSweet(f) &&
      !isDrink(f) &&
      !isRiceDish(f) &&
      servingKcal(f) >= 80
  );
  const sabzis = foods.filter(
    (f) =>
      (/vegetable|sabzi/.test(catOf(f)) || /sabzi|bhindi|karela|lauki|palak|salad/.test(nameOf(f))) &&
      !daals.includes(f) &&
      !isSweet(f)
  );
  const eggs = foods.filter(
    (f) =>
      // \banda\b: "Pasanday" contains "anda", which put beef on the breakfast plate.
      /egg|omelette|\banda\b|shakshuka|khagina/.test(nameOf(f)) &&
      !/eggplant|kofta|curry|karahi|salan|rice|biryani|nargisi/.test(nameOf(f))
  );
  const beverages = foods.filter(
    (f) =>
      (isDrink(f) || /gahwa|chai|karak/.test(nameOf(f))) &&
      !isSweet(f) &&
      !/rusk|biscuit|cake|paratha|samosa/.test(nameOf(f)) &&
      f.sugar100g <= 10 &&
      servingKcal(f) <= 150
  );
  const proteinSnacks = foods.filter(
    (f) =>
      /dahi|yogurt|yoghurt|laban|labneh|raita|boiled egg|chana|tikka|boti|paneer|cottage|lassi/.test(nameOf(f)) &&
      !isSweet(f) &&
      f.kcal100g > 0 &&
      (f.protein100g * 4) / f.kcal100g >= 0.2 &&
      servingKcal(f) >= 50 &&
      servingKcal(f) <= 350
  );
  return { breads, rices, plainRices, curries, daals, sabzis, eggs, beverages, proteinSnacks };
}

/**
 * The plan for a diet that leaves nothing in the pool. Every default dish in
 * the solver falls back to the first filtered food, so with none of them it
 * used to throw instead of returning a plan.
 */
function emptyPlan(input: MealPlanSolverInput, region: 'PK' | 'SA'): DailyMealPlanResult {
  const slot = (id: PlannedMealSlot['slot'], title: string, share: number): PlannedMealSlot => ({
    slot: id,
    title,
    targetCalories: Math.round(input.targetCalories * share),
    actualCalories: 0,
    items: [],
  });
  return {
    targetCalories: input.targetCalories,
    actualCalories: 0,
    calorieDeviationPct: -100,
    targetProteinGrams: input.targetProteinGrams,
    actualProteinGrams: 0,
    targetFatGrams: input.targetFatGrams,
    actualFatGrams: 0,
    targetCarbGrams: input.targetCarbGrams,
    actualCarbGrams: 0,
    totalFibreGrams: 0,
    totalOilAddedG: 0,
    meals: [
      slot('breakfast', 'Protein Breakfast', 0.25),
      slot('lunch', 'Balanced Lunch', 0.35),
      slot('dinner', 'Wholesome Dinner', 0.3),
      slot('snacks_chai', 'Light Snack', 0.1),
    ],
    isWithinTolerance: false,
    dietPreference: input.dietPreference,
    region,
    insufficientFoodPool: true,
  };
}

/**
 * Deterministic Constraint Meal Plan Solver
 * Generates 4 culturally coherent Pakistani / Saudi meals hitting calorie & macro targets within ±5% tolerance.
 * Supports dayIndex (0-6) for rotating dishes across the 7-day week to ensure daily variety.
 */
export function solveDailyMealPlan(
  input: MealPlanSolverInput,
  foodPool: SolverFoodCandidate[],
  options?: MealPlanSolverOptions
): DailyMealPlanResult {
  const dayIndex = options?.dayIndex ?? 0;
  const filtered = filterFoodPool(foodPool, input);

  const isSaudi = options?.region
    ? options.region === 'SA'
    : isPredominantlySaudi(foodPool);

  if (filtered.length === 0) {
    return emptyPlan(input, isSaudi ? 'SA' : 'PK');
  }

  const { breads, rices, plainRices, curries, daals, sabzis, eggs, beverages, proteinSnacks } =
    classifyFoodRoles(filtered);

  const saudiBreakfastFoods = filtered.filter(
    (f) =>
      !breads.includes(f) &&
      (f.category.includes('Breakfast') ||
      f.name.toLowerCase().includes('shakshuka') ||
      f.name.toLowerCase().includes('foul') ||
      f.name.toLowerCase().includes('mutabbaq') ||
      f.name.toLowerCase().includes('masoub'))
  );

  // Default fallback candidates if filtered subset is sparse
  const defaultRoti =
    breads.find(
      (b) =>
        b.name.includes('Roti') ||
        b.name.includes('Tamees') ||
        b.name.includes('Khubz')
    ) ||
    breads[0] ||
    filtered.find((f) => f.name.includes('Tamees') || f.name.includes('Khubz')) ||
    // Never `foodPool[0]`. That was an unfiltered escape hatch straight past
    // the diet check — and the first entry in the Pakistani catalogue happens
    // to be Chicken Tikka, so a vegan could have been handed it as a default.
    filtered[0];

  const defaultDaal =
    daals.find((d) => d.name.includes('Chana') || d.name.includes('Mash')) ||
    daals[0] ||
    defaultRoti;
  const defaultSabzi =
    sabzis.find((s) => s.name.includes('Palak') || s.name.includes('Bhindi')) ||
    sabzis[0] ||
    defaultDaal;
  const defaultEgg =
    eggs.find((e) => e.name.includes('Boiled') || e.name.includes('Shakshuka') || e.name.includes('Omelette')) ||
    eggs[0] ||
    defaultDaal;
  const defaultChai =
    beverages.find((b) => b.name.includes('Gahwa') || b.name.includes('Chai')) || beverages[0];

  const mainRotation = leanRotation(curries);
  const vegMainRotation = leanRotation(daals);
  const eggRotation = leanRotation(eggs);
  const breadRotation = [...breads].sort((a, b) => a.fat100g - b.fat100g).slice(0, Math.max(3, Math.ceil(breads.length / 2)));
  // Lunch and dinner walk the same rotation half a lap apart, so they differ.
  const dinnerOffset = Math.ceil(mainRotation.length / 2) || 1;
  const vegDinnerOffset = Math.ceil(vegMainRotation.length / 2) || 1;

  // Energy distribution:
  // Breakfast: ~25%, Lunch: ~35%, Dinner: ~30%, Snack: ~10%
  const targetBreakfastKcal = Math.round(input.targetCalories * 0.25);
  const targetLunchKcal = Math.round(input.targetCalories * 0.35);
  const targetDinnerKcal = Math.round(input.targetCalories * 0.3);
  const targetSnackKcal = Math.round(input.targetCalories * 0.1);

  const lines: Array<{ item: PlannedMealItem; food: SolverFoodCandidate }> = [];
  const add = (list: PlannedMealItem[], food: SolverFoodCandidate | undefined, quantity: number) => {
    if (!food) return undefined;
    const item = createPlannedItem(food, 0, quantity);
    list.push(item);
    lines.push({ item, food });
    return item;
  };
  const qtyFor = (food: SolverFoodCandidate, kcal: number, min: number, max: number) => {
    const perServing = servingKcal(food);
    if (perServing <= 0) return min;
    return Math.min(max, Math.max(min, Math.round((kcal / perServing) * 2) / 2));
  };

  // 1. Breakfast Slot (Rotated across week)
  const breakfastItems: PlannedMealItem[] = [];
  if (isSaudi && saudiBreakfastFoods.length > 0) {
    const ranked = leanRotation(saudiBreakfastFoods);
    const primaryBreakfast =
      dayIndex === 0
        ? (ranked.find((f) => f.name.includes('Shakshuka')) ||
           ranked.find((f) => f.name.includes('Foul')) ||
           ranked[0])
        : ranked[dayIndex % ranked.length];
    const bItem = add(breakfastItems, primaryBreakfast, 1)!;
    const needed = targetBreakfastKcal - bItem.calories;
    const breadCandidate = pick(breadRotation, dayIndex);
    if (needed > 75 && breadCandidate && breadCandidate !== primaryBreakfast) {
      add(breakfastItems, breadCandidate, qtyFor(breadCandidate, needed, 0.5, 2));
    }
  } else {
    const dayEgg = (dayIndex === 0 ? defaultEgg : pick(eggRotation, dayIndex)) || defaultEgg;
    const eggItem = add(breakfastItems, dayEgg, 1)!;
    // Only a real bread: with none in the pool the old default fell through to
    // whatever food came first, and a Saudi vegan got three bowls of salad.
    const rotiCandidate = pick(breadRotation, dayIndex);
    if (rotiCandidate && rotiCandidate !== dayEgg) {
      add(breakfastItems, rotiCandidate, qtyFor(rotiCandidate, targetBreakfastKcal - eggItem.calories, 1, 3));
    }
    const dayBeverage = pick(beverages, dayIndex) || defaultChai;
    if (dayBeverage && breakfastItems.reduce((s, i) => s + i.calories, 0) < targetBreakfastKcal - 50) {
      add(breakfastItems, dayBeverage, 1);
    }
  }

  // 2. Lunch: a protein main, plus rice unless the main already is a rice dish.
  const lunchItems: PlannedMealItem[] = [];
  const eatsMeatAtLunch = input.dietPreference.includes('omnivore');
  const lunchMain =
    (eatsMeatAtLunch ? pick(mainRotation, dayIndex) : pick(vegMainRotation, dayIndex)) ||
    pick(mainRotation, dayIndex) ||
    defaultDaal;
  const lunchMainItem = add(lunchItems, lunchMain, 1)!;
  const neededLunchKcal = targetLunchKcal - lunchMainItem.calories;
  if (isRiceDish(lunchMain)) {
    const side = pick(sabzis, dayIndex);
    if (side && neededLunchKcal > 80) add(lunchItems, side, 1);
  } else {
    const chosenRice = pick(plainRices, dayIndex) || pick(rices, dayIndex) || pick(breadRotation, dayIndex);
    if (chosenRice && chosenRice !== lunchMain) {
      add(lunchItems, chosenRice, qtyFor(chosenRice, neededLunchKcal, 1, 2));
    }
  }

  // 3. Dinner: a second main (meat where the diet allows it) with bread.
  const dinnerItems: PlannedMealItem[] = [];
  const dinnerMain =
    (input.dietPreference !== 'vegetarian_desi'
      ? pick(mainRotation, dayIndex + dinnerOffset)
      : undefined) ||
    pick(vegMainRotation, dayIndex + vegDinnerOffset) ||
    pick(sabzis, dayIndex) ||
    defaultSabzi;
  const dinnerMainItem = add(dinnerItems, dinnerMain, 1)!;
  const chosenDinnerBread = pick(breadRotation, dayIndex + 1);
  if (chosenDinnerBread && chosenDinnerBread !== dinnerMain && !isRiceDish(dinnerMain)) {
    add(dinnerItems, chosenDinnerBread, qtyFor(chosenDinnerBread, targetDinnerKcal - dinnerMainItem.calories, 1, 3));
  }

  // 4. Snack / Chai: a drink, and a protein snack when the day is short of protein.
  const snackItems: PlannedMealItem[] = [];
  const snackChai = pick(beverages, dayIndex) || defaultChai;
  if (snackChai) add(snackItems, snackChai, 1);

  const sumOf = (get: (i: PlannedMealItem) => number) =>
    lines.reduce((s, l) => s + get(l.item), 0);
  const usedToday = new Set(lines.map((l) => l.food));
  const proteinSnack = pick(leanRotation(proteinSnacks.filter((f) => !usedToday.has(f))), dayIndex);
  if (proteinSnack && sumOf((i) => i.proteinGrams) < input.targetProteinGrams * 0.9) {
    add(snackItems, proteinSnack, 1);
  } else if (input.targetCalories - sumOf((i) => i.calories) > 150) {
    const snackCandidates = filtered.filter(
      (f) =>
        f.category.includes('Snacks') ||
        f.category.includes('Barbecue') ||
        f.name.includes('Dates') ||
        f.name.includes('Shami') ||
        f.name.includes('Fruit') ||
        f.name.includes('Nuts') ||
        f.name.includes('Kebab')
    );
    const extraSnack =
      pick(snackCandidates, dayIndex) ||
      filtered.find((f) => f.name.includes('Dates') || f.name.includes('Shami')) ||
      defaultEgg;
    add(snackItems, extraSnack, 1);
  }

  // Assemble initial slots
  const meals: PlannedMealSlot[] = [
    {
      slot: 'breakfast',
      title: 'Protein Breakfast',
      targetCalories: targetBreakfastKcal,
      actualCalories: 0,
      items: breakfastItems,
    },
    {
      slot: 'lunch',
      title: 'Balanced Lunch',
      targetCalories: targetLunchKcal,
      actualCalories: 0,
      items: lunchItems,
    },
    {
      slot: 'dinner',
      title: 'Wholesome Dinner',
      targetCalories: targetDinnerKcal,
      actualCalories: 0,
      items: dinnerItems,
    },
    {
      slot: 'snacks_chai',
      title: 'Light Snack',
      targetCalories: targetSnackKcal,
      actualCalories: 0,
      items: snackItems,
    },
  ];

  // 5. Portion tuning against calories *and* macros. Calories dominate the
  // cost so the ±5% guarantee holds; protein shortfall and fat excess cost
  // more than the opposite misses. Drinks stay at one cup.
  const setQuantity = (line: (typeof lines)[number], quantity: number) => {
    Object.assign(line.item, createPlannedItem(line.food, 0, quantity));
  };
  const rel = (actual: number, target: number) => (target > 0 ? (actual - target) / target : 0);
  const cost = (k: number, p: number, f: number, c: number) => {
    const dk = rel(k, input.targetCalories);
    const dp = rel(p, input.targetProteinGrams);
    const df = rel(f, input.targetFatGrams);
    const dc = rel(c, input.targetCarbGrams);
    return 8 * dk * dk + (dp < 0 ? 2 : 0.3) * dp * dp + (df > 0 ? 1 : 0.4) * df * df + 0.3 * dc * dc;
  };
  const tunable = lines.filter((l) => !isDrink(l.food) && !/gahwa|chai|karak/.test(nameOf(l.food)));
  const stepFor = (l: (typeof lines)[number]) => (breads.includes(l.food) ? 0.5 : 0.25);
  // A snack stays a snack: uncapped, the tuner served three cups of yogurt.
  const maxFor = (l: (typeof lines)[number]) =>
    snackItems.includes(l.item) ? 1.5 : breads.includes(l.food) ? 4 : 3;
  for (let iteration = 0; iteration < 80; iteration++) {
    const totals = {
      k: sumOf((i) => i.calories),
      p: sumOf((i) => i.proteinGrams),
      f: sumOf((i) => i.fatGrams),
      c: sumOf((i) => i.carbGrams),
    };
    const current = cost(totals.k, totals.p, totals.f, totals.c);
    let best: { line: (typeof lines)[number]; quantity: number; cost: number } | undefined;
    for (const line of tunable) {
      const unit = createPlannedItem(line.food, 0, 1);
      for (const delta of [stepFor(line), -stepFor(line)]) {
        const quantity = Number((line.item.quantity + delta).toFixed(2));
        if (quantity < 0.5 || quantity > maxFor(line)) continue;
        const c = cost(
          totals.k + unit.calories * delta,
          totals.p + unit.proteinGrams * delta,
          totals.f + unit.fatGrams * delta,
          totals.c + unit.carbGrams * delta
        );
        if (c < (best?.cost ?? current - 1e-6)) best = { line, quantity, cost: c };
      }
    }
    if (!best) break;
    setQuantity(best.line, best.quantity);
  }
  for (const meal of meals) meal.actualCalories = meal.items.reduce((s, i) => s + i.calories, 0);

  // 6. Calorie safety net (Enforce ±5% Tolerance strictly). Takes the single
  // step that lands closest to the target, and stops when none helps: always
  // stepping the biggest line made a 750 kcal tamees loaf swing past the
  // target and back until the iterations ran out.
  let actualCalories = meals.reduce((sum, m) => sum + m.actualCalories, 0);
  for (let iteration = 0; iteration < 40; iteration++) {
    const miss = actualCalories - input.targetCalories;
    if (Math.abs(miss) <= input.targetCalories * 0.03) break;
    let best: { line: (typeof lines)[number]; quantity: number; miss: number } | undefined;
    for (const line of tunable) {
      for (const delta of [0.25, -0.25]) {
        const quantity = Number((line.item.quantity + delta).toFixed(2));
        if (quantity < 0.25 || quantity > maxFor(line)) continue;
        const next = Math.abs(miss + createPlannedItem(line.food, 0, quantity).calories - line.item.calories);
        if (next < (best?.miss ?? Math.abs(miss))) best = { line, quantity, miss: next };
      }
    }
    if (!best) break;
    setQuantity(best.line, best.quantity);
    for (const meal of meals) meal.actualCalories = meal.items.reduce((s, i) => s + i.calories, 0);
    actualCalories = meals.reduce((s, m) => s + m.actualCalories, 0);
  }

  const calorieDeviationPct = Number(
    (((actualCalories - input.targetCalories) / input.targetCalories) * 100).toFixed(1)
  );

  // Compute aggregated macros
  const allItems = meals.flatMap((m) => m.items);
  const actualProteinGrams = Number(
    allItems.reduce((sum, item) => sum + item.proteinGrams, 0).toFixed(1)
  );
  const actualFatGrams = Number(
    allItems.reduce((sum, item) => sum + item.fatGrams, 0).toFixed(1)
  );
  const actualCarbGrams = Number(
    allItems.reduce((sum, item) => sum + item.carbGrams, 0).toFixed(1)
  );
  const totalFibreGrams = Number(
    allItems.reduce((sum, item) => sum + item.fibreGrams, 0).toFixed(1)
  );
  const totalOilAddedG = Number(
    allItems.reduce((sum, item) => sum + item.oilAddedG, 0).toFixed(1)
  );

  return {
    targetCalories: input.targetCalories,
    actualCalories,
    calorieDeviationPct,
    targetProteinGrams: input.targetProteinGrams,
    actualProteinGrams,
    targetFatGrams: input.targetFatGrams,
    actualFatGrams,
    targetCarbGrams: input.targetCarbGrams,
    actualCarbGrams,
    totalFibreGrams,
    totalOilAddedG,
    meals,
    isWithinTolerance: Math.abs(calorieDeviationPct) <= 5.0,
    dietPreference: input.dietPreference,
    region: isSaudi ? 'SA' : 'PK',
  };
}
