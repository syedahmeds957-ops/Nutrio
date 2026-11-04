import { describe, expect, it } from 'vitest';
import {
  ALL_EXPANDED_PAKISTANI_FOODS,
  PAKISTANI_EXPANDED_BRANDS as GENERATED_BRANDS,
  PAKISTANI_RESTAURANT_BRANDS,
} from '../src/index.js';

// The brands as the app shows them: the generated list plus the drinks tab that data/index.ts adds to
// any brand with drinks (the separate brand-drink lists are not part of the generated file).
const PAKISTANI_EXPANDED_BRANDS = PAKISTANI_RESTAURANT_BRANDS.filter((brand) =>
  GENERATED_BRANDS.some((generated) => generated.id === brand.id)
);

// The menu screen builds its tabs from `brand.categories` ("All" first) and filters items by
// `item.brandCategory`. These tests encode what a correctly filed menu looks like, without
// naming any category: only the shape of the tab list and negative rules (a pizza is never a
// dessert, a latte is never a bread). Scope: the brands in PAKISTANI_EXPANDED_BRANDS.

type Item = (typeof ALL_EXPANDED_PAKISTANI_FOODS)[number];

const itemsOf = (brandName: string): Item[] =>
  ALL_EXPANDED_PAKISTANI_FOODS.filter((food) => food.brand === brandName);

/** Items from every expanded brand, with the brand attached, so one rule runs over all of them. */
const ALL_ITEMS: Array<{ brand: (typeof PAKISTANI_EXPANDED_BRANDS)[number]; food: Item }> =
  PAKISTANI_EXPANDED_BRANDS.flatMap((brand) => itemsOf(brand.name).map((food) => ({ brand, food })));

const label = ({ brand, food }: { brand: { name: string }; food: Item }) =>
  `${brand.name} | ${food.name} | ${food.brandCategory}`;

/** Fails with the offenders listed (first 15), so a misfiling is readable in the CI log. */
function expectNone(offenders: string[], rule: string) {
  const shown = offenders.slice(0, 15).join('\n  ');
  const more = offenders.length > 15 ? `\n  ... and ${offenders.length - 15} more` : '';
  expect(offenders, `${rule}: ${offenders.length} misfiled\n  ${shown}${more}`).toEqual([]);
}

// Category names that mean "a drink" (word-bounded so "Gourmet Steaks" is not a "tea" tab).
const DRINK_CATEGORY =
  /\b(drinks?|beverages?|chai|coffees?|teas?|brews?|lassi|shakes?|juices?|cafe|cold|refresh\w*|espresso|lattes?|frappes?|coolers?|chillers?|qahwa|kehwa)\b/i;
const DESSERT_CATEGORY =
  /dessert|sweet|meetha|bakery|cake|brownie|mithai|treat|donut|doughnut|pastr|cookie|sundae|mousse|tart|ice cream|halwa|ladoo|roll/i;

const DRINK_NAME =
  /\b(chai|coffee|latte|cappuccino|macchiato|espresso|qahwa|kehwa|lassi|milk ?shake|shake|juice|mojito|soda|cola|smoothie|frappe|cold brew|iced tea|green tea|karak)\b/i;
const DESSERT_NAME =
  /\b(cake|brownie|cookie|donut|doughnut|gulab jamun|ladoo|halwa|kheer|ice cream|cinnamon roll|cheesecake|mithai|barfi|jalebi|rasmalai)s?\b/i;
const PIZZA_NAME = /\b(pizza|pepperoni|sicilian|margherita|crust)\b/i;
const BURGER_NAME = /\bburger\b/i;

// No allow-list: on the current data every drink-word match is a real drink (a cake or flavour
// named after coffee or chai would need an explicit exception here, with a reason).

