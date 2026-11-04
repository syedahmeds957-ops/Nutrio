import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getExercise } from '../../workout/core.js';
import { useTheme, commonRadii } from '../../theme.js';
import { useI18nState, useTranslation, useTextDirection } from '../../i18n/index.js';
import { Icon } from '../../ui/Icon.js';
import { ExerciseImageLoop } from '../../workout/ui/ExerciseImageLoop.js';

export type SwapCardState = 'proposed' | 'applied' | 'refused';

interface ApplySwapCardProps {
  fromId: string;
  toId: string;
  state: SwapCardState;
  /** The day the swapped exercise is in, for "Swapped. … is now in Lower body A." */
  dayTitle?: string;
  /** Absent on an older card: only the newest proposal can be applied. */
  onApply?: () => void;
  onKeep?: () => void;
}

/**
 * A swap the coach proposed: nothing changes until the user taps Apply. The
 * sets, reps and weights stay the plan's; the card says so.
 */
export const ApplySwapCard: React.FC<ApplySwapCardProps> = ({ fromId, toId, state, dayTitle, onApply, onKeep }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const { language } = useI18nState();
  const dir = useTextDirection();
  const name = (id: string) => getExercise(id)?.name[language] ?? id;

  if (state === 'applied') {
    const fg = c.successText;
    return (
      <View accessibilityRole="alert" style={[styles.notice, { backgroundColor: c.successLight }]}>
        <Icon name="check" size={18} color={fg} strokeWidth={3} />
        <Text style={[styles.noticeText, dir.text, { color: fg, fontWeight: '700' }]}>
          {t('coach.swap.applied', { name: name(toId), day: dayTitle ?? '' })}
        </Text>
      </View>
    );
  }

  if (state === 'refused') {
    const fg = c.warningText;
    return (
      <View accessibilityRole="alert" style={[styles.notice, { backgroundColor: c.warningLight }]}>
        <Icon name="alert" size={18} color={fg} />
        <Text style={[styles.noticeText, dir.text, { color: fg }]}>{t('coach.swap.refused')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.primaryLime }]}>
      <Text accessibilityRole="header" style={[styles.title, dir.text, { color: c.textPrimary }]}>
        {t('coach.swap.title', { name: name(toId) })}
      </Text>
      <View accessible accessibilityLabel={t('coach.swap.from', { from: name(fromId), to: name(toId) })} style={styles.change}>
        <View style={styles.side}>
          <ExerciseImageLoop exerciseId={fromId} size={44} square paused style={styles.thumb} />
          <Text numberOfLines={2} style={[styles.fromName, dir.text, { color: c.textSecondary }]}>
            {name(fromId)}
          </Text>
        </View>
        <Icon name="arrow-right" size={18} color={c.textPrimary} strokeWidth={2.2} style={dir.isRTL ? styles.flipped : undefined} />
        <View style={styles.side}>
          <ExerciseImageLoop exerciseId={toId} size={44} square paused style={styles.thumb} />
          <Text numberOfLines={2} style={[styles.toName, dir.text, { color: c.textPrimary }]}>
            {name(toId)}
          </Text>
        </View>
      </View>
      <Text style={[styles.note, dir.text, { color: c.textSecondary }]}>{t('coach.swap.note')}</Text>
      {onApply && onKeep ? (
        <View style={styles.buttons}>
          <TouchableOpacity accessibilityRole="button" onPress={onKeep} style={[styles.keep, { backgroundColor: c.surfaceSecondary }]}>
            <Text style={[styles.keepText, { color: c.textPrimary }]}>{t('coach.swap.keep')}</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={onApply} style={[styles.apply, { backgroundColor: c.primaryLime }]}>
            <Text style={[styles.applyText, { color: c.limeText }]}>{t('coach.swap.apply')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { padding: 14, borderRadius: 22, borderWidth: 2, gap: 12, marginBottom: 12 },
  title: { fontSize: 15, fontWeight: '800' },
  change: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  side: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  thumb: { borderRadius: 10 },
  fromName: { flex: 1, fontSize: 12, fontWeight: '600', textDecorationLine: 'line-through' },
  toName: { flex: 1, fontSize: 12, fontWeight: '800' },
  flipped: { transform: [{ scaleX: -1 }] },
  note: { fontSize: 12 },
  buttons: { flexDirection: 'row', gap: 8 },
  keep: { flex: 1, minHeight: 46, borderRadius: commonRadii.pill, alignItems: 'center', justifyContent: 'center' },
  keepText: { fontSize: 14, fontWeight: '700' },
  apply: { flex: 1.4, minHeight: 46, borderRadius: commonRadii.pill, alignItems: 'center', justifyContent: 'center' },
  applyText: { fontSize: 14, fontWeight: '800' },
  notice: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 16, marginBottom: 12, alignItems: 'flex-start' },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '600' },
});
