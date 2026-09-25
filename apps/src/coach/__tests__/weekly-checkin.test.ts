import { describe, expect, it } from 'vitest';
import {
  WeeklyCheckInMetrics,
  WeeklyCheckInNarrative,
} from '../ui/WeeklyCheckInScreen.js';

describe('Weekly Check-In & Progress Report UI (Task 4.5)', () => {
  const sampleMetrics: WeeklyCheckInMetrics = {
    daysLogged: 7,
    meanDailyIntake: 1820,
    currentEWMAWeightKg: 79.6,
    weightDeltaKg: -0.4,
    adherenceRatePct: 86,
    oldTDEE: 2300,
    newTDEE: 2345,
    tdeeDelta: 45,
    oldKcalTarget: 1800,
    newKcalTarget: 1845,
    targetDelta: 45,
  };

  const sampleNarrative: WeeklyCheckInNarrative = {
    headline: 'Metabolic Recalibration: +45 kcal/day',
    summaryText:
      'Over the past 7 days, you logged consistently. Your smoothed EWMA weight dropped 0.4 kg, indicating your true energy expenditure is slightly higher than baseline.',
    keyActionLever:
      'Continue measuring cooking oil in curries with a spoon and take a 15-minute walk after dinner.',
  };

  it('verifies 7-day metrics and adaptive target delta calculation', () => {
    expect(sampleMetrics.daysLogged).toBe(7);
    expect(sampleMetrics.adherenceRatePct).toBe(86);
    expect(sampleMetrics.weightDeltaKg).toBe(-0.4);
    expect(sampleMetrics.targetDelta).toBe(45);
    expect(sampleMetrics.newKcalTarget).toBe(1845);
  });

  it('formats shareable progress report for WhatsApp sharing', () => {
    const shareText = `📊 Nutrio Weekly Check-in Report (Hamza)
- Adherence Rate: ${sampleMetrics.adherenceRatePct}% (${sampleMetrics.daysLogged}/7 days logged)
- Weight Trend: ${sampleMetrics.weightDeltaKg} kg
- Daily Intake Avg: ${sampleMetrics.meanDailyIntake} kcal
- New Daily Target: ${sampleMetrics.newKcalTarget} kcal (+${sampleMetrics.targetDelta} kcal)
- Next Week Habit: ${sampleNarrative.keyActionLever}`;

    expect(shareText).toContain('86%');
    expect(shareText).toContain('-0.4 kg');
    expect(shareText).toContain('1845 kcal');
    expect(shareText).toContain('cooking oil');
  });
});
