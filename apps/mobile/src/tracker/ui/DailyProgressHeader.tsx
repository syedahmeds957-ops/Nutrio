import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DailyTrackerSummary } from '../types.js';
import { useTheme } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { useFormat } from '../../i18n/useFormat.js';
import type { Weekday } from '@nutrio/workout-core';
import { localDateKey } from '../../common/dateKey.js';
import { MONDAY_FIRST_WEEKDAYS, dayIndexInWeek } from '../weekStrip.js';

interface DailyProgressHeaderProps {
  summary: DailyTrackerSummary;
  /** Fill 0-1 of each day, in the same order as `weekdays`. */
  weeklyHistoryFills?: number[];
  /** The week's days in display order (`weekStripFor`); Monday first by default. */
  weekdays?: readonly Weekday[];
  /** Today's position in `weekdays`; by default found from the device's date. */
  todayIndex?: number;
  /**
   * Nothing logged today or earlier this week. The macro tiles would read 0 of
   * everything, so one card shows the targets instead, and earlier days are
   * not marked as missed (the user was not here yet).
   */
  firstDay?: boolean;
}

interface MacroTileProps {
  label: string;
  value: number;
  unit: string;
  /** 0 means no target is set yet; the tile then shows the fallback line and no goal. */
  goal: number;
  color: string;
  overKey: string;
  fallback: string;
}

/**
 * One macro tile: the label, "eaten / goal unit" once, and a progress bar
 * whose empty track is tinted in the macro's colour. The only extra line is
 * the warning when you are over the goal (under it, the bar says it).
 */
