import { supabase, isSupabaseConfigured, authStorageAdapter } from '../supabase/client.js';
import {
  AuthSession,
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
  RegistrationResult,
  VerifyOtpPayload,
  OtpResult,
} from './types.js';

const STORAGE_KEY = 'nutrio_auth_session';
const MOCK_USERS_REGISTRY_KEY = 'nutrio_mock_users_registry';
const SURVEY_COMPLETED_REGISTRY_KEY = 'nutrio_survey_completed_users';

// In-memory fallback for test runners or environments without localStorage
let memorySession: AuthSession | null = null;
const memoryMockUsers = new Map<string, { id: string; name: string; email: string; surveyCompleted: boolean }>();
const pendingRegistrationNames = new Map<string, string>();

// Local record of who has finished onboarding, keyed by both user id and email.
// Remote user_metadata.survey_completed is the source of truth, but that write
// is a network call that can fail or be cut short by a logout; without a local
// copy the next sign-in reads false and sends the user back through the survey.
const surveyCompletedIds = new Set<string>();
let surveyRegistryHydrated = false;

// Date.now() alone collides when two accounts are created in the same
// millisecond, and a shared id makes the second account read the first one's
// user-scoped plan and logs.
function newLocalUserId(): string {
  return `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

// Durable cross-platform persistence. window.localStorage exists on web only, so on
// native the session previously lived in memorySession alone and was lost on every
// cold start. authStorageAdapter resolves to AsyncStorage on iOS/Android.
// Writes are serialized through one chain: saveAuthSession is synchronous and
// cannot await, so an unordered logout delete could otherwise land after a
// subsequent login's write and wipe the fresh session.
let durableQueue: Promise<void> = Promise.resolve();

function enqueueDurable(op: () => Promise<void>): Promise<void> {
  durableQueue = durableQueue.then(op).catch(() => {
    // Ignore storage error
  });
  return durableQueue;
}

function persistDurable(key: string, value: string): void {
  void enqueueDurable(() => authStorageAdapter.setItem(key, value));
}

function removeDurable(key: string): Promise<void> {
  return enqueueDurable(() => authStorageAdapter.removeItem(key));
}

/**
 * Resolves once every queued durable write has landed. saveAuthSession is
 * synchronous and returns before its write completes, so callers that need to
 * observe storage directly must await this first.
 */
export function flushDurableWrites(): Promise<void> {
  return durableQueue;
}

async function readDurable(key: string): Promise<string | null> {
  try {
    await durableQueue;
    return await authStorageAdapter.getItem(key);
  } catch {
    return null;
  }
}

function getMockUser(email: string): { id: string; name: string; email: string; surveyCompleted: boolean } | null {
  const cleanEmail = email.toLowerCase().trim();
  if (memoryMockUsers.has(cleanEmail)) {
    return memoryMockUsers.get(cleanEmail)!;
  }
  if (hasLocalStorage()) {
    try {
      const raw = window.localStorage.getItem(MOCK_USERS_REGISTRY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed[cleanEmail]) {
          memoryMockUsers.set(cleanEmail, parsed[cleanEmail]);
          return parsed[cleanEmail];
        }
      }
    } catch {}
  }
  return null;
}

function saveMockUser(record: { id: string; name: string; email: string; surveyCompleted: boolean }): void {
  const cleanEmail = record.email.toLowerCase().trim();
  memoryMockUsers.set(cleanEmail, record);
  if (hasLocalStorage()) {
    try {
      const raw = window.localStorage.getItem(MOCK_USERS_REGISTRY_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[cleanEmail] = record;
      window.localStorage.setItem(MOCK_USERS_REGISTRY_KEY, JSON.stringify(parsed));
    } catch {}
  }

  const registry: Record<string, typeof record> = {};
  memoryMockUsers.forEach((value, key) => {
    registry[key] = value;
  });
  persistDurable(MOCK_USERS_REGISTRY_KEY, JSON.stringify(registry));
}

/**
 * Rehydrates the local mock user registry from durable storage on boot.
 */
async function hydrateMockUsers(): Promise<void> {
  const raw = await readDurable(MOCK_USERS_REGISTRY_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    Object.keys(parsed || {}).forEach((email) => {
      if (!memoryMockUsers.has(email)) {
        memoryMockUsers.set(email, parsed[email]);
      }
    });
  } catch {
    // Ignore parse error
  }
}

function surveyRegistryKeys(user: { id?: string; email?: string }): string[] {
  const keys: string[] = [];
  if (user.id) keys.push(`id:${user.id}`);
  if (user.email) keys.push(`email:${user.email.toLowerCase().trim()}`);
  return keys;
}

function persistSurveyRegistry(): void {
  const serialized = JSON.stringify(Array.from(surveyCompletedIds));
  if (hasLocalStorage()) {
    try {
      window.localStorage.setItem(SURVEY_COMPLETED_REGISTRY_KEY, serialized);
    } catch {
      // Ignore storage error
    }
  }
  persistDurable(SURVEY_COMPLETED_REGISTRY_KEY, serialized);
}

/** Rehydrates the survey-completion registry from durable storage. */
export async function hydrateSurveyRegistry(): Promise<void> {
  if (surveyRegistryHydrated) return;
  surveyRegistryHydrated = true;

  if (hasLocalStorage()) {
    try {
      const raw = window.localStorage.getItem(SURVEY_COMPLETED_REGISTRY_KEY);
      if (raw) {
        (JSON.parse(raw) as string[]).forEach((key) => surveyCompletedIds.add(key));
      }
    } catch {
      // Ignore parse error
    }
  }

  const raw = await readDurable(SURVEY_COMPLETED_REGISTRY_KEY);
  if (!raw) return;
  try {
    (JSON.parse(raw) as string[]).forEach((key) => surveyCompletedIds.add(key));
  } catch {
    // Ignore parse error
  }
}

/** True when this device has already seen the user finish onboarding. */
export function hasCompletedSurveyLocally(user: { id?: string; email?: string }): boolean {
  return surveyRegistryKeys(user).some((key) => surveyCompletedIds.has(key));
}

function recordSurveyCompletedLocally(user: { id?: string; email?: string }): void {
  const keys = surveyRegistryKeys(user);
  if (keys.length === 0) return;
  keys.forEach((key) => surveyCompletedIds.add(key));
  persistSurveyRegistry();
}

/**
 * Reads the persisted session, falling back to durable native storage when the
 * in-memory and localStorage lookups come up empty.
 */
async function loadPersistedSession(): Promise<AuthSession | null> {
  const cached = getAuthSession();
  if (cached) return cached;

  const raw = await readDurable(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    memorySession = parsed;
    return parsed;
  } catch {
    return null;
  }
}

function mapSupabaseUserToAuthUser(sbUser: any): AuthUser {
  const metadata = sbUser.user_metadata || {};
  const email = sbUser.email || '';
  const name =
    metadata.display_name ||
    metadata.name ||
    (email ? email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1) : 'Nutrio User');

  return {
    id: sbUser.id,
    name,
    email,
    isRegistered: true,
    surveyCompleted:
      Boolean(metadata.survey_completed) || hasCompletedSurveyLocally({ id: sbUser.id, email }),
  };
}

export function getAuthSession(): AuthSession | null {
  if (memorySession) return memorySession;

  if (hasLocalStorage()) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        memorySession = parsed;
        return parsed;
      }
    } catch {
      // Ignore parse error
    }
  }

  return null;
}

export function saveAuthSession(session: AuthSession): void {
  memorySession = session;
  const serialized = JSON.stringify(session);
  if (hasLocalStorage()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, serialized);
    } catch {
      // Ignore storage error
    }
  }
  persistDurable(STORAGE_KEY, serialized);
}

export async function clearAuthSession(): Promise<void> {
  memorySession = null;
  if (hasLocalStorage()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore removal error
    }
  }
  await removeDurable(STORAGE_KEY);

  if (isSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore remote signout failure during cleanup
    }
  }
}

export function isUserAuthenticated(): boolean {
  return getAuthSession() !== null;
}

/**
 * Restores session from Supabase on application boot.
 */
export async function restoreSession(): Promise<AuthSession | null> {
  await hydrateMockUsers();
  await hydrateSurveyRegistry();

  if (!isSupabaseConfigured()) {
    return loadPersistedSession();
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      return loadPersistedSession();
    }

    const sbSession = data.session;
    const session: AuthSession = {
      token: sbSession.access_token,
      user: mapSupabaseUserToAuthUser(sbSession.user),
      createdAt: new Date().toISOString(),
    };

    saveAuthSession(session);
    return session;
  } catch {
    return loadPersistedSession();
  }
}

/**
 * Authenticate user with Email + Password.
 */
export async function authenticateUser(
  credentials: LoginCredentials
): Promise<AuthSession> {
  const email = (credentials.email || '').trim().toLowerCase();
  const password = credentials.password || '';

  // The registry decides whether this sign-in skips onboarding, so it has to be
  // loaded before the session user is built.
  await hydrateSurveyRegistry();

  if (!email || !email.includes('@') || !email.includes('.') || password.length < 6) {
    throw new Error('Invalid email or password. Password must be at least 6 characters.');
  }

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.session || !data.user) {
        throw new Error('Sign in succeeded but no active session was returned.');
      }

      const session: AuthSession = {
        token: data.session.access_token,
        user: mapSupabaseUserToAuthUser(data.user),
        createdAt: new Date().toISOString(),
      };

      saveAuthSession(session);
      return session;
    } catch (err: any) {
      if (
        err?.message?.includes('Failed to fetch') ||
        err?.message?.includes('Network request failed') ||
        err?.name === 'AuthRetryableFetchError'
      ) {
        throw new Error(
          'Unable to reach authentication server. Please check your internet connection or configure active Supabase credentials in .env.'
        );
      }
      throw err;
    }
  }

  // Local / Mock fallback when Supabase is not configured
  const prefix = email.split('@')[0] || '';
  const defaultName = prefix ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : 'User';
  const existingUser = getMockUser(email);

  const user: AuthUser = {
    id: existingUser?.id || newLocalUserId(),
    name: existingUser?.name || defaultName,
    email,
    isRegistered: true,
    surveyCompleted: existingUser ? existingUser.surveyCompleted : true,
  };

  saveMockUser(user);

  const session: AuthSession = {
    token: `nutrio_jwt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    user,
    createdAt: new Date().toISOString(),
  };

  saveAuthSession(session);
  return session;
}

