import {
  MealPlanSolverInput,
  MealSwapOption,
  MealSwapResult,
  PlannedMealItem,
  PlannedMealSlot,
} from './types.js';
import {
  createPlannedItem,
  filterFoodPool,
  SolverFoodCandidate,
} from './solver.js';


function calibrateMealCalories(
  items: PlannedMealItem[],
  targetCalories: number,
  foodPool: SolverFoodCandidate[]
): PlannedMealItem[] {
  let currentCalories = items.reduce((sum, item) => sum + item.calories, 0);

  let iterations = 0;
  while (
    Math.abs(currentCalories - targetCalories) > targetCalories * 0.03 &&
    iterations < 40
  ) {
    iterations++;
    const diff = currentCalories - targetCalories;

    if (diff > 0) {
      // Too high: reduce an item by 0.1
      let reduced = false;
      for (const item of items) {
        if (item.quantity > 0.2) {
          item.quantity = Number((item.quantity - 0.1).toFixed(1));
          const foodObj =
            foodPool.find((f) => f.name === item.foodName) || foodPool[0];
          const updated = createPlannedItem(foodObj, 0, item.quantity);
          Object.assign(item, updated);
          currentCalories = items.reduce((s, i) => s + i.calories, 0);
          reduced = true;
          break;
        }
      }
      if (!reduced) break;
    } else {
      // Too low: increase grain or protein by 0.1
      let increased = false;
      for (const item of items) {
        if (
          item.category.includes('Breads') ||
          item.category.includes('Rice') ||
          item.category.includes('Daals') ||
          item.category.includes('Meat') ||
          item.category.includes('Breakfast')
        ) {
          item.quantity = Number((item.quantity + 0.1).toFixed(1));
          const foodObj =
            foodPool.find((f) => f.name === item.foodName) || foodPool[0];
          const updated = createPlannedItem(foodObj, 0, item.quantity);
          Object.assign(item, updated);
          currentCalories = items.reduce((s, i) => s + i.calories, 0);
          increased = true;
          break;
        }
      }
      if (!increased) break;
    }
  }

  return items;
}

/**
 * One-Tap Macro-Matched Meal Swapper
 * Generates 3 culturally diverse alternative meals matching original meal calories within ±5%.
 */
