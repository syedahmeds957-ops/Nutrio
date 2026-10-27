import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EXERCISES, getExercise, isAllowed, MUSCLE_NAMES, searchExercises, type Exercise, type WorkoutSettings } from '@nutrio/workout-core';
import { useTheme } from '../../theme.js';
import { useI18nState, useTranslation, useTextDirection } from '../../i18n/index.js';
import { Icon } from '../../ui/Icon.js';
import { equipmentText } from '../format.js';
import { MAX_WALK_MINUTES, WALK_EXERCISE_ID } from '../workoutEdit.js';
import { ExerciseImageLoop } from './ExerciseImageLoop.js';
import { KEYBOARD_BEHAVIOR, useKeyboardVisible } from './keyboard.js';
import { parseNumber } from './SetLogger.js';

interface ExercisePickerProps {
  title: string;
  /** Limits results to what the user can do; omit to search every exercise (e.g. dislikes). */
  settings?: WorkoutSettings;
  /** Already chosen: shown as added. */
  chosen: readonly string[];
  /** Single choice: tapping a row picks it and the caller closes the sheet. Not used with `onConfirm`. */
  onPick?: (exerciseId: string) => void;
  /**
   * Multiple choice: rows toggle, and a confirm button under the list adds them
   * all at once. Also shows the exercises that suit the user before they type.
   */
  onConfirm?: (exerciseIds: string[]) => void;
  /** Adds a "walk session" row at the top; it asks for the minutes and calls this. */
  onAddWalk?: (minutes: number) => void;
  onClose: () => void;
}

const SUGGESTIONS = 12;

