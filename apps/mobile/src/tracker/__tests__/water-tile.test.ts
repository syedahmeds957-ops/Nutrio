import { describe, expect, it } from 'vitest';
import { DEFAULT_WATER_TARGET_ML, waterGoalPercent, waterLitres, waterTargetMl } from '../waterTile.js';

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

describe('water goal formatting', () => {
  it('falls back to one default goal', () => {
    expect(waterTargetMl(0)).toBe(DEFAULT_WATER_TARGET_ML);
    expect(waterTargetMl(undefined)).toBe(DEFAULT_WATER_TARGET_ML);
    expect(waterTargetMl(2170)).toBe(2170);
  });
  it('shows litres to one decimal, so 2,170 ml reads 2.2 everywhere', () => {
    expect(waterLitres(2170)).toBe(2.2);
    expect(waterLitres(2500)).toBe(2.5);
    expect(waterLitres(250)).toBe(0.3);
    expect(waterLitres(0)).toBe(0);
    expect(waterLitres(250, 2)).toBe(0.25);
    expect(waterLitres(1250, 2)).toBe(1.25);
  });
});
