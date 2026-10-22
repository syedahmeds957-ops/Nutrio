import { DishBreakdownRequestSchema } from './schema.js';
import { breakDownDish } from './breakdown.js';
import { isSignedInUser } from '../_shared/auth.js';
import { UsdaDatabase } from './usda.js';

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });

const env = (name: string) =>
  (typeof Deno !== 'undefined' ? Deno.env.get(name) : process.env[name]) || undefined;

/**
 * The project's API and a service key for the imported USDA foods. Supabase
 * injects both into every function: the secret key (`SUPABASE_SECRET_KEYS`,
 * JSON keyed by name) where the project has one, else the legacy service-role
 * key, which stops working at the end of 2026.
 */
export function usdaDatabaseFromEnv(): UsdaDatabase | undefined {
  const url = env('SUPABASE_URL');
  let key: string | undefined;
  try {
    const secret = JSON.parse(env('SUPABASE_SECRET_KEYS') ?? '{}').default;
    if (typeof secret === 'string' && secret) key = secret;
  } catch {
    // Malformed: fall through to the legacy key.
  }
  key ??= env('SUPABASE_SERVICE_ROLE_KEY');
  return url && key ? { url, key } : undefined;
}

export async function handleDishBreakdownRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }
  // Each call spends the shared Groq quota, so the public anon key is not enough.
  if (!isSignedInUser(req)) {
    return json({ error: 'Sign in to add a dish' }, 401);
  }

  try {
    const validation = DishBreakdownRequestSchema.safeParse(await req.json());
    if (!validation.success) {
      return json({ error: 'Invalid request payload', details: validation.error.flatten() }, 400);
    }

    const apiKey = env('GROQ_API_KEY');
    if (!apiKey) {
      return json({ error: 'Dish lookup is not configured' }, 503);
    }

    // The imported USDA foods value ingredients the app's catalogue lacks.
    // Without database access those are reported as not counted, not estimated.
    const outcome = await breakDownDish(validation.data, { groq: apiKey, usda: usdaDatabaseFromEnv() });
    if (outcome.kind === 'unknown_dish') {
      return json({ error: 'Dish not recognised', code: 'unknown_dish' }, 422);
    }
    if (outcome.kind === 'failed') {
      return json({ error: 'Could not break the dish down', code: 'failed' }, 502);
    }
    return json(outcome.response, 200);
  } catch (err: any) {
    return json({ error: 'Internal server error', message: err?.message || String(err) }, 500);
  }
}

if (typeof Deno !== 'undefined') {
  (Deno as any).serve(handleDishBreakdownRequest);
}
