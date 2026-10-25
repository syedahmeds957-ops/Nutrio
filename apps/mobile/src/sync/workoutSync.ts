import type { WeeklyWorkoutPlan, WorkoutLog } from '@nutrio/workout-core';
import { supabase, isSupabaseConfigured } from '../supabase/client.js';
import { getAuthSession } from '../auth/authStorage.js';
import { resolveCurrentProfileId } from './userDataSync.js';
import { errorMessage } from '../common/errors.js';
import { localDateKey } from '../common/dateKey.js';
import { loadWorkoutPlan, planFromBackup, saveWorkoutPlan } from '../workout/workoutStorage.js';
import { keptSince, loadWorkoutLogs, logsFromBackup, replaceWorkoutLogs } from '../workout/workoutLogStorage.js';
import { mergeWorkoutLogs, pickWorkoutPlan, planSavedAt } from '../workout/workoutMerge.js';

/** The columns of core.workout_plans and core.workout_logs this module reads. */
interface WorkoutPlanRow {
  plan: unknown;
  updated_at: string;
}

interface WorkoutLogRow {
  log_date: string;
  logs: unknown;
}

type SyncResult = { success: true } | { success: false; error: string };
type FetchResult<T> = ({ success: true } & T) | { success: false; error: string };

export interface RemoteWorkoutPlan {
  plan: WeeklyWorkoutPlan;
  /** The save time of the device that pushed it. */
  updatedAt: string;
}

/** Every workout finished on one date: one row in core.workout_logs. */
export interface WorkoutLogDay {
  dateKey: string;
  logs: WorkoutLog[];
}

/** The signed-in user's profile id, or why there isn't one. Guests never reach the network. */
async function profileForSync(): Promise<{ profileId: string } | { error: string }> {
  if (!getAuthSession()) return { error: 'Not authenticated.' };
  if (!isSupabaseConfigured()) return { error: 'Backend not configured.' };
  const profileId = await resolveCurrentProfileId();
  return profileId ? { profileId } : { error: 'Could not resolve user profile.' };
}

/**
 * Backs up the user's plan. One row per user; `updated_at` is the plan's own
 * save time, so the restore on another device can tell which copy is newer.
 */
export async function pushWorkoutPlan(plan: WeeklyWorkoutPlan): Promise<SyncResult> {
  const profile = await profileForSync();
  if ('error' in profile) return { success: false, error: profile.error };

  try {
    const { error } = await supabase
      .schema('core')
      .from('workout_plans')
      .upsert({ user_id: profile.profileId, plan, updated_at: planSavedAt(plan) }, { onConflict: 'user_id' });
    if (error) {
      console.warn('[WorkoutSync] Plan push failed:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.warn('[WorkoutSync] Plan push exception:', errorMessage(err));
    return { success: false, error: errorMessage(err) };
  }
}

/**
 * Backs up whole days of workouts. Each day is sent with every workout done
 * on it, so a second session that day never overwrites the first.
 */
export async function pushWorkoutLogs(days: readonly WorkoutLogDay[]): Promise<SyncResult> {
  if (days.length === 0) return { success: true };
  const profile = await profileForSync();
  if ('error' in profile) return { success: false, error: profile.error };

  const updatedAt = new Date().toISOString();
  try {
    const { error } = await supabase
      .schema('core')
      .from('workout_logs')
      .upsert(
        days.map((day) => ({ user_id: profile.profileId, log_date: day.dateKey, logs: day.logs, updated_at: updatedAt })),
        { onConflict: 'user_id,log_date' }
      );
    if (error) {
      console.warn('[WorkoutSync] Log push failed:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.warn('[WorkoutSync] Log push exception:', errorMessage(err));
    return { success: false, error: errorMessage(err) };
  }
}

/** The backed-up plan; `plan: null` when there is none (or it can't be read). */
export async function fetchWorkoutPlan(): Promise<FetchResult<{ plan: RemoteWorkoutPlan | null }>> {
  const profile = await profileForSync();
  if ('error' in profile) return { success: false, error: profile.error };

  try {
    const { data, error } = await supabase
      .schema('core')
      .from('workout_plans')
      .select('plan, updated_at')
      .eq('user_id', profile.profileId)
      .maybeSingle();
    if (error) {
      console.warn('[WorkoutSync] Plan fetch failed:', error.message);
      return { success: false, error: error.message };
    }
    const row = data as WorkoutPlanRow | null;
    const plan = row ? planFromBackup(row.plan) : null;
    return { success: true, plan: plan && row ? { plan, updatedAt: row.updated_at } : null };
  } catch (err) {
    console.warn('[WorkoutSync] Plan fetch exception:', errorMessage(err));
    return { success: false, error: errorMessage(err) };
  }
}

/** Every backed-up workout on or after `since` (the device keeps a year). */
export async function fetchWorkoutLogs(since: string): Promise<FetchResult<{ logs: WorkoutLog[] }>> {
  const profile = await profileForSync();
  if ('error' in profile) return { success: false, error: profile.error };

  try {
    const { data, error } = await supabase
      .schema('core')
      .from('workout_logs')
      .select('log_date, logs')
      .eq('user_id', profile.profileId)
      .gte('log_date', since)
      .order('log_date', { ascending: false });
    if (error) {
      console.warn('[WorkoutSync] Log fetch failed:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, logs: ((data ?? []) as WorkoutLogRow[]).flatMap((row) => logsFromBackup(row.logs)) };
  } catch (err) {
    console.warn('[WorkoutSync] Log fetch exception:', errorMessage(err));
    return { success: false, error: errorMessage(err) };
  }
}

export interface WorkoutBackup {
  /** Whose backup this is, so a restore that lands after a sign-out is dropped. */
  userId: string;
  plan: Awaited<ReturnType<typeof fetchWorkoutPlan>>;
  logs: Awaited<ReturnType<typeof fetchWorkoutLogs>>;
}

/** Fetches the signed-in user's plan and logs together; null for guests and without a backend. */
export async function fetchWorkoutBackup(todayKey: string = localDateKey()): Promise<WorkoutBackup | null> {
  const userId = getAuthSession()?.user?.id;
  if (!userId || !isSupabaseConfigured()) return null;
  const [plan, logs] = await Promise.all([fetchWorkoutPlan(), fetchWorkoutLogs(keptSince(todayKey))]);
  return { userId, plan, logs };
}

/**
 * Merges a fetched backup into the device copy: the newer plan wins and logs
 * merge workout by workout. Whatever the device has that the cloud lacks is
 * pushed back up (not awaited). A side whose fetch failed is left alone, so a
 * network error can never overwrite the cloud with an older device copy.
 */
export function applyWorkoutBackup(backup: WorkoutBackup | null, todayKey: string = localDateKey()): void {
  if (!backup || getAuthSession()?.user?.id !== backup.userId) return;

  if (backup.plan.success) {
    const local = loadWorkoutPlan();
    const winner = pickWorkoutPlan(local, backup.plan.plan);
    if (winner === 'remote' && backup.plan.plan) saveWorkoutPlan(backup.plan.plan.plan);
    else if (winner === 'local' && local) void pushWorkoutPlan(local);
  }

  if (backup.logs.success) {
    const { logs, pushDates } = mergeWorkoutLogs(loadWorkoutLogs(), backup.logs.logs, keptSince(todayKey));
    replaceWorkoutLogs(logs);
    void pushWorkoutLogs(pushDates.map((dateKey) => ({ dateKey, logs: logs.filter((log) => log.dateKey === dateKey) })));
  }
}
