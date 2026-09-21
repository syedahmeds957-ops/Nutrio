import { supabase, isSupabaseConfigured } from '../supabase/client.js';
import { getAuthSession } from '../auth/authStorage.js';
import { LifestyleSurveyPayload } from '../survey/types.js';
import { ComputedUserPlan } from '../plan/types.js';

export interface SyncResult {
  success: boolean;
  profileId?: string;
  error?: string;
  isMock?: boolean;
}

export interface HydrationResult {
  success: boolean;
  profileId?: string;
  computedPlan?: ComputedUserPlan | null;
  surveyPayload?: LifestyleSurveyPayload | null;
  bodyMetrics?: any[];
  error?: string;
  isMock?: boolean;
}

/**
 * Resolves the core.profiles primary key UUID for the authenticated user.
 */
export async function resolveCurrentProfileId(): Promise<string | null> {
  const session = getAuthSession();
  if (!session?.user?.id) {
    return null;
  }

  if (!isSupabaseConfigured()) {
    return `prof_${session.user.id}`;
  }

  try {
    const { data, error } = await supabase
      .schema('core')
      .from('profiles')
      .select('id')
      .eq('auth_uid', session.user.id)
      .maybeSingle();

    if (error) {
      console.warn('[UserDataSync] Error querying profile:', error.message);
      return null;
    }

    return data?.id ?? null;
  } catch (err: any) {
    console.warn('[UserDataSync] Exception resolving profile:', err?.message);
    return null;
  }
}

/**
 * Persists the user's lifestyle survey to core.lifestyle_surveys.
 */
