import { describe, it, expect } from 'vitest';
import {
  ALL_EXPANDED_PAKISTANI_FOODS,
  analyzeMealText,
  matchMealItem,
  parseMealText,
  resolvePortion,
} from '../src/index.js';

const food = (name: string) => {
  const found = ALL_EXPANDED_PAKISTANI_FOODS.find((f) => f.name === name);
  if (!found) throw new Error(`missing ${name}`);
  return found;
};
const item = (name: string, extra: Partial<Parameters<typeof resolvePortion>[1]> = {}) => ({
  text: name,
  name,
  quantity: 1,
  quantityGiven: false,
  ...extra,
});

describe('parseMealText', () => {
  it('strips the slot phrase and filler, keeping only the food', () => {
    const meal = parseMealText('In breakfast I had 4 egg whites');
    expect(meal.slot).toBe('breakfast');
    expect(meal.items).toHaveLength(1);
    expect(meal.items[0]).toMatchObject({ name: 'egg whites', quantity: 4, quantityGiven: true });
    expect(meal.items[0].unit).toBeUndefined();
  });

  it('reads Urdu fractions with units', () => {
    expect(parseMealText('aadha pao dahi').items[0]).toMatchObject({ name: 'dahi', quantity: 0.5, unit: 'pao' });
    expect(parseMealText('dedh roti').items[0]).toMatchObject({ name: 'roti', quantity: 1.5 });
  });

  it('reads weights given with or without a space', () => {
    expect(parseMealText('200 g chicken').items[0].grams).toBe(200);
    expect(parseMealText('1.5kg mutton').items[0].grams).toBe(1500);
    expect(parseMealText('250ml juice').items[0].grams).toBe(250);
  });

  it('reads slash fractions', () => {
    expect(parseMealText('1/2 cup rice').items[0]).toMatchObject({ quantity: 0.5, unit: 'cup' });
  });

  it('splits on English, Roman Urdu and Urdu joiners', () => {
    expect(parseMealText('roti, daal aur chai plus rusk').items.map((i) => i.name)).toEqual([
      'roti',
      'daal',
      'chai',
      'rusk',
    ]);
    expect(parseMealText('روٹی اور دال').items).toHaveLength(2);
  });

  it('drops segments with no food in them', () => {
    expect(parseMealText('i had, and then').items).toEqual([]);
  });

  it('keeps "drink" when it is the food, not the verb', () => {
    expect(parseMealText('one glass of cold drink').items[0]).toMatchObject({ name: 'cold drink', unit: 'glass' });
    expect(parseMealText('i drink tea').items[0].name).toBe('tea');
  });

  it('reads "can" as a unit only after a number', () => {
    expect(parseMealText('1 can coke').items[0]).toMatchObject({ name: 'coke', quantity: 1, unit: 'can' });
    expect(parseMealText('a can of pepsi').items[0]).toMatchObject({ name: 'pepsi', unit: 'can' });
    expect(parseMealText('i can eat 2 roti').items[0]).toMatchObject({ name: 'roti', quantity: 2 });
    expect(parseMealText('i can eat 2 roti').items[0].unit).toBeUndefined();
  });
});

