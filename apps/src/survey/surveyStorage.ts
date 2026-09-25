import { LifestyleSurveyPayload } from './types.js';
import { authStorageAdapter } from '../supabase/client.js';
import { getAuthSession } from '../auth/authStorage.js';

const STORAGE_PREFIX_SURVEY = 'nutrio_lifestyle_survey_';

// Scoped per user for the same reason the tracker keys are: one device can
// hold two accounts.
function surveyScope(): string {
  return getAuthSession()?.user?.id || 'guest';
}

function surveyKey(): string {
  return `${STORAGE_PREFIX_SURVEY}${surveyScope()}`;
}

function hasStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

const memorySurveys = new Map<string, LifestyleSurveyPayload>();

let durableQueue: Promise<void> = Promise.resolve();

function enqueueDurable(op: () => Promise<void>): Promise<void> {
  durableQueue = durableQueue.then(op).catch(() => {
    // Ignore storage error
  });
  return durableQueue;
}

/** Resolves once every queued durable write has landed. */
export function flushSurveyWrites(): Promise<void> {
  return durableQueue;
}

/**
 * Keeps the submitted answers on the device. The backend copy lives in
 * core.lifestyle_surveys, which is not reachable from the client while the
 * core schema is unexposed, so without this the answers are gone at logout.
 */
export function savePersistedSurvey(payload: LifestyleSurveyPayload): void {
  const key = surveyKey();
  memorySurveys.set(key, payload);
  const serialized = JSON.stringify(payload);
  if (hasStorage()) {
    try {
      window.localStorage.setItem(key, serialized);
    } catch (err) {
      console.warn('[SurveyStorage] Error saving survey:', err);
    }
  }
  void enqueueDurable(() => authStorageAdapter.setItem(key, serialized));
}

export function loadPersistedSurvey(): LifestyleSurveyPayload | null {
  const key = surveyKey();
  const cached = memorySurveys.get(key);
  if (cached) return cached;

  if (hasStorage()) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as LifestyleSurveyPayload;
        memorySurveys.set(key, parsed);
        return parsed;
      }
    } catch (err) {
      console.warn('[SurveyStorage] Error loading survey:', err);
    }
  }

  return null;
}

/** Restores the survey from durable native storage on boot or re-login. */
export async function hydratePersistedSurvey(): Promise<LifestyleSurveyPayload | null> {
  const key = surveyKey();
  const cached = memorySurveys.get(key);
  if (cached) return cached;
  await durableQueue;
  try {
    const raw = await authStorageAdapter.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as LifestyleSurveyPayload;
      memorySurveys.set(key, parsed);
      return parsed;
    }
  } catch {
    // Ignore hydration error
  }
  return null;
}

/** Drops the in-memory copy on logout; the durable per-user record stays. */
export function releaseSurveyCache(): void {
  memorySurveys.clear();
}
