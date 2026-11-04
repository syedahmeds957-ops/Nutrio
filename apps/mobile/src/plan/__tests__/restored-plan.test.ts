import { describe, expect, it } from 'vitest';
import { pickRestoredPlan } from '../restoredPlan.js';
import type { ComputedUserPlan } from '../types.js';

const plan = (recalibratedAt?: string, kcal = 1800) =>
  ({ recalibratedAt, targetResult: { kcalTarget: kcal } }) as unknown as ComputedUserPlan;

describe('pickRestoredPlan', () => {
  it('keeps a locally accepted recalibration the cloud never received', () => {
    // The sync after accepting failed (offline); the cloud still holds the old plan.
    const cloud = plan(undefined, 1800);
    const local = plan('2026-10-14', 1950);
    expect(pickRestoredPlan(cloud, local)).toBe(local);
  });

  it('prefers the cloud when it carries the same or a newer recalibration', () => {
    const cloud = plan('2026-10-14', 2000);
    expect(pickRestoredPlan(cloud, plan('2026-10-07'))).toBe(cloud);
    expect(pickRestoredPlan(cloud, plan('2026-10-14'))).toBe(cloud);
  });

  it('prefers the cloud when neither copy was recalibrated', () => {
    const cloud = plan();
    expect(pickRestoredPlan(cloud, plan())).toBe(cloud);
  });

  it('falls back to whichever copy exists', () => {
    const only = plan();
    expect(pickRestoredPlan(null, only)).toBe(only);
    expect(pickRestoredPlan(only, null)).toBe(only);
    expect(pickRestoredPlan(null, null)).toBeNull();
  });
});
