import { describe, expect, it } from 'vitest';
import { getExercise } from '../src/catalogue.js';
import { generateWeeklyPlan, exerciseForWeek } from '../src/generator.js';
import { applyLadder, loadIncrement, nextTarget, startingLoad, stepLoad } from '../src/progression.js';
import { LoggedSet, PlannedSlot, SessionRating, WorkoutLog, WorkoutSettings } from '../src/types.js';

function settings(overrides: Partial<WorkoutSettings> = {}): WorkoutSettings {
  return {
    goal: 'muscle',
    experience: 'some',
    location: 'gym',
    homeEquipment: [],
    dumbbellWeightsKg: [],
    trainingDays: ['mon', 'wed', 'fri'],
    sessionMinutes: 60,
    focus: [],
    protectedJoints: [],
    lowIntensity: false,
    ramadan: { enabled: false },
    ...overrides,
  };
}

function slot(exerciseId: string, overrides: Partial<PlannedSlot> = {}): PlannedSlot {
  return {
    slotId: 'full_a:squat:0',
    pattern: getExercise(exerciseId)!.pattern,
    role: 'main',
    exerciseId,
    alternates: [exerciseId],
    sets: 3,
    repMin: 8,
    repMax: 12,
    unit: 'reps',
    restSec: 90,
    targetRir: 1,
    ...overrides,
  };
}

const sets = (reps: number[], loadKg?: number): LoggedSet[] => reps.map((r) => ({ reps: r, loadKg, done: true }));

let day = 0;
/** One logged session for the slot; build histories newest first. */
function log(exerciseId: string, loggedSets: LoggedSet[], rating?: SessionRating, slotId = 'full_a:squat:0'): WorkoutLog {
  day += 1;
  return {
    dateKey: `2026-10-${String(day).padStart(2, '0')}`,
    day: 'mon',
    template: 'full_a',
    exercises: [{ slotId, exerciseId, sets: loggedSets }],
    rating,
    startedAt: '2026-10-01T10:00:00.000Z',
  };
}

describe('nextTarget for weighted exercises', () => {
  const gym = settings();

  it('asks for a first weight when there is no history', () => {
    expect(nextTarget(slot('barbell-squat'), [], gym)).toMatchObject({ reason: 'first_time_pick_weight', reps: 8, sets: 3 });
    expect(nextTarget(slot('barbell-squat'), [], gym).loadKg).toBeUndefined();
  });

  it('adds one increment after every set reached the top of the range', () => {
    const target = nextTarget(slot('barbell-squat'), [log('barbell-squat', sets([12, 12, 12], 60))], gym);
    expect(target).toMatchObject({ reason: 'hit_top_add_load', loadKg: 62.5, reps: 8, reasonParams: { inc: 2.5, reps: 12 } });
  });

  it('keeps the weight and aims for one more rep inside the range', () => {
    const target = nextTarget(slot('barbell-squat'), [log('barbell-squat', sets([12, 10, 9], 60))], gym);
    expect(target).toMatchObject({ reason: 'in_range_add_reps', loadKg: 60, reps: 10 });
  });

  it('does not count sets that were never ticked', () => {
    const partly: LoggedSet[] = [...sets([12, 12], 60), { reps: 12, loadKg: 60, done: false }];
    expect(nextTarget(slot('barbell-squat'), [log('barbell-squat', partly)], gym).reason).toBe('in_range_add_reps');
  });

  it('cuts the weight by 10%, rounded down to a real step, after two sessions below the range', () => {
    const history = [log('barbell-squat', sets([8, 7, 6], 60)), log('barbell-squat', sets([8, 8, 7], 60))];
    expect(nextTarget(slot('barbell-squat'), history, gym)).toMatchObject({ reason: 'failed_twice_reduce', loadKg: 52.5 });
    const dumbbell = [log('goblet-squat', sets([7], 25)), log('goblet-squat', sets([6], 25))];
    expect(nextTarget(slot('goblet-squat'), dumbbell, gym)).toMatchObject({ loadKg: 22 });
  });

  it('needs both sessions below the range before cutting', () => {
    const history = [log('barbell-squat', sets([8, 7, 6], 60)), log('barbell-squat', sets([10, 9, 8], 60))];
    expect(nextTarget(slot('barbell-squat'), history, gym).reason).toBe('in_range_add_reps');
  });

  it('holds the weight when the last session felt hard, even at the top of the range', () => {
    const target = nextTarget(slot('barbell-squat'), [log('barbell-squat', sets([12, 12, 12], 60), 'hard')], gym);
    expect(target).toMatchObject({ reason: 'felt_hard_hold', loadKg: 60 });
  });

  it('asks for a weight again when the last session left the weight blank', () => {
    expect(nextTarget(slot('barbell-squat'), [log('barbell-squat', sets([12, 12, 12]))], gym).reason).toBe('first_time_pick_weight');
  });

  it('starts fresh when the slot now holds a different exercise (rotation or swap)', () => {
    expect(nextTarget(slot('front-squat'), [log('barbell-squat', sets([12, 12, 12], 60))], gym).reason).toBe('first_time_pick_weight');
  });
});

