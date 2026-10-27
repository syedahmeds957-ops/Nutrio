import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { currentOrNextRamadan, getExercise, type WeeklyWorkoutPlan, type WorkoutSettings } from '@nutrio/workout-core';
import { addDaysToKey } from '../../common/dateKey.js';
import { useTheme } from '../../theme.js';
import { useI18nState, useTranslation, useTextDirection } from '../../i18n/index.js';
import { Icon } from '../../ui/Icon.js';
import { sessionTitle } from '../sessionTitle.js';
import { cardioCueText, cardioText, restText, setsRepsText } from '../format.js';
import { cardioForWeek, exerciseCount, nextTrainingDay, slotsForWeek, type DayStatus, type WeekView } from '../weekView.js';
import { ExerciseImageLoop } from './ExerciseImageLoop.js';
import { WorkoutHeader } from './WorkoutHeader.js';
import { RamadanCard } from './RamadanCard.js';

/** How long before Ramadan the week starts offering the Ramadan switch. */
const RAMADAN_NOTICE_DAYS = 30;

interface WorkoutWeekScreenProps {
  plan: WeeklyWorkoutPlan;
  week: WeekView;
  onBack: () => void;
  onEdit: () => void;
  onOpenDay: (dateKey: string) => void;
  /** Starts a missed session today. */
  onDoToday: (dateKey: string) => void;
  /** Shows the "Workout saved" toast after finishing. */
  saved?: boolean;
  /** Set right after a plan is created or edited: pins a Done button that leaves for the home screen. */
  onDone?: () => void;
  /** Ramadan mode switched from the week; regenerates the plan. */
  onRamadanChange?: (ramadan: WorkoutSettings['ramadan']) => void;
  /** Set for guests: the week is a sample, and starting or editing asks them to create an account. */
  onRequireAccount?: () => void;
}

/**
 * The Workouts home: today's workout with every exercise listed, then the
 * week. Training only; meals stay on the dashboard.
 */
