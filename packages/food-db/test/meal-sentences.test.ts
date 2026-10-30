import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { analyzeMealText, isBlockingFlag, MealItemFlag, MealSlotHint, MatchStatus } from '../src/index.js';

/**
 * The golden set: real meal descriptions and what a person means by them.
 * Expectations are written from intent, not from the code's output — when a
 * case fails, the matcher or the data is wrong until shown otherwise. Any
 * wrong food fails the build.
 */
interface ExpectedItem {
  food?: string[];
  nameIncludes?: string[];
  notNameIncludes?: string[];
  grams?: [number, number];
  status?: MatchStatus;
  flags?: MealItemFlag[];
  /** The row must stop for the user, whatever it matched. */
  blocked?: boolean;
}

interface MealCase {
  id: string;
  text: string;
  slot?: MealSlotHint;
  items: ExpectedItem[];
  totalKcal?: [number, number];
  /** No slot may be detected (a slot word used as part of a food name). */
  noSlot?: boolean;
  needsReview?: boolean;
}

const cases: MealCase[] = JSON.parse(
  readFileSync(fileURLToPath(new URL('./fixtures/meal-sentences.json', import.meta.url)), 'utf8')
);

describe('golden meal sentences', () => {
  it('has a meaningful number of cases', () => {
    expect(cases.length).toBeGreaterThanOrEqual(70);
  });

  describe.each(cases)('$id: "$text"', (c) => {
    const meal = analyzeMealText(c.text);

    it('splits into the expected number of items', () => {
      expect(meal.items.map((i) => i.parsed.name)).toHaveLength(c.items.length);
    });

    if (c.slot) {
      it(`detects the ${c.slot} slot`, () => expect(meal.slot).toBe(c.slot));
    }
    if (c.noSlot) {
      it('detects no slot', () => expect(meal.slot).toBeUndefined());
    }
    if (c.needsReview !== undefined) {
      it('sets needsReview', () => expect(meal.needsReview).toBe(c.needsReview));
    }

    it('never logs a loose or typo-corrected match without asking', () => {
      for (const item of meal.items) {
        if (item.match.loose || item.match.certainty === 'typo') {
          expect(item.flags.some(isBlockingFlag), item.match.food?.name).toBe(true);
        }
      }
    });

    c.items.forEach((expected, i) => {
      it(`item ${i + 1} resolves as intended`, () => {
        const actual = meal.items[i];
        expect(actual, 'item missing').toBeDefined();
        const name = actual.match.food?.name;
        const lower = name?.toLowerCase() ?? '';

        if (expected.blocked) {
          expect(actual.flags.some(isBlockingFlag), `${name} logged without asking`).toBe(true);
          return;
        }

        if (expected.status === 'unknown') {
          expect(actual.match.status, `expected unknown, got ${name}`).toBe('unknown');
          expect(actual.nutrition).toBeUndefined();
          return;
        }

        expect(actual.match.status, `"${actual.parsed.name}" found nothing`).not.toBe('unknown');
        if (expected.status) expect(actual.match.status).toBe(expected.status);
        if (expected.food) expect(expected.food, `wrong food: ${name}`).toContain(name);
        for (const word of expected.nameIncludes ?? []) {
          expect(lower, `wrong food: ${name}`).toContain(word);
        }
        for (const word of expected.notNameIncludes ?? []) {
          expect(lower, `wrong food: ${name}`).not.toContain(word);
        }
        if (expected.grams) {
          const grams = actual.portion!.grams;
          expect(grams, `${name}: ${grams}g`).toBeGreaterThanOrEqual(expected.grams[0]);
          expect(grams, `${name}: ${grams}g`).toBeLessThanOrEqual(expected.grams[1]);
        }
        for (const flag of expected.flags ?? []) expect(actual.flags).toContain(flag);
        if (!expected.flags?.includes('implausible_amount')) {
          expect(actual.flags, `${name} flagged implausible`).not.toContain('implausible_amount');
        }
      });
    });

    if (c.totalKcal) {
      it('totals within the expected range', () => {
        expect(meal.totals.kcal).toBeGreaterThanOrEqual(c.totalKcal![0]);
        expect(meal.totals.kcal).toBeLessThanOrEqual(c.totalKcal![1]);
      });
    }
  });
});
