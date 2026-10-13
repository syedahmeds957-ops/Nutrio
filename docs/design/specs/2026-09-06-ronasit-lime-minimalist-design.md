# Design Specification: Nutrio Solid Lime Minimalist UI (Dark & Light Modes, 100% Free)

**Date:** 2026-09-06  
**Status:** Approved by User  
**Target:** End-to-end screen redesign, Dark & Light Mode toggle, Solid Lime hero card, and 100% Free with zero paywalls.

---

## 1. Executive Summary & Design Vision

The user requested:
1. **Solid Lime Color:** Instead of a gradient, use a punchy **solid electric lime** (`#D4FF00` / `#E2FA36`) for the hero cards, action pills, and active indicators, with high-contrast pitch-black typography (`#0A0B0D`), matching the Revolut design reference.
2. **Dual Mode (Dark & Light) in User Settings:**
   - **Dark Mode (Default):** Pitch dark graphite canvas (`#0C0D10`), charcoal metric cards (`#18191E`), solid lime hero card, floating dark capsule bar.
   - **Light Mode:** Pale alabaster slate canvas (`#F6F7FB`), pure white metric cards (`#FFFFFF`), solid lime hero card, floating black capsule bar.
   - User can switch between Dark and Light mode anytime via the profile/settings modal.
3. **100% Free with Zero Paywalls or Payment Methods:**
   - Complete removal of `PaywallModal`, subscription prompts, and payment gateways.
   - All 60+ Pakistani & international restaurant brands, unlimited AI coach queries, adaptive weekly check-in, weekly bank, customizer, and diary are completely free.
4. **Refined Swiss Minimalist Typography:**
   - High-clarity geometric sans-serif (`-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif`) with light letter tracking on uppercase labels (`letterSpacing: 0.8`) and clean tabular digits.

---

## 2. Design Token System (`src/theme.ts`)

```typescript
export interface ThemeColors {
  isDark: boolean;
  canvas: string;
  surface: string;
  surfaceSecondary: string;
  border: string;
  borderSubtle: string;

  // Solid Lime Accent (Hero & Highlights)
  primaryLime: string;       // #D4FF00
  limeText: string;          // #0A0B0D (high-contrast pitch black on lime)

  // Floating Capsule Bar
  floatingBarBg: string;
  floatingBarActive: string;
  floatingBarInactive: string;

  // Typography
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Metric Indicators
  protein: string;
  carbs: string;
  fat: string;
  banked: string;
  water: string;
}

export const darkColors: ThemeColors = {
  isDark: true,
  canvas: '#0C0D10',
  surface: '#18191E',
  surfaceSecondary: '#22242B',
  border: '#2A2D37',
  borderSubtle: '#1F2128',

  primaryLime: '#D4FF00',
  limeText: '#0A0B0D',

  floatingBarBg: '#18191E',
  floatingBarActive: '#D4FF00',
  floatingBarInactive: '#6C7080',

  textPrimary: '#FFFFFF',
  textSecondary: '#A0A4B0',
  textMuted: '#6C7080',
  textInverse: '#0A0B0D',

  protein: '#3B82F6',
  carbs: '#D4FF00',
  fat: '#F59E0B',
  banked: '#10B981',
  water: '#0EA5E9',
};

export const lightColors: ThemeColors = {
  isDark: false,
  canvas: '#F6F7FB',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F3F7',
  border: '#E8EAEE',
  borderSubtle: '#F0F2F5',

  primaryLime: '#D4FF00',
  limeText: '#0A0B0D',

  floatingBarBg: '#111215',
  floatingBarActive: '#D4FF00',
  floatingBarInactive: '#8E929B',

  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  protein: '#3B82F6',
  carbs: '#D4FF00',
  fat: '#F59E0B',
  banked: '#10B981',
  water: '#0EA5E9',
};
```

---

## 3. Screen-by-Screen Architecture & User Flow

### Screen 1: Welcome & Landing (`HomeScreen.tsx`)
- Sleek minimalist Nutrio wordmark.
- Solid lime preview hero card with "100% Free Nutrition Intelligence".
- Theme toggle icon (Sun/Moon) right in the top bar.
- Direct entry: "Start Assessment" or "Explore as Guest".

### Screen 2: Biometric Onboarding Survey (`OnboardingSurveyScreen.tsx`)
- 4-step wizard with 22px rounded cards, hairline borders, and refined typography.
- Real-world activity examples and safe pacing slider (0.25 to 1.0 kg/wk with safe health guardrails).

### Screen 3: Telemetry Plan Reveal (`PlanWorkflowScreen.tsx`)
- Calculation telemetry sequence showing BMR (Mifflin-St Jeor), TDEE, and safe deficit.
- Solid lime target reveal card showing daily calories and exact macro split.

### Screen 4: Main Active Tracker Dashboard (`TrackerDashboardScreen.tsx`)
- Solid Lime Hero Card: `1,840 kcal remaining` with 7 vertical intake bars.
- 2x2 Metric Grid: Protein, Carbs, Fat, and Weekly Banked calories with micro-arrows.
- Floating Capsule Bar at bottom with Home, Log, Trends, Settings tabs.

### Screen 5: Unified Food Search & Restaurant Catalog (`UnifiedLogMealModal.tsx`)
- All paywalls, subscription modals, and payment methods completely removed.
- Instant search across 60+ Pakistani & international brands with trust badges (`OFFICIAL`, `DERIVED`, `≈ ESTIMATED`).

### Screen 6: Calorify-Style Dish Customizer Modal (`ItemCustomizerModal.tsx`)
- Serving size slider with realistic household units (1 plate, grams, etc.).
- Cooking fat selector (Ghee, Mustard Oil, Vegetable Oil, Olive Oil, Steamed/Dry).
- Real-time recalculation of calories and macros without glitches.

### Screen 7: Food Diary & Calorie Bank (`DailySummaryCard.tsx`, `DayPicker.tsx`)
- Daily timeline with surplus/deficit roll-forward.
- Clean meal cards with delete action and instant macro totals.

### Screen 8: Weigh-In & Weight Trend Tracker (`WeightTrackerScreen.tsx`, `WeighInLogModal.tsx`)
- Fast weigh-in logging modal.
- 7-day Exponential Moving Average (EMA) weight curve smoothing out day-to-day water retention fluctuations.

### Screen 9: AI Nutrition Coach Chat (`CoachChatScreen.tsx`)
- Unlimited chat messages with Pakistani meal memory and instant tips.
- Completely free without restrictions.

### Screen 10: Settings & Theme Switcher (`SettingsModal.tsx` / Header Toggle)
- Quick toggle for "Dark Mode" and "Light Mode".
- Profile info and goal revision shortcuts.

---

## 4. Verification & Testing Plan
- All 52 monorepo test files (234 tests) passing.
- Tests updated to confirm 100% free unlocked access.
- Visual inspection on Expo dev server (`http://localhost:8081`).