export const WorkoutWeekScreen: React.FC<WorkoutWeekScreenProps> = ({
  plan,
  week,
  onBack,
  onEdit,
  onOpenDay,
  onDoToday,
  saved,
  onDone,
  onRamadanChange,
  onRequireAccount,
}) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const { language } = useI18nState();
  const dir = useTextDirection();
  const today = week.today;
  const todaySlots = today.session ? slotsForWeek(plan, today.session, week.weekIndex) : [];
  const todayCardio = today.session ? cardioForWeek(plan, today.session, week.weekIndex) : null;
  const walk = plan.restDayWalk;
  const ramadan = plan.settings.ramadan;
  // Badges and timings only while the fasting plan is actually in use.
  const slotLabel = plan.fasting && ramadan.slot ? t(`workout.ramadan.slot.${ramadan.slot}`) : null;
  // The switch shows on the week during Ramadan and in the month before it; the rest of the year it lives in Edit plan.
  const nextRamadan = currentOrNextRamadan(today.dateKey);
  const ramadanNear = Boolean(nextRamadan && addDaysToKey(today.dateKey, RAMADAN_NOTICE_DAYS) >= nextRamadan.start);
  const next = today.session ? null : nextTrainingDay(plan, today.dateKey);
  const todayDone = today.status === 'done';
  const sample = Boolean(onRequireAccount);
  const doneFg = theme.isDark ? c.success : '#166534';

  const meta = (exercises: number, minutes: number) =>
    `${t('workout.week.exercises', { count: exercises })} · ${t('workout.week.minutes', { count: minutes })}`;

  const chipColors: Record<DayStatus, { bg: string; fg: string }> = {
    today: { bg: c.primaryLime, fg: c.limeText },
    planned: { bg: c.surfaceSecondary, fg: c.textSecondary },
    done: { bg: c.successLight, fg: theme.isDark ? c.success : '#166534' },
    missed: { bg: c.warningLight, fg: theme.isDark ? c.warning : '#92400E' },
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.canvas }]}>
      <WorkoutHeader title={t('workout.title')} onBack={onBack} action={sample ? undefined : { label: t('workout.editPlan'), onPress: onEdit }} />

      <ScrollView contentContainerStyle={styles.content}>
        {onRequireAccount ? (
          <View style={[styles.restCard, styles.sampleCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={styles.sampleTop}>
              <View style={[styles.sampleIcon, { backgroundColor: c.primaryLight }]}>
                <Icon name="eye" size={18} color={c.primaryAccessible} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.sampleTitle, dir.text, { color: c.textPrimary }]}>{t('workout.guest.bannerTitle')}</Text>
                <Text style={[styles.sampleBody, dir.text, { color: c.textSecondary }]}>{t('workout.guest.bannerBody')}</Text>
              </View>
            </View>
            <View style={styles.sampleActions}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={onRequireAccount}
                activeOpacity={0.8}
                style={[styles.sampleButton, { backgroundColor: c.primaryLime }]}
              >
                <Text numberOfLines={1} style={[styles.secondaryButtonText, { color: c.limeText }]}>{t('workout.guest.cta')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={onRequireAccount}
                activeOpacity={0.8}
                style={[styles.sampleButton, { backgroundColor: c.surfaceSecondary, borderColor: c.border, borderWidth: 1 }]}
              >
                <Text numberOfLines={1} style={[styles.secondaryButtonText, { color: c.textPrimary }]}>{t('workout.guest.haveAccount')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {today.session ? (
          <View style={[styles.todayCard, { backgroundColor: c.surface, borderColor: c.primaryLime }]}>
            <View style={styles.todayTop}>
              <Text style={[styles.overline, dir.text, styles.flex, { color: c.textSecondary }]}>{t('workout.today.overline')}</Text>
              {todayDone ? (
                <View style={[styles.statusChip, { backgroundColor: c.successLight }]}>
                  <Icon name="check" size={12} color={doneFg} strokeWidth={3} />
                  <Text style={[styles.statusText, { color: doneFg }]}>{t('workout.status.done')}</Text>
                </View>
              ) : null}
            </View>
            <Text accessibilityRole="header" style={[styles.todayTitle, dir.text, { color: c.textPrimary }]}>
              {sessionTitle(t, today.session)}
            </Text>
            <Text style={[styles.meta, dir.text, { color: c.textSecondary }]}>
              {meta(exerciseCount(today.session), today.session.estimatedMinutes)}
            </Text>
            <View style={styles.todayList}>
              {todaySlots.map((slot, index) => (
                <View key={slot.slotId} style={[styles.todayRow, { borderTopColor: c.border }]}>
                  <Text style={[styles.todayNumber, { color: c.textSecondary }]}>{index + 1}</Text>
                  <ExerciseImageLoop exerciseId={slot.exerciseId} size={72} square />
                  <View style={styles.flex}>
                    <Text style={[styles.exerciseName, dir.text, { color: c.textPrimary }]}>
                      {getExercise(slot.exerciseId)?.name[language]}
                    </Text>
                    <Text style={[styles.setsReps, dir.text, { color: c.textPrimary }]}>{setsRepsText(t, slot)}</Text>
                    <Text style={[styles.rest, dir.text, { color: c.textSecondary }]}>{restText(t, slot)}</Text>
                  </View>
                </View>
              ))}
              {todayCardio ? (
                <View style={[styles.todayRow, { borderTopColor: c.border }]}>
                  <Text style={[styles.todayNumber, { color: c.textSecondary }]}>{todaySlots.length + 1}</Text>
                  <ExerciseImageLoop exerciseId={todayCardio.exerciseId} size={72} square />
                  <View style={styles.flex}>
                    <Text style={[styles.exerciseName, dir.text, { color: c.textPrimary }]}>
                      {getExercise(todayCardio.exerciseId)?.name[language]}
                    </Text>
                    <Text style={[styles.setsReps, dir.text, { color: c.textPrimary }]}>
                      {cardioText(t, todayCardio, getExercise(todayCardio.exerciseId)?.pattern === 'conditioning')}
                    </Text>
                    <Text style={[styles.rest, dir.text, { color: c.textSecondary }]}>
                      {cardioCueText(t, todayCardio, getExercise(todayCardio.exerciseId)?.pattern === 'conditioning')}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
            {todayDone ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => onOpenDay(today.dateKey)}
                activeOpacity={0.8}
                style={[styles.secondaryButton, { backgroundColor: c.surfaceSecondary, borderColor: c.border }]}
              >
                <Text style={[styles.secondaryButtonText, { color: c.textPrimary }]}>{t('workout.today.seeLogged')}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={onRequireAccount ?? (() => onOpenDay(today.dateKey))}
                activeOpacity={0.8}
                style={[styles.primaryButton, { backgroundColor: c.primaryLime }]}
              >
                <Text style={[styles.primaryButtonText, { color: c.limeText }]}>{t('workout.today.startWorkout')}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={[styles.restCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.todayTitle, dir.text, { color: c.textPrimary }]}>{t('workout.today.restTitle')}</Text>
            {next ? (
              <Text style={[styles.meta, dir.text, { color: c.textSecondary }]}>
                {t('workout.today.restNext', { title: sessionTitle(t, next.session), day: t(`workout.days.${next.session.day}`) })}
              </Text>
            ) : null}
            {walk ? (
              <Text style={[styles.meta, dir.text, { color: c.textSecondary }]}>
                {t('workout.cardio.walk', { min: walk.minMinutes, max: walk.maxMinutes })}
              </Text>
            ) : null}
          </View>
        )}

        <Text accessibilityRole="header" style={[styles.heading, dir.text, { color: c.textPrimary }]}>
          {t('workout.week.heading')}
        </Text>

        <View style={[styles.summary, { backgroundColor: c.primaryLime }]}>
          <View style={styles.summaryTop}>
            <Text style={[styles.overline, { color: c.limeText }]}>
              {sample ? t('workout.guest.sampleWeek') : t('workout.week.label', { number: week.weekIndex + 1 })}
            </Text>
            <Text style={[styles.splitName, { color: c.limeText }]}>{t(`workout.split.${plan.split}`)}</Text>
          </View>
          <Text style={[styles.summaryDone, dir.text, { color: c.limeText }]}>
            {sample ? t('workout.guest.perWeek', { count: plan.sessions.length }) : t('workout.week.done', { done: week.doneDays, count: week.trainingDays })}
          </Text>
          <View style={styles.segments}>
            {Array.from({ length: week.trainingDays }, (_, i) => (
              <View key={i} style={[styles.segment, { backgroundColor: i < week.doneDays ? c.limeText : 'rgba(10, 11, 13, 0.18)' }]} />
            ))}
          </View>
          {slotLabel ? (
            <View style={[styles.ramadanBadge, { backgroundColor: c.limeText }]}>
              <Icon name="moon" size={14} color={c.primaryLime} />
              <Text style={[styles.ramadanBadgeText, { color: c.primaryLime }]}>{t('workout.ramadan.badge', { slot: slotLabel })}</Text>
            </View>
          ) : null}
        </View>

        {onRamadanChange && ramadanNear ? <RamadanCard ramadan={ramadan} todayKey={today.dateKey} onChange={onRamadanChange} /> : null}

        {week.days.map((day) => {
          const dayName = t(`workout.days.${day.weekday}`);
          const dateColumn = (muted: boolean) => (
            <View style={styles.dateColumn}>
              <Text style={[styles.dayName, { color: c.textSecondary }]}>{dayName}</Text>
              <Text style={[muted ? styles.dateMuted : styles.date, { color: muted ? c.textSecondary : c.textPrimary }]}>
                {day.dayOfMonth}
              </Text>
            </View>
          );

          if (!day.session) {
            return (
              <View key={day.dateKey} style={styles.restRow}>
                {dateColumn(true)}
                <View style={styles.flex}>
                  <Text style={[styles.restLabel, dir.text, { color: c.textSecondary }]}>{t('workout.week.restDay')}</Text>
                  {walk ? (
                    <Text style={[styles.walk, dir.text, { color: c.textSecondary }]}>
                      {t('workout.cardio.walk', { min: walk.minMinutes, max: walk.maxMinutes })}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          }

          const isToday = day.dateKey === today.dateKey;
          // A sample has no history: earlier days carry no status, and nothing is missed.
          // Earlier days that are neither done nor missed (before the plan began) carry no status either.
          const status: DayStatus | null = sample
            ? day.dateKey < today.dateKey ? null : isToday ? 'today' : 'planned'
            : day.status === 'planned' && day.dateKey < today.dateKey ? null : day.status;
          const chip = status ? chipColors[status] : null;
          return (
            <TouchableOpacity
              key={day.dateKey}
              accessibilityRole="button"
              onPress={() => onOpenDay(day.dateKey)}
              activeOpacity={0.8}
              style={[
                styles.dayCard,
                { backgroundColor: c.surface, borderColor: isToday ? c.primaryLime : c.border, borderWidth: isToday ? 2 : 1 },
              ]}
            >
              {dateColumn(false)}
              <View style={styles.flex}>
                <Text style={[styles.dayTitle, dir.text, { color: c.textPrimary }]}>{sessionTitle(t, day.session)}</Text>
                <Text style={[styles.meta, dir.text, { color: c.textSecondary }]}>
                  {meta(exerciseCount(day.session), day.session.estimatedMinutes)}
                </Text>
                {slotLabel ? (
                  <View style={styles.slotRow}>
                    <Icon name="moon" size={12} color={c.textSecondary} />
                    <Text style={[styles.slotText, { color: c.textSecondary }]}>{slotLabel}</Text>
                  </View>
                ) : null}
                {status === 'missed' ? (
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => onDoToday(day.dateKey)}
                    style={[styles.doToday, { backgroundColor: c.primaryLime }]}
                  >
                    <Text style={[styles.doTodayText, { color: c.limeText }]}>{t('workout.week.doToday')}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {status && chip ? (
                <View style={[styles.statusChip, { backgroundColor: chip.bg }]}>
                  {status === 'done' ? <Icon name="check" size={12} color={chip.fg} strokeWidth={3} /> : null}
                  <Text style={[styles.statusText, { color: chip.fg }]}>{t(`workout.status.${status}`)}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {onDone ? (
        <View style={[styles.doneBar, { backgroundColor: c.canvas, borderTopColor: c.border }]}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onDone}
            activeOpacity={0.8}
            style={[styles.doneButton, { backgroundColor: c.primaryLime }]}
          >
            <Text style={[styles.doneButtonText, { color: c.limeText }]}>{t('workout.week.done')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {saved ? (
        <View accessibilityLiveRegion="polite" style={styles.toast}>
          <Icon name="check" size={16} color={c.primaryLime} strokeWidth={3} />
          <Text style={styles.toastText}>{t('workout.week.saved')}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1, minWidth: 0 },
  content: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 40, gap: 10 },
  todayCard: { padding: 16, borderRadius: 22, borderWidth: 2, gap: 4 },
  restCard: { padding: 16, borderRadius: 22, borderWidth: 1, gap: 4 },
  overline: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  todayTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  meta: { fontSize: 13 },
  todayList: { marginTop: 8 },
  todayRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1 },
  todayNumber: { width: 18, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  exerciseName: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  setsReps: { fontSize: 14, fontWeight: '800' },
  rest: { fontSize: 12, fontWeight: '600' },
  primaryButton: { marginTop: 8, minHeight: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { fontSize: 16, fontWeight: '800' },
  secondaryButton: { marginTop: 8, minHeight: 48, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { fontSize: 15, fontWeight: '700' },
  todayTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  doToday: { alignSelf: 'flex-start', marginTop: 8, minHeight: 36, paddingHorizontal: 14, borderRadius: 999, justifyContent: 'center' },
  doTodayText: { fontSize: 13, fontWeight: '800' },
  doneBar: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, borderTopWidth: 1 },
  doneButton: { minHeight: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  doneButtonText: { fontSize: 16, fontWeight: '800' },
  toast: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#0A0B0D',
  },
  toastText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  heading: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3, marginTop: 10 },
  summary: { padding: 18, borderRadius: 26, gap: 10, marginBottom: 4 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  splitName: { fontSize: 12, fontWeight: '700' },
  summaryDone: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  segments: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 6, borderRadius: 999 },
  dayCard: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 72, padding: 12, borderRadius: 22 },
  dateColumn: { width: 58, alignItems: 'center' },
  dayName: { fontSize: 11, fontWeight: '700' },
  date: { fontSize: 22, fontWeight: '800' },
  dateMuted: { fontSize: 18, fontWeight: '700' },
  dayTitle: { fontSize: 16, fontWeight: '700' },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: '700' },
  restRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 4 },
  restLabel: { fontSize: 14, fontWeight: '600' },
  walk: { fontSize: 12, marginTop: 1 },
  ramadanBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  ramadanBadgeText: { fontSize: 12, fontWeight: '700' },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  slotText: { fontSize: 12, fontWeight: '600' },
  sampleCard: { gap: 12 },
  sampleTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  sampleIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sampleTitle: { fontSize: 16, fontWeight: '800' },
  sampleBody: { fontSize: 13, lineHeight: 19, marginTop: 2 },
  // Stacked full width: side by side, the labels wrapped inside their pills at phone widths.
  sampleActions: { gap: 8 },
  sampleButton: { minHeight: 46, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
});