describe('increments per equipment', () => {
  const gym = settings();

  it('uses 2.5 kg for bars, machines and cables, 2 kg for dumbbells and 4 kg for kettlebells', () => {
    expect(loadIncrement(getExercise('barbell-squat')!)).toBe(2.5);
    expect(loadIncrement(getExercise('ez-bar-curl')!)).toBe(2.5);
    expect(loadIncrement(getExercise('leg-press')!)).toBe(2.5);
    expect(loadIncrement(getExercise('seated-cable-row')!)).toBe(2.5);
    expect(loadIncrement(getExercise('goblet-squat')!)).toBe(2);
    expect(loadIncrement(getExercise('kettlebell-swing')!)).toBe(4);
  });

  it('adds the increment for each kind', () => {
    const top = (id: string, kg: number) => nextTarget(slot(id), [log(id, sets([12, 12, 12], kg))], gym).loadKg;
    expect(top('leg-press', 100)).toBe(102.5);
    expect(top('goblet-squat', 20)).toBe(22);
    expect(top('kettlebell-front-squat', 16)).toBe(20);
  });

  it('steps the logger by the same increments and never below zero', () => {
    expect(stepLoad(getExercise('barbell-squat')!, gym, 60, 1)).toBe(62.5);
    expect(stepLoad(getExercise('barbell-squat')!, gym, 2.5, -1)).toBe(0);
    expect(stepLoad(getExercise('barbell-squat')!, gym, 0, -1)).toBe(0);
    expect(startingLoad(getExercise('barbell-squat')!, gym)).toBe(20);
    expect(startingLoad(getExercise('ez-bar-curl')!, gym)).toBe(10);
  });
});

