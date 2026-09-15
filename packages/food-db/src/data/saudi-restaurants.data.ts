import { NormalizedFood, RestaurantBrand } from '../types.js';

export const SAUDI_RESTAURANT_BRANDS: RestaurantBrand[] = [
  {
    "id": "al_matbakh_al_saudi",
    "name": "Saudi Traditional Kitchen",
    "nameAr": "المطبخ الشعبي السعودي",
    "region": "SA",
    "category": "Home Food",
    "cuisineTags": [
      "Saudi",
      "Traditional",
      "Kabsa",
      "Mandi",
      "Home Food"
    ],
    "popularItemsCount": 30,
    "color": "#006C35",
    "tagline": "Authentic Traditional Saudi Home Dishes & Banquets",
    "taglineAr": "أشهى الأطباق والولائم الشعبية السعودية المحضرة في المنزل",
    "accentColor": "#FEF08A"
  },
  {
    "id": "albaik",
    "name": "AlBaik",
    "nameAr": "البيك",
    "region": "SA",
    "category": "Fast Food",
    "cuisineTags": [
      "Fast Food",
      "Broast",
      "Chicken",
      "Saudi"
    ],
    "popularItemsCount": 16,
    "color": "#D62300",
    "tagline": "The Legendary Saudi Fried Chicken & Seafood",
    "taglineAr": "دجاج البيك المقرمش الشهير والمأكولات البحرية",
    "accentColor": "#FFCC00"
  },
  {
    "id": "kudu",
    "name": "Kudu",
    "nameAr": "كودو",
    "region": "SA",
    "category": "Fast Food",
    "cuisineTags": [
      "Fast Food",
      "Sandwiches",
      "Burgers",
      "Breakfast"
    ],
    "popularItemsCount": 14,
    "color": "#F48220",
    "tagline": "Freshly Prepared Sandwiches & Meals",
    "taglineAr": "ساندوتشات ووجبات طازجة تُحضر أمامك",
    "accentColor": "#FFFFFF"
  },
  {
    "id": "al_tazaj",
    "name": "Al Tazaj",
    "nameAr": "الطازج",
    "region": "SA",
    "category": "Grills & Fast Casual",
    "cuisineTags": [
      "Chicken",
      "Grills",
      "Mandi",
      "Saudi"
    ],
    "popularItemsCount": 14,
    "color": "#00843D",
    "tagline": "Fresh Charcoal Grilled Farrouj & Traditional Rice",
    "taglineAr": "فروج مشوي طازج على الفحم وأرز على أصوله",
    "accentColor": "#F58220"
  },
  {
    "id": "shawarmer",
    "name": "Shawarmer",
    "nameAr": "شاورمر",
    "region": "SA",
    "category": "Shawarma",
    "cuisineTags": [
      "Shawarma",
      "Wraps",
      "Fast Food",
      "Saudi"
    ],
    "popularItemsCount": 12,
    "color": "#E31B23",
    "tagline": "Innovative Saudi Shawarma & Arabo Platters",
    "taglineAr": "شاورما مبتكرة وبوكسات عربو المميزة",
    "accentColor": "#FFD100"
  },
  {
    "id": "herfy",
    "name": "Herfy",
    "nameAr": "هرفي",
    "region": "SA",
    "category": "Burgers",
    "cuisineTags": [
      "Burgers",
      "Fast Food",
      "Saudi Chain"
    ],
    "popularItemsCount": 12,
    "color": "#E30613",
    "tagline": "The Leading Saudi Fast Food Burger Pioneer",
    "taglineAr": "رواد البرجر والوجبات السريعة في المملكة",
    "accentColor": "#FFFFFF"
  },
  {
    "id": "al_romansiah",
    "name": "Al Romansiah",
    "nameAr": "الرومانسية",
    "region": "SA",
    "category": "Traditional Saudi",
    "cuisineTags": [
      "Mandi",
      "Madhbi",
      "Kabsa",
      "Saudi Traditional"
    ],
    "popularItemsCount": 16,
    "color": "#8A1538",
    "tagline": "Authentic Saudi Traditional Rice & Meat Banquets",
    "taglineAr": "أصالة الضيافة السعودية وأفخم ولائم الأرز واللحم",
    "accentColor": "#D4AF37"
  },
  {
    "id": "mama_noura",
    "name": "Mama Noura",
    "nameAr": "ماما نورة",
    "region": "SA",
    "category": "Shawarma & Juices",
    "cuisineTags": [
      "Shawarma",
      "Grills",
      "Fresh Juices",
      "Riyadh Iconic"
    ],
    "popularItemsCount": 15,
    "color": "#FF6F00",
    "tagline": "Iconic Riyadh Shawarma & Fresh Exotic Juices",
    "taglineAr": "شاورما الرياض الأشهر وعصائر طبيعية طازجة",
    "accentColor": "#FFEB3B"
  },
  {
    "id": "maestro_pizza",
    "name": "Maestro Pizza",
    "nameAr": "مايسترو بيتزا",
    "region": "SA",
    "category": "Pizza",
    "cuisineTags": [
      "Pizza",
      "Fast Casual",
      "Saudi Brand"
    ],
    "popularItemsCount": 12,
    "color": "#1B5E20",
    "tagline": "Saudi Born Gourmet Pizza Masterpieces",
    "taglineAr": "بيتزا سعودية مبتكرة وجودة المايسترو",
    "accentColor": "#C62828"
  },
  {
    "id": "hamburgini",
    "name": "Hamburgini",
    "nameAr": "همبرغيني",
    "region": "SA",
    "category": "Gourmet Burgers",
    "cuisineTags": [
      "Burgers",
      "Angus Beef",
      "Fries",
      "Saudi Brand"
    ],
    "popularItemsCount": 10,
    "color": "#D32F2F",
    "tagline": "Fresh Made-to-Order Angus Beef Burgers",
    "taglineAr": "برجر لحم أنجوس طازج ومطهو حسب طلبك",
    "accentColor": "#212121"
  },
  {
    "id": "bait_al_shawarma",
    "name": "Bait Al Shawarma",
    "nameAr": "بيت الشاورما",
    "region": "SA",
    "category": "Shawarma & Platters",
    "cuisineTags": [
      "Shawarma",
      "Broast",
      "Platters",
      "Saudi Chain"
    ],
    "popularItemsCount": 12,
    "color": "#C2185B",
    "tagline": "Authentic Arabic Shawarma & Loaded Platters",
    "taglineAr": "شاورما على أصولها وبوكسات عربي غنية",
    "accentColor": "#FFC107"
  },
  {
    "id": "barns",
    "name": "Barn's",
    "nameAr": "بارنز كافيه",
    "region": "SA",
    "category": "Coffee & Cafe",
    "cuisineTags": [
      "Coffee",
      "Cafe",
      "Saudi Heritage",
      "Espresso"
    ],
    "popularItemsCount": 12,
    "color": "#4E342E",
    "tagline": "Pioneering Saudi Specialty Coffee Roasters Since 1992",
    "taglineAr": "رواد القهوة السعودية المختصة منذ عام ١٩٩٢",
    "accentColor": "#D7CCC8"
  },
  {
    "id": "half_million",
    "name": "Half Million",
    "nameAr": "هاف مليون",
    "region": "SA",
    "category": "Specialty Coffee",
    "cuisineTags": [
      "Specialty Coffee",
      "Pastry",
      "Saudi Modern",
      "Trendy"
    ],
    "popularItemsCount": 12,
    "color": "#111827",
    "tagline": "Saudi Contemporary Luxury Specialty Coffee",
    "taglineAr": "القهوة المختصة العصرية الأكثر تميزاً في المملكة",
    "accentColor": "#9CA3AF"
  }
];

