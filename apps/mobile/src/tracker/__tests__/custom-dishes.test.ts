import { beforeEach, describe, expect, it, vi } from 'vitest';
import { composeRecipeFood } from '@nutrio/food-db';

let signedInUserId: string | undefined;
vi.mock('../../auth/authStorage.js', () => ({
  getAuthSession: () =>
    signedInUserId ? { token: 't', user: { id: signedInUserId }, createdAt: '' } : null,
}));

const {
  deleteCustomDish,
  loadCustomDishes,
  releaseCustomDishCache,
  saveCustomDish,
  searchCustomDishes,
} = await import('../customDishes.js');

const dish = (name: string) =>
  composeRecipeFood({
    name,
    ingredients: [
      { name: 'Grilled Chicken Breast (Skinless)', grams: 150 },
      { name: 'Cooking Oil (Any Plain Oil)', grams: 10 },
    ],
  })!.food;

describe('custom dishes', () => {
  beforeEach(() => {
    signedInUserId = 'user-a';
    releaseCustomDishCache();
    try {
      window.localStorage.clear();
    } catch {
      // No localStorage in this runner; the in-memory mirror is enough.
    }
  });

  it('finds a saved dish by any words of its name', () => {
    saveCustomDish(dish('Chicken Malai Handi'));
    expect(searchCustomDishes('malai handi').map((d) => d.name)).toEqual(['Chicken Malai Handi']);
    expect(searchCustomDishes('biryani')).toEqual([]);
  });

  it('is private to the account that added it', () => {
    saveCustomDish(dish('Chicken Malai Handi'));

    signedInUserId = 'user-b';
    expect(loadCustomDishes()).toEqual([]);
    expect(searchCustomDishes('malai')).toEqual([]);

    signedInUserId = 'user-a';
    expect(loadCustomDishes()).toHaveLength(1);
  });

  it('replaces a dish added again under the same name', () => {
    saveCustomDish(dish('Malai Handi'));
    saveCustomDish(dish('malai handi'));
    expect(loadCustomDishes()).toHaveLength(1);
  });

  it('deletes a dish', () => {
    const food = dish('Malai Handi');
    saveCustomDish(food);
    deleteCustomDish(food.id!);
    expect(loadCustomDishes()).toEqual([]);
  });
});
