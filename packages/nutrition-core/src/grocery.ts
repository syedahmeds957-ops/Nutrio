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

// Saudi Market Benchmark Pricing Reference (SAR) - Panda / Tamimi / Lulu / Othaim
const SA_PRICES = {
  FLOUR_BREAD_PER_KG: 5,
  BASMATI_RICE_PER_KG: 12,
  LENTILS_PULSES_PER_KG: 14,
  CHICKEN_PER_KG: 18,
  BEEF_CAMEL_PER_KG: 45,
  MUTTON_LAMB_PER_KG: 75,
  EGG_PER_PIECE: 0.7,
  LABAN_MILK_PER_LITRE: 4.5,
  OIL_PER_LITRE: 18,
  VEGETABLES_PER_KG: 7,
  DATES_PER_KG: 20,
};

const BUDGET_CAPS_PKR: Record<PlanBudgetTier, number> = {
  budget_under_3500: 3500,
  standard_3500_7000: 7000,
  premium_above_7000: 12000,
};

const BUDGET_CAPS_SAR: Record<PlanBudgetTier, number> = {
  budget_under_3500: 125,
  standard_3500_7000: 250,
  premium_above_7000: 450,
};

const CATEGORY_METADATA_PK: Record<
  GroceryCategory,
  { title: string; titleUr: string; titleAr: string }
> = {
  atta_and_grains: { title: 'Atta & Grains', titleUr: 'آٹا اور اناج', titleAr: 'الخبز والمخبوزات' },
  daals_and_pulses: { title: 'Daals & Pulses', titleUr: 'دالیں', titleAr: 'البقوليات' },
  meats_and_poultry: { title: 'Meats & Poultry', titleUr: 'گوشت اور چکن', titleAr: 'اللحوم والدواجن' },
  dairy_and_eggs: { title: 'Dairy & Eggs', titleUr: 'دودھ اور انڈے', titleAr: 'الألبان والبيض' },
  sabzi_and_produce: { title: 'Vegetables & Sabzi', titleUr: 'تازہ سبزیاں', titleAr: 'الخضار والفواكه' },
  oils_and_pantry: { title: 'Cooking Oil & Pantry', titleUr: 'تیل اور مصالحہ جات', titleAr: 'الزيوت والبهارات' },
};

const CATEGORY_METADATA_SA: Record<
  GroceryCategory,
  { title: string; titleUr: string; titleAr: string }
> = {
  atta_and_grains: { title: 'Bread & Grains', titleUr: 'آٹا اور اناج', titleAr: 'الخبز والمخبوزات' },
  daals_and_pulses: { title: 'Grains & Soups', titleUr: 'دالیں اور اناج', titleAr: 'الحبوب والشوربات' },
  meats_and_poultry: { title: 'Fresh Meats & Poultry', titleUr: 'گوشت اور چکن', titleAr: 'اللحوم والدواجن' },
  dairy_and_eggs: { title: 'Laban, Dairy & Eggs', titleUr: 'لبن، دودھ اور انڈے', titleAr: 'اللبن والألبان والبيض' },
  sabzi_and_produce: { title: 'Fresh Produce & Dates', titleUr: 'تازہ سبزیاں اور کھجور', titleAr: 'الخضار الطازجة والتمور' },
  oils_and_pantry: { title: 'Olive Oil & Spices', titleUr: 'زیتون کا تیل اور مصالحے', titleAr: 'زيت الزيتون والبهارات' },
};

