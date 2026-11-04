# AI Meal Photo Calorie Estimation & AI Coach Conversation Design

**Date**: 2026-09-04  
**Status**: Approved for Implementation  
**Monorepo Packages Touched**: `apps/mobile`, `@nutrio/nutrition-core`

---

## 1. Executive Summary

This feature enhances Nutrio's daily meal tracking and coaching experience by introducing:
1. **Meal Photo Upload & AI Calorie Estimation**: Users can capture or upload a meal photo (Breakfast, Lunch, Dinner, Snacks & Chai). An AI Vision model (OpenAI `gpt-4o-mini` or Google Gemini `gemini-1.5-flash`) analyzes the photo to identify South Asian and Pakistani dishes and estimate portions in grams. The items are then deterministically matched against Nutrio's 527 authentic Pakistani food database (`@nutrio/food-db`), providing mathematically exact calories, protein, carbs, fat, and cooking oil grams with 1-tap logging.
2. **Context-Aware AI Coach Conversation**: The Coach tab is connected to a live conversational AI engine that receives the user's real-time daily metrics (target vs consumed calories, remaining budget, macro targets, and cultural levers like cooking oil in handis, chai habits, and dawat/shaadi strategies).
3. **Streamlined UX**: The microphone tab is removed to keep the interface clean, focusing on high-speed text search and photo AI scanning.

---

## 2. Architecture & Component Structure

```
apps/mobile/src/
├── ai/
│   ├── types.ts                   # Interfaces for Vision and Coach Chat requests/responses
│   ├── ai-service.ts              # Unified client supporting OpenAI, Gemini & intelligent local fallback
│   ├── apiKeyStorage.ts           # Secure client-side & env key retriever (OpenAI / Gemini)
│   └── __tests__/
│       └── ai-service.test.ts     # Automated tests for AI client, parsing, and fallback
├── tracker/ui/
│   ├── UnifiedLogMealModal.tsx    # 2-tab interface (Search / Manual + AI Photo Scanner)
│   └── TrackerDashboardScreen.tsx # Passes active user targets & summary to Coach context
└── coach/ui/
    └── CoachChatScreen.tsx        # Live AI conversation, typing indicator, dynamic suggested chips
```

---

## 3. Data Flow & Mechanics

### 3.1 AI Meal Photo Calorie Estimation Flow
1. **User Action**: In `TrackerDashboardScreen`, user taps `+ Add Food` on a meal slot (e.g. Lunch).
2. **Tab Selection**: User switches to **"📸 AI Photo Scan"**.
3. **Photo Selection**:
   - Tapping **"Select or Take Meal Photo"** triggers native HTML5 file selection (`accept="image/*"`).
   - Reads image as Base64 Data URL, validates file size/type, and renders a clean thumbnail preview.
4. **AI Vision Request**:
   - User taps **"Analyze Meal with AI"**.
   - `aiService.analyzeMealPhoto({ imageBase64, contextNote })` executes:
     - **OpenAI (`gpt-4o-mini`)**: Uses chat completions with vision payload and strict JSON schema output.
     - **Google Gemini (`gemini-1.5-flash`)**: Uses `generateContent` with `inlineData` image and system instruction.
     - **Intelligent Fallback**: If no key is set or offline, detects staples based on context note (e.g., biryani, karahi, daal roti) using deterministic domain rules.
5. **Deterministic Calorie Calculation**:
   - The detected dishes and estimated gram masses are passed to `resolveDetectedPlate()` from `@nutrio/nutrition-core`.
   - Resolves against `PAKISTANI_STAPLES_DATA` (`@nutrio/food-db`).
   - Calculates exact kcal, protein, carbs, fat, and cooking oil without hallucinated numbers.
6. **Review & Log**:
   - Opens `MealPlateReviewModal` with the resolved dishes and portion steppers.
   - User taps **"Confirm & Log Meal"** to add all items to their daily slot.

### 3.2 AI Coach Conversation Flow
1. **User Action**: User taps the **"🧑‍⚕️ Coach"** tab from the top navigation.
2. **Context Compilation**:
   - Compiles live `CoachContext`:
     - `remainingCalories` = `targets.targetCalories - summary.caloriesConsumed`
     - `targets` = calorie and macro targets
     - `todaySummary` = actual protein, carbs, fat consumed today
     - Cultural profile (Pakistani dietary preferences, cooking oil levers, tea consumption)
3. **Message Exchange**:
   - User types a query or taps a suggestion chip.
   - User message is appended to the conversation history.
   - `aiService.sendCoachMessage(messages, coachContext)` sends conversation history and clinical system prompt to OpenAI or Gemini.
   - Parses the response and extracts 3 interactive follow-up suggestions (`SUGGESTIONS: [...]`).
   - Displays reply with smooth typing animation.

---

## 4. API Key Configuration & Storage
- Environment Variables:
  - `EXPO_PUBLIC_OPENAI_API_KEY`
  - `EXPO_PUBLIC_GEMINI_API_KEY`
- In-App Key Config:
  - Users can click an "⚙️ AI Settings" badge in `CoachChatScreen` or `UnifiedLogMealModal` to view/enter their OpenAI or Gemini API key.
  - Stored in browser `localStorage` / memory.
- If no key is provided:
  - Clear banner indicating "Using Built-in Pakistani Nutrition Engine".
  - Functions smoothly with high-accuracy domain fallbacks.

---

## 5. Testing & Verification Plan
1. **Unit Tests**:
   - `ai-service.test.ts`: Verify OpenAI request payload formatting, Gemini request formatting, fallback behavior, and response normalization.
   - Verify `resolveDetectedPlate()` integration with vision output.
2. **Component Tests**:
   - `UnifiedLogMealModal.test.ts`: Verify 2-tab layout, photo selection state, and plate review trigger.
   - `CoachChatScreen.test.ts`: Verify real AI message sending, typing states, and suggestion chips.
3. **Full Monorepo Verification**:
   - Execute `npm test` across all workspaces to guarantee 0 regressions.
