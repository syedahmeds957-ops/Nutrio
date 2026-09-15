import { describe, it, expect } from 'vitest';
import { NormalizedFood, RestaurantBrand, RegionCode } from '../src/types.js';

describe('Multi-Region Types', () => {
  it('supports RegionCode and bilingual Arabic fields', () => {
    const food: NormalizedFood = {
      name: 'Chicken Kabsa',
      nameAr: 'كبسة دجاج',
      category: 'Rice & Meat',
      cuisineTags: ['Saudi', 'Kabsa'],
      region: 'SA',
      kcal100g: 165,
      protein100g: 9.5,
      carb100g: 18.2,
      fat100g: 5.8,
      fibre100g: 1.2,
      sugar100g: 0.8,
      sodiumMg100g: 380,
      satFat100g: 1.4,
      source: 'sfda',
      oilAddedG: 4,
      servings: [{ label: '1 Plate (نفر)', grams: 350, isDefault: true, kcal: 580 }],
    };

    expect(food.region).toBe('SA');
    expect(food.nameAr).toBe('كبسة دجاج');
    expect(food.source).toBe('sfda');
  });

  it('supports Saudi RestaurantBrand definitions with Arabic tagline and brand group', () => {
    const brand: RestaurantBrand = {
      id: 'albaik',
      name: 'AlBaik',
      nameAr: 'البيك',
      tagline: 'Iconic Saudi broast & nuggets',
      taglineAr: 'أشهر بروستد في المملكة',
      icon: 'chicken',
      region: 'SA',
      brandGroup: 'Fast Food',
      categories: ['All', 'Chicken & Meals', 'Nuggets & Fillet', 'Sides & Dips'],
      itemCount: 24,
    };

    expect(brand.region).toBe('SA');
    expect(brand.nameAr).toBe('البيك');
    expect(brand.taglineAr).toBe('أشهر بروستد في المملكة');
  });
});
