import {
  adaptPlanForFamilyMode,
  generateRamadanPlan,
  solveDailyMealPlan,
} from '@nutrio/nutrition-core';
import { PAKISTANI_STAPLES_DATA } from '@nutrio/food-db';
import { MODELS } from '../_shared/models.js';
import {
  PlanGenerateRequest,
  PlanGenerateResponse,
  PlanGenerateResponseSchema,
} from './schema.js';

function generateFallbackNarrative(request: PlanGenerateRequest): {
  culturalNarrative: string;
  cookingAdvice: string;
  hydrationAdvice: string;
} {
  const isVeg = request.dietPreference === 'vegetarian_desi';
  const isRamadan = Boolean(request.isRamadanMode);

  let culturalNarrative = `This meal plan is tailored specifically to authentic Pakistani culinary traditions while hitting your nutritional targets within a strict 5% tolerance. Meals center around wholesome whole-wheat rotis, nutrient-dense daals, and high-protein gravies.`;
  if (isRamadan) {
    culturalNarrative = `Your Ramadan fasting plan is structured to provide steady energy across long fasts. Suhoor prioritizes slow-burning complex carbs and high-protein eggs, while Iftar emphasizes rehydration and lean proteins.`;
  } else if (isVeg) {
    culturalNarrative = `Your desi vegetarian plan combines wholesome lentils (daal chana, daal mash), paneer, and eggs/dairy for complete amino acid profiles without relying on expensive meats.`;
  }

  const cookingAdvice = `When preparing curries and daals, measure your cooking oil with a teaspoon (target 1-2 tsp per serving) rather than free-pouring. Avoid drowning cooked dishes in excess tari (surface oil).`;

  const hydrationAdvice = isRamadan
    ? `Drink 2.5–3.0 litres of water between Iftar and Suhoor in steady 500ml intervals. Avoid chugging over 1L right before Fajr.`
    : `Aim for 2.5 to 3.0 litres of water daily. Enjoy your afternoon chai without refined sugar or sweeten lightly with stevia.`;

  return {
    culturalNarrative,
    cookingAdvice,
    hydrationAdvice,
  };
}

export async function generateMealPlanService(
  request: PlanGenerateRequest,
  apiKey?: string
): Promise<PlanGenerateResponse> {
  // 1. Deterministic code constraint solver
  let plan = solveDailyMealPlan(
    {
      targetCalories: request.targetCalories,
      targetProteinGrams: request.targetProteinGrams,
      targetFatGrams: request.targetFatGrams,
      targetCarbGrams: request.targetCarbGrams,
      dietPreference: request.dietPreference,
      budgetTierPKR: request.budgetTierPKR,
      dislikedFoods: request.dislikedFoods,
      medicalConditions: request.medicalConditions,
    },
    PAKISTANI_STAPLES_DATA as any
  );

  let isFamilyActive = false;
  if (request.familyMode) {
    const familyAdapted = adaptPlanForFamilyMode(
      plan,
      {
        familyDishName: request.familyMode.familyDishName,
        familyMealSlot: request.familyMode.familyMealSlot,
      },
      {
        targetCalories: request.targetCalories,
        targetProteinGrams: request.targetProteinGrams,
        targetFatGrams: request.targetFatGrams,
        targetCarbGrams: request.targetCarbGrams,
        dietPreference: request.dietPreference,
        budgetTierPKR: request.budgetTierPKR,
      },
      PAKISTANI_STAPLES_DATA as any
    );
    plan = familyAdapted.plan;
    isFamilyActive = true;
  }

  const isRamadanActive = Boolean(request.isRamadanMode);

  // 2. Cultural narrative & cooking guidance
  let narrative = generateFallbackNarrative(request);
  let provider = 'deterministic_template';

  if (apiKey) {
    try {
      const systemPrompt = `You are a clinical nutrition and Pakistani culinary expert.
Write encouraging cultural commentary and practical desi cooking advice for this personalized meal plan.

CRITICAL RULES:
1. NEVER output or invent calorie or macronutrient numbers.
2. Focus on practical desi kitchen tips: controlling cooking oil (tari), using whole-grain chakki atta, pacing chai.
3. Output strictly valid JSON with keys: "culturalNarrative", "cookingAdvice", "hydrationAdvice".`;

      const userContent = JSON.stringify({
        dietPreference: request.dietPreference,
        budgetTier: request.budgetTierPKR,
        isRamadan: isRamadanActive,
        isFamilyMode: isFamilyActive,
        dishesPlanned: plan.meals.flatMap((m) => m.items.map((i) => i.foodName)),
      });

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODELS.GROQ.CHAT_NARRATIVE,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed.culturalNarrative && parsed.cookingAdvice) {
            narrative = {
              culturalNarrative: parsed.culturalNarrative,
              cookingAdvice: parsed.cookingAdvice,
              hydrationAdvice: parsed.hydrationAdvice || narrative.hydrationAdvice,
            };
            provider = 'groq_openai_gpt_oss_120b';
          }
        }
      }
    } catch {
      // Gracefully falls back to deterministic template narrative
    }
  }

  // 3. Strict schema validation
  const responseData: PlanGenerateResponse = {
    success: true,
    plan,
    culturalNarrative: narrative.culturalNarrative,
    cookingAdvice: narrative.cookingAdvice,
    hydrationAdvice: narrative.hydrationAdvice,
    isFamilyModeActive: isFamilyActive,
    isRamadanModeActive: isRamadanActive,
    provider,
  };

  return PlanGenerateResponseSchema.parse(responseData);
}
