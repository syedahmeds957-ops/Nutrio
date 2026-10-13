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
}
