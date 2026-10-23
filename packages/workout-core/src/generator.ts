import { EXERCISES, getExercise } from './catalogue.js';
import { capsApply, Caps, prescribe } from './prescription.js';
import { alternatesFor, hashString, isAllowed, pickExercise } from './select.js';
import { chooseSplit, SLOTS_FOR_MINUTES, slotsWithFocus } from './split.js';
import {
  Equipment,
  Finisher,
  FocusArea,
  JointLoad,
  PlannedSlot,
  SessionMinutes,
  SessionTemplateId,
  Weekday,
  WeeklyWorkoutPlan,
  WorkoutSession,
  WorkoutSettings,
} from './types.js';

export const WEEKDAYS: readonly Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const SESSION_MINUTES: readonly SessionMinutes[] = [20, 30, 45, 60, 75];
const HOME_EQUIPMENT: readonly Equipment[] = ['dumbbell', 'kettlebell', 'bands', 'bench', 'pullup_bar'];
const FOCUS: readonly FocusArea[] = ['full_body', 'upper', 'lower_glutes', 'core', 'arms'];
const JOINTS: readonly JointLoad[] = ['knee', 'lower_back', 'shoulder', 'wrist'];

const WARM_UP_SEC = 5 * 60;
const WORK_SEC_PER_SET = 40;
/** Ramadan sessions aim for 40 minutes so the +5 margin keeps them within 45. */
const RAMADAN_TARGET_MINUTES = 40;
const FINISHER = { workSec: 30, restSec: 30, minRounds: 4, maxRounds: 8 } as const;
const MIN_SETS = 2;

export class InvalidWorkoutSettings extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidWorkoutSettings';
  }
}

export function validateSettings(settings: WorkoutSettings): void {
  const days = settings.trainingDays;
  if (days.length < 2 || days.length > 6) throw new InvalidWorkoutSettings(`Pick 2 to 6 training days, got ${days.length}`);
  if (new Set(days).size !== days.length) throw new InvalidWorkoutSettings('Training days repeat');
  if (days.some((day) => !WEEKDAYS.includes(day))) throw new InvalidWorkoutSettings('Unknown training day');
  if (!SESSION_MINUTES.includes(settings.sessionMinutes)) {
    throw new InvalidWorkoutSettings(`Session length must be one of ${SESSION_MINUTES.join(', ')} minutes`);
  }
  if (settings.homeEquipment.some((item) => !HOME_EQUIPMENT.includes(item))) {
    throw new InvalidWorkoutSettings('Home equipment can only be dumbbells, kettlebell, bands, bench or pull-up bar');
  }
  if (settings.dumbbellWeightsKg.some((kg) => !(kg > 0))) throw new InvalidWorkoutSettings('Dumbbell weights must be positive');
  if (settings.focus.some((area) => !FOCUS.includes(area))) throw new InvalidWorkoutSettings('Unknown focus area');
  if (settings.protectedJoints.some((joint) => !JOINTS.includes(joint))) throw new InvalidWorkoutSettings('Unknown joint');
}

function slotSeconds(slot: PlannedSlot): number {
  return slot.sets * (WORK_SEC_PER_SET + slot.restSec);
}

export function estimateMinutes(slots: readonly PlannedSlot[], finisher?: Finisher): number {
  const finisherSec = finisher ? finisher.rounds * (finisher.workSec + finisher.restSec) : 0;
  const total = WARM_UP_SEC + slots.reduce((sum, slot) => sum + slotSeconds(slot), 0) + finisherSec;
  return Math.round(total / 60);
}

/**
 * Trims a session to fit: sets come off the last accessory, then that
 * accessory goes, and only when no accessories are left do main lifts lose
 * sets (never below two). A 20-minute strength session needs that last step.
 */
