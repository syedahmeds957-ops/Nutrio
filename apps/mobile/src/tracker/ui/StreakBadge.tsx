import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../../theme.js';
import { Icon } from '../../ui/Icon.js';

interface StreakBadgeProps {
  streakDays?: number;
  consistencyPct?: number;
  completedDays?: number[]; // indices 0 to 6 (Mon to Sun)
  currentDayIndex?: number;  // 0 to 6
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const StreakBadge: React.FC<StreakBadgeProps> = ({
  streakDays = 7,
  consistencyPct = 94,
  completedDays = [0, 1, 2, 3, 4, 5],
  currentDayIndex = 6,
}) => {
  const { theme, isDark } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [pulseAnim]);

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
      {/* Left: Streak Info with Pulsing Flame */}
      <View style={styles.streakCol}>
        <View style={styles.flameRow}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <View
              style={[
                styles.flameCircle,
                { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2' },
              ]}
            >
              <Icon name="flame" size={16} color="#EF4444" />
            </View>
          </Animated.View>
          <View>
            <Text style={[styles.streakNumber, { color: theme.colors.textPrimary }]}>
              {streakDays} Day Streak
            </Text>
            <Text style={[styles.consistencyText, { color: theme.colors.primaryLime }]}>
              {consistencyPct}% Weekly Adherence
            </Text>
          </View>
        </View>
      </View>

      {/* Right: 7-Day Micro Dot Tracker */}
      <View style={styles.dotsRow}>
        {DAY_LABELS.map((label, idx) => {
          const isDone = completedDays.includes(idx);
          const isToday = idx === currentDayIndex;

          return (
            <View key={idx} style={styles.dayCol}>
              <Text
                style={[
                  styles.dayLabel,
                  { color: theme.colors.textMuted },
                  isToday && [styles.dayLabelToday, { color: theme.colors.primaryLime }],
                ]}
              >
                {label}
              </Text>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: theme.colors.surfaceSecondary,
                    borderColor: theme.colors.border,
                  },
                  isDone && [
                    styles.dotDone,
                    {
                      backgroundColor: theme.colors.primaryLime,
                      borderColor: theme.colors.primaryLime,
                    },
                  ],
                  isToday && !isDone && [
                    styles.dotToday,
                    {
                      borderColor: theme.colors.primaryLime,
                      backgroundColor: isDark ? 'rgba(212, 255, 0, 0.15)' : '#F7FEE7',
                    },
                  ],
                ]}
              >
                {isDone && <Icon name="check" size={10} color="#0A0B0D" />}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  streakCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flameCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakNumber: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  consistencyText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayCol: {
    alignItems: 'center',
    gap: 4,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  dayLabelToday: {
    fontWeight: '800',
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dotDone: {
    borderWidth: 1,
  },
  dotToday: {
    borderWidth: 2,
  },
});