describe('matchMealItem', () => {
  it('never matches on part of the words', () => {
    // The original failure: "white" alone was enough to pick White Shadi Korma.
    expect(matchMealItem('egg white').food?.name).toBe('Egg White (Boiled)');
    expect(matchMealItem('egg').food?.name).not.toMatch(/eggplant/i);
  });

  it('returns unknown rather than a near miss', () => {
    expect(matchMealItem('tinday gosht')).toEqual({ status: 'unknown', alternatives: [] });
    expect(matchMealItem('palak pizza').status).toBe('unknown');
  });

  it('prefers the dish whose name ends in what was asked for', () => {
    expect(matchMealItem('samosa').food?.name).not.toMatch(/chaat/i);
    expect(matchMealItem('chawal').food?.name).not.toMatch(/daal/i);
  });

  it('asks when the choices differ in calories', () => {
    const milk = matchMealItem('milk');
    expect(milk.status).toBe('ambiguous');
    expect(milk.alternatives.map((f) => f.name)).toContain('Milk (Skim / Low Fat)');
  });

  it('does not ask when the choices give the same calories', () => {
    expect(matchMealItem('roti').status).toBe('matched');
  });

  it('understands Roman Urdu names for English-named foods', () => {
    expect(matchMealItem('anday').food?.name).toMatch(/egg/i);
    expect(matchMealItem('doodh').food?.name).toMatch(/milk/i);
  });

  it('reports a typo correction', () => {
    expect(matchMealItem('chicken biriyani').certainty).toBe('typo');
  });

  it('finds a food by its other names: cold drink and brand sodas are a soft drink', () => {
    for (const name of ['cold drink', 'pepsi', '7up', 'coke']) {
      expect(matchMealItem(name)).toMatchObject({ status: 'matched', loose: false, food: { name: 'Regular Cola / Soft Drink' } });
    }
    expect(matchMealItem('diet pepsi').food?.name).toBe('Diet Soda / Zero Cola');
    // Plain "fries" are French fries, not a branded or loaded variety.
    expect(matchMealItem('fries')).toMatchObject({ status: 'matched', food: { name: 'French Fries' } });
    expect(matchMealItem('curly fries').food?.name).toMatch(/curly/i);
  });

  it('finds plain fried chicken by the piece in both regions', () => {
    for (const region of ['PK', 'SA'] as const) {
      const [chicken] = analyzeMealText('2 piece fried chicken', region).items;
      expect(chicken).toMatchObject({ match: { status: 'matched', food: { name: 'Fried Chicken' } }, portion: { grams: 200 } });
      const [wings] = analyzeMealText('6 fried chicken wings', region).items;
      expect(wings).toMatchObject({ match: { status: 'matched', food: { name: 'Fried Chicken Wings' } }, portion: { grams: 270 } });
    }
    // An Arabic query is compared with the Arabic name, not the Urdu one.
    expect(matchMealItem('دجاج مقلي', 'SA')).toMatchObject({ status: 'matched', loose: false, food: { name: 'Fried Chicken' } });
    // An alias word alone is not the alias: "cold coffee" is still coffee.
    expect(matchMealItem('cold coffee').food?.name).toBe('Cold Coffee');
  });

  it('offers each alternative name once, though several restaurants sell it', () => {
    const names = matchMealItem('cold coffee').alternatives.map((f) => f.name);
    expect(names.length).toBeGreaterThan(1);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('resolvePortion', () => {
  it('multiplies a per-piece serving for a count', () => {
    const portion = resolvePortion(food('Egg White (Boiled)'), item('egg white', { quantity: 4, quantityGiven: true }));
    expect(portion).toEqual({ grams: 132, servingLabel: '1 egg white (33g)', certainty: 'food_serving' });
  });

  it('counts pieces, not servings, when a serving holds several', () => {
    const chicken = resolvePortion(food('Crispy Fried Chicken (2 pcs)'), item('fried chicken', { unit: 'piece', quantity: 2, quantityGiven: true }));
    expect(chicken).toEqual({ grams: 240, servingLabel: '1 piece (120g)', certainty: 'food_serving' });

    const withServing = (label: string, grams: number) => ({
      ...food('Egg White (Boiled)'),
      servings: [{ label, grams, isDefault: true }],
    });
    const ten = item('almonds', { quantity: 10, quantityGiven: true });
    expect(resolvePortion(withServing('10 almonds (12g)', 12), ten).grams).toBe(12);
    // One dish of several things stays one dish.
    const two = item('omelette', { quantity: 2, quantityGiven: true });
    expect(resolvePortion(withServing('2-egg omelette (120g)', 120), two).grams).toBe(240);
    expect(resolvePortion(withServing('2 egg portion (100g)', 100), two).grams).toBe(200);
    expect(resolvePortion(withServing('4 pc Meal (500g)', 500), two).grams).toBe(1000);
  });

  it('never multiplies a generic bowl serving by a count without asking', () => {
    const portion = resolvePortion(food('Chicken Karahi (Restaurant Style)'), item('chicken karahi', { quantity: 3, quantityGiven: true }));
    expect(portion.certainty).toBe('needs_portion');
  });

  it("uses the food's own katori serving when it has one", () => {
    const portion = resolvePortion(food('Plain Yogurt / Dahi'), item('dahi', { unit: 'katori' }));
    expect(portion).toMatchObject({ grams: 150, certainty: 'food_serving' });
  });

  it('uses a 330 ml can when the food has no can serving of its own', () => {
    const portion = resolvePortion(food('Aloo Gosht (Mutton Shorba)'), item('aloo gosht', { unit: 'can' }));
    expect(portion).toMatchObject({ grams: 330, certainty: 'unit_default' });
    const cola = resolvePortion(food('Regular Cola / Soft Drink'), item('coke', { unit: 'bottle', quantity: 2, quantityGiven: true }));
    expect(cola).toMatchObject({ grams: 1000, servingLabel: '1 bottle (500ml)', certainty: 'food_serving' });
  });

  it('falls back to a standard unit size', () => {
    const portion = resolvePortion(food('Aloo Gosht (Mutton Shorba)'), item('aloo gosht', { unit: 'katori' }));
    expect(portion).toMatchObject({ grams: 150, certainty: 'unit_default' });
  });

  it('asks for a portion when "pieces" meets a food without a piece serving', () => {
    const portion = resolvePortion(food('Aloo Gosht (Mutton Shorba)'), item('aloo gosht', { unit: 'piece', quantity: 2, quantityGiven: true }));
    expect(portion.certainty).toBe('needs_portion');
  });

  it('takes given grams as exact', () => {
    const portion = resolvePortion(food('Aloo Gosht (Mutton Shorba)'), item('aloo gosht', { grams: 275 }));
    expect(portion).toMatchObject({ grams: 275, certainty: 'exact_grams' });
  });
});

describe('analyzeMealText', () => {
  it('blocks logging while any row needs the user', () => {
    expect(analyzeMealText('2 roti and tinday gosht').needsReview).toBe(true);
    expect(analyzeMealText('2 roti').needsReview).toBe(false);
  });

  it('rates a clean match high and a guess low', () => {
    expect(analyzeMealText('4 egg white').items[0].confidence).toBe('high');
    expect(analyzeMealText('3 chicken karahi').items[0].confidence).toBe('low');
    expect(analyzeMealText('sushi').items[0].confidence).toBeUndefined();
  });

  it('flags a meal whose total is implausible even when each item is fine', () => {
    const meal = analyzeMealText(Array(5).fill('1 plate chicken biryani').join(', '));
    expect(meal.items.every((i) => !i.flags.includes('implausible_amount'))).toBe(true);
    expect(meal.flags).toContain('implausible_meal');
    expect(meal.needsReview).toBe(true);
  });

  it('asks when nothing in the text was recognised as food', () => {
    expect(analyzeMealText('i had').flags).toContain('nothing_recognised');
  });

  it('adds up only the items that resolved', () => {
    const meal = analyzeMealText('4 egg white and tinday gosht');
    expect(meal.totals.kcal).toBe(meal.items[0].nutrition!.kcal);
  });
});