function fitToTime(slots: PlannedSlot[], targetMinutes: number): PlannedSlot[] {
  const fitted = slots.map((slot) => ({ ...slot }));
  while (estimateMinutes(fitted) > targetMinutes + 5) {
    const lastAccessory = fitted.map((slot) => slot.role).lastIndexOf('accessory');
    if (lastAccessory >= 0) {
      if (fitted[lastAccessory].sets > MIN_SETS) fitted[lastAccessory].sets -= 1;
      else fitted.splice(lastAccessory, 1);
      continue;
    }
    // Main lifts lose sets evenly: the one with the most sets goes first.
    const reducible = fitted.reduce<PlannedSlot | null>(
      (best, slot) => (slot.sets > MIN_SETS && (!best || slot.sets >= best.sets) ? slot : best),
      null
    );
    if (!reducible) break;
    reducible.sets -= 1;
  }
  return fitted;
}

function finisherFor(settings: WorkoutSettings, seed: number, key: string, slots: readonly PlannedSlot[], targetMinutes: number): Finisher | undefined {
  const leftSec = (targetMinutes - estimateMinutes(slots)) * 60;
  const rounds = Math.min(FINISHER.maxRounds, Math.floor(leftSec / (FINISHER.workSec + FINISHER.restSec)));
  if (rounds < FINISHER.minRounds) return undefined;
  const used = new Set(slots.map((slot) => slot.exerciseId));
  const pool = EXERCISES.filter((e) => e.pattern === 'conditioning' && !used.has(e.id) && isAllowed(e, settings));
  if (pool.length === 0) return undefined;
  const exerciseIds = [...pool]
    .sort((a, b) => hashString(`${seed}:${key}:${a.id}`) - hashString(`${seed}:${key}:${b.id}`))
    .slice(0, 2)
    .map((e) => e.id);
  return { exerciseIds, workSec: FINISHER.workSec, restSec: FINISHER.restSec, rounds };
}

interface SessionInput {
  day: Weekday;
  template: SessionTemplateId;
  variant: 'a' | 'b' | null;
  settings: WorkoutSettings;
  seed: number;
  caps: Caps;
  slotCount: number;
  targetMinutes: number;
  usedInWeek: Map<string, number>;
}

function buildSession(input: SessionInput): WorkoutSession {
  const { settings, seed, caps } = input;
  const prefix = input.variant ? `${input.template}-${input.variant}` : input.template;
  const plannedSlots = slotsWithFocus(input.template, settings.focus).slice(0, input.slotCount);
  const occurrences = new Map<string, number>();
  const usedInSession = new Set<string>();
  const slots: PlannedSlot[] = [];

  for (const planned of plannedSlots) {
    const n = occurrences.get(planned.pattern) ?? 0;
    occurrences.set(planned.pattern, n + 1);
    const slotId = `${prefix}:${planned.pattern}:${n}`;
    const pick = pickExercise({
      pattern: planned.pattern,
      role: planned.role,
      settings,
      seed,
      slotId,
      usedInSession,
      usedInWeek: input.usedInWeek,
    });
    if (!pick) continue;
    usedInSession.add(pick.exercise.id);
    slots.push({
      slotId,
      pattern: pick.pattern,
      role: planned.role,
      exerciseId: pick.exercise.id,
      alternates: [pick.exercise.id],
      ...prescribe(settings.goal, settings.experience, planned.role, caps, pick.exercise.timed),
    });
  }

  // Rotation lists are built once every base pick is known, so no week can
  // put the same exercise in two slots of one session.
  const reserved = new Set(usedInSession);
  for (const slot of slots) {
    if (slot.role !== 'accessory') continue;
    slot.alternates = alternatesFor(getExercise(slot.exerciseId)!, settings, seed, slot.slotId, reserved);
    for (const id of slot.alternates) reserved.add(id);
  }
  for (const id of usedInSession) input.usedInWeek.set(id, (input.usedInWeek.get(id) ?? 0) + 1);

  const fitted = fitToTime(slots, input.targetMinutes);
  const wantsFinisher = (settings.goal === 'fat_loss' || settings.goal === 'general') && !capsApply(caps);
  const finisher = wantsFinisher ? finisherFor(settings, seed, `${prefix}:finisher`, fitted, input.targetMinutes) : undefined;

  return {
    day: input.day,
    template: input.template,
    variant: input.variant,
    slots: fitted,
    ...(finisher ? { finisher } : {}),
    estimatedMinutes: estimateMinutes(fitted, finisher),
  };
}

