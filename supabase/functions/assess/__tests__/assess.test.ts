import { describe, expect, it } from 'vitest';
import { handleAssessmentRequest } from '../index.js';
import { AssessmentResponseSchema } from '../../_shared/schema.js';
import { generateFallbackNarrative } from '../../_shared/template-narrative.js';

describe('Assessment Edge Function (Task 1.3)', () => {
  const validSurveyPayload = {
    version: 1,
    basics: {
      sex: 'male',
      ageYears: 28,
      heightCm: 178,
      weightKg: 82,
    },
    occupational: {
      jobCategory: 'desk_sedentary',
      workingHoursPerDay: 8,
      shiftPattern: 'regular_day',
      dailySittingHours: 9,
      commuteType: 'bike_motorbike',
    },
    exercise: {
      trainingType: 'gym_resistance',
      frequencyDaysPerWeek: 3,
      sessionDurationMins: 45,
      intensity: 'moderate',
    },
    lifestyleDesi: {
      sleepHoursPerNight: 6.5,
      stressRating: 3,
      chaiWithSugarCupsPerDay: 4, // 4 cups * 65 = 260 kcal/day
      eatingOutTimesPerWeek: 2,
      whoCooksAtHome: 'family_traditional',
      dailyWaterLitres: 2.0,
      lateNightEating: true,
      smoker: false,
    },
    healthClinical: {
      medicalConditions: ['none'],
      isPregnantOrBreastfeeding: false,
      medicalDisclaimerAccepted: true,
    },
    preferencesBudget: {
      dietPreference: 'halal_omnivore',
      dislikedFoods: ['karela'],
      budgetTierPKR: 'standard_3500_7000',
    },
  };

  it('handles CORS preflight OPTIONS request', async () => {
    const req = new Request('http://localhost/assess', { method: 'OPTIONS' });
    const res = await handleAssessmentRequest(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('rejects non-POST methods with 405 Method Not Allowed', async () => {
    const req = new Request('http://localhost/assess', { method: 'GET' });
    const res = await handleAssessmentRequest(req);
    expect(res.status).toBe(405);
  });

  it('rejects malformed survey payloads with 400 Bad Request', async () => {
    const req = new Request('http://localhost/assess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incomplete: true }),
    });
    const res = await handleAssessmentRequest(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('missing required sections');
  });

  it('processes valid survey and returns strictly validated AssessmentResponse', async () => {
    const req = new Request('http://localhost/assess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validSurveyPayload),
    });

    const res = await handleAssessmentRequest(req);
    expect(res.status).toBe(200);

    const data = await res.json();

    // Verify adherence to strict Zod schema
    const validation = AssessmentResponseSchema.safeParse(data);
    expect(validation.success).toBe(true);

    // Verify deterministic calculation integrity (Rule 1 & Rule 2)
    // 82kg, 178cm, 28yo male BMR: 10*82 + 6.25*178 - 5*28 + 5 = 820 + 1112.5 - 140 + 5 = 1797.5 -> 1798 kcal
    expect(data.targets.bmr).toBe(1798);
    expect(data.targets.targetCalories).toBeGreaterThan(0);
    expect(data.targets.targetProteinGrams).toBeGreaterThan(0);
    expect(data.targets.targetFatGrams).toBeGreaterThan(0);

    // Verify cultural levers (4 cups chai * 65 kcal)
    expect(data.culturalMetrics.dailyChaiSugarKcal).toBe(260);
    expect(data.culturalMetrics.weeklyChaiSugarKcal).toBe(1820);
    expect(data.culturalMetrics.isHighChaiIntake).toBe(true);
    expect(data.culturalMetrics.isSedentaryWorker).toBe(true);

    // Verify fallback resilience when no external API key is in test environment
    expect(data.generatedBy).toBe('deterministic_fallback');
    expect(data.narrative.highestLeverageChanges).toHaveLength(3);
    expect(data.narrative.highestLeverageChanges[0]).toContain('Moderate Sugar in Tea');
  });

  it('generates high-quality fallback narrative adhering to all schema constraints', () => {
    const narrative = generateFallbackNarrative({
      sex: 'male',
      ageYears: 30,
      weightKg: 80,
      bmr: 1780,
      tdee: 2450,
      targetKcal: 1900,
      chaiCupsPerDay: 4,
      dailyChaiSugarKcal: 260,
      sittingHours: 9,
      sleepHours: 6,
      shiftPattern: 'regular_day',
    });

    expect(narrative.summary).toContain('1780 kcal/day (BMR)');
    expect(narrative.whyThisNumber).toContain('1900 kcal/day');
    expect(narrative.highestLeverageChanges).toHaveLength(3);
    expect(narrative.highestLeverageChanges[0]).toContain('260 kcal/day');
    expect(narrative.culturalLifestyleInsight.length).toBeGreaterThan(20);
    expect(narrative.weekByWeekExpectation.length).toBeGreaterThan(20);
  });
});