export const SAUDI_RESTAURANTS_DATA: NormalizedFood[] = [
  {
    "id": "sa_albaik_broast_4pc_reg",
    "name": "AlBaik 4pc Chicken Broast Regular",
    "nameAr": "دجاج البيك 4 قطع عادي",
    "brand": "AlBaik",
    "brandId": "albaik",
    "brandCategory": "Chicken Meals",
    "category": "Chicken Meals",
    "cuisineTags": [
      "Broast",
      "Chicken",
      "AlBaik",
      "Saudi Icon"
    ],
    "region": "SA",
    "kcal100g": 263,
    "protein100g": 18,
    "carb100g": 14,
    "fat100g": 15,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 4.5,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 9,
    "servings": [
      {
        "label": "4pc Meal with Bun & Fries (وجبة 4 قطع)",
        "grams": 360,
        "isDefault": true,
        "kcal": 947
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 263
      }
    ]
  },
  {
    "id": "sa_albaik_broast_4pc_spicy",
    "name": "AlBaik 4pc Chicken Broast Spicy",
    "nameAr": "دجاج البيك 4 قطع حراق",
    "brand": "AlBaik",
    "brandId": "albaik",
    "brandCategory": "Chicken Meals",
    "category": "Chicken Meals",
    "cuisineTags": [
      "Broast",
      "Chicken",
      "Spicy",
      "AlBaik"
    ],
    "region": "SA",
    "kcal100g": 270,
    "protein100g": 18,
    "carb100g": 14.5,
    "fat100g": 15.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 4.6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 9.3,
    "servings": [
      {
        "label": "4pc Meal with Bun & Fries (وجبة 4 قطع حراق)",
        "grams": 360,
        "isDefault": true,
        "kcal": 972
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 270
      }
    ]
  },
  {
    "id": "sa_albaik_broast_8pc",
    "name": "AlBaik 8pc Chicken Broast Family Meal",
    "nameAr": "دجاج البيك 8 قطع وجبة عائلية",
    "brand": "AlBaik",
    "brandId": "albaik",
    "brandCategory": "Chicken Meals",
    "category": "Chicken Meals",
    "cuisineTags": [
      "Broast",
      "Family Meal",
      "AlBaik"
    ],
    "region": "SA",
    "kcal100g": 266,
    "protein100g": 18.2,
    "carb100g": 14,
    "fat100g": 15.2,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 4.6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 9.1,
    "servings": [
      {
        "label": "8pc Family Meal (وجبة عائلية 8 قطع)",
        "grams": 720,
        "isDefault": true,
        "kcal": 1915
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 266
      }
    ]
  },
  {
    "id": "sa_albaik_nuggets_7pc",
    "name": "AlBaik 7pc Chicken Nuggets Meal",
    "nameAr": "مسحب البيك 7 قطع",
    "brand": "AlBaik",
    "brandId": "albaik",
    "brandCategory": "Nuggets & Strips",
    "category": "Nuggets & Strips",
    "cuisineTags": [
      "Nuggets",
      "Chicken",
      "AlBaik"
    ],
    "region": "SA",
    "kcal100g": 247,
    "protein100g": 16.5,
    "carb100g": 16,
    "fat100g": 13,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.9,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 7.8,
    "servings": [
      {
        "label": "7pc Meal with Fries (وجبة 7 قطع)",
        "grams": 240,
        "isDefault": true,
        "kcal": 593
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 247
      }
    ]
  },
  {
    "id": "sa_albaik_nuggets_10pc",
    "name": "AlBaik 10pc Chicken Nuggets Meal",
    "nameAr": "مسحب البيك 10 قطع",
    "brand": "AlBaik",
    "brandId": "albaik",
    "brandCategory": "Nuggets & Strips",
    "category": "Nuggets & Strips",
    "cuisineTags": [
      "Nuggets",
      "Chicken",
      "AlBaik"
    ],
    "region": "SA",
    "kcal100g": 247,
    "protein100g": 16.5,
    "carb100g": 16,
    "fat100g": 13,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.9,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 7.8,
    "servings": [
      {
        "label": "10pc Meal with Fries (وجبة 10 قطع)",
        "grams": 320,
        "isDefault": true,
        "kcal": 790
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 247
      }
    ]
  },
  {
    "id": "sa_albaik_big_baik",
    "name": "Big Baik Sandwich with Garlic",
    "nameAr": "ساندوتش بيج بيك بالثوم",
    "brand": "AlBaik",
    "brandId": "albaik",
    "brandCategory": "Sandwiches",
    "category": "Sandwiches",
    "cuisineTags": [
      "Sandwich",
      "Chicken",
      "AlBaik"
    ],
    "region": "SA",
    "kcal100g": 280,
    "protein100g": 14.5,
    "carb100g": 24,
    "fat100g": 14,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 4.2,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 8.4,
    "servings": [
      {
        "label": "1 Sandwich (ساندوتش)",
        "grams": 280,
        "isDefault": true,
        "kcal": 784
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 280
      }
    ]
  },
  {
    "id": "sa_albaik_big_baik_spicy",
    "name": "Big Baik Spicy Sandwich",
    "nameAr": "ساندوتش بيج بيك حراق",
    "brand": "AlBaik",
    "brandId": "albaik",
    "brandCategory": "Sandwiches",
    "category": "Sandwiches",
    "cuisineTags": [
      "Sandwich",
      "Spicy",
      "AlBaik"
    ],
    "region": "SA",
    "kcal100g": 285,
    "protein100g": 14.5,
    "carb100g": 24,
    "fat100g": 14.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 4.4,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 8.7,
    "servings": [
      {
        "label": "1 Sandwich (ساندوتش حراق)",
        "grams": 280,
        "isDefault": true,
        "kcal": 798
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 285
      }
    ]
  },
  {
    "id": "sa_albaik_double_baik",
    "name": "Double Baik Chicken Burger",
    "nameAr": "دبل بيك برجر دجاج",
    "brand": "AlBaik",
    "brandId": "albaik",
    "brandCategory": "Burgers",
    "category": "Burgers",
    "cuisineTags": [
      "Burger",
      "Double",
      "AlBaik"
    ],
    "region": "SA",
    "kcal100g": 270,
    "protein100g": 15,
    "carb100g": 22,
    "fat100g": 13.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 4.1,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 8.1,
    "servings": [
      {
        "label": "1 Burger (برجر)",
        "grams": 230,
        "isDefault": true,
        "kcal": 621
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 270
      }
    ]
  },
  {
    "id": "sa_albaik_chicken_fillet_burger",
    "name": "Chicken Fillet Burger AlBaik",
    "nameAr": "برجر فيليه دجاج البيك",
    "brand": "AlBaik",
    "brandId": "albaik",
    "brandCategory": "Burgers",
    "category": "Burgers",
    "cuisineTags": [
      "Burger",
      "Fillet",
      "AlBaik"
    ],
    "region": "SA",
    "kcal100g": 258,
    "protein100g": 13.5,
    "carb100g": 25,
    "fat100g": 11.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.5,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6.9,
    "servings": [
      {
        "label": "1 Burger (برجر)",
        "grams": 190,
        "isDefault": true,
        "kcal": 490
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 258
      }
    ]
  },
  {
    "id": "sa_albaik_fish_fillet_meal",
    "name": "AlBaik 6pc Fish Fillet Meal",
    "nameAr": "وجبة فيليه سمك البيك 6 قطع",
    "brand": "AlBaik",
    "brandId": "albaik",
    "brandCategory": "Seafood",
    "category": "Seafood",
    "cuisineTags": [
      "Seafood",
      "Fish",
      "AlBaik"
    ],
    "region": "SA",
    "kcal100g": 236,
    "protein100g": 14,
    "carb100g": 18,
    "fat100g": 12,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 7.2,
    "servings": [
      {
        "label": "6pc Meal (وجبة 6 قطع)",
        "grams": 300,
        "isDefault": true,
        "kcal": 708
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 236
      }
    ]
  },
  {
    "id": "sa_albaik_fish_burger",
    "name": "AlBaik Fish Fillet Burger",
    "nameAr": "برجر سمك البيك",
    "brand": "AlBaik",
    "brandId": "albaik",
    "brandCategory": "Burgers",
    "category": "Burgers",
    "cuisineTags": [
      "Seafood",
      "Fish Burger",
      "AlBaik"
    ],
    "region": "SA",
    "kcal100g": 243,
    "protein100g": 12.5,
    "carb100g": 24.5,
    "fat100g": 10.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.2,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6.3,
    "servings": [
      {
        "label": "1 Burger (برجر)",
        "grams": 180,
        "isDefault": true,
        "kcal": 437
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 243
      }
    ]
  },
  {
    "id": "sa_albaik_jumbo_shrimp_10pc",
    "name": "AlBaik Jumbo Shrimp Meal 10pc",
    "nameAr": "وجبة جمبو روبيان البيك 10 قطع",
    "brand": "AlBaik",
    "brandId": "albaik",
    "brandCategory": "Seafood",
    "category": "Seafood",
    "cuisineTags": [
      "Seafood",
      "Shrimp",
      "AlBaik"
    ],
    "region": "SA",
    "kcal100g": 235,
    "protein100g": 15,
    "carb100g": 19,
    "fat100g": 11,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.3,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6.6,
    "servings": [
      {
        "label": "10pc Meal (وجبة 10 قطع)",
        "grams": 320,
        "isDefault": true,
        "kcal": 752
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 235
      }
    ]
  },
  {
    "id": "sa_albaik_falafel_sandwich",
    "name": "AlBaik Falafel Sandwich",
    "nameAr": "ساندوتش فلافل البيك",
    "brand": "AlBaik",
    "brandId": "albaik",
    "brandCategory": "Sandwiches",
    "category": "Sandwiches",
    "cuisineTags": [
      "Vegetarian",
      "Falafel",
      "AlBaik"
    ],
    "region": "SA",
    "kcal100g": 240,
    "protein100g": 7.5,
    "carb100g": 31,
    "fat100g": 9.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 2.9,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 5.7,
    "servings": [
      {
        "label": "1 Sandwich (ساندوتش)",
        "grams": 170,
        "isDefault": true,
        "kcal": 408
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 240
      }
    ]
  },
  {
    "id": "sa_albaik_garlic_sauce",
    "name": "Famous AlBaik Garlic Sauce",
    "nameAr": "صلصة ثوم البيك الشهيرة",
    "brand": "AlBaik",
    "brandId": "albaik",
    "brandCategory": "Sauces & Sides",
    "category": "Sauces & Sides",
    "cuisineTags": [
      "Sauce",
      "Garlic",
      "AlBaik"
    ],
    "region": "SA",
    "kcal100g": 406,
    "protein100g": 1,
    "carb100g": 6,
    "fat100g": 42,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 12.6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 25.2,
    "servings": [
      {
        "label": "1 Sauce Cup (علبة صوص)",
        "grams": 40,
        "isDefault": true,
        "kcal": 162
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 406
      }
    ]
  },
  {
    "id": "sa_albaik_fries",
    "name": "AlBaik French Fries Regular",
    "nameAr": "بطاطس مقلية البيك",
    "brand": "AlBaik",
    "brandId": "albaik",
    "brandCategory": "Sauces & Sides",
    "category": "Sauces & Sides",
    "cuisineTags": [
      "Fries",
      "Sides",
      "AlBaik"
    ],
    "region": "SA",
    "kcal100g": 292,
    "protein100g": 3.5,
    "carb100g": 38,
    "fat100g": 14,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 4.2,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 8.4,
    "servings": [
      {
        "label": "Regular Fries (بطاطس وسط)",
        "grams": 120,
        "isDefault": true,
        "kcal": 350
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 292
      }
    ]
  },
  {
    "id": "sa_albaik_ice_cream",
    "name": "AlBaik Vanilla Soft Ice Cream with Chocolate",
    "nameAr": "آيس كريم البيك فانيلا مع شوكولاتة",
    "brand": "AlBaik",
    "brandId": "albaik",
    "brandCategory": "Desserts",
    "category": "Desserts",
    "cuisineTags": [
      "Dessert",
      "Ice Cream",
      "AlBaik"
    ],
    "region": "SA",
    "kcal100g": 192,
    "protein100g": 4.2,
    "carb100g": 28,
    "fat100g": 7,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 2.1,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 4.2,
    "servings": [
      {
        "label": "1 Cup (كوب آيس كريم)",
        "grams": 130,
        "isDefault": true,
        "kcal": 250
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 192
      }
    ]
  },
  {
    "id": "sa_kudu_chicken_sandwich",
    "name": "Kudu Signature Chicken Sandwich",
    "nameAr": "ساندوتش دجاج كودو المميز",
    "brand": "Kudu",
    "brandId": "kudu",
    "brandCategory": "Sandwiches",
    "category": "Sandwiches",
    "cuisineTags": [
      "Sandwich",
      "Chicken",
      "Kudu"
    ],
    "region": "SA",
    "kcal100g": 216,
    "protein100g": 14,
    "carb100g": 22,
    "fat100g": 8,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 2.4,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 4.8,
    "servings": [
      {
        "label": "1 Sandwich (ساندوتش)",
        "grams": 240,
        "isDefault": true,
        "kcal": 518
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 216
      }
    ]
  },
  {
    "id": "sa_kudu_beef_sandwich",
    "name": "Kudu Signature Beef Sandwich",
    "nameAr": "ساندوتش لحم كودو",
    "brand": "Kudu",
    "brandId": "kudu",
    "brandCategory": "Sandwiches",
    "category": "Sandwiches",
    "cuisineTags": [
      "Sandwich",
      "Beef",
      "Kudu"
    ],
    "region": "SA",
    "kcal100g": 239,
    "protein100g": 15,
    "carb100g": 21,
    "fat100g": 10.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.2,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6.3,
    "servings": [
      {
        "label": "1 Sandwich (ساندوتش لحم)",
        "grams": 240,
        "isDefault": true,
        "kcal": 574
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 239
      }
    ]
  },
  {
    "id": "sa_kudu_philly_steak",
    "name": "Kudu Philly Cheese Steak",
    "nameAr": "فيلي تشيز ستيك كودو",
    "brand": "Kudu",
    "brandId": "kudu",
    "brandCategory": "Sandwiches",
    "category": "Sandwiches",
    "cuisineTags": [
      "Sandwich",
      "Steak",
      "Cheese",
      "Kudu"
    ],
    "region": "SA",
    "kcal100g": 252,
    "protein100g": 16,
    "carb100g": 20,
    "fat100g": 12,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 7.2,
    "servings": [
      {
        "label": "1 Sandwich (ساندوتش ستيك)",
        "grams": 260,
        "isDefault": true,
        "kcal": 655
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 252
      }
    ]
  },
  {
    "id": "sa_kudu_club_sandwich",
    "name": "Kudu Club Sandwich Combo",
    "nameAr": "كلوب ساندوتش كودو",
    "brand": "Kudu",
    "brandId": "kudu",
    "brandCategory": "Sandwiches",
    "category": "Sandwiches",
    "cuisineTags": [
      "Club Sandwich",
      "Kudu"
    ],
    "region": "SA",
    "kcal100g": 241,
    "protein100g": 12.5,
    "carb100g": 23,
    "fat100g": 11,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.3,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6.6,
    "servings": [
      {
        "label": "1 Club Sandwich (كلوب)",
        "grams": 280,
        "isDefault": true,
        "kcal": 675
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 241
      }
    ]
  },
  {
    "id": "sa_kudu_spicy_chicken",
    "name": "Kudu Spicy Chicken Sandwich",
    "nameAr": "ساندوتش دجاج حار كودو",
    "brand": "Kudu",
    "brandId": "kudu",
    "brandCategory": "Sandwiches",
    "category": "Sandwiches",
    "cuisineTags": [
      "Sandwich",
      "Spicy",
      "Kudu"
    ],
    "region": "SA",
    "kcal100g": 223,
    "protein100g": 14,
    "carb100g": 22.5,
    "fat100g": 8.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 2.6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 5.1,
    "servings": [
      {
        "label": "1 Sandwich (ساندوتش حار)",
        "grams": 240,
        "isDefault": true,
        "kcal": 535
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 223
      }
    ]
  },
  {
    "id": "sa_kudu_classic_burger",
    "name": "Kudu Classic Beef Burger",
    "nameAr": "برجر كودو كلاسيك لحم",
    "brand": "Kudu",
    "brandId": "kudu",
    "brandCategory": "Burgers",
    "category": "Burgers",
    "cuisineTags": [
      "Burger",
      "Beef",
      "Kudu"
    ],
    "region": "SA",
    "kcal100g": 258,
    "protein100g": 13.5,
    "carb100g": 24,
    "fat100g": 12,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 7.2,
    "servings": [
      {
        "label": "1 Burger (برجر)",
        "grams": 210,
        "isDefault": true,
        "kcal": 542
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 258
      }
    ]
  },
  {
    "id": "sa_kudu_crispy_tenders",
    "name": "Kudu Crispy Chicken Tenders 4pc",
    "nameAr": "تندرز دجاج مقرمش كودو 4 قطع",
    "brand": "Kudu",
    "brandId": "kudu",
    "brandCategory": "Chicken Meals",
    "category": "Chicken Meals",
    "cuisineTags": [
      "Chicken",
      "Tenders",
      "Kudu"
    ],
    "region": "SA",
    "kcal100g": 238,
    "protein100g": 17.5,
    "carb100g": 16,
    "fat100g": 11.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.5,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6.9,
    "servings": [
      {
        "label": "4pc Tenders (4 قطع تندر)",
        "grams": 180,
        "isDefault": true,
        "kcal": 428
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 238
      }
    ]
  },
  {
    "id": "sa_kudu_grilled_chicken_rice",
    "name": "Kudu Grilled Chicken Rice Platter",
    "nameAr": "وجبة دجاج مشوي مع أرز كودو",
    "brand": "Kudu",
    "brandId": "kudu",
    "brandCategory": "Platters & Meals",
    "category": "Platters & Meals",
    "cuisineTags": [
      "Platter",
      "Healthy",
      "Kudu"
    ],
    "region": "SA",
    "kcal100g": 188,
    "protein100g": 13.5,
    "carb100g": 21,
    "fat100g": 5.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 1.7,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 3.3,
    "servings": [
      {
        "label": "1 Rice Platter (وجبة أرز مع دجاج)",
        "grams": 350,
        "isDefault": true,
        "kcal": 658
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 188
      }
    ]
  },
  {
    "id": "sa_kudu_breakfast_platter",
    "name": "Kudu Breakfast Platter with Sausage & Eggs",
    "nameAr": "وجبة إفطار كودو المشكلة",
    "brand": "Kudu",
    "brandId": "kudu",
    "brandCategory": "Breakfast",
    "category": "Breakfast",
    "cuisineTags": [
      "Breakfast",
      "Eggs",
      "Kudu"
    ],
    "region": "SA",
    "kcal100g": 235,
    "protein100g": 11.5,
    "carb100g": 18,
    "fat100g": 13,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.9,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 7.8,
    "servings": [
      {
        "label": "1 Breakfast Platter (وجبة إفطار كاملة)",
        "grams": 300,
        "isDefault": true,
        "kcal": 705
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 235
      }
    ]
  },
  {
    "id": "sa_kudu_omelette_roll",
    "name": "Kudu Omelette Roll Sandwich",
    "nameAr": "رول أومليت كودو للإفطار",
    "brand": "Kudu",
    "brandId": "kudu",
    "brandCategory": "Breakfast",
    "category": "Breakfast",
    "cuisineTags": [
      "Breakfast",
      "Eggs",
      "Kudu"
    ],
    "region": "SA",
    "kcal100g": 212,
    "protein100g": 10.5,
    "carb100g": 21,
    "fat100g": 9.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 2.9,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 5.7,
    "servings": [
      {
        "label": "1 Roll (رول أومليت)",
        "grams": 170,
        "isDefault": true,
        "kcal": 360
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 212
      }
    ]
  },
  {
    "id": "sa_kudu_hashbrown",
    "name": "Kudu Golden Hash Browns",
    "nameAr": "هاش براون كودو الذهبي",
    "brand": "Kudu",
    "brandId": "kudu",
    "brandCategory": "Breakfast",
    "category": "Breakfast",
    "cuisineTags": [
      "Sides",
      "Breakfast",
      "Kudu"
    ],
    "region": "SA",
    "kcal100g": 243,
    "protein100g": 2.2,
    "carb100g": 27,
    "fat100g": 14,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 4.2,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 8.4,
    "servings": [
      {
        "label": "1 Piece (قطعة هاش براون)",
        "grams": 80,
        "isDefault": true,
        "kcal": 194
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 243
      }
    ]
  },
  {
    "id": "sa_kudu_fries",
    "name": "Kudu French Fries Medium",
    "nameAr": "بطاطس كودو مقلية وسط",
    "brand": "Kudu",
    "brandId": "kudu",
    "brandCategory": "Sides",
    "category": "Sides",
    "cuisineTags": [
      "Sides",
      "Fries",
      "Kudu"
    ],
    "region": "SA",
    "kcal100g": 282,
    "protein100g": 3.2,
    "carb100g": 37,
    "fat100g": 13.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 4.1,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 8.1,
    "servings": [
      {
        "label": "Medium Fries (بطاطس وسط)",
        "grams": 130,
        "isDefault": true,
        "kcal": 367
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 282
      }
    ]
  },
  {
    "id": "sa_kudu_strawberry_cheesecake",
    "name": "Kudu Strawberry Cheesecake",
    "nameAr": "تشيز كيك الفراولة كودو",
    "brand": "Kudu",
    "brandId": "kudu",
    "brandCategory": "Desserts",
    "category": "Desserts",
    "cuisineTags": [
      "Dessert",
      "Cheesecake",
      "Kudu"
    ],
    "region": "SA",
    "kcal100g": 294,
    "protein100g": 5.5,
    "carb100g": 32,
    "fat100g": 16,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 4.8,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 9.6,
    "servings": [
      {
        "label": "1 Slice (شريحة تشيز كيك)",
        "grams": 110,
        "isDefault": true,
        "kcal": 323
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 294
      }
    ]
  },
  {
    "id": "sa_kudu_cookie",
    "name": "Kudu Chocolate Chip Cookie",
    "nameAr": "كوكيز الشوكولاتة كودو",
    "brand": "Kudu",
    "brandId": "kudu",
    "brandCategory": "Desserts",
    "category": "Desserts",
    "cuisineTags": [
      "Dessert",
      "Cookie",
      "Kudu"
    ],
    "region": "SA",
    "kcal100g": 441,
    "protein100g": 5,
    "carb100g": 58,
    "fat100g": 21,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 6.3,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 12.6,
    "servings": [
      {
        "label": "1 Cookie (قطعة كوكيز)",
        "grams": 60,
        "isDefault": true,
        "kcal": 265
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 441
      }
    ]
  },
  {
    "id": "sa_tazaj_farrouj_meal",
    "name": "Al Tazaj Half Charcoal Grilled Farrouj Meal",
    "nameAr": "نصف فروج طازج مشوي على الفحم",
    "brand": "Al Tazaj",
    "brandId": "al_tazaj",
    "brandCategory": "Farrouj Grills",
    "category": "Farrouj Grills",
    "cuisineTags": [
      "Grilled",
      "Chicken",
      "Farrouj",
      "Al Tazaj"
    ],
    "region": "SA",
    "kcal100g": 180,
    "protein100g": 21.5,
    "carb100g": 1,
    "fat100g": 10,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6,
    "servings": [
      {
        "label": "Half Farrouj (نصف فروج مشوي)",
        "grams": 280,
        "isDefault": true,
        "kcal": 504
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 180
      }
    ]
  },
  {
    "id": "sa_tazaj_farrouj_whole",
    "name": "Al Tazaj Whole Charcoal Grilled Farrouj",
    "nameAr": "فروج كامل طازج مشوي على الفحم",
    "brand": "Al Tazaj",
    "brandId": "al_tazaj",
    "brandCategory": "Farrouj Grills",
    "category": "Farrouj Grills",
    "cuisineTags": [
      "Grilled",
      "Chicken",
      "Farrouj",
      "Al Tazaj"
    ],
    "region": "SA",
    "kcal100g": 180,
    "protein100g": 21.5,
    "carb100g": 1,
    "fat100g": 10,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6,
    "servings": [
      {
        "label": "Whole Farrouj (فروج كامل)",
        "grams": 560,
        "isDefault": true,
        "kcal": 1008
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 180
      }
    ]
  },
  {
    "id": "sa_tazaj_farrouj_bbq",
    "name": "Al Tazaj BBQ Farrouj Half",
    "nameAr": "نصف فروج باربيكيو الطازج",
    "brand": "Al Tazaj",
    "brandId": "al_tazaj",
    "brandCategory": "Farrouj Grills",
    "category": "Farrouj Grills",
    "cuisineTags": [
      "Grilled",
      "BBQ",
      "Al Tazaj"
    ],
    "region": "SA",
    "kcal100g": 190,
    "protein100g": 20,
    "carb100g": 6,
    "fat100g": 9.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 2.9,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 5.7,
    "servings": [
      {
        "label": "Half BBQ Farrouj (نصف فروج باربيكيو)",
        "grams": 290,
        "isDefault": true,
        "kcal": 551
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 190
      }
    ]
  },
  {
    "id": "sa_tazaj_farrouj_spicy",
    "name": "Al Tazaj Spicy Charcoal Farrouj Half",
    "nameAr": "نصف فروج حار على الفحم الطازج",
    "brand": "Al Tazaj",
    "brandId": "al_tazaj",
    "brandCategory": "Farrouj Grills",
    "category": "Farrouj Grills",
    "cuisineTags": [
      "Grilled",
      "Spicy",
      "Al Tazaj"
    ],
    "region": "SA",
    "kcal100g": 185,
    "protein100g": 21,
    "carb100g": 1.5,
    "fat100g": 10.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.2,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6.3,
    "servings": [
      {
        "label": "Half Spicy Farrouj (نصف فروج حار)",
        "grams": 285,
        "isDefault": true,
        "kcal": 527
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 185
      }
    ]
  },
  {
    "id": "sa_tazaj_kabsa_plate",
    "name": "Al Tazaj Kabsa Rice Plate with Chicken",
    "nameAr": "كبسة الطازج مع دجاج مشوي",
    "brand": "Al Tazaj",
    "brandId": "al_tazaj",
    "brandCategory": "Traditional Rice",
    "category": "Traditional Rice",
    "cuisineTags": [
      "Kabsa",
      "Rice",
      "Al Tazaj"
    ],
    "region": "SA",
    "kcal100g": 199,
    "protein100g": 12,
    "carb100g": 23,
    "fat100g": 6.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 2,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 3.9,
    "servings": [
      {
        "label": "1 Meal Plate (وجبة كبسة مع دجاج)",
        "grams": 420,
        "isDefault": true,
        "kcal": 836
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 199
      }
    ]
  },
  {
    "id": "sa_tazaj_mandi_plate",
    "name": "Al Tazaj Mandi Rice Plate with Chicken",
    "nameAr": "مندي الطازج مع دجاج مبخر",
    "brand": "Al Tazaj",
    "brandId": "al_tazaj",
    "brandCategory": "Traditional Rice",
    "category": "Traditional Rice",
    "cuisineTags": [
      "Mandi",
      "Rice",
      "Al Tazaj"
    ],
    "region": "SA",
    "kcal100g": 199,
    "protein100g": 11.5,
    "carb100g": 22.5,
    "fat100g": 7,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 2.1,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 4.2,
    "servings": [
      {
        "label": "1 Meal Plate (وجبة مندي مع دجاج)",
        "grams": 420,
        "isDefault": true,
        "kcal": 836
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 199
      }
    ]
  },
  {
    "id": "sa_tazaj_chicken_kebab",
    "name": "Al Tazaj Chicken Kebab Meal 3 Skewers",
    "nameAr": "كباب دجاج الطازج 3 أسياخ",
    "brand": "Al Tazaj",
    "brandId": "al_tazaj",
    "brandCategory": "Grills",
    "category": "Grills",
    "cuisineTags": [
      "Kebab",
      "Grills",
      "Al Tazaj"
    ],
    "region": "SA",
    "kcal100g": 185,
    "protein100g": 18,
    "carb100g": 3.5,
    "fat100g": 11,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.3,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6.6,
    "servings": [
      {
        "label": "3 Skewers with Bread (3 أسياخ كباب)",
        "grams": 260,
        "isDefault": true,
        "kcal": 481
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 185
      }
    ]
  },
  {
    "id": "sa_tazaj_farrouj_roll",
    "name": "Al Tazaj Farrouj Roll Sandwich",
    "nameAr": "ساندوتش رول فروج الطازج",
    "brand": "Al Tazaj",
    "brandId": "al_tazaj",
    "brandCategory": "Sandwiches",
    "category": "Sandwiches",
    "cuisineTags": [
      "Sandwich",
      "Al Tazaj"
    ],
    "region": "SA",
    "kcal100g": 221,
    "protein100g": 15,
    "carb100g": 21,
    "fat100g": 8.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 2.6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 5.1,
    "servings": [
      {
        "label": "1 Roll (ساندوتش رول)",
        "grams": 200,
        "isDefault": true,
        "kcal": 442
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 221
      }
    ]
  },
  {
    "id": "sa_tazaj_burger",
    "name": "Al Tazaj Gourmet Farrouj Burger",
    "nameAr": "برجر فروج الطازج",
    "brand": "Al Tazaj",
    "brandId": "al_tazaj",
    "brandCategory": "Burgers",
    "category": "Burgers",
    "cuisineTags": [
      "Burger",
      "Al Tazaj"
    ],
    "region": "SA",
    "kcal100g": 234,
    "protein100g": 14,
    "carb100g": 23,
    "fat100g": 9.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 2.9,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 5.7,
    "servings": [
      {
        "label": "1 Burger (برجر)",
        "grams": 210,
        "isDefault": true,
        "kcal": 491
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 234
      }
    ]
  },
  {
    "id": "sa_tazaj_crispy_strips",
    "name": "Al Tazaj Crunchy Chicken Strips 5pc",
    "nameAr": "ستربس دجاج مقرمش الطازج 5 قطع",
    "brand": "Al Tazaj",
    "brandId": "al_tazaj",
    "brandCategory": "Chicken Meals",
    "category": "Chicken Meals",
    "cuisineTags": [
      "Strips",
      "Chicken",
      "Al Tazaj"
    ],
    "region": "SA",
    "kcal100g": 229,
    "protein100g": 18.5,
    "carb100g": 15,
    "fat100g": 10.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.2,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6.3,
    "servings": [
      {
        "label": "5pc Strips (5 قطع ستربس)",
        "grams": 210,
        "isDefault": true,
        "kcal": 481
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 229
      }
    ]
  },
  {
    "id": "sa_tazaj_tahina",
    "name": "Al Tazaj Tahina Sesame Dip",
    "nameAr": "صوص طحينة الطازج الأصلية",
    "brand": "Al Tazaj",
    "brandId": "al_tazaj",
    "brandCategory": "Sauces & Sides",
    "category": "Sauces & Sides",
    "cuisineTags": [
      "Sauce",
      "Tahina",
      "Al Tazaj"
    ],
    "region": "SA",
    "kcal100g": 312,
    "protein100g": 6,
    "carb100g": 9,
    "fat100g": 28,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 8.4,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 16.8,
    "servings": [
      {
        "label": "1 Tahina Cup (علبة طحينة)",
        "grams": 50,
        "isDefault": true,
        "kcal": 156
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 312
      }
    ]
  },
  {
    "id": "sa_tazaj_garlic_dip",
    "name": "Al Tazaj Garlic Sauce Dip",
    "nameAr": "ثومية الطازج",
    "brand": "Al Tazaj",
    "brandId": "al_tazaj",
    "brandCategory": "Sauces & Sides",
    "category": "Sauces & Sides",
    "cuisineTags": [
      "Sauce",
      "Garlic",
      "Al Tazaj"
    ],
    "region": "SA",
    "kcal100g": 375,
    "protein100g": 1.2,
    "carb100g": 7,
    "fat100g": 38,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 11.4,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 22.8,
    "servings": [
      {
        "label": "1 Garlic Cup (علبة ثوم)",
        "grams": 50,
        "isDefault": true,
        "kcal": 188
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 375
      }
    ]
  },
  {
    "id": "sa_tazaj_salad",
    "name": "Al Tazaj Fresh Green Salad",
    "nameAr": "سلطة خضراء طازجة الطازج",
    "brand": "Al Tazaj",
    "brandId": "al_tazaj",
    "brandCategory": "Salads & Sides",
    "category": "Salads & Sides",
    "cuisineTags": [
      "Salad",
      "Healthy",
      "Al Tazaj"
    ],
    "region": "SA",
    "kcal100g": 26,
    "protein100g": 1.2,
    "carb100g": 4.5,
    "fat100g": 0.3,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 0.1,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 0.2,
    "servings": [
      {
        "label": "1 Salad Bowl (صحن سلطة)",
        "grams": 150,
        "isDefault": true,
        "kcal": 39
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 26
      }
    ]
  },
  {
    "id": "sa_tazaj_basbousa",
    "name": "Al Tazaj Traditional Basbousa",
    "nameAr": "بسبوسة الطازج الشهيرة",
    "brand": "Al Tazaj",
    "brandId": "al_tazaj",
    "brandCategory": "Desserts",
    "category": "Desserts",
    "cuisineTags": [
      "Dessert",
      "Basbousa",
      "Al Tazaj"
    ],
    "region": "SA",
    "kcal100g": 336,
    "protein100g": 4.5,
    "carb100g": 48,
    "fat100g": 14,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 4.2,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 8.4,
    "servings": [
      {
        "label": "1 Piece (قطعة بسبوسة)",
        "grams": 100,
        "isDefault": true,
        "kcal": 336
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 336
      }
    ]
  },
  {
    "id": "sa_shawarmer_arabo",
    "name": "Shawarmer Arabo Box Chicken 6 Cuts",
    "nameAr": "بوكس عربو دجاج 6 قطع مع بطاطس وثوم",
    "brand": "Shawarmer",
    "brandId": "shawarmer",
    "brandCategory": "Arabo Boxes",
    "category": "Arabo Boxes",
    "cuisineTags": [
      "Shawarma",
      "Arabo",
      "Shawarmer"
    ],
    "region": "SA",
    "kcal100g": 258,
    "protein100g": 13.5,
    "carb100g": 24,
    "fat100g": 12,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 7.2,
    "servings": [
      {
        "label": "1 Arabo Box (بوكس عربو)",
        "grams": 350,
        "isDefault": true,
        "kcal": 903
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 258
      }
    ]
  },
  {
    "id": "sa_shawarmer_arabo_beef",
    "name": "Shawarmer Arabo Box Beef 6 Cuts",
    "nameAr": "بوكس عربو لحم مع بطاطس وطحينة",
    "brand": "Shawarmer",
    "brandId": "shawarmer",
    "brandCategory": "Arabo Boxes",
    "category": "Arabo Boxes",
    "cuisineTags": [
      "Shawarma",
      "Arabo",
      "Beef",
      "Shawarmer"
    ],
    "region": "SA",
    "kcal100g": 270,
    "protein100g": 14.5,
    "carb100g": 22.5,
    "fat100g": 13.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 4.1,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 8.1,
    "servings": [
      {
        "label": "1 Arabo Box (بوكس عربو لحم)",
        "grams": 350,
        "isDefault": true,
        "kcal": 945
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 270
      }
    ]
  },
  {
    "id": "sa_shawarmer_dilmah_wrap",
    "name": "Shawarmer Dilmah Chicken Saj Wrap",
    "nameAr": "شاورما دلمح دجاج خبز صاج",
    "brand": "Shawarmer",
    "brandId": "shawarmer",
    "brandCategory": "Wraps",
    "category": "Wraps",
    "cuisineTags": [
      "Shawarma",
      "Wrap",
      "Shawarmer"
    ],
    "region": "SA",
    "kcal100g": 243,
    "protein100g": 14,
    "carb100g": 22,
    "fat100g": 11,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.3,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6.6,
    "servings": [
      {
        "label": "1 Wrap (ساندوتش دلمح)",
        "grams": 200,
        "isDefault": true,
        "kcal": 486
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 243
      }
    ]
  },
  {
    "id": "sa_shawarmer_shakshukha",
    "name": "Shawarmer Shakshukha Spicy Chicken",
    "nameAr": "شاورما شكشوخة حارة",
    "brand": "Shawarmer",
    "brandId": "shawarmer",
    "brandCategory": "Wraps",
    "category": "Wraps",
    "cuisineTags": [
      "Shawarma",
      "Spicy",
      "Shawarmer"
    ],
    "region": "SA",
    "kcal100g": 250,
    "protein100g": 13.5,
    "carb100g": 23,
    "fat100g": 11.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.5,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6.9,
    "servings": [
      {
        "label": "1 Wrap (ساندوتش شكشوخة)",
        "grams": 210,
        "isDefault": true,
        "kcal": 525
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 250
      }
    ]
  },
  {
    "id": "sa_shawarmer_abu_rabee3",
    "name": "Shawarmer Abu Rabee3 Classic Wrap",
    "nameAr": "شاورما أبو ربيع كلاسيك",
    "brand": "Shawarmer",
    "brandId": "shawarmer",
    "brandCategory": "Wraps",
    "category": "Wraps",
    "cuisineTags": [
      "Shawarma",
      "Classic",
      "Shawarmer"
    ],
    "region": "SA",
    "kcal100g": 243,
    "protein100g": 13,
    "carb100g": 24,
    "fat100g": 10.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.2,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6.3,
    "servings": [
      {
        "label": "1 Wrap (ساندوتش أبو ربيع)",
        "grams": 190,
        "isDefault": true,
        "kcal": 462
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 243
      }
    ]
  },
  {
    "id": "sa_shawarmer_shatha",
    "name": "Shawarmer Shat'ha Extreme Spicy Wrap",
    "nameAr": "شاورما شطحة نارية حارة",
    "brand": "Shawarmer",
    "brandId": "shawarmer",
    "brandCategory": "Wraps",
    "category": "Wraps",
    "cuisineTags": [
      "Shawarma",
      "Extra Spicy",
      "Shawarmer"
    ],
    "region": "SA",
    "kcal100g": 245,
    "protein100g": 13,
    "carb100g": 23.5,
    "fat100g": 11,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.3,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6.6,
    "servings": [
      {
        "label": "1 Wrap (ساندوتش شطحة)",
        "grams": 200,
        "isDefault": true,
        "kcal": 490
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 245
      }
    ]
  },
  {
    "id": "sa_shawarmer_batata_harra",
    "name": "Shawarmer Batata Harra Spicy Cubes",
    "nameAr": "بطاطا حرة شاورمر المقرمشة",
    "brand": "Shawarmer",
    "brandId": "shawarmer",
    "brandCategory": "Sides",
    "category": "Sides",
    "cuisineTags": [
      "Sides",
      "Spicy",
      "Shawarmer"
    ],
    "region": "SA",
    "kcal100g": 222,
    "protein100g": 2.8,
    "carb100g": 28,
    "fat100g": 11,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.3,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6.6,
    "servings": [
      {
        "label": "1 Cup (كوب بطاطا حرة)",
        "grams": 160,
        "isDefault": true,
        "kcal": 355
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 222
      }
    ]
  },
  {
    "id": "sa_shawarmer_seasoned_fries",
    "name": "Shawarmer Seasoned Fries",
    "nameAr": "بطاطس شاورمر المتبلة",
    "brand": "Shawarmer",
    "brandId": "shawarmer",
    "brandCategory": "Sides",
    "category": "Sides",
    "cuisineTags": [
      "Sides",
      "Fries",
      "Shawarmer"
    ],
    "region": "SA",
    "kcal100g": 274,
    "protein100g": 3.2,
    "carb100g": 36,
    "fat100g": 13,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.9,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 7.8,
    "servings": [
      {
        "label": "1 Box Fries (بطاطس)",
        "grams": 130,
        "isDefault": true,
        "kcal": 356
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 274
      }
    ]
  },
  {
    "id": "sa_shawarmer_sweet_potato",
    "name": "Shawarmer Sweet Potato Fries",
    "nameAr": "بطاطس حلوة مقلية شاورمر",
    "brand": "Shawarmer",
    "brandId": "shawarmer",
    "brandCategory": "Sides",
    "category": "Sides",
    "cuisineTags": [
      "Sides",
      "Sweet Potato",
      "Shawarmer"
    ],
    "region": "SA",
    "kcal100g": 226,
    "protein100g": 2.1,
    "carb100g": 32,
    "fat100g": 10,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6,
    "servings": [
      {
        "label": "1 Box (بطاطس حلوة)",
        "grams": 130,
        "isDefault": true,
        "kcal": 294
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 226
      }
    ]
  },
  {
    "id": "sa_shawarmer_thoomia",
    "name": "Shawarmer Original Thoomia Dip",
    "nameAr": "ثومية شاورمر الأصلية",
    "brand": "Shawarmer",
    "brandId": "shawarmer",
    "brandCategory": "Sauces",
    "category": "Sauces",
    "cuisineTags": [
      "Sauce",
      "Garlic",
      "Shawarmer"
    ],
    "region": "SA",
    "kcal100g": 401,
    "protein100g": 1,
    "carb100g": 7,
    "fat100g": 41,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 12.3,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 24.6,
    "servings": [
      {
        "label": "1 Dip Cup (علبة ثومية)",
        "grams": 45,
        "isDefault": true,
        "kcal": 180
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 401
      }
    ]
  },
  {
    "id": "sa_shawarmer_gathering_box",
    "name": "Shawarmer Gathering Box 12 Cuts",
    "nameAr": "بوكس اللمة شاورمر 12 قطعة",
    "brand": "Shawarmer",
    "brandId": "shawarmer",
    "brandCategory": "Gathering Boxes",
    "category": "Gathering Boxes",
    "cuisineTags": [
      "Gathering Box",
      "Shawarma",
      "Shawarmer"
    ],
    "region": "SA",
    "kcal100g": 258,
    "protein100g": 13.5,
    "carb100g": 24,
    "fat100g": 12,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 7.2,
    "servings": [
      {
        "label": "Gathering Box for 3-4 (بوكس اللمة العائلي)",
        "grams": 750,
        "isDefault": true,
        "kcal": 1935
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 258
      }
    ]
  },
  {
    "id": "sa_shawarmer_kunafa_bites",
    "name": "Shawarmer Kunafa Bites",
    "nameAr": "حلا أصابع كنافة شاورمر",
    "brand": "Shawarmer",
    "brandId": "shawarmer",
    "brandCategory": "Desserts",
    "category": "Desserts",
    "cuisineTags": [
      "Dessert",
      "Kunafa",
      "Shawarmer"
    ],
    "region": "SA",
    "kcal100g": 344,
    "protein100g": 5,
    "carb100g": 45,
    "fat100g": 16,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 4.8,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 9.6,
    "servings": [
      {
        "label": "4 Bites (4 أصابع كنافة)",
        "grams": 90,
        "isDefault": true,
        "kcal": 310
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 344
      }
    ]
  },
  {
    "id": "sa_herfy_super_beef",
    "name": "Super Herfy Beef Burger",
    "nameAr": "سوبر هرفي لحم",
    "brand": "Herfy",
    "brandId": "herfy",
    "brandCategory": "Beef Burgers",
    "category": "Beef Burgers",
    "cuisineTags": [
      "Burger",
      "Beef",
      "Herfy"
    ],
    "region": "SA",
    "kcal100g": 266,
    "protein100g": 13,
    "carb100g": 23,
    "fat100g": 13.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 4.1,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 8.1,
    "servings": [
      {
        "label": "1 Burger (برجر سوبر هرفي)",
        "grams": 230,
        "isDefault": true,
        "kcal": 612
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 266
      }
    ]
  },
  {
    "id": "sa_herfy_double_beef",
    "name": "Double Herfy Beef Burger",
    "nameAr": "دبل هرفي لحم كبير",
    "brand": "Herfy",
    "brandId": "herfy",
    "brandCategory": "Beef Burgers",
    "category": "Beef Burgers",
    "cuisineTags": [
      "Burger",
      "Double Beef",
      "Herfy"
    ],
    "region": "SA",
    "kcal100g": 290,
    "protein100g": 15.5,
    "carb100g": 21,
    "fat100g": 16,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 4.8,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 9.6,
    "servings": [
      {
        "label": "1 Double Burger (دبل برجر)",
        "grams": 270,
        "isDefault": true,
        "kcal": 783
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 290
      }
    ]
  },
  {
    "id": "sa_herfy_super_chicken",
    "name": "Super Chicken Fillet Burger Herfy",
    "nameAr": "سوبر تشيكن فيليه هرفي",
    "brand": "Herfy",
    "brandId": "herfy",
    "brandCategory": "Chicken Burgers",
    "category": "Chicken Burgers",
    "cuisineTags": [
      "Burger",
      "Chicken",
      "Herfy"
    ],
    "region": "SA",
    "kcal100g": 260,
    "protein100g": 13.5,
    "carb100g": 24.5,
    "fat100g": 12,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 7.2,
    "servings": [
      {
        "label": "1 Burger (برجر سوبر تشيكن)",
        "grams": 220,
        "isDefault": true,
        "kcal": 572
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 260
      }
    ]
  },
  {
    "id": "sa_herfy_classic_cheeseburger",
    "name": "Herfy Classic Cheeseburger",
    "nameAr": "تشيز برجر كلاسيك هرفي",
    "brand": "Herfy",
    "brandId": "herfy",
    "brandCategory": "Beef Burgers",
    "category": "Beef Burgers",
    "cuisineTags": [
      "Burger",
      "Cheese",
      "Herfy"
    ],
    "region": "SA",
    "kcal100g": 250,
    "protein100g": 12.5,
    "carb100g": 24,
    "fat100g": 11.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.5,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6.9,
    "servings": [
      {
        "label": "1 Cheeseburger (تشيز برجر)",
        "grams": 160,
        "isDefault": true,
        "kcal": 400
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 250
      }
    ]
  },
  {
    "id": "sa_herfy_big_herfy",
    "name": "Big Herfy Quad Burger",
    "nameAr": "بيج هرفي الضخم 4 طبقات",
    "brand": "Herfy",
    "brandId": "herfy",
    "brandCategory": "Beef Burgers",
    "category": "Beef Burgers",
    "cuisineTags": [
      "Burger",
      "Quad Beef",
      "Herfy"
    ],
    "region": "SA",
    "kcal100g": 295,
    "protein100g": 16,
    "carb100g": 19.5,
    "fat100g": 17,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 5.1,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 10.2,
    "servings": [
      {
        "label": "1 Big Herfy Burger (بيج هرفي)",
        "grams": 310,
        "isDefault": true,
        "kcal": 915
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 295
      }
    ]
  },
  {
    "id": "sa_herfy_tortilla_chicken",
    "name": "Herfy Chicken Tortilla Wrap",
    "nameAr": "تورتيلا دجاج هرفي",
    "brand": "Herfy",
    "brandId": "herfy",
    "brandCategory": "Wraps",
    "category": "Wraps",
    "cuisineTags": [
      "Wrap",
      "Tortilla",
      "Herfy"
    ],
    "region": "SA",
    "kcal100g": 238,
    "protein100g": 12,
    "carb100g": 26,
    "fat100g": 9.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 2.9,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 5.7,
    "servings": [
      {
        "label": "1 Tortilla (تورتيلا دجاج)",
        "grams": 210,
        "isDefault": true,
        "kcal": 500
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 238
      }
    ]
  },
  {
    "id": "sa_herfy_fish_fillet",
    "name": "Herfy Crispy Fish Fillet Sandwich",
    "nameAr": "ساندوتش فيليه سمك هرفي",
    "brand": "Herfy",
    "brandId": "herfy",
    "brandCategory": "Fish Sandwiches",
    "category": "Fish Sandwiches",
    "cuisineTags": [
      "Fish",
      "Seafood",
      "Herfy"
    ],
    "region": "SA",
    "kcal100g": 245,
    "protein100g": 11.5,
    "carb100g": 26,
    "fat100g": 10.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.2,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6.3,
    "servings": [
      {
        "label": "1 Sandwich (ساندوتش سمك)",
        "grams": 190,
        "isDefault": true,
        "kcal": 466
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 245
      }
    ]
  },
  {
    "id": "sa_herfy_tenders_4pc",
    "name": "Herfy Chicken Tenders 4pc",
    "nameAr": "تندرز دجاج هرفي 4 قطع",
    "brand": "Herfy",
    "brandId": "herfy",
    "brandCategory": "Chicken Meals",
    "category": "Chicken Meals",
    "cuisineTags": [
      "Chicken",
      "Tenders",
      "Herfy"
    ],
    "region": "SA",
    "kcal100g": 231,
    "protein100g": 18,
    "carb100g": 15,
    "fat100g": 11,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.3,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6.6,
    "servings": [
      {
        "label": "4pc Tenders (4 قطع تندر)",
        "grams": 170,
        "isDefault": true,
        "kcal": 393
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 231
      }
    ]
  },
  {
    "id": "sa_herfy_curly_fries",
    "name": "Herfy Curly French Fries",
    "nameAr": "بطاطس حلزونية مقرمشة هرفي",
    "brand": "Herfy",
    "brandId": "herfy",
    "brandCategory": "Sides",
    "category": "Sides",
    "cuisineTags": [
      "Sides",
      "Fries",
      "Herfy"
    ],
    "region": "SA",
    "kcal100g": 286,
    "protein100g": 3,
    "carb100g": 37,
    "fat100g": 14,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 4.2,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 8.4,
    "servings": [
      {
        "label": "1 Box Curly Fries (بطاطس حلزونية)",
        "grams": 130,
        "isDefault": true,
        "kcal": 372
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 286
      }
    ]
  },
  {
    "id": "sa_herfy_onion_rings",
    "name": "Herfy Crispy Onion Rings",
    "nameAr": "حلقات بصل مقرمشة هرفي",
    "brand": "Herfy",
    "brandId": "herfy",
    "brandCategory": "Sides",
    "category": "Sides",
    "cuisineTags": [
      "Sides",
      "Onion Rings",
      "Herfy"
    ],
    "region": "SA",
    "kcal100g": 276,
    "protein100g": 3.5,
    "carb100g": 35,
    "fat100g": 13.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 4.1,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 8.1,
    "servings": [
      {
        "label": "6pc Rings (6 حلقات بصل)",
        "grams": 110,
        "isDefault": true,
        "kcal": 304
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 276
      }
    ]
  },
  {
    "id": "sa_herfy_ice_cream_cone",
    "name": "Herfy Vanilla Soft Ice Cream Cone",
    "nameAr": "آيس كريم هرفي فانيلا بسكويت",
    "brand": "Herfy",
    "brandId": "herfy",
    "brandCategory": "Desserts",
    "category": "Desserts",
    "cuisineTags": [
      "Dessert",
      "Ice Cream",
      "Herfy"
    ],
    "region": "SA",
    "kcal100g": 172,
    "protein100g": 3.5,
    "carb100g": 27,
    "fat100g": 5.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 1.7,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 3.3,
    "servings": [
      {
        "label": "1 Cone (بسكويت آيس كريم)",
        "grams": 100,
        "isDefault": true,
        "kcal": 172
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 172
      }
    ]
  },
  {
    "id": "sa_herfy_strawberry_milkshake",
    "name": "Herfy Strawberry Milkshake",
    "nameAr": "ميلك شيك فراولة هرفي",
    "brand": "Herfy",
    "brandId": "herfy",
    "brandCategory": "Beverages",
    "category": "Beverages",
    "cuisineTags": [
      "Beverage",
      "Milkshake",
      "Herfy"
    ],
    "region": "SA",
    "kcal100g": 156,
    "protein100g": 3.8,
    "carb100g": 25,
    "fat100g": 4.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 1.3,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 2.7,
    "servings": [
      {
        "label": "1 Cup (كوب ميلك شيك)",
        "grams": 280,
        "isDefault": true,
        "kcal": 437
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 156
      }
    ]
  },
  {
    "id": "sa_romansiah_mandi_chicken",
    "name": "Al Romansiah Mandi Chicken Half Portion",
    "nameAr": "نصف حبة مندي دجاج الرومانسية مع أرز",
    "brand": "Al Romansiah",
    "brandId": "al_romansiah",
    "brandCategory": "Chicken Banquets",
    "category": "Chicken Banquets",
    "cuisineTags": [
      "Mandi",
      "Chicken",
      "Al Romansiah"
    ],
    "region": "SA",
    "kcal100g": 206,
    "protein100g": 13,
    "carb100g": 21.5,
    "fat100g": 7.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 2.3,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 4.5,
    "servings": [
      {
        "label": "Half Chicken with Rice (نصف دجاج مع أرز مندي)",
        "grams": 450,
        "isDefault": true,
        "kcal": 927
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 206
      }
    ]
  },
  {
    "id": "sa_romansiah_madhbi_chicken",
    "name": "Al Romansiah Madhbi Chicken Half Portion",
    "nameAr": "نصف حبة مضبي دجاج الرومانسية مع أرز",
    "brand": "Al Romansiah",
    "brandId": "al_romansiah",
    "brandCategory": "Chicken Banquets",
    "category": "Chicken Banquets",
    "cuisineTags": [
      "Madhbi",
      "Chicken",
      "Al Romansiah"
    ],
    "region": "SA",
    "kcal100g": 210,
    "protein100g": 14.5,
    "carb100g": 20,
    "fat100g": 8,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 2.4,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 4.8,
    "servings": [
      {
        "label": "Half Chicken with Rice (نصف دجاج مضبي مع أرز)",
        "grams": 440,
        "isDefault": true,
        "kcal": 924
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 210
      }
    ]
  },
  {
    "id": "sa_romansiah_bukhari_chicken",
    "name": "Al Romansiah Bukhari Chicken Half Portion",
    "nameAr": "نصف حبة بخاري دجاج الرومانسية مع أرز",
    "brand": "Al Romansiah",
    "brandId": "al_romansiah",
    "brandCategory": "Chicken Banquets",
    "category": "Chicken Banquets",
    "cuisineTags": [
      "Bukhari",
      "Chicken",
      "Al Romansiah"
    ],
    "region": "SA",
    "kcal100g": 205,
    "protein100g": 12.5,
    "carb100g": 23,
    "fat100g": 7,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 2.1,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 4.2,
    "servings": [
      {
        "label": "Half Chicken with Rice (نصف دجاج بخاري)",
        "grams": 450,
        "isDefault": true,
        "kcal": 923
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 205
      }
    ]
  },
  {
    "id": "sa_romansiah_mandi_lamb_naeemi",
    "name": "Al Romansiah Naeemi Lamb Mandi Portion",
    "nameAr": "نفر لحم نعيمي مندي الرومانسية مع أرز",
    "brand": "Al Romansiah",
    "brandId": "al_romansiah",
    "brandCategory": "Lamb & Meat Banquets",
    "category": "Lamb & Meat Banquets",
    "cuisineTags": [
      "Mandi",
      "Lamb",
      "Naeemi",
      "Al Romansiah"
    ],
    "region": "SA",
    "kcal100g": 238,
    "protein100g": 14,
    "carb100g": 19.5,
    "fat100g": 11.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.5,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6.9,
    "servings": [
      {
        "label": "1 Meat Portion with Rice (نفر لحم نعيمي مع أرز)",
        "grams": 450,
        "isDefault": true,
        "kcal": 1071
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 238
      }
    ]
  },
  {
    "id": "sa_romansiah_madhbi_lamb",
    "name": "Al Romansiah Naeemi Lamb Madhbi Portion",
    "nameAr": "نفر لحم نعيمي مضبي مشوي على الفحم",
    "brand": "Al Romansiah",
    "brandId": "al_romansiah",
    "brandCategory": "Lamb & Meat Banquets",
    "category": "Lamb & Meat Banquets",
    "cuisineTags": [
      "Madhbi",
      "Lamb",
      "Al Romansiah"
    ],
    "region": "SA",
    "kcal100g": 242,
    "protein100g": 15,
    "carb100g": 18.5,
    "fat100g": 12,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 7.2,
    "servings": [
      {
        "label": "1 Meat Portion with Rice (نفر لحم مضبي مع أرز)",
        "grams": 440,
        "isDefault": true,
        "kcal": 1065
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 242
      }
    ]
  },
  {
    "id": "sa_romansiah_hashi_kabsa",
    "name": "Al Romansiah Hashi Camel Meat Kabsa",
    "nameAr": "نفر كبسة حاشي بلدي الرومانسية",
    "brand": "Al Romansiah",
    "brandId": "al_romansiah",
    "brandCategory": "Lamb & Meat Banquets",
    "category": "Lamb & Meat Banquets",
    "cuisineTags": [
      "Kabsa",
      "Camel Meat",
      "Hashi",
      "Al Romansiah"
    ],
    "region": "SA",
    "kcal100g": 197,
    "protein100g": 16.5,
    "carb100g": 18,
    "fat100g": 6.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 2,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 3.9,
    "servings": [
      {
        "label": "1 Camel Meat Portion (نفر حاشي مع أرز كبسة)",
        "grams": 450,
        "isDefault": true,
        "kcal": 887
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 197
      }
    ]
  },
  {
    "id": "sa_romansiah_jareesh_najdi",
    "name": "Al Romansiah Najdi Jareesh with Ghee",
    "nameAr": "جريش نجد أبيض بالسمن والبصل المكرمل الرومانسية",
    "brand": "Al Romansiah",
    "brandId": "al_romansiah",
    "brandCategory": "Traditional Dishes",
    "category": "Traditional Dishes",
    "cuisineTags": [
      "Jareesh",
      "Traditional",
      "Al Romansiah"
    ],
    "region": "SA",
    "kcal100g": 139,
    "protein100g": 6.5,
    "carb100g": 18,
    "fat100g": 4.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 1.3,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 2.7,
    "servings": [
      {
        "label": "1 Bowl (صحن جريش)",
        "grams": 300,
        "isDefault": true,
        "kcal": 417
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 139
      }
    ]
  },
  {
    "id": "sa_romansiah_qursan",
    "name": "Al Romansiah Traditional Qursan with Meat",
    "nameAr": "قرصان نجد بالخضار واللحم الرومانسية",
    "brand": "Al Romansiah",
    "brandId": "al_romansiah",
    "brandCategory": "Traditional Dishes",
    "category": "Traditional Dishes",
    "cuisineTags": [
      "Qursan",
      "Traditional",
      "Al Romansiah"
    ],
    "region": "SA",
    "kcal100g": 150,
    "protein100g": 8.5,
    "carb100g": 16.5,
    "fat100g": 5.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 1.7,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 3.3,
    "servings": [
      {
        "label": "1 Bowl (صحن قرصان)",
        "grams": 300,
        "isDefault": true,
        "kcal": 450
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 150
      }
    ]
  },
  {
    "id": "sa_romansiah_harees",
    "name": "Al Romansiah Saudi Harees with Cinnamon",
    "nameAr": "هريس سعودي بالقمح واللحم الرومانسية",
    "brand": "Al Romansiah",
    "brandId": "al_romansiah",
    "brandCategory": "Traditional Dishes",
    "category": "Traditional Dishes",
    "cuisineTags": [
      "Harees",
      "Traditional",
      "Al Romansiah"
    ],
    "region": "SA",
    "kcal100g": 147,
    "protein100g": 9,
    "carb100g": 17.5,
    "fat100g": 4.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 1.3,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 2.7,
    "servings": [
      {
        "label": "1 Bowl (صحن هريس)",
        "grams": 300,
        "isDefault": true,
        "kcal": 441
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 147
      }
    ]
  },
  {
    "id": "sa_romansiah_sayyadiyah_fish",
    "name": "Al Romansiah Sayyadiyah Fish with Brown Rice",
    "nameAr": "صيادية سمك مع أرز بني الرومانسية",
    "brand": "Al Romansiah",
    "brandId": "al_romansiah",
    "brandCategory": "Seafood",
    "category": "Seafood",
    "cuisineTags": [
      "Fish",
      "Seafood",
      "Sayyadiyah",
      "Al Romansiah"
    ],
    "region": "SA",
    "kcal100g": 192,
    "protein100g": 13.5,
    "carb100g": 21,
    "fat100g": 6,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 1.8,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 3.6,
    "servings": [
      {
        "label": "1 Fish Meal (وجبة صيادية سمك)",
        "grams": 420,
        "isDefault": true,
        "kcal": 806
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 192
      }
    ]
  },
  {
    "id": "sa_romansiah_sambousah",
    "name": "Al Romansiah Meat & Cheese Sambousah 6pc",
    "nameAr": "صحن سمبوسة لحم وجبن الرومانسية 6 حبات",
    "brand": "Al Romansiah",
    "brandId": "al_romansiah",
    "brandCategory": "Appetizers",
    "category": "Appetizers",
    "cuisineTags": [
      "Appetizer",
      "Sambousah",
      "Al Romansiah"
    ],
    "region": "SA",
    "kcal100g": 246,
    "protein100g": 8.5,
    "carb100g": 26,
    "fat100g": 12,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 7.2,
    "servings": [
      {
        "label": "6pc Sambousah (6 حبات سمبوسة)",
        "grams": 180,
        "isDefault": true,
        "kcal": 443
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 246
      }
    ]
  },
  {
    "id": "sa_romansiah_green_salad",
    "name": "Al Romansiah Mixed Arab Green Salad",
    "nameAr": "سلطة خضراء مشكلة الرومانسية",
    "brand": "Al Romansiah",
    "brandId": "al_romansiah",
    "brandCategory": "Salads & Dips",
    "category": "Salads & Dips",
    "cuisineTags": [
      "Salad",
      "Healthy",
      "Al Romansiah"
    ],
    "region": "SA",
    "kcal100g": 23,
    "protein100g": 1.1,
    "carb100g": 4.2,
    "fat100g": 0.2,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 0.1,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 0.1,
    "servings": [
      {
        "label": "1 Salad Bowl (صحن سلطة)",
        "grams": 150,
        "isDefault": true,
        "kcal": 35
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 23
      }
    ]
  },
  {
    "id": "sa_romansiah_cucumber_yogurt",
    "name": "Al Romansiah Cucumber Yogurt Laban Salad",
    "nameAr": "سلطة خيار باللبن والنعناع الرومانسية",
    "brand": "Al Romansiah",
    "brandId": "al_romansiah",
    "brandCategory": "Salads & Dips",
    "category": "Salads & Dips",
    "cuisineTags": [
      "Salad",
      "Laban",
      "Al Romansiah"
    ],
    "region": "SA",
    "kcal100g": 57,
    "protein100g": 3.2,
    "carb100g": 5.5,
    "fat100g": 2.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 0.8,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 1.5,
    "servings": [
      {
        "label": "1 Laban Bowl (صحن خيار بلبن)",
        "grams": 160,
        "isDefault": true,
        "kcal": 91
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 57
      }
    ]
  },
  {
    "id": "sa_romansiah_kunafa_cream",
    "name": "Al Romansiah Royal Cream Kunafa",
    "nameAr": "كنافة ملكية بالقشطة الرومانسية",
    "brand": "Al Romansiah",
    "brandId": "al_romansiah",
    "brandCategory": "Desserts",
    "category": "Desserts",
    "cuisineTags": [
      "Dessert",
      "Kunafa",
      "Al Romansiah"
    ],
    "region": "SA",
    "kcal100g": 321,
    "protein100g": 5.5,
    "carb100g": 42,
    "fat100g": 14.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 4.4,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 8.7,
    "servings": [
      {
        "label": "1 Portion (صحن كنافة بالقشطة)",
        "grams": 180,
        "isDefault": true,
        "kcal": 578
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 321
      }
    ]
  },
  {
    "id": "sa_romansiah_om_ali",
    "name": "Al Romansiah Om Ali with Nuts & Cream",
    "nameAr": "أم علي بالمكسرات والقشطة الرومانسية",
    "brand": "Al Romansiah",
    "brandId": "al_romansiah",
    "brandCategory": "Desserts",
    "category": "Desserts",
    "cuisineTags": [
      "Dessert",
      "Om Ali",
      "Al Romansiah"
    ],
    "region": "SA",
    "kcal100g": 279,
    "protein100g": 4.8,
    "carb100g": 38,
    "fat100g": 12,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 7.2,
    "servings": [
      {
        "label": "1 Bowl (طاجن أم علي)",
        "grams": 180,
        "isDefault": true,
        "kcal": 502
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 279
      }
    ]
  },
  {
    "id": "sa_romansiah_shahi_adeni",
    "name": "Al Romansiah Shahi Adeni with Cardamom Milk",
    "nameAr": "شاي عدني بالحليب والهيل الرومانسية",
    "brand": "Al Romansiah",
    "brandId": "al_romansiah",
    "brandCategory": "Beverages",
    "category": "Beverages",
    "cuisineTags": [
      "Tea",
      "Adeni",
      "Al Romansiah"
    ],
    "region": "SA",
    "kcal100g": 79,
    "protein100g": 2.5,
    "carb100g": 11,
    "fat100g": 2.8,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 0.8,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 1.7,
    "servings": [
      {
        "label": "1 Cup (كوب شاي عدني)",
        "grams": 200,
        "isDefault": true,
        "kcal": 158
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 79
      }
    ]
  },
  {
    "id": "sa_noura_saroukh_chicken",
    "name": "Mama Noura Saroukh Chicken Shawarma Large",
    "nameAr": "صاروخ شاورما دجاج ماما نورة كبير",
    "brand": "Mama Noura",
    "brandId": "mama_noura",
    "brandCategory": "Shawarma",
    "category": "Shawarma",
    "cuisineTags": [
      "Shawarma",
      "Chicken",
      "Mama Noura"
    ],
    "region": "SA",
    "kcal100g": 237,
    "protein100g": 13.5,
    "carb100g": 22,
    "fat100g": 10.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.2,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6.3,
    "servings": [
      {
        "label": "1 Saroukh (صاروخ شاورما كبير)",
        "grams": 280,
        "isDefault": true,
        "kcal": 664
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 237
      }
    ]
  },
  {
    "id": "sa_noura_saroukh_beef",
    "name": "Mama Noura Saroukh Beef Shawarma Large",
    "nameAr": "صاروخ شاورما لحم ماما نورة كبير",
    "brand": "Mama Noura",
    "brandId": "mama_noura",
    "brandCategory": "Shawarma",
    "category": "Shawarma",
    "cuisineTags": [
      "Shawarma",
      "Beef",
      "Mama Noura"
    ],
    "region": "SA",
    "kcal100g": 250,
    "protein100g": 14.5,
    "carb100g": 21,
    "fat100g": 12,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 7.2,
    "servings": [
      {
        "label": "1 Saroukh Beef (صاروخ لحم كبير)",
        "grams": 280,
        "isDefault": true,
        "kcal": 700
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 250
      }
    ]
  },
  {
    "id": "sa_noura_mini_shawarma_plate",
    "name": "Mama Noura Mini Shawarma Platter 6pc",
    "nameAr": "صحن شاورما ميني 6 قطع مع مقبلات ماما نورة",
    "brand": "Mama Noura",
    "brandId": "mama_noura",
    "brandCategory": "Shawarma Platters",
    "category": "Shawarma Platters",
    "cuisineTags": [
      "Shawarma Platter",
      "Mama Noura"
    ],
    "region": "SA",
    "kcal100g": 243,
    "protein100g": 13,
    "carb100g": 23,
    "fat100g": 11,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.3,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6.6,
    "servings": [
      {
        "label": "1 Platter with Fries (صحن شاورما مشكل)",
        "grams": 360,
        "isDefault": true,
        "kcal": 875
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 243
      }
    ]
  },
  {
    "id": "sa_noura_shish_tawook_plate",
    "name": "Mama Noura Shish Tawook Plate with Garlic",
    "nameAr": "صحن شيش طاووق مشوي مع ثوم وخبز ماما نورة",
    "brand": "Mama Noura",
    "brandId": "mama_noura",
    "brandCategory": "Grills",
    "category": "Grills",
    "cuisineTags": [
      "Grills",
      "Tawook",
      "Mama Noura"
    ],
    "region": "SA",
    "kcal100g": 167,
    "protein100g": 18.5,
    "carb100g": 4,
    "fat100g": 8.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 2.6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 5.1,
    "servings": [
      {
        "label": "1 Plate with Bread (صحن شيش طاووق)",
        "grams": 300,
        "isDefault": true,
        "kcal": 501
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 167
      }
    ]
  },
  {
    "id": "sa_noura_kebab_halabi",
    "name": "Mama Noura Kebab Halabi Platter",
    "nameAr": "صحن كباب لحم حلبي مشوي ماما نورة",
    "brand": "Mama Noura",
    "brandId": "mama_noura",
    "brandCategory": "Grills",
    "category": "Grills",
    "cuisineTags": [
      "Grills",
      "Kebab",
      "Mama Noura"
    ],
    "region": "SA",
    "kcal100g": 206,
    "protein100g": 16.5,
    "carb100g": 3.5,
    "fat100g": 14,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 4.2,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 8.4,
    "servings": [
      {
        "label": "1 Plate (صحن كباب حلبي)",
        "grams": 300,
        "isDefault": true,
        "kcal": 618
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 206
      }
    ]
  },
  {
    "id": "sa_noura_mixed_grills",
    "name": "Mama Noura Mixed Grill 4 Skewers",
    "nameAr": "مشاوي مشكلة ماما نورة 4 أسياخ",
    "brand": "Mama Noura",
    "brandId": "mama_noura",
    "brandCategory": "Grills",
    "category": "Grills",
    "cuisineTags": [
      "Grills",
      "Mixed Grill",
      "Mama Noura"
    ],
    "region": "SA",
    "kcal100g": 195,
    "protein100g": 17.5,
    "carb100g": 3,
    "fat100g": 12.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.8,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 7.5,
    "servings": [
      {
        "label": "4 Skewers with Bread (مشاوي مشكلة 4 أسياخ)",
        "grams": 340,
        "isDefault": true,
        "kcal": 663
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 195
      }
    ]
  },
  {
    "id": "sa_noura_falafel_sandwich",
    "name": "Mama Noura Falafel Sandwich with Tahina",
    "nameAr": "ساندوتش فلافل ماما نورة بالطحينة",
    "brand": "Mama Noura",
    "brandId": "mama_noura",
    "brandCategory": "Falafel",
    "category": "Falafel",
    "cuisineTags": [
      "Falafel",
      "Vegetarian",
      "Mama Noura"
    ],
    "region": "SA",
    "kcal100g": 232,
    "protein100g": 7.5,
    "carb100g": 29,
    "fat100g": 9.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 2.9,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 5.7,
    "servings": [
      {
        "label": "1 Sandwich (ساندوتش فلافل)",
        "grams": 170,
        "isDefault": true,
        "kcal": 394
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 232
      }
    ]
  },
  {
    "id": "sa_noura_falafel_platter",
    "name": "Mama Noura Falafel Platter 10pc with Veggies",
    "nameAr": "صحن فلافل مشكل 10 حبات ماما نورة",
    "brand": "Mama Noura",
    "brandId": "mama_noura",
    "brandCategory": "Falafel",
    "category": "Falafel",
    "cuisineTags": [
      "Falafel",
      "Vegetarian",
      "Mama Noura"
    ],
    "region": "SA",
    "kcal100g": 247,
    "protein100g": 9,
    "carb100g": 28,
    "fat100g": 11,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.3,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6.6,
    "servings": [
      {
        "label": "10pc Platter (صحن فلافل 10 حبات)",
        "grams": 260,
        "isDefault": true,
        "kcal": 642
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 247
      }
    ]
  },
  {
    "id": "sa_noura_hummus",
    "name": "Mama Noura Silky Hummus with Olive Oil",
    "nameAr": "حمص ناعم بزيت الزيتون ماما نورة",
    "brand": "Mama Noura",
    "brandId": "mama_noura",
    "brandCategory": "Appetizers",
    "category": "Appetizers",
    "cuisineTags": [
      "Hummus",
      "Appetizer",
      "Mama Noura"
    ],
    "region": "SA",
    "kcal100g": 194,
    "protein100g": 7,
    "carb100g": 14.5,
    "fat100g": 12,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 7.2,
    "servings": [
      {
        "label": "1 Hummus Plate (صحن حمص)",
        "grams": 180,
        "isDefault": true,
        "kcal": 349
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 194
      }
    ]
  },
  {
    "id": "sa_noura_mutabbal",
    "name": "Mama Noura Smoked Mutabbal Eggplant Dip",
    "nameAr": "متبل باذنجان مشوي ماما نورة",
    "brand": "Mama Noura",
    "brandId": "mama_noura",
    "brandCategory": "Appetizers",
    "category": "Appetizers",
    "cuisineTags": [
      "Mutabbal",
      "Appetizer",
      "Mama Noura"
    ],
    "region": "SA",
    "kcal100g": 129,
    "protein100g": 3.5,
    "carb100g": 8.5,
    "fat100g": 9,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 2.7,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 5.4,
    "servings": [
      {
        "label": "1 Plate (صحن متبل)",
        "grams": 180,
        "isDefault": true,
        "kcal": 232
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 129
      }
    ]
  },
  {
    "id": "sa_noura_tabbouleh",
    "name": "Mama Noura Parsley Tabbouleh with Olive Oil",
    "nameAr": "تبولة طازجة بالبرغل وزيت الزيتون ماما نورة",
    "brand": "Mama Noura",
    "brandId": "mama_noura",
    "brandCategory": "Salads",
    "category": "Salads",
    "cuisineTags": [
      "Salad",
      "Tabbouleh",
      "Mama Noura"
    ],
    "region": "SA",
    "kcal100g": 110,
    "protein100g": 2.2,
    "carb100g": 9.5,
    "fat100g": 7,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 2.1,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 4.2,
    "servings": [
      {
        "label": "1 Bowl (صحن تبولة)",
        "grams": 170,
        "isDefault": true,
        "kcal": 187
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 110
      }
    ]
  },
  {
    "id": "sa_noura_fattoush",
    "name": "Mama Noura Crisp Fattoush with Sumac",
    "nameAr": "فتوش بالخبز المحمص والسماق ماما نورة",
    "brand": "Mama Noura",
    "brandId": "mama_noura",
    "brandCategory": "Salads",
    "category": "Salads",
    "cuisineTags": [
      "Salad",
      "Fattoush",
      "Mama Noura"
    ],
    "region": "SA",
    "kcal100g": 113,
    "protein100g": 2,
    "carb100g": 11.5,
    "fat100g": 6.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 2,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 3.9,
    "servings": [
      {
        "label": "1 Bowl (صحن فتوش)",
        "grams": 170,
        "isDefault": true,
        "kcal": 192
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 113
      }
    ]
  },
  {
    "id": "sa_noura_awar_qalb",
    "name": "Mama Noura Fresh Awar Qalb Juice",
    "nameAr": "عصير عوار قلب الشهير مانجو وفراولة ماما نورة",
    "brand": "Mama Noura",
    "brandId": "mama_noura",
    "brandCategory": "Fresh Juices",
    "category": "Fresh Juices",
    "cuisineTags": [
      "Juice",
      "Awar Qalb",
      "Mama Noura"
    ],
    "region": "SA",
    "kcal100g": 86,
    "protein100g": 1.2,
    "carb100g": 18,
    "fat100g": 1,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 0.3,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 0.6,
    "servings": [
      {
        "label": "Large Cup (كوب عصير كبير)",
        "grams": 350,
        "isDefault": true,
        "kcal": 301
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 86
      }
    ]
  },
  {
    "id": "sa_noura_mango_juice",
    "name": "Mama Noura 100% Fresh Mango Juice",
    "nameAr": "عصير مانجو طبيعي طازج 100% ماما نورة",
    "brand": "Mama Noura",
    "brandId": "mama_noura",
    "brandCategory": "Fresh Juices",
    "category": "Fresh Juices",
    "cuisineTags": [
      "Juice",
      "Mango",
      "Mama Noura"
    ],
    "region": "SA",
    "kcal100g": 71,
    "protein100g": 0.8,
    "carb100g": 16.5,
    "fat100g": 0.2,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 0.1,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 0.1,
    "servings": [
      {
        "label": "Large Cup (كوب عصير مانجو)",
        "grams": 350,
        "isDefault": true,
        "kcal": 249
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 71
      }
    ]
  },
  {
    "id": "sa_noura_guava_milk",
    "name": "Mama Noura Fresh Guava Juice with Milk",
    "nameAr": "عصير جوافة بالحليب طازج ماما نورة",
    "brand": "Mama Noura",
    "brandId": "mama_noura",
    "brandCategory": "Fresh Juices",
    "category": "Fresh Juices",
    "cuisineTags": [
      "Juice",
      "Guava",
      "Mama Noura"
    ],
    "region": "SA",
    "kcal100g": 80,
    "protein100g": 2.2,
    "carb100g": 14.5,
    "fat100g": 1.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 0.5,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 0.9,
    "servings": [
      {
        "label": "Large Cup (كوب جوافة بالحليب)",
        "grams": 350,
        "isDefault": true,
        "kcal": 280
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 80
      }
    ]
  },
  {
    "id": "sa_maestro_ranchy_chicken",
    "name": "Maestro Pizza Ranchy Chicken Large",
    "nameAr": "بيتزا رانشي تشيكن مايسترو مع صوص رانش غني",
    "brand": "Maestro Pizza",
    "brandId": "maestro_pizza",
    "brandCategory": "Pizzas",
    "category": "Pizzas",
    "cuisineTags": [
      "Pizza",
      "Ranch",
      "Maestro Pizza"
    ],
    "region": "SA",
    "kcal100g": 245,
    "protein100g": 11.5,
    "carb100g": 26,
    "fat100g": 10.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.2,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6.3,
    "servings": [
      {
        "label": "1 Large Slice (قطعة بيتزا كبيرة)",
        "grams": 140,
        "isDefault": true,
        "kcal": 343
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 245
      }
    ]
  },
  {
    "id": "sa_maestro_dynamite_pepperoni",
    "name": "Maestro Pizza Dynamite Pepperoni",
    "nameAr": "بيتزا بيبروني داينمايت حارة مايسترو",
    "brand": "Maestro Pizza",
    "brandId": "maestro_pizza",
    "brandCategory": "Pizzas",
    "category": "Pizzas",
    "cuisineTags": [
      "Pizza",
      "Pepperoni",
      "Maestro Pizza"
    ],
    "region": "SA",
    "kcal100g": 258,
    "protein100g": 12,
    "carb100g": 25.5,
    "fat100g": 12,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 7.2,
    "servings": [
      {
        "label": "1 Large Slice (قطعة بيبروني)",
        "grams": 140,
        "isDefault": true,
        "kcal": 361
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 258
      }
    ]
  },
  {
    "id": "sa_maestro_margherita",
    "name": "Maestro Pizza Classic Margherita",
    "nameAr": "بيتزا مارغريتا كلاسيك الإيطالية مايسترو",
    "brand": "Maestro Pizza",
    "brandId": "maestro_pizza",
    "brandCategory": "Pizzas",
    "category": "Pizzas",
    "cuisineTags": [
      "Pizza",
      "Vegetarian",
      "Maestro Pizza"
    ],
    "region": "SA",
    "kcal100g": 227,
    "protein100g": 10.5,
    "carb100g": 27,
    "fat100g": 8.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 2.6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 5.1,
    "servings": [
      {
        "label": "1 Large Slice (قطعة مارغريتا)",
        "grams": 130,
        "isDefault": true,
        "kcal": 295
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 227
      }
    ]
  },
  {
    "id": "sa_maestro_bbq_chicken",
    "name": "Maestro Pizza BBQ Grilled Chicken",
    "nameAr": "بيتزا باربيكيو دجاج مشوي مايسترو",
    "brand": "Maestro Pizza",
    "brandId": "maestro_pizza",
    "brandCategory": "Pizzas",
    "category": "Pizzas",
    "cuisineTags": [
      "Pizza",
      "BBQ",
      "Maestro Pizza"
    ],
    "region": "SA",
    "kcal100g": 237,
    "protein100g": 11.5,
    "carb100g": 27.5,
    "fat100g": 9,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 2.7,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 5.4,
    "servings": [
      {
        "label": "1 Large Slice (قطعة باربيكيو)",
        "grams": 140,
        "isDefault": true,
        "kcal": 332
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 237
      }
    ]
  },
  {
    "id": "sa_maestro_shawarma_pizza",
    "name": "Maestro Pizza Shawarma Feast",
    "nameAr": "بيتزا شاورما لحم ودجاج مايسترو",
    "brand": "Maestro Pizza",
    "brandId": "maestro_pizza",
    "brandCategory": "Pizzas",
    "category": "Pizzas",
    "cuisineTags": [
      "Pizza",
      "Shawarma",
      "Maestro Pizza"
    ],
    "region": "SA",
    "kcal100g": 249,
    "protein100g": 12.5,
    "carb100g": 25,
    "fat100g": 11,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.3,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6.6,
    "servings": [
      {
        "label": "1 Large Slice (قطعة شاورما بيتزا)",
        "grams": 145,
        "isDefault": true,
        "kcal": 361
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 249
      }
    ]
  },
  {
    "id": "sa_maestro_veggie_legend",
    "name": "Maestro Pizza Veggie Legend",
    "nameAr": "بيتزا الخضار الأسطورية مايسترو",
    "brand": "Maestro Pizza",
    "brandId": "maestro_pizza",
    "brandCategory": "Pizzas",
    "category": "Pizzas",
    "cuisineTags": [
      "Pizza",
      "Vegetarian",
      "Maestro Pizza"
    ],
    "region": "SA",
    "kcal100g": 212,
    "protein100g": 9.5,
    "carb100g": 26.5,
    "fat100g": 7.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 2.3,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 4.5,
    "servings": [
      {
        "label": "1 Large Slice (قطعة خضار)",
        "grams": 135,
        "isDefault": true,
        "kcal": 286
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 212
      }
    ]
  },
  {
    "id": "sa_maestro_potato_wedges",
    "name": "Maestro Seasoned Potato Wedges",
    "nameAr": "ودجز بطاطس مقرمشة ومبهرة مايسترو",
    "brand": "Maestro Pizza",
    "brandId": "maestro_pizza",
    "brandCategory": "Sides",
    "category": "Sides",
    "cuisineTags": [
      "Sides",
      "Potato",
      "Maestro Pizza"
    ],
    "region": "SA",
    "kcal100g": 230,
    "protein100g": 3.2,
    "carb100g": 33,
    "fat100g": 9.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 2.9,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 5.7,
    "servings": [
      {
        "label": "1 Box Wedges (علبة ودجز)",
        "grams": 180,
        "isDefault": true,
        "kcal": 414
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 230
      }
    ]
  },
  {
    "id": "sa_maestro_cheesy_garlic_bread",
    "name": "Maestro Cheesy Garlic Bread 4pc",
    "nameAr": "خبز بالثوم والجبنة الذائبة مايسترو 4 قطع",
    "brand": "Maestro Pizza",
    "brandId": "maestro_pizza",
    "brandCategory": "Sides",
    "category": "Sides",
    "cuisineTags": [
      "Sides",
      "Garlic Bread",
      "Maestro Pizza"
    ],
    "region": "SA",
    "kcal100g": 275,
    "protein100g": 9.5,
    "carb100g": 31,
    "fat100g": 12.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.8,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 7.5,
    "servings": [
      {
        "label": "4pc Garlic Bread (4 قطع خبز بالثوم)",
        "grams": 150,
        "isDefault": true,
        "kcal": 413
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 275
      }
    ]
  },
  {
    "id": "sa_maestro_buffalo_wings",
    "name": "Maestro Spicy Buffalo Wings 6pc",
    "nameAr": "أجنحة دجاج بافلو حارة مايسترو 6 قطع",
    "brand": "Maestro Pizza",
    "brandId": "maestro_pizza",
    "brandCategory": "Wings",
    "category": "Wings",
    "cuisineTags": [
      "Wings",
      "Spicy",
      "Maestro Pizza"
    ],
    "region": "SA",
    "kcal100g": 205,
    "protein100g": 17.5,
    "carb100g": 4.5,
    "fat100g": 13,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.9,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 7.8,
    "servings": [
      {
        "label": "6pc Wings (6 أجنحة دجاج)",
        "grams": 200,
        "isDefault": true,
        "kcal": 410
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 205
      }
    ]
  },
  {
    "id": "sa_maestro_bbq_wings",
    "name": "Maestro BBQ Chicken Wings 6pc",
    "nameAr": "أجنحة دجاج باربيكيو مايسترو 6 قطع",
    "brand": "Maestro Pizza",
    "brandId": "maestro_pizza",
    "brandCategory": "Wings",
    "category": "Wings",
    "cuisineTags": [
      "Wings",
      "BBQ",
      "Maestro Pizza"
    ],
    "region": "SA",
    "kcal100g": 208,
    "protein100g": 16.5,
    "carb100g": 8.5,
    "fat100g": 12,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 7.2,
    "servings": [
      {
        "label": "6pc Wings (6 أجنحة باربيكيو)",
        "grams": 200,
        "isDefault": true,
        "kcal": 416
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 208
      }
    ]
  },
  {
    "id": "sa_maestro_calzone",
    "name": "Maestro Chicken & Cheese Folded Calzone",
    "nameAr": "كالزوني دجاج وجبنة مايسترو",
    "brand": "Maestro Pizza",
    "brandId": "maestro_pizza",
    "brandCategory": "Calzones",
    "category": "Calzones",
    "cuisineTags": [
      "Calzone",
      "Maestro Pizza"
    ],
    "region": "SA",
    "kcal100g": 255,
    "protein100g": 12,
    "carb100g": 28,
    "fat100g": 10.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.2,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6.3,
    "servings": [
      {
        "label": "1 Calzone (كالزوني مطوي)",
        "grams": 220,
        "isDefault": true,
        "kcal": 561
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 255
      }
    ]
  },
  {
    "id": "sa_maestro_lava_cake",
    "name": "Maestro Molten Chocolate Lava Cake",
    "nameAr": "كيكة لافا الشوكولاتة الذائبة مايسترو",
    "brand": "Maestro Pizza",
    "brandId": "maestro_pizza",
    "brandCategory": "Desserts",
    "category": "Desserts",
    "cuisineTags": [
      "Dessert",
      "Chocolate",
      "Maestro Pizza"
    ],
    "region": "SA",
    "kcal100g": 355,
    "protein100g": 4.5,
    "carb100g": 46,
    "fat100g": 17,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 5.1,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 10.2,
    "servings": [
      {
        "label": "1 Cake (قطعة كيك لافا)",
        "grams": 110,
        "isDefault": true,
        "kcal": 391
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 355
      }
    ]
  },
  {
    "id": "sa_hamburgini_single_classic",
    "name": "Hamburgini Single Classic Angus Beef Burger",
    "nameAr": "سنجل كلاسيك برجر أنجوس همبرغيني",
    "brand": "Hamburgini",
    "brandId": "hamburgini",
    "brandCategory": "Burgers",
    "category": "Burgers",
    "cuisineTags": [
      "Burger",
      "Angus Beef",
      "Hamburgini"
    ],
    "region": "SA",
    "kcal100g": 262,
    "protein100g": 14,
    "carb100g": 21,
    "fat100g": 13.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 4.1,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 8.1,
    "servings": [
      {
        "label": "1 Burger (سنجل برجر)",
        "grams": 200,
        "isDefault": true,
        "kcal": 524
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 262
      }
    ]
  },
  {
    "id": "sa_hamburgini_double_deluxe",
    "name": "Hamburgini Double Deluxe Cheese Burger",
    "nameAr": "دبل همبرغيني لحم وجبنة ديلوكس",
    "brand": "Hamburgini",
    "brandId": "hamburgini",
    "brandCategory": "Burgers",
    "category": "Burgers",
    "cuisineTags": [
      "Burger",
      "Double",
      "Hamburgini"
    ],
    "region": "SA",
    "kcal100g": 291,
    "protein100g": 16.5,
    "carb100g": 19,
    "fat100g": 16.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 5,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 9.9,
    "servings": [
      {
        "label": "1 Double Burger (دبل برجر)",
        "grams": 260,
        "isDefault": true,
        "kcal": 757
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 291
      }
    ]
  },
  {
    "id": "sa_hamburgini_triple_monster",
    "name": "Hamburgini Triple Monster Angus Burger",
    "nameAr": "تريبل همبرغيني 3 طبقات أنجوس",
    "brand": "Hamburgini",
    "brandId": "hamburgini",
    "brandCategory": "Burgers",
    "category": "Burgers",
    "cuisineTags": [
      "Burger",
      "Triple",
      "Hamburgini"
    ],
    "region": "SA",
    "kcal100g": 311,
    "protein100g": 18.5,
    "carb100g": 17.5,
    "fat100g": 18.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 5.6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 11.1,
    "servings": [
      {
        "label": "1 Triple Burger (تريبل برجر ضخم)",
        "grams": 320,
        "isDefault": true,
        "kcal": 995
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 311
      }
    ]
  },
  {
    "id": "sa_hamburgini_tender_crispy",
    "name": "Hamburgini Tender Crispy Chicken Burger",
    "nameAr": "همبرغيني دجاج تندر مقرمش",
    "brand": "Hamburgini",
    "brandId": "hamburgini",
    "brandCategory": "Burgers",
    "category": "Burgers",
    "cuisineTags": [
      "Burger",
      "Chicken",
      "Hamburgini"
    ],
    "region": "SA",
    "kcal100g": 263,
    "protein100g": 14.5,
    "carb100g": 23,
    "fat100g": 12.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.8,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 7.5,
    "servings": [
      {
        "label": "1 Chicken Burger (برجر دجاج)",
        "grams": 210,
        "isDefault": true,
        "kcal": 552
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 263
      }
    ]
  },
  {
    "id": "sa_hamburgini_beef_bacon",
    "name": "Hamburgini Beef Bacon Angus Burger",
    "nameAr": "همبرغيني أنجوس مع بيكون مقدد",
    "brand": "Hamburgini",
    "brandId": "hamburgini",
    "brandCategory": "Burgers",
    "category": "Burgers",
    "cuisineTags": [
      "Burger",
      "Bacon",
      "Hamburgini"
    ],
    "region": "SA",
    "kcal100g": 277,
    "protein100g": 15.5,
    "carb100g": 20,
    "fat100g": 15,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 4.5,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 9,
    "servings": [
      {
        "label": "1 Bacon Burger (برجر بيكون)",
        "grams": 220,
        "isDefault": true,
        "kcal": 609
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 277
      }
    ]
  },
  {
    "id": "sa_hamburgini_skinny_fries",
    "name": "Hamburgini Signature Skinny Crisp Fries",
    "nameAr": "بطاطس همبرغيني الرفيعة الذهبية",
    "brand": "Hamburgini",
    "brandId": "hamburgini",
    "brandCategory": "Fries",
    "category": "Fries",
    "cuisineTags": [
      "Fries",
      "Sides",
      "Hamburgini"
    ],
    "region": "SA",
    "kcal100g": 295,
    "protein100g": 3.2,
    "carb100g": 38,
    "fat100g": 14.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 4.4,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 8.7,
    "servings": [
      {
        "label": "1 Portion Fries (بطاطس مقلية)",
        "grams": 120,
        "isDefault": true,
        "kcal": 354
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 295
      }
    ]
  },
  {
    "id": "sa_hamburgini_sweet_potato",
    "name": "Hamburgini Seasoned Sweet Potato Fries",
    "nameAr": "بطاطس حلوة مقرمشة همبرغيني",
    "brand": "Hamburgini",
    "brandId": "hamburgini",
    "brandCategory": "Fries",
    "category": "Fries",
    "cuisineTags": [
      "Fries",
      "Sweet Potato",
      "Hamburgini"
    ],
    "region": "SA",
    "kcal100g": 235,
    "protein100g": 2.2,
    "carb100g": 33,
    "fat100g": 10.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.2,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6.3,
    "servings": [
      {
        "label": "1 Portion Sweet Potato (بطاطس حلوة)",
        "grams": 130,
        "isDefault": true,
        "kcal": 306
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 235
      }
    ]
  },
  {
    "id": "sa_hamburgini_cheese_cup",
    "name": "Hamburgini Melted Cheddar Dipping Cup",
    "nameAr": "كوب جبنة شيدر سائلة همبرغيني",
    "brand": "Hamburgini",
    "brandId": "hamburgini",
    "brandCategory": "Sauces",
    "category": "Sauces",
    "cuisineTags": [
      "Sauce",
      "Cheese",
      "Hamburgini"
    ],
    "region": "SA",
    "kcal100g": 256,
    "protein100g": 8.5,
    "carb100g": 6,
    "fat100g": 22,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 6.6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 13.2,
    "servings": [
      {
        "label": "1 Cheese Cup (كوب جبن)",
        "grams": 60,
        "isDefault": true,
        "kcal": 154
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 256
      }
    ]
  },
  {
    "id": "sa_hamburgini_truffle_sauce",
    "name": "Hamburgini Secret Truffle Sauce",
    "nameAr": "صلصة ترافل همبرغيني الخاصة",
    "brand": "Hamburgini",
    "brandId": "hamburgini",
    "brandCategory": "Sauces",
    "category": "Sauces",
    "cuisineTags": [
      "Sauce",
      "Truffle",
      "Hamburgini"
    ],
    "region": "SA",
    "kcal100g": 376,
    "protein100g": 1.5,
    "carb100g": 7,
    "fat100g": 38,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 11.4,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 22.8,
    "servings": [
      {
        "label": "1 Sauce Cup (كوب صوص ترافل)",
        "grams": 45,
        "isDefault": true,
        "kcal": 169
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 376
      }
    ]
  },
  {
    "id": "sa_hamburgini_cookie_dough",
    "name": "Hamburgini Warm Chocolate Cookie Dough",
    "nameAr": "كوكيز دافئ بقطع الشوكولاتة همبرغيني",
    "brand": "Hamburgini",
    "brandId": "hamburgini",
    "brandCategory": "Desserts",
    "category": "Desserts",
    "cuisineTags": [
      "Dessert",
      "Cookie",
      "Hamburgini"
    ],
    "region": "SA",
    "kcal100g": 423,
    "protein100g": 4.8,
    "carb100g": 56,
    "fat100g": 20,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 12,
    "servings": [
      {
        "label": "1 Warm Cookie (قطعة كوكيز دافئة)",
        "grams": 90,
        "isDefault": true,
        "kcal": 381
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 423
      }
    ]
  },
  {
    "id": "sa_bait_arabi_chicken",
    "name": "Bait Al Shawarma Arabi Box Chicken",
    "nameAr": "بوكس شاورما عربي دجاج بيت الشاورما",
    "brand": "Bait Al Shawarma",
    "brandId": "bait_al_shawarma",
    "brandCategory": "Arabi Platters",
    "category": "Arabi Platters",
    "cuisineTags": [
      "Shawarma",
      "Arabi",
      "Bait Al Shawarma"
    ],
    "region": "SA",
    "kcal100g": 256,
    "protein100g": 13.5,
    "carb100g": 23.5,
    "fat100g": 12,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 7.2,
    "servings": [
      {
        "label": "1 Arabi Box with Fries & Garlic (بوكس عربي)",
        "grams": 360,
        "isDefault": true,
        "kcal": 922
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 256
      }
    ]
  },
  {
    "id": "sa_bait_arabi_beef",
    "name": "Bait Al Shawarma Arabi Box Beef",
    "nameAr": "بوكس شاورما عربي لحم بيت الشاورما",
    "brand": "Bait Al Shawarma",
    "brandId": "bait_al_shawarma",
    "brandCategory": "Arabi Platters",
    "category": "Arabi Platters",
    "cuisineTags": [
      "Shawarma",
      "Beef",
      "Bait Al Shawarma"
    ],
    "region": "SA",
    "kcal100g": 268,
    "protein100g": 14.5,
    "carb100g": 22,
    "fat100g": 13.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 4.1,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 8.1,
    "servings": [
      {
        "label": "1 Arabi Box Beef with Tahina (بوكس عربي لحم)",
        "grams": 360,
        "isDefault": true,
        "kcal": 965
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 268
      }
    ]
  },
  {
    "id": "sa_bait_brioche_chicken",
    "name": "Bait Al Shawarma Brioche Chicken Shawarma",
    "nameAr": "شاورما دجاج في خبز بريوش فاخر",
    "brand": "Bait Al Shawarma",
    "brandId": "bait_al_shawarma",
    "brandCategory": "Brioche Sandwiches",
    "category": "Brioche Sandwiches",
    "cuisineTags": [
      "Shawarma",
      "Brioche",
      "Bait Al Shawarma"
    ],
    "region": "SA",
    "kcal100g": 258,
    "protein100g": 12.5,
    "carb100g": 26,
    "fat100g": 11.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.5,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 6.9,
    "servings": [
      {
        "label": "1 Brioche Sandwich (ساندوتش بريوش)",
        "grams": 190,
        "isDefault": true,
        "kcal": 490
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 258
      }
    ]
  },
  {
    "id": "sa_bait_hummus_shawarma",
    "name": "Hummus Bowl Topped with Beef Shawarma",
    "nameAr": "صحن حمص تعلوه شاورما لحم بيت الشاورما",
    "brand": "Bait Al Shawarma",
    "brandId": "bait_al_shawarma",
    "brandCategory": "Platters",
    "category": "Platters",
    "cuisineTags": [
      "Hummus",
      "Shawarma",
      "Bait Al Shawarma"
    ],
    "region": "SA",
    "kcal100g": 221,
    "protein100g": 11,
    "carb100g": 15,
    "fat100g": 13,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.9,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 7.8,
    "servings": [
      {
        "label": "1 Hummus Shawarma Plate (صحن حمص بالشاورما)",
        "grams": 320,
        "isDefault": true,
        "kcal": 707
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 221
      }
    ]
  },
  {
    "id": "sa_bait_broast_4pc",
    "name": "Golden Broast Bait Al Shawarma 4pc",
    "nameAr": "بروستد بيت الشاورما الذهبي 4 قطع",
    "brand": "Bait Al Shawarma",
    "brandId": "bait_al_shawarma",
    "brandCategory": "Broast",
    "category": "Broast",
    "cuisineTags": [
      "Broast",
      "Chicken",
      "Bait Al Shawarma"
    ],
    "region": "SA",
    "kcal100g": 265,
    "protein100g": 18.5,
    "carb100g": 14,
    "fat100g": 15,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 4.5,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 9,
    "servings": [
      {
        "label": "4pc Broast Meal with Fries (وجبة 4 قطع بروستد)",
        "grams": 360,
        "isDefault": true,
        "kcal": 954
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 265
      }
    ]
  },
  {
    "id": "sa_bait_shish_tawook",
    "name": "Bait Al Shawarma Shish Tawook Platter",
    "nameAr": "صحن شيش طاووق مع حمص وثوم بيت الشاورما",
    "brand": "Bait Al Shawarma",
    "brandId": "bait_al_shawarma",
    "brandCategory": "Grills",
    "category": "Grills",
    "cuisineTags": [
      "Grills",
      "Tawook",
      "Bait Al Shawarma"
    ],
    "region": "SA",
    "kcal100g": 169,
    "protein100g": 18,
    "carb100g": 5,
    "fat100g": 8.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 2.6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 5.1,
    "servings": [
      {
        "label": "1 Tawook Platter (صحن شيش طاووق)",
        "grams": 300,
        "isDefault": true,
        "kcal": 507
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 169
      }
    ]
  },
  {
    "id": "sa_bait_dynamite_fries",
    "name": "Loaded Dynamite Shawarma Fries",
    "nameAr": "بطاطس داينمايت شاورما وجبن بيت الشاورما",
    "brand": "Bait Al Shawarma",
    "brandId": "bait_al_shawarma",
    "brandCategory": "Appetizers",
    "category": "Appetizers",
    "cuisineTags": [
      "Fries",
      "Loaded",
      "Bait Al Shawarma"
    ],
    "region": "SA",
    "kcal100g": 282,
    "protein100g": 8.5,
    "carb100g": 27,
    "fat100g": 15.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 4.6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 9.3,
    "servings": [
      {
        "label": "1 Loaded Fries Plate (صحن بطاطس داينمايت)",
        "grams": 280,
        "isDefault": true,
        "kcal": 790
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 282
      }
    ]
  },
  {
    "id": "sa_bait_warak_enab",
    "name": "Stuffed Grape Leaves Warak Enab with Pomegranate",
    "nameAr": "ورق عنب حامض حلو بدبس الرمان بيت الشاورما",
    "brand": "Bait Al Shawarma",
    "brandId": "bait_al_shawarma",
    "brandCategory": "Appetizers",
    "category": "Appetizers",
    "cuisineTags": [
      "Appetizer",
      "Warak Enab",
      "Bait Al Shawarma"
    ],
    "region": "SA",
    "kcal100g": 179,
    "protein100g": 3.5,
    "carb100g": 22,
    "fat100g": 8.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 2.6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 5.1,
    "servings": [
      {
        "label": "6pc Stuffed Leaves (6 حبات ورق عنب)",
        "grams": 200,
        "isDefault": true,
        "kcal": 358
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 179
      }
    ]
  },
  {
    "id": "sa_bait_pomegranate_garlic",
    "name": "Pomegranate Molasses Garlic Dip",
    "nameAr": "ثومية بدبس الرمان بيت الشاورما",
    "brand": "Bait Al Shawarma",
    "brandId": "bait_al_shawarma",
    "brandCategory": "Sauces",
    "category": "Sauces",
    "cuisineTags": [
      "Sauce",
      "Garlic",
      "Bait Al Shawarma"
    ],
    "region": "SA",
    "kcal100g": 373,
    "protein100g": 1.2,
    "carb100g": 11,
    "fat100g": 36,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 10.8,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 21.6,
    "servings": [
      {
        "label": "1 Dip Cup (علبة صوص)",
        "grams": 45,
        "isDefault": true,
        "kcal": 168
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 373
      }
    ]
  },
  {
    "id": "sa_bait_meat_sambousah",
    "name": "Crispy Meat Sambousah 6pc",
    "nameAr": "سمبوسة لحم مقرمشة بيت الشاورما 6 حبات",
    "brand": "Bait Al Shawarma",
    "brandId": "bait_al_shawarma",
    "brandCategory": "Appetizers",
    "category": "Appetizers",
    "cuisineTags": [
      "Sambousah",
      "Appetizer",
      "Bait Al Shawarma"
    ],
    "region": "SA",
    "kcal100g": 249,
    "protein100g": 9,
    "carb100g": 25,
    "fat100g": 12.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.8,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 7.5,
    "servings": [
      {
        "label": "6pc Sambousah (6 حبات سمبوسة لحم)",
        "grams": 180,
        "isDefault": true,
        "kcal": 448
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 249
      }
    ]
  },
  {
    "id": "sa_bait_pomegranate_juice",
    "name": "Fresh Pomegranate Juice 100%",
    "nameAr": "عصير رمان طازج طبيعي 100% بيت الشاورما",
    "brand": "Bait Al Shawarma",
    "brandId": "bait_al_shawarma",
    "brandCategory": "Juices",
    "category": "Juices",
    "cuisineTags": [
      "Juice",
      "Pomegranate",
      "Bait Al Shawarma"
    ],
    "region": "SA",
    "kcal100g": 76,
    "protein100g": 0.7,
    "carb100g": 17.5,
    "fat100g": 0.3,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 0.1,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 0.2,
    "servings": [
      {
        "label": "Large Cup (كوب عصير رمان)",
        "grams": 350,
        "isDefault": true,
        "kcal": 266
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 76
      }
    ]
  },
  {
    "id": "sa_bait_mohalabia",
    "name": "Mohalabia Milk Pudding with Pistachio",
    "nameAr": "مهلبية الفستق وماء الزهر بيت الشاورما",
    "brand": "Bait Al Shawarma",
    "brandId": "bait_al_shawarma",
    "brandCategory": "Desserts",
    "category": "Desserts",
    "cuisineTags": [
      "Dessert",
      "Mohalabia",
      "Bait Al Shawarma"
    ],
    "region": "SA",
    "kcal100g": 171,
    "protein100g": 4.2,
    "carb100g": 24,
    "fat100g": 6.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 2,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 3.9,
    "servings": [
      {
        "label": "1 Cup (كوب مهلبية)",
        "grams": 140,
        "isDefault": true,
        "kcal": 239
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 171
      }
    ]
  },
  {
    "id": "sa_barns_dallah_gahwa",
    "name": "Barn's Traditional Dallah Saudi Gahwa",
    "nameAr": "دلة قهوة سعودية تقليدية مع الهيل والزعفران بارنز",
    "brand": "Barn's",
    "brandId": "barns",
    "brandCategory": "Saudi Traditional Coffee",
    "category": "Saudi Traditional Coffee",
    "cuisineTags": [
      "Coffee",
      "Gahwa",
      "Saudi Heritage",
      "Barns"
    ],
    "region": "SA",
    "kcal100g": 5,
    "protein100g": 0.2,
    "carb100g": 0.8,
    "fat100g": 0.1,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 0,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 0.1,
    "servings": [
      {
        "label": "Traditional Sharing Dallah (دلة ضيافة)",
        "grams": 500,
        "isDefault": true,
        "kcal": 25
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 5
      }
    ]
  },
  {
    "id": "sa_barns_cup_saudi_coffee",
    "name": "Barn's Single Cup Saudi Coffee",
    "nameAr": "فنجان قهوة سعودية شقراء بارنز",
    "brand": "Barn's",
    "brandId": "barns",
    "brandCategory": "Saudi Traditional Coffee",
    "category": "Saudi Traditional Coffee",
    "cuisineTags": [
      "Coffee",
      "Finjan",
      "Barns"
    ],
    "region": "SA",
    "kcal100g": 2,
    "protein100g": 0.1,
    "carb100g": 0.5,
    "fat100g": 0,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 0,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 0,
    "servings": [
      {
        "label": "1 Finjan (فنجان قهوة)",
        "grams": 80,
        "isDefault": true,
        "kcal": 2
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 2
      }
    ]
  },
  {
    "id": "sa_barns_turkish_coffee",
    "name": "Barn's Turkish Coffee with Cardamom",
    "nameAr": "قهوة تركية مع هيل ومستكة بارنز",
    "brand": "Barn's",
    "brandId": "barns",
    "brandCategory": "Brewed Coffee",
    "category": "Brewed Coffee",
    "cuisineTags": [
      "Coffee",
      "Turkish",
      "Barns"
    ],
    "region": "SA",
    "kcal100g": 10,
    "protein100g": 0.5,
    "carb100g": 1.5,
    "fat100g": 0.2,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 0.1,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 0.1,
    "servings": [
      {
        "label": "1 Cup (فنجان قهوة تركية)",
        "grams": 90,
        "isDefault": true,
        "kcal": 9
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 10
      }
    ]
  },
  {
    "id": "sa_barns_double_espresso",
    "name": "Barn's Double Espresso",
    "nameAr": "دبل إسبريسو غني بارنز",
    "brand": "Barn's",
    "brandId": "barns",
    "brandCategory": "Espresso",
    "category": "Espresso",
    "cuisineTags": [
      "Espresso",
      "Barns"
    ],
    "region": "SA",
    "kcal100g": 6,
    "protein100g": 0.4,
    "carb100g": 1,
    "fat100g": 0.1,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 0,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 0.1,
    "servings": [
      {
        "label": "Double Shot (دبل شوت)",
        "grams": 60,
        "isDefault": true,
        "kcal": 4
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 6
      }
    ]
  },
  {
    "id": "sa_barns_classic_americano",
    "name": "Barn's Classic Hot Americano",
    "nameAr": "أمريكانو كلاسيك ساخن بارنز",
    "brand": "Barn's",
    "brandId": "barns",
    "brandCategory": "Espresso",
    "category": "Espresso",
    "cuisineTags": [
      "Americano",
      "Black Coffee",
      "Barns"
    ],
    "region": "SA",
    "kcal100g": 5,
    "protein100g": 0.2,
    "carb100g": 1,
    "fat100g": 0,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 0,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 0,
    "servings": [
      {
        "label": "Medium Cup (كوب وسط)",
        "grams": 240,
        "isDefault": true,
        "kcal": 12
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 5
      }
    ]
  },
  {
    "id": "sa_barns_flat_white",
    "name": "Barn's Velvety Flat White",
    "nameAr": "فلات وايت بحليب مخملي بارنز",
    "brand": "Barn's",
    "brandId": "barns",
    "brandCategory": "Espresso with Milk",
    "category": "Espresso with Milk",
    "cuisineTags": [
      "Flat White",
      "Milk Coffee",
      "Barns"
    ],
    "region": "SA",
    "kcal100g": 63,
    "protein100g": 3.2,
    "carb100g": 4.8,
    "fat100g": 3.4,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 1,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 2,
    "servings": [
      {
        "label": "1 Cup (كوب فلات وايت)",
        "grams": 200,
        "isDefault": true,
        "kcal": 126
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 63
      }
    ]
  },
  {
    "id": "sa_barns_hot_spanish_latte",
    "name": "Barn's Hot Spanish Latte",
    "nameAr": "سبانش لاتيه بارنز ساخن بالحليب المكثف",
    "brand": "Barn's",
    "brandId": "barns",
    "brandCategory": "Specialty Lattes",
    "category": "Specialty Lattes",
    "cuisineTags": [
      "Spanish Latte",
      "Barns"
    ],
    "region": "SA",
    "kcal100g": 102,
    "protein100g": 3,
    "carb100g": 14.5,
    "fat100g": 3.6,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 1.1,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 2.2,
    "servings": [
      {
        "label": "Medium Cup (كوب سبانش لاتيه ساخن)",
        "grams": 260,
        "isDefault": true,
        "kcal": 265
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 102
      }
    ]
  },
  {
    "id": "sa_barns_iced_spanish_latte",
    "name": "Barn's Iced Spanish Latte",
    "nameAr": "سبانش لاتيه مثلج بارنز",
    "brand": "Barn's",
    "brandId": "barns",
    "brandCategory": "Specialty Lattes",
    "category": "Specialty Lattes",
    "cuisineTags": [
      "Spanish Latte",
      "Iced",
      "Barns"
    ],
    "region": "SA",
    "kcal100g": 103,
    "protein100g": 2.8,
    "carb100g": 15,
    "fat100g": 3.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 1.1,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 2.1,
    "servings": [
      {
        "label": "Iced Cup (كوب سبانش لاتيه بارد)",
        "grams": 320,
        "isDefault": true,
        "kcal": 330
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 103
      }
    ]
  },
  {
    "id": "sa_barns_hot_chocolate",
    "name": "Barn's Signature Hot Chocolate",
    "nameAr": "شوكولاتة ساخنة فاخرة بارنز",
    "brand": "Barn's",
    "brandId": "barns",
    "brandCategory": "Hot Beverages",
    "category": "Hot Beverages",
    "cuisineTags": [
      "Hot Chocolate",
      "Barns"
    ],
    "region": "SA",
    "kcal100g": 116,
    "protein100g": 3.5,
    "carb100g": 16,
    "fat100g": 4.2,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 1.3,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 2.5,
    "servings": [
      {
        "label": "Medium Cup (كوب شوكولاتة ساخنة)",
        "grams": 260,
        "isDefault": true,
        "kcal": 302
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 116
      }
    ]
  },
  {
    "id": "sa_barns_caramel_macchiato",
    "name": "Barn's Iced Salted Caramel Macchiato",
    "nameAr": "آيس كراميل ماكياتو بارنز",
    "brand": "Barn's",
    "brandId": "barns",
    "brandCategory": "Specialty Lattes",
    "category": "Specialty Lattes",
    "cuisineTags": [
      "Caramel Macchiato",
      "Barns"
    ],
    "region": "SA",
    "kcal100g": 105,
    "protein100g": 2.6,
    "carb100g": 16.5,
    "fat100g": 3.2,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 1,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 1.9,
    "servings": [
      {
        "label": "Iced Cup (كوب كراميل ماكياتو)",
        "grams": 320,
        "isDefault": true,
        "kcal": 336
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 105
      }
    ]
  },
  {
    "id": "sa_barns_date_cake",
    "name": "Barn's Saudi Date & Cinnamon Cake with Toffee",
    "nameAr": "كيكة التمر السعودية مع صوص التوفي بارنز",
    "brand": "Barn's",
    "brandId": "barns",
    "brandCategory": "Pastries",
    "category": "Pastries",
    "cuisineTags": [
      "Pastry",
      "Date Cake",
      "Barns"
    ],
    "region": "SA",
    "kcal100g": 334,
    "protein100g": 4.5,
    "carb100g": 52,
    "fat100g": 12,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 3.6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 7.2,
    "servings": [
      {
        "label": "1 Slice (شريحة كيكة تمر)",
        "grams": 110,
        "isDefault": true,
        "kcal": 367
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 334
      }
    ]
  },
  {
    "id": "sa_barns_chocolate_muffin",
    "name": "Barn's Double Chocolate Muffin",
    "nameAr": "مافن الشوكولاتة المزدوجة بارنز",
    "brand": "Barn's",
    "brandId": "barns",
    "brandCategory": "Pastries",
    "category": "Pastries",
    "cuisineTags": [
      "Pastry",
      "Muffin",
      "Barns"
    ],
    "region": "SA",
    "kcal100g": 369,
    "protein100g": 5.2,
    "carb100g": 50,
    "fat100g": 16.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 5,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 9.9,
    "servings": [
      {
        "label": "1 Muffin (قطعة مافن)",
        "grams": 100,
        "isDefault": true,
        "kcal": 369
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 369
      }
    ]
  },
  {
    "id": "sa_half_signature_iced",
    "name": "Signature Iced Half Million Latte",
    "nameAr": "آيس هاف مليون الشهير بالحليب الخاص",
    "brand": "Half Million",
    "brandId": "half_million",
    "brandCategory": "Signature Drinks",
    "category": "Signature Drinks",
    "cuisineTags": [
      "Signature",
      "Iced Coffee",
      "Half Million"
    ],
    "region": "SA",
    "kcal100g": 111,
    "protein100g": 3.2,
    "carb100g": 15.5,
    "fat100g": 4,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 1.2,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 2.4,
    "servings": [
      {
        "label": "Iced Cup (كوب آيس هاف مليون)",
        "grams": 350,
        "isDefault": true,
        "kcal": 389
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 111
      }
    ]
  },
  {
    "id": "sa_half_pistachio_latte",
    "name": "½ Million Iced Pistachio Latte",
    "nameAr": "آيس بستاشيو لاتيه هاف مليون مع فستق إيطالي",
    "brand": "Half Million",
    "brandId": "half_million",
    "brandCategory": "Signature Drinks",
    "category": "Signature Drinks",
    "cuisineTags": [
      "Pistachio",
      "Iced Latte",
      "Half Million"
    ],
    "region": "SA",
    "kcal100g": 132,
    "protein100g": 3.5,
    "carb100g": 17,
    "fat100g": 5.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 1.7,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 3.3,
    "servings": [
      {
        "label": "Iced Cup (كوب آيس بستاشيو)",
        "grams": 350,
        "isDefault": true,
        "kcal": 462
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 132
      }
    ]
  },
  {
    "id": "sa_half_spanish_latte_iced",
    "name": "½ Million Iced Spanish Latte",
    "nameAr": "آيس سبانش لاتيه هاف مليون بالحليب المكثف",
    "brand": "Half Million",
    "brandId": "half_million",
    "brandCategory": "Specialty Lattes",
    "category": "Specialty Lattes",
    "cuisineTags": [
      "Spanish Latte",
      "Iced",
      "Half Million"
    ],
    "region": "SA",
    "kcal100g": 106,
    "protein100g": 3,
    "carb100g": 15,
    "fat100g": 3.8,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 1.1,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 2.3,
    "servings": [
      {
        "label": "Iced Cup (كوب سبانش لاتيه)",
        "grams": 350,
        "isDefault": true,
        "kcal": 371
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 106
      }
    ]
  },
  {
    "id": "sa_half_spanish_latte_hot",
    "name": "½ Million Hot Spanish Latte",
    "nameAr": "سبانش لاتيه ساخن مخملي هاف مليون",
    "brand": "Half Million",
    "brandId": "half_million",
    "brandCategory": "Specialty Lattes",
    "category": "Specialty Lattes",
    "cuisineTags": [
      "Spanish Latte",
      "Hot",
      "Half Million"
    ],
    "region": "SA",
    "kcal100g": 105,
    "protein100g": 3.2,
    "carb100g": 14.5,
    "fat100g": 3.8,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 1.1,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 2.3,
    "servings": [
      {
        "label": "Hot Cup (كوب سبانش لاتيه ساخن)",
        "grams": 260,
        "isDefault": true,
        "kcal": 273
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 105
      }
    ]
  },
  {
    "id": "sa_half_v60_drip",
    "name": "½ Million Specialty Ethiopian V60 Drip",
    "nameAr": "قهوة V60 مقطرة إثيوبية هاف مليون",
    "brand": "Half Million",
    "brandId": "half_million",
    "brandCategory": "Filter Coffee",
    "category": "Filter Coffee",
    "cuisineTags": [
      "Filter Coffee",
      "V60",
      "Half Million"
    ],
    "region": "SA",
    "kcal100g": 4,
    "protein100g": 0.2,
    "carb100g": 0.7,
    "fat100g": 0,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 0,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 0,
    "servings": [
      {
        "label": "1 Filter Cup (كوب قهوة مقطرة)",
        "grams": 250,
        "isDefault": true,
        "kcal": 10
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 4
      }
    ]
  },
  {
    "id": "sa_half_chemex",
    "name": "½ Million Chemex Brewed Coffee",
    "nameAr": "قهوة كيمكس مقطرة صافية هاف مليون",
    "brand": "Half Million",
    "brandId": "half_million",
    "brandCategory": "Filter Coffee",
    "category": "Filter Coffee",
    "cuisineTags": [
      "Filter Coffee",
      "Chemex",
      "Half Million"
    ],
    "region": "SA",
    "kcal100g": 4,
    "protein100g": 0.2,
    "carb100g": 0.7,
    "fat100g": 0,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 0,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 0,
    "servings": [
      {
        "label": "1 Chemex Cup (كوب كيمكس)",
        "grams": 280,
        "isDefault": true,
        "kcal": 11
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 4
      }
    ]
  },
  {
    "id": "sa_half_cold_brew",
    "name": "½ Million Nitro Cold Brew Coffee",
    "nameAr": "كولد برو نيتروجين بارد ومكثف هاف مليون",
    "brand": "Half Million",
    "brandId": "half_million",
    "brandCategory": "Cold Brews",
    "category": "Cold Brews",
    "cuisineTags": [
      "Cold Brew",
      "Nitro",
      "Half Million"
    ],
    "region": "SA",
    "kcal100g": 6,
    "protein100g": 0.3,
    "carb100g": 0.9,
    "fat100g": 0.1,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 0,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 0.1,
    "servings": [
      {
        "label": "Cold Cup (كوب كولد برو)",
        "grams": 280,
        "isDefault": true,
        "kcal": 17
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 6
      }
    ]
  },
  {
    "id": "sa_half_flat_white",
    "name": "½ Million Microfoam Flat White",
    "nameAr": "فلات وايت كلاسيكي فاخر هاف مليون",
    "brand": "Half Million",
    "brandId": "half_million",
    "brandCategory": "Espresso with Milk",
    "category": "Espresso with Milk",
    "cuisineTags": [
      "Flat White",
      "Half Million"
    ],
    "region": "SA",
    "kcal100g": 64,
    "protein100g": 3.4,
    "carb100g": 4.8,
    "fat100g": 3.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 1.1,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 2.1,
    "servings": [
      {
        "label": "1 Cup (كوب فلات وايت)",
        "grams": 200,
        "isDefault": true,
        "kcal": 128
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 64
      }
    ]
  },
  {
    "id": "sa_half_cortado",
    "name": "½ Million Spanish Cortado",
    "nameAr": "كورتادو متوازن هاف مليون",
    "brand": "Half Million",
    "brandId": "half_million",
    "brandCategory": "Espresso with Milk",
    "category": "Espresso with Milk",
    "cuisineTags": [
      "Cortado",
      "Half Million"
    ],
    "region": "SA",
    "kcal100g": 66,
    "protein100g": 3.5,
    "carb100g": 4.8,
    "fat100g": 3.6,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 1.1,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 2.2,
    "servings": [
      {
        "label": "1 Glass (كوب كورتادو)",
        "grams": 130,
        "isDefault": true,
        "kcal": 86
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 66
      }
    ]
  },
  {
    "id": "sa_half_san_sebastian",
    "name": "½ Million Basque San Sebastian Cheesecake",
    "nameAr": "تشيز كيك سان سباستيان الإسباني هاف مليون",
    "brand": "Half Million",
    "brandId": "half_million",
    "brandCategory": "Pastries",
    "category": "Pastries",
    "cuisineTags": [
      "Dessert",
      "Cheesecake",
      "San Sebastian",
      "Half Million"
    ],
    "region": "SA",
    "kcal100g": 328,
    "protein100g": 6.5,
    "carb100g": 26,
    "fat100g": 22,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 6.6,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 13.2,
    "servings": [
      {
        "label": "1 Slice with Caramel (شريحة تشيز كيك)",
        "grams": 130,
        "isDefault": true,
        "kcal": 426
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 328
      }
    ]
  },
  {
    "id": "sa_half_croissant",
    "name": "½ Million Butter Flaky French Croissant",
    "nameAr": "كرواسون زبدة فرنسي فاخر هاف مليون",
    "brand": "Half Million",
    "brandId": "half_million",
    "brandCategory": "Pastries",
    "category": "Pastries",
    "cuisineTags": [
      "Pastry",
      "Croissant",
      "Half Million"
    ],
    "region": "SA",
    "kcal100g": 374,
    "protein100g": 7.5,
    "carb100g": 42,
    "fat100g": 19.5,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 5.9,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 11.7,
    "servings": [
      {
        "label": "1 Croissant (قطعة كرواسون)",
        "grams": 85,
        "isDefault": true,
        "kcal": 318
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 374
      }
    ]
  },
  {
    "id": "sa_half_cookie",
    "name": "½ Million Chewy Chocolate Chip Cookie",
    "nameAr": "كوكيز شوكولاتة كرانشي وطري هاف مليون",
    "brand": "Half Million",
    "brandId": "half_million",
    "brandCategory": "Pastries",
    "category": "Pastries",
    "cuisineTags": [
      "Pastry",
      "Cookie",
      "Half Million"
    ],
    "region": "SA",
    "kcal100g": 434,
    "protein100g": 5.2,
    "carb100g": 56,
    "fat100g": 21,
    "fibre100g": 1,
    "sugar100g": 1,
    "sodiumMg100g": 400,
    "satFat100g": 6.3,
    "source": "sfda",
    "sourceRef": "SFDA_RESTAURANT_CALORIE_MANDATE_2024",
    "confidence": 0.98,
    "oilAddedG": 12.6,
    "servings": [
      {
        "label": "1 Cookie (قطعة كوكيز)",
        "grams": 75,
        "isDefault": true,
        "kcal": 326
      },
      {
        "label": "100g",
        "grams": 100,
        "isDefault": false,
        "kcal": 434
      }
    ]
  }
];
