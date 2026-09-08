import { NormalizedFood, ServingUnit } from '@nutrio/food-db';
import { DailyTrackerSummary, LoggedItem, MealSlot } from './types.js';

export function calculateNutrientsForGrams(
  food: NormalizedFood,
  totalGrams: number
) {
  const multiplier = totalGrams / 100;
  return {
    calories: Math.round(food.kcal100g * multiplier),
    proteinGrams: Number((food.protein100g * multiplier).toFixed(1)),
    fatGrams: Number((food.fat100g * multiplier).toFixed(1)),
    carbGrams: Number((food.carb100g * multiplier).toFixed(1)),
  };
}

export class TrackerEngine {
  private items: LoggedItem[] = [];
  private waterMlConsumed: number = 0;
  private targetCalories: number;
  private targetProteinGrams: number;
  private targetFatGrams: number;
  private targetCarbGrams: number;
  private targetWaterMl: number;
  private date: string;

  constructor(targets: {
    targetCalories: number;
    targetProteinGrams: number;
    targetFatGrams: number;
    targetCarbGrams: number;
    targetWaterMl?: number;
    date?: string;
  }) {
    this.targetCalories = targets.targetCalories;
    this.targetProteinGrams = targets.targetProteinGrams;
    this.targetFatGrams = targets.targetFatGrams;
    this.targetCarbGrams = targets.targetCarbGrams;
    this.targetWaterMl = targets.targetWaterMl ?? 2500;
    this.date = targets.date ?? new Date().toISOString().split('T')[0];
  }

  public logItem(
    mealSlot: MealSlot,
    food: NormalizedFood,
    serving: ServingUnit,
    quantity: number = 1
  ): LoggedItem {
    const totalGrams = Math.round(serving.grams * quantity);
    const nutrients = calculateNutrientsForGrams(food, totalGrams);

    const newItem: LoggedItem = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      mealSlot,
      foodName: food.name,
      foodNameUr: food.nameUr,
      servingLabel: serving.label,
      servingGrams: serving.grams,
      quantity,
      totalGrams,
      calories: nutrients.calories,
      proteinGrams: nutrients.proteinGrams,
      fatGrams: nutrients.fatGrams,
      carbGrams: nutrients.carbGrams,
      loggedAt: new Date().toISOString(),
      syncStatus: 'pending',
    };

    this.items.push(newItem);
    return newItem;
  }

  public logCustomizedItem(
    mealSlot: MealSlot,
    foodName: string,
    foodNameUr: string | undefined,
    servingLabel: string,
    quantity: number,
    calories: number,
    proteinGrams: number,
    carbGrams: number,
    fatGrams: number
  ): LoggedItem {
    const newItem: LoggedItem = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      mealSlot,
      foodName,
      foodNameUr,
      servingLabel,
      servingGrams: 100,
      quantity,
      totalGrams: 100 * quantity,
      calories,
      proteinGrams,
      fatGrams,
      carbGrams,
      loggedAt: new Date().toISOString(),
      syncStatus: 'pending',
    };

    this.items.push(newItem);
    return newItem;
  }

  public deleteItem(id: string): boolean {
    const initialLen = this.items.length;
    this.items = this.items.filter((item) => item.id !== id);
    return this.items.length < initialLen;
  }

  public logWater(ml: number): number {
    this.waterMlConsumed = Math.max(0, this.waterMlConsumed + ml);
    return this.waterMlConsumed;
  }

  public getSummary(): DailyTrackerSummary {
    const totalCaloriesConsumed = this.items.reduce(
      (sum, item) => sum + item.calories,
      0
    );
    const totalProteinConsumed = Number(
      this.items.reduce((sum, item) => sum + item.proteinGrams, 0).toFixed(1)
    );
    const totalFatConsumed = Number(
      this.items.reduce((sum, item) => sum + item.fatGrams, 0).toFixed(1)
    );
    const totalCarbConsumed = Number(
      this.items.reduce((sum, item) => sum + item.carbGrams, 0).toFixed(1)
    );

    const remainingCalories = this.targetCalories - totalCaloriesConsumed;
    const pendingSyncCount = this.items.filter(
      (i) => i.syncStatus === 'pending'
    ).length;

    return {
      date: this.date,
      targetCalories: this.targetCalories,
      targetProteinGrams: this.targetProteinGrams,
      targetFatGrams: this.targetFatGrams,
      targetCarbGrams: this.targetCarbGrams,
      totalCaloriesConsumed,
      remainingCalories,
      totalProteinConsumed,
      totalFatConsumed,
      totalCarbConsumed,
      waterMlConsumed: this.waterMlConsumed,
      targetWaterMl: this.targetWaterMl,
      items: [...this.items],
      pendingSyncCount,
    };
  }

  public getItemsBySlot(slot: MealSlot): LoggedItem[] {
    return this.items.filter((item) => item.mealSlot === slot);
  }

  // --- Offline Sync Queue Helpers ---

  public getPendingQueue(): LoggedItem[] {
    return this.items.filter((item) => item.syncStatus === 'pending');
  }

  public markSynced(ids: string[]): void {
    const idSet = new Set(ids);
    this.items.forEach((item) => {
      if (idSet.has(item.id)) {
        item.syncStatus = 'synced';
      }
    });
  }

  public markFailed(ids: string[]): void {
    const idSet = new Set(ids);
    this.items.forEach((item) => {
      if (idSet.has(item.id)) {
        item.syncStatus = 'failed';
      }
    });
  }

  public loadItems(items: LoggedItem[], waterMl: number = 0): void {
    this.items = [...items];
    this.waterMlConsumed = waterMl;
  }
}
