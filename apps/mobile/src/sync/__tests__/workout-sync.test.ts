import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateWeeklyPlan, type WeeklyWorkoutPlan, type WorkoutLog, type WorkoutSettings } from '@nutrio/workout-core';
import type { AuthSession } from '../../auth/types.js';

/** What each query on the fake client was called with, in order. */
interface Call {
  table: string;
  op: string;
  args: unknown[];
}

let calls: Call[] = [];
let responses: Record<string, { data?: unknown; error: { message: string } | null }> = {};
let configured = true;

function query(table: string) {
  const chain: Record<string, unknown> = {};
  for (const op of ['upsert', 'select', 'eq', 'gte', 'order', 'maybeSingle']) {
    chain[op] = (...args: unknown[]) => {
      calls.push({ table, op, args });
      return chain;
    };
  }
  chain.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
    Promise.resolve(responses[table] ?? { data: null, error: null }).then(resolve, reject);
  return chain;
}

vi.mock('../../supabase/client.js', async (importActual) => ({
  ...(await importActual<typeof import('../../supabase/client.js')>()),
  isSupabaseConfigured: () => configured,
  supabase: { schema: () => ({ from: (table: string) => query(table) }) },
}));

vi.mock('../userDataSync.js', () => ({
  resolveCurrentProfileId: async () => 'profile-1',
}));

const { clearAuthSession, saveAuthSession } = await import('../../auth/authStorage.js');
const { applyWorkoutBackup, fetchWorkoutBackup, fetchWorkoutLogs, fetchWorkoutPlan, pushWorkoutLogs, pushWorkoutPlan } =
  await import('../workoutSync.js');
const { loadWorkoutPlan, releaseWorkoutCache, saveWorkoutPlan } = await import('../../workout/workoutStorage.js');
const { loadWorkoutLogs, releaseWorkoutLogCache, saveWorkoutLog } = await import('../../workout/workoutLogStorage.js');
const { swapExercise } = await import('../../workout/planActions.js');
const { swapCandidates } = await import('@nutrio/workout-core');

function sessionFor(id: string): AuthSession {
  return {
    token: `tok_${id}`,
    user: { id, name: id, email: `${id}@nutrio.app`, isRegistered: true, surveyCompleted: true },
    createdAt: new Date().toISOString(),
  };
}

const SETTINGS: WorkoutSettings = {
  goal: 'muscle',
  experience: 'some',
  location: 'gym',
  homeEquipment: [],
  dumbbellWeightsKg: [],
  trainingDays: ['mon', 'wed', 'fri'],
  sessionMinutes: 45,
  focus: [],
  protectedJoints: [],
  lowIntensity: false,
  ramadan: { enabled: false },
};

const makePlan = (seed: number, updatedAt: string): WeeklyWorkoutPlan => ({
  ...generateWeeklyPlan(SETTINGS, { seed, today: '2026-10-19', now: '2026-10-19T08:00:00.000Z' }),
  updatedAt,
});

function log(dateKey: string, day: WorkoutLog['day'], finishedAt = `${dateKey}T11:00:00.000Z`): WorkoutLog {
  return {
    dateKey,
    day,
    template: 'full_a',
    exercises: [{ slotId: 'full_a:squat:0', exerciseId: 'barbell-squat', sets: [{ reps: 10, loadKg: 60, done: true }] }],
    startedAt: `${dateKey}T10:00:00.000Z`,
    finishedAt,
  };
}

const TODAY = '2026-10-25';
const upserts = (table: string) => calls.filter((c) => c.table === table && c.op === 'upsert');

