import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { SessionRating } from '@nutrio/workout-core';
import { useTheme } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { clockText } from '../format.js';
import type { DraftStats } from '../workoutDraft.js';

interface FinishSheetProps {
  visible: boolean;
  sessionTitle: string;
  elapsedSec: number;
  stats: DraftStats;
  onClose: () => void;
  onSave: (rating: SessionRating) => void;
}

const RATINGS: readonly SessionRating[] = ['easy', 'right', 'hard'];

/** "Nice work!": the workout's numbers and how it felt, which shapes the next targets. */
export const FinishSheet: React.FC<FinishSheetProps> = ({ visible, sessionTitle, elapsedSec, stats, onClose, onSave }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const dir = useTextDirection();
  const [rating, setRating] = useState<SessionRating | null>(null);

  const stat = (value: string, label: string) => (
    <View style={[styles.stat, { backgroundColor: c.surfaceSecondary }]}>
      <Text style={[styles.statValue, { color: c.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: c.textSecondary }]}>{label}</Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        accessibilityLabel={t('workout.detail.close')}
        onPress={onClose}
        style={[styles.backdrop, { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.62)' : 'rgba(15,23,42,0.45)' }]}
      />
      <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: c.surface }]}>
        <View style={[styles.handle, { backgroundColor: c.border }]} />
        <Text accessibilityRole="header" style={[styles.title, { color: c.textPrimary }]}>
          {t('workout.finish.title')}
        </Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>{t('workout.finish.sessionDone', { title: sessionTitle })}</Text>

        <View style={styles.stats}>
          {stat(clockText(elapsedSec), t('workout.finish.time'))}
          {stat(String(stats.setsDone), t('workout.finish.sets'))}
          {stat(String(stats.kgLifted), t('workout.finish.kg'))}
        </View>

        {stats.cardioMinutes > 0 ? (
          <Text style={[styles.cardio, { color: c.textSecondary }]}>{t('workout.cardio.stat', { count: stats.cardioMinutes })}</Text>
        ) : null}
        <Text style={[styles.question, dir.text, { color: c.textPrimary }]}>{t('workout.finish.feel')}</Text>
        {RATINGS.map((value) => {
          const selected = rating === value;
          return (
            <TouchableOpacity
              key={value}
              accessibilityRole="radio"
              aria-checked={selected}
              onPress={() => setRating(value)}
              style={[
                styles.option,
                { backgroundColor: selected ? c.primaryLight : c.surface, borderColor: selected ? c.primaryLime : c.border },
              ]}
            >
              <Text style={[styles.optionTitle, dir.text, { color: c.textPrimary }]}>{t(`workout.finish.${value}`)}</Text>
              <Text style={[styles.optionBody, dir.text, { color: c.textSecondary }]}>{t(`workout.finish.${value}Body`)}</Text>
            </TouchableOpacity>
          );
        })}
        <Text style={[styles.help, { color: c.textSecondary }]}>{t('workout.finish.help')}</Text>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ disabled: rating === null }}
          disabled={rating === null}
          onPress={() => rating && onSave(rating)}
          style={[styles.save, { backgroundColor: c.primaryLime }, rating === null && styles.disabled]}
        >
          <Text style={[styles.saveText, { color: c.limeText }]}>{t('workout.finish.save')}</Text>
        </TouchableOpacity>
      </View>
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
    maxWidth: 500,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
    gap: 8,
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 999, marginBottom: 6 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center', letterSpacing: -0.4 },
  subtitle: { fontSize: 14, textAlign: 'center' },
  stats: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 16 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  cardio: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  question: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  option: { padding: 12, borderRadius: 16, borderWidth: 1.5 },
  optionTitle: { fontSize: 15, fontWeight: '700' },
  optionBody: { fontSize: 12, marginTop: 2 },
  help: { fontSize: 12, textAlign: 'center', marginTop: 2 },
  save: { minHeight: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  saveText: { fontSize: 16, fontWeight: '800' },
  disabled: { opacity: 0.35 },
});