export async function syncLifestyleSurvey(
  profileId: string,
  payload: LifestyleSurveyPayload,
  version: number = 1
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return true;
  }

  try {
    const { error } = await supabase
      .schema('core')
      .from('lifestyle_surveys')
      .upsert(
        {
          user_id: profileId,
          version,
          payload,
          answered_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,version' }
      );

    if (error) {
      console.warn('[UserDataSync] Failed to persist lifestyle survey:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('[UserDataSync] Exception saving survey:', err?.message);
    return false;
  }
}

/**
 * Persists initial body metrics to core.body_metrics.
 */
export async function syncBodyMetrics(
  profileId: string,
  weightKg: number,
  bodyFatPct?: number,
  waistCm?: number
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return true;
  }

  try {
    const { error } = await supabase
      .schema('core')
      .from('body_metrics')
      .insert({
        user_id: profileId,
        measured_at: new Date().toISOString(),
        weight_kg: weightKg,
        bodyfat_pct: bodyFatPct ?? null,
        waist_cm: waistCm ?? null,
        source: 'manual',
      });

    if (error) {
      console.warn('[UserDataSync] Failed to persist body metrics:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('[UserDataSync] Exception saving body metrics:', err?.message);
    return false;
  }
}

/**
 * Persists calculated nutrition & calorie targets to core.targets.
 */
export async function syncNutritionTargets(
  profileId: string,
  plan: ComputedUserPlan
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return true;
  }

  try {
    const targetPayload = {
      user_id: profileId,
      effective_from: new Date().toISOString(),
      bmr: Math.round(plan.userContext.bmr),
      tdee_formula: Math.round(plan.userContext.tdee),
      goal: plan.goalSelection.goal,
      rate_kg_per_week: plan.goalSelection.targetRateKgPerWeek,
      kcal_target: Math.round(plan.targetResult.kcalTarget),
      protein_g: Math.round(plan.macros.proteinGrams),
      carb_g: Math.round(plan.macros.carbGrams),
      fat_g: Math.round(plan.macros.fatGrams),
      fibre_g: Math.round(plan.macros.fibreGrams ?? 25),
      water_ml: Math.round(plan.macros.waterMl ?? 2500),
      method: 'rule',
      generated_by: 'rule',
      safety_flags: (plan.targetResult as any).safetyFlags || [],
    };

    const { error } = await supabase
      .schema('core')
      .from('targets')
      .insert(targetPayload);

    if (error) {
      console.warn('[UserDataSync] Failed to persist targets:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('[UserDataSync] Exception saving targets:', err?.message);
    return false;
  }
}

/**
 * Atomic sync coordinator called upon onboarding completion.
 */
export async function syncCompleteOnboarding(
  surveyPayload: LifestyleSurveyPayload,
  computedPlan: ComputedUserPlan
): Promise<SyncResult> {
  const session = getAuthSession();
  if (!session) {
    return {
      success: false,
      error: 'User not authenticated. Cannot sync onboarding data.',
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      profileId: `mock_prof_${session.user.id}`,
      isMock: true,
    };
  }

  const profileId = await resolveCurrentProfileId();
  if (!profileId) {
    return {
      success: false,
      error: 'Could not resolve user profile from Supabase.',
    };
  }

  // 1. Persist Lifestyle Survey
  await syncLifestyleSurvey(profileId, surveyPayload);

  // 2. Persist Initial Body Metrics
  await syncBodyMetrics(
    profileId,
    surveyPayload.basics.weightKg,
    surveyPayload.basics.bodyFatPct,
    surveyPayload.basics.waistCm
  );

  // 3. Persist Calculated Targets
  await syncNutritionTargets(profileId, computedPlan);

  // 4. Update Supabase Auth User metadata
  try {
    await supabase.auth.updateUser({
      data: { survey_completed: true },
    });
  } catch (err: any) {
    console.warn('[UserDataSync] Error updating survey_completed metadata:', err?.message);
  }

  return {
    success: true,
    profileId,
  };
}

/**
 * Fetches the user's latest nutrition targets from core.targets.
 */
export async function fetchUserTargets(profileId: string): Promise<any | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  try {
    const { data, error } = await supabase
      .schema('core')
      .from('targets')
      .select('*')
      .eq('user_id', profileId)
      .order('effective_from', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[UserDataSync] Error fetching targets:', error.message);
      return null;
    }
    return data ?? null;
  } catch (err: any) {
    console.warn('[UserDataSync] Exception fetching targets:', err?.message);
    return null;
  }
}

/**
 * Fetches the user's latest lifestyle survey from core.lifestyle_surveys.
 */
export async function fetchLatestLifestyleSurvey(profileId: string): Promise<LifestyleSurveyPayload | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  try {
    const { data, error } = await supabase
      .schema('core')
      .from('lifestyle_surveys')
      .select('payload')
      .eq('user_id', profileId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[UserDataSync] Error fetching lifestyle survey:', error.message);
      return null;
    }
    return (data?.payload as LifestyleSurveyPayload) ?? null;
  } catch (err: any) {
    console.warn('[UserDataSync] Exception fetching lifestyle survey:', err?.message);
    return null;
  }
}

/**
 * Fetches the user's recorded body metrics history from core.body_metrics.
 */
export async function fetchBodyMetricsHistory(profileId: string, limit: number = 30): Promise<any[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .schema('core')
      .from('body_metrics')
      .select('*')
      .eq('user_id', profileId)
      .order('measured_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('[UserDataSync] Error fetching body metrics:', error.message);
      return [];
    }
    return data ?? [];
  } catch (err: any) {
    console.warn('[UserDataSync] Exception fetching body metrics:', err?.message);
    return [];
  }
}

/**
 * Atomic data hydration: Re-hydrates personalized plan and survey data from Supabase.
 */
export async function hydrateUserDataFromCloud(profileIdParam?: string): Promise<HydrationResult> {
  const session = getAuthSession();
  if (!session) {
    return {
      success: false,
      error: 'User not authenticated. Cannot hydrate data.',
    };
  }

  const profileId = profileIdParam || (await resolveCurrentProfileId());
  if (!profileId) {
    return {
      success: false,
      error: 'Could not resolve user profile.',
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      profileId,
      isMock: true,
    };
  }

  const [targetsRow, surveyPayload, bodyMetrics] = await Promise.all([
    fetchUserTargets(profileId),
    fetchLatestLifestyleSurvey(profileId),
    fetchBodyMetricsHistory(profileId, 30),
  ]);

  let computedPlan: ComputedUserPlan | null = null;
  if (targetsRow) {
    computedPlan = {
      userContext: {
        weightKg: surveyPayload?.basics?.weightKg ?? 70,
        heightCm: surveyPayload?.basics?.heightCm ?? 170,
        ageYears: surveyPayload?.basics?.ageYears ?? 25,
        sex: surveyPayload?.basics?.sex ?? 'male',
        bmr: targetsRow.bmr || 1600,
        tdee: targetsRow.tdee_formula || 2100,
        bodyFatPct: surveyPayload?.basics?.bodyFatPct,
        isPregnantOrBreastfeeding: surveyPayload?.healthClinical?.isPregnantOrBreastfeeding ?? false,
        medicalConditions: surveyPayload?.healthClinical?.medicalConditions ?? [],
        chaiSugarKcalPerDay: surveyPayload?.lifestyleDesi?.chaiWithSugarCupsPerDay ? surveyPayload.lifestyleDesi.chaiWithSugarCupsPerDay * 60 : 120,
        weeklyChaiSugarKcal: 840,
        isNightShift: surveyPayload?.occupational?.shiftPattern === 'night_shift',
        dailySittingHours: surveyPayload?.occupational?.dailySittingHours ?? 8,
      },
      goalSelection: {
        goal: targetsRow.goal || 'maintain',
        targetRateKgPerWeek: Number(targetsRow.rate_kg_per_week) || 0,
      },
      targetResult: {
        kcalTarget: targetsRow.kcal_target,
        deficitKcal: targetsRow.tdee_formula ? targetsRow.tdee_formula - targetsRow.kcal_target : 0,
        isSafe: true,
        safetyFlags: targetsRow.safety_flags || [],
      } as any,
      macros: {
        proteinGrams: targetsRow.protein_g,
        fatGrams: targetsRow.fat_g,
        carbGrams: targetsRow.carb_g,
        fiberGrams: targetsRow.fibre_g || 25,
        waterMl: targetsRow.water_ml || 2500,
      } as any,
      projection: {
        currentWeightKg: surveyPayload?.basics?.weightKg ?? 70,
        targetWeightKg: surveyPayload?.basics?.weightKg ?? 70,
        weeklyRateKg: Number(targetsRow.rate_kg_per_week) || 0,
        isRealistic: true,
        pacingAdvice: 'Target loaded from your cloud profile.',
      },
    };
  }

  return {
    success: true,
    profileId,
    computedPlan,
    surveyPayload,
    bodyMetrics,
  };
}
