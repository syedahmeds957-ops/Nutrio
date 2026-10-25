# Design Specification: Workout Screens

**Date:** 2026-10-22
**Status:** Approved by user (2026-10-22), with the "today's workout" change below applied before approval.
**Mockups:** https://claude.ai/artifact/7dEqPJ6ZK2bgkYL32owMRu (private canvas: an English page and an Arabic RTL page, 31 screens each, plus a clickable prototype)
**Plan:** [`docs/design/plans/workout-plans/`](../plans/workout-plans/README.md). This is Phase 0's deliverable; phases 3–11 build to match it.
**Built:** phases 3–11 are complete (2026-10-25). Where the build differs from these mockups, the phase's execution record says why. The main differences:
- **Coach screen (phase 10):** it keeps its existing look; only the "Talking about" chip and the Apply swap card were added.
- **Guests (phase 8b):** they preview a sample week and can't build or log.
- **Week view and check-in (phase 11):** days before a plan was created are never shown as missed.

---

## 1. Principles

1. **Same app, same look.** Everything uses the Solid Lime Minimalist system (`apps/mobile/src/theme.ts`, [lime minimalist spec](2026-09-06-ronasit-lime-minimalist-design.md)). That means:
   - lime `#A4EB3F` with `#0A0B0D` text for primary actions and the hero card
   - 22 px cards and 26 px hero cards
   - pill buttons
   - Inter for English and IBM Plex Sans Arabic for Arabic
   - Phosphor-style stroke icons
2. **Workouts get their own space.** The Workouts screen shows only training. Meals stay on the dashboard, which only gets a small "Today's workout" card linking to Workouts.
3. **Today first.** Opening Workouts shows today's workout with **every exercise listed one by one**: animated demo, sets × reps and rest. The week sits below.
4. **Predictable and explained.** The week is fixed. Every weight or rep change shows a one-line reason.
5. **Arabic is first-class.** Every screen is designed in Arabic with a mirrored RTL layout, not translated afterwards.
6. **Accessible as drawn.** Every control is at least 44 px. Text contrast is ≥ 4.5:1 in both themes. Real buttons carry `aria-pressed` on toggles and labels on icon-only buttons. Reduced motion shows a still frame instead of the loop.

## 2. Tokens used beyond `theme.ts`

The mockups use `theme.ts` values except in two places, where the existing tokens fail contrast:

| Token | `theme.ts` today | Mockup value | Why |
|---|---|---|---|
| `textSecondary` (light) | `#64748B` | `#556275` | `#64748B` on the `#F6F7FB` canvas is about 4.4:1, just under AA for 12–13 px labels |
| `floatingBarInactive` (dark) | `#636674` | `#9CA3AF` | `#636674` on `#18191E` is about 3:1 for 11 px tab labels |

**Phase 3 decision:** change these two tokens in `theme.ts`. That affects existing screens slightly, for the better. Everything else, including status colours, uses existing tokens: `successLight`/`success`, `warningLight`/`warning`, `danger`.

## 3. Screens

Component names are what phases 3–11 create under `apps/mobile/src/workout/ui/` unless stated otherwise.

### 3.1 Dashboard changes (`tracker/ui/TrackerDashboardScreen.tsx`), phases 3–4

- **Nav row.** A **Workouts** pill (dumbbell icon + "New" badge) is inserted after Meals.
  - Five pills don't fit at 360–390 px with the current `flex: 1` sizing, so pills become content-width and the row **scrolls horizontally**. In RTL the row starts from the right.
  - Pill height goes to 44 px (was about 30 px) for touch size.
  - AI coach stays the lime pill.
- **`TodayWorkoutCard`** sits below the hero card and `StreakBadge`, and has three states:
  - **No plan:** title "Get a weekly workout plan", one line of body text, and a lime "Set up workouts" button.
  - **Training day:** session title, "6 exercises · ~58 min", a lime Start button, and thumbnails of the first 4 exercises.
  - **Rest day:** "Rest day", "Next: Lower body B on Fri", and a "See the week" button.

### 3.2 Setup (`WorkoutSetupScreen`), 3 steps, phases 3 + 7

