import { AssessmentNarrative } from './schema.js';

export interface NarrativeTemplateInput {
  sex: 'male' | 'female';
  ageYears: number;
  weightKg: number;
  bmr: number;
  tdee: number;
  targetKcal: number;
  chaiCupsPerDay: number;
  dailyChaiSugarKcal: number;
  sittingHours: number;
  sleepHours: number;
  shiftPattern: string;
}

/**
 * Deterministic Non-LLM Narrative Generator
 * Guaranteed fallback if model API is unreachable, times out, or fails schema validation.
 * Uses ONLY the numbers verified by nutrition-core.
 */
export function generateFallbackNarrative(
  input: NarrativeTemplateInput
): AssessmentNarrative {
  const {
    weightKg,
    bmr,
    tdee,
    targetKcal,
    chaiCupsPerDay,
    dailyChaiSugarKcal,
    sittingHours,
    sleepHours,
    shiftPattern,
  } = input;

  const weeklyChaiKcal = dailyChaiSugarKcal * 7;
  const deficitKcal = tdee - targetKcal;

  // 1. Summary
  const summary = `Based on your physiological profile and current work routine, your resting body requires ${bmr} kcal/day (BMR), with total daily energy expenditure reaching approximately ${tdee} kcal/day.`;

  // 2. Why this number
  let whyThisNumber = `Your target of ${targetKcal} kcal/day provides a controlled, metabolically safe ${deficitKcal > 0 ? `${deficitKcal} kcal daily deficit` : 'energy balance'}. This preserves your lean muscle mass while remaining strictly above your biological resting floor.`;

  if (deficitKcal <= 0) {
    whyThisNumber = `Your target of ${targetKcal} kcal/day matches your energy expenditure to support metabolic recovery and sustained bodyweight stabilization.`;
  }

  // 3. Three highest leverage changes
  const levers: string[] = [];

  if (chaiCupsPerDay >= 2) {
    levers.push(
      `Moderate Sugar in Tea: Your ${chaiCupsPerDay} daily cups of chai contribute ~${dailyChaiSugarKcal} kcal/day (~${weeklyChaiKcal.toLocaleString()} kcal/week) in liquid sugars. Cutting sugar in half or switching to unrefined/sugar-free saves up to ~${Math.round(weeklyChaiKcal / 2)} kcal weekly without changing food volume.`
    );
  } else {
    levers.push(
      'Protein Distribution: Anchor each meal around quality protein (eggs, chicken, daal, or yogurt) to improve satiety and maintain muscle.'
    );
  }

  if (sittingHours >= 8) {
    levers.push(
      `Break Up Prolonged Sitting: You log ~${sittingHours} hours seated daily. Introducing 5-minute movement breaks or 1,500 post-meal steps substantially improves glucose disposal and non-exercise energy expenditure.`
    );
  } else {
    levers.push(
      'Cooking Fat Awareness: Desi dishes prepared in ghee or heavy cooking oil can double calorie density. Measure cooking oil in tablespoons rather than pouring freely.'
    );
  }

  if (sleepHours < 7) {
    levers.push(
      `Optimize Sleep Recovery: At ~${sleepHours} hours of sleep, elevated cortisol and ghrelin increase evening hunger cravings. Target 7–8 hours of consistent rest.`
    );
  } else {
    levers.push(
      'Hydration Baseline: Maintain consistent water intake throughout the day to support cellular hydration and digestive regularity.'
    );
  }

  // Ensure exactly 3 levers
  const highestLeverageChanges = levers.slice(0, 3);

  // 4. Cultural lifestyle insight
  let culturalLifestyleInsight =
    'Traditional Pakistani home cooking is rich in nutrients and spices, but cooking oils and sweetened beverages are the primary drivers of unlogged calories. Prioritize portion-controlled proteins and vegetables alongside standard roti servings.';

  if (shiftPattern === 'night_shift') {
    culturalLifestyleInsight =
      'Working night shifts alters your circadian metabolic rhythm. Align your main meal before your shift rather than in the early morning hours to minimize digestive fatigue and insulin resistance.';
  }

  // 5. Week-by-week expectation
  const weekByWeekExpectation =
    'In weeks 1–2, expect minor fluctuations as sodium and water weight balance out. In weeks 3–4, steady physical adaptation begins. Our adaptive TDEE will continually refine your targets based on your actual weekly weigh-ins.';

  return {
    summary,
    whyThisNumber,
    highestLeverageChanges,
    culturalLifestyleInsight,
    weekByWeekExpectation,
  };
}
