import { NormalizedFood, FoodModifier } from '../types.js';

export enum DishCustomizationType {
  BIRYANI_RICE = 'BIRYANI_RICE',
  NIHARI_PAYE = 'NIHARI_PAYE',
  KARAHI_HANDI = 'KARAHI_HANDI',
  DESI_BBQ = 'DESI_BBQ',
  DESI_NASHTA = 'DESI_NASHTA',
  DAAL_SABZI = 'DAAL_SABZI',
  DESI_SWEETS = 'DESI_SWEETS',
  STEAKS_ENTREES = 'STEAKS_ENTREES',
  PASTA_ITALIAN = 'PASTA_ITALIAN',
  SEAFOOD_MAINS = 'SEAFOOD_MAINS',
  SALADS = 'SALADS',
  APPETIZERS_FINGER_FOOD = 'APPETIZERS_FINGER_FOOD',
  WESTERN_DESSERTS = 'WESTERN_DESSERTS',
  BURGERS_SANDWICHES = 'BURGERS_SANDWICHES',
  PIZZA = 'PIZZA',
  SHAWARMA_ROLLS = 'SHAWARMA_ROLLS',
  CHAI_HOT_DRINKS = 'CHAI_HOT_DRINKS',
  SHAKES_COLD_DRINKS = 'SHAKES_COLD_DRINKS',
  FRIED_CHICKEN_SIDES = 'FRIED_CHICKEN_SIDES',
  SOUPS = 'SOUPS',
  ROTI_NAAN = 'ROTI_NAAN',
  NONE_NON_CUSTOMIZABLE = 'NONE_NON_CUSTOMIZABLE',
}

