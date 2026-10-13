# Architectural Design: Saudi Arabia Cuisine, Restaurant Catalog & Multi-Region Expansion

## 1. Overview & Objectives

Nutrio is expanding from Pakistan to the Kingdom of Saudi Arabia (KSA). This design establishes a native multi-region architecture (`PK` and `SA`) providing:
1. **Automated Geolocation & Region Switcher**: Automatically detects whether the user is located in Saudi Arabia or Pakistan via IP lookup on launch, with a manual toggle in the app header and profile settings.
2. **Saudi Food & Restaurant Catalog (SFDA-Compliant)**: Curates 12+ top Saudi restaurant chains (AlBaik, Al Tazaj, Kudu, Herfy, Shawarmer, Mama Noura, Al Romansiah, Maestro Pizza, Hamburgini, Bait Al Shawarma, Barn's, Half Million) with 300+ items, and 150+ authentic traditional Saudi dishes (Kabsa, Mandi, Saleeg, Jareesh, Mutabbaq, Ma'soub, Gahwa, Dates, etc.) adhering to Saudi Food and Drug Authority (SFDA) caloric disclosure regulations.
3. **Bilingual Arabic & English (العربية / English)**: Every Saudi dish and brand features accurate Arabic typography alongside English.
4. **Vector Brand Logo System**: Native vector brand logos for Saudi chains in `BrandLogo.tsx`.
5. **Cultural AI Coach & Currency Adaptation**: Saudi currency (`SAR`), dietary factors (Gahwa, Sukari/Ajwa dates, Laban, large-portion Kabsa feasts), and regional eating habits.

---

## 2. Multi-Region Data Architecture

### 2.1 Type Extensions (`packages/food-db/src/types.ts`)

```typescript
export type RegionCode = 'PK' | 'SA' | 'GLOBAL';

export interface NormalizedFood {
  id?: string;
  name: string;
  nameUr?: string;              // Urdu (for PK)
  nameAr?: string;              // Arabic (for SA)
  brand?: string;
  brandCategory?: string;
  region: RegionCode;           // 'PK' | 'SA' | 'GLOBAL'
  category: string;
  cuisineTags: string[];        // e.g. ['Saudi', 'Kabsa', 'AlBaik', 'Fast-Food']
  kcal100g: number;
  protein100g: number;
  carb100g: number;
  fat100g: number;
  fibre100g: number;
  sugar100g: number;
  sodiumMg100g: number;
  satFat100g: number;
  source: 'usda' | 'indb' | 'pak_custom' | 'sfda' | 'saudi_custom' | 'user';
  sourceRef?: string;           // e.g. 'SFDA_OFFICIAL_DECLARATION'
  confidence?: number;
  servings: FoodServingItem[];
  modifiers?: FoodModifier[];
}

export interface RestaurantBrand {
  id: string;
  name: string;
  nameUr?: string;
  nameAr?: string;              // Arabic brand name (e.g. البيك)
  tagline: string;
  taglineAr?: string;           // Arabic tagline (e.g. أشهر بروستد في المملكة)
  icon: string;
  region: RegionCode;           // 'PK' | 'SA'
  brandGroup?: string;          // 'Fast Food' | 'Traditional' | 'Café' | 'Shawarma'
  categories: string[];
  menuCount?: number;
  itemCount?: number;
}
```

### 2.2 Backward Compatibility
- Existing Pakistani items receive `region: 'PK'` and default `nameUr`.
- Shared generic staples (e.g. Water, White Rice, Boiled Egg, Olive Oil) receive `region: 'GLOBAL'`.
- All existing tests in `@nutrio/food-db` and `@nutrio/mobile` continue to pass without modifications.

---

## 3. Geolocation & Region Detection Engine

### 3.1 Region State Management (`apps/mobile/src/common/region/regionContext.tsx`)

```typescript
export type Region = 'PK' | 'SA';

export interface RegionState {
  activeRegion: Region;
  currencySymbol: string;     // 'Rs.' for PK, 'SAR' (ر.س) for SA
  currencyCode: 'PKR' | 'SAR';
  isAutoDetected: boolean;
  setRegion: (region: Region) => void;
}
```

### 3.2 Detection Flow
1. **Step 1 - Local Storage Check**: Inspect `AsyncStorage` for key `nutrio_user_region`. If found, use cached preference.
2. **Step 2 - IP Geolocation Lookup**: If no cached preference exists:
   - Call lightweight endpoint (e.g., `https://ipapi.co/json` or Supabase Edge geolocation header `cf-ipcountry`).
   - If response `country_code === 'SA'`, set active region to `SA`.
   - If response `country_code === 'PK'` or any other default, set active region to `PK`.
   - Store in `AsyncStorage`.
