import {
  DetectedFoodItem,
  ResolvedFoodItem,
  VisionConfidence,
  VisionResolutionResult,
} from './types.js';
import { SolverFoodCandidate } from './solver.js';

/**
 * Calculates a match score between a detected query and candidate food.
 */
function scoreFoodMatch(query: string, candidate: SolverFoodCandidate): number {
  const q = query.toLowerCase().trim();
  const cName = candidate.name.toLowerCase();
  const cUr = candidate.nameUr?.toLowerCase() || '';

  if (cName === q || cUr === q) return 1.0;
  if (cName.includes(q) || (cUr && cUr.includes(q))) return 0.9;
  if (q.includes(cName)) return 0.85;

  const queryWords = q.split(/\s+/).filter((w) => w.length > 2);
  if (queryWords.length === 0) return 0;

  let matches = 0;
  for (const word of queryWords) {
    if (cName.includes(word) || cUr.includes(word)) {
      matches++;
    }
  }

  return Number((matches / queryWords.length).toFixed(2));
}

/**
 * Resolves a single detected item against the food pool and determines exact portions.
 */
export function resolveDetectedFood(
  detected: DetectedFoodItem,
  foodPool: SolverFoodCandidate[]
): ResolvedFoodItem {
  let bestFood = foodPool[0];
  let bestScore = -1;

  for (const food of foodPool) {
    const score = scoreFoodMatch(detected.detectedName, food);
    if (score > bestScore) {
      bestScore = score;
      bestFood = food;
      if (score === 1.0) break;
    }
  }

  const defaultServing =
    bestFood.servings.find((s) => s.isDefault) || bestFood.servings[0] || {
      label: '1 standard serving',
      grams: 150,
    };

  let resolvedGrams = defaultServing.grams;
  let portionSource: ResolvedFoodItem['portionSource'] = 'default_serving';

  if (detected.estimatedGrams && detected.estimatedGrams > 0) {
    resolvedGrams = Math.round(detected.estimatedGrams);
    portionSource = 'detected_grams';
  } else if (detected.portionSize) {
    portionSource = 'portion_size';
    if (detected.portionSize === 'S') {
      resolvedGrams = Math.round(defaultServing.grams * 0.75);
    } else if (detected.portionSize === 'L') {
      resolvedGrams = Math.round(defaultServing.grams * 1.35);
    } else {
      resolvedGrams = defaultServing.grams;
    }
  }

  if (detected.servingMultiplier && detected.servingMultiplier > 0) {
    resolvedGrams = Math.round(resolvedGrams * detected.servingMultiplier);
  }

  const mult = resolvedGrams / 100;

  return {
    detectedName: detected.detectedName,
    matchedFoodName: bestFood.name,
    matchedFoodNameUr: bestFood.nameUr,
    category: bestFood.category,
    servingLabel: defaultServing.label,
    servingGrams: defaultServing.grams,
    resolvedGrams,
    calories: Math.round(bestFood.kcal100g * mult),
    proteinGrams: Number((bestFood.protein100g * mult).toFixed(1)),
    fatGrams: Number((bestFood.fat100g * mult).toFixed(1)),
    carbGrams: Number((bestFood.carb100g * mult).toFixed(1)),
    fibreGrams: Number((bestFood.fibre100g * mult).toFixed(1)),
    oilAddedG: Number(((bestFood.oilAddedG * resolvedGrams) / 100).toFixed(1)),
    matchScore: Math.max(0.2, bestScore),
    portionSource,
  };
}

/**
 * Resolves an entire photographed or voice-transcribed plate of food into grounded nutrients.
 * Applies learned calibration biases and computes a clinical confidence band.
 */
export function resolveDetectedPlate(
  detectedItems: DetectedFoodItem[],
  foodPool: SolverFoodCandidate[],
  calibrationFactors: Record<string, number> = {}
): VisionResolutionResult {
  const resolved = detectedItems.map((item) => {
    const res = resolveDetectedFood(item, foodPool);
    // Apply per-dish calibration multiplier if learned from user edits
    const calKey = Object.keys(calibrationFactors).find((k) =>
      res.matchedFoodName.toLowerCase().includes(k.toLowerCase())
    );
    if (calKey) {
      const factor = calibrationFactors[calKey];
      res.calories = Math.round(res.calories * factor);
      res.proteinGrams = Number((res.proteinGrams * factor).toFixed(1));
      res.fatGrams = Number((res.fatGrams * factor).toFixed(1));
      res.carbGrams = Number((res.carbGrams * factor).toFixed(1));
    }
    return res;
  });

  const totalCalories = resolved.reduce((s, i) => s + i.calories, 0);
  const totalProteinGrams = Number(
    resolved.reduce((s, i) => s + i.proteinGrams, 0).toFixed(1)
  );
  const totalFatGrams = Number(
    resolved.reduce((s, i) => s + i.fatGrams, 0).toFixed(1)
  );
  const totalCarbGrams = Number(
    resolved.reduce((s, i) => s + i.carbGrams, 0).toFixed(1)
  );
  const totalFibreGrams = Number(
    resolved.reduce((s, i) => s + i.fibreGrams, 0).toFixed(1)
  );
  const totalOilAddedG = Number(
    resolved.reduce((s, i) => s + i.oilAddedG, 0).toFixed(1)
  );

  // Confidence calculation
  const minScore =
    resolved.length > 0
      ? Math.min(...resolved.map((i) => i.matchScore))
      : 0;

  const hasSpecificPortions = resolved.every(
    (i) => i.portionSource === 'detected_grams' || i.portionSource === 'portion_size'
  );

  let confidence: VisionConfidence = 'low';
  let margin = 0.25; // ±25%

  if (minScore >= 0.85 && hasSpecificPortions) {
    confidence = 'high';
    margin = 0.1; // ±10%
  } else if (minScore >= 0.5) {
    confidence = 'medium';
    margin = 0.15; // ±15%
  }

  const minCal = Math.round(totalCalories * (1 - margin));
  const maxCal = Math.round(totalCalories * (1 + margin));
  const displayEstimate = `~${totalCalories} kcal (±${Math.round(margin * 100)}%)`;

  return {
    totalCalories,
    calorieBand: {
      min: minCal,
      max: maxCal,
      displayEstimate,
    },
    totalProteinGrams,
    totalFatGrams,
    totalCarbGrams,
    totalFibreGrams,
    totalOilAddedG,
    confidence,
    items: resolved,
  };
}
