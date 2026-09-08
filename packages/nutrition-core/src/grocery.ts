import {
  DailyMealPlanResult,
  GroceryCategory,
  GroceryCategoryGroup,
  GroceryItem,
  PlanBudgetTier,
  WeeklyGrocerySummary,
} from './types.js';

// Pakistani Market Benchmark Pricing Reference (PKR)
const PK_PRICES = {
  CHAKKI_ATTA_PER_KG: 140,
  BASMATI_RICE_PER_KG: 320,
  DAALS_PER_KG: 340,
  CHICKEN_PER_KG: 650,
  BEEF_PER_KG: 1100,
  MUTTON_PER_KG: 2200,
  EGG_PER_PIECE: 27,
  MILK_PER_LITRE: 220,
  OIL_PER_LITRE: 520,
  SABZI_PER_KG: 150,
};

const BUDGET_CAPS_PKR: Record<PlanBudgetTier, number> = {
  budget_under_3500: 3500,
  standard_3500_7000: 7000,
  premium_above_7000: 12000,
};

const CATEGORY_METADATA: Record<
  GroceryCategory,
  { title: string; titleUr: string }
> = {
  atta_and_grains: { title: 'Atta & Grains', titleUr: 'آٹا اور اناج' },
  daals_and_pulses: { title: 'Daals & Pulses', titleUr: 'دالیں' },
  meats_and_poultry: { title: 'Meats & Poultry', titleUr: 'گوشت اور چکن' },
  dairy_and_eggs: { title: 'Dairy & Eggs', titleUr: 'دودھ اور انڈے' },
  sabzi_and_produce: { title: 'Vegetables & Sabzi', titleUr: 'تازہ سبزیاں' },
  oils_and_pantry: { title: 'Cooking Oil & Pantry', titleUr: 'تیل اور مصالحہ جات' },
};

