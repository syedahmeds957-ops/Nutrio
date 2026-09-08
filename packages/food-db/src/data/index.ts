import { NormalizedFood, RestaurantBrand } from '../types.js';
import { BBQ_GRILLS_DATA } from './bbq-grills.data.js';
import { KARAHI_HANDI_DATA } from './karahi-handi.data.js';
import { RICE_BIRYANI_DATA } from './rice-biryani.data.js';
import { SLOW_COOKED_CURRIES_DATA } from './slow-cooked-curries.data.js';
import { NASHTA_BREAKFAST_DATA } from './nashta-breakfast.data.js';
import { STREET_FOOD_CHAAT_DATA } from './street-food-chaat.data.js';
import { VEGETABLES_DAAL_DATA } from './vegetables-daal.data.js';
import { PAKISTANI_FAST_FOOD_DATA } from './pakistani-fast-food.data.js';
import { SWEETS_DESSERTS_DATA } from './sweets-desserts.data.js';
import { BEVERAGES_DRINKS_DATA } from './beverages-drinks.data.js';
import { CALORIFY_RESTAURANTS_DATA, CALORIFY_BRANDS } from './calorify-restaurants.data.js';
import {
  PAKISTANI_EXPANDED_BRANDS,
  PAKISTANI_EXPANDED_RESTAURANTS_DATA,
} from './pakistani-restaurants-expanded.data.js';

export * from './bbq-grills.data.js';
export * from './karahi-handi.data.js';
export * from './rice-biryani.data.js';
export * from './slow-cooked-curries.data.js';
export * from './nashta-breakfast.data.js';
export * from './street-food-chaat.data.js';
export * from './vegetables-daal.data.js';
export * from './pakistani-fast-food.data.js';
export * from './sweets-desserts.data.js';
export * from './beverages-drinks.data.js';
export * from './calorify-restaurants.data.js';
export * from './pakistani-restaurants-expanded.data.js';

export const PAKISTANI_RESTAURANT_BRANDS: RestaurantBrand[] = [
  ...CALORIFY_BRANDS,
  ...PAKISTANI_EXPANDED_BRANDS,
];

// Compatibility aliases
export const ALL_RESTAURANT_BRANDS = PAKISTANI_RESTAURANT_BRANDS;

export const ALL_EXPANDED_PAKISTANI_FOODS: NormalizedFood[] = [
  ...BBQ_GRILLS_DATA,
  ...KARAHI_HANDI_DATA,
  ...RICE_BIRYANI_DATA,
  ...SLOW_COOKED_CURRIES_DATA,
  ...NASHTA_BREAKFAST_DATA,
  ...STREET_FOOD_CHAAT_DATA,
  ...VEGETABLES_DAAL_DATA,
  ...PAKISTANI_FAST_FOOD_DATA,
  ...SWEETS_DESSERTS_DATA,
  ...BEVERAGES_DRINKS_DATA,
  ...CALORIFY_RESTAURANTS_DATA,
  ...PAKISTANI_EXPANDED_RESTAURANTS_DATA,
].map((item, idx) => ({
  ...item,
  id: item.id || `pak_food_${idx + 1}`,
}));
