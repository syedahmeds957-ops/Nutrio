import { describe, expect, it } from 'vitest';
import { getExercise } from '../src/catalogue.js';
import { generateWeeklyPlan, regeneratePlan } from '../src/generator.js';
import { changeGroup, describeRoutineChanges, layoutForRoutine, type RoutineChange } from '../src/routine.js';
import { isAllowed } from '../src/select.js';
import { ImportedRoutine, TrainingProfile, Weekday, WorkoutSettings } from '../src/types.js';

function settingsFor(routine: ImportedRoutine, overrides: Partial<WorkoutSettings> = {}, profile: TrainingProfile = {}): WorkoutSettings {
  return {
    goal: 'muscle',
    experience: 'some',
    location: 'gym',
    homeEquipment: [],
    dumbbellWeightsKg: [],
    trainingDays: routine.days.map((d) => d.day),
    sessionMinutes: 60,
    focus: [],
    protectedJoints: [],
    lowIntensity: false,
    ramadan: { enabled: false },
    ...overrides,
    profile: { trainingNow: { active: true }, ...profile, routine },
  };
}
const day = (d: Weekday, ids: string[], sets = 3, reps = 10) => ({ day: d, exercises: ids.map((exerciseId) => ({ exerciseId, sets, reps })) });
const make = (s: WorkoutSettings) => generateWeeklyPlan(s, { seed: 6, today: '2026-10-19' });
const kinds = (changes: RoutineChange[]) => changes.map((c) => c.kind);

