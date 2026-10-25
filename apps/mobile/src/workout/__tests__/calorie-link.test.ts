import { afterEach, describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import i18n from 'i18next';
import { generateWeeklyPlan, type WeeklyWorkoutPlan, type WorkoutSession, type WorkoutSettings } from '@nutrio/workout-core';
import { computePlan } from '../../plan/engine.js';
import type { ComputedUserPlan, PlanUserContext } from '../../plan/types.js';
import type { LifestyleSurveyPayload, SurveyExercise } from '../../survey/types.js';
import { initI18n } from '../../i18n/config.js';
import { MIN_TDEE_SHIFT_KCAL, proposeTargetUpdate, workoutPlanWeeklyKcal, type TargetUpdateProposal } from '../calorieLink.js';
import { TargetUpdateSheetBody } from '../ui/TargetUpdateSheet.js';

initI18n('en');

const SETTINGS: WorkoutSettings = {
  goal: 'general',
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

const CONTEXT: PlanUserContext = {
  weightKg: 80,
  heightCm: 180,
  ageYears: 30,
  sex: 'male',
  bmr: 1780,
  tdee: 2450,
  chaiSugarKcalPerDay: 130,
  weeklyChaiSugarKcal: 910,
  isNightShift: false,
  dailySittingHours: 8,
};

const workout = (overrides: Partial<WorkoutSettings> = {}, seed = 5) =>
  generateWeeklyPlan({ ...SETTINGS, ...overrides }, { seed, today: '2026-10-19' });

const survey = (exercise: Partial<SurveyExercise> = {}) =>
  ({
    exercise: { trainingType: 'none', frequencyDaysPerWeek: 0, sessionDurationMins: 0, intensity: 'moderate', ...exercise },
  }) as unknown as LifestyleSurveyPayload;

const nutrition = (context: Partial<PlanUserContext> = {}, extra: Partial<ComputedUserPlan> = {}): ComputedUserPlan => ({
  ...computePlan({ ...CONTEXT, ...context }, { goal: 'maintain', targetRateKgPerWeek: 0 }),
  region: 'PK',
  ...extra,
});

const session = (overrides: Partial<WorkoutSession>): WorkoutSession => ({
  day: 'mon',
  template: 'full_a',
  variant: null,
  slots: [],
  estimatedMinutes: 45,
  ...overrides,
});

describe('workoutPlanWeeklyKcal', () => {
  const plan = (sessions: WorkoutSession[], location: WorkoutSettings['location'] = 'gym', swaps = {}): WeeklyWorkoutPlan =>
    ({ ...workout(), settings: { ...SETTINGS, location }, sessions, swaps }) as WeeklyWorkoutPlan;
  const cardio = (intensity: 'easy' | 'moderate', exerciseId = 'stationary-bike') => ({
    slotId: 'full-a:cardio:0',
    exerciseId,
    minutes: 10,
    intensity,
    alternates: [],
  });

  it('counts strength at the gym or home rate and leaves cardio minutes out of it', () => {
    // 35 strength min × 6.5 + 10 easy min × 4.0
    expect(workoutPlanWeeklyKcal(plan([session({ cardio: cardio('easy') })]))).toBe(268);
    // 35 × 5.5 + 10 × 4.0
    expect(workoutPlanWeeklyKcal(plan([session({ cardio: cardio('easy') })], 'home_none'))).toBe(233);
  });

  it('counts moderate cardio and intervals at the conditioning rate', () => {
    // 35 × 6.5 + 10 × 8.0
    expect(workoutPlanWeeklyKcal(plan([session({ cardio: cardio('moderate') })]))).toBe(308);
    // An easy block swapped for an interval move.
    const swapped = plan([session({ cardio: cardio('easy') })], 'gym', { 'full-a:cardio:0': 'mountain-climbers' });
    expect(workoutPlanWeeklyKcal(swapped)).toBe(308);
  });

  it('counts an old finisher as conditioning', () => {
    // 4 rounds of 30 + 30 s = 4 min: 41 × 6.5 + 4 × 8.0
    const finisher = { exerciseIds: [], workSec: 30, restSec: 30, rounds: 4 };
    expect(workoutPlanWeeklyKcal(plan([session({ finisher })]))).toBe(299);
  });

  it('grows with more training days', () => {
    expect(workoutPlanWeeklyKcal(workout({ trainingDays: ['mon', 'tue', 'wed', 'thu', 'fri'] }))).toBeGreaterThan(
      workoutPlanWeeklyKcal(workout())
    );
  });
});

describe('proposeTargetUpdate', () => {
  const gym = workout();
  const weekly = workoutPlanWeeklyKcal(gym);

  it('offers the new target when the plan adds training the TDEE did not count', () => {
    const active = nutrition();
    const proposal = proposeTargetUpdate({ isGuest: false, activePlan: active, workoutPlan: gym, survey: survey() })!;
    expect(proposal).not.toBeNull();
    expect(proposal.dailyTrainingKcal).toBe(Math.round(weekly / 7));
    expect(proposal.currentKcal).toBe(Math.round(active.targetResult.kcalTarget));
    expect(proposal.proposedKcal).toBe(proposal.currentKcal + proposal.dailyTrainingKcal);
    expect(proposal.nextPlan.userContext.tdee).toBe(CONTEXT.tdee + proposal.dailyTrainingKcal);
  });

  it('replaces the survey estimate instead of adding to it', () => {
    // The survey said 3 × 45 min at the gym: 878 kcal a week, already in the TDEE.
    const proposal = proposeTargetUpdate({
      isGuest: false,
      activePlan: nutrition(),
      workoutPlan: workout({ trainingDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'], sessionMinutes: 75 }),
      survey: survey({ trainingType: 'gym_resistance', frequencyDaysPerWeek: 3, sessionDurationMins: 45 }),
    })!;
    const sixDays = workoutPlanWeeklyKcal(workout({ trainingDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'], sessionMinutes: 75 }));
    expect(proposal.dailyTrainingKcal).toBe(Math.round((sixDays - 878) / 7));
  });

  it('can lower the target when the plan is lighter than what was counted', () => {
    const proposal = proposeTargetUpdate({
      isGuest: false,
      activePlan: nutrition({ trainingWeeklyKcal: weekly + 700 }),
      workoutPlan: gym,
      survey: null,
    })!;
    expect(proposal.dailyTrainingKcal).toBe(-100);
    expect(proposal.proposedKcal).toBeLessThan(proposal.currentKcal);
  });

  it(`stays quiet below ${MIN_TDEE_SHIFT_KCAL} kcal a day`, () => {
    const counted = weekly - 7 * (MIN_TDEE_SHIFT_KCAL - 1);
    expect(
      proposeTargetUpdate({ isGuest: false, activePlan: nutrition({ trainingWeeklyKcal: counted }), workoutPlan: gym, survey: null })
    ).toBeNull();
    const enough = weekly - 7 * MIN_TDEE_SHIFT_KCAL;
    expect(
      proposeTargetUpdate({ isGuest: false, activePlan: nutrition({ trainingWeeklyKcal: enough }), workoutPlan: gym, survey: null })
    ).not.toBeNull();
  });

  it('never asks a guest or a user without targets', () => {
    expect(proposeTargetUpdate({ isGuest: true, activePlan: nutrition(), workoutPlan: gym, survey: survey() })).toBeNull();
    expect(proposeTargetUpdate({ isGuest: false, activePlan: null, workoutPlan: gym, survey: survey() })).toBeNull();
  });

  it('does not guess when neither the survey nor an earlier plan says what the TDEE counts', () => {
    expect(proposeTargetUpdate({ isGuest: false, activePlan: nutrition(), workoutPlan: gym, survey: null })).toBeNull();
  });

  it('records the accepted training, so saving the same plan again asks nothing', () => {
    const accepted = proposeTargetUpdate({ isGuest: false, activePlan: nutrition(), workoutPlan: gym, survey: survey() })!.nextPlan;
    expect(accepted.userContext.trainingWeeklyKcal).toBe(weekly);
    expect(proposeTargetUpdate({ isGuest: false, activePlan: accepted, workoutPlan: gym, survey: survey() })).toBeNull();
  });

  it('after "Not now", asks again only when the training changes', () => {
    const active = nutrition();
    const { weeklyTrainingKcal } = proposeTargetUpdate({ isGuest: false, activePlan: active, workoutPlan: gym, survey: survey() })!;
    expect(weeklyTrainingKcal).toBe(weekly);
    const declined = { ...gym, targetOfferDeclinedKcal: weeklyTrainingKcal };
    expect(proposeTargetUpdate({ isGuest: false, activePlan: active, workoutPlan: declined, survey: survey() })).toBeNull();
    const fiveDays = { ...workout({ trainingDays: ['mon', 'tue', 'wed', 'thu', 'fri'] }), targetOfferDeclinedKcal: weeklyTrainingKcal };
    expect(proposeTargetUpdate({ isGuest: false, activePlan: active, workoutPlan: fiveDays, survey: survey() })).not.toBeNull();
  });

  it('offers a plan made before the targets were accepted the first time it is saved', () => {
    // The same workout plan, saved again with nothing changed: never answered, so it is offered.
    const resaved = { ...gym, updatedAt: '2026-10-25T10:00:00.000Z' };
    expect(proposeTargetUpdate({ isGuest: false, activePlan: nutrition(), workoutPlan: resaved, survey: survey() })).not.toBeNull();
  });

  it('keeps the recalibration and region on the accepted plan', () => {
    const active = nutrition({}, { region: 'SA', recalibratedAt: '2026-10-18', formulaTdee: 2300 });
    const { nextPlan } = proposeTargetUpdate({ isGuest: false, activePlan: active, workoutPlan: gym, survey: survey() })!;
    expect(nextPlan.region).toBe('SA');
    expect(nextPlan.recalibratedAt).toBe('2026-10-18');
    expect(nextPlan.formulaTdee).toBe(2300);
    expect(nextPlan.goalSelection).toEqual(active.goalSelection);
  });

  it('holds the safety floor for a low-target user', () => {
    const small: Partial<PlanUserContext> = { sex: 'female', weightKg: 58, heightCm: 158, ageYears: 40, bmr: 1150, tdee: 1700 };
    const active = {
      ...computePlan({ ...CONTEXT, ...small, trainingWeeklyKcal: weekly + 2100 }, { goal: 'lose', targetRateKgPerWeek: 0.5 }),
      region: 'PK' as const,
    };
    const proposal = proposeTargetUpdate({ isGuest: false, activePlan: active, workoutPlan: gym, survey: null })!;
    expect(proposal.dailyTrainingKcal).toBe(-300);
    expect(proposal.proposedKcal).toBe(1200);
  });

  it('returns null when the floor keeps the target where it is', () => {
    const tiny: Partial<PlanUserContext> = { sex: 'female', weightKg: 50, heightCm: 152, ageYears: 45, bmr: 1100, tdee: 1350 };
    const active = computePlan({ ...CONTEXT, ...tiny, trainingWeeklyKcal: weekly + 700 }, { goal: 'lose', targetRateKgPerWeek: 1 });
    expect(Math.round(active.targetResult.kcalTarget)).toBe(1200);
    expect(proposeTargetUpdate({ isGuest: false, activePlan: active, workoutPlan: gym, survey: null })).toBeNull();
  });

  it('waits out Ramadan, when sessions are briefly shorter', () => {
    const fasting = generateWeeklyPlan(
      { ...SETTINGS, ramadan: { enabled: true, slot: 'after_taraweeh' } },
      { seed: 5, today: '2027-02-15' }
    );
    expect(fasting.fasting).toBe(true);
    expect(proposeTargetUpdate({ isGuest: false, activePlan: nutrition(), workoutPlan: fasting, survey: survey() })).toBeNull();
    // Switched on outside Ramadan, the plan is the usual one and the offer stands.
    const later = workout({ ramadan: { enabled: true, slot: 'after_taraweeh' } });
    expect(proposeTargetUpdate({ isGuest: false, activePlan: nutrition(), workoutPlan: later, survey: survey() })).not.toBeNull();
  });
});

describe('TargetUpdateSheet', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  const noop = () => {};
  const sheet = (proposal: Pick<TargetUpdateProposal, 'currentKcal' | 'proposedKcal' | 'dailyTrainingKcal'>) =>
    renderToStaticMarkup(
      React.createElement(TargetUpdateSheetBody, { proposal: { ...proposal, nextPlan: nutrition(), weeklyTrainingKcal: 0 }, onUpdate: noop, onNotNow: noop })
    );

  it('shows the old and new target with the reason, and both choices', () => {
    const html = sheet({ currentKcal: 1850, proposedKcal: 1960, dailyTrainingKcal: 110 });
    expect(html).toContain('Update your daily target?');
    expect(html).toContain('adds about 110 kcal a day of training');
    expect(html).toContain('1,850');
    expect(html).toContain('1,960');
    expect(html).toContain('From 1,850 to 1,960 kcal a day');
    expect(html).toContain('Not now');
    expect(html).toContain('Update target');
  });

  it('says when the target would go down', () => {
    const html = sheet({ currentKcal: 2100, proposedKcal: 2000, dailyTrainingKcal: -100 });
    expect(html).toContain('about 100 kcal a day less training');
    expect(html).toContain('would go down');
  });

  it('reads in Arabic', async () => {
    await i18n.changeLanguage('ar');
    const html = sheet({ currentKcal: 1850, proposedKcal: 1961, dailyTrainingKcal: 111 });
    expect(html).toContain('هل تريد تحديث هدفك اليومي؟');
    expect(html).toContain('نحو 111 سعرة');
    // 3–10 take the plural (CLDR "few"): سعرات.
    const few = sheet({ currentKcal: 1850, proposedKcal: 1956, dailyTrainingKcal: 106 });
    expect(few).toContain('نحو 106 سعرات');
    const down = sheet({ currentKcal: 2100, proposedKcal: 1997, dailyTrainingKcal: -103 });
    expect(down).toContain('بنحو 103 سعرات');
    expect(html).toContain('تحديث الهدف');
    expect(html).toContain('ليس الآن');
  });
});
