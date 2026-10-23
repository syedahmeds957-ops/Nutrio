import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Exercise } from '@nutrio/workout-core';
import { useTheme } from '../../theme.js';
import { useI18nState, useTranslation, useTextDirection } from '../../i18n/index.js';
import { Icon } from '../../ui/Icon.js';
import { equipmentText } from '../format.js';
import { ExerciseImageLoop } from './ExerciseImageLoop.js';

interface SwapSheetProps {
  /** The exercise being replaced; null hides the sheet. */
  exercise: Exercise | null;
  candidates: readonly Exercise[];
  /** Defaults to "Same muscles, using your equipment"; cardio says what it offers instead. */
  subtitle?: string;
  onChoose: (exerciseId: string) => void;
  onClose: () => void;
}

/** "Swap {exercise}": safe alternatives for the same muscles with the user's equipment. */
export const SwapSheet: React.FC<SwapSheetProps> = ({ exercise, candidates, subtitle, onChoose, onClose }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <Modal visible={Boolean(exercise)} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        accessibilityLabel={t('workout.detail.close')}
        onPress={onClose}
        style={[styles.backdrop, { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.62)' : 'rgba(15,23,42,0.45)' }]}
      />
      {exercise ? <SwapSheetBody exercise={exercise} candidates={candidates} subtitle={subtitle} onChoose={onChoose} onClose={onClose} /> : null}
    </Modal>
  );
};

/** The sheet itself, apart from its Modal so it can be rendered on its own. */
export const SwapSheetBody: React.FC<SwapSheetProps & { exercise: Exercise }> = ({ exercise, candidates, subtitle, onChoose, onClose }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const { language } = useI18nState();
  const dir = useTextDirection();

  return (
    <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: c.surface }]}>
      <View style={[styles.handle, { backgroundColor: c.border }]} />
      <View style={styles.titleRow}>
        <View style={styles.flex}>
          <Text accessibilityRole="header" style={[styles.title, dir.text, { color: c.textPrimary }]}>
            {t('workout.swap.title', { name: exercise.name[language] })}
          </Text>
          <Text style={[styles.subtitle, dir.text, { color: c.textSecondary }]}>{subtitle ?? t('workout.swap.subtitle')}</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('workout.detail.close')}
          onPress={onClose}
          style={[styles.close, { backgroundColor: c.surfaceSecondary }]}
        >
          <Icon name="x" size={16} color={c.textPrimary} />
        </TouchableOpacity>
      </View>

      {candidates.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: c.surfaceSecondary }]}>
          <Icon name="info" size={20} color={c.textSecondary} />
          <Text style={[styles.emptyTitle, { color: c.textPrimary }]}>{t('workout.swap.emptyTitle')}</Text>
          <Text style={[styles.emptyBody, { color: c.textSecondary }]}>{t('workout.swap.emptyBody')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {candidates.map((candidate) => (
            <TouchableOpacity
              key={candidate.id}
              accessibilityRole="button"
              onPress={() => onChoose(candidate.id)}
              activeOpacity={0.8}
              style={[styles.row, { borderColor: c.border }]}
            >
              <ExerciseImageLoop exerciseId={candidate.id} size={56} square paused />
              <View style={styles.flex}>
                <Text style={[styles.name, dir.text, { color: c.textPrimary }]}>{candidate.name[language]}</Text>
                <Text style={[styles.equipment, dir.text, { color: c.textSecondary }]}>{equipmentText(t, candidate)}</Text>
              </View>
              <Icon name="chevron-right" size={16} color={c.textSecondary} style={dir.isRTL ? styles.flipped : undefined} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: StyleSheet.absoluteFill,
  sheet: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 10,
    paddingBottom: 24,
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 999, marginBottom: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingBottom: 8 },
  flex: { flex: 1, minWidth: 0 },
  title: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 13, marginTop: 2 },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 20, gap: 8, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 18, borderWidth: 1 },
  name: { fontSize: 15, fontWeight: '700' },
  equipment: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  flipped: { transform: [{ scaleX: -1 }] },
  empty: { marginHorizontal: 20, padding: 18, borderRadius: 18, alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  emptyBody: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
});
