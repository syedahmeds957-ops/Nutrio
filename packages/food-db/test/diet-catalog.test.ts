import { describe, it, expect } from 'vitest';
import {
  DIET_BASICS_CATALOG,
  ALL_FOODS_CATALOG,
  DRESSING_MODIFIERS,
  ALL_DIET_ADDON_MODIFIERS,
  searchPakistaniFoods,
  isDietBasic,
} from '../src/index.js';

/**
 * Invariants for the whole Diet & Basics catalogue, across every phase file.
 * Each expansion phase adds data; this suite is what keeps it honest.
 */
describe('Diet & Basics catalogue', () => {
  it('derives kcal from macros (Atwater: P*4 + C*4 + F*9, +-5/100g)', () => {
    // Collected rather than asserted in the loop so one run lists every
    // offender — fixing these one failure at a time is needlessly slow.
    const violations = DIET_BASICS_CATALOG.flatMap((food) => {
      const expected = Math.round(
        food.protein100g * 4 + food.carb100g * 4 + food.fat100g * 9
      );
      return Math.abs(food.kcal100g - expected) > 5
        ? [`${food.name}: stated ${food.kcal100g}, macros imply ${expected}`]
        : [];
    });
    expect(violations, `Atwater mismatches:\n${violations.join('\n')}`).toHaveLength(0);
  });

  it('never states a negative macro or calorie figure', () => {
    for (const food of DIET_BASICS_CATALOG) {
      expect(food.kcal100g, food.name).toBeGreaterThanOrEqual(0);
      expect(food.protein100g, food.name).toBeGreaterThanOrEqual(0);
      expect(food.carb100g, food.name).toBeGreaterThanOrEqual(0);
      expect(food.fat100g, food.name).toBeGreaterThanOrEqual(0);
    }
  });

  it('claims only provenance we can actually back', () => {
    for (const food of DIET_BASICS_CATALOG) {
      // 'dietitian_approved' is deliberately absent: no dietitian has reviewed
      // these. Recipe items are 'composed' — summed from USDA components.
      expect(['usda_reference', 'composed'], food.name).toContain(food.verifiedBy);
    }
  });

  it('is bilingual in both supported locales', () => {
    for (const food of DIET_BASICS_CATALOG) {
      expect(food.nameUr, `${food.name} missing nameUr`).toBeTruthy();
      expect(food.nameAr, `${food.name} missing nameAr`).toBeTruthy();
    }
  });

  it('files every item under the Diet & Basics filter pill', () => {
    for (const food of DIET_BASICS_CATALOG) {
      expect(food.category, food.name).toBe('Diet & Basics');
      expect(food.region, food.name).toBe('GLOBAL');
    }
  });

  it('offers a natural default serving, not a bare 100g', () => {
    for (const food of DIET_BASICS_CATALOG) {
      expect(food.servings.length, `${food.name} has no servings`).toBeGreaterThan(0);
      const defaults = food.servings.filter((s) => s.isDefault);
      expect(defaults.length, `${food.name} must have exactly one default serving`).toBe(1);
      for (const serving of food.servings) {
        expect(serving.grams, `${food.name} / ${serving.label}`).toBeGreaterThan(0);
        expect(serving.label.length, food.name).toBeGreaterThan(1);
      }
    }
  });

  it('assigns every item a unique, stable, prefixed id', () => {
    const ids = DIET_BASICS_CATALOG.map((f) => f.id);
    expect(new Set(ids).size, 'duplicate diet ids').toBe(ids.length);
    for (const id of ids) {
      expect(id, `${id} is not a recognised diet id prefix`).toMatch(
        /^diet_(basic|bev|salad|dress|arab|pk|soup|brk|snack|egg|fat|fruit|leg|veg|meat|sea|dairy|grain|nut)_\d+$/
      );
    }
  });

  it('does not collide with names already in the wider catalogue', () => {
    const dietNames = new Set(DIET_BASICS_CATALOG.map((f) => f.name.toLowerCase()));
    const clashes = ALL_FOODS_CATALOG.filter(
      (f) => f.category !== 'Diet & Basics' && dietNames.has(f.name.toLowerCase())
    ).map((f) => f.name);
    expect(clashes, `names duplicated outside Diet & Basics: ${clashes.join(', ')}`).toHaveLength(0);
  });
});

