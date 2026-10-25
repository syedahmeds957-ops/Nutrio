import { describe, expect, it } from 'vitest';
import {
  buildCoachSystemPrompt,
  buildWorkoutSection,
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

  it('assembles culturally tailored Saudi AI Coach prompt with SFDA and Gahwa/Dates rituals', () => {
    const saudiContext: CoachContext = {
      ...sampleContext,
      displayName: 'Faisal',
      region: 'SA',
      todaySummary: {
        caloriesConsumed: 1400,
        proteinConsumed: 110,
        fatConsumed: 45,
        carbConsumed: 140,
        remainingCalories: 550,
        foodsLoggedToday: ['Chicken Kabsa', '3 Sukari Dates', '2 Finjan Saudi Gahwa'],
      },
    };

    const saudiPrompt = buildCoachSystemPrompt(saudiContext);

    expect(saudiPrompt).toContain('Faisal');
    expect(saudiPrompt).toContain('Region: SA');
    expect(saudiPrompt).toContain('Saudi Arabian, Gulf, and Middle Eastern');
    expect(saudiPrompt).toContain('AUTHENTIC SAUDI & GULF UNDERSTANDING');
    expect(saudiPrompt).toContain('SFDA Caloric Standards');
    expect(saudiPrompt).toContain('Saudi Gahwa & Dates Ritual');
    expect(saudiPrompt).toContain('Almarai Laban');
    expect(saudiPrompt).toContain('اللهجة السعودية');
  });

  describe('workout block', () => {
    const workout = {
      location: 'gym' as const,
      sessionsPlannedThisWeek: 4,
      sessionsDoneThisWeek: 1,
      today: { title: 'Lower body A', exercises: ['Barbell back squat', 'Romanian deadlift'] },
      ramadan: false,
    };

    it('is left out entirely when there is no workout plan', () => {
      const prompt = buildCoachSystemPrompt(sampleContext);
      expect(prompt).not.toContain('WORKOUT PLAN');
      expect(buildCoachSystemPrompt({ ...sampleContext, workout })).toBe(`${prompt}\n\n${buildWorkoutSection(workout)}`);
    });

    it("lists the week's progress and today's exercises, and forbids sets, reps and weights", () => {
      const section = buildWorkoutSection(workout);
      expect(section).toContain('Trains in a gym; 1 of 4 sessions done this week.');
      expect(section).toContain('Today: Lower body A: Barbell back squat, Romanian deadlift.');
      expect(section).toMatch(/NEVER give sets, reps, weights or loads/);
      expect(section).not.toContain('Ramadan');
    });

    it('says rest day and Ramadan when they apply', () => {
      const section = buildWorkoutSection({ ...workout, location: 'home_none', today: undefined, ramadan: true });
      expect(section).toContain('at home, bodyweight only');
      expect(section).toContain('Today: Rest day.');
      expect(section).toContain('Ramadan mode is shortening sessions');
    });
  });
});
