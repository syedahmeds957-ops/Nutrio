import { MODELS } from '../_shared/models.js';
import { AssessmentNarrative, AssessmentNarrativeSchema } from '../_shared/schema.js';
import { generateFallbackNarrative, NarrativeTemplateInput } from '../_shared/template-narrative.js';

export interface GroqAssessmentInput extends NarrativeTemplateInput {
  display_name?: string;
  dietPreference?: string;
  budgetTier?: string;
}

export interface GroqAssessmentResult {
  narrative: AssessmentNarrative;
  generatedBy: 'groq_llm' | 'deterministic_fallback';
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  latencyMs: number;
}

const SYSTEM_PROMPT = `You are a clinical and cultural nutrition analyst for Nutrio, specialized in South Asian / Pakistani dietetics.
Your job is to explain and contextualize deterministic target numbers that have ALREADY been calculated by our clinical engine.

NON-NEGOTIABLE RULES:
1. NEVER recalculate or invent calorie numbers. The provided numbers are immutable ground truth.
2. Provide compassionate, culturally attuned, actionable lifestyle advice (e.g. daily sweetened chai impact, desi cooking oil awareness, roti/naan portioning, sitting hours, sleep).
3. Output STRICT JSON adhering exactly to the specified JSON schema. No free text, no markdown wrappers.`;

export async function requestAssessmentNarrative(
  input: GroqAssessmentInput,
  apiKey?: string
): Promise<GroqAssessmentResult> {
  const startTime = Date.now();

  // If no Groq API key is available (e.g. local dev before key setup), immediately use deterministic fallback
  if (!apiKey) {
    const fallback = generateFallbackNarrative(input);
    return {
      narrative: fallback,
      generatedBy: 'deterministic_fallback',
      latencyMs: Date.now() - startTime,
    };
  }

  const userPrompt = JSON.stringify({
    task: 'Generate cultural and lifestyle assessment narrative',
    groundTruthTargets: {
      bmrKcal: input.bmr,
      tdeeKcal: input.tdee,
      recommendedTargetKcal: input.targetKcal,
      dailyDeficitOrSurplusKcal: input.tdee - input.targetKcal,
    },
    userContext: {
      biologicalSex: input.sex,
      ageYears: input.ageYears,
      weightKg: input.weightKg,
      dailySweetenedChaiCups: input.chaiCupsPerDay,
      dailyChaiSugarKcal: input.dailyChaiSugarKcal,
      dailySittingHours: input.sittingHours,
      sleepHoursPerNight: input.sleepHours,
      shiftPattern: input.shiftPattern,
      dietPreference: input.dietPreference,
      budgetTier: input.budgetTier,
    },
    requiredJsonSchema: {
      summary: 'Concise summary of their metabolic baseline (20-500 chars)',
      whyThisNumber: 'Why this caloric target preserves muscle and is safe (20-600 chars)',
      highestLeverageChanges: ['Actionable lever 1', 'Actionable lever 2', 'Actionable lever 3'],
      culturalLifestyleInsight: 'Pakistani cultural lifestyle insight (20-500 chars)',
      weekByWeekExpectation: 'Honest timeline expectation (20-500 chars)',
    },
  });

  // Function to perform model invocation
  const callGroq = async (): Promise<AssessmentNarrative | null> => {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODELS.GROQ.CHAT_NARRATIVE,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        return null;
      }

      const json = await response.json();
      const content = json.choices?.[0]?.message?.content;
      if (!content) return null;

      const parsed = JSON.parse(content);
      const validation = AssessmentNarrativeSchema.safeParse(parsed);
      return validation.success ? validation.data : null;
    } catch {
      return null;
    }
  };

  // Attempt 1
  let narrative = await callGroq();

  // Retry once if validation or network failed
  if (!narrative) {
    narrative = await callGroq();
  }

  const latencyMs = Date.now() - startTime;

  if (narrative) {
    return {
      narrative,
      generatedBy: 'groq_llm',
      latencyMs,
    };
  }

  // Graceful fallback to deterministic templated narrative
  return {
    narrative: generateFallbackNarrative(input),
    generatedBy: 'deterministic_fallback',
    latencyMs,
  };
}