describe('Phase 1 — beverages', () => {
  const beverages = DIET_BASICS_CATALOG.filter((f) => f.id?.startsWith('diet_bev_'));

  it('adds the plain home-made drinks that were missing', () => {
    expect(beverages).toHaveLength(18);
  });

  it('covers the chai variants that carry the hidden calories', () => {
    const names = beverages.map((f) => f.name);
    expect(names).toContain('Home Chai (With Sugar)');
    expect(names).toContain('Home Chai (No Sugar)');
    expect(names).toContain('Doodh Patti (Full Milk, Sugar)');
  });

  it('prices sugar honestly: sugared chai costs more than unsweetened', () => {
    const plain = beverages.find((f) => f.name === 'Home Chai (No Sugar)')!;
    const sweet = beverages.find((f) => f.name === 'Home Chai (With Sugar)')!;
    const doodhPatti = beverages.find((f) => f.name === 'Doodh Patti (Full Milk, Sugar)')!;
    expect(sweet.kcal100g).toBeGreaterThan(plain.kcal100g);
    expect(doodhPatti.kcal100g).toBeGreaterThan(sweet.kcal100g);
  });

  it('keeps zero-calorie drinks at zero so they can be logged freely', () => {
    const water = beverages.find((f) => f.name === 'Water')!;
    expect(water.kcal100g).toBe(0);
  });
});

describe('Phase 2 — composed salads', () => {
  const salads = DIET_BASICS_CATALOG.filter((f) => f.id?.startsWith('diet_salad_'));

  it('adds the assembled salads', () => {
    expect(salads).toHaveLength(31);
  });

  it('spans the real range of what "a salad" costs', () => {
    const kcal = (name: string) => salads.find((f) => f.name === name)!.kcal100g;
    // Both of these are salads. One is three times the other, entirely because
    // of what was added to the leaves.
    expect(kcal('Som Tam (Thai Green Papaya Salad)')).toBeLessThan(70);
    expect(kcal('Cobb Salad')).toBeGreaterThan(180);
  });

  it('declares composed provenance, since no USDA row exists for a built dish', () => {
    for (const salad of salads) {
      expect(salad.verifiedBy, salad.name).toBe('composed');
    }
  });

  it('does not pretend mayo-heavy salads are light', () => {
    const russian = salads.find((f) => f.name === 'Russian Salad')!;
    const kachumber = salads.find((f) => f.name === 'Kachumber Salad')!;
    expect(russian.kcal100g).toBeGreaterThan(150);
    expect(kachumber.kcal100g).toBeLessThan(40);
  });

  it('prices the dressing-and-crouton Caesar above the plain one', () => {
    const plain = salads.find((f) => f.name === 'Chicken Caesar Salad (No Croutons)')!;
    const loaded = salads.find((f) => f.name === 'Caesar Salad (With Croutons & Dressing)')!;
    expect(loaded.kcal100g).toBeGreaterThan(plain.kcal100g);
  });

  it('offers dressing modifiers so the customizer can add them in place', () => {
    for (const salad of salads) {
      expect(salad.modifiers?.length, `${salad.name} has no dressing modifiers`).toBeGreaterThan(0);
    }
  });
});

