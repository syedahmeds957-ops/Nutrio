import { describe, expect, it } from 'vitest';
import {
  buildCoachSystemPrompt,
  validateCoachResponse,
} from '../src/coach-context.js';
import { CoachContext } from '../src/types.js';

describe('AI Coach Context Assembler & Guardrails (Task 4.1)', () => {
  const sampleContext: CoachContext = {
    displayName: 'Hamza',
    sex: 'male',
    ageYears: 28,
    weightKg: 82.5,
    goal: 'lose',
    targets: {
      kcalTarget: 1950,
      proteinGrams: 145,
      fatGrams: 55,
      carbGrams: 220,
      waterMl: 3200,
    },
    todaySummary: {
      caloriesConsumed: 1250,
      proteinConsumed: 95,
      fatConsumed: 40,
      carbConsumed: 130,
      remainingCalories: 700,
      foodsLoggedToday: ['2 Roti (Whole Wheat)', '1 Katori Daal Chana'],
    },
    medicalFlags: ['Pre-diabetes', 'Family history of hypertension'],
    dietaryPreferences: ['Halal', 'Desi home-cooked food'],
    isRamadanMode: false,
  };

  it('assembles grounded system prompt with user targets, safety gates, and cultural context', () => {
    const prompt = buildCoachSystemPrompt(sampleContext);

    // Profile & clinical targets
    expect(prompt).toContain('Hamza');
    expect(prompt).toContain('1950 kcal');
    expect(prompt).toContain('Protein: 145g');
    expect(prompt).toContain('Pre-diabetes');

    // Today's progress
    expect(prompt).toContain('Consumed: 1250 kcal');
    expect(prompt).toContain('Remaining: 700 kcal');
    expect(prompt).toContain('Daal Chana');

    // Inviolable Rule 1 & medical gates
    expect(prompt).toContain('NON-NEGOTIABLE RULE 1');
    expect(prompt).toContain('MEDICAL SAFETY GATE');
    expect(prompt).toContain('AUTHENTIC DESI UNDERSTANDING');
  });

  it('validates and approves evidence-based nutrition advice', () => {
    const safeResponse =
      'To stay within your remaining 700 kcal while hitting your protein goal, I recommend a tandoori chicken breast with a light kachumber salad.';
    const validation = validateCoachResponse(safeResponse);

    expect(validation.isValid).toBe(true);
    expect(validation.flagsTriggered).toHaveLength(0);
    expect(validation.sanitizedText).toBe(safeResponse);
  });

  it('flags medical diagnosis overstep and prepends clinical disclaimer', () => {
    const oversteppingResponse =
      'Based on your symptoms, I diagnose you with acute diabetes and you should discontinue medication.';
    const validation = validateCoachResponse(oversteppingResponse);

    expect(validation.isValid).toBe(false);
    expect(validation.flagsTriggered).toContain('MEDICAL_DIAGNOSIS_OVERSTEP');
    expect(validation.sanitizedText).toContain('⚠️ Medical Disclaimer');
    expect(validation.sanitizedText).toContain('consult your physician');
  });

  it('flags extreme calorie deficit recommendations (<1000 kcal)', () => {
    const extremeResponse =
      'You should eat less than 800 calories a day to lose weight quickly.';
    const validation = validateCoachResponse(extremeResponse);

    expect(validation.isValid).toBe(false);
    expect(validation.flagsTriggered).toContain('EXTREME_RESTRICTION_WARNING');
  });
});