export function generateWeeklyGroceryList(
  plans: DailyMealPlanResult[],
  budgetTier: PlanBudgetTier
): WeeklyGrocerySummary {


  let totalAttaGrams = 0;
  let totalRiceGrams = 0;
  let totalDaalGrams = 0;
  let totalChickenGrams = 0;
  let totalBeefGrams = 0;
  let totalEggCount = 0;
  let totalMilkMl = 0;
  let totalSabziGrams = 0;
  let totalOilGrams = 0;

  for (const plan of plans) {
    for (const meal of plan.meals) {
      for (const item of meal.items) {
        const name = item.foodName.toLowerCase();
        const grams = item.totalGrams;

        // 1. Atta (Roti, Paratha, Naan) -> 70% raw atta
        if (name.includes('roti') || name.includes('paratha') || name.includes('naan')) {
          totalAttaGrams += grams * 0.7;
        }
        // 2. Rice -> 40% raw basmati rice
        else if (name.includes('rice') || name.includes('chawal') || name.includes('biryani') || name.includes('pulao')) {
          totalRiceGrams += grams * 0.4;
        }
        // 3. Daal -> 35% raw dry pulse
        else if (name.includes('daal') || name.includes('chana') || name.includes('mash') || name.includes('lobia')) {
          totalDaalGrams += grams * 0.35;
        }
        // 4. Meats
        else if (name.includes('chicken') || name.includes('tikka')) {
          totalChickenGrams += grams * 0.65;
        } else if (name.includes('beef') || name.includes('nihari') || name.includes('kebab')) {
          totalBeefGrams += grams * 0.65;
        }
        // 5. Eggs
        else if (name.includes('egg') || name.includes('anda') || name.includes('omelette')) {
          totalEggCount += Math.max(1, Math.round(item.quantity));
        }
        // 6. Sabzi / Vegetables
        else if (name.includes('palak') || name.includes('bhindi') || name.includes('gobi') || name.includes('karela')) {
          totalSabziGrams += grams * 0.85;
        }
        // 7. Dairy
        if (name.includes('chai') || name.includes('tea') || name.includes('lassi') || name.includes('kheer')) {
          totalMilkMl += grams * 0.65;
        }

        // Cooking oil aggregated directly from food-db oil tracking
        totalOilGrams += item.oilAddedG;
      }
    }
  }

  const groceryItems: GroceryItem[] = [];

  // Atta
  if (totalAttaGrams > 0) {
    const kg = Number((totalAttaGrams / 1000).toFixed(2));
    groceryItems.push({
      id: 'g_atta',
      name: 'Chakki Whole Wheat Atta',
      nameUr: 'چکی کا آٹا',
      category: 'atta_and_grains',
      quantityAmount: kg,
      unit: 'kg',
      estimatedCostPKR: Math.round(kg * PK_PRICES.CHAKKI_ATTA_PER_KG),
      notes: 'Whole grain stone-ground atta for chapatis',
    });
  }

  // Basmati Rice
  if (totalRiceGrams > 0) {
    const kg = Number((totalRiceGrams / 1000).toFixed(2));
    groceryItems.push({
      id: 'g_rice',
      name: 'Super Basmati Rice',
      nameUr: 'باسمتی چاول',
      category: 'atta_and_grains',
      quantityAmount: kg,
      unit: 'kg',
      estimatedCostPKR: Math.round(kg * PK_PRICES.BASMATI_RICE_PER_KG),
    });
  }

  // Daals
  if (totalDaalGrams > 0) {
    const kg = Number((totalDaalGrams / 1000).toFixed(2));
    groceryItems.push({
      id: 'g_daal',
      name: 'Mixed Lentils (Chana, Masoor, Moong)',
      nameUr: 'مکس دالیں',
      category: 'daals_and_pulses',
      quantityAmount: kg,
      unit: 'kg',
      estimatedCostPKR: Math.round(kg * PK_PRICES.DAALS_PER_KG),
    });
  }

  // Chicken
  if (totalChickenGrams > 0) {
    const kg = Number((totalChickenGrams / 1000).toFixed(2));
    groceryItems.push({
      id: 'g_chicken',
      name: 'Fresh Broiler Chicken (Cleaned Cut)',
      nameUr: 'صاف شدہ چکن',
      category: 'meats_and_poultry',
      quantityAmount: kg,
      unit: 'kg',
      estimatedCostPKR: Math.round(kg * PK_PRICES.CHICKEN_PER_KG),
    });
  }

  // Beef
  if (totalBeefGrams > 0) {
    const kg = Number((totalBeefGrams / 1000).toFixed(2));
    groceryItems.push({
      id: 'g_beef',
      name: 'Lean Beef (Boti / Mince)',
      nameUr: 'بیف گوشت / قیمہ',
      category: 'meats_and_poultry',
      quantityAmount: kg,
      unit: 'kg',
      estimatedCostPKR: Math.round(kg * PK_PRICES.BEEF_PER_KG),
    });
  }

  // Eggs
  if (totalEggCount > 0) {
    groceryItems.push({
      id: 'g_eggs',
      name: 'Farm Fresh Eggs',
      nameUr: 'فارمی انڈے',
      category: 'dairy_and_eggs',
      quantityAmount: totalEggCount,
      unit: 'pieces',
      estimatedCostPKR: Math.round(totalEggCount * PK_PRICES.EGG_PER_PIECE),
      notes: `${(totalEggCount / 12).toFixed(1)} dozen`,
    });
  }

  // Milk
  if (totalMilkMl > 0) {
    const litres = Number((totalMilkMl / 1000).toFixed(2));
    groceryItems.push({
      id: 'g_milk',
      name: 'Fresh Dairy Milk',
      nameUr: 'تازہ دودھ',
      category: 'dairy_and_eggs',
      quantityAmount: litres,
      unit: 'litres',
      estimatedCostPKR: Math.round(litres * PK_PRICES.MILK_PER_LITRE),
    });
  }

  // Sabzi
  if (totalSabziGrams > 0) {
    const kg = Number((totalSabziGrams / 1000).toFixed(2));
    groceryItems.push({
      id: 'g_sabzi',
      name: 'Seasonal Sabzi, Onions & Tomatoes',
      nameUr: 'تازہ سبزیاں، پیاز اور ٹماٹر',
      category: 'sabzi_and_produce',
      quantityAmount: kg,
      unit: 'kg',
      estimatedCostPKR: Math.round(kg * PK_PRICES.SABZI_PER_KG),
    });
  }

  // Cooking Oil
  if (totalOilGrams > 0) {
    const litres = Number((totalOilGrams / 910).toFixed(2));
    groceryItems.push({
      id: 'g_oil',
      name: 'Cooking Oil / Ghee',
      nameUr: 'کوکنگ آئل / گھی',
      category: 'oils_and_pantry',
      quantityAmount: litres,
      unit: 'litres',
      estimatedCostPKR: Math.round(litres * PK_PRICES.OIL_PER_LITRE),
      notes: 'Based on tracked cooking oil across recipes',
    });
  }

  // Group items by category
  const categories: GroceryCategoryGroup[] = [];
  const allCategoryKeys: GroceryCategory[] = [
    'atta_and_grains',
    'daals_and_pulses',
    'meats_and_poultry',
    'dairy_and_eggs',
    'sabzi_and_produce',
    'oils_and_pantry',
  ];

  for (const catKey of allCategoryKeys) {
    const catItems = groceryItems.filter((i) => i.category === catKey);
    if (catItems.length > 0) {
      const subtotalPKR = catItems.reduce((s, i) => s + i.estimatedCostPKR, 0);
      categories.push({
        category: catKey,
        title: CATEGORY_METADATA[catKey].title,
        titleUr: CATEGORY_METADATA[catKey].titleUr,
        items: catItems,
        subtotalPKR,
      });
    }
  }

  const estimatedTotalCostPKR = categories.reduce(
    (sum, c) => sum + c.subtotalPKR,
    0
  );
  const maxBudgetPKR = BUDGET_CAPS_PKR[budgetTier];
  const isWithinBudget = estimatedTotalCostPKR <= maxBudgetPKR;
  const budgetDifferencePKR = maxBudgetPKR - estimatedTotalCostPKR;

  let budgetOptimizationTip: string | undefined;
  if (!isWithinBudget) {
    budgetOptimizationTip = `Exceeds budget by ${Math.abs(budgetDifferencePKR)} PKR. Tip: Swapping 2 chicken curries with daal chana or boiled eggs saves ~450 PKR/week.`;
  } else if (budgetDifferencePKR > 1000) {
    budgetOptimizationTip = `Excellent adherence! You are saving ${budgetDifferencePKR} PKR under your weekly budget ceiling.`;
  }

  return {
    weekDaysCount: plans.length,
    budgetTier,
    maxBudgetPKR,
    estimatedTotalCostPKR,
    isWithinBudget,
    budgetDifferencePKR,
    categories,
    budgetOptimizationTip,
  };
}
