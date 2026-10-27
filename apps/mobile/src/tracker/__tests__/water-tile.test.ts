import { describe, expect, it } from 'vitest';
import { waterGoalPercent } from '../waterTile.js';

describe('waterGoalPercent', () => {
  it('is the rounded share of the goal', () => {
    expect(waterGoalPercent(2500, 3600)).toBe(69);
    expect(waterGoalPercent(250, 2500)).toBe(10);
  });
  it('clamps to 0-100', () => {
    expect(waterGoalPercent(5000, 2500)).toBe(100);
    expect(waterGoalPercent(-100, 2500)).toBe(0);
  });
  it('is 0 without a target', () => {
    expect(waterGoalPercent(500, 0)).toBe(0);
  });
});
