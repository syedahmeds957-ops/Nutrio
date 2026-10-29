import type { NormalizedFood, ServingUnit } from '@nutrio/food-db';
import { TrackerEngine } from '../tracker/engine.js';
import { defaultSlotForHour } from '../tracker/mealsCard.js';
import { loadDailyActivities, saveDailyActivities } from '../tracker/activityStorage.js';
import { recordFoodUsage } from '../tracker/mealPresets.js';
import { pushDailyActivities } from '../sync/activitySync.js';
import { localDateKey } from '../common/dateKey.js';
import type { DailyTrackerSummary, LoggedItem, MealSlot } from '../tracker/types.js';

export interface CoachLogResult {
  item: LoggedItem;
  slot: MealSlot;
  /** Today after the new item, for screens that show the running totals. */
  summary: DailyTrackerSummary;
}

/**
 * Logs one serving of a catalogue dish into today's diary, in the meal slot
 * for the time of day, and saves it the way the dashboard does (local copy,
 * then a push to the account). Calories and macros are computed by the tracker
 * engine from the food's per-100g values; nothing comes from the coach's text.
 *
 * The dashboard is not mounted while the coach is open, so this reads the
 * saved day, adds the item and writes it back; the dashboard picks it up when
 * it reopens. Guests never reach this: the app only passes the logging
 * callback to signed-in users.
 */
export function logCoachDish(args: {
  food: NormalizedFood;
  serving: ServingUnit;
  region: 'PK' | 'SA';
  targets: ConstructorParameters<typeof TrackerEngine>[0];
  now?: Date;
}): CoachLogResult {
  const { food, serving, region, targets } = args;
  const now = args.now ?? new Date();
  const today = localDateKey(now);
  const engine = new TrackerEngine({ ...targets, date: today });
  const saved = loadDailyActivities(today, region);
  if (saved?.items) engine.loadItems(saved.items, saved.waterMl || 0);

  const slot = defaultSlotForHour(now.getHours());
  const item = engine.logItem(slot, food, serving, 1);
  recordFoodUsage([food.id || food.name]);

  const summary = engine.getSummary();
  saveDailyActivities(summary.date, region, summary.items, summary.waterMlConsumed);
  pushDailyActivities({
    date: summary.date,
    region,
    items: summary.items,
    waterMl: summary.waterMlConsumed,
  }).catch(() => {
    // The local copy is saved; a failed push retries on the next change.
  });

  return { item, slot, summary };
}