describe('Phase 3 — dressings', () => {
  const dressings = DIET_BASICS_CATALOG.filter((f) => f.id?.startsWith('diet_dress_'));

  it('adds the dressings and add-ons', () => {
    expect(dressings).toHaveLength(11);
  });

  it('keeps every modifier on Atwater too (kcal = 4P + 4C + 9F, +-5)', () => {
    for (const mod of DRESSING_MODIFIERS) {
      const expected =
        (mod.proteinGrams || 0) * 4 + (mod.carbGrams || 0) * 4 + (mod.fatGrams || 0) * 9;
      expect(
        Math.abs(mod.calories - expected),
        `${mod.id}: stated ${mod.calories}, macros imply ${expected}`
      ).toBeLessThanOrEqual(5);
    }
  });

  it('matches each modifier to one tablespoon of its standalone food', () => {
    const perTbsp = (name: string) => {
      const food = dressings.find((f) => f.name === name)!;
      return Math.round(food.kcal100g * 0.15);
    };
    // Within 5 kcal of 15g of the same food — the two paths must not disagree.
    expect(Math.abs(102 - perTbsp('Mayonnaise (Regular)'))).toBeLessThanOrEqual(5);
    expect(Math.abs(73 - perTbsp('Ranch Dressing'))).toBeLessThanOrEqual(5);
    expect(Math.abs(81 - perTbsp('Caesar Dressing'))).toBeLessThanOrEqual(5);
    expect(Math.abs(7 - perTbsp('Yogurt-Mint Raita Dressing'))).toBeLessThanOrEqual(5);
  });

  it('makes the low-calorie choice visibly cheaper than the mayo one', () => {
    const raita = dressings.find((f) => f.name === 'Yogurt-Mint Raita Dressing')!;
    const mayo = dressings.find((f) => f.name === 'Mayonnaise (Regular)')!;
    expect(raita.kcal100g * 10).toBeLessThan(mayo.kcal100g);
  });
});

describe('Phases 4-8 — regional meals, soups, breakfast, snacks', () => {
  const byPrefix = (p: string) => DIET_BASICS_CATALOG.filter((f) => f.id?.startsWith(p));

  it('adds each phase at its planned size', () => {
    expect(byPrefix('diet_arab_'), 'Arabic').toHaveLength(13);
    expect(byPrefix('diet_pk_'), 'Pakistani').toHaveLength(13);
    expect(byPrefix('diet_soup_'), 'soups').toHaveLength(7);
    expect(byPrefix('diet_brk_'), 'breakfast').toHaveLength(10);
    expect(byPrefix('diet_snack_'), 'snacks').toHaveLength(11);
  });

  it('finally gives SA mode something to log', () => {
    const names = byPrefix('diet_arab_').map((f) => f.name);
    expect(names).toContain('Labneh');
    expect(names).toContain('Hummus');
    expect(names).toContain('Foul Medames');
  });

  it('states the oil a low-oil sabzi still costs, rather than claiming zero', () => {
    for (const sabzi of byPrefix('diet_pk_').filter((f) => f.name.includes('Sabzi'))) {
      expect(sabzi.oilAddedG, sabzi.name).toBeGreaterThan(0);
    }
  });

  it('keeps soups the low-calorie, high-volume option they should be', () => {
    for (const soup of byPrefix('diet_soup_')) {
      expect(soup.kcal100g, soup.name).toBeLessThan(70);
    }
  });

  it('prices oats cooked in milk above oats cooked in water', () => {
    const breakfast = byPrefix('diet_brk_');
    const water = breakfast.find((f) => f.name === 'Oatmeal (Cooked in Water)')!;
    const milk = breakfast.find((f) => f.name === 'Oatmeal (Cooked in Milk)')!;
    expect(milk.kcal100g).toBeGreaterThan(water.kcal100g);
  });

  it('defaults snacks to the unit they are eaten in, not a round 100g', () => {
    for (const snack of byPrefix('diet_snack_')) {
      const def = snack.servings.find((s) => s.isDefault)!;
      expect(def.grams, `${snack.name} default serving`).toBeLessThanOrEqual(170);
    }
  });
});

