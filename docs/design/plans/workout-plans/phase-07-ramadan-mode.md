# Phase 7: Ramadan mode

**Size:** S · **Blocked by:** 4

## Outcome

The user can switch on Ramadan mode and pick when they train. The week regenerates with shorter, gentler sessions labelled with that timing. Switching it off restores the normal plan, keeping logs and valid swaps.

## Tasks

1. **Setup step 3** gets a "Ramadan mode" switch, off by default. When on, it shows the timing choice: after suhoor · before iftar · after taraweeh.
2. **Week screen** gets a quick toggle in the header menu. Toggling calls `regeneratePlan(plan, { ...settings, ramadan }, today)` → `saveWorkoutPlan`.
3. **Badges.** With Ramadan on, day cards show a crescent badge and the timing label ("Before iftar"), and the day screen shows guidance for the chosen slot:
   - before iftar: keep it light, break the fast with water and dates afterwards
   - after taraweeh: finish at least 1 hour before sleep
   - after suhoor: drink water during suhoor
4. **Generator caps** were already built in phase 2. This phase only checks they reach the UI: at most 4 exercises, ≤ 45 min, no finisher, RIR ≥ 2 shown in the hints.
5. **Progression while fasting.** While Ramadan is on, `nextTarget` never raises load (`hold`), so a tired fasting session doesn't count as failing. **This changes `progression.ts`; add the case and its test.** The ten-percent cut still applies.
6. **i18n**: switch label, slot names, guidance lines, badge. Arabic uses the standard terms (سحور، إفطار، تراويح).

## Tests

- `packages/workout-core/test/progression.test.ts` (extend): Ramadan on → no load increase; the failure cut still works.
- `src/workout/__tests__/ramadan-toggle.test.ts`: toggling on regenerates within caps and keeps logs; toggling off restores the normal slot count and keeps valid swaps.

## Verify

```bash
npm run build && npx vitest run packages/workout-core
cd apps/mobile && npx vitest run src/workout
npm test
```

## Done when

Commit: `feat(workout): Ramadan mode with timed, gentler sessions`.
