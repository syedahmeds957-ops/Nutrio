import { describe, expect, it } from 'vitest';
import { calculateMacros } from '../src/macros.js';

describe('Macro Allocations', () => {
  it('calculates cutting macros with adequate protein and hormonal fat floor', () => {
    // 80kg male, 2000 kcal target, cutting
    // Protein: 80 * 2.0g = 160g (640 kcal, 32%)
    // Fat: min 0.6g/kg = 48g (432 kcal), standard 25% = 500 kcal (56g). Uses 56g fat.
    // Carbs: 2000 - 640 - 504 = 856 kcal -> 214g carbs
    // Fibre: (2000 / 1000) * 14 = 28g
    // Water: 80 * 35 = 2800 ml
    const result = calculateMacros({
      kcalTarget: 2000,
      weightKg: 80,
      goal: 'lose',
    });

    expect(result.proteinGrams).toBe(160);
    expect(result.fatGrams).toBe(56);
    expect(result.carbGrams).toBe(214);
    expect(result.fibreGrams).toBe(28);
    expect(result.waterMl).toBe(2800);
    expect(result.fatPct).toBeGreaterThanOrEqual(20); // Respects hormonal floor
  });

  it('increases water allocation for hot environments (Lahore summer)', () => {
    const normal = calculateMacros({
      kcalTarget: 2000,
      weightKg: 80,
      goal: 'maintain',
      ambientTempHigh: false,
    });
    const summer = calculateMacros({
      kcalTarget: 2000,
      weightKg: 80,
      goal: 'maintain',
      ambientTempHigh: true,
    });

    expect(normal.waterMl).toBe(2800); // 35 ml/kg
    expect(summer.waterMl).toBe(3200); // 40 ml/kg
  });

  it('adjusts protein calculation if body fat % is high (obesity protection)', () => {
    // 100kg person, 35% body fat -> LBM = 65kg -> adjusted weight = 65 * 1.2 = 78kg
    // Cutting protein: 78 * 2.0 = 156g (rather than 100 * 2.0 = 200g)
    const result = calculateMacros({
      kcalTarget: 2200,
      weightKg: 100,
      goal: 'lose',
      bodyFatPct: 35,
    });

    expect(result.proteinGrams).toBe(156);
  });
});
