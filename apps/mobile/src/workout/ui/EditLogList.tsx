import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getExercise, type Prescription, type WorkoutSettings } from '@nutrio/workout-core';
import { useTheme, commonRadii } from '../../theme.js';
import { useI18nState, useTranslation, useTextDirection } from '../../i18n/index.js';
import { Icon } from '../../ui/Icon.js';
import { isAddedSlot, isCardioEntry } from '../workoutEdit.js';
import type { WorkoutDraft } from '../workoutDraft.js';
import { ExerciseImageLoop } from './ExerciseImageLoop.js';
import { SetLogger, Stepper } from './SetLogger.js';

interface EditLogListProps {
  draft: WorkoutDraft;
  settings: WorkoutSettings;
  /** The unit the plan uses for a slot, when the slot is still in the plan. */
  unitForSlot: (slotId: string) => Prescription['unit'] | undefined;
  onReps: (exerciseIndex: number, setIndex: number, reps: number) => void;
  onLoad: (exerciseIndex: number, setIndex: number, loadKg: number | undefined) => void;
  onToggle: (exerciseIndex: number, setIndex: number) => void;
  onAddSet: (exerciseIndex: number) => void;
  onRemoveSet: (exerciseIndex: number, setIndex: number) => void;
  onDetails: (exerciseId: string) => void;
  paused: boolean;
  /** Brings a focused reps, weight or minutes field above the keyboard. */
  onFieldFocus?: (field: TextInput | null) => void;
}

/**
 * A finished session reopened: one card per logged exercise (the plan's and any
 * the user added), with the same set rows as a live session, plus add and
 * remove a set. No rest timer and no targets; it is a record of what was done.
 */
export const EditLogList: React.FC<EditLogListProps> = ({ draft, settings, unitForSlot, onReps, onLoad, onToggle, onAddSet, onRemoveSet, onDetails, paused, onFieldFocus }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const { language } = useI18nState();
  const dir = useTextDirection();

  return (
    <>
      {draft.exercises.map((entry, index) => {
        const exercise = getExercise(entry.exerciseId);
        const name = exercise?.name[language] ?? entry.exerciseId;
        const cardio = isCardioEntry(entry);
        const unit = unitForSlot(entry.slotId) ?? (exercise?.timed ? 'seconds' : 'reps');
        const added = isAddedSlot(entry.slotId);
        const last = entry.sets.length - 1;
        return (
          <View key={entry.slotId} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={styles.top}>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('workout.day.details', { name })} onPress={() => onDetails(entry.exerciseId)}>
                <ExerciseImageLoop exerciseId={entry.exerciseId} size={56} square paused={paused} />
              </TouchableOpacity>
              <View style={styles.flex}>
                <Text style={[styles.name, dir.text, { color: c.textPrimary }]}>{name}</Text>
                {added ? (
                  <View style={[styles.tag, { backgroundColor: c.primaryLight }]}>
                    <Text numberOfLines={1} style={[styles.tagText, { color: c.primaryTintText }]}>{t('workout.edit.addedTag')}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {cardio ? (
              <View style={[styles.cardioRow, entry.sets[0]?.done && { backgroundColor: c.primaryLight }]}>
                <Text style={[styles.rowLabel, dir.text, { color: c.textSecondary }]}>{t('workout.cardio.minutes')}</Text>
                <Stepper
                  value={entry.sets[0]?.reps ?? 0}
                  format={String}
                  onMinus={() => onReps(index, 0, Math.max(1, (entry.sets[0]?.reps ?? 1) - 1))}
                  onPlus={() => onReps(index, 0, (entry.sets[0]?.reps ?? 0) + 1)}
                  onType={(value) => value !== undefined && value > 0 && onReps(index, 0, Math.round(value))}
                  minusLabel={t('workout.cardio.fewer')}
                  plusLabel={t('workout.cardio.more')}
                  fieldLabel={t('workout.cardio.minutesField')}
                  onFieldFocus={onFieldFocus}
                />
                <TouchableOpacity
                  accessibilityRole="checkbox"
                  aria-checked={Boolean(entry.sets[0]?.done)}
                  accessibilityLabel={t('workout.cardio.done')}
                  onPress={() => onToggle(index, 0)}
                  style={[
                    styles.check,
                    entry.sets[0]?.done ? { backgroundColor: c.primaryLime } : { backgroundColor: c.surfaceSecondary, borderColor: c.border, borderWidth: 1 },
                  ]}
                >
                  <Icon name="check" size={18} color={entry.sets[0]?.done ? c.limeText : c.textSecondary} strokeWidth={3} />
                </TouchableOpacity>
              </View>
            ) : exercise ? (
              <>
                <SetLogger
                  exercise={exercise}
                  unit={unit}
                  settings={settings}
                  sets={entry.sets}
                  onReps={(setIndex, reps) => onReps(index, setIndex, reps)}
                  onLoad={(setIndex, kg) => onLoad(index, setIndex, kg)}
                  onToggle={(setIndex) => onToggle(index, setIndex)}
                  onFieldFocus={onFieldFocus}
                />
                <View style={styles.setActions}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => onAddSet(index)}
                    style={[styles.setButton, { backgroundColor: c.surfaceSecondary, borderColor: c.border }]}
                  >
                    <Icon name="plus" size={14} color={c.primaryAccessible} strokeWidth={2.6} />
                    <Text style={[styles.setButtonText, { color: c.textPrimary }]}>{t('workout.edit.addSet')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={t('workout.edit.removeSetLabel', { number: last + 1, name })}
                    onPress={() => onRemoveSet(index, last)}
                    style={[styles.setButton, { backgroundColor: c.surfaceSecondary, borderColor: c.border }]}
                  >
                    <Icon name="minus" size={14} color={c.danger} strokeWidth={2.6} />
                    <Text style={[styles.setButtonText, { color: c.textPrimary }]}>{t('workout.edit.removeSet')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 20, borderWidth: 1, gap: 10 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  tag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: commonRadii.pill, marginTop: 3 },
  tagText: { fontSize: 12, fontWeight: '800' },
  cardioRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 14 },
  rowLabel: { width: 64, fontSize: 12, fontWeight: '700' },
  check: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  setActions: { flexDirection: 'row', gap: 8 },
  setButton: { flex: 1, minHeight: 44, borderRadius: commonRadii.pill, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10 },
  setButtonText: { fontSize: 13, fontWeight: '700' },
});
