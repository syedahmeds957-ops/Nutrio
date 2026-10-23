import { cardioPool } from './cardio.js';
import { planSettings } from './ramadan.js';
import { EXERCISES, getExercise } from './catalogue.js';
import { exerciseForWeek } from './generator.js';
import { isAllowed } from './select.js';
import { CardioBlock, Exercise, PlannedSlot, WeeklyWorkoutPlan } from './types.js';

/** Interval moves offered in the cardio swap list, after the steady ones. */
const MAX_INTERVAL_CHOICES = 3;

const LEVEL_RANK: Record<Exercise['level'], number> = { beginner: 0, intermediate: 1 };

export class InvalidSwap extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSwap';
  }
}

function findSlot(plan: WeeklyWorkoutPlan, slotId: string): { slot: PlannedSlot; others: PlannedSlot[] } | null {
  for (const session of plan.sessions) {
    const slot = session.slots.find((s) => s.slotId === slotId);
    if (slot) return { slot, others: session.slots.filter((s) => s.slotId !== slotId) };
  }
  return null;
}

function findCardio(plan: WeeklyWorkoutPlan, slotId: string): CardioBlock | null {
  return plan.sessions.find((session) => session.cardio?.slotId === slotId)?.cardio ?? null;
}

export interface SwapOptions {
  /** How many to return; the swap sheet shows 8. */
  limit?: number;
  /** The week the swap is chosen in, so the session's rotated exercises count as taken. */
  weekIndex?: number;
}

/**
 * Safe alternatives for one slot: the same movement pattern, only equipment
 * the user has, their level, no protected joints, and nothing the session
 * already uses. Ranked by how many primary muscles they share with the
 * exercise there now, then compound-for-compound, then closest level, then
 * name. The coach (phase 10) offers exactly this list.
 */
export function swapCandidates(plan: WeeklyWorkoutPlan, slotId: string, options: SwapOptions = {}): Exercise[] {
  const { limit = 8, weekIndex = 0 } = options;
  const cardio = findCardio(plan, slotId);
  if (cardio) {
    // Cardio swaps between the steady cardio the user can do, then a few interval
    // moves where they suit. Intervals get their own places so a long steady
    // list (a full gym) never hides them.
    const current = plan.swaps[slotId] ?? cardio.exerciseId;
    const pool = cardioPool(planSettings(plan)).filter((e) => e.id !== current);
    const steady = pool.filter((e) => e.pattern === 'cardio').slice(0, limit);
    const intervals = pool.filter((e) => e.pattern === 'conditioning').slice(0, Math.min(limit, MAX_INTERVAL_CHOICES));
    return [...steady, ...intervals];
  }
  const found = findSlot(plan, slotId);
  if (!found) return [];
  const currentId = exerciseForWeek(plan, slotId, weekIndex) ?? found.slot.exerciseId;
  const current = getExercise(currentId);
  if (!current) return [];
  const taken = new Set([currentId, ...found.others.map((s) => exerciseForWeek(plan, s.slotId, weekIndex) ?? s.exerciseId)]);
  const primary = new Set(current.primaryMuscles);
  const overlap = (e: Exercise) => e.primaryMuscles.filter((m) => primary.has(m)).length;

  const applied = planSettings(plan);
  return EXERCISES.filter((e) => e.pattern === found.slot.pattern && !taken.has(e.id) && isAllowed(e, applied))
    .sort(
      (a, b) =>
        overlap(b) - overlap(a) ||
        Number(b.compound === current.compound) - Number(a.compound === current.compound) ||
        Math.abs(LEVEL_RANK[a.level] - LEVEL_RANK[current.level]) - Math.abs(LEVEL_RANK[b.level] - LEVEL_RANK[current.level]) ||
        a.name.en.localeCompare(b.name.en)
    )
    .slice(0, limit);
}

/** The plan with `exerciseId` in the slot from now on. Only a listed candidate is accepted. */
export function applySwap(plan: WeeklyWorkoutPlan, slotId: string, exerciseId: string, weekIndex = 0): WeeklyWorkoutPlan {
  const allowed = swapCandidates(plan, slotId, { limit: Infinity, weekIndex });
  if (!allowed.some((e) => e.id === exerciseId)) {
    throw new InvalidSwap(`${exerciseId} is not a safe swap for ${slotId}`);
  }
  return { ...plan, swaps: { ...plan.swaps, [slotId]: exerciseId } };
}

/** The plan with the slot back on its own exercise (and its rotation). */
export function resetSwap(plan: WeeklyWorkoutPlan, slotId: string): WeeklyWorkoutPlan {
  if (!(slotId in plan.swaps)) return plan;
  const { [slotId]: _removed, ...swaps } = plan.swaps;
  return { ...plan, swaps };
}

/**
 * Whether the slot holds a swap the user chose. A move reached by climbing
 * the bodyweight ladder is also stored as a swap, but it is progress, not a
 * swap, so it gets no "Swapped" tag or reset link.
 */
export function isUserSwap(plan: WeeklyWorkoutPlan, slotId: string): boolean {
  const swapped = plan.swaps[slotId];
  if (!swapped) return false;
  if (findCardio(plan, slotId)) return true;
  const found = findSlot(plan, slotId);
  if (!found) return false;
  for (const start of new Set([found.slot.exerciseId, ...found.slot.alternates])) {
    let step = getExercise(start)?.harder;
    for (let guard = 0; step && guard < 10; guard++) {
      if (step === swapped) return false;
      step = getExercise(step)?.harder;
    }
  }
  return true;
}
