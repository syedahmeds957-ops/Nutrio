import { useMemo, useState } from 'react';
import { NormalizedFood, resolveFoodId } from '@nutrio/food-db';
import { deleteMealPreset, saveMealPreset, type MealPreset } from '../mealPresets.js';
import { defaultServingFor, servingNutrition } from '../personalServings.js';

/** One line of a custom meal: a food plus how many of its default serving. */
export interface MealBasketEntry {
  food: NormalizedFood;
  quantity: number;
}

const EMPTY_BASKET: MealBasketEntry[] = [];

/** A food's stable identity across the catalogue, presets and the basket. */
export const foodKey = (food: NormalizedFood) => food.id || food.name;

/**
 * The meal hub's custom-meal mode: a basket of foods logged together, one per
 * meal slot, plus saving and reapplying baskets as presets.
 *
 * `dietFoods` resolves preset entries back to foods. `presetsVersion` bumps on
 * every preset write, so lists derived from storage can recompute.
 */
export function useMealBasket({
  slot,
  dietFoods,
  onConfirmBasket,
}: {
  slot?: string;
  dietFoods: NormalizedFood[];
  onConfirmBasket?: (entries: MealBasketEntry[]) => void;
}) {
  // Custom-meal mode: tapping a food stacks it up instead of opening the
  // customizer, so several things eaten together go in as one action.
  const [isBuildMode, setIsBuildMode] = useState(false);
  // One basket per meal slot, so picks made for lunch never show up when
  // breakfast or dinner is opened.
  const slotKey = slot ?? 'default';
  const [baskets, setBaskets] = useState<Record<string, MealBasketEntry[]>>({});
  const basket = baskets[slotKey] ?? EMPTY_BASKET;
  const setBasket = (
    next: MealBasketEntry[] | ((prev: MealBasketEntry[]) => MealBasketEntry[])
  ) =>
    setBaskets((all) => {
      const prev = all[slotKey] ?? EMPTY_BASKET;
      return { ...all, [slotKey]: typeof next === 'function' ? next(prev) : next };
    });
  // Presets and usage counts live in storage, not state. Bumped whenever this
  // hook writes to either, so derived lists recompute without mirroring storage.
  const [presetsVersion, setPresetsVersion] = useState(0);
  const [presetNameDraft, setPresetNameDraft] = useState('');
  const [isNamingPreset, setIsNamingPreset] = useState(false);

  const basketQty = (food: NormalizedFood) =>
    basket.find((e) => foodKey(e.food) === foodKey(food))?.quantity ?? 0;

  const addToBasket = (food: NormalizedFood) => {
    setBasket((prev) => {
      const key = foodKey(food);
      const existing = prev.find((e) => foodKey(e.food) === key);
      if (existing) {
        return prev.map((e) => (foodKey(e.food) === key ? { ...e, quantity: e.quantity + 1 } : e));
      }
      return [...prev, { food, quantity: 1 }];
    });
  };

  const removeFromBasket = (food: NormalizedFood) => {
    setBasket((prev) => {
      const key = foodKey(food);
      const existing = prev.find((e) => foodKey(e.food) === key);
      if (!existing) return prev;
      if (existing.quantity <= 1) return prev.filter((e) => foodKey(e.food) !== key);
      return prev.map((e) => (foodKey(e.food) === key ? { ...e, quantity: e.quantity - 1 } : e));
    });
  };

  // Serving-based, matching how the item is actually logged.
  const basketTotals = useMemo(() => {
    return basket.reduce(
      (acc, { food, quantity }) => {
        const serving = defaultServingFor(food, foodKey(food), '');
        acc.kcal += servingNutrition(food, serving).kcal * quantity;
        acc.count += quantity;
        return acc;
      },
      { kcal: 0, count: 0 }
    );
  }, [basket]);

  const exitBuildMode = () => {
    setIsBuildMode(false);
    setBasket([]);
    setIsNamingPreset(false);
    setPresetNameDraft('');
  };

  const handleSavePreset = () => {
    const saved = saveMealPreset(
      presetNameDraft,
      basket.map(({ food, quantity }) => ({
        foodId: foodKey(food),
        foodName: food.name,
        quantity,
      }))
    );
    if (!saved) return;
    setIsNamingPreset(false);
    setPresetNameDraft('');
    setPresetsVersion((v) => v + 1);
  };

  /**
   * Refills the basket from a saved combo. Foods are resolved by id at apply
   * time rather than stored whole, so a preset picks up any later correction to
   * the catalogue instead of pinning the macros as they were when it was saved.
   */
  const handleApplyPreset = (preset: MealPreset) => {
    const byId = new Map(dietFoods.map((f) => [foodKey(f), f]));
    const entries = preset.entries
      .map(({ foodId, quantity }) => {
        // A preset saved before a duplicate was retired still names the old id.
        const food = byId.get(foodId) ?? byId.get(resolveFoodId(foodId));
        return food ? { food, quantity } : null;
      })
      .filter((e): e is MealBasketEntry => e !== null);

    if (entries.length === 0) return;
    setIsBuildMode(true);
    setBasket(entries);
  };

  const handleDeletePreset = (id: string) => {
    deleteMealPreset(id);
    setPresetsVersion((v) => v + 1);
  };

  const handleConfirmBasket = () => {
    if (!onConfirmBasket || basket.length === 0) return;
    onConfirmBasket(basket);
    exitBuildMode();
  };

  return {
    basket,
    isBuildMode,
    setIsBuildMode,
    basketQty,
    addToBasket,
    removeFromBasket,
    basketTotals,
    exitBuildMode,
    presetsVersion,
    presetNameDraft,
    setPresetNameDraft,
    isNamingPreset,
    setIsNamingPreset,
    handleSavePreset,
    handleApplyPreset,
    handleDeletePreset,
    handleConfirmBasket,
  };
}