/** The same checks every generated plan passes: safe, on time, no repeats in a session. */
function expectSoundPlan(s: WorkoutSettings) {
  const plan = make(s);
  for (const session of plan.sessions) {
    const ids = session.slots.map((slot) => slot.exerciseId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(isAllowed(getExercise(id)!, s)).toBe(true);
    expect(session.estimatedMinutes).toBeLessThanOrEqual(s.sessionMinutes + 5);
  }
  return plan;
}

const BRO_SPLIT: ImportedRoutine = {
  days: [
    day('mon', ['barbell-bench-press', 'incline-dumbbell-press', 'pec-deck', 'cable-crossover'], 4, 10),
    day('tue', ['wide-grip-lat-pulldown', 'seated-cable-row', 'barbell-curl', 'hammer-curl'], 4, 10),
    day('wed', ['barbell-squat', 'leg-press', 'lying-leg-curl', 'standing-calf-raise-machine'], 4, 10),
    day('thu', ['dumbbell-shoulder-press', 'side-lateral-raise', 'cable-rear-delt-fly'], 4, 12),
    day('fri', ['barbell-curl', 'triceps-pushdown', 'hammer-curl', 'ez-bar-skull-crusher'], 4, 12),
  ],
};

describe('a routine the user already follows', () => {
  it('keeps their days and most of their exercises, and every change has a group', () => {
    const s = settingsFor(BRO_SPLIT);
    const plan = expectSoundPlan(s);
    expect(plan.sessions.map((x) => x.day)).toEqual(['mon', 'tue', 'wed', 'thu', 'fri']);
    const changes = describeRoutineChanges(BRO_SPLIT, plan);
    const kept = changes.find((c) => c.kind === 'kept_exercises');
    expect(kept && kept.kind === 'kept_exercises' && kept.exerciseIds.length).toBeGreaterThanOrEqual(8);
    expect(kinds(changes)).not.toContain('rebalanced');
    for (const change of changes) expect(['kept', 'changed', 'added']).toContain(changeGroup(change));
    expect(kinds(changes)).toContain('added_cardio');
  });

  it('keeps the routine through an edit of the plan', () => {
    const s = settingsFor(BRO_SPLIT);
    const plan = make(s);
    const again = regeneratePlan(plan, { ...s, sessionMinutes: 75 });
    expect(again.sessions.map((x) => x.template)).toEqual(plan.sessions.map((x) => x.template));
    expect(again.sessions[0].slots.map((x) => x.exerciseId)).toContain('barbell-bench-press');
  });

  it('rebalances a push-only beginner week and says what was missing', () => {
    const routine: ImportedRoutine = {
      days: [day('mon', ['barbell-bench-press', 'push-up', 'triceps-pushdown']), day('wed', ['incline-dumbbell-press', 'dumbbell-shoulder-press']), day('fri', ['machine-chest-press', 'side-lateral-raise'])],
    };
    const s = settingsFor(routine);
    const plan = expectSoundPlan(s);
    const changes = describeRoutineChanges(routine, plan);
    expect(changes).toContainEqual({ kind: 'rebalanced', missing: ['pull', 'lower'] });
    const patterns = plan.sessions.flatMap((x) => x.slots.map((slot) => slot.pattern));
    expect(patterns.some((p) => p === 'horizontal_pull' || p === 'vertical_pull')).toBe(true);
    expect(patterns.some((p) => p === 'squat' || p === 'hinge' || p === 'lunge')).toBe(true);
    expect(kinds(changes)).toContain('balanced_push_pull');
  });

  it('rebalances legs every day', () => {
    const routine: ImportedRoutine = { days: (['mon', 'tue', 'wed', 'thu', 'fri'] as Weekday[]).map((d) => day(d, ['barbell-squat', 'leg-press'])) };
    const changes = describeRoutineChanges(routine, expectSoundPlan(settingsFor(routine)));
    expect(changes).toContainEqual({ kind: 'rebalanced', missing: ['push', 'pull'] });
  });

  it('trims a 90-minute day to the chosen length and says what was left out', () => {
    const routine: ImportedRoutine = {
      days: [
        day('mon', ['barbell-bench-press', 'incline-dumbbell-press', 'machine-chest-press', 'pec-deck', 'cable-crossover', 'dumbbell-shoulder-press', 'side-lateral-raise', 'triceps-pushdown', 'ez-bar-skull-crusher']),
        day('wed', ['wide-grip-lat-pulldown', 'seated-cable-row', 'barbell-curl']),
        day('fri', ['barbell-squat', 'romanian-deadlift', 'leg-press']),
      ],
    };
    const s = settingsFor(routine, { sessionMinutes: 45 });
    const changes = describeRoutineChanges(routine, expectSoundPlan(s));
    const leftOut = changes.find((c) => c.kind === 'left_out' && c.day === 'mon');
    expect(leftOut).toBeDefined();
  });

  it('replaces moves that load a protected knee, with the reason', () => {
    const routine: ImportedRoutine = {
      days: [day('mon', ['barbell-squat', 'barbell-bench-press', 'seated-cable-row']), day('thu', ['walking-lunge', 'dumbbell-shoulder-press', 'wide-grip-lat-pulldown'])],
    };
    const s = settingsFor(routine, { protectedJoints: ['knee'] });
    const plan = expectSoundPlan(s);
    const replaced = describeRoutineChanges(routine, plan).filter((c) => c.kind === 'replaced');
    expect(replaced.map((c) => c.kind === 'replaced' && c.from)).toEqual(expect.arrayContaining(['barbell-squat', 'walking-lunge']));
    expect(replaced.every((c) => c.kind === 'replaced' && c.why === 'joint')).toBe(true);
    // Each names what took its place (a related movement when the same one isn't safe).
    expect(replaced.every((c) => c.kind === 'replaced' && c.to !== null)).toBe(true);
  });

  it('replaces gym exercises for a home user with no equipment', () => {
    const routine: ImportedRoutine = { days: [day('mon', ['barbell-bench-press', 'barbell-squat']), day('thu', ['wide-grip-lat-pulldown', 'push-up'])] };
    const s = settingsFor(routine, { location: 'home_none' });
    const changes = describeRoutineChanges(routine, expectSoundPlan(s));
    const replaced = changes.filter((c) => c.kind === 'replaced');
    expect(replaced.length).toBeGreaterThanOrEqual(3);
    expect(replaced.every((c) => c.kind === 'replaced' && c.why === 'equipment')).toBe(true);
    expect(changes.find((c) => c.kind === 'kept_exercises')).toMatchObject({ exerciseIds: ['push-up'] });
  });

  it('leaves a good routine nearly unchanged', () => {
    // Start from one of our own plans, entered back as a routine.
    const base = generateWeeklyPlan(settingsFor({ days: [day('mon', []), day('tue', []), day('thu', []), day('fri', [])] }, {}, {}), { seed: 1, today: '2026-10-19' });
    const routine: ImportedRoutine = { days: base.sessions.map((s) => ({ day: s.day, exercises: s.slots.map((slot) => ({ exerciseId: slot.exerciseId, sets: slot.sets, reps: slot.repMin })) })) };
    const s = settingsFor(routine);
    const plan = expectSoundPlan(s);
    const changes = describeRoutineChanges(routine, plan);
    expect(kinds(changes).filter((k) => !['kept_days', 'kept_exercises', 'added_cardio'].includes(k))).toEqual([]);
  });

  it('moves leg day away from cricket and says so', () => {
    const routine: ImportedRoutine = {
      days: [day('mon', ['barbell-bench-press', 'seated-cable-row']), day('tue', ['barbell-squat', 'romanian-deadlift']), day('thu', ['dumbbell-shoulder-press', 'wide-grip-lat-pulldown']), day('fri', ['leg-press', 'lying-leg-curl'])],
    };
    const s = settingsFor(routine, {}, { sports: [{ kind: 'cricket', days: ['sat'] }] });
    const layout = layoutForRoutine(['mon', 'tue', 'thu', 'fri'], routine, s);
    expect(layout.templates[3]).not.toBe('lower');
    const changes = describeRoutineChanges(routine, make(s));
    expect(changes.some((c) => c.kind === 'moved' && c.from === 'fri')).toBe(true);
  });
});

describe('balance and replacements', () => {
  it('turns a second push day into an upper-body day so pushing and pulling even out', () => {
    const routine: ImportedRoutine = {
      days: [
        day('mon', ['barbell-bench-press', 'incline-dumbbell-press']),
        day('tue', ['wide-grip-lat-pulldown', 'barbell-curl']),
        day('thu', ['barbell-squat', 'leg-press']),
        day('fri', ['ez-bar-skull-crusher', 'triceps-pushdown']),
      ],
    };
    const s = settingsFor(routine);
    const layout = layoutForRoutine(['mon', 'tue', 'thu', 'fri'], routine, s);
    expect(layout.templates.filter((t) => t === 'push')).toHaveLength(1);
    expect(layout.templates).toContain('upper');
    const changes = describeRoutineChanges(routine, make(s));
    const pp = changes.find((c) => c.kind === 'balanced_push_pull');
    if (pp && pp.kind === 'balanced_push_pull') expect(Math.max(pp.toPush, pp.toPull)).toBeLessThanOrEqual(1.5 * Math.min(pp.toPush, pp.toPull));
  });

  it('never names the same replacement for two moves', () => {
    const routine: ImportedRoutine = {
      days: [day('mon', ['barbell-bench-press', 'seated-cable-row']), day('thu', ['barbell-squat', 'leg-press', 'wide-grip-lat-pulldown'])],
    };
    const changes = describeRoutineChanges(routine, make(settingsFor(routine, { protectedJoints: ['knee'] })));
    const targets = changes.flatMap((c) => (c.kind === 'replaced' && c.to ? [c.to] : []));
    expect(new Set(targets).size).toBe(targets.length);
  });
});
