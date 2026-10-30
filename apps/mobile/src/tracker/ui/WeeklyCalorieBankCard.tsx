import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme, commonRadii } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { useFormat } from '../../i18n/useFormat.js';
import { Icon } from '../../ui/Icon.js';
import type { Weekday } from '@nutrio/workout-core';
import { weeklyCalorieBank } from '../calorieBank.js';
import { dayIndexInWeek, weekdaysFrom } from '../weekStrip.js';
import { localDateKey } from '../../common/dateKey.js';
import { useReducedMotion } from '../../ui/useReducedMotion.js';

export interface DayIntake {
  day: string;
  consumed: number;
  target: number;
  isLogged?: boolean;
  /** The day still in progress: drawn, but not banked until it ends. */
  isToday?: boolean;
}

interface WeeklyCalorieBankCardProps {
  dailyHistory?: DayIntake[];
  targetCalories?: number;
  /**
   * The week's first day (`weekStartFor(region)`): orders the day labels and,
   * with no history given, finds today. `dailyHistory` must be in the same order.
   * Monday by default.
   */
  weekStart?: Weekday;
}

// Pinned explicitly rather than left to the platform's default leading: the
// target guide is positioned off these, so a font-dependent line height would
// drift the line onto the day names on some devices.
const DAY_LABEL_LINE_HEIGHT = 14;
const BAR_LABEL_GAP = 6;

const BAR_MAX_HEIGHT = 68;
const BARS_ROW_HEIGHT = 94;

