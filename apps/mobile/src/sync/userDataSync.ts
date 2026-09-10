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

  return {
    success: true,
    profileId,
  };
}
