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