3. **Step 3 - Header Region Selector**:
   - The top header renders a compact capsule badge (`🇵🇰 PK` / `🇸🇦 SA`).
   - Tapping it opens a modal allowing instant region switching without requiring account re-creation.

---

## 4. Saudi Food Catalog & Nutritional Content

### 4.1 Saudi Restaurant Chains (`packages/food-db/src/data/saudi-restaurants.data.ts`)

| Brand ID | English Name | Arabic Name | Category | Signature Items |
|---|---|---|---|---|
| `albaik` | AlBaik | البيك | Fast Food (Broast) | 4pc Chicken Meal, Spicy Nuggets (مسحب), Big Baik, Garlic Dip |
| `al_tazaj` | Al Tazaj | الطازج | BBQ Chicken & Mandi | Farrouj Meshwi (فروج مشوي), Tazaj Kabsa, Tahina, Kebab wrap |
| `kudu` | Kudu | كودو | Fast Food Sandwiches | Kudu Chicken Sandwich, Kudu Beef, Breakfast Platter |
| `herfy` | Herfy | هرفي | Burgers & Fast Food | Super Herfy, Angus Burger, Chicken Tortilla, Curly Fries |
| `shawarmer` | Shawarmer | شاورمر | Gourmet Shawarma | Arabo (عربو), Dhabab, Batata Harra, Garlic dip |
| `mama_noura` | Mama Noura | ماما نورة | Shawarma & Juices | Saroukh Shawarma, Layered Cocktail Juice (طبقات), Falafel |
| `al_romansiah` | Al Romansiah | الرومانسية | Traditional Rice & Meat | Hashi Madhbi (مضبي حاشي), Lamb Mandi, Jareesh, Qursan |
| `maestro_pizza` | Maestro Pizza | مايسترو بيتزا | Pizza | Ranch Chicken Pizza, Pepperoni, Garlic Breadsticks |
| `hamburgini` | Hamburgini | همبرغيني | Smash Burgers | Double Smash Hamburgini, Thin Cut Fries, Truffle Sauce |
| `bait_al_shawarma`| Bait Al Shawarma | بيت الشاورما | Shawarma & Broast | Jumbo Shawarma Plate, Broast Chicken, Mixed Mezze |
| `barns` | Barn's | بارنز | Saudi Café | Saudi Gahwa Dallah, Karak Tea, Spanish Latte |
| `half_million` | Half Million (½M) | هاف مليون | Specialty Coffee | Iced Signature Latte, Cold Drip, Dates Cake |

### 4.2 Traditional Saudi Home Foods (`packages/food-db/src/data/saudi-traditional.data.ts`)

1. **Rice & Meat**:
   - Chicken Kabsa (كبسة دجاج - 620 kcal/portion)
   - Lamb Mandi (مندي لحم - 740 kcal/portion)
   - Hashi / Camel Madhbi (مضبي حاشي - 680 kcal/portion)
   - Saleeg Taifi with chicken (سليق طائفي - 580 kcal/portion)
   - Bukhari Rice with chicken (رز بخاري - 650 kcal/portion)
   - Sayyadiyah Fish Rice (صيادية سمك - 530 kcal/portion)
   - Lamb Hanith (حنيذ لحم - 760 kcal/portion)
2. **Traditional Slow Dishes & Soups**:
   - Najdi Jareesh (جريش نجد مع الكشنة - 320 kcal/bowl)
   - Saudi Harees (هريس باللحم - 360 kcal/bowl)
   - Qursan with vegetables and meat (قرصان - 390 kcal/portion)
   - Shorbat Hab (شوربة حب باللحم - 210 kcal/bowl)
3. **Breakfast, Pastries & Snacks**:
   - Mutabbaq Meat & Egg (مطبق لحم - 480 kcal)
   - Mutabbaq Sweet Banana (مطبق حلو بالموز - 420 kcal)
   - Ma'soub Malaki with cream and honey (معصوب ملكي - 580 kcal/bowl)
   - Shakshuka with flatbread (شكشوكة - 310 kcal)
   - Foul Mudammas with olive oil (فول مدمس - 240 kcal/bowl)
   - Sambousah Beef/Cheese (سمبوسة لحم / جبن - 95 kcal/piece)