/**
 * Register user with Email + Password, creating account and active session directly.
 */
export async function registerUser(
  credentials: RegisterCredentials
): Promise<RegistrationResult> {
  const name = (credentials.name || '').trim();
  const email = (credentials.email || '').trim().toLowerCase();
  const password = credentials.password || '';

  if (!name) {
    throw new Error('Name is required');
  }

  if (!email || !email.includes('@') || !email.includes('.')) {
    throw new Error('Valid email address is required');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name,
            name,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      let session: AuthSession | null = null;
      if (data.session && data.user) {
        session = {
          token: data.session.access_token,
          user: mapSupabaseUserToAuthUser(data.user),
          createdAt: new Date().toISOString(),
        };
      } else {
        // Attempt immediate login with credentials
        try {
          const signInRes = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInRes.data.session && signInRes.data.user) {
            session = {
              token: signInRes.data.session.access_token,
              user: mapSupabaseUserToAuthUser(signInRes.data.user),
              createdAt: new Date().toISOString(),
            };
          }
        } catch {
          // Continue to fallback session if needed
        }

        if (!session && data.user) {
          session = {
            token: `sb_session_${Date.now()}`,
            user: mapSupabaseUserToAuthUser(data.user),
            createdAt: new Date().toISOString(),
          };
        }
      }

      if (session) {
        saveAuthSession(session);
      }

      return {
        requiresOtp: false,
        email,
        message: 'Account created successfully.',
        session,
      };
    } catch (err: any) {
      if (
        err?.message?.includes('Failed to fetch') ||
        err?.message?.includes('Network request failed') ||
        err?.name === 'AuthRetryableFetchError'
      ) {
        throw new Error(
          'Unable to reach authentication server. Please check your internet connection or configure active Supabase credentials in .env.'
        );
      }
      throw err;
    }
  }

  // Local / Mock fallback - create user and session immediately
  const user: AuthUser = {
    id: newLocalUserId(),
    name,
    email,
    isRegistered: true,
    surveyCompleted: false,
  };

  saveMockUser(user);

  const session: AuthSession = {
    token: `nutrio_jwt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    user,
    createdAt: new Date().toISOString(),
  };

  saveAuthSession(session);

  return {
    requiresOtp: false,
    email,
    message: 'Account created successfully.',
    session,
  };
}

/**
 * Verify 6-digit OTP code sent to user email.
 */
export async function verifyEmailOtp(payload: VerifyOtpPayload): Promise<OtpResult> {
  const email = (payload.email || '').trim().toLowerCase();
  const token = (payload.token || '').trim();

  if (!email || !token || token.length < 6) {
    throw new Error('Please enter a valid 6-digit verification code.');
  }

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.session || !data.user) {
        throw new Error('Verification completed but no session was created.');
      }

      const session: AuthSession = {
        token: data.session.access_token,
        user: mapSupabaseUserToAuthUser(data.user),
        createdAt: new Date().toISOString(),
      };

      saveAuthSession(session);
      return {
        success: true,
        session,
        message: 'Email successfully verified.',
      };
    } catch (err: any) {
      if (
        err?.message?.includes('Failed to fetch') ||
        err?.message?.includes('Network request failed') ||
        err?.name === 'AuthRetryableFetchError'
      ) {
        throw new Error(
          'Unable to reach authentication server. Please check your internet connection or configure active Supabase credentials in .env.'
        );
      }
      throw err;
    }
  }

  // Local / Mock fallback
  const fallbackPrefix = email.split('@')[0] || '';
  const enteredName =
    pendingRegistrationNames.get(email) ||
    (fallbackPrefix ? fallbackPrefix.charAt(0).toUpperCase() + fallbackPrefix.slice(1) : 'User');
  pendingRegistrationNames.delete(email);

  const mockUser: AuthUser = {
    id: newLocalUserId(),
    name: enteredName,
    email,
    isRegistered: true,
    surveyCompleted: false,
  };
  saveMockUser(mockUser);

  const session: AuthSession = {
    token: `nutrio_jwt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    user: mockUser,
    createdAt: new Date().toISOString(),
  };

  saveAuthSession(session);
  return {
    success: true,
    session,
    message: 'Verification successful.',
  };
}