describe('home dumbbells with a limited set', () => {
  const home = settings({ location: 'home_equipment', homeEquipment: ['dumbbell'], dumbbellWeightsKg: [10, 4, 6] });
  const id = 'goblet-squat';

  it('moves to the next weight they own, skipping the gaps', () => {
    expect(nextTarget(slot(id), [log(id, sets([12, 12, 12], 6))], home)).toMatchObject({ reason: 'hit_top_add_load', loadKg: 10, reasonParams: { inc: 4 } });
    expect(stepLoad(getExercise(id)!, home, 4, 1)).toBe(6);
    expect(stepLoad(getExercise(id)!, home, 10, -1)).toBe(6);
    expect(startingLoad(getExercise(id)!, home)).toBe(4);
  });

  it('holds at their heaviest dumbbell and says so', () => {
    expect(nextTarget(slot(id), [log(id, sets([12, 12, 12], 10))], home)).toMatchObject({ reason: 'top_dumbbell_hold', loadKg: 10, reps: 12 });
    expect(stepLoad(getExercise(id)!, home, 10, 1)).toBe(10);
  });

  it('cuts to a weight they own after two sessions below the range', () => {
    const history = [log(id, sets([6, 6, 5], 10)), log(id, sets([7, 6, 6], 10))];
    expect(nextTarget(slot(id), history, home)).toMatchObject({ reason: 'failed_twice_reduce', loadKg: 6 });
  });

  it('holds on their lightest dumbbell when there is nothing lighter', () => {
    const history = [log(id, sets([6, 6, 5], 4)), log(id, sets([7, 6, 6], 4))];
    expect(nextTarget(slot(id), history, home)).toMatchObject({ reason: 'hold', loadKg: 4 });
  });

  it('treats adjustable dumbbells (no weights listed) like the gym', () => {
    const adjustable = settings({ location: 'home_equipment', homeEquipment: ['dumbbell'], dumbbellWeightsKg: [] });
    expect(nextTarget(slot(id), [log(id, sets([12, 12, 12], 10))], adjustable).loadKg).toBe(12);
  });
});

describe('bodyweight ladder', () => {
  const homeNone = settings({ location: 'home_none' });
  const pushSlot = (id: string, overrides: Partial<PlannedSlot> = {}) => slot(id, { slotId: 'full_a:horizontal_push:0', ...overrides });
  const pushLog = (id: string, s: LoggedSet[], rating?: SessionRating) => log(id, s, rating, 'full_a:horizontal_push:0');

  it('has no weight to pick the first time', () => {
    expect(nextTarget(pushSlot('push-up'), [], homeNone)).toMatchObject({ reason: 'first_time', reps: 8 });
  });

  it('aims for one more rep inside the range', () => {
    expect(nextTarget(pushSlot('push-up'), [pushLog('push-up', sets([10, 9, 9]))], homeNone)).toMatchObject({ reason: 'in_range_add_reps', reps: 10 });
  });

  it('steps up to the harder move with reps back at the bottom of the range', () => {
    const target = nextTarget(pushSlot('push-up'), [pushLog('push-up', sets([12, 12, 12]))], homeNone);
    expect(target).toMatchObject({ reason: 'ladder_step_up', exerciseId: 'feet-elevated-push-up', reps: 8 });
  });

  it('explains the step-up again on the first session of the harder move', () => {
    const target = nextTarget(pushSlot('feet-elevated-push-up'), [pushLog('push-up', sets([12, 12, 12]))], homeNone);
    expect(target).toMatchObject({ reason: 'ladder_step_up', exerciseId: 'feet-elevated-push-up' });
  });

  it('adds a set at the end of the ladder, up to 4, then holds', () => {
    const top = 'feet-elevated-push-up';
    expect(nextTarget(pushSlot(top), [pushLog(top, sets([12, 12, 12]))], homeNone)).toMatchObject({ reason: 'add_set', sets: 4 });
    expect(nextTarget(pushSlot(top), [pushLog(top, sets([12, 12, 12, 12]))], homeNone)).toMatchObject({ reason: 'hold', sets: 4 });
  });

  it('never climbs to a move the user is not allowed (jumping when intensity is capped)', () => {
    const capped = settings({ location: 'home_none', lowIntensity: true });
    const target = nextTarget(slot('bodyweight-squat'), [log('bodyweight-squat', sets([12, 12, 12]))], capped);
    expect(target).toMatchObject({ reason: 'add_set', exerciseId: 'bodyweight-squat' });
  });

  it('never climbs to a move another slot of the session already uses', () => {
    const target = nextTarget(pushSlot('push-up'), [pushLog('push-up', sets([12, 12, 12]))], homeNone, new Set(['feet-elevated-push-up']));
    expect(target).toMatchObject({ reason: 'add_set', exerciseId: 'push-up' });
  });

  it('holds the move when the last session felt hard', () => {
    expect(nextTarget(pushSlot('push-up'), [pushLog('push-up', sets([12, 12, 12]), 'hard')], homeNone).reason).toBe('felt_hard_hold');
  });

  it('times holds in seconds through the same rules', () => {
    const plank = slot('plank', { slotId: 'full_a:core:0', unit: 'seconds', repMin: 30, repMax: 45 });
    expect(nextTarget(plank, [log('plank', sets([40, 35, 35]), undefined, 'full_a:core:0')], homeNone)).toMatchObject({ reason: 'in_range_add_reps', reps: 36 });
  });
});

