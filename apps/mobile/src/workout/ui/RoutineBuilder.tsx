import React, { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getExercise, type Weekday, type WorkoutSettings } from '@nutrio/workout-core';
import { useRegion } from '../../common/region/index.js';
import { weekdaysFrom } from '../../tracker/weekStrip.js';
import { weekStartFor } from '../weekView.js';
import { useTheme } from '../../theme.js';
import { useI18nState, useTranslation, useTextDirection } from '../../i18n/index.js';
import { Icon } from '../../ui/Icon.js';
import {
  addRoutineExercise,
  clearRoutine,
  moveRoutineExercise,
  removeRoutineExercise,
  routineBlocker,
  routineOf,
  setRoutineExercise,
  toggleRoutineDay,
} from '../setupState.js';
import { ExerciseImageLoop } from './ExerciseImageLoop.js';
import { ExercisePickerSheet } from './ExercisePickerSheet.js';
import { KEYBOARD_BEHAVIOR } from './keyboard.js';
import { parseNumber } from './SetLogger.js';
import { Chip } from './SetupChips.js';
import { WorkoutHeader } from './WorkoutHeader.js';


interface RoutineBuilderProps {
  settings: WorkoutSettings;
  update: (settings: WorkoutSettings) => void;
  onBack: () => void;
  onImprove: () => void;
}

const SmallNumber: React.FC<{ value?: number; label: string; onCommit: (value: number | undefined) => void }> = ({ value, label, onCommit }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const [text, setText] = useState(value ? String(value) : '');
  return (
    <TextInput
      accessibilityLabel={label}
      value={text}
      // Committed as typed, not on blur: "Improve my routine" can be tapped while the field still has focus.
      onChangeText={(next) => {
        setText(next);
        onCommit(parseNumber(next));
      }}
      keyboardType="number-pad"
      placeholder="—"
      placeholderTextColor={c.textSecondary}
      style={[styles.small, { color: c.textPrimary, borderColor: c.border, backgroundColor: c.surfaceSecondary }]}
    />
  );
};

/**
 * The routine a user already follows, entered day by day from our exercise
 * list: the days, then each day's exercises with optional sets × reps.
 * "Improve my routine" builds the plan from it.
 */
