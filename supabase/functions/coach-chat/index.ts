import { CoachChatRequestSchema } from './schema.js';
import { coachChatService } from './service.js';

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

export async function handleCoachChatRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: CORS_HEADERS,
    });
  }

  try {
    const rawBody = await req.json();
    const validation = CoachChatRequestSchema.safeParse(rawBody);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request payload',
          details: validation.error.flatten(),
        }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const apiKey =
      (typeof Deno !== 'undefined'
        ? Deno.env.get('GROQ_API_KEY')
        : process.env.GROQ_API_KEY) || undefined;

    const result = await coachChatService(validation.data, apiKey);

    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: 'Internal server error in coach chat',
        message: err?.message || String(err),
      }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

if (typeof Deno !== 'undefined') {
  (Deno as any).serve(handleCoachChatRequest);
}
