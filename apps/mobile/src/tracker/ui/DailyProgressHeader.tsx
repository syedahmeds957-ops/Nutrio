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
        {eaten.toLocaleString('en-US')}
        {hasGoal && (
          <Text style={[styles.tileGoal, { color: theme.colors.textMuted }]}>
            {` / ${Math.round(goal).toLocaleString('en-US')}`}
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
          {isOver ? t(overKey, { value: Math.abs(diff).toLocaleString('en-US') }) : fallback}
        </Text>
      )}
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
        </View>

        <View style={styles.heroBodyRow}>
          {/* Main Calorie Numbers */}
          <View style={styles.heroNumbersCol}>
            <Text
              style={[styles.heroValue, { color: heroTextColor }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {targetCalories > 0
                ? Math.abs(remainingCalories).toLocaleString('en-US')
                : Math.round(totalCaloriesConsumed).toLocaleString('en-US')}
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
                    eaten: Math.round(totalCaloriesConsumed).toLocaleString('en-US'),
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
              const isFuture = idx > currentDayOfWeek;
              const isMissed = idx < currentDayOfWeek && !hasIntake;

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
