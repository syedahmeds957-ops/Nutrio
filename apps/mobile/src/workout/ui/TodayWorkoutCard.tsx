import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { WeeklyWorkoutPlan, WorkoutLog } from '@nutrio/workout-core';
import { useTheme, commonRadii } from '../../theme.js';
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
  /** A guest's sample plan: tagged so it never reads as their own. */
  sample?: boolean;
  /**
   * 'card' is the full-width card; 'tile' fills a bento column (the Today
   * screen's tall tile): the same states, stacked, with the whole tile opening
   * the week and a full-width button at its foot. The tile has no outer margin.
   */
  variant?: 'card' | 'tile';
}

const THUMBNAILS = 4;
const TILE_THUMB_GAP = 6;

/** The dashboard's small link to training: set up, start today's session, or see what's next on a rest day. */
export const TodayWorkoutCard: React.FC<TodayWorkoutCardProps> = ({ plan, logs = [], todayKey, onSetUp, onOpenDay, onSeeWeek, sample, variant = 'card' }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const { activeRegion } = useRegion();
  const dir = useTextDirection();

  const week = plan ? buildWeekView(plan, todayKey, activeRegion, logs) : null;
  const done = week?.today.status === 'done';
  const doneFg = c.successText;
  const session = week?.today.session ?? null;
  const next = plan && !session ? nextTrainingDay(plan, todayKey) : null;
  const [gridWidth, setGridWidth] = useState(0);

  if (variant === 'tile') {
    const thumb = gridWidth > 0 ? Math.floor((gridWidth - TILE_THUMB_GAP) / 2) : 0;
    return (
      <View style={[tile.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.7}
          onPress={plan ? onSeeWeek : onSetUp}
          style={tile.body}
        >
          <View style={tile.headRow}>
            <View style={[tile.iconBox, { backgroundColor: c.primaryLight }]}>
              <Icon name="dumbbell" size={17} color={c.primaryAccessible} />
            </View>
            <Text numberOfLines={1} style={[tile.overline, dir.text, { color: c.textSecondary }]}>
              {t('tracker.dashboard.nav.workouts')}
            </Text>
            <Icon name={dir.isRTL ? 'chevron-left' : 'chevron-right'} size={16} color={c.textMuted} />
          </View>
          {sample ? (
            <View style={[styles.sampleTag, tile.sampleTag, { backgroundColor: c.surfaceSecondary }]}>
              <Text numberOfLines={1} style={[styles.sampleTagText, { color: c.textSecondary }]}>{t('workout.guest.sampleTag')}</Text>
            </View>
          ) : null}

          {!plan && (
            <>
              <Text style={[tile.title, dir.text, { color: c.textPrimary }]}>{t('workout.card.setupTitle')}</Text>
              <Text style={[tile.meta, dir.text, { color: c.textSecondary }]} numberOfLines={4}>{t('workout.card.setupBody')}</Text>
            </>
          )}

          {plan && session && week && (
            <>
              <Text numberOfLines={2} style={[tile.title, dir.text, { color: c.textPrimary }]}>{sessionTitle(t, session)}</Text>
              <Text numberOfLines={1} style={[tile.meta, dir.text, { color: c.textSecondary }]}>
                {t('workout.week.exercises', { count: exerciseCount(session) })} · {t('workout.week.minutes', { count: session.estimatedMinutes })}
              </Text>
              <View style={tile.grid} onLayout={(e: LayoutChangeEvent) => setGridWidth(e.nativeEvent.layout.width)}>
                {thumb > 0 &&
                  slotsForWeek(plan, session, week.weekIndex)
                    .slice(0, THUMBNAILS)
                    .map((slot) => <ExerciseImageLoop key={slot.slotId} exerciseId={slot.exerciseId} size={thumb} square paused />)}
              </View>
            </>
          )}

          {plan && !session && (
            <>
              <Text style={[tile.title, dir.text, { color: c.textPrimary }]}>{t('workout.card.restTitle')}</Text>
              {next ? (
                <Text style={[tile.meta, dir.text, { color: c.textSecondary }]} numberOfLines={3}>
                  {t('workout.today.restNext', { title: sessionTitle(t, next.session), day: t(`workout.days.${next.session.day}`) })}
                </Text>
              ) : null}
              {plan.restDayWalk ? (
                <Text style={[tile.meta, dir.text, { color: c.textSecondary }]} numberOfLines={2}>
                  {t('workout.cardio.walk', { min: plan.restDayWalk.minMinutes, max: plan.restDayWalk.maxMinutes })}
                </Text>
              ) : null}
            </>
          )}
        </TouchableOpacity>

        {!plan && (
          <TouchableOpacity accessibilityRole="button" onPress={onSetUp} style={[tile.button, { backgroundColor: c.surfaceSecondary }]}>
            <Text style={[styles.primaryText, { color: c.textPrimary }]}>{t('workout.card.setupCta')}</Text>
          </TouchableOpacity>
        )}
        {plan && session && (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => onOpenDay(todayKey)}
            style={[tile.button, { backgroundColor: done ? c.successLight : c.primaryLime }]}
          >
            {done ? (
              <View style={styles.doneRow}>
                <Icon name="check" size={14} color={doneFg} strokeWidth={3} />
                <Text style={[styles.primaryText, { color: doneFg }]}>{t('workout.status.done')}</Text>
              </View>
            ) : (
              <Text style={[styles.primaryText, { color: c.limeText }]}>{t('workout.card.start')}</Text>
            )}
          </TouchableOpacity>
        )}
        {plan && !session && (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onSeeWeek}
            style={[tile.button, { backgroundColor: c.surfaceSecondary, borderColor: c.border, borderWidth: 1 }]}
          >
            <Text style={[styles.secondaryText, { color: c.textPrimary }]}>{t('workout.card.seeWeek')}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={styles.overlineRow}>
        <View style={[styles.iconBox, { backgroundColor: c.primaryLight }]}>
          <Icon name="dumbbell" size={18} color={c.primaryAccessible} />
        </View>
        <Text style={[styles.overline, dir.text, { color: c.textSecondary }]}>{t('workout.card.overline')}</Text>
        {sample ? (
          <View style={[styles.sampleTag, { backgroundColor: c.surfaceSecondary }]}>
            <Text numberOfLines={1} style={[styles.sampleTagText, { color: c.textSecondary }]}>{t('workout.guest.sampleTag')}</Text>
          </View>
        ) : null}
      </View>

      {!plan && (
        <>
          <Text style={[styles.title, dir.text, { color: c.textPrimary }]}>{t('workout.card.setupTitle')}</Text>
          <Text style={[styles.body, dir.text, { color: c.textSecondary }]}>{t('workout.card.setupBody')}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={onSetUp} style={[styles.primary, { backgroundColor: c.surfaceSecondary }]}>
            <Text style={[styles.primaryText, { color: c.textPrimary }]}>{t('workout.card.setupCta')}</Text>
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

const tile = StyleSheet.create({
  card: { flex: 1, padding: 14, borderRadius: 20, borderWidth: 1, gap: 10 },
  body: { gap: 4 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  iconBox: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  overline: { flex: 1, fontSize: 12, fontWeight: '700', letterSpacing: 0 },
  title: { fontSize: 19, fontWeight: '800', letterSpacing: -0.2 },
  meta: { fontSize: 12.5, lineHeight: 17 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: TILE_THUMB_GAP, marginTop: 8, alignSelf: 'stretch' },
  sampleTag: { alignSelf: 'flex-start' },
  button: { minHeight: 44, borderRadius: commonRadii.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
});

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 14, padding: 16, borderRadius: 22, borderWidth: 1, gap: 10 },
  overlineRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  overline: { fontSize: 12, fontWeight: '700', letterSpacing: 0 },
  flex: { flex: 1, minWidth: 0 },
  title: { fontSize: 16, fontWeight: '700' },
  body: { fontSize: 13, lineHeight: 19 },
  trainingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumbs: { flexDirection: 'row', gap: 8 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  primary: { minHeight: 48, borderRadius: commonRadii.pill, alignItems: 'center', justifyContent: 'center' },
  startPill: { minHeight: 44, paddingHorizontal: 22, borderRadius: commonRadii.pill, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontSize: 14, fontWeight: '800' },
  secondary: { minHeight: 44, borderRadius: commonRadii.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 14, fontWeight: '700' },
  sampleTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: commonRadii.pill },
  sampleTagText: { fontSize: 12, fontWeight: '800' },
});
