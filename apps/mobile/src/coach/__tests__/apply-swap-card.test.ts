import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import i18n from 'i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { exerciseForWeek, generateWeeklyPlan, getExercise, type WorkoutSettings } from '@nutrio/workout-core';
import type { CoachContext } from '@nutrio/nutrition-core';
import { initI18n } from '../../i18n/config.js';
import { clearAuthSession, saveAuthSession } from '../../auth/authStorage.js';
import { sendCoachMessage } from '../../ai/ai-service.js';
import { applyCoachSwap, coachSwapTopic } from '../../workout/coachWorkout.js';
import { swapExercise } from '../../workout/planActions.js';
import { flushWorkoutWrites, hydrateWorkoutPlan, loadWorkoutPlan, releaseWorkoutCache, saveWorkoutPlan } from '../../workout/workoutStorage.js';
import { ApplySwapCard } from '../ui/ApplySwapCard.js';
import { appendCoachMessage, type Message } from '../ui/CoachChatScreen.js';

initI18n('en');

const SETTINGS: WorkoutSettings = {
  goal: 'muscle',
  experience: 'some',
  location: 'gym',
  homeEquipment: [],
  dumbbellWeightsKg: [],
  trainingDays: ['mon', 'wed', 'thu'],
  sessionMinutes: 60,
  focus: [],
  protectedJoints: [],
  lowIntensity: false,
  ramadan: { enabled: false },
};
const plan = generateWeeklyPlan(SETTINGS, { seed: 5, today: '2026-10-19' });
const slotId = plan.sessions[0].slots[0].slotId;
const t = i18n.t.bind(i18n);
const NOW = new Date('2026-10-22T09:00:00.000Z');

beforeEach(async () => {
  releaseWorkoutCache();
  await AsyncStorage.clear();
  saveAuthSession({
    token: 'tok_coach',
    user: { id: 'coach_user', name: 'Coach', email: 'coach@nutrio.app', isRegistered: true, surveyCompleted: true },
    createdAt: new Date().toISOString(),
  });
  saveWorkoutPlan(plan);
});

afterEach(async () => {
  await i18n.changeLanguage('en');
  await clearAuthSession();
  vi.restoreAllMocks();
});

describe('applyCoachSwap', () => {
  it('saves the swap with a new save time, so it survives a restart and wins a sync', async () => {
    const topic = coachSwapTopic(plan, slotId, 0, 'en')!;
    const toId = topic.candidates[0].id;
    const result = applyCoachSwap(topic, toId, 'en', t, NOW);

    expect(result.applied).toBe(true);
    if (!result.applied) return;
    expect(result.plan.updatedAt).toBe(NOW.toISOString());
    expect(result.dayTitle).not.toBe('');
    // The chat moves on to the exercise now in the slot.
    expect(result.topic?.exerciseId).toBe(toId);
    expect(result.topic?.candidates.some((c) => c.id === toId)).toBe(false);

    await flushWorkoutWrites();
    releaseWorkoutCache();
    await hydrateWorkoutPlan();
    expect(exerciseForWeek(loadWorkoutPlan()!, slotId, 0)).toBe(toId);
  });

  it('refuses an id that is not a safe swap for the slot, and leaves the plan alone', () => {
    const topic = coachSwapTopic(plan, slotId, 0, 'en')!;
    const result = applyCoachSwap(topic, 'treadmill-jog', 'en', t, NOW);
    expect(result.applied).toBe(false);
    expect(loadWorkoutPlan()!.swaps[slotId]).toBeUndefined();
  });

  it('refuses a stale proposal once the slot has changed since the chat opened', () => {
    const topic = coachSwapTopic(plan, slotId, 0, 'en')!;
    // The user swapped it on the day screen in the meantime.
    swapExercise(loadWorkoutPlan()!, slotId, topic.candidates[1].id, 0, NOW);
    expect(applyCoachSwap(topic, topic.candidates[0].id, 'en', t, NOW).applied).toBe(false);
    expect(loadWorkoutPlan()!.swaps[slotId]).toBe(topic.candidates[1].id);
  });

  it('refuses when there is no workout plan stored', () => {
    releaseWorkoutCache();
    const topic = coachSwapTopic(plan, slotId, 0, 'en')!;
    expect(applyCoachSwap(topic, topic.candidates[0].id, 'en', t, NOW).applied).toBe(false);
  });
});