describe('restaurant menu categories: tab list', () => {
  it('covers the expanded brands', () => {
    expect(PAKISTANI_EXPANDED_BRANDS.length).toBeGreaterThan(0);
  });

  for (const brand of PAKISTANI_EXPANDED_BRANDS) {
    describe(brand.name, () => {
      const items = itemsOf(brand.name);

      it('has items, starts its tabs with "All" and lists no category twice', () => {
        expect(items.length, `${brand.name} has no items`).toBeGreaterThan(0);
        expect(brand.categories[0]).toBe('All');
        expect(new Set(brand.categories).size, `duplicate categories: ${brand.categories.join(', ')}`).toBe(
          brand.categories.length
        );
      });

      it('has no empty tab', () => {
        const used = new Set(items.map((food) => food.brandCategory));
        const empty = brand.categories.slice(1).filter((category) => !used.has(category));
        expect(empty, `tabs with no items: ${empty.join(', ')}`).toEqual([]);
      });

      it('files every item under a category the brand lists', () => {
        const offenders = items
          .filter((food) => !brand.categories.includes(food.brandCategory ?? ''))
          .map((food) => `${food.name} | ${food.brandCategory}`);
        expectNone(offenders, `${brand.name} items filed under an unlisted category (the tab would not exist)`);
      });
    });
  }
});

describe('restaurant menu categories: filed by what the item is', () => {
  it('drinks sit in a drink-like category', () => {
    const offenders = ALL_ITEMS.filter(
      ({ food }) =>
        DRINK_NAME.test(food.name) && !DRINK_CATEGORY.test(food.brandCategory ?? '')
    ).map(label);
    expectNone(offenders, 'drink-named items outside a drink category');
  });

  it('pizzas at pizza brands are never a dessert, dip, sauce or drink', () => {
    const isPizzaBrand = (name: string) => /pizza/i.test(name) || /^(Domino's|Pizza Hut|Papa John's)/i.test(name);
    const offenders = ALL_ITEMS.filter(
      ({ brand, food }) =>
        isPizzaBrand(brand.name) &&
        PIZZA_NAME.test(food.name) &&
        /dessert|dip|sauce|drink|beverage/i.test(food.brandCategory ?? '')
    ).map(label);
    expectNone(offenders, 'pizza items under dessert/dip/sauce/drink');
  });

  it('burgers are never a dessert, dip, sauce, drink or fries', () => {
    const offenders = ALL_ITEMS.filter(
      ({ food }) =>
        BURGER_NAME.test(food.name) && /dessert|dip|sauce|drink|beverage|fries/i.test(food.brandCategory ?? '')
    ).map(label);
    expectNone(offenders, 'burger items under dessert/dip/sauce/drink/fries');
  });

  it('desserts sit in a dessert-like category', () => {
    // A drink wins over a dessert word ("Cold Coffee with Ice Cream" is a drink); halwa puri is a
    // breakfast, not a sweet.
    const offenders = ALL_ITEMS.filter(
      ({ food }) =>
        DESSERT_NAME.test(food.name) &&
        !DRINK_NAME.test(food.name) &&
        !/halwa puri/i.test(food.name) &&
        !DESSERT_CATEGORY.test(food.brandCategory ?? '')
    ).map(label);
    expectNone(offenders, 'dessert-named items outside a dessert category');
  });
});

describe('restaurant menu categories: known regressions', () => {
  const find = (brand: string, name: string): Item => {
    const food = ALL_EXPANDED_PAKISTANI_FOODS.find((f) => f.brand === brand && f.name === name);
    if (!food) throw new Error(`Test data moved: "${name}" not found at ${brand}`);
    return food;
  };

  it("Domino's Beef Pepperoni Passion is not under dessert, dip or side", () => {
    expect(find("Domino's Pakistan", 'Beef Pepperoni Passion').brandCategory).not.toMatch(/dessert|dip|side/i);
  });

  it("Domino's Cheese Lover Mozzarella Burst is not under dessert, dip or side", () => {
    expect(find("Domino's Pakistan", 'Cheese Lover Mozzarella Burst').brandCategory).not.toMatch(/dessert|dip|side/i);
  });

  it('Tehzeeb Bakers Karak Doodh Patti Chai is in a drink category', () => {
    expect(find('Tehzeeb Bakers', 'Karak Doodh Patti Chai (Full Cream)').brandCategory).toMatch(DRINK_CATEGORY);
  });

  it('Tehzeeb Bakers Cappuccino is in a drink category', () => {
    expect(find('Tehzeeb Bakers', 'Cappuccino with Velvety Foam').brandCategory).toMatch(DRINK_CATEGORY);
  });

  it('Burger Lab Double Smash Melt is not under dip, sauce or dessert', () => {
    expect(find('Burger Lab', 'Double Smash Melt with Caramelized Onions').brandCategory).not.toMatch(
      /dip|sauce|dessert/i
    );
  });
});
