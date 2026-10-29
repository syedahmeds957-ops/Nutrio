import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../../theme.js';
import { Icon } from '../../ui/Icon.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import type { Weekday } from '@nutrio/workout-core';
import type { LoggingStreak } from '../streak.js';
import { weekdaysFrom } from '../weekStrip.js';

// Computed by computeLoggingStreak; no defaults, so it can never show a streak
// the user did not earn.
type StreakBadgeProps = LoggingStreak & {
  /** The week's first day, the same one passed to computeLoggingStreak. Monday by default. */
  weekStart?: Weekday;
  /** Also draw the seven day dots. Off by default: the weekly bank card already shows the week. */
  showWeek?: boolean;
};

export const StreakBadge: React.FC<StreakBadgeProps> = ({
  streakDays,
  consistencyPct,
  completedDays,
  currentDayIndex,
  weekStart = 'mon',
  showWeek = false,
}) => {
  const { theme } = useTheme();
  const dir = useTextDirection();
  const { t } = useTranslation();

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
      {/* Streak info */}
      <View style={styles.streakCol}>
        <View style={styles.flameRow}>
          <View style={[styles.flameCircle, { backgroundColor: theme.colors.dangerLight }]}>
            <Icon name="flame" size={16} color={theme.colors.danger} />
          </View>
          <View style={styles.streakText}>
            <Text style={[styles.streakNumber, dir.text, { color: theme.colors.textPrimary }]}>
              {t('tracker.streak.days', { count: streakDays })}
            </Text>
            <Text style={[styles.consistencyText, dir.text, { color: theme.colors.primaryAccessible }]}>
              {t('tracker.streak.weekly', { pct: consistencyPct })}
            </Text>
          </View>
        </View>
      </View>

      {/* 7-day dot tracker */}
      {showWeek ? (
      <View style={styles.dotsRow}>
        {weekdaysFrom(weekStart).map((dayKey, idx) => {
          const isDone = completedDays.includes(idx);
          const isToday = idx === currentDayIndex;

          return (
            <View key={idx} style={styles.dayCol}>
              <Text
                style={[
                  styles.dayLabel,
                  { color: theme.colors.textMuted },
                  isToday && [styles.dayLabelToday, { color: theme.colors.primaryAccessible }],
                ]}
              >
                {t(`common.weekdayShort.${dayKey}`)}
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
                      backgroundColor: theme.colors.primaryLight,
                    },
                  ],
                ]}
              >
                {isDone && <Icon name="check" size={10} color={theme.colors.limeText} />}
              </View>
            </View>
          );
        })}
      </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 12,
    gap: 12,
    borderWidth: 1,
  },
  streakCol: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 34,
  },
  flameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
    minWidth: 0,
  },
  flameCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakText: {
    flexShrink: 1,
    minWidth: 0,
  },
  streakNumber: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  consistencyText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  // Its own line: beside the streak text the seven dots overflowed a 390 px phone.
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
    gap: 4,
  },
  dayLabel: {
    fontSize: 11,
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
