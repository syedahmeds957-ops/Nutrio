import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DailyTrackerSummary } from '../types.js';
import { useTheme } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';

interface DailyProgressHeaderProps {
  summary: DailyTrackerSummary;
  weeklyHistoryFills?: number[]; // Optional array of fills 0-1 for [M, T, W, T, F, S, S]
}

const WEEK_DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

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

  const proteinPct = Math.min(100, Math.round((totalProteinConsumed / Math.max(1, targetProteinGrams)) * 100));
  const carbsPct = Math.min(100, Math.round((totalCarbConsumed / Math.max(1, targetCarbGrams)) * 100));
  const fatPct = Math.min(100, Math.round((totalFatConsumed / Math.max(1, targetFatGrams)) * 100));

  // Current day index (0 for Monday, 6 for Sunday)
  const currentDayOfWeek = (new Date().getDay() + 6) % 7;

  return (
    <View style={styles.container}>
      {/* Offline Sync Status Badge if needed */}
      {pendingSyncCount > 0 && (
        <View style={styles.syncRow}>
          <View style={[styles.syncBadgePending, { backgroundColor: theme.colors.surfaceSecondary }]}>
            <Text style={[styles.syncBadgePendingText, { color: theme.colors.warning }]}>
              ⚡ {t('tracker.header.pendingSync', { count: pendingSyncCount })}
            </Text>
          </View>
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

      {/* 2. 2x2 Metric Grid Tiles (Protein, Carbs, Fat, Banked) */}
      <View style={styles.metricGrid}>
        {/* Tile 1: Protein */}
        <View
          style={[
            styles.metricTile,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.tileHeader}>
            <Text style={[styles.tileValue, { color: theme.colors.textPrimary }]}>
              {Math.round(totalProteinConsumed)}g
            </Text>
            <Text style={[styles.tileArrow, { color: theme.colors.textMuted }]}>↗</Text>
          </View>
          <Text style={[styles.tileLabel, dir.text, { color: theme.colors.textSecondary }]}>
            {t('common.protein')}
          </Text>
          <View style={[styles.tileProgressTrack, { backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)' }]}>
            <View
              style={[
                styles.tileProgressFill,
                { width: `${proteinPct}%`, backgroundColor: theme.colors.protein },
              ]}
            />
          </View>
          <Text style={[styles.tileSub, { color: theme.colors.textMuted }]}>
            {targetProteinGrams > 0
              ? t('tracker.header.pctOfGoal', { pct: proteinPct, grams: targetProteinGrams })
              : t('tracker.header.consumedToday')}
          </Text>
        </View>

        {/* Tile 2: Carbs */}
        <View
          style={[
            styles.metricTile,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.tileHeader}>
            <Text style={[styles.tileValue, { color: theme.colors.textPrimary }]}>
              {Math.round(totalCarbConsumed)}g
            </Text>
            <Text style={[styles.tileArrow, { color: theme.colors.textMuted }]}>↗</Text>
          </View>
          <Text style={[styles.tileLabel, dir.text, { color: theme.colors.textSecondary }]}>
            {t('common.carbs')}
          </Text>
          <View style={[styles.tileProgressTrack, { backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)' }]}>
            <View
              style={[
                styles.tileProgressFill,
                { width: `${carbsPct}%`, backgroundColor: theme.colors.carbs },
              ]}
            />
          </View>
          <Text style={[styles.tileSub, { color: theme.colors.textMuted }]}>
            {targetCarbGrams > 0
              ? t('tracker.header.pctOfGoal', { pct: carbsPct, grams: targetCarbGrams })
              : t('tracker.header.consumedToday')}
          </Text>
        </View>

        {/* Tile 3: Fat */}
        <View
          style={[
            styles.metricTile,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.tileHeader}>
            <Text style={[styles.tileValue, { color: theme.colors.textPrimary }]}>
              {Math.round(totalFatConsumed)}g
            </Text>
            <Text style={[styles.tileArrow, { color: theme.colors.textMuted }]}>↗</Text>
          </View>
          <Text style={[styles.tileLabel, dir.text, { color: theme.colors.textSecondary }]}>
            {t('common.fat')}
          </Text>
          <View style={[styles.tileProgressTrack, { backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)' }]}>
            <View
              style={[
                styles.tileProgressFill,
                { width: `${fatPct}%`, backgroundColor: theme.colors.fat },
              ]}
            />
          </View>
          <Text style={[styles.tileSub, { color: theme.colors.textMuted }]}>
            {targetFatGrams > 0
              ? t('tracker.header.pctOfGoal', { pct: fatPct, grams: targetFatGrams })
              : t('tracker.header.consumedToday')}
          </Text>
        </View>

        {/* Tile 4: Daily Banked Dynamic */}
        <View
          style={[
            styles.metricTile,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.tileHeader}>
            <Text style={[styles.tileValue, { color: theme.colors.textPrimary }]}>
              {targetCalories > 0
                ? `${Math.max(0, targetCalories - Math.round(totalCaloriesConsumed))} kcal`
                : `${Math.round(totalCaloriesConsumed)} kcal`}
            </Text>
            <Text style={[styles.tileArrow, { color: theme.colors.textMuted }]}>↗</Text>
          </View>
          <Text style={[styles.tileLabel, { color: theme.colors.textSecondary }]}>
            {targetCalories > 0 ? t('tracker.header.banked') : t('tracker.header.consumed')}
          </Text>
          <View style={[styles.tileProgressTrack, { backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)' }]}>
            <View
              style={[
                styles.tileProgressFill,
                {
                  width: targetCalories > 0
                    ? `${Math.min(100, Math.max(0, Math.round(((targetCalories - totalCaloriesConsumed) / targetCalories) * 100)))}%`
                    : `${totalCaloriesConsumed > 0 ? 100 : 0}%`,
                  backgroundColor: theme.colors.primaryAccessible,
                },
              ]}
            />
          </View>
          <Text style={[styles.tileSub, { color: theme.colors.textMuted }]}>
            {targetCalories > 0
              ? totalCaloriesConsumed === 0
                ? t('tracker.header.readyFirstMeal')
                : t('tracker.header.onTrackDaily')
              : t('tracker.header.trackYourDay')}
          </Text>
        </View>
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
  tileArrow: {
    fontSize: 14,
    fontWeight: '700',
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
  tileSub: {
    fontSize: 10,
    fontWeight: '600',
  },
});