export function generateWeeklyGroceryList(
  plans: DailyMealPlanResult[],
  budgetTier: PlanBudgetTier,
  region: 'PK' | 'SA' = 'PK'
): WeeklyGrocerySummary {
  const isSaudi = region === 'SA';
  const categoryMeta = isSaudi ? CATEGORY_METADATA_SA : CATEGORY_METADATA_PK;

  let totalAttaGrams = 0;
  let totalRiceGrams = 0;
  let totalDaalGrams = 0;
  let totalChickenGrams = 0;
  let totalBeefGrams = 0;
  let totalLambGrams = 0;
  let totalEggCount = 0;
  let totalMilkMl = 0;
  let totalSabziGrams = 0;
  let totalDatesGrams = 0;
  let totalOilGrams = 0;

  for (const plan of plans) {
    for (const meal of plan.meals) {
      for (const item of meal.items) {
        const name = item.foodName.toLowerCase();
        const grams = item.totalGrams;

        // 1. Bread / Grains / Flour
        if (
          name.includes('roti') ||
          name.includes('paratha') ||
          name.includes('naan') ||
          name.includes('tamees') ||
          name.includes('khubz') ||
          name.includes('mutabbaq') ||
          name.includes('qursan')
        ) {
          totalAttaGrams += grams * 0.7;
        }
        // 2. Rice
        else if (
          name.includes('rice') ||
          name.includes('chawal') ||
          name.includes('biryani') ||
          name.includes('pulao') ||
          name.includes('kabsa') ||
          name.includes('mandi') ||
          name.includes('madhbi') ||
          name.includes('bukhari') ||
          name.includes('saleeg')
        ) {
          totalRiceGrams += grams * 0.4;
        }
        // 3. Daal / Grains / Jareesh / Harees
        else if (
          name.includes('daal') ||
          name.includes('chana') ||
          name.includes('mash') ||
          name.includes('lobia') ||
          name.includes('jareesh') ||
          name.includes('harees') ||
          name.includes('shorbat') ||
          name.includes('foul')
        ) {
          totalDaalGrams += grams * 0.35;
        }
        // 4. Meats
        else if (name.includes('chicken') || name.includes('tikka') || name.includes('farrouj') || name.includes('tawook')) {
          totalChickenGrams += grams * 0.65;
        } else if (name.includes('lamb') || name.includes('mutton') || name.includes('naeemi')) {
          totalLambGrams += grams * 0.65;
        } else if (
          name.includes('beef') ||
          name.includes('nihari') ||
          name.includes('kebab') ||
          name.includes('hashi') ||
          name.includes('camel')
        ) {
          totalBeefGrams += grams * 0.65;
        }
        // 5. Eggs
        else if (name.includes('egg') || name.includes('anda') || name.includes('omelette') || name.includes('shakshuka')) {
          totalEggCount += Math.max(1, Math.round(item.quantity));
        }
        // 6. Dates
        else if (name.includes('date') || name.includes('sukari') || name.includes('ajwa') || name.includes('khalas')) {
          totalDatesGrams += grams;
        }
        // 7. Sabzi / Vegetables
        else if (
          name.includes('palak') ||
          name.includes('bhindi') ||
          name.includes('gobi') ||
          name.includes('karela') ||
          name.includes('salad') ||
          name.includes('cucumber') ||
          name.includes('tomato')
        ) {
          totalSabziGrams += grams * 0.85;
        }
        // 8. Dairy (Milk / Laban)
        if (
          name.includes('chai') ||
          name.includes('tea') ||
          name.includes('lassi') ||
          name.includes('kheer') ||
          name.includes('laban') ||
          name.includes('milk') ||
          name.includes('halib')
        ) {
          totalMilkMl += grams * 0.65;
        }

        // Cooking oil
        totalOilGrams += item.oilAddedG;
      }
    }
  }

  const groceryItems: GroceryItem[] = [];

  // Atta / Bread
  if (totalAttaGrams > 0) {
    const kg = Number((totalAttaGrams / 1000).toFixed(2));
    const costPKR = Math.round(kg * PK_PRICES.CHAKKI_ATTA_PER_KG);
    const costSAR = Math.round(kg * SA_PRICES.FLOUR_BREAD_PER_KG);
    groceryItems.push({
      id: 'g_atta',
      name: isSaudi ? 'Fresh Khubz / Saudi Wheat Flour' : 'Chakki Whole Wheat Atta',
      nameUr: 'چکی کا آٹا / روٹی',
      nameAr: 'خبز طازج / طحين القمح الفاخر',
      category: 'atta_and_grains',
      quantityAmount: kg,
      unit: 'kg',
      estimatedCostPKR: costPKR,
      estimatedCostSAR: costSAR,
      estimatedCost: isSaudi ? costSAR : costPKR,
      notes: isSaudi ? 'Tamees & Mafrood bread / Whole wheat flour' : 'Whole grain stone-ground atta for chapatis',
    });
  }

  // Basmati Rice
  if (totalRiceGrams > 0) {
    const kg = Number((totalRiceGrams / 1000).toFixed(2));
    const costPKR = Math.round(kg * PK_PRICES.BASMATI_RICE_PER_KG);
    const costSAR = Math.round(kg * SA_PRICES.BASMATI_RICE_PER_KG);
    groceryItems.push({
      id: 'g_rice',
      name: isSaudi ? 'Long Grain Basmati / Maza Rice' : 'Super Basmati Rice',
      nameUr: 'باسمتی چاول',
      nameAr: 'أرز بسمتي / مزة هندي فاخر',
      category: 'atta_and_grains',
      quantityAmount: kg,
      unit: 'kg',
      estimatedCostPKR: costPKR,
      estimatedCostSAR: costSAR,
      estimatedCost: isSaudi ? costSAR : costPKR,
      notes: isSaudi ? 'Ideal for authentic Saudi Kabsa and Mandi' : undefined,
    });
  }

  // Daals / Jareesh / Grains
  if (totalDaalGrams > 0) {
    const kg = Number((totalDaalGrams / 1000).toFixed(2));
    const costPKR = Math.round(kg * PK_PRICES.DAALS_PER_KG);
    const costSAR = Math.round(kg * SA_PRICES.LENTILS_PULSES_PER_KG);
    groceryItems.push({
      id: 'g_daal',
      name: isSaudi ? 'Najdi Crushed Wheat (Jareesh) & Lentils' : 'Mixed Lentils (Chana, Masoor, Moong)',
      nameUr: 'مکس دالیں اور گریش',
      nameAr: 'حبوب الجريش النجدية والعدس',
      category: 'daals_and_pulses',
      quantityAmount: kg,
      unit: 'kg',
      estimatedCostPKR: costPKR,
      estimatedCostSAR: costSAR,
      estimatedCost: isSaudi ? costSAR : costPKR,
    });
  }

  // Chicken
  if (totalChickenGrams > 0) {
    const kg = Number((totalChickenGrams / 1000).toFixed(2));
    const costPKR = Math.round(kg * PK_PRICES.CHICKEN_PER_KG);
    const costSAR = Math.round(kg * SA_PRICES.CHICKEN_PER_KG);
    groceryItems.push({
      id: 'g_chicken',
      name: isSaudi ? 'Fresh Chilled Chicken (Al-Watania / Tanmiah)' : 'Fresh Broiler Chicken (Cleaned Cut)',
      nameUr: 'صاف شدہ چکن',
      nameAr: 'دجاج وطني طازج مبرد (الوطنية / التنمية)',
      category: 'meats_and_poultry',
      quantityAmount: kg,
      unit: 'kg',
      estimatedCostPKR: costPKR,
      estimatedCostSAR: costSAR,
      estimatedCost: isSaudi ? costSAR : costPKR,
    });
  }

  // Beef / Camel (Hashi)
  if (totalBeefGrams > 0) {
    const kg = Number((totalBeefGrams / 1000).toFixed(2));
    const costPKR = Math.round(kg * PK_PRICES.BEEF_PER_KG);
    const costSAR = Math.round(kg * SA_PRICES.BEEF_CAMEL_PER_KG);
    groceryItems.push({
      id: 'g_beef',
      name: isSaudi ? 'Local Hashi (Camel) & Lean Beef' : 'Lean Beef (Boti / Mince)',
      nameUr: 'بیف گوشت / قیمہ',
      nameAr: 'لحم حاشي بلدي طازج / بقر',
      category: 'meats_and_poultry',
      quantityAmount: kg,
      unit: 'kg',
      estimatedCostPKR: costPKR,
      estimatedCostSAR: costSAR,
      estimatedCost: isSaudi ? costSAR : costPKR,
    });
  }

  // Lamb (Naeemi)
  if (totalLambGrams > 0) {
    const kg = Number((totalLambGrams / 1000).toFixed(2));
    const costPKR = Math.round(kg * PK_PRICES.MUTTON_PER_KG);
    const costSAR = Math.round(kg * SA_PRICES.MUTTON_LAMB_PER_KG);
    groceryItems.push({
      id: 'g_lamb',
      name: isSaudi ? 'Naeemi Lamb Meat' : 'Mutton Meat',
      nameUr: 'مٹن گوشت',
      nameAr: 'لحم خروف نعيمي طازج',
      category: 'meats_and_poultry',
      quantityAmount: kg,
      unit: 'kg',
      estimatedCostPKR: costPKR,
      estimatedCostSAR: costSAR,
      estimatedCost: isSaudi ? costSAR : costPKR,
    });
  }

  // Eggs
  if (totalEggCount > 0) {
    const costPKR = Math.round(totalEggCount * PK_PRICES.EGG_PER_PIECE);
    const costSAR = Math.round(totalEggCount * SA_PRICES.EGG_PER_PIECE);
    groceryItems.push({
      id: 'g_eggs',
      name: isSaudi ? 'Fresh Table Eggs' : 'Farm Fresh Eggs',
      nameUr: 'فارمی انڈے',
      nameAr: 'طبق بيض طازج',
      category: 'dairy_and_eggs',
      quantityAmount: totalEggCount,
      unit: 'pieces',
      estimatedCostPKR: costPKR,
      estimatedCostSAR: costSAR,
      estimatedCost: isSaudi ? costSAR : costPKR,
      notes: `${(totalEggCount / 12).toFixed(1)} dozen`,
    });
  }

  // Milk / Laban
  if (totalMilkMl > 0 || isSaudi) {
    const litres = Number((Math.max(1000, totalMilkMl) / 1000).toFixed(2));
    const costPKR = Math.round(litres * PK_PRICES.MILK_PER_LITRE);
    const costSAR = Math.round(litres * SA_PRICES.LABAN_MILK_PER_LITRE);
    groceryItems.push({
      id: 'g_milk',
      name: isSaudi ? 'Almarai Fresh Laban & Milk' : 'Fresh Dairy Milk',
      nameUr: 'تازہ دودھ / لبن',
      nameAr: 'لبن المراعي طازج وحليب',
      category: 'dairy_and_eggs',
      quantityAmount: litres,
      unit: 'litres',
      estimatedCostPKR: costPKR,
      estimatedCostSAR: costSAR,
      estimatedCost: isSaudi ? costSAR : costPKR,
      notes: isSaudi ? 'Probiotic staple with zero added sugars' : undefined,
    });
  }

  // Dates
  if (totalDatesGrams > 0 || isSaudi) {
    const kg = Number((Math.max(500, totalDatesGrams) / 1000).toFixed(2));
    const costSAR = Math.round(kg * SA_PRICES.DATES_PER_KG);
    groceryItems.push({
      id: 'g_dates',
      name: isSaudi ? 'Saudi Sukari / Ajwa Dates' : 'Dates',
      nameUr: 'کھجور',
      nameAr: 'تمر سكري / عجوة المدينة',
      category: 'sabzi_and_produce',
      quantityAmount: kg,
      unit: 'kg',
      estimatedCostPKR: Math.round(kg * 800),
      estimatedCostSAR: costSAR,
      estimatedCost: isSaudi ? costSAR : Math.round(kg * 800),
      notes: 'Natural sweetener for daily coffee ritual',
    });
  }

  // Vegetables
  if (totalSabziGrams > 0) {
    const kg = Number((totalSabziGrams / 1000).toFixed(2));
    const costPKR = Math.round(kg * PK_PRICES.SABZI_PER_KG);
    const costSAR = Math.round(kg * SA_PRICES.VEGETABLES_PER_KG);
    groceryItems.push({
      id: 'g_sabzi',
      name: isSaudi ? 'Tomatoes, Cucumbers, Onions & Lime' : 'Seasonal Sabzi, Onions & Tomatoes',
      nameUr: 'تازہ سبزیاں، پیاز اور ٹماتر',
      nameAr: 'طماطم، خيار، بصل وليمون للسلطة',
      category: 'sabzi_and_produce',
      quantityAmount: kg,
      unit: 'kg',
      estimatedCostPKR: costPKR,
      estimatedCostSAR: costSAR,
      estimatedCost: isSaudi ? costSAR : costPKR,
    });
  }

  // Cooking Oil / Olive Oil
  if (totalOilGrams > 0) {
    const litres = Number((totalOilGrams / 910).toFixed(2));
    const costPKR = Math.round(litres * PK_PRICES.OIL_PER_LITRE);
    const costSAR = Math.round(litres * SA_PRICES.OIL_PER_LITRE);
    groceryItems.push({
      id: 'g_oil',
      name: isSaudi ? 'Extra Virgin Olive Oil / Corn Oil' : 'Cooking Oil / Ghee',
      nameUr: 'کوکنگ آئل / گھی',
      nameAr: 'زيت زيتون بكر ممتاز / زيت ذرة',
      category: 'oils_and_pantry',
      quantityAmount: litres,
      unit: 'litres',
      estimatedCostPKR: costPKR,
      estimatedCostSAR: costSAR,
      estimatedCost: isSaudi ? costSAR : costPKR,
      notes: isSaudi ? 'Heart-healthy fats for salads and cooking' : 'Based on tracked cooking oil across recipes',
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
      const subtotalSAR = catItems.reduce((s, i) => s + (i.estimatedCostSAR || 0), 0);
      categories.push({
        category: catKey,
        title: categoryMeta[catKey].title,
        titleUr: categoryMeta[catKey].titleUr,
        titleAr: categoryMeta[catKey].titleAr,
        items: catItems,
        subtotalPKR,
        subtotalSAR,
        subtotal: isSaudi ? subtotalSAR : subtotalPKR,
      });
    }
  }

  const estimatedTotalCostPKR = categories.reduce((sum, c) => sum + c.subtotalPKR, 0);
  const estimatedTotalCostSAR = categories.reduce((sum, c) => sum + (c.subtotalSAR || 0), 0);
  const maxBudgetPKR = BUDGET_CAPS_PKR[budgetTier];
  const maxBudgetSAR = BUDGET_CAPS_SAR[budgetTier];

  const estimatedTotalCost = isSaudi ? estimatedTotalCostSAR : estimatedTotalCostPKR;
  const maxBudget = isSaudi ? maxBudgetSAR : maxBudgetPKR;
  const isWithinBudget = estimatedTotalCost <= maxBudget;
  const budgetDifference = maxBudget - estimatedTotalCost;

  let budgetOptimizationTip: string | undefined;
  if (isSaudi) {
    if (!isWithinBudget) {
      budgetOptimizationTip = `يتجاوز الميزانية التقديرية بمقدار ${Math.abs(budgetDifference)} ر.س. نصيحة: استبدال وجبات اللحم النعيمي بدجاج التنمية الطازج يوفر ~40 ر.س أسبوعياً.`;
    } else {
      budgetOptimizationTip = `التزام ممتاز! وفرت ${budgetDifference} ر.س ضمن سقف ميزانيتك الأسبوعي للتموين.`;
    }
  } else {
    if (!isWithinBudget) {
      budgetOptimizationTip = `Exceeds budget by ${Math.abs(budgetDifference)} PKR. Tip: Swapping 2 chicken curries with daal chana or boiled eggs saves ~450 PKR/week.`;
    } else if (budgetDifference > 1000) {
      budgetOptimizationTip = `Excellent adherence! You are saving ${budgetDifference} PKR under your weekly budget ceiling.`;
    }
  }

  return {
    weekDaysCount: plans.length,
    budgetTier,
    currency: isSaudi ? 'SAR' : 'PKR',
    currencySymbol: isSaudi ? 'ر.س' : 'Rs.',
    maxBudgetPKR,
    maxBudgetSAR,
    maxBudget,
    estimatedTotalCostPKR,
    estimatedTotalCostSAR,
    estimatedTotalCost,
    isWithinBudget,
    budgetDifferencePKR: maxBudgetPKR - estimatedTotalCostPKR,
    budgetDifferenceSAR: maxBudgetSAR - estimatedTotalCostSAR,
    budgetDifference,
    categories,
    budgetOptimizationTip,
  };
}
