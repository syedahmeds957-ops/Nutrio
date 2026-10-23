import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getExercise, type WeeklyWorkoutPlan } from '@nutrio/workout-core';
import { Icon } from '../../ui/Icon.js';
import { useTheme } from '../../theme.js';
import { useI18nState, useTranslation, useTextDirection } from '../../i18n/index.js';
import { sessionTitle } from '../sessionTitle.js';

interface WorkoutWeekListProps {
  plan: WeeklyWorkoutPlan;
  onBack: () => void;
  onEdit: () => void;
}

/**
 * A plain list of the week's sessions, so a saved plan can be seen and edited.
 * Phase 4 replaces it with the designed week and day screens.
 */
export const WorkoutWeekList: React.FC<WorkoutWeekListProps> = ({ plan, onBack, onEdit }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const { language } = useI18nState();
  const dir = useTextDirection();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.canvas }]}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={onBack}
          style={[styles.backBtn, { backgroundColor: c.surface, borderColor: c.border }]}
        >
          <Icon name="arrow-left" size={18} color={c.textPrimary} style={dir.isRTL ? styles.flipped : undefined} />
        </TouchableOpacity>
        <Text accessibilityRole="header" style={[styles.title, dir.text, { color: c.textPrimary }]}>
          {t('workout.title')}
        </Text>
        <TouchableOpacity accessibilityRole="button" onPress={onEdit} style={styles.editBtn}>
          <Text style={[styles.editText, { color: c.primaryAccessible }]}>{t('workout.editPlan')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {plan.sessions.map((session) => (
          <View key={session.day} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.day, dir.text, { color: c.textSecondary }]}>{t(`workout.days.${session.day}`)}</Text>
            <Text style={[styles.sessionTitle, dir.text, { color: c.textPrimary }]}>{sessionTitle(t, session)}</Text>
            <Text style={[styles.meta, dir.text, { color: c.textSecondary }]}>
              {t('workout.week.exercises', { count: session.slots.length })} · {t('workout.week.minutes', { count: session.estimatedMinutes })}
            </Text>
            {session.slots.map((slot) => (
              <Text key={slot.slotId} style={[styles.exercise, dir.text, { color: c.textPrimary }]}>
                {getExercise(slot.exerciseId)?.name[language] ?? slot.exerciseId}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  backBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  flipped: { transform: [{ scaleX: -1 }] },
  title: { flex: 1, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  editBtn: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' },
  editText: { fontSize: 14, fontWeight: '700' },
  list: { padding: 20, gap: 10 },
  card: { padding: 16, borderRadius: 22, borderWidth: 1, gap: 4 },
  day: { fontSize: 12, fontWeight: '700' },
  sessionTitle: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 13, marginBottom: 4 },
  exercise: { fontSize: 14 },
});
