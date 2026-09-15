export type RegionCode = 'PK' | 'SA' | 'GLOBAL';

export interface NormalizedFood {
  id?: string;
  name: string;
  nameUr?: string;
  nameAr?: string;
  brand?: string;
  brandCategory?: string;
  modifiers?: FoodModifier[];
  category: string;
  cuisineTags: string[];
  region?: RegionCode;
  kcal100g: number;
  protein100g: number;
  carb100g: number;
  fat100g: number;
  fibre100g: number;
  sugar100g: number;
  sodiumMg100g: number;
  satFat100g: number;
  micros?: Record<string, number>;
  source: 'usda' | 'indb' | 'pak_custom' | 'sfda' | 'saudi_custom' | 'user';
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
  nameAr?: string;
  calories: number;
  proteinGrams?: number;
  fatGrams?: number;
  carbGrams?: number;
}

export interface FoodServingItem {
  label: string;
  labelUr?: string;
  labelAr?: string;
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
  nameUr?: string;
  nameAr?: string;
  tagline: string;
  taglineAr?: string;
  icon: string;
  region?: RegionCode;
  brandGroup?: string;
  categories: string[];
  menuCount?: number;
  itemCount?: number;
}

export type CalorifyBrand = RestaurantBrand;
