import { AiProvider, AiProviderConfig } from './types.js';

const STORAGE_KEY_OPENAI = 'nutrio_api_key_openai';
const STORAGE_KEY_GEMINI = 'nutrio_api_key_gemini';
const STORAGE_KEY_ACTIVE_PROVIDER = 'nutrio_active_ai_provider';

let inMemoryOpenAiKey: string | null = null;
let inMemoryGeminiKey: string | null = null;
let inMemoryActiveProvider: AiProvider = 'auto';

export function getStoredOpenAiKey(): string | null {
  if (inMemoryOpenAiKey) return inMemoryOpenAiKey;

  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_OPENAI);
      if (stored) return stored;
    }
  } catch {
    // ignore storage access errors
  }

  return (
    (typeof process !== 'undefined' &&
      (process.env.EXPO_PUBLIC_OPENAI_API_KEY ||
        process.env.OPENAI_API_KEY)) ||
    null
  );
}

export function getStoredGeminiKey(): string | null {
  if (inMemoryGeminiKey) return inMemoryGeminiKey;

  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_GEMINI);
      if (stored) return stored;
    }
  } catch {
    // ignore storage access errors
  }

  return (
    (typeof process !== 'undefined' &&
      (process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
        process.env.GEMINI_API_KEY)) ||
    null
  );
}

export function saveOpenAiKey(key: string): void {
  inMemoryOpenAiKey = key.trim() || null;
  try {
    if (typeof localStorage !== 'undefined') {
      if (key.trim()) {
        localStorage.setItem(STORAGE_KEY_OPENAI, key.trim());
      } else {
        localStorage.removeItem(STORAGE_KEY_OPENAI);
      }
    }
  } catch {
    // ignore storage access errors
  }
}

export function saveGeminiKey(key: string): void {
  inMemoryGeminiKey = key.trim() || null;
  try {
    if (typeof localStorage !== 'undefined') {
      if (key.trim()) {
        localStorage.setItem(STORAGE_KEY_GEMINI, key.trim());
      } else {
        localStorage.removeItem(STORAGE_KEY_GEMINI);
      }
    }
  } catch {
    // ignore storage access errors
  }
}

export function getActiveAiProvider(): AiProvider {
  if (inMemoryActiveProvider !== 'auto') return inMemoryActiveProvider;

  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_ACTIVE_PROVIDER);
      if (stored === 'openai' || stored === 'gemini') return stored;
    }
  } catch {
    // ignore
  }

  // Auto-detect based on available keys
  if (getStoredOpenAiKey()) return 'openai';
  if (getStoredGeminiKey()) return 'gemini';
  return 'auto';
}

export function setActiveAiProvider(provider: AiProvider): void {
  inMemoryActiveProvider = provider;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_ACTIVE_PROVIDER, provider);
    }
  } catch {
    // ignore
  }
}

export function resolveAiConfig(): AiProviderConfig {
  const active = getActiveAiProvider();
  if (active === 'gemini') {
    const key = getStoredGeminiKey();
    return {
      provider: 'gemini',
      apiKey: key || undefined,
      model: 'gemini-1.5-flash',
    };
  }

  // Default to openai or auto
  const openAiKey = getStoredOpenAiKey();
  if (openAiKey) {
    return {
      provider: 'openai',
      apiKey: openAiKey,
      model: 'gpt-4o-mini',
    };
  }

  const geminiKey = getStoredGeminiKey();
  if (geminiKey) {
    return {
      provider: 'gemini',
      apiKey: geminiKey,
      model: 'gemini-1.5-flash',
    };
  }

  return {
    provider: 'auto',
  };
}
