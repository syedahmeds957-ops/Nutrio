import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';

interface PendingMealBarProps {
  count: number;
  kcal: number;
  onLog: () => void;
  onClear: () => void;
}

/**
 * The meal being built from "Add to meal" on the item screen. Shown on every menu that can open
 * that screen (the log hub and each restaurant or home-food menu), so a meal can be assembled
 * from any of them.
 */
export const PendingMealBar: React.FC<PendingMealBarProps> = ({ count, kcal, onLog, onClear }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dir = useTextDirection();
  if (count <= 0) return null;
  return (
    <View style={[styles.bar, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
      <View style={styles.text}>
        <Text style={[styles.title, dir.text, { color: theme.colors.textPrimary }]} numberOfLines={1}>
          {t('tracker.brandMenu.pendingSummary', { count, kcal })}
        </Text>
        <TouchableOpacity onPress={onClear} accessibilityRole="button" hitSlop={8}>
          <Text style={[styles.clear, { color: theme.colors.textSecondary }]}>{t('tracker.brandMenu.clearPending')}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.log, { backgroundColor: theme.colors.primaryLime }]}
        onPress={onLog}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        <Text style={[styles.logText, { color: theme.colors.limeText }]}>{t('tracker.brandMenu.logPending')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: '800' },
  clear: { fontSize: 13, fontWeight: '700' },
  log: { minHeight: 48, paddingHorizontal: 24, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  logText: { fontSize: 15, fontWeight: '800' },
});