// Master authentic modifier templates (100% Atwater balanced & bilingual)
export const DISH_MODIFIER_TEMPLATES: Record<DishCustomizationType, FoodModifier[]> = {
  [DishCustomizationType.BIRYANI_RICE]: [
    {
      id: 'mod_biryani_aloo',
      name: 'Extra Spiced Potato (Aloo 60g)',
      nameUr: 'اضافی آلو',
      calories: 80,
      proteinGrams: 2,
      fatGrams: 0,
      carbGrams: 18,
    },
    {
      id: 'mod_biryani_chicken',
      name: 'Extra Tender Chicken Piece (80g)',
      nameUr: 'اضافی چکن پیس',
      calories: 140,
      proteinGrams: 22,
      fatGrams: 5.5,
      carbGrams: 0,
    },
    {
      id: 'mod_biryani_shami',
      name: 'Beef Shami Kabab (1 pc)',
      nameUr: 'شامی کباب',
      calories: 120,
      proteinGrams: 11,
      fatGrams: 6.5,
      carbGrams: 4,
    },
    {
      id: 'mod_biryani_raita',
      name: 'Zeera & Mint Raita (30g)',
      nameUr: 'زیرہ اور پودینہ رائتہ',
      calories: 35,
      proteinGrams: 1,
      fatGrams: 2.5,
      carbGrams: 2,
    },
    {
      id: 'mod_biryani_kachumber',
      name: 'Fresh Kachumber Salad (40g)',
      nameUr: 'کچومر سلاد',
      calories: 15,
      proteinGrams: 0.5,
      fatGrams: 0,
      carbGrams: 3,
    },
  ],

  [DishCustomizationType.NIHARI_PAYE]: [
    {
      id: 'mod_nihari_nalli',
      name: 'Extra Nalli / Bone Marrow (1 pipe)',
      nameUr: 'اضافی نلی',
      calories: 160,
      proteinGrams: 4,
      fatGrams: 16,
      carbGrams: 0,
    },
    {
      id: 'mod_nihari_maghaz',
      name: 'Extra Maghaz / Brain portion',
      nameUr: 'اضافی مغز',
      calories: 130,
      proteinGrams: 8,
      fatGrams: 11,
      carbGrams: 0,
    },
    {
      id: 'mod_nihari_roghan',
      name: 'Desi Ghee / Tarka Roghan (1 tbsp)',
      nameUr: 'اضافی تڑکہ روغن',
      calories: 90,
      proteinGrams: 0,
      fatGrams: 10,
      carbGrams: 0,
    },
    {
      id: 'mod_nihari_less_oil',
      name: 'Low Roghan / Drained Oil',
      nameUr: 'کم روغن',
      calories: -80,
      proteinGrams: 0,
      fatGrams: -9,
      carbGrams: 0,
    },
    {
      id: 'mod_nihari_garnishing',
      name: 'Extra Julienne Ginger & Green Chili',
      nameUr: 'اضافی ادرک اور ہری مرچ',
      calories: 10,
      proteinGrams: 0.5,
      fatGrams: 0,
      carbGrams: 2,
    },
  ],

  [DishCustomizationType.KARAHI_HANDI]: [
    {
      id: 'mod_karahi_makhan',
      name: 'Fresh Dairy Makhan / Butter (15g)',
      nameUr: 'اضافی مکھن',
      calories: 100,
      proteinGrams: 0.2,
      fatGrams: 11,
      carbGrams: 0,
    },
    {
      id: 'mod_karahi_ghee',
      name: 'Pure Desi Ghee Tarka (1 tbsp)',
      nameUr: 'دیسی گھی تڑکہ',
      calories: 90,
      proteinGrams: 0,
      fatGrams: 10,
      carbGrams: 0,
    },
    {
      id: 'mod_karahi_gravy',
      name: 'Extra Masala / Gravy (60g)',
      nameUr: 'اضافی مصالحہ / گریوی',
      calories: 60,
      proteinGrams: 1.5,
      fatGrams: 4,
      carbGrams: 4,
    },
    {
      id: 'mod_karahi_dry',
      name: 'Sukhi / Low Oil Preparation',
      nameUr: 'کم تیل / سوکھی کڑاہی',
      calories: -80,
      proteinGrams: 0,
      fatGrams: -9,
      carbGrams: 0,
    },
  ],

  [DishCustomizationType.DESI_BBQ]: [
    {
      id: 'mod_bbq_butter',
      name: 'Butter Brush on Skewer (10g)',
      nameUr: 'مکھن برش',
      calories: 75,
      proteinGrams: 0,
      fatGrams: 8.3,
      carbGrams: 0,
    },
    {
      id: 'mod_bbq_imlee_chutney',
      name: 'Sweet & Tangy Imlee Chutney (2 tbsp)',
      nameUr: 'املی کی چٹنی',
      calories: 40,
      proteinGrams: 0.5,
      fatGrams: 0,
      carbGrams: 9,
    },
    {
      id: 'mod_bbq_raita',
      name: 'Mint & Coriander Raita Dip',
      nameUr: 'پودینہ رائتہ ڈِپ',
      calories: 30,
      proteinGrams: 1,
      fatGrams: 2,
      carbGrams: 2,
    },
    {
      id: 'mod_bbq_lemon_onion',
      name: 'Extra Lemon Wedges & Spiced Onion Rings',
      nameUr: 'لیموں اور لچھے دار پیاز',
      calories: 10,
      proteinGrams: 0.5,
      fatGrams: 0,
      carbGrams: 2,
    },
  ],

  [DishCustomizationType.DESI_NASHTA]: [
    {
      id: 'mod_nashta_puri',
      name: 'Extra Crispy Puri (1 pc)',
      nameUr: 'اضافی پوری',
      calories: 150,
      proteinGrams: 3,
      fatGrams: 7.5,
      carbGrams: 18,
    },
    {
      id: 'mod_nashta_halwa',
      name: 'Extra Sooji Halwa (2 tbsp)',
      nameUr: 'اضافی سوجی حلوہ',
      calories: 95,
      proteinGrams: 1.5,
      fatGrams: 3.8,
      carbGrams: 14,
    },
    {
      id: 'mod_nashta_achar',
      name: 'Traditional Mixed Achar & Onion Salad',
      nameUr: 'مکس اچار اور پیاز',
      calories: 15,
      proteinGrams: 0.2,
      fatGrams: 0.7,
      carbGrams: 2,
    },
    {
      id: 'mod_nashta_makhan',
      name: 'Desi Makhan Cube (10g)',
      nameUr: 'دیسی مکھن',
      calories: 72,
      proteinGrams: 0.1,
      fatGrams: 8,
      carbGrams: 0,
    },
  ],

  [DishCustomizationType.DAAL_SABZI]: [
    {
      id: 'mod_daal_ghee_tarka',
      name: 'Extra Desi Ghee Zeera Tarka',
      nameUr: 'دیسی گھی زیرہ تڑکہ',
      calories: 90,
      proteinGrams: 0,
      fatGrams: 10,
      carbGrams: 0,
    },
    {
      id: 'mod_daal_boiled_egg',
      name: 'Boiled Egg Slice (Half)',
      nameUr: 'ابلا انڈہ',
      calories: 39,
      proteinGrams: 3.2,
      fatGrams: 2.7,
      carbGrams: 0.3,
    },
    {
      id: 'mod_daal_achar',
      name: 'Spicy Mango Achar (1 tsp)',
      nameUr: 'آم کا اچار',
      calories: 20,
      proteinGrams: 0.2,
      fatGrams: 1.8,
      carbGrams: 1,
    },
    {
      id: 'mod_daal_less_oil',
      name: 'Light Preparation / Minimum Oil',
      nameUr: 'کم تیل کی تیاری',
      calories: -60,
      proteinGrams: 0,
      fatGrams: -6.7,
      carbGrams: 0,
    },
  ],

  [DishCustomizationType.DESI_SWEETS]: [
    {
      id: 'mod_sweets_rabri',
      name: 'Extra Thick Rabri Topping (2 tbsp)',
      nameUr: 'اضافی کلاسی ربڑی',
      calories: 110,
      proteinGrams: 3.2,
      fatGrams: 6.5,
      carbGrams: 10,
    },
    {
      id: 'mod_sweets_nuts',
      name: 'Crushed Badam & Pista Garnish',
      nameUr: 'بادام اور پستہ گارنش',
      calories: 45,
      proteinGrams: 1.8,
      fatGrams: 4,
      carbGrams: 1.2,
    },
    {
      id: 'mod_sweets_light_syrup',
      name: 'Drained / Light Chasni (Low Sugar)',
      nameUr: 'کم شیرہ',
      calories: -50,
      proteinGrams: 0,
      fatGrams: 0,
      carbGrams: -12.5,
    },
    {
      id: 'mod_sweets_kulfa',
      name: 'Peshawari Kulfa Slice',
      nameUr: 'پشاوری قلفہ سلائس',
      calories: 130,
      proteinGrams: 3,
      fatGrams: 6,
      carbGrams: 16,
    },
  ],

  [DishCustomizationType.STEAKS_ENTREES]: [
    {
      id: 'mod_steak_sauce',
      name: 'Extra Peppercorn / Mushroom Jus (60g)',
      nameUr: 'پیپرکارن / مشروم ساس',
      calories: 75,
      proteinGrams: 1,
      fatGrams: 5.5,
      carbGrams: 5,
    },
    {
      id: 'mod_steak_mash',
      name: 'Creamy Mashed Potatoes Side (100g)',
      nameUr: 'کریم میشڈ پوٹیٹو',
      calories: 140,
      proteinGrams: 3,
      fatGrams: 5.5,
      carbGrams: 20,
    },
    {
      id: 'mod_steak_veg',
      name: 'Sautéed Garlic Butter Vegetables (80g)',
      nameUr: 'سوتے سبزیاں',
      calories: 45,
      proteinGrams: 1.5,
      fatGrams: 1.8,
      carbGrams: 6,
    },
    {
      id: 'mod_steak_herb_butter',
      name: 'Garlic Herb Compound Butter (10g)',
      nameUr: 'گارلک ہرب بٹر',
      calories: 85,
      proteinGrams: 0.2,
      fatGrams: 9.4,
      carbGrams: 0.2,
    },
  ],

  [DishCustomizationType.PASTA_ITALIAN]: [
    {
      id: 'mod_pasta_parmesan',
      name: 'Aged Parmesan Shavings (15g)',
      nameUr: 'پرمیسن چیز شیوونگز',
      calories: 65,
      proteinGrams: 5.5,
      fatGrams: 4.8,
      carbGrams: 0.5,
    },
    {
      id: 'mod_pasta_garlic_bread',
      name: 'Herbed Garlic Baguette Toast (1 pc)',
      nameUr: 'گارلک بریڈ سلائس',
      calories: 120,
      proteinGrams: 3,
      fatGrams: 5,
      carbGrams: 16,
    },
    {
      id: 'mod_pasta_grilled_chicken',
      name: 'Herb Grilled Chicken Strips (60g)',
      nameUr: 'گرلڈ چکن اسٹرپس',
      calories: 90,
      proteinGrams: 18,
      fatGrams: 2,
      carbGrams: 0,
    },
    {
      id: 'mod_pasta_light_sauce',
      name: 'Light Cream / Olive Oil Preparation',
      nameUr: 'ہلکی ساس کی تیاری',
      calories: -70,
      proteinGrams: -1,
      fatGrams: -5.5,
      carbGrams: -4,
    },
  ],

  [DishCustomizationType.SEAFOOD_MAINS]: [
    {
      id: 'mod_seafood_lemon_butter',
      name: 'Warm Lemon Herb Butter Dip (25g)',
      nameUr: 'لیمن ہرب بٹر ساس',
      calories: 80,
      proteinGrams: 0.2,
      fatGrams: 8.7,
      carbGrams: 1,
    },
    {
      id: 'mod_seafood_tartar',
      name: 'Classic Caper Tartar Sauce (30g)',
      nameUr: 'ٹارٹر ساس ڈِپ',
      calories: 70,
      proteinGrams: 0.4,
      fatGrams: 7,
      carbGrams: 2,
    },
    {
      id: 'mod_seafood_garlic_aioli',
      name: 'Roast Garlic Aioli Dip',
      nameUr: 'گارلک ایولی ساس',
      calories: 65,
      proteinGrams: 0.3,
      fatGrams: 7,
      carbGrams: 1,
    },
    {
      id: 'mod_seafood_lemon',
      name: 'Fresh Lemon Wedges',
      nameUr: 'فریش لیموں',
      calories: 5,
      proteinGrams: 0.1,
      fatGrams: 0,
      carbGrams: 1,
    },
  ],

  [DishCustomizationType.SALADS]: [
    {
      id: 'mod_salad_feta',
      name: 'Crumbled Greek Feta (25g)',
      nameUr: 'فیٹا چیز',
      calories: 75,
      proteinGrams: 4,
      fatGrams: 6,
      carbGrams: 1,
    },
    {
      id: 'mod_salad_croutons',
      name: 'Garlic Herb Croutons (15g)',
      nameUr: 'گارلک ہرب کروٹونز',
      calories: 50,
      proteinGrams: 1,
      fatGrams: 1.5,
      carbGrams: 8,
    },
    {
      id: 'mod_salad_light_dressing',
      name: 'Dressing on the Side / Half Dressing',
      nameUr: 'ڈریسنگ الگ / کم ڈریسنگ',
      calories: -55,
      proteinGrams: 0,
      fatGrams: -6,
      carbGrams: -1,
    },
    {
      id: 'mod_salad_grilled_chicken',
      name: 'Sliced Grilled Chicken Breast (50g)',
      nameUr: 'گرلڈ چکن بریسٹ',
      calories: 85,
      proteinGrams: 18,
      fatGrams: 1.5,
      carbGrams: 0,
    },
  ],

  [DishCustomizationType.APPETIZERS_FINGER_FOOD]: [
    {
      id: 'mod_app_truffle_dip',
      name: 'Truffle Aioli Dip (25g)',
      nameUr: 'ٹرفل ایولی ڈِپ',
      calories: 75,
      proteinGrams: 0.5,
      fatGrams: 7.5,
      carbGrams: 1.5,
    },
    {
      id: 'mod_app_spicy_ranch',
      name: 'Smoked Jalapeño Ranch Dip (25g)',
      nameUr: 'اسپائسی رانچ ساس',
      calories: 65,
      proteinGrams: 0.8,
      fatGrams: 6,
      carbGrams: 2,
    },
    {
      id: 'mod_app_cheddar_dip',
      name: 'Melted Cheddar Cheese Dip',
      nameUr: 'چیڈر چیز ڈِپ',
      calories: 70,
      proteinGrams: 2,
      fatGrams: 5.5,
      carbGrams: 3,
    },
    {
      id: 'mod_app_marinara',
      name: 'Italian Herb Marinara Sauce',
      nameUr: 'مرینارا ساس',
      calories: 25,
      proteinGrams: 0.8,
      fatGrams: 0.5,
      carbGrams: 4.5,
    },
  ],

  [DishCustomizationType.WESTERN_DESSERTS]: [
    {
      id: 'mod_dessert_gelato',
      name: 'Vanilla Bean Gelato Scoop (50g)',
      nameUr: 'ونیلا جیلاٹو سکوپ',
      calories: 120,
      proteinGrams: 2.5,
      fatGrams: 6.5,
      carbGrams: 14,
    },
    {
      id: 'mod_dessert_choc_drizzle',
      name: 'Warm Belgian Chocolate Drizzle (15g)',
      nameUr: 'بیلجین چاکلیٹ ڈرزل',
      calories: 65,
      proteinGrams: 0.8,
      fatGrams: 3.2,
      carbGrams: 8.5,
    },
    {
      id: 'mod_dessert_whipped_cream',
      name: 'Fresh Dairy Whipped Cream (20g)',
      nameUr: 'فریش وہیپڈ کریم',
      calories: 55,
      proteinGrams: 0.5,
      fatGrams: 5.5,
      carbGrams: 1.5,
    },
    {
      id: 'mod_dessert_berries',
      name: 'Mixed Wild Berries Compote (2 tbsp)',
      nameUr: 'مکسڈ بیریز کمبوٹ',
      calories: 30,
      proteinGrams: 0.4,
      fatGrams: 0.2,
      carbGrams: 7,
    },
  ],

  [DishCustomizationType.BURGERS_SANDWICHES]: [
    {
      id: 'mod_burger_cheddar',
      name: 'Extra Cheddar Cheese Slice (1 pc)',
      nameUr: 'اضافی چیز سلائس',
      calories: 70,
      proteinGrams: 4.5,
      fatGrams: 5.8,
      carbGrams: 0.5,
    },
    {
      id: 'mod_burger_extra_patty',
      name: 'Extra Grilled Patty / Fillet',
      nameUr: 'اضافی گرلڈ پیٹی',
      calories: 150,
      proteinGrams: 16,
      fatGrams: 9.5,
      carbGrams: 0,
    },
    {
      id: 'mod_burger_mushrooms',
      name: 'Sautéed Garlic Mushrooms (30g)',
      nameUr: 'سوتے مشرومز',
      calories: 35,
      proteinGrams: 1.5,
      fatGrams: 2,
      carbGrams: 3,
    },
    {
      id: 'mod_burger_no_mayo',
      name: 'Without Mayo / Sauce',
      nameUr: 'بغیر مایو / ساس',
      calories: -65,
      proteinGrams: 0,
      fatGrams: -7,
      carbGrams: -1,
    },
    {
      id: 'mod_burger_special_sauce',
      name: 'Extra Chipotle / House Special Sauce',
      nameUr: 'اسپیشل ساس',
      calories: 55,
      proteinGrams: 0.5,
      fatGrams: 5,
      carbGrams: 2.5,
    },
  ],

  [DishCustomizationType.PIZZA]: [
    {
      id: 'mod_pizza_mozzarella',
      name: 'Extra 100% Dairy Mozzarella (30g)',
      nameUr: 'اضافی موزریلا چیز',
      calories: 90,
      proteinGrams: 6.5,
      fatGrams: 7,
      carbGrams: 1,
    },
    {
      id: 'mod_pizza_garlic_dip',
      name: 'Creamy Garlic Mayo Crust Dip (25g)',
      nameUr: 'گارلک مایو ڈِپ',
      calories: 80,
      proteinGrams: 0.5,
      fatGrams: 8,
      carbGrams: 2,
    },
    {
      id: 'mod_pizza_olives_jalapenos',
      name: 'Extra Black Olives & Jalapeños',
      nameUr: 'زیتون اور ہلاپینیو',
      calories: 15,
      proteinGrams: 0.3,
      fatGrams: 1.1,
      carbGrams: 1,
    },
    {
      id: 'mod_pizza_stuffed_crust',
      name: 'Stuffed Crust Cheese Upgrade',
      nameUr: 'اسٹفڈ کرسٹ چیز',
      calories: 110,
      proteinGrams: 7,
      fatGrams: 6.5,
      carbGrams: 6,
    },
  ],

  [DishCustomizationType.SHAWARMA_ROLLS]: [
    {
      id: 'mod_roll_toum',
      name: 'Extra Lebanese Garlic Toum Sauce',
      nameUr: 'گارلک طحینہ ساس',
      calories: 60,
      proteinGrams: 0.3,
      fatGrams: 5.8,
      carbGrams: 2,
    },
    {
      id: 'mod_roll_cheese',
      name: 'Melted Mozzarella Cheese Layer',
      nameUr: 'اضافی پگھلی چیز',
      calories: 65,
      proteinGrams: 4,
      fatGrams: 5.5,
      carbGrams: 0.5,
    },
    {
      id: 'mod_roll_extra_meat',
      name: 'Extra Shredded Tikka / Shawarma Meat (40g)',
      nameUr: 'اضافی چکن / بیف گوشت',
      calories: 75,
      proteinGrams: 14,
      fatGrams: 2,
      carbGrams: 0,
    },
    {
      id: 'mod_roll_light_sauce',
      name: 'Dry / Light Sauce Preparation',
      nameUr: 'کم ساس / ڈرائی رول',
      calories: -50,
      proteinGrams: 0,
      fatGrams: -5,
      carbGrams: -1,
    },
  ],

  [DishCustomizationType.CHAI_HOT_DRINKS]: [
    {
      id: 'mod_chai_sugar',
      name: 'Extra White Sugar (1 tsp / 4g)',
      nameUr: 'اضافی چینی',
      calories: 16,
      proteinGrams: 0,
      fatGrams: 0,
      carbGrams: 4,
    },
    {
      id: 'mod_chai_no_sugar',
      name: 'Without Sugar (No Meetha)',
      nameUr: 'بغیر چینی',
      calories: -24,
      proteinGrams: 0,
      fatGrams: 0,
      carbGrams: -6,
    },
    {
      id: 'mod_chai_malai',
      name: 'Extra Malai / Full Cream Milk Layer',
      nameUr: 'اضافی بالائی',
      calories: 35,
      proteinGrams: 0.6,
      fatGrams: 3.2,
      carbGrams: 1,
    },
    {
      id: 'mod_chai_elaichi',
      name: 'Cardamom / Elaichi Infusion',
      nameUr: 'الائچی خوشبو',
      calories: 2,
      proteinGrams: 0,
      fatGrams: 0,
      carbGrams: 0.5,
    },
  ],

  [DishCustomizationType.SHAKES_COLD_DRINKS]: [
    {
      id: 'mod_shake_extra_sugar',
      name: 'Extra Sugar / Sugar Syrup',
      nameUr: 'اضافی چینی / شربت',
      calories: 35,
      proteinGrams: 0,
      fatGrams: 0,
      carbGrams: 8.5,
    },
    {
      id: 'mod_shake_no_sugar',
      name: 'No Added Sugar / Pure Natural Fruit',
      nameUr: 'بغیر اضافی چینی',
      calories: -45,
      proteinGrams: 0,
      fatGrams: 0,
      carbGrams: -11,
    },
    {
      id: 'mod_shake_ice_cream_scoop',
      name: 'Extra Premium Ice Cream Scoop',
      nameUr: 'آئس کریم سکوپ',
      calories: 110,
      proteinGrams: 2,
      fatGrams: 5.8,
      carbGrams: 13,
    },
    {
      id: 'mod_shake_skim_milk',
      name: 'Made with Skimmed Milk',
      nameUr: 'اسکمڈ ملک کی تیاری',
      calories: -50,
      proteinGrams: -1,
      fatGrams: -4,
      carbGrams: -3,
    },
  ],

  [DishCustomizationType.FRIED_CHICKEN_SIDES]: [
    {
      id: 'mod_fc_dinner_roll',
      name: 'Fresh Baked Dinner Roll (1 pc)',
      nameUr: 'ڈنر رول',
      calories: 85,
      proteinGrams: 2.5,
      fatGrams: 2,
      carbGrams: 14,
    },
    {
      id: 'mod_fc_coleslaw',
      name: 'Creamy Coleslaw Cup (70g)',
      nameUr: 'کولسلا کپ',
      calories: 75,
      proteinGrams: 1,
      fatGrams: 5,
      carbGrams: 7,
    },
    {
      id: 'mod_fc_garlic_dip',
      name: 'Garlic Mayo / Spicy Mayo Dip (25g)',
      nameUr: 'گارلک مایو ڈِپ',
      calories: 60,
      proteinGrams: 0.3,
      fatGrams: 5.8,
      carbGrams: 2,
    },
    {
      id: 'mod_fc_mash_gravy',
      name: 'Mashed Potatoes with Savory Gravy (100g)',
      nameUr: 'میشڈ پوٹیٹو مع گریوی',
      calories: 110,
      proteinGrams: 2,
      fatGrams: 4,
      carbGrams: 16,
    },
  ],

  [DishCustomizationType.SOUPS]: [
    {
      id: 'mod_soup_wontons',
      name: 'Crispy Fried Wonton Strips (15g)',
      nameUr: 'کرسپی وانٹون اسٹرپس',
      calories: 50,
      proteinGrams: 1,
      fatGrams: 2.5,
      carbGrams: 6,
    },
    {
      id: 'mod_soup_extra_chicken',
      name: 'Extra Shredded Chicken Breast (30g)',
      nameUr: 'اضافی چکن ریشہ',
      calories: 45,
      proteinGrams: 9,
      fatGrams: 1,
      carbGrams: 0,
    },
    {
      id: 'mod_soup_chili_vinegar',
      name: 'Pickled Green Chili & Vinegar Dressing',
      nameUr: 'سرکہ اور ہری مرچ ڈریسنگ',
      calories: 10,
      proteinGrams: 0.3,
      fatGrams: 0,
      carbGrams: 1.5,
    },
    {
      id: 'mod_soup_egg_drop',
      name: 'Extra Egg Drop Ribbon Swirl',
      nameUr: 'اضافی انڈہ ریبن',
      calories: 35,
      proteinGrams: 3,
      fatGrams: 2.5,
      carbGrams: 0.3,
    },
  ],

  [DishCustomizationType.ROTI_NAAN]: [
    {
      id: 'mod_naan_butter',
      name: 'Fresh Dairy Butter Brush (8g)',
      nameUr: 'مکھن برش',
      calories: 65,
      proteinGrams: 0,
      fatGrams: 7.2,
      carbGrams: 0,
    },
    {
      id: 'mod_naan_seeds',
      name: 'Toasted Kalonji & Sesame (Til) Seeds',
      nameUr: 'کلونجی اور تل',
      calories: 15,
      proteinGrams: 0.5,
      fatGrams: 1.2,
      carbGrams: 0.5,
    },
    {
      id: 'mod_naan_cheese',
      name: 'Melted Mozzarella Stuffing Layer',
      nameUr: 'چیز اسٹفنگ',
      calories: 95,
      proteinGrams: 6.5,
      fatGrams: 7.5,
      carbGrams: 1,
    },
    {
      id: 'mod_naan_dry',
      name: 'Dry Tandoori / No Oil or Butter',
      nameUr: 'سوکھا / بغیر مکھن',
      calories: -40,
      proteinGrams: 0,
      fatGrams: -4.5,
      carbGrams: 0,
    },
  ],

  [DishCustomizationType.NONE_NON_CUSTOMIZABLE]: [],
};

