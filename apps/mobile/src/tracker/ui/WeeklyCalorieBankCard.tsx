import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { Icon } from '../../ui/Icon.js';

export interface DayIntake {
  day: string;
  consumed: number;
  target: number;
  isLogged?: boolean;
}

interface WeeklyCalorieBankCardProps {
  dailyHistory?: DayIntake[];
  weeklyDeficitKcal?: number;
  targetCalories?: number;
}

const WEEK_DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Pinned explicitly rather than left to the platform's default leading: the
// target guide is positioned off these, so a font-dependent line height would
// drift the line onto the day names on some devices.
const DAY_LABEL_LINE_HEIGHT = 14;
const BAR_LABEL_GAP = 6;

const BAR_MAX_HEIGHT = 68;

/** Width reserved on the left for the TARGET caption, so no bar sits under it. */
const TARGET_LABEL_GUTTER = 42;

/**
 * Where the target line sits inside the plot, as a fraction of bar height.
 *
 * Fixed rather than derived from the calorie figure, so the guide reads the
 * same whether someone's target is 1,500 or 2,800, and so there is always
 * headroom above it for a day that went over.
 */
const TARGET_LINE_FRACTION = 0.7;

/** Fallback ceiling when there is no target to scale against. */
const FALLBACK_MAX_BAR_KCAL = 2500;

/**
 * Scales the chart to the user's own target instead of a fixed ceiling.
 *
 * The ceiling used to be a hardcoded 2,500 for everyone. That put a 2,341 kcal
 * target at 94% of the plot — a line pinned to the top edge, reading as a
 * border rather than a guide — and it flattened every day above 2,500 to the
 * same full-height bar, hiding an overshoot at exactly the moment it mattered.
 *
 * Deriving the ceiling from the target instead fixes both: the line lands at a
 * consistent, readable height, and a day can run ~43% over target before it
 * clips.
 */
export function computeCalorieBankScale(targetCalories: number): {
  hasTarget: boolean;
  maxBarKcal: number;
} {
  // A target of 0 (no plan yet) has no meaningful line to draw — rendering it
  // anyway pinned the guide to the baseline, right on top of "Mon Tue Wed…".
  const hasTarget = targetCalories > 0;
  return {
    hasTarget,
    maxBarKcal: hasTarget ? targetCalories / TARGET_LINE_FRACTION : FALLBACK_MAX_BAR_KCAL,
  };
}

export const WeeklyCalorieBankCard: React.FC<WeeklyCalorieBankCardProps> = ({
  dailyHistory,
  weeklyDeficitKcal,
  targetCalories = 1850,
}) => {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const dir = useTextDirection();
  const accentColor = theme.colors.primaryLime;
  const accentBg = theme.colors.surfaceSecondary;

  const animProgress = useRef(new Animated.Value(0)).current;

  // Derive dynamic history: if not provided, construct clean week where unlogged days have 0 consumed
  const currentDayIdx = (new Date().getDay() + 6) % 7;
  const history: DayIntake[] = dailyHistory && dailyHistory.length > 0
    ? dailyHistory
    : WEEK_DAY_LABELS.map((day, idx) => ({
        day,
        consumed: 0,
        target: targetCalories,
        isLogged: idx === currentDayIdx,
      }));

  const hasLoggedDays = history.some((h) => (h.consumed > 0) || h.isLogged);
  const totalConsumed = history.reduce((sum, h) => sum + h.consumed, 0);
  const totalTarget = history.filter((h) => h.consumed > 0 || h.isLogged).reduce((sum, h) => sum + h.target, 0);
  const computedDeficit = weeklyDeficitKcal !== undefined
    ? weeklyDeficitKcal
    : Math.max(0, totalTarget - totalConsumed);

  useEffect(() => {
    Animated.timing(animProgress, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [animProgress]);

  // Height of the day-label block under each bar (label line + gap), so the
  // absolutely-positioned target guide can be measured from the bar baseline
  // instead of the card's, which is what let it settle onto the day names.
  const DAY_LABEL_BLOCK = DAY_LABEL_LINE_HEIGHT + BAR_LABEL_GAP;

  const { hasTarget, maxBarKcal } = computeCalorieBankScale(targetCalories);
  const targetLineBottom = DAY_LABEL_BLOCK + TARGET_LINE_FRACTION * BAR_MAX_HEIGHT;

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
              { backgroundColor: accentBg },
            ]}
          >
            <Icon name="calendar" size={14} color={accentColor} />
          </View>
          <View>
            <Text style={[styles.cardTitle, dir.text, { color: theme.colors.textPrimary }]}>
              {t('tracker.calorieBank.title')}
            </Text>
            <Text style={[styles.cardSubtitle, dir.text, { color: theme.colors.textSecondary }]}>
              {t('tracker.calorieBank.subtitle')}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.deficitPill,
            {
              backgroundColor: accentBg,
              borderColor: isDark ? theme.colors.border : accentColor,
            },
          ]}
        >
          <Icon name="zap" size={12} color={accentColor} />
          <Text style={[styles.deficitText, { color: accentColor }]}>
            {computedDeficit > 0 ? `-${computedDeficit.toLocaleString()} kcal` : `0 kcal bank`}
          </Text>
        </View>
      </View>

      {/* Reassurance Message */}
      <Text style={[styles.reassuranceText, dir.text, { color: theme.colors.textMuted }]}>
        {!hasLoggedDays || totalConsumed === 0
          ? t('tracker.calorieBank.emptyHint')
          : t('tracker.calorieBank.onTrackHint')}
      </Text>

      {/* 7-Day Mini Bar Chart */}
      <View style={styles.chartContainer}>
        {/* Target Line Guide */}
        {hasTarget ? (
          <View style={[styles.targetLine, { bottom: targetLineBottom }]}>
            <Text style={[styles.targetLineLabel, { color: theme.colors.textMuted }]}>
              {t('tracker.calorieBank.targetLabel')}
            </Text>
            <View style={[styles.targetDashedLine, { backgroundColor: theme.colors.border }]} />
          </View>
        ) : null}

        <View style={styles.barsRow}>
          {history.map((item, idx) => {
            const isToday = item.isLogged ?? (idx === currentDayIdx);
            const isOver = item.consumed > item.target;
            const barHeightPct = item.consumed > 0 ? Math.min(1, item.consumed / maxBarKcal) : 0;
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
                    isToday && { borderColor: accentColor, borderWidth: 1 },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.barFill,
                      {
                        height: heightValue,
                        backgroundColor: isToday
                          ? accentColor
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
                    isToday && [styles.dayLabelToday, { color: accentColor }],
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
    // No zIndex on purpose. It is declared before barsRow, so it paints
    // underneath and the bars occlude it, which is how a reference line should
    // read. On top it looked like a line scribbled across the chart.
  },
  targetDashedLine: {
    flex: 1,
    height: 1,
  },
  targetLineLabel: {
    width: TARGET_LABEL_GUTTER,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 94,
    // Left gutter matches the caption's width so no bar sits under "TARGET".
    // The caption used to start at x=0, right on top of Monday's bar.
    paddingLeft: TARGET_LABEL_GUTTER,
    paddingRight: 8,
  },
  barCol: {
    alignItems: 'center',
    gap: BAR_LABEL_GAP,
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
    lineHeight: DAY_LABEL_LINE_HEIGHT,
    fontWeight: '600',
  },
  dayLabelToday: {
    fontWeight: '800',
  },
});