/** Search our exercise list by English or Arabic name (and common nicknames) and pick one or several. */
export const ExercisePickerSheet: React.FC<ExercisePickerProps & { visible: boolean }> = ({ visible, ...props }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={props.onClose}>
      {/* Pads (iOS) or shrinks (Android) by the keyboard, so the sheet and its confirm button sit above it. */}
      <KeyboardAvoidingView style={styles.keyboardFrame} behavior={KEYBOARD_BEHAVIOR}>
        <Pressable
          accessibilityLabel={t('workout.detail.close')}
          onPress={props.onClose}
          style={[styles.backdrop, { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.62)' : 'rgba(15,23,42,0.45)' }]}
        />
        {visible ? <ExercisePickerBody {...props} /> : null}
      </KeyboardAvoidingView>
    </Modal>
  );
};

/** What an exercise works and needs: "Chest · Triceps" and "Barbell · Bench". */
function muscleText(exercise: Exercise, language: 'en' | 'ar'): string {
  return exercise.primaryMuscles
    .slice(0, 2)
    .map((muscle) => MUSCLE_NAMES[muscle][language])
    .join(' · ');
}

/** The sheet itself, apart from its Modal so it can be rendered on its own. */
export const ExercisePickerBody: React.FC<ExercisePickerProps & { initialQuery?: string }> = ({
  title,
  settings,
  chosen,
  onPick,
  onConfirm,
  onAddWalk,
  onClose,
  initialQuery = '',
}) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const { language } = useI18nState();
  const dir = useTextDirection();
  const insets = useSafeAreaInsets();
  const keyboardUp = useKeyboardVisible();
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState<string[]>([]);
  const [walking, setWalking] = useState(false);
  const [minutesText, setMinutesText] = useState('');
  const multi = Boolean(onConfirm);
  const typed = query.trim() !== '';
  const [group, setGroup] = useState<'strength' | 'cardio'>('strength');
  const walk = getExercise(WALK_EXERCISE_ID);
  let results: Exercise[];
  if (typed) {
    results = searchExercises(query, { settings, limit: 20 });
    // A plain walk needs no equipment and is never filtered out, even when the user once disliked it.
    if (multi && walk && !results.some((exercise) => exercise.id === walk.id) && searchExercises(query, { limit: 50 }).some((exercise) => exercise.id === walk.id)) {
      results = [walk, ...results];
    }
  } else if (multi && settings) {
    results =
      group === 'cardio'
        ? EXERCISES.filter((exercise) => exercise.pattern === 'cardio' && (exercise.id === WALK_EXERCISE_ID || isAllowed(exercise, settings))).sort(
            (a, b) => Number(b.id === WALK_EXERCISE_ID) - Number(a.id === WALK_EXERCISE_ID)
          )
        : EXERCISES.filter((exercise) => exercise.pattern !== 'cardio' && exercise.compound && isAllowed(exercise, settings)).slice(0, SUGGESTIONS);
  } else {
    results = [];
  }
  const minutes = parseNumber(minutesText);
  const validMinutes = minutes !== undefined && minutes >= 1;
  // The home-indicator padding is only needed while the keyboard is down.
  const bottomPad = keyboardUp ? 12 : Math.max(insets.bottom, 12) + 12;

  const toggle = (exerciseId: string) =>
    setSelected((current) => (current.includes(exerciseId) ? current.filter((id) => id !== exerciseId) : [...current, exerciseId]));

  const header = (heading: string, onBack?: () => void) => (
    <View style={styles.titleRow}>
      {onBack ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={onBack}
          style={[styles.close, { backgroundColor: c.surfaceSecondary }]}
        >
          <Icon name="arrow-left" size={16} color={c.textPrimary} style={dir.isRTL ? styles.flipped : undefined} />
        </TouchableOpacity>
      ) : null}
      <Text accessibilityRole="header" style={[styles.title, dir.text, { color: c.textPrimary }]}>
        {heading}
      </Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={t('workout.detail.close')}
        onPress={onClose}
        style={[styles.close, { backgroundColor: c.surfaceSecondary }]}
      >
        <Icon name="x" size={16} color={c.textPrimary} />
      </TouchableOpacity>
    </View>
  );

  if (walking && onAddWalk) {
    return (
      <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: c.surface, paddingBottom: bottomPad }]}>
        <View style={[styles.handle, { backgroundColor: c.border }]} />
        {header(t('workout.edit.walkTitle'), () => setWalking(false))}
        <Text style={[styles.hint, dir.text, { color: c.textSecondary }]}>{t('workout.edit.walkHint')}</Text>
        <Text style={[styles.label, dir.text, { color: c.textPrimary }]}>{t('workout.edit.walkMinutes')}</Text>
        <View style={[styles.search, { borderColor: c.primaryLime }]}>
          <Icon name="walk" size={18} color={c.textSecondary} />
          <TextInput
            accessibilityLabel={t('workout.edit.walkMinutes')}
            value={minutesText}
            onChangeText={setMinutesText}
            autoFocus
            keyboardType="number-pad"
            maxLength={String(MAX_WALK_MINUTES).length}
            returnKeyType="done"
            onSubmitEditing={() => validMinutes && onAddWalk(minutes)}
            placeholder={t('workout.edit.walkPlaceholder')}
            placeholderTextColor={c.textSecondary}
            style={[styles.input, dir.text, { color: c.textPrimary }]}
          />
          <Text style={[styles.unit, { color: c.textSecondary }]}>{t('workout.edit.walkUnit')}</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ disabled: !validMinutes }}
          disabled={!validMinutes}
          onPress={() => validMinutes && onAddWalk(minutes)}
          style={[styles.confirm, { backgroundColor: c.primaryLime }, !validMinutes && styles.disabled]}
        >
          <Text style={[styles.confirmText, { color: c.limeText }]}>{t('workout.edit.walkAdd')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: c.surface, paddingBottom: bottomPad }]}>
      <View style={[styles.handle, { backgroundColor: c.border }]} />
      {header(title)}
      {onAddWalk ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setWalking(true)}
          activeOpacity={0.8}
          style={[styles.walkRow, { backgroundColor: c.primaryLight, borderColor: c.primaryLime }]}
        >
          <View style={[styles.walkIcon, { backgroundColor: c.primaryLime }]}>
            <Icon name="walk" size={22} color={c.limeText} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.name, dir.text, { color: c.textPrimary }]}>{t('workout.edit.walkTitle')}</Text>
            <Text style={[styles.equipment, dir.text, { color: c.textSecondary }]}>{t('workout.edit.walkRowBody')}</Text>
          </View>
          <Icon name="chevron-right" size={16} color={c.textSecondary} style={dir.isRTL ? styles.flipped : undefined} />
        </TouchableOpacity>
      ) : null}
      <View style={[styles.search, { borderColor: c.primaryLime }]}>
        <Icon name="search" size={18} color={c.textSecondary} />
        <TextInput
          accessibilityLabel={t('workout.more.searchLabel')}
          value={query}
          onChangeText={setQuery}
          autoFocus={!onAddWalk}
          autoCorrect={false}
          returnKeyType="search"
          placeholder={t('workout.more.searchPlaceholder')}
          placeholderTextColor={c.textSecondary}
          style={[styles.input, dir.text, { color: c.textPrimary }]}
        />
      </View>
      {multi && !typed ? (
        <View style={styles.groups}>
          {(['strength', 'cardio'] as const).map((value) => {
            const on = group === value;
            return (
              <TouchableOpacity
                key={value}
                accessibilityRole="button"
                aria-selected={on}
                onPress={() => setGroup(value)}
                style={[styles.group, { backgroundColor: on ? c.primaryLime : c.surfaceSecondary, borderColor: on ? c.primaryLime : c.border }]}
              >
                <Text style={[styles.groupText, { color: on ? c.limeText : c.textPrimary }]}>{t(`workout.edit.group.${value}`)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
      {typed && results.length === 0 ? (
        <Text style={[styles.hint, dir.text, { color: c.textSecondary }]}>{t('workout.more.noResults')}</Text>
      ) : !typed && multi ? (
        <Text style={[styles.hint, dir.text, { color: c.textSecondary }]}>{t('workout.edit.suggested')}</Text>
      ) : null}
      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {results.map((exercise) => {
          const added = chosen.includes(exercise.id);
          const picked = selected.includes(exercise.id);
          const name = exercise.name[language];
          return (
            <TouchableOpacity
              key={exercise.id}
              accessibilityRole={multi ? 'checkbox' : 'button'}
              accessibilityLabel={name}
              accessibilityState={{ disabled: added }}
              aria-checked={multi ? picked : undefined}
              disabled={added}
              onPress={() => (multi ? toggle(exercise.id) : onPick?.(exercise.id))}
              style={[styles.row, { borderColor: picked ? c.primaryLime : c.border }, picked && { backgroundColor: c.primaryLight }, picked && styles.rowPicked]}
            >
              <ExerciseImageLoop exerciseId={exercise.id} size={48} square paused />
              <View style={styles.flex}>
                <Text style={[styles.name, dir.text, { color: c.textPrimary }]}>{name}</Text>
                <Text numberOfLines={1} style={[styles.equipment, dir.text, { color: c.textSecondary }]}>
                  {[muscleText(exercise, language), equipmentText(t, exercise)].filter(Boolean).join(' · ')}
                </Text>
              </View>
              {added ? (
                <View style={[styles.added, { backgroundColor: c.successLight }]}>
                  <Text style={[styles.addedText, { color: theme.isDark ? c.success : '#166534' }]}>{t('workout.more.added')}</Text>
                </View>
              ) : multi ? (
                <View style={[styles.mark, picked ? { backgroundColor: c.primaryLime } : { borderColor: c.border, borderWidth: 1.5 }]}>
                  {picked ? <Icon name="check" size={16} color={c.limeText} strokeWidth={3} /> : null}
                </View>
              ) : (
                <Icon name="plus" size={18} color={c.primaryAccessible} strokeWidth={2.4} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {onConfirm ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ disabled: selected.length === 0 }}
          disabled={selected.length === 0}
          onPress={() => onConfirm(selected)}
          style={[styles.confirm, { backgroundColor: c.primaryLime }, selected.length === 0 && styles.disabled]}
        >
          <Text style={[styles.confirmText, { color: c.limeText }]}>
            {selected.length > 1 ? t('workout.edit.addSelected', { count: selected.length }) : t('workout.edit.addExercise')}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  keyboardFrame: { flex: 1, justifyContent: 'flex-end' },
  backdrop: StyleSheet.absoluteFill,
  sheet: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 500,
    maxHeight: '88%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 10,
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 999 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, fontSize: 19, fontWeight: '800' },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  flipped: { transform: [{ scaleX: -1 }] },
  walkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, padding: 10, borderRadius: 16, borderWidth: 1.5 },
  walkIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '800' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 14, borderRadius: 14, borderWidth: 2 },
  input: { flex: 1, minWidth: 0, fontSize: 16, fontWeight: '600', paddingVertical: 10 },
  unit: { fontSize: 14, fontWeight: '700' },
  hint: { fontSize: 12 },
  groups: { flexDirection: 'row', gap: 8 },
  group: { flex: 1, minHeight: 44, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  groupText: { fontSize: 14, fontWeight: '800' },
  // Shrinks with the keyboard, so the search box above and the confirm button below stay in view.
  listScroll: { flexGrow: 0, flexShrink: 1 },
  list: { gap: 8, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, padding: 10, borderRadius: 16, borderWidth: 1 },
  rowPicked: { borderWidth: 2 },
  flex: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: '700' },
  equipment: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  mark: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  added: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  addedText: { fontSize: 12, fontWeight: '700' },
  confirm: { minHeight: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  confirmText: { fontSize: 16, fontWeight: '800' },
  disabled: { opacity: 0.35 },
});
