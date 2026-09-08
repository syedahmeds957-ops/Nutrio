import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAuthSession,
  saveAuthSession,
  clearAuthSession,
  authenticateUser,
  registerUser,
  isUserAuthenticated,
} from '../authStorage.js';
import { AuthSession } from '../types.js';

describe('Auth Session Layer (authStorage)', () => {
  beforeEach(() => {
    clearAuthSession();
  });

  it('starts with no active auth session', () => {
    expect(getAuthSession()).toBeNull();
    expect(isUserAuthenticated()).toBe(false);
  });

  it('saves and retrieves an active auth session', () => {
    const session: AuthSession = {
      token: 'session_token_123',
      user: {
        id: 'user_1',
        name: 'Talha',
        email: 'talha@nutrio.app',
        isRegistered: true,
        surveyCompleted: true,
      },
      createdAt: new Date().toISOString(),
    };

    saveAuthSession(session);
    expect(isUserAuthenticated()).toBe(true);
    const retrieved = getAuthSession();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.user.name).toBe('Talha');
    expect(retrieved?.user.email).toBe('talha@nutrio.app');
  });

  it('clears active auth session on logout', () => {
    const session: AuthSession = {
      token: 'session_token_xyz',
      user: {
        id: 'user_2',
        name: 'Ahmed',
        email: 'ahmed@nutrio.app',
        isRegistered: true,
        surveyCompleted: false,
      },
      createdAt: new Date().toISOString(),
    };

    saveAuthSession(session);
    expect(isUserAuthenticated()).toBe(true);

    clearAuthSession();
    expect(getAuthSession()).toBeNull();
    expect(isUserAuthenticated()).toBe(false);
  });

  it('authenticates existing user credentials successfully', async () => {
    const session = await authenticateUser({
      email: 'talha@nutrio.app',
      password: 'password123',
      rememberMe: true,
    });

    expect(session.token).toBeDefined();
    expect(session.user.name).toBe('Talha');
    expect(session.user.email).toBe('talha@nutrio.app');
    expect(session.user.isRegistered).toBe(true);
    expect(isUserAuthenticated()).toBe(true);
  });

  it('rejects invalid email or blank password', async () => {
    await expect(
      authenticateUser({ email: 'invalid-email', password: '123' })
    ).rejects.toThrow('Invalid email or password');

    await expect(
      authenticateUser({ email: 'user@nutrio.app', password: '' })
    ).rejects.toThrow('Invalid email or password');
  });

  it('registers a new user and persists session', async () => {
    const session = await registerUser({
      name: 'Usman',
      email: 'usman@nutrio.app',
      password: 'strongpassword',
      rememberMe: true,
    });

    expect(session.token).toBeDefined();
    expect(session.user.name).toBe('Usman');
    expect(session.user.email).toBe('usman@nutrio.app');
    expect(session.user.isRegistered).toBe(true);
    expect(isUserAuthenticated()).toBe(true);

    const saved = getAuthSession();
    expect(saved?.user.name).toBe('Usman');
  });

  it('rejects registration with short password or missing name', async () => {
    await expect(
      registerUser({ name: '', email: 'test@nutrio.app', password: 'password123' })
    ).rejects.toThrow('Name is required');

    await expect(
      registerUser({ name: 'Ali', email: 'ali@nutrio.app', password: '123' })
    ).rejects.toThrow('Password must be at least 6 characters');
  });
});