4. **Saudi Gahwa, Dates & Dairy**:
   - Saudi Arabic Coffee with Cardamom (قهوة سعودية - 2 kcal/finjan)
   - Sukari Dates (تمر سكري - 28 kcal/date)
   - Ajwa Dates (تمر عجوة - 26 kcal/date)
   - Khalas Dates (تمر خلاص - 27 kcal/date)
   - Almarai Full Fat Laban (لبن كامل الدسم - 120 kcal/cup)
   - Almarai Low Fat Laban (لبن قليل الدسم - 85 kcal/cup)

---

## 5. Vector Brand Logo System Expansion

In `apps/mobile/src/ui/BrandLogo.tsx`, add brand cases with official vector styling:
- **`albaik`**: Yellow circular canvas (`#FFC20E`), white top-hat chicken mascot with red beak and bow (`#ED1C24`).
- **`al_tazaj`**: Emerald green canvas (`#0A6836`), yellow chick emblem and gold Arabic typography.
- **`kudu`**: Navy blue and sunshine yellow badge (`#002D72` / `#FFC72C`) with the Kudu gazelle silhouette.
- **`shawarmer`**: Charcoal canvas (`#1F2937`) with electric orange rotating shawarma spit emblem (`#F97316`).
- **`herfy`**: Classic red and gold badge (`#DC2626` / `#FBBF24`) with Herfy crown emblem.
- **`al_romansiah`**: Royal burgundy canvas (`#4A0404`) with gold Saudi palm and crossed swords crest.
- **`mama_noura`**: Vibrant orange and fresh lime badge (`#F97316` / `#84CC16`) with fresh juice chalice.
- **`maestro_pizza`**: Bright orange badge (`#FF6B00`) with Maestro chef hat.
- **`hamburgini`**: Clean monochrome black and white burger monogram (`#111827`).
- **`barns`**: Coffee-roast brown canvas (`#3B2219`) with golden coffee bean crest.
- **`half_million`**: Sleek slate black canvas (`#0F172A`) with minimalist "½M" gold typography.

---

## 6. Cultural AI Coach & Survey Adaptation

### 6.1 Onboarding Survey (`StepLifestyleDesi.tsx` / `StepLifestyleSaudi.tsx`)
- In `SA` mode, replace chai counters with:
  - **Saudi Gahwa & Dates intake**: Daily finjans of Gahwa + number of dates consumed.
  - **Laban intake**: Glasses per day.
  - **Weekly Delivery Frequency**: Orders from Hungerstation / Jahez / Chefz.
  - **Weekly Family Kabsa / Istiraha Feasts**: Eating from shared platters.
- Budget tier in `StepPreferencesBudget.tsx` adapts from PKR to **SAR** (e.g. `200 SAR/week`, `400 SAR/week`, `700+ SAR/week`).

### 6.2 AI Coach Engine Context (`packages/nutrition-core/src/coach-context.ts`)
- Injects Saudi cultural context:
  - Dates carry rapid sugar load (5 Sukari dates = ~140 kcal of carbs).
  - Shared Kabsa eating makes gram tracking challenging; coach emphasizes palm-size protein and fist-size rice approximations.
  - Late-night dining culture (supper at 10:00 PM - 11:30 PM) buffered through adaptive daily macro distribution.

---

## 7. Phased Implementation Strategy

- **Phase 1: Multi-Region Core & Geolocation Engine**
  - Update `@nutrio/food-db` types (`RegionCode`, `nameAr`, `region`).
  - Implement `regionService` & `regionContext` in mobile app with IP detection and manual toggle.
- **Phase 2: Saudi Food Database & Restaurant Catalog**
  - Build `saudi-restaurants.data.ts` (12+ chains, 300+ items).
  - Build `saudi-traditional.data.ts` (150+ home foods).
  - Integrate into `packages/food-db/src/data/index.ts` and search indexing.
- **Phase 3: Vector Brand Logos for Saudi Chains**
  - Add vector logos for AlBaik, Al Tazaj, Kudu, Shawarmer, Herfy, Al Romansiah, Mama Noura, Maestro, etc. in `BrandLogo.tsx`.
- **Phase 4: Meal Log Hub & Brand Menu UI Adaptation**
  - Update `MealLogHubModal.tsx` and `BrandMenuModal.tsx` to display Saudi brands when `SA` is active, with bilingual Arabic & English titles.
- **Phase 5: Currency, Survey & Cultural AI Coach Integration**
  - Adapt currency formatters (`SAR` vs `PKR`).
  - Adapt lifestyle survey questions for Saudi users.
  - Calibrate AI Coach system prompt for Saudi dietary habits.
- **Phase 6: Verification, Tests & Final Review**
  - Run full test suite across food-db, nutrition-core, and mobile.
  - Verify 100% tests pass and zero TypeScript errors.
