/**
 * Central Model Configuration
 * Enforces Standing Instruction: No inline model strings in feature code.
 * Pinned per docs/planning/GROQ_OPENROUTER_FINDINGS.md (Aug 2026).
 */
export const MODELS = {
  GROQ: {
    // Coach chat, onboarding plan narratives
    CHAT_NARRATIVE: 'openai/gpt-oss-120b',
    // Meal text parsing, classifier, fast extraction
    TEXT_FAST: 'openai/gpt-oss-20b',
    // Breaking an unknown dish into catalogue ingredients. Must support Groq's
    // server-side browser_search tool (gpt-oss-20b / gpt-oss-120b only).
    DISH_RESEARCH: 'openai/gpt-oss-120b',
    // Nutrition-label OCR (Preview - verified before releases). Meal photo
    // estimation was removed; this reads printed labels only.
    VISION_PREVIEW: 'qwen/qwen3.6-27b',
  },
} as const;
