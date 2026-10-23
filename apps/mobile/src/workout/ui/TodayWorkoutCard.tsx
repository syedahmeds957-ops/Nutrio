import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { WeeklyWorkoutPlan, WorkoutLog } from '@nutrio/workout-core';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { Icon } from '../../ui/Icon.js';
import { sessionTitle } from '../sessionTitle.js';
import { buildWeekView, exerciseCount, nextTrainingDay, slotsForWeek } from '../weekView.js';
import { ExerciseImageLoop } from './ExerciseImageLoop.js';

interface TodayWorkoutCardProps {
  plan: WeeklyWorkoutPlan | null;
  logs?: readonly WorkoutLog[];
  todayKey: string;
  onSetUp: () => void;
  onOpenDay: (dateKey: string) => void;
  onSeeWeek: () => void;
}

const THUMBNAILS = 4;

/** The dashboard's small link to training: set up, start today's session, or see what's next on a rest day. */
export const TodayWorkoutCard: React.FC<TodayWorkoutCardProps> = ({ plan, logs = [], todayKey, onSetUp, onOpenDay, onSeeWeek }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const { activeRegion } = useRegion();
  const dir = useTextDirection();

  const week = plan ? buildWeekView(plan, todayKey, activeRegion, logs) : null;
  const done = week?.today.status === 'done';
  const doneFg = theme.isDark ? c.success : '#166534';
  const session = week?.today.session ?? null;
  const next = plan && !session ? nextTrainingDay(plan, todayKey) : null;

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={styles.overlineRow}>
        <View style={[styles.iconBox, { backgroundColor: c.primaryLight }]}>
          <Icon name="dumbbell" size={18} color={c.primaryAccessible} />
        </View>
        <Text style={[styles.overline, dir.text, { color: c.textSecondary }]}>{t('workout.card.overline')}</Text>
      </View>

      {!plan && (
        <>
          <Text style={[styles.title, dir.text, { color: c.textPrimary }]}>{t('workout.card.setupTitle')}</Text>
          <Text style={[styles.body, dir.text, { color: c.textSecondary }]}>{t('workout.card.setupBody')}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={onSetUp} style={[styles.primary, { backgroundColor: c.primaryLime }]}>
            <Text style={[styles.primaryText, { color: c.limeText }]}>{t('workout.card.setupCta')}</Text>
          </TouchableOpacity>
        </>
      )}

      {plan && session && week && (
        <>
          <View style={styles.trainingRow}>
            <View style={styles.flex}>
              <Text style={[styles.title, dir.text, { color: c.textPrimary }]}>{sessionTitle(t, session)}</Text>
              <Text style={[styles.body, dir.text, { color: c.textSecondary }]}>
                {t('workout.week.exercises', { count: exerciseCount(session) })} · {t('workout.week.minutes', { count: session.estimatedMinutes })}
              </Text>
            </View>
            {done ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => onOpenDay(todayKey)}
                style={[styles.startPill, { backgroundColor: c.successLight }]}
              >
                <View style={styles.doneRow}>
                  <Icon name="check" size={14} color={doneFg} strokeWidth={3} />
                  <Text style={[styles.primaryText, { color: doneFg }]}>{t('workout.status.done')}</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => onOpenDay(todayKey)}
                style={[styles.startPill, { backgroundColor: c.primaryLime }]}
              >
                <Text style={[styles.primaryText, { color: c.limeText }]}>{t('workout.card.start')}</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.thumbs}>
            {slotsForWeek(plan, session, week.weekIndex)
              .slice(0, THUMBNAILS)
              .map((slot) => (
                <ExerciseImageLoop key={slot.slotId} exerciseId={slot.exerciseId} size={52} square paused />
              ))}
          </View>
        </>
      )}

      {plan && !session && (
        <>
          <Text style={[styles.title, dir.text, { color: c.textPrimary }]}>{t('workout.card.restTitle')}</Text>
          {next ? (
            <Text style={[styles.body, dir.text, { color: c.textSecondary }]}>
              {t('workout.today.restNext', { title: sessionTitle(t, next.session), day: t(`workout.days.${next.session.day}`) })}
            </Text>
          ) : null}
          {plan.restDayWalk ? (
            <Text style={[styles.body, dir.text, { color: c.textSecondary }]}>
              {t('workout.cardio.walk', { min: plan.restDayWalk.minMinutes, max: plan.restDayWalk.maxMinutes })}
            </Text>
          ) : null}
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onSeeWeek}
            style={[styles.secondary, { backgroundColor: c.surfaceSecondary, borderColor: c.border }]}
          >
            <Text style={[styles.secondaryText, { color: c.textPrimary }]}>{t('workout.card.seeWeek')}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { marginHorizontal: 20, marginTop: 14, padding: 16, borderRadius: 22, borderWidth: 1, gap: 10 },
  overlineRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  overline: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  flex: { flex: 1, minWidth: 0 },
  title: { fontSize: 16, fontWeight: '700' },
  body: { fontSize: 13, lineHeight: 19 },
  trainingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumbs: { flexDirection: 'row', gap: 8 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  primary: { minHeight: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  startPill: { minHeight: 44, paddingHorizontal: 22, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontSize: 14, fontWeight: '800' },
  secondary: { minHeight: 44, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 14, fontWeight: '700' },
});
