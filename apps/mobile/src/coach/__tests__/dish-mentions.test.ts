import { beforeAll, describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { CoachContext } from '@nutrio/nutrition-core';
import type { NormalizedFood } from '@nutrio/food-db';
import { loadCatalogue } from '../../catalogue/index.js';
import { findDishMentions } from '../dishMentions.js';
import { DishLogChips } from '../ui/DishLogChips.js';
import { CoachChatScreen, type Message } from '../ui/CoachChatScreen.js';
import { initI18n } from '../../i18n/config.js';
import { RegionProvider } from '../../common/region/index.js';
import { ThemeProvider } from '../../theme.js';

const food = (over: Partial<NormalizedFood> & { name: string }): NormalizedFood => ({
  oilAddedG: 0,
  category: 'Test',
  cuisineTags: [],
  kcal100g: 200,
  protein100g: 10,
  carb100g: 20,
  fat100g: 8,
  fibre100g: 1,
  sugar100g: 1,
  sodiumMg100g: 100,
  satFat100g: 2,
  source: 'pak_custom',
  servings: [{ label: '1 standard serving (150g)', grams: 150, isDefault: true }],
  ...over,
});

const FOODS: NormalizedFood[] = [
  food({ id: 'karahi', name: 'Chicken Karahi (Restaurant Style)' }),
  food({ id: 'chicken-biryani', name: 'Chicken Biryani', aliases: ['biryani chicken'] }),
  food({ id: 'biryani', name: 'Biryani' }),
  food({ id: 'samosa', name: 'Samosa', aliases: ['aloo samosa'] }),
  food({ id: 'daal', name: 'Daal Chawal' }),
  food({ id: 'banana', name: 'Banana' }),
  food({ id: 'lassi', name: 'Sweet Lassi' }),
  food({ id: 'water', name: 'Water', kcal100g: 0 }),
  food({ id: 'oil', name: 'Cooking Oil (Any Plain Oil)', kcal100g: 884, servings: [{ label: '1 tsp (5g)', grams: 5, isDefault: true }] }),
];
const find = (text: string, max?: number) =>
  findDishMentions(text, 'PK', { foods: FOODS, ...(max ? { max } : {}) }).map((m) => m.food.id);

describe('findDishMentions', () => {
  it('matches a whole dish name, ignoring the style suffix and case', () => {
    expect(find('A plate of chicken karahi with one roti is fine.')).toEqual(['karahi']);
    expect(find('Try Daal Chawal tonight')).toEqual(['daal']);
  });

  it('matches a whole alias and a plural', () => {
    expect(find('Skip the aloo samosa today')).toEqual(['samosa']);
    expect(find('two samosas is plenty')).toEqual(['samosa']);
  });

  it('does not match generic words that are only part of a dish name', () => {
    expect(find('Have some rice, chicken or curry with the meal and a sweet treat')).toEqual([]);
    expect(find('The and with of')).toEqual([]);
    expect(find('')).toEqual([]);
  });

  it('prefers the longer name and uses up its words', () => {
    // "Chicken Biryani" wins; the shorter "Biryani" inside it is not also offered.
    expect(find('Go for the chicken biryani, small portion')).toEqual(['chicken-biryani']);
    // A bare "biryani" is its own dish.
    expect(find('Go for biryani')).toEqual(['biryani']);
  });

  it('returns at most three, in the order they appear in the text', () => {
    const text = 'Swap the samosa for a banana, then daal chawal, and sweet lassi after.';
    // Two-word names outrank the one-word "banana"; the three kept read in text order.
    expect(find(text)).toEqual(['samosa', 'daal', 'lassi']);
    expect(find(text, 2).length).toBe(2);
  });

  it('never offers a spoonful of oil that a reply only mentions in passing', () => {
    expect(findDishMentions('Keep cooking oil measured with your daal chawal.', 'PK', { foods: FOODS }).map((m) => m.food.id)).toEqual(['daal']);
  });

  it('never offers a zero-calorie food', () => {
    expect(find('Drink more water')).toEqual([]);
  });

  it('prices from the catalogue serving, never from the text', () => {
    const [m] = findDishMentions('Eat a samosa (about 50 kcal)', 'PK', { foods: FOODS });
    expect(m.serving.grams).toBe(150);
    expect(m.kcal).toBe(300); // 200 kcal/100 g * 150 g
  });

  describe('against the real catalogue', () => {
    beforeAll(async () => {
      await loadCatalogue();
    });

    it('finds a real dish by its everyday name and no dish for a bare ingredient', () => {
      const hit = findDishMentions('Order the chicken karahi and keep the naan small.', 'PK');
      expect(hit.length).toBeGreaterThan(0);
      expect(hit[0].food.name.toLowerCase()).toContain('chicken karahi');
      expect(hit[0].kcal).toBeGreaterThan(0);
      expect(findDishMentions('Fill half the plate with rice and some chicken.', 'PK')).toEqual([]);
    });
  });
});

describe('log chips', () => {
  const context = {
    displayName: 'Hamza',
    sex: 'male',
    ageYears: 28,
    weightKg: 80,
    goal: 'lose',
    region: 'PK',
    targets: { kcalTarget: 1950, proteinGrams: 145, fatGrams: 55, carbGrams: 220, waterMl: 3000 },
  } as CoachContext;
  const reply: Message[] = [
    { id: '1', role: 'assistant', text: 'Hello', sentAt: 0 },
    { id: '2', role: 'user', text: 'What should I eat?', sentAt: 1 },
    { id: '3', role: 'assistant', text: 'Have the chicken karahi with one roti.', sentAt: 2 },
  ];
  const render = (node: React.ReactElement) =>
    renderToStaticMarkup(
      React.createElement(RegionProvider, null, React.createElement(ThemeProvider, { initialMode: 'light', children: node })),
    );

  it('renders one chip per dish with name and catalogue calories', async () => {
    await loadCatalogue();
    initI18n('en');
    const [m] = findDishMentions(reply[2].text, 'PK');
    const html = render(React.createElement(DishLogChips, { mentions: [m], onLog: () => null }));
    expect(html).toContain('data-testid="coach-log-chips"');
    expect(html).toContain(`Log ${m.food.name} · ${m.kcal.toLocaleString('en-US')} kcal`);
    expect(html).toContain('role="button"');
  });

  it('shows the chip under the coach reply, only when logging is available', async () => {
    await loadCatalogue();
    initI18n('en');
    const withLog = render(
      React.createElement(CoachChatScreen, { context, onBack: () => {}, initialMessages: reply, onLogFood: () => null }),
    );
    expect(withLog).toContain('data-testid="coach-log-chips"');
    expect(withLog).toContain('Log Chicken Karahi');
    // The greeting and the user's own message get none: one chip row for one reply.
    expect(withLog.match(/data-testid="coach-log-chips"/g)).toHaveLength(1);

    const guest = render(React.createElement(CoachChatScreen, { context, onBack: () => {}, initialMessages: reply }));
    expect(guest).not.toContain('coach-log-chips');
  });

  it('has Arabic copy for the chip and the confirmation', async () => {
    const ar = (await import('../../i18n/locales/ar.json')).default as { coach: { log: Record<string, string> } };
    for (const text of Object.values(ar.coach.log)) expect(text.replace(/\{\{\w+\}\}/g, '')).not.toMatch(/[A-Za-z]/);
    expect(ar.coach.log.done).toContain('{{kcal}}');
  });
});
