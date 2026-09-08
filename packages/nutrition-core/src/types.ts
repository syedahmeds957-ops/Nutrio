export type BiologicalSex = 'male' | 'female';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'very_active'
  | 'extra_active';

export type GoalType = 'lose' | 'maintain' | 'gain';

export interface BMRCalculationInput {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  sex: BiologicalSex;
  bodyFatPct?: number;
}

export interface BMRResults {
  mifflinStJeor: number;
  katchMcArdle?: number;
  cunningham?: number;
  harrisBenedict: number;
  selectedBMR: number;
  methodUsed: 'mifflin_st_jeor' | 'katch_mcardle';
}

export interface TDEECalculationInput {
  bmr: number;
  activityLevel: ActivityLevel;
  occupationalFactor?: number;
  weeklyExerciseKcal?: number;
  dailyStepCount?: number;
}

export interface TDEEResult {
  tdee: number;
  method: 'standard_multiplier' | 'occupational_split' | 'step_override';
  baseMultiplier: number;
}

export interface TargetCalculationInput {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  sex: BiologicalSex;
  bmr: number;
  tdee: number;
  goal: GoalType;
  targetRateKgPerWeek?: number;
  isPregnantOrBreastfeeding?: boolean;
  medicalConditions?: string[];
}

export interface SafetyViolation {
  code:
    | 'UNDERWEIGHT_CUT_DISABLED'
    | 'AGE_UNDER_18_CUT_DISABLED'
    | 'PREGNANCY_MAINTENANCE_ONLY'
    | 'BELOW_BMR_FLOOR'
    | 'BELOW_ABSOLUTE_FLOOR'
    | 'EXCESSIVE_DEFICIT'
    | 'EXCESSIVE_RATE';
  message: string;
  remedy: string;
}

export interface CalorieTargetResult {
  kcalTarget: number;
  originalRequestedDelta: number;
  appliedDelta: number;
  effectiveRateKgPerWeek: number;
  deficitPct: number;
  safetyViolations: SafetyViolation[];
  safetyWarnings: string[];
}

export interface MacroSplitInput {
  kcalTarget: number;
  weightKg: number;
  goal: GoalType;
  bodyFatPct?: number;
  proteinMultiplier?: number; // g/kg
  fatMinPct?: number; // default 0.20
  fatMinGPerKg?: number; // default 0.6
  ambientTempHigh?: boolean; // Lahore summer water increase
}

export interface MacroSplitResult {
  kcalTarget: number;
  proteinGrams: number;
  proteinKcal: number;
  proteinPct: number;
  fatGrams: number;
  fatKcal: number;
  fatPct: number;
  carbGrams: number;
  carbKcal: number;
  carbPct: number;
  fibreGrams: number;
  waterMl: number;
}

export interface AdaptiveTDEEInput {
  formulaTDEE: number;
  bmr: number;
  dailyWeighInsKg: { dayIndex: number; weightKg: number }[];
  dailyIntakeKcal: { dayIndex: number; kcal: number }[];
  previousEWMAWeightKg?: number;
}

export interface AdaptiveTDEEResult {
  currentEWMAWeightKg: number;
  weightDeltaKg: number;
  daysLogged: number;
  meanDailyIntake: number;
  observedTDEE?: number;
  blendedTDEE: number;
  weightFactor: number;
  isUnderLogging: boolean;
  recommendedKcalDelta: number;
  explanation: string;
}

export type PlanDietPreference =
  | 'halal_omnivore'
  | 'halal_meat_moderate'
  | 'vegetarian_desi'
  | 'eggetarian'
  | 'vegan';

export type PlanBudgetTier =
  | 'budget_under_3500'
  | 'standard_3500_7000'
  | 'premium_above_7000';

export interface MealPlanSolverInput {
  targetCalories: number;
  targetProteinGrams: number;
  targetFatGrams: number;
  targetCarbGrams: number;
  dietPreference: PlanDietPreference;
  budgetTierPKR: PlanBudgetTier;
  dislikedFoods?: string[];
  medicalConditions?: string[];
  mealsPerDay?: number;
}

export interface PlannedMealItem {
  foodName: string;
  foodNameUr?: string;
  category: string;
  servingLabel: string;
  servingGrams: number;
  quantity: number;
  totalGrams: number;
  calories: number;
  proteinGrams: number;
  fatGrams: number;
  carbGrams: number;
  fibreGrams: number;
  oilAddedG: number;
}

export interface PlannedMealSlot {
  slot: 'breakfast' | 'lunch' | 'dinner' | 'snacks_chai';
  title: string;
  targetCalories: number;
  actualCalories: number;
  items: PlannedMealItem[];
}