- **Shared layout:**
  - Header: back button, "Step N of 3" and a 3-segment progress bar.
  - Title "Your workout plan".
  - Bottom bar: Back (grey, flex 1) and Next / Create my plan (lime, flex 2), matching `OnboardingSurveyScreen`.
- **Step 1:**
  - Prefill note ("We filled in what you told us in your survey").
  - Goal as a 2×2 grid of option cards, each with a title and one-line description.
  - Experience as 3 full-width rows, with a check on the selected one.
- **Step 2:** three location cards with icons. Then, depending on the choice:
  - **home, no equipment:** lime tip "a resistance band unlocks proper pulling exercises"
  - **home with equipment:** equipment chips, then a dumbbell-weight grid (2–30 kg plus Adjustable, 4 columns) with the hint "So we never suggest a weight you don't have"
  - **gym:** a grey note listing barbells, dumbbells, cables and machines
- **Step 3:**
  - Weekday chips in a 4-column grid, with "4 days a week" below; it turns red with "Pick at least 2 days" if fewer than 2 are picked, which also disables Create.
  - Session length as 5 equal tiles (number + "min").
  - Focus and protect chips, both marked optional.
  - Ramadan card: moon icon, title, subtitle and switch. When on, it reveals 3 timing choices.
  - The low-intensity warning (amber) appears at the top when health flags apply.

### 3.3 Workouts screen (`WorkoutWeekScreen`), phases 4, 5, 7

- **Header:** back, "Workouts", and an "Edit plan" text button.
- **Today's workout card** (lime 2 px border) shows:
  - an overline, the session title and "6 exercises · ~58 min"
  - a numbered list of **all** exercises, each with a 72 px looping demo, the name, **"3 sets × 8–12"** (bold) and "90 s rest between sets"
  - a full-width lime **Start workout** button, or a green "Done" chip once today is finished
