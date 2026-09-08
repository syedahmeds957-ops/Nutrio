export interface NormalizedFood {
  id?: string;
  name: string;
  nameUr?: string;
  brand?: string;
  brandCategory?: string;
  modifiers?: FoodModifier[];
  category: string;
  cuisineTags: string[];
  kcal100g: number;
  protein100g: number;
  carb100g: number;
  fat100g: number;
  fibre100g: number;
  sugar100g: number;
  sodiumMg100g: number;
  satFat100g: number;
  micros?: Record<string, number>;
  source: 'usda' | 'indb' | 'pak_custom' | 'user';
  sourceRef?: string;
  verifiedBy?: string;
  confidence?: number;
  isRecipe?: boolean;
  oilAddedG: number;
  servings: FoodServingItem[];
}

export interface FoodModifier {
  id: string;
  name: string;
  nameUr?: string;
  calories: number;
  proteinGrams?: number;
  fatGrams?: number;
  carbGrams?: number;
}

export interface FoodServingItem {
  label: string;
  labelUr?: string;
  grams: number;
  isDefault: boolean;
  description?: string;
  servingWeightGrams?: number;
  kcal?: number;
  proteinGrams?: number;
  fatGrams?: number;
  carbGrams?: number;
}

export type ServingUnit = FoodServingItem;

export interface OFFProduct {
  barcode: string;
  name: string;
  brand?: string;
  nutrients: {
    kcal100g: number;
    protein100g: number;
    carb100g: number;
    fat100g: number;
    fibre100g?: number;
    sugar100g?: number;
    sodiumMg100g?: number;
  };
}

export interface RestaurantBrand {
  id: string;
  name: string;
  nameUr: string;
  tagline: string;
  icon: string;
  brandGroup?: string;
  categories: string[];
  menuCount?: number;
  itemCount?: number;
}

export type CalorifyBrand = RestaurantBrand;
