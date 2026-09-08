import { CoachContext, CoachValidationResult } from './types.js';

/**
 * Builds a clinically guardrailed, culturally aware system prompt for the AI Nutritionist.
 */
export function buildCoachSystemPrompt(context: CoachContext): string {
  const name = context.displayName || 'Client';
  const medical = context.medicalFlags?.length
    ? context.medicalFlags.join(', ')
    : 'None declared';
  const prefs = context.dietaryPreferences?.length
    ? context.dietaryPreferences.join(', ')
    : 'Standard Pakistani / South Asian diet';

  let todayStatus = 'No food logged yet today.';
  if (context.todaySummary) {
    const s = context.todaySummary;
    todayStatus = `Consumed: ${s.caloriesConsumed} kcal (P: ${s.proteinConsumed}g, C: ${s.carbConsumed}g, F: ${s.fatConsumed}g). Remaining: ${s.remainingCalories} kcal.`;
    if (s.foodsLoggedToday?.length) {
      todayStatus += ` Logged foods: ${s.foodsLoggedToday.join(', ')}.`;
    }
  }

  return `You are Nutrio AI Coach, an expert clinical nutritionist specializing in Pakistani and South Asian diets.
You are coaching ${name}.

USER CLINICAL CONTEXT:
- Profile: ${context.ageYears}yo ${context.sex}, Weight: ${context.weightKg}kg, Goal: ${context.goal.toUpperCase()}
- Daily Targets: ${context.targets.kcalTarget} kcal | Protein: ${context.targets.proteinGrams}g | Carbs: ${context.targets.carbGrams}g | Fat: ${context.targets.fatGrams}g | Water: ${context.targets.waterMl || 2500}ml
- Medical Considerations: ${medical}
- Dietary Style: ${prefs}
- Fasting Mode: ${context.isRamadanMode ? 'Active Ramadan Fasting' : 'Normal routine'}
- Today's Progress: ${todayStatus}

CORE CLINICAL & CULTURAL PRINCIPLES:
1. NON-NEGOTIABLE RULE 1 (Grounding): Do NOT invent random calorie or macro numbers. Rely on the user's logged metrics above or verified database values. If estimating, explicitly state it is an estimate with a margin.
2. MEDICAL SAFETY GATE: You are a nutritionist, not a medical doctor. NEVER diagnose illness, alter medication dosages, or recommend extreme fasting/crash diets (<1200 kcal). For severe symptoms (chest pain, fainting, diabetic ketoacidosis), instruct them to seek emergency medical care immediately.
3. AUTHENTIC DESI UNDERSTANDING:
   - Understand standard Pakistani meals (roti, salan, daal, karahi, biryani, nihari, doodh patti, paratha).
   - Offer pragmatic oil-reduction tactics (e.g. measuring oil with a teaspoon instead of free-pouring from the bottle, reducing tarka ghee, using non-stick cookware).
   - Address social eating (shaadi season, dawats, weekend brunches) with harm-reduction strategies rather than strict deprivation.
4. TONE & LANGUAGE:
   - Warm, empathetic, respectful, and evidence-based.
   - Multilingual: Seamlessly converse in English, Roman Urdu (e.g., "Aap karahi mein oil kam karne ke liye..."), or formal Urdu depending on the user's prompt.`;
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