export const RoutineBuilder: React.FC<RoutineBuilderProps> = ({ settings, update, onBack, onImprove }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const { activeRegion } = useRegion();
  const { language } = useI18nState();
  const dir = useTextDirection();
  const routine = routineOf(settings);
  const [selectedDay, setSelectedDay] = useState<Weekday | null>(routine.days[0]?.day ?? null);
  const [picking, setPicking] = useState(false);
  const current = routine.days.find((d) => d.day === selectedDay) ?? routine.days[0];
  const blocker = routineBlocker(routine);
  const ready = blocker === null;
  const nameOf = (id: string) => getExercise(id)?.name[language] ?? id;
  // Said next to the button in plain words: which days still need an exercise, or that days are missing.
  const blockerText =
    blocker?.kind === 'empty'
      ? t('workout.routine.needsExercises', {
          days: blocker.days.map((day) => t(`workout.days.${day}`)).join(language === 'ar' ? '، ' : ', '),
        })
      : blocker
        ? t('workout.routine.needs')
        : null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.canvas }]}>
      <WorkoutHeader title={t('workout.routine.title')} onBack={onBack} />
      {/* The list and the button bar rise with the keyboard, so the sets × reps fields and the button stay in view. */}
      <KeyboardAvoidingView style={styles.flex} behavior={KEYBOARD_BEHAVIOR}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <Text style={[styles.sub, dir.text, { color: c.textSecondary }]}>{t('workout.routine.subtitle')}</Text>

          <Text style={[styles.label, dir.text, { color: c.textPrimary }]}>{t('workout.routine.daysQ')}</Text>
          <View style={styles.days}>
            {weekdaysFrom(weekStartFor(activeRegion)).map((day) => (
              <Chip
                key={day}
                label={t(`workout.days.${day}`)}
                selected={routine.days.some((d) => d.day === day)}
                onPress={() => {
                  const next = toggleRoutineDay(settings, day);
                  update(next);
                  if (routineOf(next).days.some((d) => d.day === day)) setSelectedDay(day);
                }}
                style={styles.dayChip}
              />
            ))}
          </View>

          {routine.days.length ? (
            <View accessibilityRole="tablist" style={styles.tabs}>
              {routine.days.map((d) => {
                const selected = current?.day === d.day;
                return (
                  <TouchableOpacity
                    key={d.day}
                    accessibilityRole="tab"
                    aria-selected={selected}
                    onPress={() => setSelectedDay(d.day)}
                    style={[styles.tab, { backgroundColor: selected ? c.primaryLime : c.surface, borderColor: selected ? c.primaryLime : c.border }]}
                  >
                    <Text style={[styles.tabDay, { color: selected ? c.limeText : c.textPrimary }]}>{t(`workout.days.${d.day}`)}</Text>
                    <Text style={[styles.tabCount, { color: selected ? c.limeText : c.textSecondary }]}>
                      {t('workout.week.exercises', { count: d.exercises.length })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          {current ? (
            <>
              <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
                {current.exercises.length === 0 ? (
                  <Text style={[styles.empty, dir.text, { color: c.textSecondary }]}>{t('workout.routine.emptyDay')}</Text>
                ) : null}
                {current.exercises.map((entry, index) => {
                  const name = nameOf(entry.exerciseId);
                  return (
                    <View key={entry.exerciseId} style={[styles.row, index > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}>
                      <ExerciseImageLoop exerciseId={entry.exerciseId} size={44} square paused />
                      <View style={styles.flex}>
                        <Text style={[styles.name, dir.text, { color: c.textPrimary }]} numberOfLines={2}>
                          {name}
                        </Text>
                        <View style={styles.setsRow}>
                          <SmallNumber
                            key={`${current.day}-${entry.exerciseId}-sets`}
                            value={entry.sets}
                            label={t('workout.routine.setsField', { name })}
                            onCommit={(sets) => update(setRoutineExercise(settings, current.day, index, { sets: sets ? Math.round(sets) : undefined }))}
                          />
                          <Text style={[styles.times, { color: c.textSecondary }]}>×</Text>
                          <SmallNumber
                            key={`${current.day}-${entry.exerciseId}-reps`}
                            value={entry.reps}
                            label={t('workout.routine.repsField', { name })}
                            onCommit={(reps) => update(setRoutineExercise(settings, current.day, index, { reps: reps ? Math.round(reps) : undefined }))}
                          />
                        </View>
                      </View>
                      <View style={styles.order}>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel={t('workout.routine.moveUp', { name })}
                          accessibilityState={{ disabled: index === 0 }}
                          disabled={index === 0}
                          onPress={() => update(moveRoutineExercise(settings, current.day, index, -1))}
                          style={[styles.iconBtn, index === 0 && styles.dim]}
                        >
                          <Icon name="arrow-up" size={16} color={c.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel={t('workout.routine.moveDown', { name })}
                          accessibilityState={{ disabled: index === current.exercises.length - 1 }}
                          disabled={index === current.exercises.length - 1}
                          onPress={() => update(moveRoutineExercise(settings, current.day, index, 1))}
                          style={[styles.iconBtn, index === current.exercises.length - 1 && styles.dim]}
                        >
                          <Icon name="arrow-up" size={16} color={c.textSecondary} style={styles.down} />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={t('workout.more.remove', { name })}
                        onPress={() => update(removeRoutineExercise(settings, current.day, index))}
                        style={styles.iconBtn}
                      >
                        <Icon name="x" size={16} color={c.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
              <TouchableOpacity accessibilityRole="button" onPress={() => setPicking(true)} style={[styles.add, { borderColor: c.textSecondary }]}>
                <Icon name="plus" size={16} color={c.textPrimary} strokeWidth={2.4} />
                <Text style={[styles.addText, { color: c.textPrimary }]}>{t('workout.routine.addExercise')}</Text>
              </TouchableOpacity>
            </>
          ) : null}

          {routine.days.some((d) => d.exercises.length) ? (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => {
                update(clearRoutine(settings));
                setSelectedDay(null);
              }}
              style={styles.clear}
            >
              <Text style={[styles.clearText, { color: c.danger }]}>{t('workout.routine.clear')}</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>

        <View style={[styles.bottomBar, { backgroundColor: c.surface, borderTopColor: c.border }]}>
          {blockerText ? (
            <View style={styles.needRow}>
              <Icon name="info" size={16} color={c.textPrimary} />
              <Text accessibilityLiveRegion="polite" style={[styles.need, dir.text, { color: c.textPrimary }]}>
                {blockerText}
              </Text>
            </View>
          ) : null}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ disabled: !ready }}
            accessibilityHint={blockerText ?? undefined}
            disabled={!ready}
            onPress={onImprove}
            activeOpacity={0.7}
            // Off reads as off, not as a faded version of the main button: a neutral fill and grey label.
            style={[styles.cta, { backgroundColor: ready ? c.primaryLime : c.surfaceSecondary, borderColor: ready ? c.primaryLime : c.border }]}
          >
            <Text style={[styles.ctaText, { color: ready ? c.limeText : c.textSecondary }]}>{t('workout.routine.improve')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <ExercisePickerSheet
        visible={picking && Boolean(current)}
        title={t('workout.routine.addExercise')}
        // Anything they really do can be entered; unsafe moves are replaced, with a reason, when the plan is made.
        chosen={current?.exercises.map((e) => e.exerciseId) ?? []}
        onClose={() => setPicking(false)}
        onPick={(id) => {
          if (current) update(addRoutineExercise(settings, current.day, id));
          setPicking(false);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1, minWidth: 0 },
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24, gap: 12 },
  sub: { fontSize: 13, lineHeight: 19 },
  label: { fontSize: 14, fontWeight: '700' },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dayChip: { minWidth: 44, paddingHorizontal: 8 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tab: { minWidth: 72, minHeight: 56, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tabDay: { fontSize: 13, fontWeight: '800' },
  tabCount: { fontSize: 11, fontWeight: '600' },
  card: { borderRadius: 18, borderWidth: 1 },
  empty: { padding: 16, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 8 },
  name: { fontSize: 13, fontWeight: '700' },
  setsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  small: { width: 44, height: 44, borderRadius: 8, borderWidth: 1, textAlign: 'center', fontSize: 13, fontWeight: '800', paddingVertical: 0 },
  times: { fontSize: 13, fontWeight: '700' },
  order: { gap: 2 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dim: { opacity: 0.3 },
  down: { transform: [{ rotate: '180deg' }] },
  add: { minHeight: 52, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addText: { fontSize: 14, fontWeight: '700' },
  clear: { alignSelf: 'center', minHeight: 44, justifyContent: 'center' },
  clearText: { fontSize: 13, fontWeight: '700' },
  bottomBar: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, borderTopWidth: 1, gap: 10 },
  needRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  need: { flex: 1, minWidth: 0, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  cta: { minHeight: 52, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 16, fontWeight: '800' },
});
