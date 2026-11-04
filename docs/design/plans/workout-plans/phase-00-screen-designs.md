# Phase 0: Screen designs

**Size:** M · **Blocked by:** none · Runs alongside phases 1–2. **Phase 3 can't start until you approve this phase.**

## Outcome

Every new or changed workout screen is designed and approved before it's built. Delivered as a design spec in the repo plus clickable HTML mockups you can open on your phone. No app code changes in this phase.

## Read first

- `apps/mobile/src/theme.ts`: the real light and dark tokens (lime `#A4EB3F`, `limeText #0A0B0D`, canvas, surface, border, text colours).
- `docs/design/specs/2026-09-06-ronasit-lime-minimalist-design.md`: the app's visual direction.
- The dashboard (`tracker/ui/TrackerDashboardScreen.tsx`: nav pills, cards, bottom bar), the survey steps (`survey/ui/Step*.tsx`: chips, steppers, step header) and `ui/` primitives, so the mockups reuse what exists.
- Fonts: Inter (Latin) and IBM Plex Sans Arabic, as patched by `installFontPatch()`. Icons: the Phosphor set in `ui/Icon.tsx`.

## Screens to design (with their states)

| # | Screen | States to show | Built in |
|---|---|---|---|
| 1 | Dashboard nav row with the Workouts pill | 5 pills at 360 px (scroll if they don't fit) | 3 |
| 2 | Setup step 1: goal + experience | default, selected | 3 |
| 3 | Setup step 2: where you train | home no-equipment (band tip), home with equipment + dumbbell picker, gym | 3 |
| 4 | Setup step 3: days, length, focus, protect | fewer than 2 days (Save disabled), low-intensity note, Ramadan switch on with timing | 3, 7 |
| 5 | Week screen | normal week, today highlighted, done/missed/rest, Ramadan badges, "Edit plan" | 4, 5, 7 |
| 6 | Day screen | before start, finisher block, swapped exercise with "Reset", Ramadan guidance | 4, 6, 7 |
| 7 | Exercise detail sheet | image loop, instructions, muscles | 4 |
| 8 | Today's workout card | no plan, training day, rest day | 4 |
| 9 | Logging mode | set rows with steppers, first-time "pick a weight", reason lines, rest-timer banner, discard prompt | 5 |
| 10 | Finish + rating sheet | easy / right / hard | 5 |
| 11 | Swap sheet | candidates, empty ("no other safe option") | 6 |
| 12 | Calorie target update sheet | 1,850 → 1,960 kcal | 9 |
| 13 | Coach: "Talking about" chip + Apply swap card | proposed, applied, refused (stale) | 10 |
| 14 | Weekly check-in workouts row | 3 of 4 | 11 |

Every screen gets light mode, dark mode, English and Arabic (RTL, mirrored layout and icons where direction matters).

## Deliverables

1. **Design spec** `docs/design/specs/2026-10-22-workout-screens-design.md`, in the same style as the existing specs. For each screen it covers:
   - layout and hierarchy
   - which existing components are reused and which are new (named, with props)
   - each state above
   - spacing and type scale taken from `theme.ts`
   - RTL rules
   - accessibility: 44 px touch targets, contrast, reduced motion (still image instead of loop), screen-reader labels
   - the key copy in English and Arabic
2. **Clickable HTML mockups** published as a private Artifact (one page):
   - phone frames at 390 × 844, with a 360 px width check
   - switches for light/dark and English/Arabic
   - a clickable main flow: dashboard → setup (3 steps) → week → day → start → log sets → rest timer → finish → week shows done
   - the other screens and states reachable from a screen index
   - a handful of real free-exercise-db photos (public domain), embedded inline
3. **README link**: the artifact URL and spec path are added to this plan's README.

## Review loop

I publish the mockups and spec, and you review on desktop or phone. Comments go in chat or as Artifact comments. I revise and republish to the same link until you approve. Approval is recorded in the spec's status line and the README Progress table.

## Done when

- You've approved the mockups. Every later UI phase builds to match them, and its Demo step compares the built screen against the mockup.
- Commit: `docs(design): workout screens design spec`. The mockup HTML isn't committed; it lives at the artifact link.
