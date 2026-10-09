import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DailyTrackerSummary } from '../types.js';
import { Notice } from '../../ui/Notice.js';
import { useTheme } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';

interface DailyProgressHeaderProps {
  summary: DailyTrackerSummary;
  weeklyHistoryFills?: number[]; // Optional array of fills 0-1 for [M, T, W, T, F, S, S]
}

const WEEK_DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

interface MacroTileProps {
  label: string;
  value: number;
  unit: string;
  /** 0 means no target is set yet; the tile then shows the fallback line and no goal. */
  goal: number;
  color: string;
  overKey: string;
  leftKey: string;
  fallback: string;
  /** Show the goal itself as the headline number (used for calories), with eaten / left below. */
  targetMode?: boolean;
}

/**
 * One macro tile: the amount eaten, the goal beside it as a small
 * denominator, the progress bar, and how far over or under the goal you are.
 */
const MacroTile: React.FC<MacroTileProps> = ({
  label,
  value,
  unit,
  goal,
  color,
  overKey,
  leftKey,
  fallback,
  targetMode = false,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dir = useTextDirection();
  const eaten = Math.round(value);
  const hasGoal = goal > 0;
  const diff = Math.round(goal) - eaten;
  const isOver = hasGoal && diff < 0;
  const pct = hasGoal ? Math.min(100, Math.max(0, (eaten / goal) * 100)) : eaten > 0 ? 100 : 0;
  const hairline = theme.isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(15, 23, 42, 0.13)';

  return (
    <View
      style={[
        styles.metricTile,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <View style={styles.tileHeader}>
        <Text style={[styles.tileValue, { color: theme.colors.textPrimary }]}>
          {targetMode && !hasGoal ? t('tracker.header.targetNotSet') : (targetMode ? Math.round(goal) : eaten).toLocaleString()}
          {(!targetMode || hasGoal) && (
            <Text style={[styles.tileUnit, { color: theme.colors.textSecondary }]}>{unit}</Text>
          )}
        </Text>
        {hasGoal && !targetMode && (
          <View style={[styles.goalBox, { borderColor: hairline }]}>
            <Text style={[styles.goalCaption, { color: theme.colors.textMuted }]}>
              {t('tracker.header.goalCaption')}
            </Text>
            <Text style={[styles.goalValue, { color: theme.colors.textSecondary }]}>
              {Math.round(goal).toLocaleString()}
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.tileLabel, dir.text, { color: theme.colors.textSecondary }]}>{label}</Text>
      <View
        style={[
          styles.tileProgressTrack,
          { backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)' },
        ]}
      >
        <View style={[styles.tileProgressFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text
        style={[styles.tileSub, { color: isOver ? theme.colors.danger : theme.colors.textMuted }]}
      >
        {targetMode
          ? hasGoal
            ? t(isOver ? 'tracker.header.kcalEatenOver' : 'tracker.header.kcalEatenLeft', {
                eaten: eaten.toLocaleString(),
                value: Math.abs(diff).toLocaleString(),
              })
            : fallback
          : hasGoal
          ? t(isOver ? overKey : leftKey, { value: Math.abs(diff).toLocaleString() })
          : fallback}
      </Text>
    </View>
  );
};

export const DailyProgressHeader: React.FC<DailyProgressHeaderProps> = ({
  summary,
  weeklyHistoryFills,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dir = useTextDirection();
  const heroBg = theme.colors.heroCardBg;
  const heroBorder = theme.colors.primaryLime;
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
    pendingSyncCount,
  } = summary;

  const totalTarget = Math.max(1, targetCalories);
  const calRatio = Math.min(1, Math.max(0, totalCaloriesConsumed / totalTarget));


  // Current day index (0 for Monday, 6 for Sunday)
  const currentDayOfWeek = (new Date().getDay() + 6) % 7;

  return (
    <View style={styles.container}>
      {/* Offline Sync Status Badge if needed */}
      {pendingSyncCount > 0 && (
        <View style={styles.syncRow}>
          <Notice compact tone="warning" icon="sync">
            {t('tracker.header.pendingSync', { count: pendingSyncCount })}
          </Notice>
        </View>
      )}

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
          <View style={styles.heroStatusBadge}>
            <View style={styles.heroStatusDot} />
            <Text style={styles.heroStatusText}>
              {t('tracker.header.free')}
            </Text>
          </View>
        </View>

        <View style={styles.heroBodyRow}>
          {/* Main Calorie Numbers */}
          <View style={styles.heroNumbersCol}>
            <Text style={[styles.heroValue, { color: heroTextColor }]}>
              {targetCalories > 0
                ? Math.abs(remainingCalories).toLocaleString()
                : Math.round(totalCaloriesConsumed).toLocaleString()}
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
                ? t('tracker.header.dailyGoal', {
                    target: targetCalories.toLocaleString(),
                    eaten: Math.round(totalCaloriesConsumed),
                  })
                : t('tracker.header.noTargetHint')}
            </Text>
          </View>

          {/* 7-Day Vertical Pill Intake Chart (Clean Slate: No fake history for new users) */}
          <View style={styles.weekPillChart}>
            {WEEK_DAY_KEYS.map((dayKey, idx) => {
              const isToday = idx === currentDayOfWeek;
              // If weeklyHistoryFills is provided, use it; otherwise only today fills based on real intake
              const dayFillPct = isToday
                ? calRatio
                : (weeklyHistoryFills && weeklyHistoryFills[idx] !== undefined)
                ? weeklyHistoryFills[idx]
                : 0; // 0 for unlogged days
              const hasIntake = dayFillPct > 0;

              return (
                <View key={idx} style={styles.weekDayCol}>
                  <View style={styles.pillTrack}>
                    {hasIntake && (
                      <View
                        style={[
                          styles.pillFill,
                          {
                            height: `${Math.max(12, Math.round(dayFillPct * 100))}%`,
                            backgroundColor: isToday
                              ? '#0A0B0D'
                              : 'rgba(10, 11, 13, 0.35)',
                          },
                        ]}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.weekDayLabel,
                      isToday && styles.weekDayLabelActive,
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

      {/* 2. 2x2 Metric Grid Tiles (Protein, Carbs, Fat, Calories) */}
      <View style={styles.metricGrid}>
        <MacroTile
          label={t('common.protein')}
          value={totalProteinConsumed}
          unit="g"
          goal={targetProteinGrams}
          color={theme.colors.protein}
          overKey="tracker.header.gramsOver"
          leftKey="tracker.header.gramsLeft"
          fallback={t('tracker.header.consumedToday')}
        />
        <MacroTile
          label={t('common.carbs')}
          value={totalCarbConsumed}
          unit="g"
          goal={targetCarbGrams}
          color={theme.colors.carbs}
          overKey="tracker.header.gramsOver"
          leftKey="tracker.header.gramsLeft"
          fallback={t('tracker.header.consumedToday')}
        />
        <MacroTile
          label={t('common.fat')}
          value={totalFatConsumed}
          unit="g"
          goal={targetFatGrams}
          color={theme.colors.fat}
          overKey="tracker.header.gramsOver"
          leftKey="tracker.header.gramsLeft"
          fallback={t('tracker.header.consumedToday')}
        />
        <MacroTile
          label={t('tracker.header.dailyTarget')}
          targetMode
          value={totalCaloriesConsumed}
          unit=" kcal"
          goal={targetCalories}
          color={theme.colors.primaryAccessible}
          overKey="tracker.header.kcalOver"
          leftKey="tracker.header.kcalLeft"
          fallback={t('tracker.header.noTargetHint')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  syncRow: {
    marginBottom: 10,
    alignItems: 'center',
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
  heroStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(10, 11, 13, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
  },
  heroStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0A0B0D',
  },
  heroStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0A0B0D',
    letterSpacing: 0.5,
  },
  heroBodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  heroNumbersCol: {
    flex: 1,
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
    alignItems: 'flex-end',
    gap: 6,
    paddingBottom: 4,
  },
  weekDayCol: {
    alignItems: 'center',
    gap: 4,
  },
  pillTrack: {
    width: 10,
    height: 60,
    backgroundColor: 'rgba(10, 11, 13, 0.12)',
    borderRadius: 9999,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  pillFill: {
    width: '100%',
    borderRadius: 9999,
  },
  weekDayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0A0B0D',
    opacity: 0.6,
    fontVariant: ['tabular-nums'],
  },
  weekDayLabelActive: {
    opacity: 1,
    fontWeight: '900',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricTile: {
    width: '48%',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
  },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tileValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  tileLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tileProgressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  tileProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  tileUnit: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
  },
  goalBox: {
    alignItems: 'flex-end',
    borderLeftWidth: 1,
    paddingLeft: 9,
    marginTop: 1,
  },
  goalCaption: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  goalValue: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  tileSub: {
    fontSize: 10,
    fontWeight: '600',
  },
});
