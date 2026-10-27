import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme.js';
import { useTranslation } from '../../i18n/index.js';
import { Icon } from '../../ui/Icon.js';
import { HapticFeedback } from '../../ui/haptics.js';

interface TodayBottomBarProps {
  /** Distance from the screen's bottom edge, including the safe area. */
  bottom: number;
  onOpenDiary: () => void;
  onQuickLog: () => void;
  onOpenCoach: () => void;
}

/**
 * The floating black capsule: Diary, a lime Quick log in the middle, Coach.
 * There is no Today tab: Today is the screen under it, and Diary and Coach
 * each have a back arrow that returns here.
 */
export const TodayBottomBar: React.FC<TodayBottomBarProps> = ({ bottom, onOpenDiary, onQuickLog, onOpenCoach }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();

  const item = (icon: 'clipboard' | 'coach', label: string, onPress: () => void) => (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.7}
      onPress={() => {
        HapticFeedback.selection();
        onPress();
      }}
      style={styles.item}
    >
      <Icon name={icon} size={20} color={c.floatingBarInactive} />
      <Text style={[styles.itemText, { color: c.floatingBarInactive }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.bar, { backgroundColor: c.floatingBarBg, borderColor: c.border, bottom }]}>
      {item('clipboard', t('tracker.dashboard.diary'), onOpenDiary)}
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.8}
        onPress={() => {
          HapticFeedback.impactMedium();
          onQuickLog();
        }}
        style={[styles.quickLog, { backgroundColor: c.primaryLime }]}
      >
        <Icon name="plus" size={16} color={c.limeText} strokeWidth={2.8} />
        <Text style={[styles.quickLogText, { color: c.limeText }]} numberOfLines={1}>
          {t('tracker.dashboard.logMeal')}
        </Text>
      </TouchableOpacity>
      {item('coach', t('tracker.dashboard.nav.coach'), onOpenCoach)}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    alignSelf: 'center',
    width: '92%',
    maxWidth: 440,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.35)',
  },
  item: { minHeight: 44, minWidth: 56, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  itemText: { fontSize: 11, fontWeight: '700', marginTop: 3 },
  quickLog: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderRadius: 9999,
    gap: 6,
  },
  quickLogText: { fontSize: 14, fontWeight: '800' },
});
