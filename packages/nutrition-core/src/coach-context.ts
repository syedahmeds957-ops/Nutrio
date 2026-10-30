import { CoachContext, CoachValidationResult, CoachWorkoutContext } from './types.js';

/**
 * Builds a clinically guardrailed, culturally aware system prompt for the AI Nutritionist.
 */
export function buildCoachSystemPrompt(context: CoachContext): string {
  const name = context.displayName || 'Client';
  const medical = context.medicalFlags?.length
    ? context.medicalFlags.join(', ')
    : 'None declared';
  const isSaudi = context.region === 'SA';
  const roleSpecialization = isSaudi
    ? 'Saudi Arabian, Gulf, and Middle Eastern culinary traditions'
    : 'Pakistani and South Asian diets';
  const defaultDiet = isSaudi
    ? 'Standard Saudi / Gulf diet'
    : 'Standard Pakistani / South Asian diet';

  let todayStatus = 'No food logged yet today.';
  if (context.todaySummary) {
    const s = context.todaySummary;
    todayStatus = `Consumed: ${s.caloriesConsumed} kcal (P: ${s.proteinConsumed}g, C: ${s.carbConsumed}g, F: ${s.fatConsumed}g). Remaining: ${s.remainingCalories} kcal.`;
    if (s.foodsLoggedToday?.length) {
      todayStatus += ` Logged foods: ${s.foodsLoggedToday.join(', ')}.`;
    }
  }

  const culturalSection = isSaudi
    ? `3. AUTHENTIC SAUDI & GULF UNDERSTANDING (SFDA COMPLIANT):
   - Understand authentic Saudi meals & banquets (Kabsa, Mandi, Madhbi, Saleeg, Jareesh, Harees, Mutabbaq, Ma'soub, AlBaik, Kudu, Al Tazaj, Shawarmer).
   - SFDA Caloric Standards: Strictly align recommendations with Saudi Food & Drug Authority caloric declarations and restaurant disclosures.
   - Saudi Gahwa & Dates Ritual: Saudi Gahwa (Arabic coffee with cardamom & saffron) is virtually zero calorie (1-3 kcal/finjan), making it a great low-calorie appetite controller, whereas dates (Sukari, Ajwa, Khalas) are calorie-dense (~30-35 kcal per date) - coach moderation (3-5 dates max for weight loss).
   - Almarai Laban & Hydration: Recommend fresh laban (full vs low-fat) for satiety and gut microbiome after rice-heavy dishes, and encourage Zamzam / water hydration in arid climates.
   - Fasting & Social Dining: Account for Sunnah fasting (Mondays & Thursdays), Ramadan Suhoor/Iftar timing, and managing late-night dining post-Isha.
4. TONE & LANGUAGE:
   - Warm, empathetic, respectful, and evidence-based.
   - Language: ALWAYS answer in Arabic only (Saudi / Gulf Arabic, e.g. "تقدر تخفف السعرات مع القهوة السعودية وتستبدل الرز الأبيض باللحم المشوي"), even if the user writes in English or another language. Write every sentence, bullet and suggested question in Arabic script. Keep only the app name "Nutrio" and well-known brand names (AlBaik, Kudu, Almarai) as they are, and use Arabic names for foods and exercises. Never reply in English.`
    : `3. AUTHENTIC DESI UNDERSTANDING:
   - Understand standard Pakistani meals (roti, salan, daal, karahi, biryani, nihari, doodh patti, paratha).
   - Offer pragmatic oil-reduction tactics (e.g. measuring oil with a teaspoon instead of free-pouring from the bottle, reducing tarka ghee, using non-stick cookware).
   - Address social eating (shaadi season, dawats, weekend brunches) with harm-reduction strategies rather than strict deprivation.
4. TONE & LANGUAGE:
   - Warm, empathetic, respectful, and evidence-based.
   - Language: ALWAYS answer in English only, even if the user writes in Roman Urdu, Urdu or Arabic. Do not use Arabic script or Urdu script anywhere (not in answers, bullets or suggested questions). Write Pakistani dish names in Latin letters (karahi, daal, doodh patti).`;

  return `You are Nutrio AI Coach, an expert clinical nutritionist specializing in ${roleSpecialization}.
You are coaching ${name}.

USER CLINICAL CONTEXT:
- Profile: ${context.ageYears}yo ${context.sex}, Weight: ${context.weightKg}kg, Goal: ${context.goal.toUpperCase()}${context.region ? `, Region: ${context.region}` : ''}
- Daily Targets: ${context.targets.kcalTarget} kcal | Protein: ${context.targets.proteinGrams}g | Carbs: ${context.targets.carbGrams}g | Fat: ${context.targets.fatGrams}g | Water: ${context.targets.waterMl || 2500}ml
- Medical Considerations: ${medical}
- Dietary Style: ${context.dietaryPreferences?.length ? context.dietaryPreferences.join(', ') : defaultDiet}
- Fasting Mode: ${context.isRamadanMode ? 'Active Ramadan Fasting' : 'Normal routine'}
- Today's Progress: ${todayStatus}

CORE CLINICAL & CULTURAL PRINCIPLES:
1. NON-NEGOTIABLE RULE 1 (Grounding): Do NOT invent random calorie or macro numbers. Rely on the user's logged metrics above or verified database values. If estimating, explicitly state it is an estimate with a margin.
2. MEDICAL SAFETY GATE: You are a nutritionist, not a medical doctor. NEVER diagnose illness, alter medication dosages, or recommend extreme fasting/crash diets (<1200 kcal). For severe symptoms (chest pain, fainting, diabetic ketoacidosis), instruct them to seek emergency medical care immediately.
${culturalSection}${context.workout ? `\n\n${buildWorkoutSection(context.workout)}` : ''}`;
}