// Word boundary matching helper to prevent substring bugs
export function hasWord(text: string, ...words: string[]): boolean {
  if (!text) return false;
  return words.some((w) => {
    const escaped = w.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    return regex.test(text);
  });
}

/**
 * Deterministically resolves a food item to its authentic DishCustomizationType.
 * Matches strictly on item.name, item.brandCategory, and item.category.
 * NEVER checks restaurant-wide cuisineTags to avoid cross-menu contamination.
 */
export function resolveDishCustomization(item: NormalizedFood): DishCustomizationType {
  const name = (item.name || '').toLowerCase();
  const brandCategory = (item.brandCategory || '').toLowerCase();
  const category = (item.category || '').toLowerCase();

  const dishText = `${name} ${brandCategory}`.toLowerCase();

  // 1. Packaged beverages, bottled water, canned drinks, or single dips (Zero Customization)
  if (
    hasWord(
      dishText,
      'coca cola',
      'coca-cola',
      'coke',
      'pepsi',
      'sprite',
      'fanta',
      '7up',
      'seven up',
      'mirinda',
      'marinda',
      'dew',
      'mountain dew',
      'red bull',
      'sting',
      'pakola can',
      'mineral water',
      'aquafina',
      'nestle',
      'kinley',
      'dasani',
      'canned',
      'bottle'
    ) ||
    name.includes('330ml') ||
    name.includes('250ml') ||
    name.includes('500ml') ||
    name.includes('1.5l') ||
    name.includes('can') ||
    (hasWord(dishText, 'dip', 'chutney single', 'sauce cup') && !hasWord(dishText, 'fries', 'wings', 'platter', 'arancini'))
  ) {
    // Only route to NONE if not a freshly prepared artisanal hot chai or shake
    if (!hasWord(dishText, 'chai', 'tea', 'latte', 'cappuccino', 'shake', 'smoothie', 'lassi', 'fresh juice')) {
      return DishCustomizationType.NONE_NON_CUSTOMIZABLE;
    }
  }

  // 2. Western & Artisan Desserts (Tarts, Brulee, Cheesecakes, Molten Lava, Brownies, Gelato)
  if (
    !hasWord(dishText, 'puri', 'poori', 'halwa') &&
    (brandCategory.includes('artisan dessert') ||
      brandCategory.includes('dessert') ||
      hasWord(
        dishText,
        'tart',
        'tarts',
        'brulee',
        'brûlée',
        'crumble',
        'cheesecake',
        'brownie',
        'brownies',
        'molten lava',
        'fondant',
        'waffle',
        'waffles',
        'pancake',
        'pancakes',
        'tiramisu',
        'mousse',
        'gelato',
        'ice cream scoop'
      ))
  ) {
    return DishCustomizationType.WESTERN_DESSERTS;
  }

  // 3. Desi Sweets & Traditional Mithai (Excludes Halwa Puri breakfast thalis)
  if (
    !hasWord(dishText, 'puri', 'poori', 'nashta', 'chana', 'thali', 'breakfast') &&
    (hasWord(
      dishText,
      'kheer',
      'gulab jamun',
      'jalebi',
      'rasmalai',
      'barfi',
      'rabri',
      'zarda',
      'firni',
      'halwa',
      'falooda',
      'kulfa'
    ) ||
    brandCategory.includes('desi sweet') ||
    brandCategory.includes('mithai'))
  ) {
    return DishCustomizationType.DESI_SWEETS;
  }

  // 4. Salads (Mediterranean, Caesar, Rocket Leaf, Greek, Quinoa)
  if (
    hasWord(dishText, 'salad', 'caesar', 'mediterranean salad', 'rocket leaf', 'greek salad') ||
    (brandCategory.includes('salad') && !hasWord(dishText, 'arancini', 'calamari', 'wings', 'tenderloin', 'steak'))
  ) {
    return DishCustomizationType.SALADS;
  }

  // 5. Soups (Hot & Sour, Chicken Corn, 19B, Mushroom Soup)
  if (
    hasWord(dishText, 'soup', 'hot & sour', 'chicken corn', 'yakhni') ||
    brandCategory.includes('soup')
  ) {
    return DishCustomizationType.SOUPS;
  }

  // 6. Seafood & Fish Dishes (Checked before steaks so Snapper/Salmon in 'Gourmet Steaks & Mains' routes correctly)
  if (
    hasWord(
      dishText,
      'red snapper',
      'snapper',
      'salmon',
      'fish & chips',
      'fried fish',
      'grilled fish',
      'prawn tempura',
      'prawns',
      'jumbo prawn',
      'finger fish',
      'fish fillet'
    ) ||
    (brandCategory.includes('seafood') && !hasWord(dishText, 'steak', 'beef', 'chicken'))
  ) {
    return DishCustomizationType.SEAFOOD_MAINS;
  }

  // 7. Steaks & Gourmet Entrees (Tenderloin, Peppercorn, Moroccan Chicken, Herb Jus, Ribeye, Fillet)
  if (
    !hasWord(dishText, 'snapper', 'salmon', 'prawn', 'fish') &&
    (hasWord(
      dishText,
      'steak',
      'steaks',
      'tenderloin',
      'ribeye',
      'peppercorn',
      'tarragon',
      'herb jus',
      'moroccan chicken',
      'fillet mignon',
      'chicken steak',
      'beef steak'
    ) ||
    brandCategory.includes('gourmet steaks') ||
    brandCategory.includes('steaks'))
  ) {
    return DishCustomizationType.STEAKS_ENTREES;
  }

  // 8. Pasta & Italian Dishes (Linguine, Alfredo, Penne, Lasagna, Spaghetti, Ravioli)
  if (
    hasWord(
      dishText,
      'pasta',
      'linguine',
      'fettuccine',
      'alfredo',
      'penne',
      'lasagna',
      'spaghetti',
      'ravioli',
      'aglio olio',
      'carbonara'
    ) ||
    brandCategory.includes('pasta') ||
    brandCategory.includes('italian')
  ) {
    return DishCustomizationType.PASTA_ITALIAN;
  }


  // 9. Pizzas & Calzones
  if (
    hasWord(dishText, 'pizza', 'calzone', 'flatbread pizza', 'deep dish', 'thin crust') ||
    brandCategory.includes('pizza') ||
    category.toLowerCase().includes('pizza')
  ) {
    return DishCustomizationType.PIZZA;
  }

  // 10. Burgers & Sandwiches
  if (
    hasWord(
      dishText,
      'burger',
      'burgers',
      'zinger',
      'smash burger',
      'club sandwich',
      'panini',
      'beef burger',
      'crispy burger'
    ) ||
    brandCategory.includes('burger') ||
    brandCategory.includes('sandwich')
  ) {
    return DishCustomizationType.BURGERS_SANDWICHES;
  }

  // 11. Shawarma & Paratha Rolls
  if (
    hasWord(
      dishText,
      'shawarma',
      'paratha roll',
      'boti roll',
      'bihari roll',
      'seekh roll',
      'zinger roll',
      'wrap'
    ) ||
    brandCategory.includes('roll') ||
    brandCategory.includes('shawarma')
  ) {
    return DishCustomizationType.SHAWARMA_ROLLS;
  }

  // 12. Biryani, Pulao & Rice Platters
  if (
    hasWord(
      dishText,
      'biryani',
      'pulao',
      'mandi',
      'fried rice',
      'egg fried rice',
      'rice platter',
      'masala rice',
      'steamed rice'
    ) ||
    brandCategory.includes('biryani') ||
    brandCategory.includes('rice') ||
    category.toLowerCase().includes('rice')
  ) {
    return DishCustomizationType.BIRYANI_RICE;
  }

  // 13. Nihari & Siri Paye
  if (
    hasWord(dishText, 'nihari', 'nalli', 'paye', 'paya', 'siri paye', 'bong nihari', 'maghaz nihari') ||
    brandCategory.includes('nihari') ||
    brandCategory.includes('paye')
  ) {
    return DishCustomizationType.NIHARI_PAYE;
  }

  // 14. Karahi & Handi
  if (
    hasWord(
      dishText,
      'karahi',
      'handi',
      'shinwari',
      'white karahi',
      'makhni handi',
      'makhni karahi',
      'balochi tikka karahi'
    ) ||
    brandCategory.includes('karahi') ||
    brandCategory.includes('handi')
  ) {
    return DishCustomizationType.KARAHI_HANDI;
  }

  // 15. Desi BBQ & Tandoori Grills
  if (
    hasWord(
      dishText,
      'tikka',
      'seekh kabab',
      'seekh kebab',
      'malai boti',
      'bihari boti',
      'bihari kabab',
      'chapli kabab',
      'chargha',
      'sajji',
      'reshmi kabab'
    ) ||
    brandCategory.includes('bbq') ||
    brandCategory.includes('grill') ||
    category.toLowerCase().includes('bbq')
  ) {
    return DishCustomizationType.DESI_BBQ;
  }

  // 16. Desi Nashta & Breakfast Platters
  if (
    hasWord(dishText, 'halwa puri', 'chana nashta', 'choley', 'anda paratha', 'bhujia', 'lahori nashta') ||
    brandCategory.includes('nashta') ||
    brandCategory.includes('breakfast')
  ) {
    return DishCustomizationType.DESI_NASHTA;
  }

  // 17. Daal & Vegetarian Sabzi
  if (
    hasWord(
      dishText,
      'daal',
      'dal',
      'palak paneer',
      'aloo gobi',
      'bhindi',
      'mixed sabzi',
      'chana daal',
      'tarka daal',
      'daal makhni'
    ) ||
    brandCategory.includes('daal') ||
    brandCategory.includes('sabzi') ||
    brandCategory.includes('vegetarian')
  ) {
    return DishCustomizationType.DAAL_SABZI;
  }

  // 18. Roti, Naan & Parathas
  if (
    hasWord(
      dishText,
      'naan',
      'rohani naan',
      'garlic naan',
      'tandoori roti',
      'kulcha',
      'taftan',
      'sheermal',
      'plain paratha'
    ) ||
    brandCategory.includes('roti') ||
    brandCategory.includes('naan') ||
    brandCategory.includes('bread')
  ) {
    return DishCustomizationType.ROTI_NAAN;
  }

  // 19. Chai & Hot Beverages
  if (
    hasWord(
      dishText,
      'chai',
      'doodh patti',
      'karak chai',
      'kashmiri chai',
      'green tea',
      'kehwa',
      'cappuccino',
      'latte',
      'espresso',
      'hot coffee',
      'hot chocolate'
    ) ||
    brandCategory.includes('tea') ||
    brandCategory.includes('hot beverages')
  ) {
    return DishCustomizationType.CHAI_HOT_DRINKS;
  }

  // 20. Shakes, Smoothies & Cold Drinks
  if (
    hasWord(
      dishText,
      'shake',
      'smoothie',
      'cold coffee',
      'frappe',
      'lassi',
      'lemonade',
      'mint margarita',
      'fresh juice',
      'slush'
    ) ||
    brandCategory.includes('shake') ||
    brandCategory.includes('beverage') ||
    brandCategory.includes('drinks')
  ) {
    return DishCustomizationType.SHAKES_COLD_DRINKS;
  }

  // 21. Fried Chicken, Hot Shots & Loaded Fries
  if (
    hasWord(
      dishText,
      'fried chicken',
      'nuggets',
      'hot shots',
      'chicken tenders',
      'crispy strips',
      'loaded fries',
      'french fries',
      'curly fries'
    ) ||
    brandCategory.includes('fried chicken')
  ) {
    return DishCustomizationType.FRIED_CHICKEN_SIDES;
  }

  // 22. Appetizers & Finger Food (Arancini, Calamari, Wings, Mozzarella Sticks, Nachos)
  if (
    hasWord(
      dishText,
      'arancini',
      'calamari',
      'mozzarella sticks',
      'chicken wings',
      'nachos',
      'spring rolls',
      'samosa',
      'finger fish'
    ) ||
    brandCategory.includes('appetizer') ||
    brandCategory.includes('starters')
  ) {
    return DishCustomizationType.APPETIZERS_FINGER_FOOD;
  }

  // Default fallback: Items not categorized have no authentic customizations
  return DishCustomizationType.NONE_NON_CUSTOMIZABLE;
}

/**
 * Returns authentic, verified food modifiers for any food item.
 * If the item already has native modifiers configured, returns those.
 * If the item resolves to NONE_NON_CUSTOMIZABLE, returns [] (allowing UI to hide the customization card).
 * Otherwise, returns the corresponding authentic modifier template.
 */
export function getDishCustomizationModifiers(item: NormalizedFood): FoodModifier[] {
  if (item.modifiers && item.modifiers.length > 0) {
    return item.modifiers;
  }

  const customType = resolveDishCustomization(item);
  if (customType === DishCustomizationType.NONE_NON_CUSTOMIZABLE) {
    return [];
  }

  return DISH_MODIFIER_TEMPLATES[customType] || [];
}
