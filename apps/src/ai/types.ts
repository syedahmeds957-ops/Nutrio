import { CoachContext } from '@nutrio/nutrition-core';

export type AiProvider = 'openai' | 'gemini' | 'auto';

export interface AiProviderConfig {
  provider: AiProvider;
  apiKey?: string;
  model?: string;
}

export interface VisionDetectedItem {
  detectedName: string;
  estimatedGrams: number;
}

export interface PhotoAnalysisResult {
  dishDetected: string;
  cookingMethod: string;
  detectedItems: VisionDetectedItem[];
  providerUsed: 'openai' | 'gemini' | 'deterministic_fallback';
}

export interface CoachChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CoachChatResult {
  reply: string;
  suggestedPrompts: string[];
  providerUsed: 'openai' | 'gemini' | 'deterministic_fallback';
}
