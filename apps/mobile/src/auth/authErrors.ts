/**
 * The sign-in code throws plain English errors (and Supabase adds its own).
 * The screen must not show them as they are: Saudi Arabia reads Arabic only.
 * This maps a thrown message to a translation key; anything unrecognised gets
 * the generic, translated message instead of raw server English.
 */
const RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/unable to reach authentication server|network request failed|failed to fetch/i, 'auth.errors.network'],
  [/invalid email or password|invalid login credentials/i, 'auth.errors.invalidCredentials'],
  [/password must be at least/i, 'auth.errors.passwordTooShort'],
  [/name is required/i, 'auth.errors.nameRequired'],
  [/valid email address is required|email address is required/i, 'auth.errors.emailRequired'],
  [/already registered|already exists/i, 'auth.errors.alreadyRegistered'],
  [/email not confirmed/i, 'auth.errors.emailNotConfirmed'],
  [/no (active )?session/i, 'auth.errors.noSession'],
];

export function authErrorKey(message: string | undefined): string {
  const text = message ?? '';
  for (const [pattern, key] of RULES) {
    if (pattern.test(text)) return key;
  }
  return 'auth.genericError';
}

export type AuthField = 'name' | 'email' | 'password';
export type AuthFieldErrors = Partial<Record<AuthField, string>>;

const FIELD_FOR_KEY: Readonly<Record<string, AuthField>> = {
  'auth.errors.nameRequired': 'name',
  'auth.errors.emailRequired': 'email',
  'auth.errors.passwordTooShort': 'password',
};

/** The form field an error key belongs under, or undefined when it is about the whole attempt (banner). */
export function authFieldForKey(key: string): AuthField | undefined {
  return FIELD_FOR_KEY[key];
}

/**
 * Checks the form before it is sent, the same rules the sign-in code applies
 * (authStorage), so each problem shows under its own field. Values are
 * translation keys. Signing in only checks that something was entered: a wrong
 * password is the server's call and stays a banner.
 */
export function validateAuthFields(
  mode: 'login' | 'register',
  values: { name: string; email: string; password: string }
): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const email = values.email.trim();
  if (mode === 'register' && !values.name.trim()) errors.name = 'auth.errors.nameRequired';
  if (!email || !email.includes('@') || !email.includes('.')) errors.email = 'auth.errors.emailRequired';
  if (mode === 'register' && values.password.length < 6) errors.password = 'auth.errors.passwordTooShort';
  if (mode === 'login' && values.password.length === 0) errors.password = 'auth.errors.passwordRequired';
  return errors;
}
