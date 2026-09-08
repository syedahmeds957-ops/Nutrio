import { describe, expect, it } from 'vitest';
import {
  ABSOLUTE_FLOOR_FEMALE,
  ABSOLUTE_FLOOR_MALE,
  calculateBMI,
  enforceCalorieFloors,
  validateClinicalSafety,
} from '../src/safety.js';

describe('Safety & Clinical Guardrails', () => {
  it('correctly calculates BMI', () => {
    // 70kg, 175cm -> 70 / (1.75^2) = 22.86 -> 22.9
    expect(calculateBMI(70, 175)).toBe(22.9);
    // Underweight: 45kg, 165cm -> 45 / (1.65^2) = 16.5
    expect(calculateBMI(45, 165)).toBe(16.5);
  });

  it('disables weight-loss goal if BMI < 18.5 (underweight)', () => {
    const result = validateClinicalSafety(45, 165, 25, 'lose');
    expect(result.allowed).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].code).toBe('UNDERWEIGHT_CUT_DISABLED');
  });

  it('allows maintenance or gain if BMI < 18.5', () => {
    const maintainResult = validateClinicalSafety(45, 165, 25, 'maintain');
    expect(maintainResult.allowed).toBe(true);

    const gainResult = validateClinicalSafety(45, 165, 25, 'gain');
    expect(gainResult.allowed).toBe(true);
  });

  it('disables weight-loss goal if age < 18 (paediatric referral requirement)', () => {
    const result = validateClinicalSafety(70, 175, 16, 'lose');
    expect(result.allowed).toBe(false);
    expect(result.violations[0].code).toBe('AGE_UNDER_18_CUT_DISABLED');
  });

  it('disables weight-loss goal if pregnant or breastfeeding', () => {
    const result = validateClinicalSafety(65, 165, 28, 'lose', true);
    expect(result.allowed).toBe(false);
    expect(result.violations[0].code).toBe('PREGNANCY_MAINTENANCE_ONLY');
  });

  it('enforces biological minimum floor for females (1200 kcal)', () => {
    // BMR 1100, TDEE 1400, candidate 1000
    const result = enforceCalorieFloors(1000, 1100, 1400, 'female');
    expect(result.clampedKcal).toBe(ABSOLUTE_FLOOR_FEMALE);
    expect(result.violations.some((v) => v.code === 'BELOW_ABSOLUTE_FLOOR')).toBe(true);
  });

  it('enforces biological minimum floor for males (1500 kcal)', () => {
    // BMR 1400, TDEE 1800, candidate 1300
    const result = enforceCalorieFloors(1300, 1400, 1800, 'male');
    expect(result.clampedKcal).toBe(ABSOLUTE_FLOOR_MALE);
    expect(result.violations.some((v) => v.code === 'BELOW_ABSOLUTE_FLOOR')).toBe(true);
  });

  it('never allows target to fall below calculated BMR', () => {
    // Male: BMR 1700, TDEE 2200, candidate 1600
    const result = enforceCalorieFloors(1600, 1700, 2200, 'male');
    expect(result.clampedKcal).toBe(1700);
    expect(result.violations.some((v) => v.code === 'BELOW_BMR_FLOOR')).toBe(true);
  });

  it('caps caloric deficit at 25% of TDEE', () => {
    // TDEE 3000, 25% deficit floor is 2250 kcal. Candidate 2000 kcal.
    const result = enforceCalorieFloors(2000, 1800, 3000, 'male');
    expect(result.clampedKcal).toBe(2250);
    expect(result.violations.some((v) => v.code === 'EXCESSIVE_DEFICIT')).toBe(true);
  });
});
