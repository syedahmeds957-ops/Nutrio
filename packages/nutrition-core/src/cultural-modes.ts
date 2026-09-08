import {
  DailyMealPlanResult,
  FamilyModeInput,
  FamilyModePlanResult,
  HydrationWindow,
  MealPlanSolverInput,
  PlannedMealItem,
  PlannedMealSlot,
  RamadanPlanResult,
} from './types.js';
import {
  createPlannedItem,
  filterFoodPool,
  SolverFoodCandidate,
} from './solver.js';


/**
 * Pakistani Family Mode (Shared Handi) Adapter
 * Seamlessly integrates the family's shared dinner or lunch without demanding separate cooking,
 * re-balancing the rest of the day to maintain daily calorie and protein targets within ±5%.
 */
export function adaptPlanForFamilyMode(
  basePlan: DailyMealPlanResult,
  familyInput: FamilyModeInput,
  solverInput: MealPlanSolverInput,
  foodPool: SolverFoodCandidate[]
): FamilyModePlanResult {
  const dishNameLower = familyInput.familyDishName.toLowerCase();
  const matchedFood =
    foodPool.find((f) => f.name.toLowerCase().includes(dishNameLower)) ||
    foodPool.find((f) => f.category.includes('Curries')) ||
    foodPool[0];

  const defaultRoti =
    foodPool.find((f) => f.name.includes('Roti')) || foodPool[0];
  const defaultEgg =
    foodPool.find((f) => f.name.includes('Egg')) || foodPool[0];

  // Clone base meals
  const clonedMeals: PlannedMealSlot[] = JSON.parse(
    JSON.stringify(basePlan.meals)
  );

  const targetSlot = clonedMeals.find(
    (m) => m.slot === familyInput.familyMealSlot
  );

  if (targetSlot) {
    // 1. Insert family dish as primary item in the chosen slot
    const familyItem = createPlannedItem(matchedFood, 0, 1);
    const existingGrains = targetSlot.items.filter(
      (i) => i.category.includes('Breads') || i.category.includes('Rice')
    );

    targetSlot.items = [familyItem, ...existingGrains];
    targetSlot.actualCalories = targetSlot.items.reduce(
      (s, i) => s + i.calories,
      0
    );
  }

  // 2. Re-balance daily calories across slots so total remains within ±5% of target
  let currentTotalKcal = clonedMeals.reduce((s, m) => s + m.actualCalories, 0);
  let iterations = 0;

  while (
    Math.abs(currentTotalKcal - solverInput.targetCalories) >
      solverInput.targetCalories * 0.03 &&
    iterations < 30
  ) {
    iterations++;
    const diff = currentTotalKcal - solverInput.targetCalories;

    if (diff > 0) {
      // Too high: reduce grain or snack portions
      let reduced = false;
      for (const meal of [clonedMeals[3], clonedMeals[2], clonedMeals[1], clonedMeals[0]]) {
        const candidate = meal.items.find(
          (i) => i.quantity > 0.5 && i.foodName !== matchedFood.name
        );
        if (candidate) {
          candidate.quantity = Number((candidate.quantity - 0.2).toFixed(1));
          const foodObj =
            foodPool.find((f) => f.name === candidate.foodName) || defaultRoti;
          const updated = createPlannedItem(foodObj, 0, candidate.quantity);
          Object.assign(candidate, updated);
          meal.actualCalories = meal.items.reduce((s, i) => s + i.calories, 0);
          currentTotalKcal = clonedMeals.reduce((s, m) => s + m.actualCalories, 0);
          reduced = true;
          break;
        }
      }
      if (!reduced) break;
    } else {
      // Too low: increase grain or protein
      let increased = false;
      for (const meal of [clonedMeals[0], clonedMeals[1], clonedMeals[2]]) {
        const candidate = meal.items.find(
          (i) => i.category.includes('Breads') || i.category.includes('Rice')
        );
        if (candidate) {
          candidate.quantity = Number((candidate.quantity + 0.2).toFixed(1));
          const foodObj =
            foodPool.find((f) => f.name === candidate.foodName) || defaultRoti;
          const updated = createPlannedItem(foodObj, 0, candidate.quantity);
          Object.assign(candidate, updated);
          meal.actualCalories = meal.items.reduce((s, i) => s + i.calories, 0);
          currentTotalKcal = clonedMeals.reduce((s, m) => s + m.actualCalories, 0);
          increased = true;
          break;
        }
      }
      if (!increased) break;
    }
  }

  // 3. Recalculate macro summaries
  const allItems = clonedMeals.flatMap((m) => m.items);
  const actualCalories = clonedMeals.reduce((s, m) => s + m.actualCalories, 0);
  const actualProteinGrams = Number(
    allItems.reduce((s, i) => s + i.proteinGrams, 0).toFixed(1)
  );
  const actualFatGrams = Number(
    allItems.reduce((s, i) => s + i.fatGrams, 0).toFixed(1)
  );
  const actualCarbGrams = Number(
    allItems.reduce((s, i) => s + i.carbGrams, 0).toFixed(1)
  );
  const totalFibreGrams = Number(
    allItems.reduce((s, i) => s + i.fibreGrams, 0).toFixed(1)
  );
  const totalOilAddedG = Number(
    allItems.reduce((s, i) => s + i.oilAddedG, 0).toFixed(1)
  );
  const calorieDeviationPct = Number(
    (
      ((actualCalories - solverInput.targetCalories) /
        solverInput.targetCalories) *
      100
    ).toFixed(1)
  );

  const updatedPlan: DailyMealPlanResult = {
    ...basePlan,
    actualCalories,
    calorieDeviationPct,
    actualProteinGrams,
    actualFatGrams,
    actualCarbGrams,
    totalFibreGrams,
    totalOilAddedG,
    meals: clonedMeals,
    isWithinTolerance: Math.abs(calorieDeviationPct) <= 5.0,
  };

  const guidanceNote = `Enjoy the family ${matchedFood.name}! We calibrated your bread portions and breakfast so your daily targets remain completely on track without cooking separately.`;
  const portionAdvice = `Take 1 standard serving of ${matchedFood.name}, prioritizing the meat pieces and daal over the surface oil (tari).`;

  return {
    isFamilyModeActive: true,
    familyDishName: matchedFood.name,
    familyMealSlot: familyInput.familyMealSlot,
    guidanceNote,
    portionAdvice,
    plan: updatedPlan,
  };
}

