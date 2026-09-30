import { describe, it, expect } from 'vitest';
import { classifyAnimalContent, isSuitableForDiet } from '../src/diet-suitability.js';

const dish = (name: string, category = 'Slow-Cooked Curries', cuisineTags: string[] = []) => ({
  name,
  category,
  cuisineTags,
});

describe('Animal content classification', () => {
  it('recognises meat named in Urdu, which the old English-only check missed', () => {
    for (const name of [
      'Keema Fry (Dhabba Style Dry Spiced Mince)',
      'Nargisi Kofta (with Hard Boiled Egg inside)',
      'Seekh Kabab Karahi',
      'Khadda Sajji (Pit Roasted Lamb)',
      'Aloo Gosht (Beef Shorba)',
      'Paya Shorba (Broth Only)',
      'Maghaz Beef Nihari (with Brain)',
      'Beef Bong Paye',
      'Kunna Gosht (Chinioti Claypot)',
      'Shinwari Namkeen Tikka',
    ]) {
      expect(classifyAnimalContent(dish(name)).contains.has('meat'), name).toBe(true);
    }
  });

  it('recognises fish and shellfish', () => {
    for (const name of [
      'Fish Tikka (Surmai / Rahu Grilled)',
      'Lahori Fried Fish (Gram Flour Batter)',
      'Prawn Tikka (Charcoal Grilled)',
      'Grilled Pomfret Fish',
    ]) {
      expect(classifyAnimalContent(dish(name)).contains.has('fish'), name).toBe(true);
    }
  });

  it('recognises eggs, including the ones not spelled "egg"', () => {
    for (const name of [
      'Anda Ghotala (Karachi Egg Scramble)',
      'Khagina (Egg Bhurji)',
      'Fried Omelette',
      'Onsen Tamago (Japanese Slow-Cooked Egg)',
      'Menemen (Turkish Scrambled Eggs)',
      'Vegetable Frittata',
    ]) {
      expect(classifyAnimalContent(dish(name)).contains.has('egg'), name).toBe(true);
    }
  });

  it('recognises dairy under its local names', () => {
    for (const name of [
      'Karak Doodh Patti Chai (2 tsp Sugar)',
      'Shahi Kheer (Cardamom Rice Pudding with Nuts)',
      'Lassi Meethi',
      'Paneer / Cottage Cheese',
      'Malai / Fresh Cream',
    ]) {
      expect(classifyAnimalContent(dish(name)).contains.has('dairy'), name).toBe(true);
    }
  });

  it('treats a meat-dominant category as meat even when the name is neutral', () => {
    // The old filter looked for categories called "Meat" and "Barbecue",
    // neither of which exists in this catalogue.
    const verdict = classifyAnimalContent(dish('Peshawari Charsi Special', 'BBQ & Grills'));
    expect(verdict.contains.has('meat')).toBe(true);
  });

  it('lets a positive plant marker settle an ambiguous name', () => {
    for (const name of ['Sabzi Karahi', 'Vegetable Biryani', 'Aloo Tahiri (Spiced Yellow Rice)']) {
      expect(classifyAnimalContent(dish(name)).contains.has('meat'), name).toBe(false);
    }
  });

  it('trusts an explicit tag over anything guessed from the name', () => {
    const verdict = classifyAnimalContent(
      dish('Steamed Chicken (Plain)', 'Diet & Basics', ['Diet', 'Chicken', 'Protein'])
    );
    expect(verdict.contains.has('meat')).toBe(true);
  });

  it('flags a dish it cannot place, rather than assuming it is safe', () => {
    expect(classifyAnimalContent(dish('Mystery Special')).isUnidentified).toBe(true);
  });
});

describe('Diet suitability', () => {
  const MEAT_DISH = dish('Nargisi Kofta (with Hard Boiled Egg inside)');
  const FISH_DISH = dish('Fish Tikka (Surmai / Rahu Grilled)');
  const EGG_DISH = dish('Khagina (Egg Bhurji)');
  const DAIRY_DISH = dish('Shahi Kheer (Cardamom Rice Pudding with Nuts)');
  const PLANT_DISH = dish('Daal Chawal Combo');

  it('serves an omnivore everything', () => {
    for (const food of [MEAT_DISH, FISH_DISH, EGG_DISH, DAIRY_DISH, PLANT_DISH]) {
      expect(isSuitableForDiet(food, 'halal_omnivore'), food.name).toBe(true);
    }
  });

  it('keeps meat and fish away from a vegetarian', () => {
    // The reported bug: a vegetarian was served Nargisi Kofta.
    expect(isSuitableForDiet(MEAT_DISH, 'vegetarian_desi')).toBe(false);
    expect(isSuitableForDiet(FISH_DISH, 'vegetarian_desi')).toBe(false);
    expect(isSuitableForDiet(EGG_DISH, 'vegetarian_desi')).toBe(false);
    expect(isSuitableForDiet(DAIRY_DISH, 'vegetarian_desi')).toBe(true);
    expect(isSuitableForDiet(PLANT_DISH, 'vegetarian_desi')).toBe(true);
  });

  it('allows an eggetarian eggs but not flesh', () => {
    expect(isSuitableForDiet(EGG_DISH, 'eggetarian')).toBe(true);
    expect(isSuitableForDiet(MEAT_DISH, 'eggetarian')).toBe(false);
    expect(isSuitableForDiet(FISH_DISH, 'eggetarian')).toBe(false);
  });

  it('allows a vegan none of the four', () => {
    expect(isSuitableForDiet(MEAT_DISH, 'vegan')).toBe(false);
    expect(isSuitableForDiet(FISH_DISH, 'vegan')).toBe(false);
    expect(isSuitableForDiet(EGG_DISH, 'vegan')).toBe(false);
    expect(isSuitableForDiet(DAIRY_DISH, 'vegan')).toBe(false);
    expect(isSuitableForDiet(PLANT_DISH, 'vegan')).toBe(true);
  });

  it('refuses an unidentified dish on every restrictive diet', () => {
    // Failing closed is the point: a plan built from a smaller certain pool
    // beats one that quietly serves a vegetarian something we could not place.
    const unknown = dish('Mystery Special');
    expect(isSuitableForDiet(unknown, 'vegetarian_desi')).toBe(false);
    expect(isSuitableForDiet(unknown, 'eggetarian')).toBe(false);
    expect(isSuitableForDiet(unknown, 'vegan')).toBe(false);
    // …but an omnivore is not restricted by our own uncertainty.
    expect(isSuitableForDiet(unknown, 'halal_omnivore')).toBe(true);
  });
});
