import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme, commonRadii } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { Icon } from '../../ui/Icon.js';
import { sessionTitle } from '../../workout/sessionTitle.js';
import type { TrainingAdherence } from '../../workout/weekView.js';

/** "Workouts 3 of 4" with one segment per planned session, and what was missed. Informational only. */
export const TrainingCard: React.FC<{ training: TrainingAdherence }> = ({ training }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const dir = useTextDirection();
  const value = t('checkin.workouts.value', { done: training.done, planned: training.planned });
  const missed = training.missed.map((session) => sessionTitle(t, session)).join(t('checkin.workouts.separator'));

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.primaryLime }]}>
      <View style={styles.header}>
        <View style={styles.label}>
          <Icon name="dumbbell" size={18} color={c.textPrimary} />
          <Text style={[styles.labelText, dir.text, { color: c.textPrimary }]}>{t('checkin.workouts.title')}</Text>
        </View>
        <Text style={[styles.value, { color: c.textPrimary }]}>{value}</Text>
      </View>
      <View
        role="progressbar"
        aria-label={t('checkin.workouts.title')}
        aria-valuemin={0}
        aria-valuemax={training.planned}
        aria-valuenow={training.done}
        aria-valuetext={value}
        style={styles.segments}
      >
        {Array.from({ length: training.planned }, (_, i) => (
          <View key={i} style={[styles.segment, { backgroundColor: i < training.done ? c.primaryLime : c.border }]} />
        ))}
      </View>
      {missed ? (
        <Text style={[styles.missed, dir.text, { color: c.textSecondary }]}>{t('checkin.workouts.missed', { names: missed })}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 20, borderWidth: 2, gap: 10, marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  label: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  labelText: { fontSize: 15, fontWeight: '700' },
  value: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  segments: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 6, borderRadius: commonRadii.pill },
  missed: { fontSize: 13 },
});
