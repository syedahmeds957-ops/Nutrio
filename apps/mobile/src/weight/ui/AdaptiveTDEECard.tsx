import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AdaptiveTDEEResult } from '@nutrio/nutrition-core';
import { useTheme } from '../../theme.js';

interface AdaptiveTDEECardProps {
  adaptiveResult: AdaptiveTDEEResult;
  formulaTDEE: number;
}

export const AdaptiveTDEECard: React.FC<AdaptiveTDEECardProps> = ({
  adaptiveResult,
  formulaTDEE,
}) => {
  const { theme, isDark } = useTheme();
  const {
    blendedTDEE,
    daysLogged,
    weightFactor,
    isUnderLogging,
    recommendedKcalDelta,
    explanation,
  } = adaptiveResult;

  const calibrationPct = Math.min(100, Math.round((daysLogged / 28) * 100));

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.title, { color: theme.colors.text }]}>Closed-Loop Adaptive TDEE</Text>
          <Text style={[styles.sub, { color: theme.colors.textMuted }]}>
            Calibrating your true metabolic expenditure using scale trends & intake logs
          </Text>
        </View>
      </View>

      {/* Hero Numbers */}
      <View style={[styles.heroBox, { backgroundColor: isDark ? '#14151A' : '#F8FAFC', borderColor: theme.colors.border }]}>
        <View>
          <Text style={[styles.heroLabel, { color: theme.colors.textMuted }]}>Active Blended TDEE</Text>
          <Text style={[styles.heroVal, { color: isDark ? '#D4FF00' : '#16A34A', fontWeight: '800' }]}>{blendedTDEE} kcal</Text>
          <Text style={[styles.heroSub, { color: theme.colors.textMuted }]}>
            Formula baseline: {formulaTDEE} kcal
          </Text>
        </View>

        <View style={[styles.deltaBadge, { backgroundColor: isDark ? 'rgba(212, 255, 0, 0.15)' : '#ECFDF5', borderColor: isDark ? '#D4FF00' : '#A7F3D0' }]}>
          <Text style={[styles.deltaText, { color: isDark ? '#D4FF00' : '#059669' }]}>
            {recommendedKcalDelta > 0
              ? `+${recommendedKcalDelta}`
              : recommendedKcalDelta}{' '}
            kcal/wk
          </Text>
          <Text style={[styles.deltaSub, { color: theme.colors.textMuted }]}>target adjustment</Text>
        </View>
      </View>

      {/* 28-day Calibration Progress */}
      <View style={styles.calibrationSection}>
        <View style={styles.calibHeader}>
          <Text style={[styles.calibLabel, { color: theme.colors.textMuted }]}>Calibration Window</Text>
          <Text style={[styles.calibVal, { color: theme.colors.text }]}>
            {daysLogged} of 28 days ({calibrationPct}%)
          </Text>
        </View>
        <View style={[styles.track, { backgroundColor: isDark ? '#272A33' : '#E2E8F0' }]}>
          <View style={[styles.fill, { width: `${calibrationPct}%`, backgroundColor: '#D4FF00' }]} />
        </View>
        <Text style={[styles.calibNote, { color: theme.colors.textMuted }]}>
          Weight factor: {(weightFactor * 100).toFixed(0)}% observed data / {(
            (1 - weightFactor) *
            100
          ).toFixed(0)}% formula
        </Text>
      </View>

      {/* Under-Logging Safeguard Banner */}
      {isUnderLogging && (
        <View style={styles.underLoggingAlert}>
          <Text style={styles.underLoggingTitle}>⚠️ Under-Logging Detected</Text>
          <Text style={styles.underLoggingDesc}>
            Your logged caloric intake is below biological baseline (&lt;1.1× BMR). To protect your health and lean muscle, our clinical engine will NOT slash your calorie targets.
          </Text>
        </View>
      )}

      {/* Explanation Box */}
      <View style={[styles.explanationBox, { backgroundColor: isDark ? '#14151A' : '#F8FAFC', borderColor: theme.colors.border }]}>
        <Text style={[styles.explanationText, { color: theme.colors.textMuted }]}>ℹ️ {explanation}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  topRow: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  sub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 18,
  },
  heroBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroVal: {
    fontSize: 28,
    fontWeight: '900',
    color: '#059669',
    marginTop: 2,
  },
  heroSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  deltaBadge: {
    alignItems: 'flex-end',
    backgroundColor: '#E0F2FE',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  deltaText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0284C7',
  },
  deltaSub: {
    fontSize: 10,
    color: '#0284C7',
    fontWeight: '600',
  },
  calibrationSection: {
    marginBottom: 16,
  },
  calibHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  calibLabel: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '600',
  },
  calibVal: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
  },
  track: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 999,
  },
  calibNote: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
  },
  underLoggingAlert: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  underLoggingTitle: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '800',
  },
  underLoggingDesc: {
    color: '#991B1B',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  explanationBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  explanationText: {
    color: '#166534',
    fontSize: 12,
    lineHeight: 18,
  },
});
