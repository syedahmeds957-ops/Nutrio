import { useEffect, useState } from 'react';
import type * as WorkoutCoreModule from '@nutrio/workout-core';

type WorkoutCore = typeof WorkoutCoreModule;

/**
 * The workout engine carries the exercise catalogue (about 180 KB of data), so
 * on the web build it is its own download rather than part of the first paint,
 * the same arrangement as the food catalogue (see `catalogue/index.ts`). Code
 * that needs it calls the wrappers below, which are only safe once
 * `loadWorkoutCore()` has resolved: the app waits for it on the splash, tests
 * wait for it in their setup file.
 *
 * Types still come straight from '@nutrio/workout-core'; they are erased.
 */
let loaded: WorkoutCore | null = null;
let pending: Promise<WorkoutCore> | null = null;
const listeners = new Set<() => void>();

export function loadWorkoutCore(): Promise<WorkoutCore> {
  pending ??= import('@nutrio/workout-core').then((mod) => {
    loaded = mod;
    listeners.forEach((notify) => notify());
    return mod;
  });
  return pending;
}

export function isWorkoutCoreLoaded(): boolean {
  return loaded !== null;
}

function workoutCore(): WorkoutCore {
  if (!loaded) {
    throw new Error('The workout engine is not loaded yet. Await loadWorkoutCore() first.');
  }
  return loaded;
}

/** True once the engine is in memory; starts loading it if nothing has yet. */
export function useWorkoutCoreReady(): boolean {
  const [ready, setReady] = useState(isWorkoutCoreLoaded());
  useEffect(() => {
    if (isWorkoutCoreLoaded()) {
      setReady(true);
      return;
    }
    const onLoaded = () => setReady(true);
    listeners.add(onLoaded);
    void loadWorkoutCore();
    return () => {
      listeners.delete(onLoaded);
    };
  }, []);
  return ready;
}

/** A function from the engine, resolved at call time so the module can load late. */
function fromCore<K extends keyof WorkoutCore>(name: K): WorkoutCore[K] {
  return ((...args: unknown[]) => (workoutCore()[name] as (...a: unknown[]) => unknown)(...args)) as WorkoutCore[K];
}

export const getExercise = fromCore('getExercise');
export const isAllowed = fromCore('isAllowed');
export const planSettings = fromCore('planSettings');
export const nextTarget = fromCore('nextTarget');
export const exerciseForWeek = fromCore('exerciseForWeek');
export const weekIndexFor = fromCore('weekIndexFor');
export const planForDate = fromCore('planForDate');
export const upgradePlan = fromCore('upgradePlan');
export const generateWeeklyPlan = fromCore('generateWeeklyPlan');
export const applyLadder = fromCore('applyLadder');
export const applySwap = fromCore('applySwap');
export const regeneratePlan = fromCore('regeneratePlan');
export const resetSwap = fromCore('resetSwap');
export const swapCandidates = fromCore('swapCandidates');

/** `err instanceof InvalidSwap`, without importing the class ahead of the engine. */
export function isInvalidSwap(err: unknown): boolean {
  return err instanceof workoutCore().InvalidSwap;
}