describe('Egg preparations', () => {
  const eggs = DIET_BASICS_CATALOG.filter((f) => f.id?.startsWith('diet_egg_'));

  it('adds the preparations the original four did not cover', () => {
    expect(eggs).toHaveLength(22);
  });

  it('distinguishes the three water-cooked eggs people confuse', () => {
    const names = eggs.map((f) => f.name);
    // Cracked into water, cooked in the shell at ~65C, and shelled after a
    // short boil. Different foods, different figures.
    expect(names).toContain('Poached Egg');
    expect(names).toContain('Onsen Tamago (Japanese Slow-Cooked Egg)');
    expect(names).toContain('Soft-Boiled Egg (Runny Yolk)');
  });

  it('separates the preparations by what they were cooked in', () => {
    const kcal = (name: string) => eggs.find((f) => f.name === name)!.kcal100g;
    // Same egg, three fats: none, butter, a PK half-fry's tablespoon of oil.
    expect(kcal('Poached Egg')).toBeLessThan(kcal('Scrambled Eggs (With Butter)'));
    expect(kcal('Scrambled Eggs (With Butter)')).toBeLessThan(kcal('Half Fry / Sunny Side Up'));
  });

  it('records zero added oil only where none is used', () => {
    const oil = (name: string) => eggs.find((f) => f.name === name)!.oilAddedG;
    expect(oil('Poached Egg')).toBe(0);
    expect(oil('Scrambled Eggs (No Added Fat)')).toBe(0);
    expect(oil('Egg Yolk (Boiled)')).toBe(0);
    expect(oil('Half Fry / Sunny Side Up')).toBeGreaterThan(0);
    expect(oil('Masala Omelette')).toBeGreaterThan(0);
  });

  it('completes the white/yolk pair, with the yolk carrying the fat', () => {
    const yolk = eggs.find((f) => f.name === 'Egg Yolk (Boiled)')!;
    const white = DIET_BASICS_CATALOG.find((f) => f.name === 'Egg White (Boiled)')!;
    expect(yolk.fat100g).toBeGreaterThan(white.fat100g * 10);
    expect(white.kcal100g).toBeLessThan(yolk.kcal100g);
  });

  it('keeps the egg-white omelette the lightest option on the list', () => {
    const lightest = [...eggs].sort((a, b) => a.kcal100g - b.kcal100g)[0];
    expect(lightest.name).toBe('Egg White Omelette (Plain)');
  });
});