export function generateMealSwaps(
  originalMeal: PlannedMealSlot,
  input: MealPlanSolverInput,
  foodPool: SolverFoodCandidate[]
): MealSwapResult {
  const filtered = filterFoodPool(foodPool, input);
  const targetCalories = originalMeal.actualCalories;
  const originalNames = new Set(originalMeal.items.map((i) => i.foodName));

  // Eligible pools excluding original dishes
  const candidates = filtered.filter((f) => !originalNames.has(f.name));

  const breads = candidates.filter((f) => f.category.includes('Breads'));
  const rices = candidates.filter((f) => f.category.includes('Rice'));
  const daals = candidates.filter((f) => f.category.includes('Daals'));
  const meats = candidates.filter(
    (f) =>
      f.category.includes('Meat') ||
      f.category.includes('Barbecue') ||
      f.category.includes('Curries')
  );
  const sabzis = candidates.filter((f) => f.category.includes('Vegetables'));
  const eggs = candidates.filter(
    (f) => f.name.includes('Egg') || f.name.includes('Omelette')
  );
  const snacks = candidates.filter((f) => f.name.includes('Shami') || f.category.includes('Snacks'));
  const drinks = candidates.filter((f) => f.category.includes('Beverages'));

  const defaultRoti =
    breads.find((b) => b.name.includes('Roti')) || breads[0] || foodPool[0];
  const defaultRice =
    rices.find((r) => r.name.includes('Rice')) || rices[0] || defaultRoti;
  const defaultDaal =
    daals.find((d) => d.name.includes('Chana')) || daals[0] || defaultRoti;
  const defaultMeat =
    meats.find((m) => m.name.includes('Tikka') || m.name.includes('Kebab')) ||
    meats[0] ||
    defaultDaal;
  const defaultSabzi = sabzis[0] || defaultDaal;
  const defaultEgg = eggs[0] || defaultDaal;
  const defaultChai = drinks[0];

  const buildOption = (
    optionId: string,
    title: string,
    rawItems: Array<{ food: SolverFoodCandidate; qty: number }>
  ): MealSwapOption => {
    let planned = rawItems.map((r) => createPlannedItem(r.food, 0, r.qty));
    planned = calibrateMealCalories(planned, targetCalories, foodPool);

    const calories = planned.reduce((sum, i) => sum + i.calories, 0);
    const proteinGrams = Number(
      planned.reduce((sum, i) => sum + i.proteinGrams, 0).toFixed(1)
    );
    const fatGrams = Number(
      planned.reduce((sum, i) => sum + i.fatGrams, 0).toFixed(1)
    );
    const carbGrams = Number(
      planned.reduce((sum, i) => sum + i.carbGrams, 0).toFixed(1)
    );
    const oilAddedG = Number(
      planned.reduce((sum, i) => sum + i.oilAddedG, 0).toFixed(1)
    );
    const calorieDeltaPct = Number(
      (((calories - targetCalories) / targetCalories) * 100).toFixed(1)
    );

    return {
      optionId,
      title,
      calories,
      proteinGrams,
      fatGrams,
      carbGrams,
      oilAddedG,
      calorieDeltaPct,
      items: planned,
    };
  };

  let option1: MealSwapOption;
  let option2: MealSwapOption;
  let option3: MealSwapOption;

  if (originalMeal.slot === 'breakfast') {
    // Option 1: Desi Omelette + Paratha
    const paratha = breads.find((b) => b.name.includes('Paratha')) || defaultRoti;
    option1 = buildOption('swap_bf_1', 'Desi Omelette & Paratha', [
      { food: defaultEgg, qty: 1 },
      { food: paratha, qty: 1 },
    ]);

    // Option 2: Boiled Eggs + Roti + Karak Chai
    const chai = defaultChai || defaultEgg;
    option2 = buildOption('swap_bf_2', 'Boiled Eggs, Roti & Chai', [
      { food: defaultEgg, qty: 2 },
      { food: defaultRoti, qty: 1 },
      { food: chai, qty: 1 },
    ]);

    // Option 3: Chana Curry & Roti
    option3 = buildOption('swap_bf_3', 'Lahori Chana & Roti', [
      { food: defaultDaal, qty: 1 },
      { food: defaultRoti, qty: 2 },
    ]);
  } else if (originalMeal.slot === 'snacks_chai') {
    // Option 1: Shami Kebab & Karak Chai
    const shami = snacks[0] || defaultEgg;
    const chai = defaultChai || defaultEgg;
    option1 = buildOption('swap_sn_1', 'Shami Kebab & Karak Chai', [
      { food: shami, qty: 1 },
      { food: chai, qty: 1 },
    ]);

    // Option 2: Boiled Egg & Tea
    option2 = buildOption('swap_sn_2', 'Boiled Egg & Chai', [
      { food: defaultEgg, qty: 1 },
      { food: chai, qty: 1 },
    ]);

    // Option 3: Half Portion Roti & Daal
    option3 = buildOption('swap_sn_3', 'Light Daal & Phulka', [
      { food: defaultDaal, qty: 0.5 },
      { food: defaultRoti, qty: 1 },
    ]);
  } else {
    // Lunch or Dinner Swaps
    // Option 1: Rice + Protein/Daal Combo
    const isVeg = input.dietPreference === 'vegetarian_desi';
    const main1 = isVeg ? defaultDaal : defaultMeat;
    option1 = buildOption('swap_main_1', isVeg ? 'Daal Chawal Platter' : 'Basmati Rice & Meat Curry', [
      { food: defaultRice, qty: 1 },
      { food: main1, qty: 1 },
    ]);

    // Option 2: Traditional Daal & Tandoori Roti
    option2 = buildOption('swap_main_2', 'Daal Tadka & Warm Rotis', [
      { food: defaultDaal, qty: 1 },
      { food: defaultRoti, qty: 2 },
      { food: defaultEgg, qty: 1 },
    ]);

    // Option 3: High Protein Barbecue / Sabzi Option
    const main3 = isVeg ? defaultSabzi : defaultMeat;
    option3 = buildOption('swap_main_3', isVeg ? 'Wholesome Sabzi & Rotis' : 'BBQ Tikka & Roti Platter', [
      { food: main3, qty: 1 },
      { food: defaultRoti, qty: 2 },
    ]);
  }

  const originalProtein = Number(
    originalMeal.items.reduce((s, i) => s + i.proteinGrams, 0).toFixed(1)
  );

  return {
    originalSlot: originalMeal.slot,
    originalCalories: originalMeal.actualCalories,
    originalProteinGrams: originalProtein,
    options: [option1, option2, option3],
  };
}