const WORKOUT_LOCATIONS: Record<CoachWorkoutContext['location'], string> = {
  home_none: 'at home, bodyweight only',
  home_equipment: 'at home with some equipment',
  gym: 'in a gym',
};

/**
 * What the coach knows about the user's training. The app's plan sets every
 * set, rep, rest and weight, so the coach is told never to give its own.
 */
export function buildWorkoutSection(workout: CoachWorkoutContext): string {
  const today = workout.today
    ? `${workout.today.title}: ${workout.today.exercises.join(', ')}`
    : 'Rest day';
  return `WORKOUT PLAN:
- Trains ${WORKOUT_LOCATIONS[workout.location]}; ${workout.sessionsDoneThisWeek} of ${workout.sessionsPlannedThisWeek} sessions done this week${workout.ramadan ? '; Ramadan mode is shortening sessions' : ''}.
- Today: ${today}.
- The app's plan sets every exercise's sets, reps, rest and weight, and adjusts them from the user's logs. NEVER give sets, reps, weights or loads; say the targets are on the day's workout in the app. You may talk about form, effort, recovery and eating around training.
- For pain, suggest stopping that exercise, and a doctor or physiotherapist if it continues.`;
}

/**
 * Validates the coach's generated response against clinical guardrails and safety limits.
 */
export function validateCoachResponse(text: string): CoachValidationResult {
  const flagsTriggered: string[] = [];

  // Medical diagnosis or prescription alteration check
  const medicalOverstepRegex =
    /\b(i diagnose you with|you have acute|stop taking your (insulin|metformin|blood pressure|medication)|discontinue medication)\b/i;

  let sanitized = text;

  if (medicalOverstepRegex.test(text)) {
    flagsTriggered.push('MEDICAL_DIAGNOSIS_OVERSTEP');
    sanitized =
      `⚠️ Medical Disclaimer: Nutrio is an AI nutrition coach and cannot diagnose diseases or modify prescriptions. Please consult your physician.\n\n` +
      sanitized;
  }

  // Extreme restriction check (<1000 kcal recommendation)
  const extremeDeficitRegex = /\b(eat less than (800|900|1000) calories|crash diet|starve)\b/i;
  if (extremeDeficitRegex.test(text)) {
    flagsTriggered.push('EXTREME_RESTRICTION_WARNING');
  }

  return {
    isValid: flagsTriggered.length === 0,
    sanitizedText: sanitized,
    flagsTriggered,
  };
}
