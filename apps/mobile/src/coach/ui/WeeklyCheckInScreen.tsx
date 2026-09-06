import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../theme.js';

export interface WeeklyCheckInMetrics {
  daysLogged: number;
  meanDailyIntake: number;
  currentEWMAWeightKg: number;
  weightDeltaKg: number;
  adherenceRatePct: number;
  oldTDEE: number;
  newTDEE: number;
  tdeeDelta: number;
  oldKcalTarget: number;
  newKcalTarget: number;
  targetDelta: number;
}

export interface WeeklyCheckInNarrative {
  headline: string;
  summaryText: string;
  keyActionLever: string;
}

interface WeeklyCheckInScreenProps {
  displayName?: string;
  metrics: WeeklyCheckInMetrics;
  narrative: WeeklyCheckInNarrative;
  onAcceptNewTargets: (newTarget: number) => void;
  onBack: () => void;
}

export const WeeklyCheckInScreen: React.FC<WeeklyCheckInScreenProps> = ({
  displayName,
  metrics,
  narrative,
  onAcceptNewTargets,
  onBack,
}) => {
  const { theme, isDark } = useTheme();
  const isTargetChanged = metrics.targetDelta !== 0;

  const handleShareSummary = () => {
    const summary = `📊 Nutrio Weekly Check-in Report (${displayName || 'My Progress'})
- Adherence Rate: ${metrics.adherenceRatePct}% (${metrics.daysLogged}/7 days logged)
- Weight Trend: ${metrics.weightDeltaKg >= 0 ? `+${metrics.weightDeltaKg}` : metrics.weightDeltaKg} kg
- Daily Intake Avg: ${metrics.meanDailyIntake} kcal
- New Daily Target: ${metrics.newKcalTarget} kcal (${metrics.targetDelta >= 0 ? `+${metrics.targetDelta}` : metrics.targetDelta} kcal)
- Next Week Habit: ${narrative.keyActionLever}`;

    Alert.alert('Shareable Summary', summary);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.canvas }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: isDark ? '#272A33' : '#F1F5F9' }]} onPress={onBack} activeOpacity={0.7}>
          <Text style={[styles.backBtnText, { color: theme.colors.text }]}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Weekly Check-In</Text>
        <TouchableOpacity
          style={[styles.shareHeaderBtn, { backgroundColor: isDark ? '#272A33' : '#F1F5F9' }]}
          onPress={handleShareSummary}
          activeOpacity={0.7}
        >
          <Text style={[styles.shareHeaderBtnText, { color: isDark ? '#D4FF00' : '#16A34A' }]}>Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollPad}>
        {/* Recalibration Banner */}
        <View
          style={[
            styles.recalibrationCard,
            isTargetChanged
              ? { backgroundColor: '#D4FF00', borderColor: '#D4FF00' }
              : { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.cardEyebrow, isTargetChanged && { color: '#2B3300' }]}>METABOLIC ADAPTIVE RECALIBRATION</Text>
          <Text style={[styles.headlineText, isTargetChanged ? { color: '#0A0B0D' } : { color: theme.colors.text }]}>{narrative.headline}</Text>

          <View style={styles.deltaPillRow}>
            <View style={[styles.deltaPill, isTargetChanged ? { backgroundColor: '#C2EB00', borderColor: '#AEDB00' } : { backgroundColor: isDark ? '#14151A' : '#F8FAFC', borderColor: theme.colors.border }]}>
              <Text style={[styles.deltaPillLabel, isTargetChanged && { color: '#333A00' }]}>Old Target</Text>
              <Text style={[styles.deltaPillVal, isTargetChanged ? { color: '#0A0B0D' } : { color: theme.colors.text }]}>{metrics.oldKcalTarget} kcal</Text>
            </View>
            <Text style={[styles.arrowIcon, isTargetChanged ? { color: '#0A0B0D' } : { color: isDark ? '#D4FF00' : '#059669' }]}>→</Text>
            <View style={[styles.deltaPill, isTargetChanged ? { backgroundColor: '#111215', borderColor: '#111215' } : { backgroundColor: isDark ? '#1C1D24' : '#ECFDF5', borderColor: '#D4FF00' }]}>
              <Text style={[styles.deltaPillLabel, isTargetChanged ? { color: '#9CA3AF' } : { color: theme.colors.textMuted }]}>New Target</Text>
              <Text style={[styles.deltaPillValNew, isTargetChanged ? { color: '#D4FF00' } : { color: isDark ? '#D4FF00' : '#059669' }]}>{metrics.newKcalTarget} kcal</Text>
            </View>
          </View>
        </View>

        {/* 7-Day Performance Grid */}
        <Text style={[styles.sectionHeading, { color: theme.colors.text }]}>7-Day Progress Stats</Text>
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.metricNumber, { color: theme.colors.text }]}>{metrics.adherenceRatePct}%</Text>
            <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>Adherence Rate</Text>
            <Text style={[styles.metricSub, { color: theme.colors.textMuted }]}>{metrics.daysLogged} of 7 days on-target</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text
              style={[
                styles.metricNumber,
                { color: theme.colors.text },
                metrics.weightDeltaKg < 0
                  ? styles.weightLossVal
                  : metrics.weightDeltaKg > 0
                  ? styles.weightGainVal
                  : null,
              ]}
            >
              {metrics.weightDeltaKg >= 0
                ? `+${metrics.weightDeltaKg}`
                : metrics.weightDeltaKg}{' '}
              kg
            </Text>
            <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>Weight Trend</Text>
            <Text style={[styles.metricSub, { color: theme.colors.textMuted }]}>EWMA smoothed</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.metricNumber, { color: theme.colors.text }]}>{metrics.meanDailyIntake}</Text>
            <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>Avg Daily Intake</Text>
            <Text style={[styles.metricSub, { color: theme.colors.textMuted }]}>kcal per day</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.metricNumber, { color: theme.colors.text }]}>{metrics.newTDEE}</Text>
            <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>Adaptive TDEE</Text>
            <Text style={[styles.metricSub, { color: theme.colors.textMuted }]}>
              {metrics.tdeeDelta >= 0 ? `+${metrics.tdeeDelta}` : metrics.tdeeDelta} kcal shift
            </Text>
          </View>
        </View>

        {/* AI Clinical Narrative */}
        <View style={[styles.narrativeCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.narrativeHeader}>
            <Text style={[styles.narrativeTitle, { color: theme.colors.text }]}>🧑‍⚕️ Coach's Metabolic Assessment</Text>
            <View style={styles.zdrBadge}>
              <Text style={styles.zdrBadgeText}>GROUNDED</Text>
            </View>
          </View>
          <Text style={[styles.narrativeBody, { color: theme.colors.textMuted }]}>{narrative.summaryText}</Text>
        </View>

        {/* Key Action Lever Card */}
        <View style={[styles.actionLeverCard, { backgroundColor: isDark ? '#1F1E14' : '#FEF3C7', borderColor: isDark ? '#3D3815' : '#FDE68A' }]}>
          <Text style={[styles.actionLeverEyebrow, { color: isDark ? '#D4FF00' : '#B45309' }]}>💡 NEXT WEEK'S ACTION LEVER</Text>
          <Text style={[styles.actionLeverText, { color: isDark ? '#E5E7EB' : '#92400E' }]}>{narrative.keyActionLever}</Text>
        </View>

        {/* Accept Target CTA */}
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={() => onAcceptNewTargets(metrics.newKcalTarget)}
          activeOpacity={0.85}
        >
          <Text style={styles.acceptBtnText}>
            ✓ Apply New Target ({metrics.newKcalTarget} kcal/day)
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F8F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 9999,
    backgroundColor: '#F1F5F9',
  },
  backBtnText: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '800',
  },
  shareHeaderBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  shareHeaderBtnText: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  scrollPad: {
    padding: 16,
    paddingBottom: 48,
    gap: 16,
  },
  recalibrationCard: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  recalibrationCardActive: {
    borderColor: '#10B981',
  },
  recalibrationCardStatic: {
    borderColor: '#F1F5F9',
  },
  cardEyebrow: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  headlineText: {
    color: '#1E293B',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  deltaPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 10,
  },
  deltaPill: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deltaPillNew: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  deltaPillLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  deltaPillVal: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  deltaPillValNew: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  arrowIcon: {
    color: '#059669',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionHeading: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '800',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  metricNumber: {
    color: '#1E293B',
    fontSize: 24,
    fontWeight: '900',
  },
  weightLossVal: {
    color: '#059669',
  },
  weightGainVal: {
    color: '#D97706',
  },
  metricLabel: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  metricSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  narrativeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  narrativeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  narrativeTitle: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '800',
  },
  zdrBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 9999,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  zdrBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },
  narrativeBody: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
  },
  actionLeverCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 6,
  },
  actionLeverEyebrow: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  actionLeverText: {
    color: '#B45309',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  acceptBtn: {
    backgroundColor: '#D4FF00',
    borderRadius: 9999,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
  },
  acceptBtnText: {
    color: '#0A0B0D',
    fontSize: 15,
    fontWeight: '800',
  },
});
