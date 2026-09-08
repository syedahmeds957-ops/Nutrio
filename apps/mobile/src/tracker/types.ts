export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snacks_chai';

export type SyncStatus = 'pending' | 'synced' | 'failed';

export interface LoggedItem {
  id: string;
  mealSlot: MealSlot;
  foodName: string;
  foodNameUr?: string;
  servingLabel: string;
  servingGrams: number;
  quantity: number;
  totalGrams: number;
  calories: number;
  proteinGrams: number;
  fatGrams: number;
  carbGrams: number;
  loggedAt: string;
  syncStatus: SyncStatus;
}

export interface DailyTrackerSummary {
  date: string; // YYYY-MM-DD
  targetCalories: number;
  targetProteinGrams: number;
  targetFatGrams: number;
  targetCarbGrams: number;
  totalCaloriesConsumed: number;
  remainingCalories: number;
  totalProteinConsumed: number;
  totalFatConsumed: number;
  totalCarbConsumed: number;
  waterMlConsumed: number;
  targetWaterMl: number;
  items: LoggedItem[];
  pendingSyncCount: number;
}
