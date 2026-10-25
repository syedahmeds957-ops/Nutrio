import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  getExercise,
  isUserSwap,
  swapCandidates,
  type PlannedSlot,
  type WeeklyWorkoutPlan,
  type WorkoutLog,
  type WorkoutSession,
} from '@nutrio/workout-core';
import { useTheme } from '../../theme.js';
import { useI18nState, useTranslation, useTextDirection } from '../../i18n/index.js';
import { Icon } from '../../ui/Icon.js';
import { sessionTitle } from '../sessionTitle.js';
import { clockText, dateText, effortText, loggedSetText, prescriptionText } from '../format.js';
import { cardioForWeek, exerciseCount, isCardioSlot, weekdayOf, type DayView } from '../weekView.js';
import {
  createDraft,
  draftStats,
  draftToLog,
  getActiveDraft,
  setActiveDraft,
  setLoad,
  setReps,
  targetsForSession,
  toggleSet,
  type WorkoutDraft,
} from '../workoutDraft.js';
import { CardioCard } from './CardioCard.js';
import { DiscardDialog } from './DiscardDialog.js';
import { ExerciseDetailSheet } from './ExerciseDetailSheet.js';
import { ExerciseOptionsSheet } from './ExerciseOptionsSheet.js';
import { ExerciseImageLoop } from './ExerciseImageLoop.js';
import { FinishSheet } from './FinishSheet.js';
import { RestTimer } from './RestTimer.js';
import { SetLogger } from './SetLogger.js';
import { SwapSheet } from './SwapSheet.js';
import { TargetPanel } from './TargetPanel.js';
import { WorkoutHeader } from './WorkoutHeader.js';

interface WorkoutDayScreenProps {
  plan: WeeklyWorkoutPlan;
  day: DayView & { session: WorkoutSession };
  weekIndex: number;
  todayKey: string;
  logs: readonly WorkoutLog[];
  /** Opens straight into logging ("Do it today" on a missed day). */
  autoStart?: boolean;
  onBack: () => void;
  onSaved: (log: WorkoutLog, slots: PlannedSlot[]) => void;
  /** Puts a chosen alternative in the slot (from the swap sheet's own list). */
  onSwap: (slotId: string, exerciseId: string) => void;
  onResetSwap: (slotId: string) => void;
  /** Opens the coach about the exercise in a slot; offered wherever Swap is. */
  onAskCoach?: (slotId: string) => void;
  /** Set for guests: the day is read-only, and starting it asks them to create an account. */
  onRequireAccount?: () => void;
}

const REST_EXTRA_SEC = 30;

/** The workout in progress for this session today, if there is one. */
function draftFor(session: WorkoutSession, todayKey: string): WorkoutDraft | null {
  const draft = getActiveDraft();
  return draft && draft.day === session.day && draft.template === session.template && draft.dateKey === todayKey ? draft : null;
}

/**
 * One session. Before starting: every exercise with its demo, prescription and
 * today's target with its reason. While logging: set rows, a rest timer and
 * Finish. Once done: what was logged.
 */