describe('applyLadder', () => {
  it('stores the harder move as a swap so the plan keeps it', () => {
    const plan = generateWeeklyPlan(settings({ location: 'home_none' }), { seed: 3, today: '2026-10-19' });
    const pushUp = plan.sessions.flatMap((s) => s.slots).find((s) => s.exerciseId === 'push-up' || s.exerciseId === 'incline-push-up');
    expect(pushUp).toBeDefined();
    const history = [log(pushUp!.exerciseId, sets(Array(pushUp!.sets).fill(pushUp!.repMax)), undefined, pushUp!.slotId)];
    const next = applyLadder(plan, history, [pushUp!]);
    const harder = getExercise(pushUp!.exerciseId)!.harder!;
    expect(next.swaps[pushUp!.slotId]).toBe(harder);
    expect(exerciseForWeek(next, pushUp!.slotId, 0)).toBe(harder);
    expect(applyLadder(plan, [], [pushUp!])).toBe(plan);
  });

  it('does not climb into a move another slot of the session holds', () => {
    const plan = generateWeeklyPlan(settings({ location: 'home_none' }), { seed: 3, today: '2026-10-19' });
    const bridge = slot('glute-bridge', { slotId: 'full_a:glutes:0', sets: 2, repMax: 15 });
    const other = slot('single-leg-glute-bridge', { slotId: 'full_a:glutes:1', sets: 2, repMax: 15 });
    const history = [log('glute-bridge', sets([15, 15]), undefined, 'full_a:glutes:0')];
    expect(applyLadder(plan, history, [bridge, other])).toBe(plan);
  });
});

describe('Ramadan mode', () => {
  const fasting = settings({ ramadan: { enabled: true, slot: 'before_iftar' } });

  it('never raises the weight while fasting, even at the top of the range', () => {
    const target = nextTarget(slot('barbell-squat'), [log('barbell-squat', sets([12, 12, 12], 60))], fasting);
    expect(target).toMatchObject({ reason: 'ramadan_hold', loadKg: 60, reps: 12 });
  });

  it('still lets reps creep up inside the range', () => {
    expect(nextTarget(slot('barbell-squat'), [log('barbell-squat', sets([10, 9, 9], 60))], fasting)).toMatchObject({ reason: 'ramadan_hold', loadKg: 60, reps: 10 });
  });

  it('keeps the 10% cut after two sessions below the range', () => {
    const history = [log('barbell-squat', sets([8, 7, 6], 60)), log('barbell-squat', sets([8, 8, 7], 60))];
    expect(nextTarget(slot('barbell-squat'), history, fasting)).toMatchObject({ reason: 'failed_twice_reduce', loadKg: 52.5 });
  });

  it('does not climb the bodyweight ladder or add sets while fasting', () => {
    const homeFasting = settings({ location: 'home_none', ramadan: { enabled: true, slot: 'after_taraweeh' } });
    const push = slot('push-up', { slotId: 'full_a:horizontal_push:0' });
    const target = nextTarget(push, [log('push-up', sets([12, 12, 12]), undefined, 'full_a:horizontal_push:0')], homeFasting);
    expect(target).toMatchObject({ reason: 'ramadan_hold', exerciseId: 'push-up', sets: 3 });
  });
});
