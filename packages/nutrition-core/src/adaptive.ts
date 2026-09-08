import { AdaptiveTDEEInput, AdaptiveTDEEResult } from './types.js';

export const EWMA_ALPHA = 0.25; // Smoothing factor for bodyweight fluctuations
export const KCAL_PER_KG_BODYWEIGHT = 7700;
export const MAX_WEEKLY_ADJUSTMENT_KCAL = 150; // Cap to prevent whipsawing

/**
 * Calculates Exponentially Weighted Moving Average (EWMA) of weigh-ins
 */
export function calculateEWMA(
  weights: number[],
  initialEWMA?: number,
  alpha = EWMA_ALPHA
): number[] {
  if (weights.length === 0) return [];
  const results: number[] = [];
  let current = initialEWMA ?? weights[0];
  results.push(Number(current.toFixed(2)));

  for (let i = 1; i < weights.length; i++) {
    current = alpha * weights[i] + (1 - alpha) * current;
    results.push(Number(current.toFixed(2)));
  }

  return results;
}

/**
 * Recomputes Adaptive TDEE based on logged caloric intake and EWMA-smoothed weight trend.
 * Enforces the closed-loop feedback algorithm from NUTRITION_APP_PLAN §5.5.
 */
export function calculateAdaptiveTDEE(input: AdaptiveTDEEInput): AdaptiveTDEEResult {
  const { formulaTDEE, bmr, dailyWeighInsKg, dailyIntakeKcal, previousEWMAWeightKg } =
    input;

  const daysLogged = Math.min(dailyWeighInsKg.length, dailyIntakeKcal.length);

  if (daysLogged < 7) {
    // Insufficient data window (requires at least 7 days of logs)
    return {
      currentEWMAWeightKg: dailyWeighInsKg[dailyWeighInsKg.length - 1]?.weightKg ?? 0,
      weightDeltaKg: 0,
      daysLogged,
      meanDailyIntake:
        dailyIntakeKcal.length > 0
          ? Math.round(
              dailyIntakeKcal.reduce((sum, d) => sum + d.kcal, 0) /
                dailyIntakeKcal.length
            )
          : 0,
      blendedTDEE: formulaTDEE,
      weightFactor: 0,
      isUnderLogging: false,
      recommendedKcalDelta: 0,
      explanation: `Need at least 7 days of logging to compute adaptive TDEE (currently ${daysLogged} days logged). Using formula TDEE.`,
    };
  }

  // 1. Compute EWMA weights
  const rawWeights = dailyWeighInsKg.map((d) => d.weightKg);
  const ewmaSeries = calculateEWMA(rawWeights, previousEWMAWeightKg);
  const currentEWMA = ewmaSeries[ewmaSeries.length - 1];
  const startEWMA = ewmaSeries[0];
  const weightDeltaKg = Number((currentEWMA - startEWMA).toFixed(2));

  // 2. Compute Mean Daily Intake
  const totalIntake = dailyIntakeKcal.reduce((sum, d) => sum + d.kcal, 0);
  const meanDailyIntake = Math.round(totalIntake / dailyIntakeKcal.length);

  // 3. Compute Observed TDEE over n days
  // TDEE_observed = mean_daily_intake - (delta_weight_kg * 7700) / n
  const observedTDEE = Math.round(
    meanDailyIntake - (weightDeltaKg * KCAL_PER_KG_BODYWEIGHT) / daysLogged
  );

  // 4. Check for under-logging (observed < 1.1 * BMR)
  const underLoggingThreshold = Math.round(1.1 * bmr);
  const isUnderLogging = observedTDEE < underLoggingThreshold;

  // 5. Weighting Factor: w = min(0.9, days_logged / 28)
  const weightFactor = Number(Math.min(0.9, daysLogged / 28).toFixed(2));

  // 6. Blended TDEE: if under-logging, ignore observed TDEE to avoid dangerously slashing calories
  let blendedTDEE = formulaTDEE;
  let explanation = '';

  if (isUnderLogging) {
    blendedTDEE = formulaTDEE;
    explanation =
      'Observed expenditure is implausibly low (<1.1x BMR), indicating unlogged meals. Calorie targets will not be cut.';
  } else {
    blendedTDEE = Math.round(
      weightFactor * observedTDEE + (1 - weightFactor) * formulaTDEE
    );
    explanation = `Adaptive TDEE blended: ${(weightFactor * 100).toFixed(
      0
    )}% observed (${observedTDEE} kcal) + ${(
      (1 - weightFactor) *
      100
    ).toFixed(0)}% formula (${formulaTDEE} kcal).`;
  }

  // 7. Clamp weekly target changes to +/- 150 kcal/week
  const rawDelta = blendedTDEE - formulaTDEE;
  const recommendedKcalDelta = Math.max(
    -MAX_WEEKLY_ADJUSTMENT_KCAL,
    Math.min(MAX_WEEKLY_ADJUSTMENT_KCAL, rawDelta)
  );

  return {
    currentEWMAWeightKg: currentEWMA,
    weightDeltaKg,
    daysLogged,
    meanDailyIntake,
    observedTDEE,
    blendedTDEE,
    weightFactor,
    isUnderLogging,
    recommendedKcalDelta,
    explanation,
  };
}
