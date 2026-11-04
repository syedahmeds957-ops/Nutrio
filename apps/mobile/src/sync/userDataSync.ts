import { supabase, isSupabaseConfigured } from '../supabase/client.js';
import { getAuthSession } from '../auth/authStorage.js';
import { LifestyleSurveyPayload } from '../survey/types.js';
import { ComputedUserPlan } from '../plan/types.js';
import { buildTargetsRow, planFromTargetsRow, rebuildPlanFromTargetsRow } from './targetsRow.js';
import { errorMessage } from '../common/errors.js';

/** One row of core.body_metrics. */
export interface BodyMetricRow {
  id: string;
  user_id: string;
  measured_at: string;
  weight_kg: number;
  bodyfat_pct: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  source: string;
}

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
  /**
   * True when `computedPlan` was rebuilt from an older targets row that lacked
   * the full plan; the caller saves it back so the next restore reads it as-is.
   */
  planRebuilt?: boolean;
  surveyPayload?: LifestyleSurveyPayload | null;
  bodyMetrics?: BodyMetricRow[];
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
  } catch (err) {
    console.warn('[UserDataSync] Exception resolving profile:', errorMessage(err));
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
  } catch (err) {
    console.warn('[UserDataSync] Exception saving survey:', errorMessage(err));
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
  } catch (err) {
    console.warn('[UserDataSync] Exception saving body metrics:', errorMessage(err));
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
    const targetPayload = buildTargetsRow(profileId, plan);

    const { error } = await supabase
      .schema('core')
      .from('targets')
      .insert(targetPayload);

    if (error) {
      console.warn('[UserDataSync] Failed to persist targets:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[UserDataSync] Exception saving targets:', errorMessage(err));
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
  } catch (err) {
    console.warn('[UserDataSync] Error updating survey_completed metadata:', errorMessage(err));
  }

  return {
    success: true,
    profileId,
  };
}

/**
 * Fetches the user's latest nutrition targets from core.targets.
 */
export async function fetchUserTargets(profileId: string): Promise<unknown | null> {
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
  } catch (err) {
    console.warn('[UserDataSync] Exception fetching targets:', errorMessage(err));
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
  } catch (err) {
    console.warn('[UserDataSync] Exception fetching lifestyle survey:', errorMessage(err));
    return null;
  }
}

/**
 * Fetches the user's recorded body metrics history from core.body_metrics.
 */
export async function fetchBodyMetricsHistory(profileId: string, limit: number = 30): Promise<BodyMetricRow[]> {
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
  } catch (err) {
    console.warn('[UserDataSync] Exception fetching body metrics:', errorMessage(err));
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

  // The stored plan, or one rebuilt from an older row's goal and the survey.
  const storedPlan = planFromTargetsRow(targetsRow);
  const rebuiltPlan = storedPlan ? null : rebuildPlanFromTargetsRow(targetsRow, surveyPayload);

  return {
    success: true,
    profileId,
    computedPlan: storedPlan ?? rebuiltPlan,
    planRebuilt: !!rebuiltPlan,
    surveyPayload,
    bodyMetrics,
  };
}
