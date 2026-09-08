import { describe, expect, it } from 'vitest';
import { calculateBMR } from '../src/bmr.js';

describe('BMR Calculations', () => {
  it('calculates Mifflin-St Jeor for males correctly', () => {
    // 80kg, 180cm, 30yo male: 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    const result = calculateBMR({
      weightKg: 80,
      heightCm: 180,
      ageYears: 30,
      sex: 'male',
    });
    expect(result.mifflinStJeor).toBe(1780);
    expect(result.selectedBMR).toBe(1780);
    expect(result.methodUsed).toBe('mifflin_st_jeor');
  });

  it('calculates Mifflin-St Jeor for females correctly', () => {
    // 60kg, 165cm, 28yo female: 10*60 + 6.25*165 - 5*28 - 161 = 600 + 1031.25 - 140 - 161 = 1330.25 -> 1330
    const result = calculateBMR({
      weightKg: 60,
      heightCm: 165,
      ageYears: 28,
      sex: 'female',
    });
    expect(result.mifflinStJeor).toBe(1330);
    expect(result.selectedBMR).toBe(1330);
    expect(result.methodUsed).toBe('mifflin_st_jeor');
  });

  it('calculates Katch-McArdle and Cunningham when body fat % is provided', () => {
    // 80kg male, 15% body fat -> LBM = 80 * 0.85 = 68kg
    // Katch-McArdle: 370 + 21.6 * 68 = 370 + 1468.8 = 1838.8 -> 1839
    // Cunningham: 500 + 22 * 68 = 500 + 1496 = 1996
    const result = calculateBMR({
      weightKg: 80,
      heightCm: 180,
      ageYears: 30,
      sex: 'male',
      bodyFatPct: 15,
    });
    expect(result.katchMcArdle).toBe(1839);
    expect(result.cunningham).toBe(1996);
    expect(result.selectedBMR).toBe(1839);
    expect(result.methodUsed).toBe('katch_mcardle');
  });

  it('calculates Harris-Benedict revised for comparison', () => {
    const result = calculateBMR({
      weightKg: 80,
      heightCm: 180,
      ageYears: 30,
      sex: 'male',
    });
    // HB male: 88.362 + (13.397 * 80) + (4.799 * 180) - (5.677 * 30) = 88.362 + 1071.76 + 863.82 - 170.31 = 1853.632 -> 1854
    expect(result.harrisBenedict).toBe(1854);
  });

  it('throws error for non-positive dimensions', () => {
    expect(() =>
      calculateBMR({ weightKg: -5, heightCm: 170, ageYears: 25, sex: 'male' })
    ).toThrow();
  });
});
