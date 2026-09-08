/**
 * Standard VisionProvider abstraction from BUILD_INSTRUCTIONS.md Part 3.4
 * Keeps provider changes a one-file swap.
 */
export interface VisionMealItem {
  name: string;
  estimatedGrams: number;
  cookingMethod?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface VisionIdentificationResult {
  items: VisionMealItem[];
  referenceObjectDetected: boolean;
  notes?: string;
}

export interface VisionProvider {
  identifyMeal(
    imageBase64: string,
    context?: string
  ): Promise<VisionIdentificationResult>;
}

export interface AIJobRecord {
  user_id?: string;
  kind: 'assess' | 'coach' | 'vision' | 'plan';
  provider: string;
  model: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  cost_usd: number;
  latency_ms: number;
  input_ref?: string;
  output: Record<string, unknown>;
  validated: boolean;
}
