import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme.js';

interface CalorieRingGaugeProps {
  remainingKcal: number;
  consumedKcal: number;
  burnedOrTargetKcal: number;
  consumedProtein: number;
  targetProtein: number;
  consumedCarb: number;
  targetCarb: number;
  consumedFat: number;
  targetFat: number;
}

export const CalorieRingGauge: React.FC<CalorieRingGaugeProps> = ({
  remainingKcal,
  consumedKcal,
  burnedOrTargetKcal,
  consumedProtein,
  targetProtein,
  consumedCarb,
  targetCarb,
  consumedFat,
  targetFat,
}) => {
  // Safe progress calculations (0 to 1)
  const totalTarget = Math.max(1, consumedKcal + remainingKcal);
  const calorieRatio = Math.min(1, Math.max(0, consumedKcal / totalTarget));
  const proteinRatio = Math.min(1, Math.max(0, consumedProtein / Math.max(1, targetProtein)));
  const carbRatio = Math.min(1, Math.max(0, consumedCarb / Math.max(1, targetCarb)));
  const fatRatio = Math.min(1, Math.max(0, consumedFat / Math.max(1, targetFat)));

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Wellness</Text>

      {/* Main Gauge Section */}
      <View style={styles.gaugeRow}>
        {/* Left Eaten Pill */}
        <View style={styles.statPill}>
          <Text style={styles.statPillEmoji}>🔥 {consumedKcal}</Text>
          <Text style={styles.statPillLabel}>eaten</Text>
        </View>

        {/* Center Circular Progress Ring */}
        <View style={styles.ringOuter}>
          <View style={[styles.ringArc, { opacity: calorieRatio > 0 ? 1 : 0.4 }]} />
          <View style={styles.ringCenterContent}>
            <Text style={styles.remainingNumber}>
              {remainingKcal.toLocaleString()}
            </Text>
            <Text style={styles.remainingLabel}>kcal remaining</Text>
          </View>
        </View>

        {/* Right Burned / Target Pill */}
        <View style={styles.statPill}>
          <Text style={styles.statPillEmoji}>⚡ {burnedOrTargetKcal}</Text>
          <Text style={styles.statPillLabel}>target</Text>
        </View>
      </View>

      {/* 3 Macro Progress Bars */}
      <View style={styles.macroTrioContainer}>
        {/* Protein */}
        <View style={styles.macroCol}>
          <View style={styles.macroHeaderRow}>
            <Text style={styles.macroName}>Protein</Text>
          </View>
          <View style={styles.macroTrack}>
            <View
              style={[
                styles.macroFill,
                { width: `${proteinRatio * 100}%`, backgroundColor: theme.colors.primary },
              ]}
            />
          </View>
          <Text style={styles.macroVal}>
            {Math.max(0, Math.round(targetProtein - consumedProtein))}g left
          </Text>
        </View>

        {/* Carbs */}
        <View style={styles.macroCol}>
          <View style={styles.macroHeaderRow}>
            <Text style={styles.macroName}>Carbs</Text>
          </View>
          <View style={styles.macroTrack}>
            <View
              style={[
                styles.macroFill,
                { width: `${carbRatio * 100}%`, backgroundColor: '#34D399' },
              ]}
            />
          </View>
          <Text style={styles.macroVal}>
            {Math.max(0, Math.round(targetCarb - consumedCarb))}g left
          </Text>
        </View>

        {/* Fat */}
        <View style={styles.macroCol}>
          <View style={styles.macroHeaderRow}>
            <Text style={styles.macroName}>Fat</Text>
          </View>
          <View style={styles.macroTrack}>
            <View
              style={[
                styles.macroFill,
                { width: `${fatRatio * 100}%`, backgroundColor: theme.colors.fat },
              ]}
            />
          </View>
          <Text style={styles.macroVal}>
            {Math.max(0, Math.round(targetFat - consumedFat))}g left
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.cardHero,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    ...theme.shadows.soft,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  gaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statPill: {
    backgroundColor: theme.colors.surfaceSecondary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    minWidth: 78,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statPillEmoji: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  statPillLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginTop: 2,
    textTransform: 'lowercase',
  },
  ringOuter: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 8,
    borderColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringArc: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 8,
    borderColor: theme.colors.primary,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    transform: [{ rotate: '-45deg' }],
  },
  ringCenterContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  remainingNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  remainingLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  macroTrioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  macroCol: {
    flex: 1,
  },
  macroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  macroName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  macroTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  macroFill: {
    height: '100%',
    borderRadius: 3,
  },
  macroVal: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
});
