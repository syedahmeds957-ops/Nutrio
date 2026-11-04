import { describe, expect, it } from 'vitest';
import {
  adjustTdeeForTraining,
  estimateWeeklyExerciseKcal,
  estimateWorkoutPlanWeeklyKcal,
} from '../src/exercise.js';

describe('estimateWeeklyExerciseKcal', () => {
  it('gives the same numbers it gave in the survey bridge', () => {
    // 4 × 60 min × 6.5
    expect(estimateWeeklyExerciseKcal('gym_resistance', 4, 60, 'moderate')).toBe(1560);
    // 3 × 45 min × 10 × 1.25 = 1687.5
    expect(estimateWeeklyExerciseKcal('cardio_running', 3, 45, 'high')).toBe(1688);
    // 5 × 30 min × 5.5 × 0.8
    expect(estimateWeeklyExerciseKcal('home_calisthenics', 5, 30, 'light')).toBe(660);
    expect(estimateWeeklyExerciseKcal('sports_cricket_football', 2, 90, 'moderate')).toBe(1440);
    expect(estimateWeeklyExerciseKcal('daily_brisk_walking', 7, 30, 'moderate')).toBe(840);
  });

  it('is zero with no training or no days', () => {
    expect(estimateWeeklyExerciseKcal('none', 5, 60, 'high')).toBe(0);
    expect(estimateWeeklyExerciseKcal('gym_resistance', 0, 60, 'high')).toBe(0);
  });
});

describe('estimateWorkoutPlanWeeklyKcal', () => {
  it('prices each part of a session at its own rate', () => {
    expect(
      estimateWorkoutPlanWeeklyKcal([
        { minutes: 40, style: 'resistance' }, // 260
        { minutes: 30, style: 'bodyweight' }, // 165
        { minutes: 10, style: 'conditioning' }, // 80
        { minutes: 15, style: 'walking' }, // 60
      ])
    ).toBe(565);
  });

  it('is zero for an empty week and ignores negative minutes', () => {
    expect(estimateWorkoutPlanWeeklyKcal([])).toBe(0);
    expect(estimateWorkoutPlanWeeklyKcal([{ minutes: -10, style: 'resistance' }])).toBe(0);
  });
});

describe('adjustTdeeForTraining', () => {
  it('swaps the counted estimate for the new one, per day', () => {
    // (2100 − 1400) / 7 = 100
    expect(adjustTdeeForTraining(2400, 1400, 2100)).toBe(2500);
    expect(adjustTdeeForTraining(2400, 2100, 1400)).toBe(2300);
  });

  it('does not move when the training is already counted', () => {
    expect(adjustTdeeForTraining(2400, 1560, 1560)).toBe(2400);
  });
});
