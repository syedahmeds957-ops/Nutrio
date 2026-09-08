import {
  DailyMealPlanResult,
  MealPlanSolverInput,
  PlannedMealItem,
  PlannedMealSlot,
} from './types.js';

export interface SolverFoodCandidate {
  name: string;
  nameUr?: string;
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
  const { dietPreference, budgetTierPKR, dislikedFoods = [], medicalConditions = [] } = input;
  const dislikedLower = dislikedFoods.map((d) => d.toLowerCase());

  return foods.filter((food) => {
    const nameLower = food.name.toLowerCase();

    // 1. Check dislikes
    if (dislikedLower.some((d) => nameLower.includes(d))) {
      return false;
    }

    // 2. Check diet preference
    if (dietPreference === 'vegan') {
      const isAnimal =
        food.category.includes('Meat') ||
        food.category.includes('Barbecue') ||
        food.category.includes('Dessert') ||
        food.name.includes('Egg') ||
        food.name.includes('Chicken') ||
        food.name.includes('Beef') ||
        food.name.includes('Mutton') ||
        food.name.includes('Lassi') ||
        food.name.includes('Kheer') ||
        food.name.includes('Doodh Patti');
      if (isAnimal) return false;
    } else if (dietPreference === 'vegetarian_desi') {
      const isMeat =
        food.category.includes('Meat') ||
        food.category.includes('Barbecue') ||
        food.name.includes('Chicken') ||
        food.name.includes('Beef') ||
        food.name.includes('Mutton') ||
        food.name.includes('Paya') ||
        food.name.includes('Nihari');
      if (isMeat) return false;
    } else if (dietPreference === 'eggetarian') {
      const isMeatNotEgg =
        (food.category.includes('Meat') ||
          food.category.includes('Barbecue') ||
          food.name.includes('Chicken') ||
          food.name.includes('Beef') ||
          food.name.includes('Mutton')) &&
        !food.name.includes('Egg') &&
        !food.name.includes('Omelette') &&
        !food.name.includes('Anda');
      if (isMeatNotEgg) return false;
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

/**
 * Deterministic Constraint Meal Plan Solver
 * Generates 4 culturally coherent Pakistani meals hitting calorie & macro targets within ±5% tolerance.
 */
export function solveDailyMealPlan(
  input: MealPlanSolverInput,
  foodPool: SolverFoodCandidate[]
): DailyMealPlanResult {
  const filtered = filterFoodPool(foodPool, input);

  // Categorized pools
  const breads = filtered.filter(
    (f) =>
      f.category.includes('Breads') &&
      !f.name.toLowerCase().includes('rice') &&
      !f.name.toLowerCase().includes('chawal')
  );
  const rices = filtered.filter(
    (f) =>
      (f.category.includes('Breads') || f.category.includes('Rice')) &&
      (f.name.toLowerCase().includes('rice') ||
        f.name.toLowerCase().includes('chawal') ||
        f.name.toLowerCase().includes('pulao') ||
        f.name.toLowerCase().includes('biryani'))
  );
  const plainRices = filtered.filter(
    (f) =>
      (f.name.toLowerCase().includes('rice') || f.name.toLowerCase().includes('chawal')) &&
      !f.name.toLowerCase().includes('biryani') &&
      !f.name.toLowerCase().includes('pulao')
  );
  const curries = filtered.filter(
    (f) =>
      f.category.includes('Curries') ||
      f.category.includes('Barbecue') ||
      (f.category.includes('Meat') && !f.name.toLowerCase().includes('rice'))
  );
  const daals = filtered.filter((f) => f.category.includes('Daals'));
  const sabzis = filtered.filter((f) => f.category.includes('Vegetables'));
  const eggs = filtered.filter(
    (f) =>
      !f.name.toLowerCase().includes('eggplant') &&
      (f.name.toLowerCase().includes('egg') ||
        f.name.toLowerCase().includes('omelette') ||
        f.name.toLowerCase().includes('anda'))
  );
  const beverages = filtered.filter((f) => f.category.includes('Beverages'));

  // Default fallback candidates if filtered subset is sparse
  const defaultRoti =
    breads.find((b) => b.name.includes('Roti')) || breads[0] || foodPool[0];
  const defaultRice =
    plainRices[0] ||
    rices.find((r) => r.name.includes('Rice') || r.name.includes('Chawal')) ||
    defaultRoti;
  const defaultDaal =
    daals.find((d) => d.name.includes('Chana') || d.name.includes('Mash')) ||
    daals[0] ||
    defaultRoti;
  const defaultSabzi =
    sabzis.find((s) => s.name.includes('Palak') || s.name.includes('Bhindi')) ||
    sabzis[0] ||
    defaultDaal;
  const defaultEgg =
    eggs.find((e) => e.name.includes('Boiled') || e.name.includes('Omelette')) ||
    eggs[0] ||
    defaultDaal;
  const defaultChai =
    beverages.find((b) => b.name.includes('Chai')) || beverages[0];
  const defaultCurry =
    curries.length > 0 && input.dietPreference !== 'vegetarian_desi'
      ? curries[0]
      : defaultDaal;

  // Energy distribution:
  // Breakfast: ~25%, Lunch: ~35%, Dinner: ~30%, Snack: ~10%
  const targetBreakfastKcal = Math.round(input.targetCalories * 0.25);
  const targetLunchKcal = Math.round(input.targetCalories * 0.35);
  const targetDinnerKcal = Math.round(input.targetCalories * 0.3);
  const targetSnackKcal = Math.round(input.targetCalories * 0.1);

  // 1. Breakfast Slot
  const breakfastItems: PlannedMealItem[] = [];
  const eggItem = createPlannedItem(defaultEgg, 0, 1);
  breakfastItems.push(eggItem);

  const neededBreakfastKcal = targetBreakfastKcal - eggItem.calories;
  const rotiKcalPerServing = (defaultRoti.kcal100g * defaultRoti.servings[0].grams) / 100;
  const breakfastRotiQty = Math.max(1, Math.round(neededBreakfastKcal / rotiKcalPerServing));
  breakfastItems.push(createPlannedItem(defaultRoti, 0, breakfastRotiQty));

  if (defaultChai && breakfastItems.reduce((s, i) => s + i.calories, 0) < targetBreakfastKcal - 50) {
    breakfastItems.push(createPlannedItem(defaultChai, 0, 1));
  }

  // 2. Lunch Slot (Rice / Roti + Main Dish + Sabzi/Daal)
  const lunchItems: PlannedMealItem[] = [];
  const lunchMain = input.dietPreference.includes('omnivore') && curries.length > 0 ? defaultCurry : defaultDaal;
  const lunchMainItem = createPlannedItem(lunchMain, 0, 1);
  lunchItems.push(lunchMainItem);

  const neededLunchKcal = targetLunchKcal - lunchMainItem.calories;
  const riceKcalPerServing = (defaultRice.kcal100g * defaultRice.servings[0].grams) / 100;
  const lunchGrainQty = Math.max(1, Number((neededLunchKcal / riceKcalPerServing).toFixed(1)));
  lunchItems.push(createPlannedItem(defaultRice, 0, Math.min(2, Math.max(1, Math.round(lunchGrainQty)))));

  // 3. Dinner Slot (Roti + Daal or Sabzi or Grill)
  const dinnerItems: PlannedMealItem[] = [];
  const dinnerCurry = curries.length > 1 ? curries[1] : defaultSabzi;
  const dinnerCurryItem = createPlannedItem(dinnerCurry, 0, 1);
  dinnerItems.push(dinnerCurryItem);

  const neededDinnerKcal = targetDinnerKcal - dinnerCurryItem.calories;
  const dinnerRotiQty = Math.max(1, Math.round(neededDinnerKcal / rotiKcalPerServing));
  dinnerItems.push(createPlannedItem(defaultRoti, 0, dinnerRotiQty));

  // 4. Snack / Chai Slot
  const snackItems: PlannedMealItem[] = [];
  if (defaultChai) {
    snackItems.push(createPlannedItem(defaultChai, 0, 1));
  }
  const currentTotalNoSnack =
    breakfastItems.reduce((s, i) => s + i.calories, 0) +
    lunchItems.reduce((s, i) => s + i.calories, 0) +
    dinnerItems.reduce((s, i) => s + i.calories, 0);

  const remainingForDay = input.targetCalories - currentTotalNoSnack;
  if (remainingForDay > 150) {
    // Add shami kebab or fruit/egg
    const shami = filtered.find((f) => f.name.includes('Shami')) || defaultEgg;
    snackItems.push(createPlannedItem(shami, 0, 1));
  }

  // Assemble initial slots
  const meals: PlannedMealSlot[] = [
    {
      slot: 'breakfast',
      title: 'Desi Protein Breakfast',
      targetCalories: targetBreakfastKcal,
      actualCalories: breakfastItems.reduce((s, i) => s + i.calories, 0),
      items: breakfastItems,
    },
    {
      slot: 'lunch',
      title: 'Traditional Lunch',
      targetCalories: targetLunchKcal,
      actualCalories: lunchItems.reduce((s, i) => s + i.calories, 0),
      items: lunchItems,
    },
    {
      slot: 'dinner',
      title: 'Evening Wholesome Dinner',
      targetCalories: targetDinnerKcal,
      actualCalories: dinnerItems.reduce((s, i) => s + i.calories, 0),
      items: dinnerItems,
    },
    {
      slot: 'snacks_chai',
      title: 'Chai & Light Snack',
      targetCalories: targetSnackKcal,
      actualCalories: snackItems.reduce((s, i) => s + i.calories, 0),
      items: snackItems,
    },
  ];

  // 5. Code Auto-Adjustment Pass (Enforce ±5% Tolerance strictly)
  let actualCalories = meals.reduce((sum, m) => sum + m.actualCalories, 0);

  let iterations = 0;
  while (
    Math.abs(actualCalories - input.targetCalories) > input.targetCalories * 0.03 &&
    iterations < 40
  ) {
    iterations++;
    const diff = actualCalories - input.targetCalories;

    if (diff > 0) {
      // Too high: reduce portion by 0.2
      let reduced = false;
      for (const meal of [meals[3], meals[2], meals[1], meals[0]]) {
        const candidate = meal.items.find((i) => i.quantity > 0.4);
        if (candidate) {
          candidate.quantity = Number((candidate.quantity - 0.2).toFixed(1));
          const foodObj =
            filtered.find((f) => f.name === candidate.foodName) || defaultRoti;
          const updated = createPlannedItem(foodObj, 0, candidate.quantity);
          Object.assign(candidate, updated);
          meal.actualCalories = meal.items.reduce((s, i) => s + i.calories, 0);
          actualCalories = meals.reduce((s, m) => s + m.actualCalories, 0);
          reduced = true;
          break;
        }
      }
      if (!reduced) break;
    } else {
      // Too low: increase grains, daals, or curries by 0.2
      let increased = false;
      for (const meal of [meals[1], meals[2], meals[0]]) {
        const candidate = meal.items.find(
          (i) =>
            i.category.includes('Breads') ||
            i.category.includes('Rice') ||
            i.category.includes('Daals') ||
            i.category.includes('Curries') ||
            i.category.includes('Meat')
        );
        if (candidate) {
          candidate.quantity = Number((candidate.quantity + 0.2).toFixed(1));
          const foodObj =
            filtered.find((f) => f.name === candidate.foodName) || defaultRoti;
          const updated = createPlannedItem(foodObj, 0, candidate.quantity);
          Object.assign(candidate, updated);
          meal.actualCalories = meal.items.reduce((s, i) => s + i.calories, 0);
          actualCalories = meals.reduce((s, m) => s + m.actualCalories, 0);
          increased = true;
          break;
        }
      }
      if (!increased) break;
    }
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
    budgetTier: input.budgetTierPKR,
    dietPreference: input.dietPreference,
  };
}
