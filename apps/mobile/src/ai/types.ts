/**
 * Where an AI answer came from: the server-side edge function (which holds the
 * provider key), or the on-device deterministic fallback.
 */
export type AiAnswerSource = 'edge_function' | 'deterministic_fallback';

export interface CoachChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CoachChatResult {
  reply: string;
  suggestedPrompts: string[];
  providerUsed: AiAnswerSource;
  /** A swap the coach proposes; always one of the request's candidates, applied only if the user taps Apply. */
  proposedSwap?: { toId: string; reason: string };
}

/** The exercise a chat is about, and the only swaps the app allows for it. */
export interface CoachSwapRequest {
  exerciseId: string;
  exerciseName: string;
  candidates: { id: string; name: string; jointLoads: string[] }[];
}
