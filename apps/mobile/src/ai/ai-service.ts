import { CoachContext } from '@nutrio/nutrition-core';
import { CoachChatMessage, CoachChatResult, CoachSwapRequest } from './types.js';
import { EdgeFunctionInvoker, invokeEdgeFunction } from './edgeFunctions.js';
import { i18n } from '../i18n/config.js';

// How much history each coach request carries. The coach-chat schema accepts
// up to 20 messages of 2000 chars, but the model runs on Groq's free tier
// (about 8K tokens/min and 200K tokens/day per account), so the client sends
// the recent conversation only.
const COACH_MAX_MESSAGES = 10;
const COACH_MAX_MESSAGE_CHARS = 1000;

// The server's canned reply when it has no provider key. It is Pakistan-only
// English, so the client's region-aware, translated fallback answers instead.
const SERVER_COACH_FALLBACK_PROVIDER = 'deterministic_coach_fallback';

// Keys that earlier builds stored on the device in plain text.
const LEGACY_AI_STORAGE_KEYS = [
  'nutrio_api_key_openai',
  'nutrio_api_key_gemini',
  'nutrio_active_ai_provider',
];

// This runs outside React, so it reads the shared i18n instance rather than
// the hook. Each topic owns a reply plus three follow-up prompts.
function fallbackTopic(key: string, vars?: Record<string, unknown>) {
  return {
    reply: i18n.t(`coach.fallback.${key}.reply`, vars ?? {}),
    suggestedPrompts: [
      i18n.t(`coach.fallback.${key}.prompts.one`),
      i18n.t(`coach.fallback.${key}.prompts.two`),
      i18n.t(`coach.fallback.${key}.prompts.three`),
    ],
  };
}

export function getFallbackCoachResponse(
  userQuery: string,
  context: CoachContext
): { reply: string; suggestedPrompts: string[] } {
  const query = userQuery.toLowerCase();
  const remaining = context.todaySummary?.remainingCalories ?? 500;
  const isSaudi = context.region === 'SA';


  // 1. AlBaik / Fast Food Advice
  if (query.includes('albaik') || query.includes('broast') || query.includes('nugget') || query.includes('kudu')) {
    return fallbackTopic('fastFood');
  }

  // 2. Kabsa / Mandi / Social Banquets
  if (
    query.includes('kabsa') ||
    query.includes('mandi') ||
    query.includes('saleeg') ||
    query.includes('madhbi') ||
    (isSaudi && (query.includes('rice') || query.includes('dawat') || query.includes('dinner')))
  ) {
    return fallbackTopic('banquet');
  }

  // 3. Saudi Gahwa & Dates
  if (query.includes('gahwa') || query.includes('coffee') || query.includes('date') || query.includes('tamr')) {
    return fallbackTopic('gahwa');
  }

  // 4. Pakistani Oil Reduction
  if (query.includes('oil') || query.includes('karahi') || query.includes('tel') || query.includes('ghee')) {
    return fallbackTopic('cookingOil');
  }

  // 5. Pakistani Shaadi / Dawat
  if (query.includes('shaadi') || query.includes('dawat') || query.includes('buffet') || query.includes('party')) {
    return fallbackTopic('dawat');
  }

  // 6. Pakistani Chai
  if (query.includes('chai') || query.includes('tea') || query.includes('doodh patti')) {
    return fallbackTopic('chai');
  }

  // Default regional greeting
  return fallbackTopic(isSaudi ? 'greetingSA' : 'greetingPK', {
    name: context.displayName || i18n.t('coach.defaultName'),
    remaining,
  });
}

interface CoachEdgeResponse {
  reply: string;
  suggestedPrompts: string[];
  provider: string;
  proposedSwap?: unknown;
}

/** The server's proposal, kept only when it names one of the candidates this request sent. */
function proposedSwapFrom(value: unknown, swapRequest: CoachSwapRequest | undefined): CoachChatResult['proposedSwap'] {
  if (!swapRequest || !value || typeof value !== 'object') return undefined;
  const { toId, reason } = value as Record<string, unknown>;
  if (typeof toId !== 'string' || !swapRequest.candidates.some((c) => c.id === toId)) return undefined;
  return { toId, reason: typeof reason === 'string' ? reason : '' };
}

function isCoachEdgeResponse(value: unknown): value is CoachEdgeResponse {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.reply === 'string' &&
    v.reply.trim().length > 0 &&
    typeof v.provider === 'string' &&
    Array.isArray(v.suggestedPrompts) &&
    v.suggestedPrompts.every((p) => typeof p === 'string')
  );
}

/** Shapes the chat history to what the coach-chat request schema accepts. */
function toCoachRequestMessages(
  messages: CoachChatMessage[]
): { role: 'user' | 'assistant'; content: string }[] {
  return messages
    .filter(
      (m): m is CoachChatMessage & { role: 'user' | 'assistant' } =>
        m.role !== 'system' && m.content.trim().length > 0
    )
    .slice(-COACH_MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, COACH_MAX_MESSAGE_CHARS) }));
}

/**
 * Sends the conversation to the coach-chat edge function, which holds the
 * provider key and applies the clinical safety filter. Falls back to the
 * built-in, translated coach when the backend is unreachable or has no model.
 */
export async function sendCoachMessage(
  messages: CoachChatMessage[],
  context: CoachContext,
  invoke: EdgeFunctionInvoker = invokeEdgeFunction,
  swapRequest?: CoachSwapRequest
): Promise<CoachChatResult> {
  const requestMessages = toCoachRequestMessages(messages);
  const lastUserMsg =
    [...requestMessages].reverse().find((m) => m.role === 'user')?.content || '';

  if (requestMessages.length > 0) {
    try {
      const response = await invoke('coach-chat', { messages: requestMessages, context, ...(swapRequest ? { swapRequest } : {}) });
      if (isCoachEdgeResponse(response) && response.provider !== SERVER_COACH_FALLBACK_PROVIDER) {
        const proposedSwap = proposedSwapFrom(response.proposedSwap, swapRequest);
        return {
          reply: response.reply,
          suggestedPrompts: response.suggestedPrompts.slice(0, 3),
          providerUsed: 'edge_function',
          ...(proposedSwap ? { proposedSwap } : {}),
        };
      }
      if (!isCoachEdgeResponse(response)) {
        console.warn('[ai-service] coach-chat returned an unexpected body; using fallback.');
      }
    } catch (err) {
      console.warn('[ai-service] coach-chat failed; using fallback:', (err as Error)?.message);
    }
  }

  // Offline about an exercise: point to the Swap menu, which works without the coach.
  const fallback = swapRequest ? fallbackTopic('swapTopic') : getFallbackCoachResponse(lastUserMsg, context);
  return {
    reply: fallback.reply,
    suggestedPrompts: fallback.suggestedPrompts,
    providerUsed: 'deterministic_fallback',
  };
}

// Merely touching localStorage throws when site data is blocked.
function deviceLocalStorage(): Storage | undefined {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Removes the provider keys and choice that earlier builds saved on the device
 * in plain text. Safe to call on every launch.
 */
export function purgeLegacyAiKeys(
  storage: Pick<Storage, 'removeItem'> | undefined = deviceLocalStorage()
): void {
  if (!storage) return;
  for (const key of LEGACY_AI_STORAGE_KEYS) {
    try {
      storage.removeItem(key);
    } catch {
      // Storage can be blocked (private mode); nothing was readable there either.
    }
  }
}
