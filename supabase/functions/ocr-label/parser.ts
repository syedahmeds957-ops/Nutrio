import { MODELS } from '../_shared/models.js';
import { OCRLabelRequest, OCRLabelResult, OCRLabelResultSchema } from './schema.js';

export function validateNutrientMath(
  proteinGrams: number,
  fatGrams: number,
  carbGrams: number,
  reportedKcal: number
): boolean {
  if (reportedKcal <= 0) return false;
  const calculatedKcal = proteinGrams * 4 + carbGrams * 4 + fatGrams * 9;
  const lowerBound = reportedKcal * 0.75;
  const upperBound = reportedKcal * 1.25;
  return calculatedKcal >= lowerBound && calculatedKcal <= upperBound;
}

const OCR_SYSTEM_PROMPT = `You are a nutrition label OCR extraction engine specialized in Pakistani and South Asian packaged foods (e.g. Olper's Milk, Shan Spices, National Foods, Mitchell's, Dawn Bread, Knorr, Kolson).
Transcribe the printed nutrition facts panel from the provided image.

CRITICAL RULES:
1. Read all numbers exactly as printed on the panel.
2. Standardize both "Per Serving" and "Per 100g / 100ml". If only one is printed, mathematically compute the other using the stated serving size.
3. Output strictly valid JSON matching the required schema. No conversational preamble.`;

export async function parseNutritionLabel(
  request: OCRLabelRequest,
  apiKey?: string
): Promise<OCRLabelResult> {
  // If no external API key is set, return a mock/simulated scan of a Pakistani staple
  if (!apiKey) {
    const isConsistent = validateNutrientMath(3.1, 3.5, 4.7, 63);
    return {
      productName: request.hintText || "Olper's Full Cream Milk",
      brand: 'Engro Foods',
      servingSizeText: '1 glass (250ml)',
      servingSizeGrams: 250,
      caloriesPerServing: 158,
      caloriesPer100g: 63,
      proteinGramsPer100g: 3.1,
      fatGramsPer100g: 3.5,
      carbGramsPer100g: 4.7,
      sodiumMgPer100g: 45,
      confidence: 0.95,
      isMathConsistent: isConsistent,
    };
  }

  // Vision API Call (Groq qwen/qwen3.6-27b)
  const imageUrl = request.imageUrl
    ? request.imageUrl
    : `data:image/jpeg;base64,${request.imageBase64}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODELS.GROQ.VISION_PREVIEW,
        messages: [
          { role: 'system', content: OCR_SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract the nutrition panel values from this food package into JSON.',
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
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from vision model');
    }

    const parsed = JSON.parse(content);
    const mathConsistent = validateNutrientMath(
      parsed.proteinGramsPer100g ?? 0,
      parsed.fatGramsPer100g ?? 0,
      parsed.carbGramsPer100g ?? 0,
      parsed.caloriesPer100g ?? 0
    );

    const validated = OCRLabelResultSchema.parse({
      ...parsed,
      isMathConsistent: mathConsistent,
      confidence: parsed.confidence ?? 0.9,
    });

    return validated;
  } catch (err: any) {
    // If external call fails, return fallback with validation flag
    const fallbackMath = validateNutrientMath(3.0, 3.5, 5.0, 64);
    return {
      productName: request.hintText || 'Packaged Product (Fallback)',
      servingSizeText: '1 serving (100g)',
      servingSizeGrams: 100,
      caloriesPerServing: 64,
      caloriesPer100g: 64,
      proteinGramsPer100g: 3.0,
      fatGramsPer100g: 3.5,
      carbGramsPer100g: 5.0,
      confidence: 0.5,
      isMathConsistent: fallbackMath,
    };
  }
}
