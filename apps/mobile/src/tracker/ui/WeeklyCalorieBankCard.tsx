import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../../theme.js';
import { Icon } from '../../ui/Icon.js';

export interface DayIntake {
  day: string;
  consumed: number;
  target: number;
}

interface WeeklyCalorieBankCardProps {
  dailyHistory?: DayIntake[];
  weeklyDeficitKcal?: number;
  targetCalories?: number;
}

const DEFAULT_HISTORY: DayIntake[] = [
  { day: 'Mon', consumed: 1720, target: 1850 },
  { day: 'Tue', consumed: 1780, target: 1850 },
  { day: 'Wed', consumed: 1690, target: 1850 },
  { day: 'Thu', consumed: 1820, target: 1850 },
  { day: 'Fri', consumed: 1750, target: 1850 },
  { day: 'Sat', consumed: 2120, target: 1850 }, // Dawat / Shaadi meal
  { day: 'Sun', consumed: 1200, target: 1850 }, // Today
];

export const WeeklyCalorieBankCard: React.FC<WeeklyCalorieBankCardProps> = ({
  dailyHistory = DEFAULT_HISTORY,
  weeklyDeficitKcal = 2450,
  targetCalories = 1850,
}) => {
  const { theme, isDark } = useTheme();
  const animProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animProgress, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [animProgress]);

  // Max value for bar heights (e.g. 2500)
  const maxBarKcal = 2500;
  const BAR_MAX_HEIGHT = 68;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {/* Card Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: theme.colors.surfaceSecondary },
            ]}
          >
            <Icon name="calendar" size={14} color={theme.colors.primaryLime} />
          </View>
          <View>
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
              Weekly Calorie Bank
            </Text>
            <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
              Rolling Energy Balance
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.deficitPill,
            {
              backgroundColor: theme.colors.surfaceSecondary,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Icon name="zap" size={12} color={theme.colors.primaryLime} />
          <Text style={[styles.deficitText, { color: theme.colors.primaryLime }]}>
            -{weeklyDeficitKcal.toLocaleString()} kcal
          </Text>
        </View>
      </View>

      {/* Reassurance Message */}
      <Text style={[styles.reassuranceText, { color: theme.colors.textMuted }]}>
        On track for ~0.5 kg fat loss this week. Even with higher weekend meals, your weekly balance protects your progress.
      </Text>

      {/* 7-Day Mini Bar Chart */}
      <View style={styles.chartContainer}>
        {/* Target Line Guide */}
        <View
          style={[
            styles.targetLine,
            { bottom: (targetCalories / maxBarKcal) * BAR_MAX_HEIGHT + 24 },
          ]}
        >
          <View style={[styles.targetDashedLine, { backgroundColor: theme.colors.border }]} />
          <Text style={[styles.targetLineLabel, { color: theme.colors.textMuted }]}>
            Target
          </Text>
        </View>

        <View style={styles.barsRow}>
          {dailyHistory.map((item, idx) => {
            const isToday = idx === dailyHistory.length - 1;
            const isOver = item.consumed > item.target;
            const barHeightPct = Math.min(1, item.consumed / maxBarKcal);
            const heightValue = animProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, barHeightPct * BAR_MAX_HEIGHT],
            });

            return (
              <View key={idx} style={styles.barCol}>
                <View
                  style={[
                    styles.barTrack,
                    { backgroundColor: theme.colors.surfaceSecondary },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.barFill,
                      {
                        height: heightValue,
                        backgroundColor: isToday
                          ? theme.colors.primaryLime
                          : isOver
                          ? '#F59E0B'
                          : isDark
                          ? '#3B82F6'
                          : theme.colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.dayLabel,
                    { color: theme.colors.textMuted },
                    isToday && [styles.dayLabelToday, { color: theme.colors.primaryLime }],
                  ]}
                >
                  {item.day}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  deficitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
    borderWidth: 1,
  },
  deficitText: {
    fontSize: 11,
    fontWeight: '800',
  },
  reassuranceText: {
    fontSize: 11,
    marginBottom: 16,
    lineHeight: 16,
  },
  chartContainer: {
    position: 'relative',
    paddingTop: 10,
  },
  targetLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  targetDashedLine: {
    flex: 1,
    height: 1,
  },
  targetLineLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 94,
    paddingHorizontal: 8,
  },
  barCol: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  barTrack: {
    width: 14,
    height: 68,
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  dayLabelToday: {
    fontWeight: '800',
  },
});
