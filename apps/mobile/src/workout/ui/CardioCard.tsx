import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getExercise } from '@nutrio/workout-core';
import { useTheme } from '../../theme.js';
import { useI18nState, useTranslation, useTextDirection } from '../../i18n/index.js';
import { Icon } from '../../ui/Icon.js';
import { cardioCueText, cardioText } from '../format.js';
import type { CardioView } from '../weekView.js';
import { ExerciseImageLoop } from './ExerciseImageLoop.js';
import { Stepper } from './SetLogger.js';

interface CardioCardProps {
  cardio: CardioView;
  paused: boolean;
  onDetails: () => void;
  /** Shown before starting: the ⋯ menu and, after a swap, the tag and reset link. */
  onOptions?: () => void;
  swapped?: boolean;
  onReset?: () => void;
  /** While logging: the minutes row and its tick. */
  logging?: { minutes: number; done: boolean; onMinutes: (minutes: number) => void; onToggle: () => void; onFieldFocus?: (field: TextInput | null) => void };
  /** On a done day: the minutes logged, or null when it was skipped. */
  loggedMinutes?: number | null;
}

/** The cardio block that ends a session: the move, its minutes and pace, and how hard it should feel. */
export const CardioCard: React.FC<CardioCardProps> = ({ cardio, paused, onDetails, onOptions, swapped, onReset, logging, loggedMinutes }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const { language } = useI18nState();
  const dir = useTextDirection();
  const exercise = getExercise(cardio.exerciseId);
  const name = exercise?.name[language] ?? cardio.exerciseId;
  const intervals = exercise?.pattern === 'conditioning';

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={styles.top}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('workout.day.details', { name })} onPress={onDetails}>
          <ExerciseImageLoop exerciseId={cardio.exerciseId} size={68} square paused={paused} />
        </TouchableOpacity>
        <View style={styles.flex}>
          <View style={[styles.overline, { backgroundColor: c.primaryLight }]}>
            <Icon name="flame" size={11} color={c.primaryTintText} strokeWidth={2.4} />
            <Text style={[styles.overlineText, { color: c.primaryTintText }]}>{t('workout.cardio.overline')}</Text>
          </View>
          <Text style={[styles.name, dir.text, { color: c.textPrimary }]}>{name}</Text>
          {swapped ? (
            <View style={[styles.swappedTag, { backgroundColor: c.primaryLight }]}>
              <Text style={[styles.swappedText, { color: c.primaryTintText }]}>{t('workout.swap.tag')}</Text>
            </View>
          ) : null}
          <Text style={[styles.presc, dir.text, { color: c.textPrimary }]}>{cardioText(t, cardio, intervals)}</Text>
          <Text style={[styles.cue, dir.text, { color: c.textSecondary }]}>{cardioCueText(t, cardio, intervals)}</Text>
        </View>
        {onOptions ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t('workout.options.label', { name })}
            onPress={onOptions}
            style={[styles.more, { backgroundColor: c.surfaceSecondary }]}
          >
            <Icon name="more" size={20} color={c.textPrimary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {swapped && onReset ? (
        <TouchableOpacity accessibilityRole="button" onPress={onReset} style={styles.resetLink}>
          <Text style={[styles.resetText, dir.text, { color: c.primaryAccessible }]}>{t('workout.swap.reset')}</Text>
        </TouchableOpacity>
      ) : null}

      {logging ? (
        <View style={[styles.row, logging.done && { backgroundColor: c.primaryLight }]}>
          <Text style={[styles.rowLabel, { color: c.textSecondary }]}>{t('workout.cardio.minutes')}</Text>
          <Stepper
            value={logging.minutes}
            format={String}
            onMinus={() => logging.onMinutes(Math.max(1, logging.minutes - 1))}
            onPlus={() => logging.onMinutes(logging.minutes + 1)}
            onType={(value) => value !== undefined && value > 0 && logging.onMinutes(Math.round(value))}
            minusLabel={t('workout.cardio.fewer')}
            plusLabel={t('workout.cardio.more')}
            fieldLabel={t('workout.cardio.minutesField')}
            onFieldFocus={logging.onFieldFocus}
          />
          <TouchableOpacity
            accessibilityRole="checkbox"
            aria-checked={logging.done}
            accessibilityLabel={t('workout.cardio.done')}
            onPress={logging.onToggle}
            style={[
              styles.check,
              logging.done ? { backgroundColor: c.primaryLime } : { backgroundColor: c.surfaceSecondary, borderColor: c.border, borderWidth: 1 },
            ]}
          >
            <Icon name="check" size={18} color={logging.done ? c.limeText : c.textSecondary} strokeWidth={3} />
          </TouchableOpacity>
        </View>
      ) : null}

      {loggedMinutes !== undefined ? (
        <Text style={[styles.logged, dir.text, { color: c.textPrimary }]}>
          {loggedMinutes === null ? t('workout.logged.skipped') : t('workout.cardio.loggedMinutes', { count: loggedMinutes })}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 22, borderWidth: 1, gap: 10 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1, minWidth: 0 },
  overline: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, marginBottom: 2 },
  overlineText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  name: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  swappedTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, marginTop: 3 },
  swappedText: { fontSize: 11, fontWeight: '800' },
  presc: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  cue: { fontSize: 12, marginTop: 2 },
  more: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  resetLink: { alignSelf: 'flex-start', minHeight: 36, justifyContent: 'center' },
  resetText: { fontSize: 13, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 14 },
  rowLabel: { width: 64, fontSize: 12, fontWeight: '700' },
  check: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  logged: { fontSize: 13, fontWeight: '700' },
});
