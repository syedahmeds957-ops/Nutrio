import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { getExercise, MUSCLE_NAMES } from '@nutrio/workout-core';
import { Icon } from '../../ui/Icon.js';
import { useTheme } from '../../theme.js';
import { useI18nState, useTranslation, useTextDirection } from '../../i18n/index.js';
import { ExerciseImageLoop } from './ExerciseImageLoop.js';

interface ExerciseDetailSheetProps {
  exerciseId: string | null;
  onClose: () => void;
  /** Shows a Swap button when the exercise can be swapped from where the sheet was opened. */
  onSwap?: () => void;
  /** Shows an Ask coach button next to Swap. */
  onAskCoach?: () => void;
}

const MAX_SHEET_WIDTH = 500;

/** A bottom sheet with the exercise's demo, the muscles it works and how to do it, in the user's language. */
export const ExerciseDetailSheet: React.FC<ExerciseDetailSheetProps> = ({ exerciseId, onClose, onSwap, onAskCoach }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const { language } = useI18nState();
  const dir = useTextDirection();
  const { width } = useWindowDimensions();
  const exercise = exerciseId ? getExercise(exerciseId) : undefined;
  const imageWidth = Math.min(width, MAX_SHEET_WIDTH) - 40;

  return (
    <Modal visible={Boolean(exercise)} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityLabel={t('workout.detail.close')} onPress={onClose} style={[styles.backdrop, { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.62)' : 'rgba(15,23,42,0.45)' }]} />
      {exercise ? (
        <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: c.surface }]}>
          <View style={[styles.handle, { backgroundColor: c.border }]} />
          <View style={styles.titleRow}>
            <Text accessibilityRole="header" style={[styles.title, dir.text, { color: c.textPrimary }]}>
              {exercise.name[language]}
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
          <ScrollView contentContainerStyle={styles.body}>
            <ExerciseImageLoop exerciseId={exercise.id} size={imageWidth} style={styles.image} />
            <Text style={[styles.overline, dir.text, { color: c.textSecondary }]}>{t('workout.detail.muscles')}</Text>
            <View style={styles.chips}>
              {[...exercise.primaryMuscles, ...exercise.secondaryMuscles].map((muscle) => (
                <View key={muscle} style={[styles.chip, { backgroundColor: c.surfaceSecondary }]}>
                  <Text style={[styles.chipText, { color: c.textPrimary }]}>{MUSCLE_NAMES[muscle][language]}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.overline, dir.text, { color: c.textSecondary }]}>{t('workout.detail.howTo')}</Text>
            {exercise.instructions[language].map((step, index) => (
              <View key={index} style={styles.step}>
                <Text style={[styles.stepNumber, { color: c.textSecondary }]}>{index + 1}.</Text>
                <Text style={[styles.stepText, dir.text, { color: c.textPrimary }]}>{step}</Text>
              </View>
            ))}
            {onSwap ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={onSwap}
                style={[styles.swap, { backgroundColor: c.surfaceSecondary, borderColor: c.border }]}
              >
                <Icon name="swap" size={16} color={c.textPrimary} />
                <Text style={[styles.swapText, { color: c.textPrimary }]}>{t('workout.options.swap')}</Text>
              </TouchableOpacity>
            ) : null}
            {onAskCoach ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={onAskCoach}
                style={[styles.swap, { backgroundColor: c.surfaceSecondary, borderColor: c.border }]}
              >
                <Icon name="sparkles" size={16} color={c.textPrimary} />
                <Text style={[styles.swapText, { color: c.textPrimary }]}>{t('workout.options.askCoach')}</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: StyleSheet.absoluteFill,
  sheet: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MAX_SHEET_WIDTH,
    maxHeight: '90%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 10,
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 999, marginBottom: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20 },
  title: { flex: 1, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 34, gap: 10 },
  image: { borderRadius: 18 },
  overline: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, marginTop: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  chipText: { fontSize: 12, fontWeight: '700' },
  step: { flexDirection: 'row', gap: 8 },
  stepNumber: { fontSize: 14, lineHeight: 20, fontWeight: '700', minWidth: 18 },
  stepText: { flex: 1, fontSize: 14, lineHeight: 20 },
  swap: { marginTop: 10, minHeight: 48, borderRadius: 999, borderWidth: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  swapText: { fontSize: 15, fontWeight: '700' },
});