/** Width reserved on the left for the TARGET caption, so no bar sits under it. */
const TARGET_LABEL_GUTTER = 48;

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
  targetCalories = 1850,
  weekStart = 'mon',
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { formatNumber } = useFormat();
  const dir = useTextDirection();

  const animProgress = useRef(new Animated.Value(0)).current;

  // Derive dynamic history: if not provided, construct clean week where unlogged days have 0 consumed
  const dayKeys = weekdaysFrom(weekStart);
  const currentDayIdx = dayIndexInWeek(localDateKey(), weekStart);
  const history: DayIntake[] = dailyHistory && dailyHistory.length > 0
    ? dailyHistory
    : dayKeys.map((day, idx) => ({
        day,
        consumed: 0,
        target: targetCalories,
        isLogged: false,
        isToday: idx === currentDayIdx,
      }));

  const bank = weeklyCalorieBank(
    history.map((h) => ({ consumed: h.consumed, target: h.target, isLogged: !!h.isLogged, isToday: h.isToday }))
  );
  const balanceColor =
    bank.countedDays > 0 && bank.balanceKcal < 0 ? theme.colors.warning : theme.colors.primaryAccessible;
  const isLoggingToday = history.some((h) => h.isToday && h.consumed > 0);
  const balanceLabel =
    bank.countedDays === 0
      ? t('tracker.calorieBank.balanceNone')
      : bank.balanceKcal >= 0
      ? t('tracker.calorieBank.balanceUnder', { kcal: formatNumber(bank.balanceKcal) })
      : t('tracker.calorieBank.balanceOver', { kcal: formatNumber(-bank.balanceKcal) });
  const hint =
    bank.countedDays > 0
      ? bank.balanceKcal >= 0
        ? t('tracker.calorieBank.onTrackHint')
        : t('tracker.calorieBank.overHint')
      : isLoggingToday
      ? t('tracker.calorieBank.todayPendingHint')
      : t('tracker.calorieBank.emptyHint');

  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      animProgress.setValue(1);
      return;
    }
    Animated.timing(animProgress, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [animProgress, reduceMotion]);

  // Height of the day-label block under each bar (label line + gap), so the
  // absolutely-positioned target guide can be measured from the bar baseline
  // instead of the card's, which is what let it settle onto the day names.
  const DAY_LABEL_BLOCK = DAY_LABEL_LINE_HEIGHT + BAR_LABEL_GAP;

  const { hasTarget, maxBarKcal } = computeCalorieBankScale(targetCalories);
  const targetLineBottom = DAY_LABEL_BLOCK + TARGET_LINE_FRACTION * BAR_MAX_HEIGHT;

  const dayName = (idx: number) => t(`common.weekdayAbbrev.${dayKeys[idx]}`);
  // One spoken summary for the whole chart: the bars alone say nothing to a
  // screen reader. It starts with the visible title.
  const chartSummary = [
    t('tracker.calorieBank.title'),
    ...history.map((item, idx) =>
      item.consumed > 0
        ? t('tracker.calorieBank.dayLine', {
            day: dayName(idx),
            consumed: formatNumber(Math.round(item.consumed)),
            target: formatNumber(Math.round(item.target)),
          })
        : t('tracker.calorieBank.dayEmpty', { day: dayName(idx) })
    ),
  ].join(', ');

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
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text
            role="heading"
            aria-level={2}
            style={[styles.cardTitle, dir.text, { color: theme.colors.textPrimary }]}
          >
            {t('tracker.calorieBank.title')}
          </Text>
        </View>

        <View
          style={[
            styles.balancePill,
            { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
          ]}
        >
          <Icon name="zap" size={12} color={balanceColor} />
          <Text style={[styles.balanceText, dir.text, { color: balanceColor }]}>{balanceLabel}</Text>
        </View>
      </View>

      <Text style={[styles.hintText, dir.text, { color: theme.colors.textSecondary }]}>{hint}</Text>

      {/* 7-day mini bar chart, one summary for assistive tech. */}
      <View style={styles.chartContainer} role="img" aria-label={chartSummary}>
        {/* Caption gutter and plot are siblings, not padding, so the same layout mirrors in Arabic. */}
        <View style={styles.gutter}>
          {hasTarget ? (
            <Text
              numberOfLines={1}
              style={[styles.targetLineLabel, dir.text, { bottom: targetLineBottom - 7, color: theme.colors.textMuted }]}
            >
              {t('tracker.calorieBank.targetLabel')}
            </Text>
          ) : null}
        </View>
        <View style={styles.plot}>
        {hasTarget ? (
          <View style={[styles.targetDashedLine, { bottom: targetLineBottom, backgroundColor: theme.colors.border }]} />
        ) : null}

        <View style={styles.barsRow}>
          {history.map((item, idx) => {
            const isToday = item.isToday ?? (idx === currentDayIdx);
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
                    isToday && { borderColor: theme.colors.primaryAccessible, borderWidth: 1.5 },
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
                          ? theme.colors.warning
                          : theme.colors.primaryAccessible,
                      },
                    ]}
                  />
                </View>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                  style={[
                    styles.dayLabel,
                    { color: theme.colors.textMuted },
                    isToday && [styles.dayLabelToday, { color: theme.colors.primaryAccessible }],
                  ]}
                >
                  {dayName(idx)}
                </Text>
              </View>
            );
          })}
        </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Same shell as the other cards in the Today column: the column supplies the gutters.
  card: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: 8,
    rowGap: 8,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
    minWidth: 0,
  },
  cardTitle: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
    minHeight: 28,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: commonRadii.pill,
    borderWidth: 1,
  },
  balanceText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  hintText: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 17,
  },
  chartContainer: {
    flexDirection: 'row',
    paddingTop: 10,
  },
  gutter: {
    width: TARGET_LABEL_GUTTER,
    height: BARS_ROW_HEIGHT,
  },
  plot: {
    flex: 1,
    position: 'relative',
  },
  // Painted before the bars, so they cover it: a reference line, not a strike-through.
  targetDashedLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  targetLineLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: BARS_ROW_HEIGHT,
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
    fontSize: 12,
    lineHeight: DAY_LABEL_LINE_HEIGHT,
    fontWeight: '600',
  },
  dayLabelToday: {
    fontWeight: '800',
  },
});
