import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { useFormat } from '../../i18n/useFormat.js';
import { Icon } from '../../ui/Icon.js';
import type { TargetUpdateProposal } from '../calorieLink.js';

interface TargetUpdateSheetProps {
  proposal: TargetUpdateProposal | null;
  onUpdate: () => void;
  onNotNow: () => void;
}

/** "Update your daily target?": offered after a saved workout plan changes the training the target counts. Never applied without a tap. */
export const TargetUpdateSheet: React.FC<TargetUpdateSheetProps> = ({ proposal, onUpdate, onNotNow }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <Modal visible={Boolean(proposal)} transparent animationType="slide" onRequestClose={onNotNow}>
      <Pressable
        accessibilityLabel={t('workout.calories.notNow')}
        onPress={onNotNow}
        style={[styles.backdrop, { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.62)' : 'rgba(15,23,42,0.45)' }]}
      />
      {proposal ? <TargetUpdateSheetBody proposal={proposal} onUpdate={onUpdate} onNotNow={onNotNow} /> : null}
    </Modal>
  );
};

/** The sheet itself, apart from the Modal, so it can be rendered on its own. */
export const TargetUpdateSheetBody: React.FC<TargetUpdateSheetProps & { proposal: TargetUpdateProposal }> = ({
  proposal,
  onUpdate,
  onNotNow,
}) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const { formatNumber } = useFormat();
  const dir = useTextDirection();

  const { currentKcal, proposedKcal, dailyTrainingKcal } = proposal;
  const from = formatNumber(currentKcal);
  const to = formatNumber(proposedKcal);
  const body =
    dailyTrainingKcal > 0
      ? t('workout.calories.bodyUp', { count: dailyTrainingKcal })
      : t('workout.calories.bodyDown', { count: -dailyTrainingKcal });

  return (
    <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: c.surface }]}>
      <View style={[styles.handle, { backgroundColor: c.border }]} />
      <View style={[styles.iconBox, { backgroundColor: c.primaryLight }]}>
        <Icon name="flame" size={24} color={c.primaryTintText} />
      </View>
      <Text accessibilityRole="header" style={[styles.title, dir.text, { color: c.textPrimary }]}>
        {t('workout.calories.title')}
      </Text>
      <Text style={[styles.body, dir.text, { color: c.textSecondary }]}>{body}</Text>

      <View
        accessible
        accessibilityLabel={t('workout.calories.change', { from, to })}
        style={[styles.change, { backgroundColor: c.surfaceSecondary }]}
      >
        <Text style={[styles.from, { color: c.textSecondary }]}>{from}</Text>
        <Icon name="arrow-right" size={20} color={c.textPrimary} strokeWidth={2.2} style={dir.isRTL ? styles.flipped : undefined} />
        <Text style={[styles.to, { color: c.textPrimary }]}>{to}</Text>
        <Text style={[styles.unit, { color: c.textSecondary }]}>{t('workout.calories.kcalDay')}</Text>
      </View>
      <Text style={[styles.later, dir.text, { color: c.textSecondary }]}>{t('workout.calories.later')}</Text>

      <View style={styles.buttons}>
        <TouchableOpacity accessibilityRole="button" onPress={onNotNow} style={[styles.notNow, { backgroundColor: c.surfaceSecondary }]}>
          <Text style={[styles.notNowText, { color: c.textPrimary }]}>{t('workout.calories.notNow')}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" onPress={onUpdate} style={[styles.update, { backgroundColor: c.primaryLime }]}>
          <Text style={[styles.updateText, { color: c.limeText }]}>{t('workout.calories.update')}</Text>
        </TouchableOpacity>
      </View>
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
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
    gap: 12,
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 999 },
  iconBox: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  body: { fontSize: 14, lineHeight: 21 },
  change: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 14, borderRadius: 18 },
  from: { fontSize: 20, fontWeight: '700', textDecorationLine: 'line-through', fontVariant: ['tabular-nums'] },
  to: { fontSize: 26, fontWeight: '800', fontVariant: ['tabular-nums'] },
  unit: { fontSize: 13, fontWeight: '700' },
  flipped: { transform: [{ scaleX: -1 }] },
  later: { fontSize: 12 },
  buttons: { flexDirection: 'row', gap: 8 },
  notNow: { flex: 1, minHeight: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  notNowText: { fontSize: 14, fontWeight: '700' },
  update: { flex: 1.4, minHeight: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  updateText: { fontSize: 14, fontWeight: '800' },
});
