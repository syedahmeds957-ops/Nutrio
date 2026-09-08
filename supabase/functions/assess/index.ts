import {
  calculateBMR,
  calculateTDEE,
  calculateCalorieTarget,
  calculateMacros,
  validateClinicalSafety,
} from '@nutrio/nutrition-core';
import { requestAssessmentNarrative } from './groq-client.js';
import { AssessmentResponse } from '../_shared/schema.js';

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

export async function handleAssessmentRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: CORS_HEADERS,
    });
  }

  try {
    const survey = await req.json();

    if (!survey || !survey.basics || !survey.occupational || !survey.exercise) {
      return new Response(
        JSON.stringify({ error: 'Invalid survey payload: missing required sections.' }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const { basics, occupational, exercise, lifestyleDesi, healthClinical, preferencesBudget } =
      survey;

    // 1. Calculate BMR (Mifflin-St Jeor)
    const bmrResult = calculateBMR({
      weightKg: basics.weightKg,
      heightCm: basics.heightCm,
      ageYears: basics.ageYears,
      sex: basics.sex,
      bodyFatPct: basics.bodyFatPct,
    });

    // 2. Calculate TDEE with occupational split
    const occupationalFactorMap: Record<string, number> = {
      desk_sedentary: 1.2,
      standing_light: 1.35,
      active_walking: 1.5,
      heavy_manual_labor: 1.75,
    };
    const occupationalFactor =
      occupationalFactorMap[occupational.jobCategory] ?? 1.2;

    const weeklyExerciseKcal =
      exercise.trainingType !== 'none'
        ? (exercise.sessionDurationMins ?? 45) * 6.5 * (exercise.frequencyDaysPerWeek ?? 3)
        : 0;

    const tdeeResult = calculateTDEE({
      bmr: bmrResult.selectedBMR,
      activityLevel: 'moderate',
      occupationalFactor,
      weeklyExerciseKcal,
    });

    // 3. Clinical Safety Floors
    const clinicalCheck = validateClinicalSafety(
      basics.weightKg,
      basics.heightCm,
      basics.ageYears,
      'lose',
      healthClinical?.isPregnantOrBreastfeeding
    );

    // 4. Calorie Target (moderate fat loss default)
    const targetResult = calculateCalorieTarget({
      weightKg: basics.weightKg,
      heightCm: basics.heightCm,
      ageYears: basics.ageYears,
      sex: basics.sex,
      bmr: bmrResult.selectedBMR,
      tdee: tdeeResult.tdee,
      goal: 'lose',
      isPregnantOrBreastfeeding: healthClinical?.isPregnantOrBreastfeeding,
      medicalConditions: healthClinical?.medicalConditions,
    });

    // 5. Macro Distribution
    const macros = calculateMacros({
      kcalTarget: targetResult.kcalTarget,
      weightKg: basics.weightKg,
      goal: 'lose',
      bodyFatPct: basics.bodyFatPct,
    });

    // 6. Cultural Metrics (Pakistani chai sugar lever)
    const chaiCups = lifestyleDesi?.chaiWithSugarCupsPerDay ?? 0;
    const dailyChaiSugarKcal = chaiCups * 65;
    const weeklyChaiSugarKcal = dailyChaiSugarKcal * 7;

    // 7. Generate Narrative (Groq LLM or deterministic fallback)
    const apiKey =
      (typeof Deno !== 'undefined' ? Deno.env.get('GROQ_API_KEY') : process.env.GROQ_API_KEY) ||
      undefined;

    const groqResult = await requestAssessmentNarrative(
      {
        sex: basics.sex,
        ageYears: basics.ageYears,
        weightKg: basics.weightKg,
        bmr: bmrResult.selectedBMR,
        tdee: tdeeResult.tdee,
        targetKcal: targetResult.kcalTarget,
        chaiCupsPerDay: chaiCups,
        dailyChaiSugarKcal,
        sittingHours: occupational.dailySittingHours ?? 8,
        sleepHours: lifestyleDesi?.sleepHoursPerNight ?? 7,
        shiftPattern: occupational.shiftPattern ?? 'regular_day',
        dietPreference: preferencesBudget?.dietPreference,
        budgetTier: preferencesBudget?.budgetTierPKR,
      },
      apiKey
    );

    const safetyFlags: string[] = [
      ...targetResult.safetyViolations.map((v) => `${v.code}: ${v.message}`),
      ...targetResult.safetyWarnings,
    ];

    const responsePayload: AssessmentResponse = {
      success: true,
      targets: {
        bmr: bmrResult.selectedBMR,
        tdee: tdeeResult.tdee,
        targetCalories: targetResult.kcalTarget,
        targetProteinGrams: macros.proteinGrams,
        targetFatGrams: macros.fatGrams,
        targetCarbGrams: macros.carbGrams,
        targetFibreGrams: macros.fibreGrams,
        targetWaterMl: macros.waterMl,
        calculationMethod: tdeeResult.method,
      },
      narrative: groqResult.narrative,
      safetyFlags,
      culturalMetrics: {
        dailyChaiSugarKcal,
        weeklyChaiSugarKcal,
        isHighChaiIntake: chaiCups >= 3,
        isSedentaryWorker: (occupational.dailySittingHours ?? 0) >= 8,
        isNightShift: occupational.shiftPattern === 'night_shift',
      },
      generatedBy: groqResult.generatedBy,
    };

    return new Response(JSON.stringify(responsePayload, null, 2), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: 'Internal server error processing assessment',
        details: err?.message || String(err),
      }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// In Deno runtime (Supabase Edge Functions), invoke serve
if (typeof Deno !== 'undefined') {
  (Deno as any).serve(handleAssessmentRequest);
}