const MacroTile: React.FC<MacroTileProps> = ({
  label,
  value,
  unit,
  goal,
  color,
  overKey,
  fallback,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { formatNumber } = useFormat();
  const dir = useTextDirection();
  const eaten = Math.round(value);
  const hasGoal = goal > 0;
  const diff = Math.round(goal) - eaten;
  const isOver = hasGoal && diff < 0;
  const pct = hasGoal ? Math.min(100, Math.max(0, (eaten / goal) * 100)) : eaten > 0 ? 100 : 0;

  return (
    <View
      style={[
        styles.metricTile,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <Text style={[styles.tileLabel, dir.text, { color: theme.colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.tileValue, dir.text, { color: theme.colors.textPrimary }]} numberOfLines={1}>
        {formatNumber(eaten)}
        {hasGoal && (
          <Text style={[styles.tileGoal, { color: theme.colors.textMuted }]}>
            {` / ${formatNumber(Math.round(goal))}`}
          </Text>
        )}
        <Text style={[styles.tileUnit, { color: theme.colors.textSecondary }]}>{` ${unit}`}</Text>
      </Text>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
        style={[styles.tileProgressTrack, { backgroundColor: `${color}33` }]}
      >
        <View style={[styles.tileProgressFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      {(isOver || !hasGoal) && (
        <Text
          style={[styles.tileSub, { color: isOver ? theme.colors.danger : theme.colors.textMuted }]}
        >
          {isOver ? t(overKey, { value: formatNumber(Math.abs(diff)) }) : fallback}
        </Text>
      )}
    </View>
  );
};

/**
 * Size for the big calorie number, by its length. The number used to shrink
 * itself with adjustsFontSizeToFit, which on iOS shrank it to a few points in
 * right-to-left layouts; fixed steps keep it the same in both directions.
 */
export function heroSize(text: string): { fontSize: number; lineHeight: number } {
  const fontSize = text.length <= 5 ? 48 : text.length <= 6 ? 40 : 32;
  return { fontSize, lineHeight: Math.round(fontSize * 1.08) };
}

export const DailyProgressHeader: React.FC<DailyProgressHeaderProps> = ({
  summary,
  weeklyHistoryFills,
  weekdays = MONDAY_FIRST_WEEKDAYS,
  todayIndex,
  firstDay = false,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { formatNumber } = useFormat();
  const dir = useTextDirection();
  const heroBg = theme.colors.heroCardBg;
  const heroBorder = theme.colors.heroCardBg;
  const heroTextColor = theme.colors.limeText;
  const heroSubTextColor = theme.colors.limeText;

  const {
    targetCalories,
    totalCaloriesConsumed,
    remainingCalories,
    targetProteinGrams,
    totalProteinConsumed,
    targetFatGrams,
    totalFatConsumed,
    targetCarbGrams,
    totalCarbConsumed,
  } = summary;

  const heroNumber = formatNumber(targetCalories > 0 ? Math.abs(remainingCalories) : Math.round(totalCaloriesConsumed));

  const totalTarget = Math.max(1, targetCalories);
  const calRatio = Math.min(1, Math.max(0, totalCaloriesConsumed / totalTarget));


  // Today's position in the strip (0 = the week's first day).
  const currentDayOfWeek = todayIndex ?? dayIndexInWeek(localDateKey(), weekdays[0]);

  return (
    <View style={styles.container}>
      {/* The offline-sync count lives in the Today screen's header badge. */}
      {/* 1. Solid Electric Lime Hero Card (Nutrio Signature Palette) */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: heroBg,
            borderColor: heroBorder,
          },
        ]}
      >
        <View style={styles.heroTopRow}>
          <View style={styles.heroCategoryPill}>
            <Text style={styles.heroCategoryText}>
              {t('tracker.header.energyBudget')}
            </Text>
          </View>
        </View>

        <View style={styles.heroBodyRow}>
          {/* Main Calorie Numbers */}
          <View style={styles.heroNumbersCol}>
            <Text
              style={[styles.heroValue, heroSize(heroNumber), { color: heroTextColor }]}
              numberOfLines={1}
            >
              {heroNumber}
            </Text>
            <Text style={[styles.heroLabel, { color: heroTextColor }]}>
              {targetCalories > 0
                ? remainingCalories < 0
                  ? t('tracker.header.caloriesOver')
                  : t('tracker.header.caloriesRemaining')
                : t('tracker.header.caloriesConsumed')}
            </Text>
            <Text style={[styles.heroTargetSub, { color: heroSubTextColor }]}>
              {targetCalories > 0
                ? t('tracker.header.eatenSoFar', {
                    eaten: formatNumber(Math.round(totalCaloriesConsumed)),
                  })
                : t('tracker.header.noTargetHint')}
            </Text>
          </View>

          {/* 7-Day Vertical Pill Intake Chart (Clean Slate: No fake history for new users) */}
          <View style={styles.weekPillChart}>
            {weekdays.map((dayKey, idx) => {
              const isToday = idx === currentDayOfWeek;
              // If weeklyHistoryFills is provided, use it; otherwise only today fills based on real intake
              const dayFillPct = isToday
                ? calRatio
                : (weeklyHistoryFills && weeklyHistoryFills[idx] !== undefined)
                ? weeklyHistoryFills[idx]
                : 0; // 0 for unlogged days
              const hasIntake = dayFillPct > 0;
              const isFuture = idx > currentDayOfWeek;
              const isMissed = !firstDay && idx < currentDayOfWeek && !hasIntake;

              return (
                <View
                  key={idx}
                  style={styles.weekDayCol}
                  accessible
                  accessibilityLabel={t('tracker.header.weekBar', {
                    day: t(`common.weekdayShort.${dayKey}`),
                    percent: Math.round(dayFillPct * 100),
                  })}
                >
                  <View
                    style={[
                      styles.pillTrack,
                      isToday && styles.pillTrackToday,
                      isFuture && styles.pillTrackFuture,
                    ]}
                  >
                    {isMissed && <View style={styles.pillMissedDot} />}
                    {hasIntake && (
                      <View
                        style={[
                          styles.pillFill,
                          {
                            height: `${Math.max(12, Math.round(dayFillPct * 100))}%`,
                            backgroundColor: isToday
                              ? '#0A0B0D'
                              : 'rgba(10, 11, 13, 0.55)',
                          },
                        ]}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.weekDayLabel,
                      isToday && styles.weekDayLabelActive,
                      isFuture && styles.weekDayLabelFuture,
                    ]}
                  >
                    {t(`common.weekdayShort.${dayKey}`)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* 2. Macro row (Protein, Carbs, Fat). Calories live in the hero above. */}
      {firstDay ? (
        <View
          style={[
            styles.targetsCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.tileLabel, dir.text, { color: theme.colors.textSecondary }]}>
            {t('tracker.header.dailyTargets')}
          </Text>
          <View style={styles.targetsRow}>
            {[
              { label: t('common.protein'), grams: targetProteinGrams, color: theme.colors.protein },
              { label: t('common.carbs'), grams: targetCarbGrams, color: theme.colors.carbs },
              { label: t('common.fat'), grams: targetFatGrams, color: theme.colors.fat },
            ].map((macro) => (
              <View key={macro.label} style={styles.targetCol}>
                <Text style={[styles.targetValue, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                  {formatNumber(Math.round(macro.grams))}
                  <Text style={[styles.tileUnit, { color: theme.colors.textSecondary }]}>{` ${t('common.gramsUnit')}`}</Text>
                </Text>
                <View style={[styles.targetBar, { backgroundColor: macro.color }]} />
                <Text style={[styles.targetLabel, dir.text, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {macro.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
      <View style={styles.metricGrid}>
        <MacroTile
          label={t('common.protein')}
          value={totalProteinConsumed}
          unit={t('common.gramsUnit')}
          goal={targetProteinGrams}
          color={theme.colors.protein}
          overKey="tracker.header.gramsOver"
          fallback={t('tracker.header.consumedToday')}
        />
        <MacroTile
          label={t('common.carbs')}
          value={totalCarbConsumed}
          unit={t('common.gramsUnit')}
          goal={targetCarbGrams}
          color={theme.colors.carbs}
          overKey="tracker.header.gramsOver"
          fallback={t('tracker.header.consumedToday')}
        />
        <MacroTile
          label={t('common.fat')}
          value={totalFatConsumed}
          unit={t('common.gramsUnit')}
          goal={targetFatGrams}
          color={theme.colors.fat}
          overKey="tracker.header.gramsOver"
          fallback={t('tracker.header.consumedToday')}
        />
      </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  targetsCard: { borderRadius: 20, borderWidth: 1, padding: 14, gap: 10 },
  targetsRow: { flexDirection: 'row', gap: 12 },
  targetCol: { flex: 1, minWidth: 0, gap: 6 },
  targetValue: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3, fontVariant: ['tabular-nums'] },
  targetBar: { height: 4, borderRadius: 2, width: '100%' },
  targetLabel: { fontSize: 12, fontWeight: '600' },
  container: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  syncBadgePending: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 9999,
  },
  syncBadgePendingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroCard: {
    borderRadius: 26,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroCategoryPill: {
    backgroundColor: '#0A0B0D',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  heroCategoryText: {
    color: '#A4EB3F',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  heroBodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // Stretch, so the week bars span the same height as the calorie text beside them.
    alignItems: 'stretch',
    gap: 16,
  },
  heroNumbersCol: {
    flex: 1,
    minWidth: 0,
  },
  heroValue: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1.2,
    lineHeight: 52,
    fontVariant: ['tabular-nums'],
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  heroTargetSub: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.8,
    marginTop: 6,
  },
  weekPillChart: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 7,
  },
  weekDayCol: {
    alignItems: 'center',
    gap: 4,
  },
  pillTrack: {
    width: 16,
    flex: 1,
    minHeight: 60,
    // A pale, outlined vessel: the dark fill is what shows intake, so an empty
    // day must not look half-full.
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(10, 11, 13, 0.35)',
    borderRadius: 9999,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
  },
  // Days still to come are dimmed; a past day with nothing logged keeps a full
  // track with a small dot, so "missed" and "not yet" read differently.
  pillTrackFuture: {
    opacity: 0.45,
  },
  pillMissedDot: {
    width: 5,
    height: 5,
    borderRadius: 9999,
    marginBottom: 4,
    backgroundColor: 'rgba(10, 11, 13, 0.4)',
  },
  // Today's vessel is outlined harder, so the current day reads at a glance.
  pillTrackToday: {
    borderColor: 'rgba(10, 11, 13, 0.75)',
    borderWidth: 1.5,
  },
  pillFill: {
    width: '100%',
    borderRadius: 9999,
  },
  weekDayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0A0B0D',
    opacity: 0.75,
    fontVariant: ['tabular-nums'],
  },
  weekDayLabelFuture: {
    opacity: 0.5,
  },
  weekDayLabelActive: {
    opacity: 1,
    fontWeight: '900',
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricTile: {
    flex: 1,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  tileValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
    marginBottom: 8,
  },
  tileGoal: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0,
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  tileProgressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  tileProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  tileUnit: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
  },
  tileSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
});
