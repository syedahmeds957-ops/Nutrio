import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DailyTrackerSummary } from '../types.js';
import { useTheme } from '../../theme.js';

interface DailyProgressHeaderProps {
  summary: DailyTrackerSummary;
}

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const DailyProgressHeader: React.FC<DailyProgressHeaderProps> = ({ summary }) => {
  const { theme } = useTheme();
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
              ⚡ {pendingSyncCount} offline {pendingSyncCount === 1 ? 'entry' : 'entries'} pending sync
            </Text>
          </View>
        </View>
      )}

      {/* 1. Solid Electric Lime Hero Card (Revolut / Ronasit Design Reference) */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: theme.colors.heroCardBg, // Solid Lime #A4EB3F
            borderColor: theme.colors.primaryLime,
          },
        ]}
      >
        <View style={styles.heroTopRow}>
          <View style={styles.heroCategoryPill}>
            <Text style={styles.heroCategoryText}>ENERGY BUDGET</Text>
          </View>
          <View style={styles.heroStatusBadge}>
            <View style={styles.heroStatusDot} />
            <Text style={styles.heroStatusText}>100% FREE</Text>
          </View>
        </View>

        <View style={styles.heroBodyRow}>
          {/* Main Calorie Numbers */}
          <View style={styles.heroNumbersCol}>
            <Text style={[styles.heroValue, { color: theme.colors.limeText }]}>
              {Math.abs(remainingCalories).toLocaleString()}
            </Text>
            <Text style={[styles.heroLabel, { color: theme.colors.limeText }]}>
              {remainingCalories < 0 ? 'calories over limit' : 'calories remaining'}
            </Text>
            <Text style={[styles.heroTargetSub, { color: theme.colors.limeText }]}>
              Daily Goal: {targetCalories.toLocaleString()} kcal ({Math.round(totalCaloriesConsumed)} eaten)
            </Text>
          </View>

          {/* 7-Day Vertical Pill Intake Chart (From Ronasit Reference Image) */}
          <View style={styles.weekPillChart}>
            {WEEK_DAYS.map((day, idx) => {
              const isToday = idx === currentDayOfWeek;
              // Reflect realistic intake curve
              const dayFillPct = isToday ? calRatio : (idx < currentDayOfWeek ? 0.85 : 0.25);
              return (
                <View key={idx} style={styles.weekDayCol}>
                  <View style={styles.pillTrack}>
                    <View
                      style={[
                        styles.pillFill,
                        {
                          height: `${Math.max(15, Math.round(dayFillPct * 100))}%`,
                          backgroundColor: isToday ? '#0A0B0D' : 'rgba(10, 11, 13, 0.35)',
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.weekDayLabel, isToday && styles.weekDayLabelActive]}>
                    {day}
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
          <Text style={[styles.tileLabel, { color: theme.colors.textSecondary }]}>Protein</Text>
          <View style={[styles.tileProgressTrack, { backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)' }]}>
            <View
              style={[
                styles.tileProgressFill,
                { width: `${proteinPct}%`, backgroundColor: theme.colors.protein },
              ]}
            />
          </View>
          <Text style={[styles.tileSub, { color: theme.colors.textMuted }]}>
            {proteinPct}% of {targetProteinGrams}g goal
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
          <Text style={[styles.tileLabel, { color: theme.colors.textSecondary }]}>Carbs</Text>
          <View style={[styles.tileProgressTrack, { backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)' }]}>
            <View
              style={[
                styles.tileProgressFill,
                { width: `${carbsPct}%`, backgroundColor: theme.colors.carbs },
              ]}
            />
          </View>
          <Text style={[styles.tileSub, { color: theme.colors.textMuted }]}>
            {carbsPct}% of {targetCarbGrams}g goal
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
          <Text style={[styles.tileLabel, { color: theme.colors.textSecondary }]}>Fat</Text>
          <View style={[styles.tileProgressTrack, { backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)' }]}>
            <View
              style={[
                styles.tileProgressFill,
                { width: `${fatPct}%`, backgroundColor: theme.colors.fat },
              ]}
            />
          </View>
          <Text style={[styles.tileSub, { color: theme.colors.textMuted }]}>
            {fatPct}% of {targetFatGrams}g goal
          </Text>
        </View>

        {/* Tile 4: Weekly Calorie Bank */}
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
              +350 kcal
            </Text>
            <Text style={[styles.tileArrow, { color: theme.colors.textMuted }]}>↗</Text>
          </View>
          <Text style={[styles.tileLabel, { color: theme.colors.textSecondary }]}>Banked</Text>
          <View style={[styles.tileProgressTrack, { backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)' }]}>
            <View
              style={[
                styles.tileProgressFill,
                { width: '85%', backgroundColor: theme.colors.banked },
              ]}
            />
          </View>
          <Text style={[styles.tileSub, { color: theme.colors.textMuted }]}>
            On track for weekend
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  syncRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  syncBadgePending: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  syncBadgePendingText: {
    fontSize: 11,
    fontWeight: '700',
  },
  heroCard: {
    borderRadius: 26,
    padding: 22,
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
