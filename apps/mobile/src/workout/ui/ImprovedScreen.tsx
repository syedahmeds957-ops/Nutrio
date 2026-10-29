import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { TFunction } from 'i18next';
import { changeGroup, getExercise, type RoutineChange, type WeeklyWorkoutPlan } from '@nutrio/workout-core';
import { useTheme } from '../../theme.js';
import { useI18nState, useTranslation, useTextDirection } from '../../i18n/index.js';
import { Icon, type IconName } from '../../ui/Icon.js';
import { sessionTitle } from '../sessionTitle.js';

interface ImprovedScreenProps {
  plan: WeeklyWorkoutPlan;
  changes: readonly RoutineChange[];
  onDone: () => void;
}

interface Line {
  from?: string;
  title: string;
  reason: string;
}

const VOLUME_HIGH = 20;

/** One change as a title and its reason, in the user's language. */
export function changeLine(t: TFunction, change: RoutineChange, plan: WeeklyWorkoutPlan, language: 'en' | 'ar'): Line {
  const name = (id: string) => getExercise(id)?.name[language] ?? id;
  const day = (d: string) => t(`workout.days.${d}`);
  const list = (ids: readonly string[]) => ids.map(name).join(t('workout.improved.listSeparator'));
  switch (change.kind) {
    case 'kept_days':
      return { title: t('workout.improved.keptDays', { days: change.days.map(day).join(t('workout.improved.listSeparator')) }), reason: t('workout.improved.keptDaysWhy') };
    case 'kept_exercises':
      return {
        title:
          change.exerciseIds.length <= 2
            ? list(change.exerciseIds)
            : t('workout.improved.keptMore', { names: list(change.exerciseIds.slice(0, 2)), count: change.exerciseIds.length - 2 }),
        reason: t('workout.improved.keptExercisesWhy'),
      };
    case 'replaced':
      return change.to
        ? { from: name(change.from), title: name(change.to), reason: t(`workout.improved.why.${change.why}`) }
        : { title: t('workout.improved.leftOutOne', { name: name(change.from) }), reason: t(`workout.improved.why.${change.why}`) };
    case 'left_out':
      return { title: t('workout.improved.leftOut', { day: day(change.day), names: list(change.exerciseIds) }), reason: t('workout.improved.leftOutWhy', { count: change.fits }) };
    case 'rebalanced':
      return {
        title: t('workout.improved.rebalanced'),
        reason: t('workout.improved.rebalancedWhy', {
          missing: change.missing.map((g) => t(`workout.improved.group.${g}`)).join(t('workout.improved.andSeparator')),
          split: t(`workout.split.${plan.split}`),
        }),
      };
    case 'moved':
      return {
        title: t('workout.improved.moved', { session: sessionTitle(t, { template: change.template, variant: null }), from: day(change.from), to: day(change.to) }),
        reason: t('workout.improved.movedWhy'),
      };
    case 'balanced_push_pull':
      return { title: t('workout.improved.pushPull', change), reason: t('workout.improved.pushPullWhy') };
    case 'volume':
      return {
        title: t('workout.improved.volume', { group: t(`workout.improved.muscle.${change.group}`), from: change.from, to: change.to }),
        reason: change.from > VOLUME_HIGH ? t('workout.improved.volumeHighWhy') : t('workout.improved.volumeLowWhy'),
      };
    case 'goal_reps':
      return { title: t('workout.improved.goalReps'), reason: t('workout.improved.goalRepsWhy') };
    case 'added_cardio':
      return { title: t('workout.improved.cardio', { count: change.minutes }), reason: t('workout.improved.cardioWhy') };
    case 'start_weights':
      return { title: t('workout.improved.startWeights'), reason: t('workout.improved.startWeightsWhy') };
  }
}

const GROUPS: { key: 'kept' | 'changed' | 'added'; icon: IconName }[] = [
  { key: 'kept', icon: 'check' },
  { key: 'changed', icon: 'swap' },
  { key: 'added', icon: 'plus' },
];

/** "What we improved": the routine the user entered, kept where it works, with every change and its reason. */
export const ImprovedScreen: React.FC<ImprovedScreenProps> = ({ plan, changes, onDone }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const { language } = useI18nState();
  const dir = useTextDirection();
  const tones = {
    kept: { bg: c.successLight, fg: theme.isDark ? c.success : '#166534' },
    changed: { bg: c.warningLight, fg: theme.isDark ? c.warning : '#92400E' },
    added: { bg: c.primaryLight, fg: c.primaryTintText },
  };
  const keptCount = changes.find((ch) => ch.kind === 'kept_exercises');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.canvas }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.over, { backgroundColor: c.primaryLight }]}>
          <Text style={[styles.overText, { color: c.primaryTintText }]}>{t('workout.improved.over')}</Text>
        </View>
        <Text accessibilityRole="header" style={[styles.title, dir.text, { color: c.textPrimary }]}>
          {t('workout.improved.title')}
        </Text>
        <Text style={[styles.sub, dir.text, { color: c.textSecondary }]}>
          {t('workout.improved.subtitle', {
            days: plan.sessions.length,
            count: keptCount && keptCount.kind === 'kept_exercises' ? keptCount.exerciseIds.length : 0,
          })}
        </Text>
        {GROUPS.map(({ key, icon }) => {
          const items = changes.filter((ch) => changeGroup(ch) === key);
          if (!items.length) return null;
          return (
            <View key={key} style={styles.group}>
              <View style={styles.groupHead}>
                <View style={[styles.badge, { backgroundColor: tones[key].bg }]}>
                  <Icon name={icon} size={12} color={tones[key].fg} strokeWidth={3} />
                </View>
                <Text style={[styles.groupLabel, { color: c.textSecondary }]}>{t(`workout.improved.${key}`)}</Text>
              </View>
              <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
                {items.map((change, i) => {
                  const line = changeLine(t, change, plan, language);
                  return (
                    <View key={i} style={[styles.item, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}>
                      <Text style={[styles.itemTitle, dir.text, { color: c.textPrimary }]}>
                        {line.from ? <Text style={[styles.from, { color: c.textSecondary }]}>{line.from}</Text> : null}
                        {line.from ? <Text style={{ color: c.textSecondary }}>{` ${dir.isRTL ? '←' : '→'} `}</Text> : null}
                        {line.title}
                      </Text>
                      <Text style={[styles.reason, dir.text, { color: c.textSecondary }]}>{line.reason}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
        <Text style={[styles.foot, dir.text, { color: c.textSecondary }]}>{t('workout.improved.foot')}</Text>
      </ScrollView>
      <View style={[styles.bottomBar, { backgroundColor: c.canvas, borderTopColor: c.border }]}>
        <TouchableOpacity accessibilityRole="button" onPress={onDone} style={[styles.cta, { backgroundColor: c.primaryLime }]}>
          <Text style={[styles.ctaText, { color: c.limeText }]}>{t('workout.improved.seePlan')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 24, gap: 12 },
  over: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  overText: { fontSize: 12, fontWeight: '800', letterSpacing: 0 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  sub: { fontSize: 14, lineHeight: 20 },
  group: { gap: 8 },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  groupLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.4 },
  card: { borderRadius: 18, borderWidth: 1 },
  item: { paddingHorizontal: 14, paddingVertical: 12, gap: 3 },
  itemTitle: { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  from: { textDecorationLine: 'line-through', fontWeight: '600' },
  reason: { fontSize: 12, lineHeight: 17 },
  foot: { fontSize: 12, lineHeight: 17 },
  bottomBar: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, borderTopWidth: 1 },
  cta: { minHeight: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 16, fontWeight: '800' },
});