describe('workout sync', () => {
  beforeEach(async () => {
    calls = [];
    responses = {};
    configured = true;
    releaseWorkoutCache();
    releaseWorkoutLogCache();
    await AsyncStorage.clear();
  });

  afterEach(async () => {
    await clearAuthSession();
  });

  it('never touches the network for a guest', async () => {
    const plan = makePlan(1, '2026-10-24T10:00:00.000Z');
    expect(await pushWorkoutPlan(plan)).toEqual({ success: false, error: 'Not authenticated.' });
    expect(await pushWorkoutLogs([{ dateKey: TODAY, logs: [log(TODAY, 'sun')] }])).toMatchObject({ success: false });
    expect(await fetchWorkoutPlan()).toMatchObject({ success: false });
    expect(await fetchWorkoutBackup(TODAY)).toBeNull();
    expect(calls).toEqual([]);
  });

  it('never touches the network without a backend, even when signed in', async () => {
    saveAuthSession(sessionFor('user_offline'));
    configured = false;
    expect(await pushWorkoutPlan(makePlan(1, '2026-10-24T10:00:00.000Z'))).toEqual({ success: false, error: 'Backend not configured.' });
    expect(await fetchWorkoutBackup(TODAY)).toBeNull();
    expect(calls).toEqual([]);
  });

  it('pushes the plan as one row per user, stamped with its own save time', async () => {
    saveAuthSession(sessionFor('user_push'));
    const plan = makePlan(1, '2026-10-24T10:00:00.000Z');
    expect(await pushWorkoutPlan(plan)).toEqual({ success: true });
    expect(upserts('workout_plans')).toEqual([
      {
        table: 'workout_plans',
        op: 'upsert',
        args: [{ user_id: 'profile-1', plan, updated_at: '2026-10-24T10:00:00.000Z' }, { onConflict: 'user_id' }],
      },
    ]);
  });

  it('pushes each day with every workout done on it', async () => {
    saveAuthSession(sessionFor('user_days'));
    const day = [log('2026-10-22', 'wed'), log('2026-10-22', 'mon')];
    expect(await pushWorkoutLogs([{ dateKey: '2026-10-22', logs: day }])).toEqual({ success: true });
    const [row] = upserts('workout_logs');
    expect(row.args[1]).toEqual({ onConflict: 'user_id,log_date' });
    expect(row.args[0]).toEqual([expect.objectContaining({ user_id: 'profile-1', log_date: '2026-10-22', logs: day })]);
    // Nothing to send is not a request.
    calls = [];
    expect(await pushWorkoutLogs([])).toEqual({ success: true });
    expect(calls).toEqual([]);
  });

  it('maps fetched rows back, dropping anything that is not a usable plan or log', async () => {
    saveAuthSession(sessionFor('user_fetch'));
    const plan = makePlan(2, '2026-10-24T10:00:00.000Z');
    responses.workout_plans = { data: { plan, updated_at: '2026-10-24T10:00:00+00:00' }, error: null };
    responses.workout_logs = {
      data: [
        { log_date: '2026-10-22', logs: [log('2026-10-22', 'wed'), { junk: true }] },
        { log_date: '2026-10-20', logs: 'not a list' },
      ],
      error: null,
    };
    expect(await fetchWorkoutPlan()).toEqual({ success: true, plan: { plan, updatedAt: '2026-10-24T10:00:00+00:00' } });
    expect(await fetchWorkoutLogs('2025-10-25')).toEqual({ success: true, logs: [log('2026-10-22', 'wed')] });
    expect(calls).toContainEqual({ table: 'workout_logs', op: 'gte', args: ['log_date', '2025-10-25'] });

    responses.workout_plans = { data: null, error: null };
    expect(await fetchWorkoutPlan()).toEqual({ success: true, plan: null });
    responses.workout_plans = { data: { plan: { version: 99 }, updated_at: '2026-10-24T10:00:00+00:00' }, error: null };
    expect(await fetchWorkoutPlan()).toEqual({ success: true, plan: null });
  });

  it('returns Supabase errors instead of throwing', async () => {
    saveAuthSession(sessionFor('user_error'));
    responses.workout_plans = { error: { message: 'permission denied' } };
    responses.workout_logs = { error: { message: 'relation does not exist' } };
    expect(await pushWorkoutPlan(makePlan(1, '2026-10-24T10:00:00.000Z'))).toEqual({ success: false, error: 'permission denied' });
    expect(await fetchWorkoutPlan()).toEqual({ success: false, error: 'permission denied' });
    expect(await pushWorkoutLogs([{ dateKey: TODAY, logs: [] }])).toEqual({ success: false, error: 'relation does not exist' });
    expect(await fetchWorkoutLogs('2025-10-25')).toEqual({ success: false, error: 'relation does not exist' });
  });

  describe('restore', () => {
    it('takes a newer cloud plan and merges logs without pushing what the cloud already has', async () => {
      saveAuthSession(sessionFor('user_restore'));
      saveWorkoutPlan(makePlan(1, '2026-10-20T10:00:00.000Z'));
      saveWorkoutLog(log('2026-10-22', 'wed'), TODAY);
      const cloudPlan = makePlan(2, '2026-10-24T10:00:00.000Z');
      responses.workout_plans = { data: { plan: cloudPlan, updated_at: '2026-10-24T10:00:00+00:00' }, error: null };
      responses.workout_logs = { data: [{ log_date: '2026-10-20', logs: [log('2026-10-20', 'mon')] }], error: null };

      applyWorkoutBackup(await fetchWorkoutBackup(TODAY), TODAY);

      expect(loadWorkoutPlan()?.seed).toBe(2);
      expect(loadWorkoutLogs().map((l) => l.dateKey)).toEqual(['2026-10-22', '2026-10-20']);
      await vi.waitFor(() => expect(upserts('workout_logs')).toHaveLength(1));
      expect(upserts('workout_plans')).toEqual([]);
      expect(upserts('workout_logs')[0].args[0]).toEqual([expect.objectContaining({ log_date: '2026-10-22' })]);
    });

    it('keeps a newer device plan and backs it up', async () => {
      saveAuthSession(sessionFor('user_local_newer'));
      const local = makePlan(1, '2026-10-24T12:00:00.000Z');
      saveWorkoutPlan(local);
      responses.workout_plans = { data: { plan: makePlan(2, '2026-10-24T10:00:00.000Z'), updated_at: '2026-10-24T10:00:00+00:00' }, error: null };
      responses.workout_logs = { data: [], error: null };

      applyWorkoutBackup(await fetchWorkoutBackup(TODAY), TODAY);

      expect(loadWorkoutPlan()?.seed).toBe(1);
      await vi.waitFor(() => expect(upserts('workout_plans')).toHaveLength(1));
      expect(upserts('workout_plans')[0].args[0]).toMatchObject({ updated_at: '2026-10-24T12:00:00.000Z' });
    });

    it('leaves both sides alone when a fetch fails, so an older device copy never overwrites the cloud', async () => {
      saveAuthSession(sessionFor('user_fetch_failed'));
      saveWorkoutPlan(makePlan(1, '2026-10-20T10:00:00.000Z'));
      saveWorkoutLog(log('2026-10-22', 'wed'), TODAY);
      responses.workout_plans = { error: { message: 'network down' } };
      responses.workout_logs = { error: { message: 'network down' } };

      applyWorkoutBackup(await fetchWorkoutBackup(TODAY), TODAY);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(loadWorkoutPlan()?.seed).toBe(1);
      expect(loadWorkoutLogs()).toHaveLength(1);
      expect(upserts('workout_plans')).toEqual([]);
      expect(upserts('workout_logs')).toEqual([]);
    });

    it('drops a backup that lands after the user signed out or switched account', async () => {
      saveAuthSession(sessionFor('user_a'));
      responses.workout_plans = { data: { plan: makePlan(2, '2026-10-24T10:00:00.000Z'), updated_at: '2026-10-24T10:00:00+00:00' }, error: null };
      responses.workout_logs = { data: [], error: null };
      const backup = await fetchWorkoutBackup(TODAY);

      saveAuthSession(sessionFor('user_b'));
      applyWorkoutBackup(backup, TODAY);
      expect(loadWorkoutPlan()).toBeNull();
    });
  });

  it('a swap is stamped with its save time and backed up', async () => {
    saveAuthSession(sessionFor('user_swap'));
    const plan = makePlan(1, '2026-10-20T10:00:00.000Z');
    saveWorkoutPlan(plan);
    const slot = plan.sessions[0].slots.find((s) => s.role === 'accessory')!;
    const choice = swapCandidates(plan, slot.slotId)[0].id;

    const swapped = swapExercise(plan, slot.slotId, choice, 0, new Date('2026-10-25T09:00:00.000Z'));

    expect(swapped.updatedAt).toBe('2026-10-25T09:00:00.000Z');
    expect(loadWorkoutPlan()).toEqual(swapped);
    await vi.waitFor(() => expect(upserts('workout_plans')).toHaveLength(1));
    expect(upserts('workout_plans')[0].args[0]).toMatchObject({ updated_at: '2026-10-25T09:00:00.000Z' });
  });
});
