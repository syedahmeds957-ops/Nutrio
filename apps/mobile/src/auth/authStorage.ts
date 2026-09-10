import { supabase, isSupabaseConfigured } from '../supabase/client.js';
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

// In-memory fallback for test runners or environments without localStorage
let memorySession: AuthSession | null = null;

function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
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
    surveyCompleted: Boolean(metadata.survey_completed),
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
  if (hasLocalStorage()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Ignore storage error
    }
  }
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
  if (!isSupabaseConfigured()) {
    return getAuthSession();
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      return getAuthSession();
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
    return getAuthSession();
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

  if (!email || !email.includes('@') || !email.includes('.') || password.length < 6) {
    throw new Error('Invalid email or password. Password must be at least 6 characters.');
  }

  if (isSupabaseConfigured()) {
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
  }

  // Local / Mock fallback when Supabase is not configured
  let name = 'Talha';
  const prefix = email.split('@')[0];
  if (prefix && prefix.toLowerCase() !== 'talha') {
    name = prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }

  const session: AuthSession = {
    token: `nutrio_jwt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    user: {
      id: `usr_${Date.now()}`,
      name,
      email,
      isRegistered: true,
      surveyCompleted: true,
    },
    createdAt: new Date().toISOString(),
  };

  saveAuthSession(session);
  return session;
}

/**
 * Register user with Email + Password, initiating mandatory OTP verification.
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

    // Check if session was returned immediately (if email confirmation is disabled)
    if (data.session && data.user) {
      const session: AuthSession = {
        token: data.session.access_token,
        user: mapSupabaseUserToAuthUser(data.user),
        createdAt: new Date().toISOString(),
      };
      saveAuthSession(session);
      return {
        requiresOtp: false,
        email,
        message: 'Account created and verified.',
        session,
      };
    }

    // Email OTP confirmation is mandatory
    return {
      requiresOtp: true,
      email,
      message: `A 6-digit verification code was sent to ${email}.`,
      session: null,
    };
  }

  // Local / Mock fallback
  return {
    requiresOtp: true,
    email,
    message: `Verification code sent to ${email} (Demo mode: enter any 6 digits).`,
    session: null,
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
  }

  // Local / Mock fallback
  const session: AuthSession = {
    token: `nutrio_jwt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    user: {
      id: `usr_${Date.now()}`,
      name: email.split('@')[0] || 'User',
      email,
      isRegistered: true,
      surveyCompleted: false,
    },
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
