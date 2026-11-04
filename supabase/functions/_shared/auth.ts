/**
 * The role claim of the caller's JWT, or null when there is none.
 *
 * The gateway has already verified the signature (verify_jwt), so the payload
 * can be read as-is. It does not check *who* the token belongs to: the public
 * anon key is a valid JWT too, which is why functions that spend a shared
 * quota must also require a signed-in user.
 */
export function callerRole(req: Request): string | null {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : '';
  const payload = token.split('.')[1];
  if (!payload) return null;

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')));
    return typeof claims.role === 'string' ? claims.role : null;
  } catch {
    return null;
  }
}

/** True only for a signed-in user's token, not the anon or service keys. */
export function isSignedInUser(req: Request): boolean {
  return callerRole(req) === 'authenticated';
}