export interface GenerateOptions {
  seed: number;
  /** Date key (YYYY-MM-DD) the plan starts on. */
  today: string;
  /** ISO timestamp for `createdAt`; defaults to the start of `today`. */
  now?: string;
}

export function generateWeeklyPlan(settings: WorkoutSettings, options: GenerateOptions): WeeklyWorkoutPlan {
  validateSettings(settings);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(options.today)) throw new InvalidWorkoutSettings(`Bad date key ${options.today}`);

  const days = WEEKDAYS.filter((day) => settings.trainingDays.includes(day));
  const { split, templates } = chooseSplit(days.length, settings.experience, settings.location);
  const caps: Caps = { ramadan: settings.ramadan.enabled, lowIntensity: settings.lowIntensity };
  const slotCount = Math.min(SLOTS_FOR_MINUTES[settings.sessionMinutes], settings.ramadan.enabled ? 4 : Infinity);
  const targetMinutes = settings.ramadan.enabled
    ? Math.min(settings.sessionMinutes, RAMADAN_TARGET_MINUTES)
    : settings.sessionMinutes;

  const totals = new Map<SessionTemplateId, number>();
  for (const template of templates) totals.set(template, (totals.get(template) ?? 0) + 1);
  const seen = new Map<SessionTemplateId, number>();
  const usedInWeek = new Map<string, number>();

  const sessions = days.map((day, i) => {
    const template = templates[i];
    const index = seen.get(template) ?? 0;
    seen.set(template, index + 1);
    const variant = (totals.get(template) ?? 0) > 1 ? (index === 0 ? 'a' : 'b') : null;
    return buildSession({ day, template, variant, settings, seed: options.seed, caps, slotCount, targetMinutes, usedInWeek });
  });

  return {
    version: 1,
    createdAt: options.now ?? `${options.today}T00:00:00.000Z`,
    blockStart: options.today,
    seed: options.seed,
    settings,
    split,
    sessions,
    swaps: {},
  };
}

/**
 * The plan for new settings that keeps what the user already has: the same
 * seed (so unchanged slots pick the same exercises), the same block start
 * (so week numbers continue), and every swap that still fits.
 */
export function regeneratePlan(
  previous: WeeklyWorkoutPlan,
  settings: WorkoutSettings,
  options: { now?: string } = {}
): WeeklyWorkoutPlan {
  const next = generateWeeklyPlan(settings, { seed: previous.seed, today: previous.blockStart, now: options.now });
  const slotPattern = new Map(next.sessions.flatMap((session) => session.slots.map((slot) => [slot.slotId, slot.pattern] as const)));
  for (const [slotId, exerciseId] of Object.entries(previous.swaps)) {
    const exercise = getExercise(exerciseId);
    if (exercise && slotPattern.get(slotId) === exercise.pattern && isAllowed(exercise, settings)) {
      next.swaps[slotId] = exerciseId;
    }
  }
  return next;
}

/** Whole weeks since the block started (0 in the first week). */
export function weekIndexFor(blockStart: string, dateKey: string): number {
  const start = Date.parse(`${blockStart}T00:00:00Z`);
  const date = Date.parse(`${dateKey}T00:00:00Z`);
  return Math.max(0, Math.floor((date - start) / (7 * 24 * 60 * 60 * 1000)));
}

/** The exercise a slot holds in a given week: a swap wins, accessories rotate every 4 weeks, main lifts stay. */
export function exerciseForWeek(plan: WeeklyWorkoutPlan, slotId: string, weekIndex: number): string | undefined {
  if (plan.swaps[slotId]) return plan.swaps[slotId];
  const slot = plan.sessions.flatMap((session) => session.slots).find((s) => s.slotId === slotId);
  if (!slot) return undefined;
  if (slot.role === 'main' || slot.alternates.length === 0) return slot.exerciseId;
  return slot.alternates[Math.floor(weekIndex / 4) % slot.alternates.length];
}