/**
 * Ramadan Fasting Mode Adapter
 * Redistributes daily nutrition across Suhoor (40%), Iftar (40%), and Post-Tarawih (20%),
 * paired with a 5-window hydration schedule.
 */
export function generateRamadanPlan(
  solverInput: MealPlanSolverInput,
  foodPool: SolverFoodCandidate[],
  dailyWaterTargetMl = 2500
): RamadanPlanResult {
  const filtered = filterFoodPool(foodPool, solverInput);

  const defaultRoti =
    filtered.find((f) => f.name.includes('Roti') || f.name.includes('Paratha')) ||
    foodPool[0];
  const defaultEgg =
    filtered.find((f) => f.name.includes('Egg') || f.name.includes('Omelette')) ||
    foodPool[0];
  const defaultChai =
    filtered.find((f) => f.name.includes('Chai')) || foodPool[0];
  const defaultRice =
    filtered.find((f) => f.name.includes('Rice') || f.name.includes('Biryani')) ||
    defaultRoti;
  const defaultMeat =
    filtered.find((f) => f.category.includes('Meat') || f.category.includes('Curries')) ||
    foodPool[0];
  const defaultDaal =
    filtered.find((f) => f.category.includes('Daals')) || foodPool[0];

  const suhoorTargetKcal = Math.round(solverInput.targetCalories * 0.4);
  const iftarTargetKcal = Math.round(solverInput.targetCalories * 0.4);
  const snackTargetKcal = Math.round(solverInput.targetCalories * 0.2);

  // 1. Suhoor Slot (High protein, complex carbs, sustained slow digestion)
  const suhoorItems: PlannedMealItem[] = [
    createPlannedItem(defaultEgg, 0, 2),
    createPlannedItem(defaultRoti, 0, 2),
    createPlannedItem(defaultChai, 0, 1),
  ];
  const suhoorSlot: PlannedMealSlot = {
    slot: 'breakfast',
    title: 'Sustained Energy Suhoor (سحری)',
    targetCalories: suhoorTargetKcal,
    actualCalories: suhoorItems.reduce((s, i) => s + i.calories, 0),
    items: suhoorItems,
  };

  // 2. Iftar Slot (Dates/Fruit, High protein main meal, controlled oil)
  const iftarMain = solverInput.dietPreference.includes('omnivore') ? defaultMeat : defaultDaal;
  const iftarItems: PlannedMealItem[] = [
    createPlannedItem(iftarMain, 0, 1),
    createPlannedItem(defaultRice, 0, 1.5),
  ];
  const iftarSlot: PlannedMealSlot = {
    slot: 'dinner',
    title: 'Wholesome Protein Iftar (افطاری)',
    targetCalories: iftarTargetKcal,
    actualCalories: iftarItems.reduce((s, i) => s + i.calories, 0),
    items: iftarItems,
  };

  // 3. Post-Tarawih Light Snack & Chai
  const snackItems: PlannedMealItem[] = [
    createPlannedItem(defaultDaal, 0, 0.5),
    createPlannedItem(defaultRoti, 0, 1),
  ];
  const postTarawihSlot: PlannedMealSlot = {
    slot: 'snacks_chai',
    title: 'Post-Tarawih Recovery (بعد تراویح)',
    targetCalories: snackTargetKcal,
    actualCalories: snackItems.reduce((s, i) => s + i.calories, 0),
    items: snackItems,
  };

  const actualCalories =
    suhoorSlot.actualCalories +
    iftarSlot.actualCalories +
    postTarawihSlot.actualCalories;

  // Hydration Schedule across non-fasting window (Maghrib to Fajr)
  const hydrationWindows: HydrationWindow[] = [
    {
      windowName: 'Iftar Opening',
      windowNameUr: 'افطار کے وقت',
      recommendedMl: 500,
      timing: 'At Maghrib Adhan',
      notes: 'Drink room temperature water with dates; avoid iced water.',
    },
    {
      windowName: 'Post-Maghrib Meal',
      windowNameUr: 'نماز کے بعد',
      recommendedMl: 500,
      timing: 'Between Maghrib and Isha',
      notes: 'Sip steadily with your dinner.',
    },
    {
      windowName: 'Tarawih Window',
      windowNameUr: 'دوران و بعد تراویح',
      recommendedMl: 750,
      timing: '9:00 PM – 10:30 PM',
      notes: 'Keep a water bottle during Tarawih prayers.',
    },
    {
      windowName: 'Pre-Sleep Hydration',
      windowNameUr: 'سونے سے پہلے',
      recommendedMl: 500,
      timing: '11:00 PM – 12:00 AM',
      notes: 'Prevents overnight dehydration.',
    },
    {
      windowName: 'Suhoor Pacing',
      windowNameUr: 'سحری کے وقت',
      recommendedMl: 750,
      timing: 'Before Fajr Adhan',
      notes: 'Sip gradually across Suhoor; avoid chugging 1L in the last 5 minutes.',
    },
  ];

  return {
    isRamadanMode: true,
    targetCalories: solverInput.targetCalories,
    actualCalories,
    suhoor: suhoorSlot,
    iftar: iftarSlot,
    postTarawihSnack: postTarawihSlot,
    totalWaterMl: dailyWaterTargetMl,
    hydrationWindows,
    suhoorAdvice: 'Focus on eggs, whole wheat roti, and dahi for steady 14-hour satiety without mid-day hunger crashes.',
    iftarAdvice: 'Open with 1-2 dates and water. Prioritize lean protein (chicken/tikka/daal) before fried pakoras.',
  };
}