describe('Single-ingredient depth batch', () => {
  const byPrefix = (p: string) => DIET_BASICS_CATALOG.filter((f) => f.id?.startsWith(p));

  it('adds each category at its planned size', () => {
    expect(byPrefix('diet_fat_'), 'fats & sweeteners').toHaveLength(6);
    expect(byPrefix('diet_fruit_'), 'fruits').toHaveLength(13);
    expect(byPrefix('diet_leg_'), 'legumes').toHaveLength(12);
    expect(byPrefix('diet_veg_'), 'vegetables').toHaveLength(15);
    expect(byPrefix('diet_meat_'), 'meat').toHaveLength(19);
    expect(byPrefix('diet_sea_'), 'seafood').toHaveLength(8);
    expect(byPrefix('diet_dairy_'), 'dairy').toHaveLength(10);
    expect(byPrefix('diet_grain_'), 'grains').toHaveLength(12);
    expect(byPrefix('diet_nut_'), 'nuts & seeds').toHaveLength(8);
  });

  it('keeps one generic cooking oil rather than a shelf of identical ones', () => {
    // Every plain oil is ~900 kcal of pure fat; separate rows for sunflower,
    // canola and mustard would repeat one number three times.
    const oils = byPrefix('diet_fat_').filter((f) => /oil/i.test(f.name));
    expect(oils).toHaveLength(1);
    expect(oils[0].fat100g).toBe(100);
  });

  it('gives the added fats and sweeteners spoon-sized defaults, never 100g', () => {
    for (const item of byPrefix('diet_fat_')) {
      const def = item.servings.find((s) => s.isDefault)!;
      expect(def.grams, `${item.name} default serving`).toBeLessThanOrEqual(21);
    }
  });

  it('finally carries the fruit a Pakistani catalogue cannot be missing', () => {
    const names = byPrefix('diet_fruit_').map((f) => f.name);
    expect(names).toContain('Mango');
    expect(names).toContain('Guava (Amrood)');
  });

  it('separates dried fruit from fresh, since water is the whole difference', () => {
    const fruits = byPrefix('diet_fruit_');
    const fresh = fruits.find((f) => f.name === 'Peach (Aaru)')!;
    const dried = fruits.find((f) => f.name === 'Dried Apricot (Khubani)')!;
    expect(dried.kcal100g).toBeGreaterThan(fresh.kcal100g * 4);
  });

  it('gives each daal its own figure instead of one generic number', () => {
    const daals = byPrefix('diet_leg_').filter((f) => /^Daal /.test(f.name));
    expect(daals.length).toBeGreaterThanOrEqual(5);
    // If they all shared a number there would be nothing to distinguish.
    expect(new Set(daals.map((d) => d.protein100g)).size).toBeGreaterThan(1);
  });

  it('prices a cut with skin above the same cut without', () => {
    const meat = byPrefix('diet_meat_');
    const withSkin = meat.find((f) => f.name === 'Chicken Breast (With Skin, Roast)')!;
    const skinless = DIET_BASICS_CATALOG.find(
      (f) => f.name === 'Grilled Chicken Breast (Skinless)'
    )!;
    expect(withSkin.kcal100g).toBeGreaterThan(skinless.kcal100g);
  });

  it('keeps plain vegetables well below their oil-cooked sabzi versions', () => {
    const rawBhindi = byPrefix('diet_veg_').find((f) => f.name === 'Okra / Bhindi (Raw)')!;
    const cookedBhindi = DIET_BASICS_CATALOG.find((f) => f.name === 'Bhindi Sabzi (Low Oil)')!;
    expect(rawBhindi.kcal100g).toBeLessThan(cookedBhindi.kcal100g);
    expect(rawBhindi.oilAddedG).toBe(0);
  });

  it('prices fried fish well above the grilled equivalent', () => {
    const sea = byPrefix('diet_sea_');
    const fried = sea.find((f) => f.name === 'Fried Masala Fish')!;
    const grilled = sea.find((f) => f.name === 'Rahu Fish (Grilled)')!;
    expect(fried.kcal100g).toBeGreaterThan(grilled.kcal100g * 1.5);
  });

  it('distinguishes processed cheese slices from real cheddar', () => {
    const dairy = byPrefix('diet_dairy_');
    const processed = dairy.find((f) => f.name === 'Processed Cheese Slice')!;
    const cheddar = dairy.find((f) => f.name === 'Cheddar Cheese')!;
    expect(processed.protein100g).toBeLessThan(cheddar.protein100g);
    expect(processed.sodiumMg100g).toBeGreaterThan(cheddar.sodiumMg100g);
  });

  it('defaults calorie-dense nuts and seeds to a spoon or a handful', () => {
    for (const item of byPrefix('diet_nut_')) {
      const def = item.servings.find((s) => s.isDefault)!;
      expect(def.grams, `${item.name} default serving`).toBeLessThanOrEqual(28);
    }
  });
});

