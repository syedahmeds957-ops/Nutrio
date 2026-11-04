import {
  MealPlanSolverInput,
  MealSwapOption,
  MealSwapResult,
  PlannedMealItem,
  PlannedMealSlot,
} from './types.js';
import {
  classifyFoodRoles,
  createPlannedItem,
  filterFoodPool,
  leanRotation,
  pick,
  SolverFoodCandidate,
} from './solver.js';


/** "Chicken Tikka (Breast / Chest Piece)" → "Chicken Tikka". */
const shortName = (name: string) =>
  name.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * The option's title, read from its own items. Titles used to be fixed per
 * slot ("Omelette & Paratha"), and whatever the fallbacks resolved to — egg
 * fried rice and chicken tikka — was listed underneath them.
 */
export function swapTitle(foods: SolverFoodCandidate[]): string {
  const names = Array.from(new Set(foods.map((f) => shortName(f.name))));
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
}

/**
 * Scales an option to the original meal's calories, one 0.1 step at a time,
 * always taking the step that lands closest. Each item is rebuilt from its own
 * food: the old loop looked items up by name and fell back to the first food
 * in the unfiltered pool.
 */
function calibrateMealCalories(
  lines: Array<{ food: SolverFoodCandidate; item: PlannedMealItem }>,
  targetCalories: number
): PlannedMealItem[] {
  const total = () => lines.reduce((sum, l) => sum + l.item.calories, 0);
  for (let iteration = 0; iteration < 60; iteration++) {
    const miss = total() - targetCalories;
    if (Math.abs(miss) <= targetCalories * 0.03) break;
    let best: { line: (typeof lines)[number]; quantity: number; miss: number } | undefined;
    for (const line of lines) {
      for (const delta of [0.1, -0.1]) {
        const quantity = Number((line.item.quantity + delta).toFixed(1));
        if (quantity < 0.2 || quantity > 4) continue;
        const next = Math.abs(miss + createPlannedItem(line.food, 0, quantity).calories - line.item.calories);
        if (next < (best?.miss ?? Math.abs(miss))) best = { line, quantity, miss: next };
      }
    }
    if (!best) break;
    Object.assign(best.line.item, createPlannedItem(best.line.food, 0, best.quantity));
  }
  return lines.map((l) => l.item);
}

/**
 * One-Tap Macro-Matched Meal Swapper
 * Generates up to 3 culturally coherent alternatives matching the original meal's calories within ±5%.
 */
export function generateMealSwaps(
  originalMeal: PlannedMealSlot,
  input: MealPlanSolverInput,
  foodPool: SolverFoodCandidate[]
): MealSwapResult {
  // A slot holding only a cup of kehwa (4 kcal) left nothing to match, so
  // every option shrank to a fifth of a portion; aim at the slot's plan then.
  const targetCalories =
    originalMeal.actualCalories >= 100 ? originalMeal.actualCalories : originalMeal.targetCalories;
  const originalNames = new Set(originalMeal.items.map((i) => i.foodName));
  // Only diet-safe foods. The dish that defines the meal must change; the
  // roti, rice or chai beside it may stay ("Daal & Roti" → "Bhindi & Roti").
  const dietSafe = filterFoodPool(foodPool, input);
  const roles = classifyFoodRoles(dietSafe.filter((f) => !originalNames.has(f.name)));
  const sides = classifyFoodRoles(dietSafe);

  const mains = leanRotation(roles.curries);
  const vegMains = leanRotation(roles.daals);
  const eggs = leanRotation(roles.eggs);
  const snacks = leanRotation(roles.proteinSnacks);
  const breads = [...sides.breads].sort((a, b) => a.fat100g - b.fat100g);
  const rices = sides.plainRices.length > 0 ? sides.plainRices : sides.rices;
  const drinks = sides.beverages;
  const isRiceDish = (f: SolverFoodCandidate | undefined) =>
    !!f && (rices.includes(f) || sides.rices.includes(f) || /kabsa|biryani|pulao|mandi/i.test(f.name));
  const withCarb = (main: SolverFoodCandidate | undefined, carb: SolverFoodCandidate | undefined) =>
    !main ? [] : isRiceDish(main) ? [main] : [main, carb];

  // Compositions in order of preference; empty roles simply drop out.
  const compositions: Array<Array<SolverFoodCandidate | undefined>> =
    originalMeal.slot === 'breakfast'
      ? [
          [pick(eggs, 0), pick(breads, 0)],
          [pick(eggs, 1), pick(breads, 1), pick(drinks, 0)],
          [pick(vegMains, 0), pick(breads, 0)],
          [pick(eggs, 2), pick(breads, 2)],
          [pick(snacks, 0), pick(breads, 1)],
          [pick(roles.sabzis, 0), pick(breads, 2)],
        ]
      : originalMeal.slot === 'snacks_chai'
      ? [
          [pick(snacks, 0), pick(drinks, 0)],
          [pick(snacks, 1), pick(drinks, 1)],
          [pick(eggs, 0), pick(drinks, 0)],
          [pick(snacks, 2)],
        ]
      : [
          withCarb(pick(mains, 0), pick(rices, 0)),
          withCarb(pick(vegMains, 0), pick(breads, 0)),
          withCarb(pick(mains, 1), pick(breads, 1)),
          withCarb(pick(vegMains, 1), pick(rices, 1)),
          withCarb(pick(mains, 2), pick(breads, 2)),
          [pick(roles.sabzis, 0), pick(breads, 0)],
          [pick(roles.sabzis, 1), pick(rices, 0)],
          [pick(vegMains, 0), pick(roles.sabzis, 0), pick(breads, 1)],
        ];

  const options: MealSwapOption[] = [];
  const seenTitles = new Set<string>();
  for (const composition of compositions) {
    if (options.length === 3) break;
    // The first food defines the option ("an egg breakfast"); without it the
    // rest is a plate of plain rice or bread.
    if (!composition[0]) continue;
    const foods = Array.from(new Set(composition.filter((f): f is SolverFoodCandidate => !!f)));
    const title = swapTitle(foods);
    if (seenTitles.has(title)) continue;
    seenTitles.add(title);

    const lines = foods.map((food) => ({ food, item: createPlannedItem(food, 0, 1) }));
    const planned = calibrateMealCalories(lines, targetCalories);
    const calories = planned.reduce((sum, i) => sum + i.calories, 0);
    const sum = (get: (i: PlannedMealItem) => number) =>
      Number(planned.reduce((s, i) => s + get(i), 0).toFixed(1));
    options.push({
      optionId: `swap_${originalMeal.slot}_${options.length + 1}`,
      title,
      calories,
      proteinGrams: sum((i) => i.proteinGrams),
      fatGrams: sum((i) => i.fatGrams),
      carbGrams: sum((i) => i.carbGrams),
      oilAddedG: sum((i) => i.oilAddedG),
      calorieDeltaPct: Number((((calories - targetCalories) / targetCalories) * 100).toFixed(1)),
      items: planned,
    });
  }

  const originalProtein = Number(
    originalMeal.items.reduce((s, i) => s + i.proteinGrams, 0).toFixed(1)
  );

  return {
    originalSlot: originalMeal.slot,
    originalCalories: originalMeal.actualCalories,
    originalProteinGrams: originalProtein,
    options,
  };
}
