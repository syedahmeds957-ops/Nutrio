import { describe, expect, it } from 'vitest';
import { suggestionFor } from '../suggestions.js';

describe('suggestionFor', () => {
  it.each(['PK', 'SA'] as const)('resolves every %s suggestion to catalogue foods', (region) => {
    for (const remaining of [100, 350, 900]) {
      const s = suggestionFor(region, remaining)!;
      expect(s, `${region} ${remaining}`).not.toBeNull();
      expect(s.items.length).toBeGreaterThan(0);
      expect(s.calories).toBeGreaterThan(0);
    }
  });

  it('only suggests a plate that fits in what is left, when one does', () => {
    for (const region of ['PK', 'SA'] as const) {
      for (const remaining of [200, 400, 700, 1200]) {
        const s = suggestionFor(region, remaining)!;
        if (s.size !== 'light') expect(s.calories, `${region} ${remaining}`).toBeLessThanOrEqual(remaining);
      }
    }
  });

  it('logs the farrouj, not the first dish in the catalogue', () => {
    const s = suggestionFor('SA', 2000)!;
    expect(s.size).toBe('full');
    expect(s.items.map((i) => i.food.name)).toContain('Al Tazaj Half Charcoal Grilled Farrouj Meal');
  });
});