describe('Add-on modifiers', () => {
  const byId = (p: string) => DIET_BASICS_CATALOG.filter((f) => f.id?.startsWith(p));
  const named = (name: string) => DIET_BASICS_CATALOG.find((f) => f.name === name)!;
  const modIds = (name: string) => (named(name).modifiers ?? []).map((m) => m.id);

  it('keeps every add-on on Atwater (kcal = 4P + 4C + 9F, +-5)', () => {
    const violations = ALL_DIET_ADDON_MODIFIERS.flatMap((mod) => {
      const expected =
        (mod.proteinGrams || 0) * 4 + (mod.carbGrams || 0) * 4 + (mod.fatGrams || 0) * 9;
      return Math.abs(mod.calories - expected) > 5
        ? [`${mod.id}: stated ${mod.calories}, macros imply ${expected}`]
        : [];
    });
    expect(violations, violations.join('\n')).toHaveLength(0);
  });

  it('never disagrees with the standalone food it is derived from', () => {
    // Logging "roti + 1 tsp ghee" and logging them as two rows must give the
    // same number, or the same meal costs different amounts depending on how
    // the user happened to enter it.
    const perGrams = (foodName: string, grams: number) =>
      Math.round((named(foodName).kcal100g * grams) / 100);
    const mod = (id: string) => ALL_DIET_ADDON_MODIFIERS.find((m) => m.id === id)!;

    const pairs: [string, string, number][] = [
      ['addon_ghee_tsp', 'Desi Ghee', 5],
      ['addon_ghee_tbsp', 'Desi Ghee', 14],
      ['addon_butter_tsp', 'Butter', 5],
      ['addon_oil_tsp', 'Cooking Oil (Any Plain Oil)', 5],
      ['addon_oil_tbsp', 'Cooking Oil (Any Plain Oil)', 14],
      ['addon_sugar_tsp', 'Sugar (White)', 4],
      ['addon_sugar_2tsp', 'Sugar (White)', 8],
      ['addon_honey_tsp', 'Honey', 7],
      ['addon_gur_piece', 'Gur / Jaggery', 10],
      ['addon_cheese_slice', 'Cheddar Cheese', 28],
      ['addon_malai_tbsp', 'Malai / Fresh Cream', 15],
    ];

    for (const [id, foodName, grams] of pairs) {
      const drift = Math.abs(mod(id).calories - perGrams(foodName, grams));
      expect(drift, `${id} vs ${grams}g of ${foodName}`).toBeLessThanOrEqual(5);
    }
  });

  it('offers ghee on savoury staples, not sugar', () => {
    for (const name of ['Plain Roti / Chapati (No Ghee)', 'Daal Masoor (Cooked)', 'Tandoori Roti']) {
      expect(modIds(name), name).toContain('addon_ghee_tsp');
      expect(modIds(name), name).not.toContain('addon_sugar_tsp');
    }
  });

  it('offers sugar on chai and dahi, not ghee', () => {
    for (const name of ['Home Chai (No Sugar)', 'Black Coffee (No Sugar)', 'Plain Yogurt / Dahi']) {
      expect(modIds(name), name).toContain('addon_sugar_tsp');
      expect(modIds(name), name).not.toContain('addon_ghee_tsp');
    }
  });

  it('offers dressings on salads rather than the generic add-ons', () => {
    for (const salad of byId('diet_salad_')) {
      const ids = (salad.modifiers ?? []).map((m) => m.id);
      expect(ids, salad.name).toContain('dressing_ranch');
      expect(ids, salad.name).not.toContain('addon_ghee_tsp');
    }
  });

  it('puts no add-ons on the add-ons themselves', () => {
    // "+1 tsp ghee" on a jar of ghee, or sugar on a handful of almonds.
    for (const item of [...byId('diet_fat_'), ...byId('diet_dress_'), ...byId('diet_nut_')]) {
      expect(item.modifiers ?? [], item.name).toHaveLength(0);
    }
  });

  it('reaches most of the catalogue, which is the point of using modifiers', () => {
    const withAddOns = DIET_BASICS_CATALOG.filter((f) => (f.modifiers?.length ?? 0) > 0);
    // 11 add-on definitions covering this many foods is the trade being made
    // against shipping "Roti with Ghee" as its own row.
    expect(withAddOns.length).toBeGreaterThan(DIET_BASICS_CATALOG.length * 0.7);
    expect(ALL_DIET_ADDON_MODIFIERS).toHaveLength(11);
  });
});

describe('Phase 9 — search ranking still holds at 3x the catalogue size', () => {
  // DIET_BASIC_RANK_BOOST was tuned against 44 diet items. It now competes
  // against ~140, so both directions are re-checked here: plain foods must win
  // generic ingredient words, and real dishes must still win their own names.
  const topNames = (q: string, n = 3) =>
    searchPakistaniFoods(q, { limit: n }).map((f) => f.name);

  it.each(['egg', 'chicken', 'yogurt', 'salad', 'milk', 'chai', 'soup'])(
    'puts a Diet & Basics item first for the generic term "%s"',
    (term) => {
      const first = searchPakistaniFoods(term, { limit: 1 })[0];
      expect(first, `no result for "${term}"`).toBeDefined();
      expect(isDietBasic(first), `"${term}" returned ${first.name}`).toBe(true);
    }
  );

  it.each([
    ['biryani', 'Biryani'],
    ['chicken karahi', 'Karahi'],
    ['zinger burger', 'Zinger'],
    ['nihari', 'Nihari'],
  ])('still returns the real dish for "%s"', (query, expected) => {
    expect(topNames(query).join(' | ')).toContain(expected);
  });
});