/**
 * Resend OTP code with 60-second cooldown protection.
 */
let lastResendTime = 0;

export async function resendEmailOtp(email: string): Promise<{ success: boolean; message: string }> {
  const now = Date.now();
  if (now - lastResendTime < 60000) {
    const secondsRemaining = Math.ceil((60000 - (now - lastResendTime)) / 1000);
    throw new Error(`Please wait ${secondsRemaining}s before requesting a new code.`);
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Email address is required to resend code.');
  }

  if (isSupabaseConfigured()) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  lastResendTime = now;
  return {
    success: true,
    message: `A new 6-digit code has been dispatched to ${cleanEmail}.`,
  };
}

/**
 * Marks the active user's survey as completed.
 * Persists status to active session, local mock user registry, and remote Supabase metadata.
 */
export async function markSurveyCompleted(): Promise<void> {
  const currentSession = getAuthSession();
  if (!currentSession) return;

  const updatedSession: AuthSession = {
    ...currentSession,
    user: {
      ...currentSession.user,
      surveyCompleted: true,
    },
  };
  saveAuthSession(updatedSession);

  // Written before the network call: if the remote update fails, the next
  // sign-in on this device still skips onboarding.
  recordSurveyCompletedLocally({
    id: currentSession.user.id,
    email: currentSession.user.email,
  });

  if (currentSession.user.email) {
    saveMockUser({
      id: currentSession.user.id,
      name: currentSession.user.name,
      email: currentSession.user.email,
      surveyCompleted: true,
    });
  }

  if (isSupabaseConfigured()) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { error } = await supabase.auth.updateUser({
          data: { survey_completed: true },
        });
        if (!error) return;
        if (attempt === 1) {
          console.warn('[authStorage] Failed to update remote survey_completed metadata:', error.message);
        }
      } catch (err: any) {
        if (attempt === 1) {
          console.warn('[authStorage] Failed to update remote survey_completed metadata:', err?.message);
        }
      }
    }
  }
}
