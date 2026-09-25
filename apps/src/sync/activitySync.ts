import { supabase, isSupabaseConfigured } from '../supabase/client.js';
import { getAuthSession } from '../auth/authStorage.js';
import { resolveCurrentProfileId } from './userDataSync.js';
import { LoggedItem } from '../tracker/types.js';

export interface DailyActivityRecord {
  date: string;
  region: 'PK' | 'SA';
  items: LoggedItem[];
  waterMl: number;
}

/**
 * Pushes one day's logged items and water intake to core.activity_logs.
 * Upserts on (user_id, log_date, region) so repeated saves for the same day
 * overwrite rather than accumulate.
 */
export async function pushDailyActivities(
  record: DailyActivityRecord
): Promise<{ success: boolean; error?: string }> {
  if (!getAuthSession()) {
    return { success: false, error: 'Not authenticated.' };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Backend not configured.' };
  }

  const profileId = await resolveCurrentProfileId();
  if (!profileId) {
    return { success: false, error: 'Could not resolve user profile.' };
  }

  try {
    const { error } = await supabase
      .schema('core')
      .from('activity_logs')
      .upsert(
        {
          user_id: profileId,
          log_date: record.date,
          region: record.region,
          items: record.items,
          water_ml: Math.round(record.waterMl || 0),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,log_date,region' }
      );

    if (error) {
      console.warn('[ActivitySync] Push failed:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.warn('[ActivitySync] Push exception:', err?.message);
    return { success: false, error: err?.message };
  }
}

/**
 * Fetches the user's recent activity history, newest day first.
 * This is what makes a log survive logout, reinstall, or a device change.
 */
export async function fetchActivityHistory(
  limit: number = 60
): Promise<DailyActivityRecord[]> {
  if (!getAuthSession() || !isSupabaseConfigured()) {
    return [];
  }

  const profileId = await resolveCurrentProfileId();
  if (!profileId) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .schema('core')
      .from('activity_logs')
      .select('log_date, region, items, water_ml')
      .eq('user_id', profileId)
      .order('log_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('[ActivitySync] History fetch failed:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      date: row.log_date,
      region: row.region,
      items: Array.isArray(row.items) ? row.items : [],
      waterMl: row.water_ml || 0,
    }));
  } catch (err: any) {
    console.warn('[ActivitySync] History fetch exception:', err?.message);
    return [];
  }
}
