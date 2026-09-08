import { calculateAdaptiveTDEE } from '@nutrio/nutrition-core';
import { MODELS } from '../_shared/models.js';
import {
  WeeklyReviewRequest,
  WeeklyReviewResponse,
  WeeklyReviewResponseSchema,
} from './schema.js';

export async function generateWeeklyReviewService(
  request: WeeklyReviewRequest,
  apiKey?: string
): Promise<WeeklyReviewResponse> {
  const adaptiveResult = calculateAdaptiveTDEE({
    formulaTDEE: request.currentTDEE,
    bmr: request.bmr,
    dailyWeighInsKg: request.dailyWeights,
    dailyIntakeKcal: request.dailyIntakes,
    previousEWMAWeightKg: request.previousEWMAWeightKg,
  });

  const oldTDEE = request.currentTDEE;
  const newTDEE = adaptiveResult.blendedTDEE;
  const tdeeDelta = newTDEE - oldTDEE;

  const oldKcalTarget = request.currentKcalTarget;
  const newKcalTarget = Math.max(
    request.bmr,
    Math.round(oldKcalTarget + adaptiveResult.recommendedKcalDelta)
  );
  const targetDelta = newKcalTarget - oldKcalTarget;

  // Calculate adherence rate (% of days logged within ±10% of target)
  let onTargetDays = 0;
  for (const intake of request.dailyIntakes) {
    const diff = Math.abs(intake.kcal - oldKcalTarget);
    if (diff <= oldKcalTarget * 0.1) {
      onTargetDays++;
    }
  }
  const adherenceRatePct =
    request.dailyIntakes.length > 0
      ? Math.round((onTargetDays / request.dailyIntakes.length) * 100)
      : 0;

  let headline =
    targetDelta !== 0
      ? `Weekly Recalibration: ${targetDelta > 0 ? `+${targetDelta}` : targetDelta} kcal/day`
      : 'Weekly Check-In: Targets Maintained';

  let summaryText = `Over the past week, you logged ${adaptiveResult.daysLogged} days with an average daily intake of ${adaptiveResult.meanDailyIntake} kcal.
Your trend weight changed by ${adaptiveResult.weightDeltaKg >= 0 ? `+${adaptiveResult.weightDeltaKg}` : adaptiveResult.weightDeltaKg} kg.
Based on your true metabolic response, your daily energy target is adjusted to ${newKcalTarget} kcal.`;

  let keyActionLever =
    'Measure cooking oil with a spoon in handi recipes to keep intake predictable.';
  let provider = 'deterministic_weekly_engine';

  if (apiKey) {
    try {
      const prompt = `You are a clinical nutritionist writing a personalized weekly check-in review for a Pakistani nutrition app user named ${request.displayName || 'Client'}.

METRIC FACTS (DO NOT MODIFY NUMBERS):
- Days logged: ${adaptiveResult.daysLogged}
- Average daily intake: ${adaptiveResult.meanDailyIntake} kcal
- Target intake: ${oldKcalTarget} kcal (Adherence rate: ${adherenceRatePct}%)
- Weight trend shift (EWMA): ${adaptiveResult.weightDeltaKg} kg
- New adaptive calorie target: ${newKcalTarget} kcal (${targetDelta >= 0 ? `+${targetDelta}` : targetDelta} kcal change)
- Goal: ${request.goal}

TASK:
Write a warm, motivating, culturally relevant 2-paragraph summary explaining why the target shifted, and 1 specific actionable habit lever for the coming week (e.g. measuring oil in karahi, pacing water intake, protein with breakfast).

OUTPUT STRICT JSON FORMAT:
{
  "headline": "Short punchy title",
  "summaryText": "Two concise paragraphs explaining progress and metabolism",
  "keyActionLever": "Single specific desi habit recommendation"
}`;

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODELS.GROQ.CHAT_NARRATIVE,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_tokens: 400,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed.headline && parsed.summaryText && parsed.keyActionLever) {
            headline = String(parsed.headline);
            summaryText = String(parsed.summaryText);
            keyActionLever = String(parsed.keyActionLever);
            provider = 'groq_adaptive_narrative';
          }
        }
      }
    } catch {
      // Fallback preserved
    }
  }

  const response: WeeklyReviewResponse = {
    success: true,
    metrics: {
      daysLogged: adaptiveResult.daysLogged,
      meanDailyIntake: adaptiveResult.meanDailyIntake,
      currentEWMAWeightKg: adaptiveResult.currentEWMAWeightKg,
      weightDeltaKg: adaptiveResult.weightDeltaKg,
      adherenceRatePct,
      oldTDEE,
      newTDEE,
      tdeeDelta,
      oldKcalTarget,
      newKcalTarget,
      targetDelta,
    },
    narrative: {
      headline,
      summaryText,
      keyActionLever,
    },
    provider,
  };

  return WeeklyReviewResponseSchema.parse(response);
}
