import {
  DetectedFoodItem,
  resolveDetectedPlate,
} from '@nutrio/nutrition-core';
import { PAKISTANI_STAPLES_DATA } from '@nutrio/food-db';
import { MODELS } from '../_shared/models.js';
import {
  DetectedVisionItem,
  EstimatePhotoRequest,
  EstimatePhotoResponse,
  EstimatePhotoResponseSchema,
} from './schema.js';

function getFallbackVisionDetection(contextNote?: string): {
  dishDetected: string;
  cookingMethod: string;
  detectedItems: DetectedVisionItem[];
} {
  const note = (contextNote || '').toLowerCase();

  if (note.includes('biryani') || note.includes('pulao')) {
    return {
      dishDetected: 'Chicken Biryani',
      cookingMethod: 'Dum cooked layered basmati rice with chicken',
      detectedItems: [
        { detectedName: 'Chicken Biryani (Karachi Style)', estimatedGrams: 350 },
      ],
    };
  }

  if (note.includes('daal') || note.includes('lentil')) {
    return {
      dishDetected: 'Daal Chana & Roti',
      cookingMethod: 'Tarka tempered lentils with tandoor roti',
      detectedItems: [
        { detectedName: 'Daal Chana Tadka', estimatedGrams: 150 },
        { detectedName: 'Roti / Chapati (Whole Wheat)', estimatedGrams: 90 },
      ],
    };
  }

  // Default standard Pakistani plate
  return {
    dishDetected: 'Chicken Karahi & Whole Wheat Roti',
    cookingMethod: 'Wok-seared in tomato-ginger masala with whole wheat roti',
    detectedItems: [
      { detectedName: 'Chicken Karahi', estimatedGrams: 200 },
      { detectedName: 'Roti / Chapati (Whole Wheat)', estimatedGrams: 90 },
    ],
  };
}

export async function estimatePhotoService(
  request: EstimatePhotoRequest,
  apiKey?: string
): Promise<EstimatePhotoResponse> {
  let detected = getFallbackVisionDetection(request.contextNote);
  let provider = 'deterministic_vision_mock';

  if (apiKey) {
    try {
      const systemPrompt = `You are a specialized Pakistani and South Asian culinary vision expert.
Analyze this meal photo and identify the dish, cooking technique, and estimated grams for each food item.

CRITICAL RULES:
1. NEVER output or estimate calorie numbers or macronutrient numbers.
2. Estimate the mass in grams for each food component.
3. Output strictly valid JSON with keys:
{
  "dishDetected": "Name of main dish",
  "cookingMethod": "Description of preparation (e.g. tarka tempered, karahi shallow fried, tandoor baked)",
  "items": [
    { "detectedName": "Chicken Karahi", "estimatedGrams": 200 },
    { "detectedName": "Roti", "estimatedGrams": 90 }
  ]
}`;

      // Normalize base64 URL
      const imageUrl = request.imageBase64.startsWith('data:')
        ? request.imageBase64
        : `data:image/jpeg;base64,${request.imageBase64}`;

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODELS.GROQ.VISION_PREVIEW,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this food photo. Reference object: ${request.referenceObject || 'none'}. Context: ${request.contextNote || 'none'}.`,
                },
                {
                  type: 'image_url',
                  image_url: { url: imageUrl },
                },
              ],
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_tokens: 400,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
            detected = {
              dishDetected: String(parsed.dishDetected || 'Pakistani Meal Plate'),
              cookingMethod: String(parsed.cookingMethod || 'Authentic desi preparation'),
              detectedItems: parsed.items.map((i: any) => ({
                detectedName: String(i.detectedName || i.name),
                estimatedGrams: i.estimatedGrams ? Number(i.estimatedGrams) : undefined,
                portionSize: i.portionSize,
              })),
            };
            provider = 'groq_qwen_vision';
          }
        }
      }
    } catch {
      // Gracefully fall back to deterministic mock
    }
  }

  // Ground against verified Pakistani database via nutrition-core resolver
  const solverItems: DetectedFoodItem[] = detected.detectedItems.map((i) => ({
    detectedName: i.detectedName,
    estimatedGrams: i.estimatedGrams,
    portionSize: i.portionSize,
  }));

  const resolution = resolveDetectedPlate(
    solverItems,
    PAKISTANI_STAPLES_DATA as any,
    request.calibrationFactors || {}
  );

  const response: EstimatePhotoResponse = {
    success: true,
    dishDetected: detected.dishDetected,
    cookingMethod: detected.cookingMethod,
    detectedItems: detected.detectedItems,
    resolution,
    provider,
  };

  return EstimatePhotoResponseSchema.parse(response);
}
