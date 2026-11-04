import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const backend = vi.hoisted(() => {
  const calls: string[] = [];
  const state = { configured: true, verifyError: null as string | null, updateError: null as string | null };
  const user = { id: 'u1', email: 'sana@example.com', user_metadata: { name: 'Sana' } };
  const auth = {
    resetPasswordForEmail: async (email: string) => {
      calls.push(`reset:${email}`);
      return { error: null };
    },
    verifyOtp: async (params: { email: string; token: string; type: string }) => {
      calls.push(`verify:${params.type}:${params.token}`);
      return state.verifyError
        ? { data: { session: null, user: null }, error: { message: state.verifyError } }
        : { data: { session: { access_token: 'jwt' }, user }, error: null };
    },
    updateUser: async (params: { password: string }) => {
      calls.push(`update:${params.password}`);
      return { error: state.updateError ? { message: state.updateError } : null };
    },
    signOut: async (options: { scope: string }) => {
      calls.push(`signOut:${options.scope}`);
      return { error: null };
    },
  };
  return { calls, state, auth };
});

vi.mock('../../supabase/client.js', () => {
  const store = new Map<string, string>();
  return {
    supabase: { auth: backend.auth },
    isSupabaseConfigured: () => backend.state.configured,
    authStorageAdapter: {
      getItem: async (key: string) => store.get(key) ?? null,
      setItem: async (key: string, value: string) => void store.set(key, value),
      removeItem: async (key: string) => void store.delete(key),
    },
  };
});

import { initI18n } from '../../i18n/config.js';
import { authErrorKey, authFieldForKey } from '../authErrors.js';
import { clearAuthSession, getAuthSession, requestPasswordReset, resetPasswordWithCode } from '../authStorage.js';
import { AuthScreen } from '../ui/AuthScreen.js';
import { PasswordResetForm } from '../ui/PasswordResetForm.js';

describe('password reset by emailed code', () => {
  let clock = Date.now();
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    // Each test starts past the resend cooldown the last one set.
    clock += 10 * 60 * 1000;
    vi.setSystemTime(clock);
    backend.calls.length = 0;
    backend.state.configured = true;
    backend.state.verifyError = null;
    backend.state.updateError = null;
    await clearAuthSession();
  });
  afterEach(() => vi.useRealTimers());

  it('emails the code for a trimmed, lower-cased address', async () => {
    await requestPasswordReset('  Sana@Example.com ');
    expect(backend.calls).toEqual(['reset:sana@example.com']);
  });

  it('refuses a bad address and a second request inside the cooldown', async () => {
    await expect(requestPasswordReset('not-an-email')).rejects.toThrow(/valid email/i);
    await requestPasswordReset('sana@example.com');
    await expect(requestPasswordReset('sana@example.com')).rejects.toThrow(/wait a minute/i);
    expect(backend.calls).toHaveLength(1);
  });

  it('checks the code, then sets the password, then signs in', async () => {
    const session = await resetPasswordWithCode({ email: 'sana@example.com', token: '123 456', newPassword: 'new-secret' });
    expect(backend.calls).toEqual(['verify:recovery:123456', 'update:new-secret']);
    expect(session.user.email).toBe('sana@example.com');
    expect(getAuthSession()?.token).toBe('jwt');
  });

  it('rejects a malformed code or short password before calling the server', async () => {
    await expect(resetPasswordWithCode({ email: 'sana@example.com', token: '12ab', newPassword: 'new-secret' })).rejects.toThrow(/6-digit/);
    await expect(resetPasswordWithCode({ email: 'sana@example.com', token: '123456', newPassword: 'abc' })).rejects.toThrow(/at least 6/);
    expect(backend.calls).toEqual([]);
  });

  it('does not set a password when the code is wrong', async () => {
    backend.state.verifyError = 'Token has expired or is invalid';
    await expect(resetPasswordWithCode({ email: 'sana@example.com', token: '123456', newPassword: 'new-secret' })).rejects.toThrow(/expired/);
    expect(backend.calls).toEqual(['verify:recovery:123456']);
    expect(getAuthSession()).toBeNull();
  });

  it('drops the session the code opened when the password is refused', async () => {
    backend.state.updateError = 'New password should be different from the old password.';
    await expect(resetPasswordWithCode({ email: 'sana@example.com', token: '123456', newPassword: 'old-secret' })).rejects.toThrow(/different/);
    expect(backend.calls).toEqual(['verify:recovery:123456', 'update:old-secret', 'signOut:local']);
    expect(getAuthSession()).toBeNull();
  });

  it('signs in with the new password in local mock mode, with no server call', async () => {
    backend.state.configured = false;
    const session = await resetPasswordWithCode({ email: 'sana@example.com', token: '123456', newPassword: 'new-secret' });
    expect(session.user.email).toBe('sana@example.com');
    expect(backend.calls).toEqual([]);
  });
});

describe('password reset errors and screens', () => {
  it('shows each failure in translated words, under the field it is about', () => {
    expect(authErrorKey('Token has expired or is invalid')).toBe('auth.errors.codeInvalid');
    expect(authErrorKey('Please enter a valid 6-digit verification code.')).toBe('auth.errors.codeInvalid');
    expect(authErrorKey('New password should be different from the old password.')).toBe('auth.errors.passwordSame');
    expect(authErrorKey('Password should be at least 6 characters')).toBe('auth.errors.passwordTooShort');
    expect(authErrorKey('For security purposes, you can only request this after 52 seconds.')).toBe('auth.errors.resetWait');
    expect(authFieldForKey('auth.errors.codeInvalid')).toBe('code');
    expect(authFieldForKey('auth.errors.passwordSame')).toBe('password');
    expect(authFieldForKey('auth.errors.resetWait')).toBeUndefined();
  });

  it('offers "Forgot password?" on sign-in only, and opens the email step of the reset', () => {
    initI18n('en');
    const render = (initialMode: 'login' | 'register' | 'forgot_password') =>
      renderToStaticMarkup(React.createElement(AuthScreen, { initialMode, onAuthSuccess: () => {} }));
    expect(render('login')).toContain('Forgot password?');
    expect(render('register')).not.toContain('Forgot password?');
    const reset = render('forgot_password');
    expect(reset).toContain('Reset your password');
    expect(reset).toContain('Send code');
    expect(reset).not.toContain('Remember me');
  });

  it('renders the reset form in Arabic', () => {
    initI18n('ar');
    const html = renderToStaticMarkup(
      React.createElement(PasswordResetForm, { initialEmail: 'sana@example.com', onBackToSignIn: () => {}, onDone: () => {} })
    );
    expect(html).toContain('إعادة تعيين كلمة المرور');
    expect(html).toContain('sana@example.com');
    initI18n('en');
  });
});
