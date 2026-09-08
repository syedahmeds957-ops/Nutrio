# Dashboard Enhancements Design Specification

**Date:** 2026-09-04  
**Status:** Approved  
**Topic:** Impressive, Efficient & Animated User Dashboard Enhancements (Option C: AI Recommendation, Weekly Bank, Quick Staples, Streak Halo)

---

## 1. Goal
Upgrade the Nutrio User Dashboard (`TrackerDashboardScreen.tsx`) into an efficient, visually impressive, and interactive experience while strictly preserving all existing engine math, local offline tracking, and Light Emerald design system standards.

---

## 2. Features Included in Option C

### A. Streak & Consistency Halo (`StreakBadge.tsx` / Header Enhancement)
- Located directly in the top user greeting card.
- Displays:
  - `🔥 7-Day Streak` with a subtle looping pulse/scale animation.
  - 7-day micro dot calendar (Mon - Sun) with green filled dots for logged days and an active pulse ring on today.
- Provides immediate positive reinforcement upon opening the app.

### B. Dynamic AI Coach "Daily Bite" Recommendation Card (`AiRecommendationCard.tsx`)
- Appears dynamically below the Wellness ring gauge.
- Evaluates remaining calories and protein:
  - If remaining calories > 400: recommends high-protein Pakistani dinner/lunch options (e.g. *Chicken Tikka + Whole Wheat Roti + Mint Raita* - 510 kcal, 44g protein).
  - If remaining calories < 300: recommends light recovery snack (e.g. *Cucumber Salad with Lemon & Boiled Egg* - 140 kcal, 13g protein).
- Interactive actions:
  - `[+ Quick Log Suggestion]`: 1-tap logs the recommended items into the current meal slot via `engine.logItem`.
  - `[💬 Ask Coach]`: Navigates to `CoachChatScreen` with pre-filled question context.
- Smooth entrance animation with subtle slide and fade.

### C. Weekly Rolling Calorie Bank Card (`WeeklyCalorieBankCard.tsx`)
- Displays 7-day rolling energy balance:
  - Visual mini bar chart showing daily intake relative to the baseline target line.
  - Summary chip: `"-2,450 kcal rolling weekly deficit · On track for 0.5 kg fat loss"`.
  - Reassures the user against single-day guilt (e.g., dawat or shaadi surplus offset by earlier weekday deficits).

### D. Quick Staples 1-Tap Logging Bar (`QuickStaplesBar.tsx`)
- Horizontal scrolling carousel of the 4 most common Pakistani food items:
  - `+ 1 Whole Wheat Roti (120 kcal)`
  - `+ 1 Katori Daal Chana (160 kcal)`
  - `+ 1 Boiled Egg (75 kcal)`
  - `+ 1 Cup Chai (85 kcal)`
- Tapping instantly logs 1 serving into the current slot with a cheerful toast / micro-animation confirmation.
- 1-tap `[📸 Scan Plate]` floating button to jump straight into AI vision scanning without scrolling.

---

## 3. Design System & Minimalist Animations
- **Colors**: Canvas `#F6F8F6`, Surfaces `#FFFFFF`, Primary `#10B981`, Slate Text `#1E293B`, Subtext `#64748B`.
- **Typography**: `Plus Jakarta Sans` across all headings and stat numbers.
- **Icons**: Vector SVG icons (`apps/mobile/src/ui/Icon.tsx`).
- **Animations**: Built with React Native's native `Animated` API:
  - Pulse on streak flame and active day ring.
  - Spring expand/collapse on cards.
  - Tactile touch feedback scale (`transform: [{ scale: 0.97 }]`) on buttons.

---

## 4. Preservation of Existing Architecture
- All existing tracking logic in `TrackerEngine` (`engine.logItem`, `engine.logWater`, `engine.deleteItem`, `engine.getSummary()`) remains 100% untouched and functional.
- All existing tests (156 tests) must remain green.
