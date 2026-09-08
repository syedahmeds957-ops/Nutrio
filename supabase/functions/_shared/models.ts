/**
 * Central Model Configuration
 * Enforces Standing Instruction: No inline model strings in feature code.
 * Pinned per GROQ_OPENROUTER_FINDINGS.md (Aug 2026).
 */
export const MODELS = {
  GROQ: {
    // Coach chat, onboarding plan narratives
    CHAT_NARRATIVE: 'openai/gpt-oss-120b',
    // Meal text parsing, classifier, fast extraction
    TEXT_FAST: 'openai/gpt-oss-20b',
    // Vision meal estimation (Preview - verified before releases)
    VISION_PREVIEW: 'qwen/qwen3.6-27b',
  },
  OPENROUTER: {
    // Paid ZDR-only gateway fallbacks
    VISION_FALLBACK_MINI: 'openai/gpt-5-mini',
    VISION_FALLBACK_FLASH: 'google/gemini-3.1-flash-lite',
  },
} as const;
