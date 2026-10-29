import { describe, it, expect } from 'vitest';
import en from '../locales/en.json';
import ar from '../locales/ar.json';

describe('full-body session variant labels', () => {
  const keys = ['full_a', 'full_b', 'full_c'] as const;
  it('en keeps the Latin variant letter', () => {
    expect(keys.map((k) => en.workout.template[k].slice(-1))).toEqual(['A', 'B', 'C']);
  });
  it('ar uses Arabic letters, never a Latin one', () => {
    expect(keys.map((k) => ar.workout.template[k].slice(-1))).toEqual(['أ', 'ب', 'ج']);
    for (const k of keys) expect(ar.workout.template[k]).not.toMatch(/[A-Za-z]/);
  });
});