export interface DailyMealPlanResult {
  targetCalories: number;
  actualCalories: number;
  calorieDeviationPct: number; // must be <= 5.0%
  targetProteinGrams: number;
  actualProteinGrams: number;
  targetFatGrams: number;
  actualFatGrams: number;
  targetCarbGrams: number;
  actualCarbGrams: number;
  totalFibreGrams: number;
  totalOilAddedG: number;
  meals: PlannedMealSlot[];
  isWithinTolerance: boolean; // true if Math.abs(calorieDeviationPct) <= 5.0
  budgetTier: PlanBudgetTier;
  dietPreference: PlanDietPreference;
}

export interface MealSwapOption {
  optionId: string;
  title: string;
  calories: number;
  proteinGrams: number;
  fatGrams: number;
  carbGrams: number;
  oilAddedG: number;
  calorieDeltaPct: number; // must be within +-5% of original
  items: PlannedMealItem[];
}

export interface MealSwapResult {
  originalSlot: 'breakfast' | 'lunch' | 'dinner' | 'snacks_chai';
  originalCalories: number;
  originalProteinGrams: number;
  options: [MealSwapOption, MealSwapOption, MealSwapOption];
}

export type GroceryCategory =
  | 'atta_and_grains'
  | 'daals_and_pulses'
  | 'meats_and_poultry'
  | 'dairy_and_eggs'
  | 'sabzi_and_produce'
  | 'oils_and_pantry';

export interface GroceryItem {
  id: string;
  name: string;
  nameUr?: string;
  category: GroceryCategory;
  quantityAmount: number;
  unit: 'kg' | 'g' | 'litres' | 'ml' | 'dozen' | 'pieces';
  estimatedCostPKR: number;
  notes?: string;
}

export interface GroceryCategoryGroup {
  category: GroceryCategory;
  title: string;
  titleUr: string;
  items: GroceryItem[];
  subtotalPKR: number;
}

export interface WeeklyGrocerySummary {
  weekDaysCount: number;
  budgetTier: PlanBudgetTier;
  maxBudgetPKR: number;
  estimatedTotalCostPKR: number;
  isWithinBudget: boolean;
  budgetDifferencePKR: number;
  categories: GroceryCategoryGroup[];
  budgetOptimizationTip?: string;
}

export interface FamilyModeInput {
  familyDishName: string;
  familyMealSlot: 'lunch' | 'dinner';
  estimatedServingGrams?: number;
}

export interface FamilyModePlanResult {
  isFamilyModeActive: boolean;
  familyDishName: string;
  familyMealSlot: 'lunch' | 'dinner';
  guidanceNote: string;
  portionAdvice: string;
  plan: DailyMealPlanResult;
}

export interface HydrationWindow {
  windowName: string;
  windowNameUr: string;
  recommendedMl: number;
  timing: string;
  notes: string;
}

export interface RamadanPlanResult {
  isRamadanMode: boolean;
  targetCalories: number;
  actualCalories: number;
  suhoor: PlannedMealSlot;
  iftar: PlannedMealSlot;
  postTarawihSnack: PlannedMealSlot;
  totalWaterMl: number;
  hydrationWindows: HydrationWindow[];
  suhoorAdvice: string;
  iftarAdvice: string;
}

export interface DetectedFoodItem {
  detectedName: string;
  estimatedGrams?: number;
  portionSize?: 'S' | 'M' | 'L';
  servingMultiplier?: number;
}

export type VisionConfidence = 'high' | 'medium' | 'low';

export interface ResolvedFoodItem {
  detectedName: string;
  matchedFoodName: string;
  matchedFoodNameUr?: string;
  category: string;
  servingLabel: string;
  servingGrams: number;
  resolvedGrams: number;
  calories: number;
  proteinGrams: number;
  fatGrams: number;
  carbGrams: number;
  fibreGrams: number;
  oilAddedG: number;
  matchScore: number;
  portionSource:
    | 'user_grams'
    | 'detected_grams'
    | 'portion_size'
    | 'default_serving';
}

export interface VisionResolutionResult {
  totalCalories: number;
  calorieBand: {
    min: number;
    max: number;
    displayEstimate: string; // e.g. "~620 kcal (±10%)"
  };
  totalProteinGrams: number;
  totalFatGrams: number;
  totalCarbGrams: number;
  totalFibreGrams: number;
  totalOilAddedG: number;
  confidence: VisionConfidence;
  items: ResolvedFoodItem[];
}

export interface CoachContext {
  displayName?: string;
  sex: BiologicalSex;
  ageYears: number;
  weightKg: number;
  goal: GoalType;
  targets: {
    kcalTarget: number;
    proteinGrams: number;
    fatGrams: number;
    carbGrams: number;
    waterMl?: number;
  };
  todaySummary?: {
    caloriesConsumed: number;
    proteinConsumed: number;
    fatConsumed: number;
    carbConsumed: number;
    remainingCalories: number;
    foodsLoggedToday?: string[];
  };
  medicalFlags?: string[];
  dietaryPreferences?: string[];
  isRamadanMode?: boolean;
}

export interface CoachValidationResult {
  isValid: boolean;
  sanitizedText: string;
  flagsTriggered: string[];
}





