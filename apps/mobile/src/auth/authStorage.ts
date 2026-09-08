import { AuthSession, LoginCredentials, RegisterCredentials } from './types.js';

const STORAGE_KEY = 'nutrio_auth_session';

// In-memory fallback for test runners or environments without localStorage
let memorySession: AuthSession | null = null;

function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
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

export function clearAuthSession(): void {
  memorySession = null;
  if (hasLocalStorage()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore removal error
    }
  }
}

export function isUserAuthenticated(): boolean {
  return getAuthSession() !== null;
}

export async function authenticateUser(
  credentials: LoginCredentials
): Promise<AuthSession> {
  const email = (credentials.email || '').trim().toLowerCase();
  const password = credentials.password || '';

  if (!email || !email.includes('@') || !email.includes('.') || password.length < 6) {
    throw new Error('Invalid email or password. Password must be at least 6 characters.');
  }

  // Determine user display name
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

export async function registerUser(
  credentials: RegisterCredentials
): Promise<AuthSession> {
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
