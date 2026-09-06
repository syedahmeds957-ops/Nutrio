import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import {
  ItemCustomizerModal,
  calculateCustomizedMacros,
  getEffectiveModifiers,
} from '../ui/ItemCustomizerModal.js';
import { CALORIFY_RESTAURANTS_DATA } from '@nutrio/food-db';

describe('ItemCustomizerModal Component & Macro Engine', () => {
  const zingerItem = CALORIFY_RESTAURANTS_DATA.find((i) => i.name === 'Zinger Burger')!;
  const pizzaItem = CALORIFY_RESTAURANTS_DATA.find((i) => i.name.includes('Pizza')) || ({
    name: 'Crown Crust Pizza (Slice)',
    brand: 'Cheezious',
    category: 'Fast Food',
    kcal100g: 259,
    protein100g: 11.8,
    carb100g: 25.5,
    fat100g: 12.3,
    servings: [
      {
        label: '1 slice (110g)',
        grams: 110,
        isDefault: true,
        kcal: 285,
        proteinGrams: 13,
        carbGrams: 28,
        fatGrams: 13.5,
      },
    ],
  } as any);

  it('calculates base macros correctly for 1 Zinger Burger', () => {
    expect(zingerItem).toBeDefined();
    const res = calculateCustomizedMacros(zingerItem, 1, {});

    expect(res.calories).toBe(640);
    expect(res.protein).toBe(25);
    expect(res.carbs).toBe(59);
    expect(res.fat).toBe(35);
  });

  it('calculates macros correctly for 2 Zinger Burgers', () => {
    const res = calculateCustomizedMacros(zingerItem, 2, {});

    expect(res.calories).toBe(1280);
    expect(res.protein).toBe(50);
    expect(res.carbs).toBe(118);
    expect(res.fat).toBe(70);
  });

  it('accurately adds modifiers: Extra Zinger fillet (+305 kcal) and Extra cheese (+40 kcal)', () => {
    const modifierCounts: Record<string, number> = {
      kfc_mod_zinger_fillet: 1,
      kfc_mod_cheese_slice: 1,
    };

    const res = calculateCustomizedMacros(zingerItem, 1, modifierCounts);

    expect(res.calories).toBe(985);
    expect(res.protein).toBe(48);
    expect(res.carbs).toBe(74);
    expect(res.fat).toBe(56);
  });

  it('calculates macros correctly when user eats multiple slices of pizza (e.g. 3 slices)', () => {
    const res = calculateCustomizedMacros(pizzaItem, 3, {});

    expect(res.calories).toBe(855);
    expect(res.protein).toBe(39);
    expect(res.carbs).toBe(84);
    expect(res.fat).toBe(41);
  });

  it('calculates macros proportionally when user inputs custom portion in grams (e.g. 300g)', () => {
    const res = calculateCustomizedMacros(zingerItem, 1, {}, 300);

    expect(res.calories).toBe(888);
    expect(res.protein).toBe(34);
    expect(res.carbs).toBe(80);
    expect(res.fat).toBe(48);
  });

  it('generates context-smart modifiers for items without pre-defined modifiers', () => {
    const pizzaMods = getEffectiveModifiers(pizzaItem);
    expect(pizzaMods.some((m) => m.name.includes('Mozzarella'))).toBe(true);
    expect(pizzaMods.some((m) => m.name.includes('Garlic Mayo'))).toBe(true);

    const genericBiryani = {
      name: 'Chicken Biryani Special',
      category: 'Rice & Biryani',
      cuisineTags: ['Biryani', 'Rice'],
    } as any;
    const biryaniMods = getEffectiveModifiers(genericBiryani);
    expect(biryaniMods.some((m) => m.name.includes('Shami'))).toBe(true);
    expect(biryaniMods.some((m) => m.name.includes('Raita'))).toBe(true);
  });

  it('renders modal with item details, quantity stepper, and modifiers', () => {
    const handleBack = vi.fn();
    const handleLog = vi.fn();

    const element = React.createElement(ItemCustomizerModal, {
      visible: true,
      item: zingerItem,
      onBack: handleBack,
      onLogItem: handleLog,
    });

    expect(element).toBeDefined();
    expect(element.props.visible).toBe(true);
    expect(element.props.item?.name).toBe('Zinger Burger');
  });

  it('invokes onLogItem with calculated customized totals when confirmed', () => {
    const handleBack = vi.fn();
    const handleLog = vi.fn();

    const element = React.createElement(ItemCustomizerModal, {
      visible: true,
      item: zingerItem,
      onBack: handleBack,
      onLogItem: handleLog,
    });

    const customizedPayload = {
      food: zingerItem,
      quantity: 1,
      selectedModifiers: { kfc_mod_cheese: 1 },
      totalCalories: 680,
      totalProtein: 27,
      totalCarbs: 60,
      totalFat: 38,
      mealSlot: 'lunch' as const,
      portionDescription: '1 standard burger (220g)',
      actualGrams: 220,
    };

    element.props.onLogItem?.(customizedPayload);
    expect(handleLog).toHaveBeenCalledWith(customizedPayload);
  });

  describe('Non-Customizable Packaged Items (Hide "Make it yours", Calorify Style)', () => {
    it('returns empty modifier list for packaged beverages and canned drinks', () => {
      const dietCoke = {
        name: 'Diet Coke 330ml Can',
        brand: 'Coca Cola',
        brandCategory: 'Beverages',
        category: 'Cold Drinks',
      } as any;

      const mods = getEffectiveModifiers(dietCoke);
      expect(mods).toEqual([]);
    });

    it('returns empty modifier list for bottled mineral water', () => {
      const water = {
        name: 'Aquafina Mineral Water 500ml',
        brand: 'Aquafina',
        brandCategory: 'Water',
        category: 'Beverages',
      } as any;

      const mods = getEffectiveModifiers(water);
      expect(mods).toEqual([]);
    });

    it('calculates clean macros for non-customizable items using only quantity and portion size', () => {
      const dietCoke = {
        name: 'Diet Coke 330ml Can',
        brand: 'Coca Cola',
        category: 'Packaged Drinks',
        kcal100g: 1,
        protein100g: 0,
        carb100g: 0,
        fat100g: 0,
        servings: [
          {
            label: '1 can (330ml)',
            grams: 330,
            isDefault: true,
            kcal: 3,
            proteinGrams: 0,
            carbGrams: 0,
            fatGrams: 0,
          },
        ],
      } as any;

      const res = calculateCustomizedMacros(dietCoke, 2, {});
      expect(res.calories).toBe(6);
      expect(res.protein).toBe(0);
      expect(res.carbs).toBe(0);
      expect(res.fat).toBe(0);
    });
  });

  describe('Dish-Specific "Make It Yours" Customization Engine', () => {
    it('accurately assigns biryani modifiers to Student Biryani and rejects karahi/nihari modifiers', () => {
      const studentBiryaniItem = {
        name: 'Special Chicken Biryani with Potato',
        brand: 'Student Biryani',
        brandCategory: 'Famous Biryani',
        category: 'Pakistani Fast Food',
        cuisineTags: ['Desi BBQ', 'Student Biryani', 'Pakistani'],
      } as any;

      const mods = getEffectiveModifiers(studentBiryaniItem);
      const modNames = mods.map((m) => m.name);

      // Must contain authentic Biryani options
      expect(modNames.some((n) => n.includes('Potato (Aloo'))).toBe(true);
      expect(modNames.some((n) => n.includes('Chicken Piece'))).toBe(true);
      expect(modNames.some((n) => n.includes('Shami Kabab'))).toBe(true);
      expect(modNames.some((n) => n.includes('Raita'))).toBe(true);
      expect(modNames.some((n) => n.includes('Kachumber Salad'))).toBe(true);

      // Must NEVER contain Karahi/Nihari options despite "Desi BBQ" tag
      expect(modNames.some((n) => n.toLowerCase().includes('makhan'))).toBe(false);
      expect(modNames.some((n) => n.toLowerCase().includes('nalli'))).toBe(false);
      expect(modNames.some((n) => n.toLowerCase().includes('maghaz'))).toBe(false);
    });

    it('assigns marrow and maghaz modifiers to Nihari and Paye', () => {
      const nihariItem = {
        name: 'Special Nalli Nihari',
        brand: 'Javed Nihari',
        brandCategory: 'Traditional Nihari',
        category: 'Slow-Cooked Delicacies',
        cuisineTags: ['Nihari', 'Pakistani'],
      } as any;

      const mods = getEffectiveModifiers(nihariItem);
      const modNames = mods.map((m) => m.name);

      expect(modNames.some((n) => n.includes('Nalli / Bone Marrow'))).toBe(true);
      expect(modNames.some((n) => n.includes('Maghaz / Brain'))).toBe(true);
      expect(modNames.some((n) => n.includes('Desi Ghee / Tarka Roghan'))).toBe(true);
      expect(modNames.some((n) => n.includes('Low Roghan / Drained Oil'))).toBe(true);

      expect(modNames.some((n) => n.toLowerCase().includes('biryani'))).toBe(false);
    });

    it('assigns makhan and desi ghee modifiers to Karahi and Handi', () => {
      const karahiItem = {
        name: 'Mutton Shinwari Karahi',
        brand: 'Shinwari',
        brandCategory: 'Karahi & Handi',
        category: 'Pakistani Main',
      } as any;

      const mods = getEffectiveModifiers(karahiItem);
      const modNames = mods.map((m) => m.name);

      expect(modNames.some((n) => n.includes('Makhan / Butter'))).toBe(true);
      expect(modNames.some((n) => n.includes('Pure Desi Ghee Tarka'))).toBe(true);
      expect(modNames.some((n) => n.includes('Extra Masala / Gravy'))).toBe(true);
      expect(modNames.some((n) => n.includes('Low Oil Preparation'))).toBe(true);
    });

    it('assigns chutney and butter brush modifiers to Desi BBQ and Tikka', () => {
      const tikkaItem = {
        name: 'Chicken Tikka Chest Piece',
        brand: 'BBQ Tonight',
        brandCategory: 'Charcoal BBQ',
        category: 'BBQ',
      } as any;

      const mods = getEffectiveModifiers(tikkaItem);
      const modNames = mods.map((m) => m.name);

      expect(modNames.some((n) => n.includes('Butter Brush on Skewer'))).toBe(true);
      expect(modNames.some((n) => n.includes('Imlee Chutney'))).toBe(true);
      expect(modNames.some((n) => n.includes('Mint & Coriander Raita Dip'))).toBe(true);
      expect(modNames.some((n) => n.includes('Lemon Wedges & Spiced Onion'))).toBe(true);
    });

    it('assigns toum and shredded meat options to Shawarma and Rolls', () => {
      const shawarmaItem = {
        name: 'Chicken Shawarma Roll',
        brand: 'Hot N Spicy',
        brandCategory: 'Rolls & Wraps',
        category: 'Fast Food',
      } as any;

      const mods = getEffectiveModifiers(shawarmaItem);
      const modNames = mods.map((m) => m.name);

      expect(modNames.some((n) => n.includes('Garlic Toum Sauce'))).toBe(true);
      expect(modNames.some((n) => n.includes('Mozzarella Cheese Layer'))).toBe(true);
      expect(modNames.some((n) => n.includes('Extra Shredded Tikka / Shawarma Meat'))).toBe(true);
      expect(modNames.some((n) => n.includes('Dry / Light Sauce'))).toBe(true);
    });

    it('assigns sugar adjustments and malai to Chai', () => {
      const chaiItem = {
        name: 'Karak Doodh Patti Chai',
        brand: 'Chai Khas',
        brandCategory: 'Hot Beverages',
        category: 'Chai',
      } as any;

      const mods = getEffectiveModifiers(chaiItem);
      const modNames = mods.map((m) => m.name);

      expect(modNames.some((n) => n.includes('Extra White Sugar (1 tsp / 4g)'))).toBe(true);
      expect(modNames.some((n) => n.includes('Without Sugar (No Meetha)'))).toBe(true);
      expect(modNames.some((n) => n.includes('Extra Malai / Full Cream Milk Layer'))).toBe(true);
      expect(modNames.some((n) => n.includes('Cardamom / Elaichi Infusion'))).toBe(true);
    });

    it('assigns ice cream and sweetness adjustments to cold shakes', () => {
      const shakeItem = {
        name: 'Special Mango Shake',
        brand: 'Hafiz Sweets',
        brandCategory: 'Shakes & Smoothies',
        category: 'Beverages',
      } as any;

      const mods = getEffectiveModifiers(shakeItem);
      const modNames = mods.map((m) => m.name);

      expect(modNames.some((n) => n.includes('Extra Sugar / Sugar Syrup'))).toBe(true);
      expect(modNames.some((n) => n.includes('No Added Sugar'))).toBe(true);
      expect(modNames.some((n) => n.includes('Extra Premium Ice Cream Scoop'))).toBe(true);
    });

    it('assigns halwa, chana, and extra puri to Halwa Puri Nashta', () => {
      const halwaPuriItem = {
        name: 'Halwa Puri Thali',
        brand: 'Nashta Corner',
        brandCategory: 'Breakfast',
        category: 'Desi Nashta',
      } as any;

      const mods = getEffectiveModifiers(halwaPuriItem);
      const modNames = mods.map((m) => m.name);

      expect(modNames.some((n) => n.includes('Extra Crispy Puri'))).toBe(true);
      expect(modNames.some((n) => n.includes('Extra Sooji Halwa'))).toBe(true);
      expect(modNames.some((n) => n.includes('Mixed Achar'))).toBe(true);
    });

    it('assigns rabri and nuts to Desi Sweets', () => {
      const dessertItem = {
        name: 'Gulab Jamun with Syrup',
        brand: 'Shireen Mahal',
        brandCategory: 'Desi Sweets',
        category: 'Desserts',
      } as any;

      const mods = getEffectiveModifiers(dessertItem);
      const modNames = mods.map((m) => m.name);

      expect(modNames.some((n) => n.includes('Extra Thick Rabri Topping'))).toBe(true);
      expect(modNames.some((n) => n.includes('Crushed Badam & Pista Garnish'))).toBe(true);
      expect(modNames.some((n) => n.includes('Light Chasni'))).toBe(true);
    });

    it('assigns tarka to Daal & Sabzi dishes', () => {
      const daalItem = {
        name: 'Daal Makhni Special',
        brand: 'Desi Khaba',
        brandCategory: 'Vegetarian',
        category: 'Daal & Vegetables',
      } as any;

      const mods = getEffectiveModifiers(daalItem);
      const modNames = mods.map((m) => m.name);

      expect(modNames.some((n) => n.includes('Desi Ghee Zeera Tarka'))).toBe(true);
      expect(modNames.some((n) => n.includes('Boiled Egg Slice'))).toBe(true);
      expect(modNames.some((n) => n.includes('Spicy Mango Achar'))).toBe(true);
    });

    it('assigns herb sauce and mashed potatoes to Cafe Aylanto Chicken with Roasted Garlic & Herb Jus and rejects tea/chai options', () => {
      const aylantoChicken = {
        id: 'cafe_aylanto_item_3',
        name: 'Chicken with Roasted Garlic & Herb Jus',
        brand: 'Cafe Aylanto',
        brandCategory: 'Gourmet Steaks & Mains',
        category: 'Pakistani Fast Food',
        cuisineTags: ['Asian & Continental', 'Cafe Aylanto', 'Pakistani'],
      } as any;

      const mods = getEffectiveModifiers(aylantoChicken);
      const modNames = mods.map((m) => m.name);

      // Must receive authentic gourmet steak/entree options
      expect(modNames.some((n) => n.includes('Peppercorn / Mushroom Jus'))).toBe(true);
      expect(modNames.some((n) => n.includes('Mashed Potatoes Side'))).toBe(true);
      expect(modNames.some((n) => n.includes('Sautéed Garlic Butter Vegetables'))).toBe(true);
      expect(modNames.some((n) => n.includes('Garlic Herb Compound Butter'))).toBe(true);

      // Must NEVER match tea/chai options despite "Steaks" containing "tea"
      expect(modNames.some((n) => n.toLowerCase().includes('sugar'))).toBe(false);
      expect(modNames.some((n) => n.toLowerCase().includes('malai'))).toBe(false);
      expect(modNames.some((n) => n.toLowerCase().includes('elaichi'))).toBe(false);
    });

    it('assigns parmesan and garlic bread to Pasta & Italian mains', () => {
      const pastaItem = {
        name: 'Fettuccine Alfredo with Chicken',
        brand: 'Del Frio',
        brandCategory: 'Pasta & Italian',
        category: 'Italian',
      } as any;

      const mods = getEffectiveModifiers(pastaItem);
      const modNames = mods.map((m) => m.name);

      expect(modNames.some((n) => n.includes('Parmesan Shavings'))).toBe(true);
      expect(modNames.some((n) => n.includes('Garlic Baguette Toast'))).toBe(true);
      expect(modNames.some((n) => n.includes('Grilled Chicken Strips'))).toBe(true);
    });

    it('assigns gelato and chocolate drizzle to Cafe Aylanto Warm Dark Chocolate Tart and rejects steak options', () => {
      const chocolateTart = {
        id: 'cafe_aylanto_item_14',
        name: 'Warm Dark Chocolate Tart with Cream',
        brand: 'Cafe Aylanto',
        brandCategory: 'Artisan Desserts',
        category: 'Pakistani Fast Food',
        cuisineTags: ['Asian & Continental', 'Cafe Aylanto', 'Pakistani'],
      } as any;

      const mods = getEffectiveModifiers(chocolateTart);
      const modNames = mods.map((m) => m.name);

      // Must receive authentic dessert options
      expect(modNames.some((n) => n.includes('Vanilla Bean Gelato Scoop'))).toBe(true);
      expect(modNames.some((n) => n.includes('Belgian Chocolate Drizzle'))).toBe(true);
      expect(modNames.some((n) => n.includes('Fresh Dairy Whipped Cream'))).toBe(true);
      expect(modNames.some((n) => n.includes('Wild Berries Compote'))).toBe(true);

      // Must NEVER receive steak/entree options despite Asian & Continental tag
      expect(modNames.some((n) => n.toLowerCase().includes('peppercorn'))).toBe(false);
      expect(modNames.some((n) => n.toLowerCase().includes('mashed potatoes'))).toBe(false);
    });

    it('assigns dessert options to Cafe Aylanto Classic Creme Brulee', () => {
      const cremeBrulee = {
        id: 'cafe_aylanto_item_15',
        name: 'Classic Creme Brulee with Caramelized Crust',
        brand: 'Cafe Aylanto',
        brandCategory: 'Artisan Desserts',
        category: 'Pakistani Fast Food',
        cuisineTags: ['Asian & Continental', 'Cafe Aylanto', 'Pakistani'],
      } as any;

      const mods = getEffectiveModifiers(cremeBrulee);
      const modNames = mods.map((m) => m.name);

      expect(modNames.some((n) => n.includes('Vanilla Bean Gelato Scoop'))).toBe(true);
      expect(modNames.some((n) => n.toLowerCase().includes('mashed potatoes'))).toBe(false);
    });

    it('assigns salad dressing and feta cheese to Cafe Aylanto Mediterranean Salad', () => {
      const salad = {
        id: 'cafe_aylanto_item_10',
        name: 'Aylanto Mediterranean Salad with Feta',
        brand: 'Cafe Aylanto',
        brandCategory: 'Salads & Appetizers',
        category: 'Pakistani Fast Food',
        cuisineTags: ['Asian & Continental', 'Cafe Aylanto', 'Pakistani'],
      } as any;

      const mods = getEffectiveModifiers(salad);
      const modNames = mods.map((m) => m.name);

      expect(modNames.some((n) => n.includes('Crumbled Greek Feta'))).toBe(true);
      expect(modNames.some((n) => n.includes('Garlic Herb Croutons'))).toBe(true);
      expect(modNames.some((n) => n.includes('Grilled Chicken Breast'))).toBe(true);

      expect(modNames.some((n) => n.toLowerCase().includes('mashed potatoes'))).toBe(false);
      expect(modNames.some((n) => n.toLowerCase().includes('gelato'))).toBe(false);
    });
  });
});
