import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { initI18n } from '../../i18n/config.js';
import { DishCard } from '../ui/DishCard.js';
import { foodDb } from '../../catalogue/index.js';
import { suggestedForSlot } from '../forYou.js';
import { orderSectionsForSlot, slotAllows } from '../dietSlotOrder.js';
import type { MealSlot } from '../types.js';
import type { Region } from '../../common/region/index.js';

const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snacks_chai'];
const REGIONS: Region[] = ['PK', 'SA'];
const sectionsFor = (region: Region, slot: MealSlot) =>
  orderSectionsForSlot(foodDb().groupDietFoods(foodDb().getDietBasicsForRegion(region)), slot);
const groupOf = (region: Region, slot: MealSlot, name: string) =>
  sectionsFor(region, slot).find((s) => s.foods.some((f) => f.name === name))!.group;

describe('suggestedForSlot', () => {
  it('gives every region and meal a short list of foods that suit that meal', () => {
    for (const region of REGIONS) {
      for (const slot of SLOTS) {
        const picks = suggestedForSlot(sectionsFor(region, slot), slot, region);
        expect(picks.length, `${region} ${slot}`).toBeGreaterThan(3);
        expect(picks.length).toBeLessThanOrEqual(8);
        for (const food of picks) expect(slotAllows(groupOf(region, slot, food.name), food, slot)).toBe(true);
        expect(new Set(picks.map((f) => f.name)).size).toBe(picks.length);
      }
    }
  });

  it('does not open on a loose fruit, vegetable, oil or drink', () => {
    for (const region of REGIONS) {
      for (const slot of SLOTS) {
        const picks = suggestedForSlot(sectionsFor(region, slot), slot, region);
        for (const food of picks) {
          expect(['fruits', 'vegetables', 'extras', 'beverages']).not.toContain(groupOf(region, slot, food.name));
        }
      }
    }
  });

  it('a snack starts on a snack and a Pakistani lunch on a Pakistani dish', () => {
    const snack = suggestedForSlot(sectionsFor('PK', 'snacks_chai'), 'snacks_chai', 'PK');
    expect(snack[0].cuisineTags).toContain('Snack');
    const lunch = suggestedForSlot(sectionsFor('PK', 'lunch'), 'lunch', 'PK');
    expect(lunch[0].cuisineTags).toContain('Pakistani');
  });

  it('puts the region first: Saudi lunch leads with Saudi-tagged food', () => {
    const lunch = suggestedForSlot(sectionsFor('SA', 'lunch'), 'lunch', 'SA');
    expect(lunch[0].cuisineTags).toContain('Saudi');
  });

  it('is empty rather than wrong when nothing fits', () => {
    expect(suggestedForSlot([], 'lunch', 'PK')).toEqual([]);
    expect(suggestedForSlot([{ group: 'extras', foods: [{ name: 'Olive Oil', cuisineTags: ['Basics'] }] }], 'lunch', 'PK')).toEqual([]);
  });
});

describe('one-tap quick add on a dish card', () => {
  const food = () => foodDb().getDietBasicsForRegion('PK')[0];
  const render = (onQuickAdd?: () => void) =>
    renderToStaticMarkup(
      React.createElement(DishCard, { item: food(), qty: 0, isBuildMode: false, onPress: () => {}, onRemoveOne: () => {}, onQuickAdd })
    );

  it('shows a labelled + button beside the card when quick add is on', () => {
    initI18n('en');
    const html = render(() => {});
    expect(html).toContain(`aria-label="Add one serving of ${food().name}"`);
  });

  it('has no + button without it (e.g. build mode, or no handler)', () => {
    initI18n('en');
    expect(render()).not.toContain('Add one serving of');
  });
});

describe('For you does not lead with a spoon of dip or a glass of smoothie', () => {
  const sections = [
    {
      group: 'meals',
      foods: [
        { name: 'Labneh', cuisineTags: ['Dinner', 'Saudi'], kcal100g: 155, servings: [{ label: '2 tbsp (30g)', grams: 30, isDefault: true }] },
        { name: 'Mango Smoothie', cuisineTags: ['Breakfast', 'Pakistani'], kcal100g: 79, servings: [{ label: '1 glass (280ml)', grams: 280, isDefault: true }] },
        { name: 'Kabsa', cuisineTags: ['Dinner', 'Saudi'], kcal100g: 160, servings: [{ label: '1 plate (300g)', grams: 300, isDefault: true }] },
      ],
    },
  ];

  it('skips a serving too small to be the meal', () => {
    expect(suggestedForSlot(sections, 'dinner', 'SA').map((f) => f.name)).toEqual(['Kabsa']);
  });

  it('skips a drink for breakfast', () => {
    expect(suggestedForSlot(sections, 'breakfast', 'PK').map((f) => f.name)).toEqual([]);
  });
});
