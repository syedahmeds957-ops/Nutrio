import React from 'react';
import {
  Platform,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '../../ui/BackButton.js';
import { useTheme, commonRadii } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { useFormat } from '../../i18n/useFormat.js';
import { Icon } from '../../ui/Icon.js';
import type { TrainingAdherence } from '../../workout/weekView.js';
import { TrainingCard } from './TrainingCard.js';

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
  /** Planned workouts in the same 7 days and how many were done; absent without a workout plan. */
  training?: TrainingAdherence;
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
  const { formatPercent } = useFormat();
  const dir = useTextDirection();
  const isTargetChanged = metrics.targetDelta !== 0;
  // Nothing to share before a day is logged. On web, React Native's Share needs
  // the browser's share sheet; the old Alert did nothing there at all.
  const canShare =
    metrics.daysLogged > 0 &&
    (Platform.OS !== 'web' || (typeof navigator !== 'undefined' && typeof navigator.share === 'function'));

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

    Share.share({ title: t('checkin.shareTitle'), message: summary }).catch(() => {
      // Dismissed or unavailable: nothing to recover.
    });
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
        <BackButton onPress={onBack} text={t('checkin.dashboard')} />
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          {t('checkin.title')}
        </Text>
        {canShare ? (
          <TouchableOpacity
            style={[
              styles.shareHeaderBtn,
              { backgroundColor: theme.colors.limeTint },
            ]}
            onPress={handleShareSummary}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.shareHeaderBtnText,
                { color: theme.colors.primaryAccessible },
              ]}
            >
              {t('checkin.share')}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.shareHeaderBtn} />
        )}
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
                  ? theme.colors.limeText
                  : isDark
                  ? theme.colors.primaryLime
                  : theme.colors.primaryAccessible,
              },
            ]}
          >
            {t('checkin.recalibration')}
          </Text>
          <Text
            style={[
              styles.headlineText,
              {
                color: isTargetChanged ? theme.colors.limeText : theme.colors.textPrimary,
              },
            ]}
          >
            {narrative.headline}
          </Text>

          {isTargetChanged ? (
            <View style={styles.deltaPillRow}>
              <View
                style={[
                  styles.deltaPill,
                  {
                    backgroundColor: isTargetChanged
                      ? theme.colors.primaryDark
                      : theme.colors.surfaceSecondary,
                    borderColor: isTargetChanged ? theme.colors.primaryDark : theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.deltaPillLabel,
                    { color: isTargetChanged ? theme.colors.limeText : theme.colors.textMuted },
                  ]}
                >
                  {t('checkin.oldTarget')}
                </Text>
                <Text
                  style={[
                    styles.deltaPillVal,
                    { color: isTargetChanged ? theme.colors.limeText : theme.colors.textPrimary },
                  ]}
                >
                  {t('common.kcalValue', { value: metrics.oldKcalTarget })}
                </Text>
              </View>

              <Icon
                name={dir.isRTL ? 'arrow-left' : 'arrow-right'}
                size={20}
                color={isTargetChanged ? theme.colors.limeText : theme.colors.primaryAccessible}
              />

              <View
                style={[
                  styles.deltaPill,
                  {
                    backgroundColor: isTargetChanged
                      ? theme.colors.limeText
                      : isDark
                      ? 'rgba(164, 235, 63, 0.12)'
                      : theme.colors.limeTint,
                    borderColor: isTargetChanged ? theme.colors.limeText : theme.colors.primaryLime,
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
                        : theme.colors.primaryAccessible,
                    },
                  ]}
                >
                  {t('common.kcalValue', { value: metrics.newKcalTarget })}
                </Text>
              </View>
            </View>
          ) : (
            // Showing "1447 → 1447" read as a recalibration that did nothing.
            <View style={styles.deltaPillRow}>
              <View
                style={[
                  styles.deltaPill,
                  { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
                ]}
              >
                <Text style={[styles.deltaPillLabel, { color: theme.colors.textMuted }]}>
                  {t('checkin.currentTarget')}
                </Text>
                <Text style={[styles.deltaPillVal, { color: theme.colors.textPrimary }]}>
                  {t('common.kcalValue', { value: metrics.oldKcalTarget })}
                </Text>
              </View>
              <Text style={[styles.noChangeText, dir.text, { color: theme.colors.textSecondary }]}>
                {t('checkin.noChange')}
              </Text>
            </View>
          )}
        </View>

        {/* 7-Day Performance Grid */}
        <Text style={[styles.sectionHeading, { color: theme.colors.textPrimary }]}>
          {t('checkin.progressStats')}
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
              {formatPercent(metrics.adherenceRatePct)}
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
                  ? { color: theme.colors.primaryAccessible }
                  : metrics.weightDeltaKg > 0
                  ? { color: theme.colors.warning }
                  : null,
              ]}
            >
              {t('common.kgValue', {
                value: metrics.weightDeltaKg >= 0 ? `+${metrics.weightDeltaKg}` : metrics.weightDeltaKg,
              })}
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

        {metrics.training ? <TrainingCard training={metrics.training} /> : null}

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
              {t('checkin.coachAssessment')}
            </Text>
            <View
              style={[
                styles.zdrBadge,
                {
                  backgroundColor: theme.colors.limeTint,
                },
              ]}
            >
              <Text
                style={[
                  styles.zdrBadgeText,
                  { color: theme.colors.primaryAccessible },
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
              backgroundColor: theme.colors.warningLight,
              borderColor: theme.colors.warningBorder,
            },
          ]}
        >
          <Text
            style={[
              styles.actionLeverEyebrow,
              { color: isDark ? theme.colors.primaryLime : theme.colors.warningText },
            ]}
          >
            {t('checkin.actionLever')}
          </Text>
          <Text
            style={[
              styles.actionLeverText,
              { color: isDark ? theme.colors.textPrimary : theme.colors.warningText },
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
          // With no change to apply, offering to "apply" the same number would
          // read as an adjustment that isn't happening.
          onPress={() => (isTargetChanged ? onAcceptNewTargets(metrics.newKcalTarget) : onBack())}
          activeOpacity={0.85}
        >
          <Text style={[styles.acceptBtnText, { color: theme.colors.limeText }]}>
            {isTargetChanged
              ? t('checkin.applyNewTarget', { value: metrics.newKcalTarget })
              : t('checkin.dashboard')}
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  noChangeText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  shareHeaderBtn: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: commonRadii.pill,
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
    fontSize: 12,
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
    fontSize: 12,
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
    fontSize: 12,
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
    borderRadius: commonRadii.pill,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  zdrBadgeText: {
    fontSize: 12,
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
    fontSize: 12,
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
    borderRadius: commonRadii.pill,
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
