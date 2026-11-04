import { describe, expect, it } from 'vitest';
import { analyzeMealText, getRecipeIngredientFoods, composeRecipeFood } from '@nutrio/food-db';
import {
  canLogDraft,
  chooseFood,
  confirmRow,
  draftFromAnalysis,
  draftTotals,
  MAX_ROW_GRAMS,
  rowNutrition,
  servingChoices,
  setRowGrams,
  setRowQuantity,
  setRowServing,
  toLogEntries,
} from '../describeMeal.js';

const SENTENCE = 'in breakfast i had 4 eggs white and 2 whole eggs and salad';
const draft = () => draftFromAnalysis(analyzeMealText(SENTENCE, 'PK'));

describe('describe-your-meal review', () => {
  it('turns the sentence into one row per food', () => {
    const rows = draft();
    expect(rows.map((r) => r.food?.name)).toEqual([
      'Egg White (Boiled)',
      'Boiled Egg (Whole)',
      expect.any(String),
    ]);
  });

  it('keeps a count as pieces, so the diary reads "4 × 1 egg white"', () => {
    const [whites] = draft();
    expect(whites.quantity).toBe(4);
    expect(rowNutrition(whites)!.grams).toBe(whites.serving!.grams * 4);
  });

  it('makes the user settle a vague "salad" before logging', () => {
    const rows = draft();
    expect(rows[2].status).toBe('needs_confirm');
    expect(rows[2].alternatives.length).toBeGreaterThan(0);
    expect(canLogDraft(rows)).toBe(false);
  });

  it('unlocks logging once every row is confirmed or changed', () => {
    const rows = draft();
    const kachumber = rows[2].alternatives.find((f) => f.name === 'Kachumber Salad') ?? rows[2].alternatives[0];
    const settled = [rows[0], rows[1], chooseFood(rows[2], kachumber)];
    expect(settled[2].food).toBe(kachumber);
    expect(canLogDraft(settled)).toBe(true);
    expect(toLogEntries(settled)).toHaveLength(3);
  });

  it('accepting the guess keeps the food it picked', () => {
    const rows = draft();
    const confirmed = confirmRow(rows[2]);
    expect(confirmed.status).toBe('ready');
    expect(confirmed.food).toBe(rows[2].food);
  });

  it('prices every row from the catalogue', () => {
    const rows = draft().map(confirmRow);
    const totals = draftTotals(rows);
    const byHand = rows.reduce((sum, r) => sum + Math.round((r.food!.kcal100g * rowNutrition(r)!.grams) / 100), 0);
    expect(totals.kcal).toBe(byHand);
  });

  it('marks a food the catalogue lacks as unknown, not a guess', () => {
    const rows = draftFromAnalysis(analyzeMealText('1 plate zxqv khichra special', 'PK'));
    expect(rows[0].status).toBe('unknown');
    expect(rows[0].food).toBeUndefined();
    expect(canLogDraft(rows)).toBe(false);
  });

  it('accepts a dish the user just added for an unknown row', () => {
    const [unknown] = draftFromAnalysis(analyzeMealText('1 zxqv khichra', 'PK'));
    const dish = composeRecipeFood({
      name: 'zxqv khichra',
      ingredients: [{ name: getRecipeIngredientFoods('PK')[0].name, grams: 200 }],
    })!.food;
    const row = chooseFood(unknown, dish);
    expect(row.status).toBe('ready');
    expect(rowNutrition(row)!.kcal).toBeGreaterThan(0);
  });

  it('keeps quantity within half-steps and sane bounds', () => {
    const [row] = draft();
    expect(setRowQuantity(row, 0).quantity).toBe(0.5);
    expect(setRowQuantity(row, 2.3).quantity).toBe(2.5);
    expect(setRowQuantity(row, 999).quantity).toBe(50);
  });

  it('refuses to log an empty meal', () => {
    expect(canLogDraft([])).toBe(false);
  });
});

describe('changing a row weight', () => {
  const [whites] = draftFromAnalysis(analyzeMealText('4 egg whites', 'PK'));

  it('sets exactly the grams the user typed', () => {
    const row = setRowGrams(whites, 150);
    expect(row.quantity).toBe(1);
    expect(rowNutrition(row)!.grams).toBe(150);
    expect(rowNutrition(row)!.kcal).toBe(Math.round((row.food!.kcal100g * 150) / 100));
  });

  it('ignores an empty, zero or non-numeric weight', () => {
    expect(setRowGrams(whites, 0)).toBe(whites);
    expect(setRowGrams(whites, Number(''))).toBe(whites);
    expect(setRowGrams(whites, Number('abc'))).toBe(whites);
  });

  it('caps a typo like 20000 g', () => {
    expect(rowNutrition(setRowGrams(whites, 20000))!.grams).toBe(MAX_ROW_GRAMS);
  });

  it('switches to one of the food own servings', () => {
    const choices = servingChoices(whites);
    expect(choices.length).toBeGreaterThan(0);
    const row = setRowServing(whites, choices[choices.length - 1]);
    expect(row.quantity).toBe(1);
    expect(row.serving!.label).toBe(choices[choices.length - 1].label);
  });
});