- **"This week" heading**, then:
  - **Lime summary card:** "WEEK 2", split name, "2 of 4 workouts done", one progress segment per session, and a Ramadan badge when it's on.
  - **Day rows for the current calendar week.** The week starts Monday for PK and Sunday for SA. (This changes phase 4's earlier "7 days starting today": done/missed need past days to stay visible.)
    - **Training day:** date column, title, meta and a status chip (Done green, Today lime, Coming up grey). Today's row has a 2 px lime border.
    - **Missed:** an amber "Missed" chip plus a lime "Do it today" button.
    - **Rest day:** a compact muted row.
- **Toast** "Workout saved" after finishing.
- **Calorie sheet** (`TargetUpdateSheet`, phase 9), a bottom sheet with:
  - flame icon, "Update your daily target?" and the reason
  - "1,850 → 1,960 kcal/day" (old value struck through)
  - "You can change this any time in Targets"
  - Not now / Update target buttons

### 3.4 Day screen (`WorkoutDayScreen`), phases 4–7

- **Header:** back, session title, and the date + count + minutes. "Today · moved from Tue" when started from a missed day.
- **Ramadan guidance** card (moon icon), worded for the chosen slot.
- **Exercise cards:**
  - a 68 px demo, which opens the detail sheet
  - name, "3 × 8–12 · 90 s rest" and the effort hint ("Stop with 1–2 reps left")
  - a ⋯ options button
  - a swapped exercise shows a lime "Swapped" tag and a "Reset to original" link
- **Finisher block** (dashed border, fat loss / general only): two demos, "30 s on, 30 s off · 8 rounds".
- **Bottom:** a fixed lime "Start workout" button.
- **Options sheet:** Swap exercise / Ask coach about this / View details / Cancel.
- **`ExerciseDetailSheet`:** name and close button, a large demo, muscle chips and numbered "How to do it" steps, plus Swap and Ask coach buttons.

### 3.5 Logging (inside `WorkoutDayScreen`), phase 5

- **Header** gains elapsed time and a lime **Finish** button. Back opens the discard dialog.
- **Each exercise card** gains:
  - **A target panel:** "62.5 kg × 8–12" plus a reason line. Green with an up-arrow when the weight goes up; grey with "=" or a star otherwise.
    - "+2.5 kg: you hit 12 on every set last time"
    - "Same weight: aim for one more rep"
    - "First time: pick a weight you could lift 15 times with 2–3 reps to spare" (the kg field shows "— kg")
    - "Felt hard last time: same weight today"
    - "Your heaviest dumbbell: aim for more reps instead"
    - "Ramadan: same weight while you're fasting"
  - **Set rows:** "Set N", a kg stepper (or "Bodyweight"), a reps stepper (seconds for planks) and a 44 px check.
    - Done sets: lime fill.
    - The active set: lime border.
    - Pending sets: 55% opacity.
- **Rest timer:** a floating dark capsule showing the countdown, with +30 s and Skip.
- **Discard dialog:** centred, "Discard this workout?", Keep going (lime) / Discard (red text).
- **Finish sheet:**
  - "Nice work!" and "Upper body B done"
  - 3 stats: time, sets and kg lifted
  - "How did it feel?" with Easy / Just right / Hard, each with a description
  - "This helps set your next targets"
  - Save, disabled until a rating is chosen

### 3.6 Swap sheet (`SwapSheet`), phase 6

- Title "Swap {exercise}" and "Same muscles, using your equipment".
- Candidate rows: demo, name, equipment label and chevron.
- **Empty state:** info icon, "No other safe option with your equipment" and "Add equipment in Edit plan to see more options".

### 3.7 Coach (`coach/ui/CoachChatScreen.tsx`), phase 10

- **"Talking about: {exercise}" chip** under the header, with a 44 px close button.
- **Bubbles:** user messages lime and aligned to the end; coach messages on a surface background and aligned to the start. Both mirror in RTL.
- **`ApplySwapCard`** (lime 2 px border):
  - "Swap to {exercise}?"
  - the old exercise struck through → the new one, each with a thumbnail
  - "Sets and weights still come from your plan"
  - Keep current / Apply swap buttons
- **States after the card:**
  - applied: a green confirmation
  - no longer valid: an amber notice "This swap is no longer available because your plan changed…"
- The input bar has a visually hidden label and a lime send button that mirrors in RTL.

### 3.8 Weekly check-in (`coach/ui/WeeklyCheckInScreen.tsx`), phase 11

A **Workouts** card (lime border) showing "3 of 4", a segmented progress bar and "Missed: Lower body B". It sits below the existing intake and weight metrics.

## 4. RTL rules

- The root `dir` follows the language. Flex rows mirror automatically; use `paddingStart`/`End` and `marginStart`/`End`, never left/right.
- **Mirrored icons:** back chevron, forward chevrons, the swap arrow in the coach card and calorie sheet, and the send button.
- **Not mirrored:** the dumbbell, check, moon, flame, plus and minus icons, and exercise photos.
- Numbers stay Western digits in Arabic, as in the rest of the app. "×", "–" and "~" render correctly in RTL text.
- Day names are full Arabic names (الاثنين … الأحد). Chips wrap in a 4-column grid, because short Arabic day forms aren't standard.

## 4b. Every app version: Pakistan, Saudi Arabia, global

Every screen here ships unchanged in all versions; nothing is region-only.

- **The only region difference:** the week's first day. Saudi starts on Sunday; Pakistan and any other region (global) start on Monday.
- **Ramadan mode** is offered everywhere and is opt-in.
- **Exercise names, instructions, setup options and copy** are region-neutral, in both English and Arabic.
- **Units:** weights are kilograms in all versions. A pounds option isn't in scope; if a global version needs it later, it's a display setting on top of kg.
- **The dashboard region toggle** (PK/SA) doesn't change the workout screens beyond the week start.

## 5. Copy

The approved English and Arabic strings are in the mockup source (`T.en` / `T.ar` in the canvas's `Main.dc.html`). Phase 3 copies them into `en.json` / `ar.json` under the `workout` namespace. Arabic exercise names and instructions are reviewed separately in phase 1.

## 6. Not designed here

- Warm-up and stretching routines, reminders, Apple Health / Google Fit, video: all out of scope.
- The Saudi region's week view uses the same components; only the week start (Sunday) differs.