describe('ApplySwapCard', () => {
  const topic = coachSwapTopic(plan, slotId, 0, 'en')!;
  const toId = topic.candidates[0].id;
  const card = (props: Partial<React.ComponentProps<typeof ApplySwapCard>>) =>
    renderToStaticMarkup(React.createElement(ApplySwapCard, { fromId: topic.exerciseId, toId, state: 'proposed', ...props }));
  const toName = getExercise(toId)!.name;

  it('asks before swapping and says the plan keeps the sets and weights', () => {
    const html = card({ onApply: () => {}, onKeep: () => {} });
    expect(html).toContain(`Swap to ${toName.en}?`);
    expect(html).toContain(getExercise(topic.exerciseId)!.name.en);
    expect(html).toContain('Sets and weights still come from your plan.');
    expect(html).toContain('Apply swap');
    expect(html).toContain('Keep current');
  });

  it('has no buttons on an older card', () => {
    expect(card({})).not.toContain('Apply swap');
  });

  it('confirms an applied swap and explains a refused one', () => {
    expect(card({ state: 'applied', dayTitle: 'Upper body A' })).toContain(`Swapped. ${toName.en} is now in Upper body A.`);
    expect(card({ state: 'refused' })).toContain('no longer available because your plan changed');
  });

  it('reads in Arabic', async () => {
    await i18n.changeLanguage('ar');
    const html = card({ onApply: () => {}, onKeep: () => {} });
    // Exercise names follow I18nProvider's language, which these renders don't mount; the web run covers them.
    expect(html).toContain('الاستبدال بـ ');
    expect(html).toContain('تطبيق الاستبدال');
    expect(html).toContain('المجموعات والأوزان تبقى من خطتك.');
  });
});

describe('sendCoachMessage with an exercise topic', () => {
  const context: CoachContext = {
    sex: 'male',
    ageYears: 30,
    weightKg: 80,
    goal: 'maintain',
    targets: { kcalTarget: 2200, proteinGrams: 140, fatGrams: 70, carbGrams: 250 },
  };
  const topic = coachSwapTopic(plan, slotId, 0, 'en')!;
  const swapRequest = { exerciseId: topic.exerciseId, exerciseName: topic.exerciseName, candidates: topic.candidates };
  const messages = [{ role: 'user' as const, content: 'Yes, swap it.' }];
  const answer = (proposedSwap?: unknown) =>
    vi.fn(async () => ({ reply: 'Done.', suggestedPrompts: [], provider: 'groq_gpt_oss_120b', flagsTriggered: [], proposedSwap }));

  it('sends the topic and returns a proposal from its candidates', async () => {
    const invoke = answer({ toId: topic.candidates[0].id, reason: 'Easier on the knee.' });
    const result = await sendCoachMessage(messages, context, invoke, swapRequest);
    expect((invoke.mock.calls[0] as unknown as [string, any])[1].swapRequest).toEqual(swapRequest);
    expect(result.proposedSwap).toEqual({ toId: topic.candidates[0].id, reason: 'Easier on the knee.' });
  });

  it('drops a proposal that is not one of the candidates it sent', async () => {
    const result = await sendCoachMessage(messages, context, answer({ toId: 'treadmill-jog', reason: 'x' }), swapRequest);
    expect(result.proposedSwap).toBeUndefined();
  });

  it('sends no topic in a general chat, and ignores any proposal', async () => {
    const invoke = answer({ toId: topic.candidates[0].id, reason: 'x' });
    const result = await sendCoachMessage(messages, context, invoke);
    expect('swapRequest' in (invoke.mock.calls[0] as unknown as [string, any])[1]).toBe(false);
    expect(result.proposedSwap).toBeUndefined();
  });

  it('offline, points to the Swap menu and proposes nothing', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const failing = vi.fn(async () => {
      throw new Error('offline');
    });
    const result = await sendCoachMessage(messages, context, failing, swapRequest);
    expect(result.providerUsed).toBe('deterministic_fallback');
    expect(result.reply).toContain('Swap exercise');
    expect(result.proposedSwap).toBeUndefined();
  });
});

describe('appendCoachMessage', () => {
  const topic = coachSwapTopic(plan, slotId, 0, 'en')!;
  const msg = (id: string, swap?: Message['swap']): Message => ({ id, role: 'assistant', text: id, sentAt: 0, ...(swap ? { swap } : {}) });
  const proposed = (toId: string) => ({ topic, toId, state: 'proposed' as const });

  it('hides an unanswered card when a new proposal arrives, and keeps answered ones', () => {
    const applied = msg('a', { ...proposed(topic.candidates[0].id), state: 'applied' });
    const early = msg('b', proposed(topic.candidates[1].id));
    const next = appendCoachMessage([applied, early], msg('c', proposed(topic.candidates[1].id)));
    expect(next.map((m) => m.swap?.state)).toEqual(['applied', 'kept', 'proposed']);
  });

  it('leaves cards alone for an answer without a proposal', () => {
    const early = msg('b', proposed(topic.candidates[1].id));
    expect(appendCoachMessage([early], msg('c'))[0].swap?.state).toBe('proposed');
  });
});
