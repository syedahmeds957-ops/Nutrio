import { DishBreakdownRequestSchema } from './schema.js';
import { breakDownDish } from './breakdown.js';
import { isSignedInUser } from '../_shared/auth.js';

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });

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

    const apiKey =
      (typeof Deno !== 'undefined' ? Deno.env.get('GROQ_API_KEY') : process.env.GROQ_API_KEY) ||
      undefined;
    if (!apiKey) {
      return json({ error: 'Dish lookup is not configured' }, 503);
    }

    const outcome = await breakDownDish(validation.data, apiKey);
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