export const WorkoutDayScreen: React.FC<WorkoutDayScreenProps> = ({
  plan,
  day,
  weekIndex,
  todayKey,
  logs,
  autoStart,
  onBack,
  onSaved,
  onSwap,
  onResetSwap,
  onAskCoach,
  onRequireAccount,
}) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const { language } = useI18nState();
  const dir = useTextDirection();
  const session = day.session;
  const targets = useMemo(() => targetsForSession(plan, session, weekIndex, logs), [plan, session, weekIndex, logs]);
  const cardio = cardioForWeek(plan, session, weekIndex);
  const startDraft = () => createDraft(session, targets, todayKey, new Date(), cardio);
  const sample = Boolean(onRequireAccount);
  const [draft, setDraftState] = useState<WorkoutDraft | null>(() =>
    sample ? null : (draftFor(session, todayKey) ?? (autoStart && !day.log ? startDraft() : null))
  );
  const [detailId, setDetailId] = useState<string | null>(null);
  /** The slot the detail sheet came from, so it can offer a swap. */
  const [detailSlotId, setDetailSlotId] = useState<string | null>(null);
  const [optionsSlotId, setOptionsSlotId] = useState<string | null>(null);
  const [swapSlotId, setSwapSlotId] = useState<string | null>(null);
  const [scrolling, setScrolling] = useState(false);
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const logging = draft !== null;
  /** The exercise a slot holds today, strength or cardio. */
  const exerciseInSlot = (slotId: string | null) =>
    !slotId ? null : (targets.find(({ slot }) => slot.slotId === slotId)?.target.exerciseId ?? (cardio?.slotId === slotId ? cardio.exerciseId : null));
  const optionsExerciseId = exerciseInSlot(optionsSlotId);
  const swapExerciseId = exerciseInSlot(swapSlotId);
  const doneLog = day.log;

  // The draft lives outside this screen too, so an edge swipe away doesn't lose it.
  useEffect(() => {
    setActiveDraft(draft);
  }, [draft]);

  useEffect(() => {
    if (!logging) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [logging]);

  const updateDraft = (change: (current: WorkoutDraft) => WorkoutDraft) => setDraftState((current) => (current ? change(current) : current));
  const elapsedSec = draft ? (now - Date.parse(draft.startedAt)) / 1000 : 0;
  const stats = draft ? draftStats(draft) : { setsDone: 0, kgLifted: 0, cardioMinutes: 0 };
  const cardioIndex = draft ? draft.exercises.findIndex((exercise) => isCardioSlot(exercise.slotId)) : -1;
  const title = sessionTitle(t, session);

  const todayWeekday = weekdayOf(todayKey);
  const performedLabel = session.day === todayWeekday ? t('workout.log.today') : t('workout.log.movedFrom', { day: t(`workout.days.${session.day}`) });
  const subtitle = logging
    ? `${performedLabel} · ${clockText(elapsedSec)}`
    : [
        dateText(t, day.weekday, day.dayOfMonth, day.month),
        t('workout.week.exercises', { count: exerciseCount(session) }),
        t('workout.week.minutes', { count: session.estimatedMinutes }),
      ].join(' · ');

  const toggle = (exerciseIndex: number, setIndex: number) => {
    if (!draft) return;
    const wasDone = draft.exercises[exerciseIndex].sets[setIndex].done;
    const next = toggleSet(draft, exerciseIndex, setIndex);
    setDraftState(next);
    const anyLeft = next.exercises.some((exercise) => exercise.sets.some((set) => !set.done));
    const restSec = next.exercises[exerciseIndex].restSec;
    if (!wasDone && anyLeft && restSec > 0) setRestEndsAt(Date.now() + restSec * 1000);
    if (wasDone) setRestEndsAt(null);
  };

  const discard = () => {
    setConfirmingDiscard(false);
    setActiveDraft(null);
    setDraftState(null);
    setRestEndsAt(null);
    onBack();
  };

  const save = (rating: Parameters<typeof draftToLog>[1]) => {
    if (!draft) return;
    const log = draftToLog(draft, rating, new Date());
    setFinishing(false);
    setActiveDraft(null);
    setDraftState(null);
    onSaved(log, targets.map(({ slot }) => slot));
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.canvas }]}>
      <WorkoutHeader
        title={title}
        subtitle={subtitle}
        onBack={logging ? () => setConfirmingDiscard(true) : onBack}
        action={logging ? { label: t('workout.log.finish'), onPress: () => setFinishing(true), primary: true, disabled: stats.setsDone === 0 && stats.cardioMinutes === 0 } : undefined}
      />

      <ScrollView
        contentContainerStyle={[styles.content, logging && styles.contentLogging]}
        keyboardShouldPersistTaps="handled"
        // Demos hold still while the list moves, so scrolling stays smooth.
        onScrollBeginDrag={() => setScrolling(true)}
        onMomentumScrollEnd={() => setScrolling(false)}
        onScrollEndDrag={() => setScrolling(false)}
      >
        {plan.fasting && plan.settings.ramadan.slot ? (
          <View style={[styles.guide, { backgroundColor: c.primaryLight }]}>
            <Icon name="moon" size={18} color={c.primaryTintText} />
            <Text style={[styles.guideText, dir.text, { color: c.primaryTintText }]}>{t(`workout.ramadan.guide.${plan.settings.ramadan.slot}`)}</Text>
          </View>
        ) : null}

        {targets.map(({ slot, target }, index) => {
          const exercise = getExercise(target.exerciseId);
          const name = exercise?.name[language] ?? target.exerciseId;
          const logged = doneLog?.exercises.find((entry) => entry.slotId === slot.slotId);
          const openDetail = () => {
            setDetailId(target.exerciseId);
            setDetailSlotId(slot.slotId);
          };
          // Swaps are planned ahead: not mid-workout, not on a day already done, and not on a guest's sample.
          const canSwap = !logging && !doneLog && !sample;
          const swapped = canSwap && isUserSwap(plan, slot.slotId);
          const demo = <ExerciseImageLoop exerciseId={target.exerciseId} size={68} square paused={scrolling} />;
          const summary = (
            <>
              {/* While logging the card holds inputs, so only the demo opens the details. */}
              {logging ? (
                <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('workout.day.details', { name })} onPress={openDetail}>
                  {demo}
                </TouchableOpacity>
              ) : (
                demo
              )}
              <View style={styles.flex}>
                <Text style={[styles.name, dir.text, { color: c.textPrimary }]}>{name}</Text>
                {swapped ? (
                  <View style={[styles.swappedTag, { backgroundColor: c.primaryLight }]}>
                    <Text style={[styles.swappedText, { color: c.primaryTintText }]}>{t('workout.swap.tag')}</Text>
                  </View>
                ) : null}
                <Text style={[styles.presc, dir.text, { color: c.textSecondary }]}>{prescriptionText(t, { ...slot, sets: target.sets })}</Text>
                <Text style={[styles.effort, dir.text, { color: c.textSecondary }]}>{effortText(t, slot)}</Text>
              </View>
            </>
          );

          return (
            <View key={slot.slotId} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
              {logging ? (
                <View style={styles.cardTop}>{summary}</View>
              ) : (
                <View style={styles.cardTop}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={t('workout.day.details', { name })}
                    onPress={openDetail}
                    activeOpacity={0.8}
                    style={styles.cardMain}
                  >
                    {summary}
                  </TouchableOpacity>
                  {canSwap ? (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={t('workout.options.label', { name })}
                      onPress={() => setOptionsSlotId(slot.slotId)}
                      style={[styles.more, { backgroundColor: c.surfaceSecondary }]}
                    >
                      <Icon name="more" size={20} color={c.textPrimary} />
                    </TouchableOpacity>
                  ) : (
                    <Icon name="chevron-right" size={16} color={c.textSecondary} style={dir.isRTL ? styles.flipped : undefined} />
                  )}
                </View>
              )}

              {doneLog ? (
                <Text style={[styles.logged, dir.text, { color: c.textPrimary }]}>
                  {logged && logged.sets.some((set) => set.done)
                    ? logged.sets
                        .filter((set) => set.done)
                        .map((set) => loggedSetText(t, set, slot.unit))
                        .join(' · ')
                    : t('workout.logged.skipped')}
                </Text>
              ) : (
                <TargetPanel target={target} unit={slot.unit} tracksLoad={Boolean(exercise?.tracksLoad)} />
              )}

              {swapped ? (
                <TouchableOpacity accessibilityRole="button" onPress={() => onResetSwap(slot.slotId)} style={styles.resetLink}>
                  <Text style={[styles.resetText, dir.text, { color: c.primaryAccessible }]}>{t('workout.swap.reset')}</Text>
                </TouchableOpacity>
              ) : null}

              {draft?.exercises[index] && exercise ? (
                <SetLogger
                  exercise={exercise}
                  unit={slot.unit}
                  settings={plan.settings}
                  sets={draft.exercises[index].sets}
                  onReps={(setIndex, reps) => updateDraft((d) => setReps(d, index, setIndex, reps))}
                  onLoad={(setIndex, kg) => updateDraft((d) => setLoad(d, index, setIndex, kg))}
                  onToggle={(setIndex) => toggle(index, setIndex)}
                />
              ) : null}
            </View>
          );
        })}

        {cardio ? (
          <CardioCard
            cardio={cardio}
            paused={scrolling}
            onDetails={() => {
              setDetailId(cardio.exerciseId);
              setDetailSlotId(cardio.slotId);
            }}
            onOptions={!logging && !doneLog && !sample ? () => setOptionsSlotId(cardio.slotId) : undefined}
            swapped={!logging && !doneLog && !sample && isUserSwap(plan, cardio.slotId)}
            onReset={() => onResetSwap(cardio.slotId)}
            logging={
              draft && cardioIndex >= 0
                ? {
                    minutes: draft.exercises[cardioIndex].sets[0].reps,
                    done: draft.exercises[cardioIndex].sets[0].done,
                    onMinutes: (minutes) => updateDraft((d) => setReps(d, cardioIndex, 0, minutes)),
                    onToggle: () => toggle(cardioIndex, 0),
                  }
                : undefined
            }
            loggedMinutes={
              doneLog
                ? (doneLog.exercises.find((entry) => entry.slotId === cardio.slotId)?.sets.find((set) => set.done)?.reps ?? null)
                : undefined
            }
          />
        ) : null}

      </ScrollView>

      {!logging ? (
        <View style={[styles.bottomBar, { backgroundColor: c.canvas, borderTopColor: c.border }]}>
          {onRequireAccount ? (
            <View style={styles.sampleBar}>
              <View style={styles.sampleNote}>
                <Icon name="eye" size={16} color={c.textSecondary} />
                <Text style={[styles.sampleNoteText, dir.text, { color: c.textSecondary }]}>{t('workout.guest.dayNote')}</Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={onRequireAccount}
                activeOpacity={0.8}
                style={[styles.startButton, { backgroundColor: c.primaryLime }]}
              >
                <Text style={[styles.startText, { color: c.limeText }]}>{t('workout.guest.start')}</Text>
              </TouchableOpacity>
            </View>
          ) : doneLog ? (
            <View style={[styles.doneBar, { backgroundColor: c.successLight }]}>
              <Icon name="check" size={16} color={theme.isDark ? c.success : '#166534'} strokeWidth={3} />
              <Text style={[styles.doneText, { color: theme.isDark ? c.success : '#166534' }]}>
                {t('workout.day.doneOn', { date: dateText(t, weekdayOf(doneLog.dateKey), Number(doneLog.dateKey.slice(8)), Number(doneLog.dateKey.slice(5, 7)) - 1) })}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setDraftState(startDraft())}
              activeOpacity={0.8}
              style={[styles.startButton, { backgroundColor: c.primaryLime }]}
            >
              <Text style={[styles.startText, { color: c.limeText }]}>{t('workout.day.startWorkout')}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      {restEndsAt !== null ? (
        <RestTimer
          key={restEndsAt}
          endsAt={restEndsAt}
          onAddTime={() => setRestEndsAt((end) => (end ?? Date.now()) + REST_EXTRA_SEC * 1000)}
          onSkip={() => setRestEndsAt(null)}
          onDone={() => setRestEndsAt(null)}
        />
      ) : null}

      <ExerciseDetailSheet
        exerciseId={detailId}
        onClose={() => setDetailId(null)}
        onSwap={
          detailSlotId && !logging && !doneLog && !sample
            ? () => {
                setDetailId(null);
                setSwapSlotId(detailSlotId);
              }
            : undefined
        }
        onAskCoach={
          detailSlotId && onAskCoach && !logging && !doneLog && !sample
            ? () => {
                setDetailId(null);
                onAskCoach(detailSlotId);
              }
            : undefined
        }
      />
      <ExerciseOptionsSheet
        name={optionsExerciseId ? (getExercise(optionsExerciseId)?.name[language] ?? null) : null}
        swapped={optionsSlotId ? isUserSwap(plan, optionsSlotId) : false}
        onClose={() => setOptionsSlotId(null)}
        onSwap={() => {
          setOptionsSlotId(null);
          setSwapSlotId(optionsSlotId);
        }}
        onAskCoach={
          onAskCoach
            ? () => {
                setOptionsSlotId(null);
                if (optionsSlotId) onAskCoach(optionsSlotId);
              }
            : undefined
        }
        onDetails={() => {
          setOptionsSlotId(null);
          setDetailId(optionsExerciseId);
          setDetailSlotId(optionsSlotId);
        }}
        onReset={() => {
          if (optionsSlotId) onResetSwap(optionsSlotId);
          setOptionsSlotId(null);
        }}
      />
      <SwapSheet
        exercise={swapExerciseId ? (getExercise(swapExerciseId) ?? null) : null}
        subtitle={swapSlotId && isCardioSlot(swapSlotId) ? t('workout.cardio.swapSubtitle') : undefined}
        candidates={swapSlotId ? swapCandidates(plan, swapSlotId, { weekIndex }) : []}
        onClose={() => setSwapSlotId(null)}
        onChoose={(exerciseId) => {
          if (swapSlotId) onSwap(swapSlotId, exerciseId);
          setSwapSlotId(null);
        }}
      />
      <DiscardDialog visible={confirmingDiscard} onKeepGoing={() => setConfirmingDiscard(false)} onDiscard={discard} />
      {finishing ? (
        <FinishSheet visible sessionTitle={title} elapsedSec={elapsedSec} stats={stats} onClose={() => setFinishing(false)} onSave={save} />
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1, minWidth: 0 },
  content: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 24, gap: 10 },
  contentLogging: { paddingBottom: 110 },
  card: { padding: 12, borderRadius: 22, borderWidth: 1, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  guide: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16 },
  guideText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  cardMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  more: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  swappedTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, marginTop: 3 },
  swappedText: { fontSize: 11, fontWeight: '800' },
  resetLink: { alignSelf: 'flex-start', minHeight: 36, justifyContent: 'center' },
  resetText: { fontSize: 13, fontWeight: '700' },
  name: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  presc: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  effort: { fontSize: 12, marginTop: 2 },
  logged: { fontSize: 13, fontWeight: '700' },
  flipped: { transform: [{ scaleX: -1 }] },
  bottomBar: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, borderTopWidth: 1 },
  startButton: { minHeight: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  startText: { fontSize: 16, fontWeight: '800' },
  doneBar: { minHeight: 52, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  doneText: { fontSize: 15, fontWeight: '800' },
  sampleBar: { gap: 10 },
  sampleNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  sampleNoteText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '600' },
});
