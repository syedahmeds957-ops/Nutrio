import { describe, expect, it } from 'vitest';
import { ritualCupKcal } from '../ritualDrinks.js';
import { getStapleDefinitions, resolveStaple } from '../../tracker/staples.js';

describe('ritualCupKcal', () => {
  it('prices a Pakistani cup as one 150 ml cup of sweet chai from food-db', () => {
    expect(ritualCupKcal('PK')).toBe(80);
  });

  it('prices a Saudi finjan with its companion date from food-db', () => {
    // 1 kcal of gahwa and a 34 kcal Sukari date.
    expect(ritualCupKcal('SA')).toBe(35);
  });

  it('is the same cup the quick-log chai chip logs', () => {
    const chai = getStapleDefinitions('PK').find((s) => s.id === 'chai')!;
    expect(resolveStaple(chai, 'PK').calories).toBe(ritualCupKcal('PK'));
  });

});
