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
import { useTranslation, useTextDirection } from '../../i18n/index.js';

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
  const { t } = useTranslation();
  const dir = useTextDirection();
  const isTargetChanged = metrics.targetDelta !== 0;

  const handleShareSummary = () => {
    const summary = t('checkin.shareBody', {
      name: displayName || t('checkin.myProgress'),
      adherence: metrics.adherenceRatePct,
      daysLogged: metrics.daysLogged,
      weightDelta:
        metrics.weightDeltaKg >= 0 ? `+${metrics.weightDeltaKg}` : `${metrics.weightDeltaKg}`,
      intake: metrics.meanDailyIntake,
      newTarget: metrics.newKcalTarget,
      targetDelta:
        metrics.targetDelta >= 0 ? `+${metrics.targetDelta}` : `${metrics.targetDelta}`,
      habit: narrative.keyActionLever,
    });

    Alert.alert(t('checkin.shareTitle'), summary);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.canvas }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.colors.surfaceSecondary }]}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={[styles.backBtnText, { color: theme.colors.textPrimary }]}>
            {dir.isRTL ? '→' : '←'} {t('checkin.dashboard')}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          {t('checkin.title')}
        </Text>
        <TouchableOpacity
          style={[
            styles.shareHeaderBtn,
            { backgroundColor: isDark ? 'rgba(164, 235, 63, 0.15)' : '#F7FEE7' },
          ]}
          onPress={handleShareSummary}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.shareHeaderBtnText,
              { color: isDark ? theme.colors.primaryLime : '#4B6200' },
            ]}
          >
            {t('checkin.share')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Recalibration Banner */}
        <View
          style={[
            styles.recalibrationCard,
            isTargetChanged
              ? {
                  backgroundColor: theme.colors.primaryLime,
                  borderColor: theme.colors.primaryLime,
                }
              : {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
          ]}
        >
          <Text
            style={[
              styles.cardEyebrow,
              {
                color: isTargetChanged
                  ? '#3A4400'
                  : isDark
                  ? theme.colors.primaryLime
                  : '#4B6200',
              },
            ]}
          >
            {t('checkin.recalibration')}
          </Text>
          <Text
            style={[
              styles.headlineText,
              {
                color: isTargetChanged ? '#0A0B0D' : theme.colors.textPrimary,
              },
            ]}
          >
            {narrative.headline}
          </Text>

          <View style={styles.deltaPillRow}>
            <View
              style={[
                styles.deltaPill,
                {
                  backgroundColor: isTargetChanged
                    ? '#BEE600'
                    : theme.colors.surfaceSecondary,
                  borderColor: isTargetChanged ? '#ABCF00' : theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.deltaPillLabel,
                  { color: isTargetChanged ? '#333A00' : theme.colors.textMuted },
                ]}
              >
                {t('checkin.oldTarget')}
              </Text>
              <Text
                style={[
                  styles.deltaPillVal,
                  { color: isTargetChanged ? '#0A0B0D' : theme.colors.textPrimary },
                ]}
              >
                {t('common.kcalValue', { value: metrics.oldKcalTarget })}
              </Text>
            </View>

            <Text
              style={[
                styles.arrowIcon,
                {
                  color: isTargetChanged
                    ? '#0A0B0D'
                    : isDark
                    ? theme.colors.primaryLime
                    : '#4B6200',
                },
              ]}
            >
              →
            </Text>

            <View
              style={[
                styles.deltaPill,
                {
                  backgroundColor: isTargetChanged
                    ? '#0A0B0D'
                    : isDark
                    ? 'rgba(164, 235, 63, 0.12)'
                    : '#F7FEE7',
                  borderColor: isTargetChanged ? '#0A0B0D' : theme.colors.primaryLime,
                },
              ]}
            >
              <Text
                style={[
                  styles.deltaPillLabel,
                  { color: isTargetChanged ? '#9CA3AF' : theme.colors.textMuted },
                ]}
              >
                {t('checkin.newTarget')}
              </Text>
              <Text
                style={[
                  styles.deltaPillValNew,
                  {
                    color: isTargetChanged
                      ? theme.colors.primaryLime
                      : isDark
                      ? theme.colors.primaryLime
                      : '#4B6200',
                  },
                ]}
              >
                {t('common.kcalValue', { value: metrics.newKcalTarget })}
              </Text>
            </View>
          </View>
        </View>

        {/* 7-Day Performance Grid */}
        <Text style={[styles.sectionHeading, { color: theme.colors.textPrimary }]}>
          7-Day Progress Stats
        </Text>
        <View style={styles.metricsGrid}>
          <View
            style={[
              styles.metricCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.metricNumber, { color: theme.colors.textPrimary }]}>
              {metrics.adherenceRatePct}%
            </Text>
            <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>
              {t('checkin.adherenceRate')}
            </Text>
            <Text style={[styles.metricSub, { color: theme.colors.textMuted }]}>
              {t('checkin.daysOnTarget', { count: metrics.daysLogged })}
            </Text>
          </View>

          <View
            style={[
              styles.metricCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.metricNumber,
                { color: theme.colors.textPrimary },
                metrics.weightDeltaKg < 0
                  ? { color: isDark ? theme.colors.primaryLime : '#4B6200' }
                  : metrics.weightDeltaKg > 0
                  ? { color: '#D97706' }
                  : null,
              ]}
            >
              {metrics.weightDeltaKg >= 0
                ? `+${metrics.weightDeltaKg}`
                : metrics.weightDeltaKg}{' '}
              kg
            </Text>
            <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>
              {t('checkin.weightTrend')}
            </Text>
            <Text style={[styles.metricSub, { color: theme.colors.textMuted }]}>
              {t('checkin.ewmaSmoothed')}
            </Text>
          </View>

          <View
            style={[
              styles.metricCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.metricNumber, { color: theme.colors.textPrimary }]}>
              {metrics.meanDailyIntake}
            </Text>
            <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>
              {t('checkin.avgIntake')}
            </Text>
            <Text style={[styles.metricSub, { color: theme.colors.textMuted }]}>
              {t('checkin.kcalPerDay')}
            </Text>
          </View>

          <View
            style={[
              styles.metricCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.metricNumber, { color: theme.colors.textPrimary }]}>
              {metrics.newTDEE}
            </Text>
            <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>
              {t('checkin.adaptiveTdee')}
            </Text>
            <Text style={[styles.metricSub, { color: theme.colors.textMuted }]}>
              {t('checkin.kcalShift', {
                value: metrics.tdeeDelta >= 0 ? `+${metrics.tdeeDelta}` : metrics.tdeeDelta,
              })}
            </Text>
          </View>
        </View>

        {/* AI Clinical Narrative */}
        <View
          style={[
            styles.narrativeCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.narrativeHeader}>
            <Text style={[styles.narrativeTitle, { color: theme.colors.textPrimary }]}>
              🧑‍⚕️ {t('checkin.coachAssessment')}
            </Text>
            <View
              style={[
                styles.zdrBadge,
                {
                  backgroundColor: isDark ? 'rgba(164, 235, 63, 0.15)' : '#F7FEE7',
                },
              ]}
            >
              <Text
                style={[
                  styles.zdrBadgeText,
                  { color: isDark ? theme.colors.primaryLime : '#4B6200' },
                ]}
              >
                {t('checkin.grounded')}
              </Text>
            </View>
          </View>
          <Text style={[styles.narrativeBody, { color: theme.colors.textSecondary }]}>
            {narrative.summaryText}
          </Text>
        </View>

        {/* Key Action Lever Card */}
        <View
          style={[
            styles.actionLeverCard,
            {
              backgroundColor: isDark ? '#1F1E14' : '#FEF3C7',
              borderColor: isDark ? '#3D3815' : '#FDE68A',
            },
          ]}
        >
          <Text
            style={[
              styles.actionLeverEyebrow,
              { color: isDark ? theme.colors.primaryLime : '#B45309' },
            ]}
          >
            💡 {t('checkin.actionLever')}
          </Text>
          <Text
            style={[
              styles.actionLeverText,
              { color: isDark ? '#E5E7EB' : '#92400E' },
            ]}
          >
            {narrative.keyActionLever}
          </Text>
        </View>

        {/* Accept Target CTA */}
        <TouchableOpacity
          style={[
            styles.acceptBtn,
            { backgroundColor: theme.colors.primaryLime },
          ]}
          onPress={() => onAcceptNewTargets(metrics.newKcalTarget)}
          activeOpacity={0.85}
        >
          <Text style={[styles.acceptBtnText, { color: theme.colors.limeText }]}>
            ✓ {t('checkin.applyNewTarget', { value: metrics.newKcalTarget })}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 9999,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  shareHeaderBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  shareHeaderBtnText: {
    fontSize: 12,
    fontWeight: '800',
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
    borderWidth: 1,
  },
  cardEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  headlineText: {
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
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  deltaPillLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  deltaPillVal: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  deltaPillValNew: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  arrowIcon: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: '900',
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  metricSub: {
    fontSize: 11,
    marginTop: 2,
  },
  narrativeCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    gap: 8,
  },
  narrativeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  narrativeTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  zdrBadge: {
    borderRadius: 9999,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  zdrBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  narrativeBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  actionLeverCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    gap: 6,
  },
  actionLeverEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  actionLeverText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  acceptBtn: {
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  acceptBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
