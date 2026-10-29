import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AdaptiveTDEEResult } from '@nutrio/nutrition-core';
import { Notice } from '../../ui/Notice.js';
import { useTheme } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';

interface AdaptiveTDEECardProps {
  adaptiveResult: AdaptiveTDEEResult;
  formulaTDEE: number;
}

export const AdaptiveTDEECard: React.FC<AdaptiveTDEECardProps> = ({
  adaptiveResult,
  formulaTDEE,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dir = useTextDirection();
  const accentColor = theme.colors.primaryLime;
  const badgeBg = theme.colors.primaryLight;
  const badgeBorder = theme.colors.primary;

  const {
    blendedTDEE,
    daysLogged,
    weightFactor,
    isUnderLogging,
    recommendedKcalDelta,
    observedTDEE,
  } = adaptiveResult;

  // Written here, not taken from the calculator: its text is English and says TDEE.
  const explanation = isUnderLogging
    ? t('weight.adaptive.explainUnderLogging')
    : daysLogged < 7 || observedTDEE === undefined
      ? t('weight.adaptive.explainNeedMore', { days: daysLogged })
      : t('weight.adaptive.explainBlended', {
          observed: (weightFactor * 100).toFixed(0),
          formula: ((1 - weightFactor) * 100).toFixed(0),
          observedKcal: observedTDEE,
          formulaKcal: formulaTDEE,
        });

  const calibrationPct = Math.min(100, Math.round((daysLogged / 28) * 100));

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            {t('weight.adaptive.title')}
          </Text>
          <Text style={[styles.sub, { color: theme.colors.textMuted }]}>
            {t('weight.adaptive.subtitle')}
          </Text>
        </View>
      </View>

      {/* Hero Numbers */}
      <View style={[styles.heroBox, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}>
        <View>
          <Text style={[styles.heroLabel, { color: theme.colors.textMuted }]}>
            {t('weight.adaptive.blendedTdee')}
          </Text>
          <Text style={[styles.heroVal, { color: theme.colors.primaryAccessible, fontWeight: '800' }]}>
            {t('common.kcalValue', { value: blendedTDEE })}
          </Text>
          <Text style={[styles.heroSub, { color: theme.colors.textMuted }]}>
            {t('weight.adaptive.formulaBaseline', { value: formulaTDEE })}
          </Text>
        </View>

        <View style={[styles.deltaBadge, { backgroundColor: badgeBg, borderColor: badgeBorder, borderWidth: 1 }]}>
          <Text style={[styles.deltaText, { color: theme.colors.primaryAccessible }]}>
            {recommendedKcalDelta > 0
              ? `+${recommendedKcalDelta}`
              : recommendedKcalDelta}{' '}
            {t('weight.kcalPerWeek')}
          </Text>
          <Text style={[styles.deltaSub, { color: theme.colors.textMuted }]}>
            {t('weight.adaptive.targetAdjustment')}
          </Text>
        </View>
      </View>

      {/* 28-day Calibration Progress */}
      <View style={styles.calibrationSection}>
        <View style={styles.calibHeader}>
          <Text style={[styles.calibLabel, { color: theme.colors.textMuted }]}>
            {t('weight.adaptive.calibrationWindow')}
          </Text>
          <Text style={[styles.calibVal, { color: theme.colors.textPrimary }]}>
            {t('weight.adaptive.calibrationDays', { days: daysLogged, pct: calibrationPct })}
          </Text>
        </View>
        <View style={[styles.track, { backgroundColor: theme.colors.border }]}>
          <View style={[styles.fill, { width: `${calibrationPct}%`, backgroundColor: accentColor }]} />
        </View>
        <Text style={[styles.calibNote, { color: theme.colors.textMuted }]}>
          {t('weight.adaptive.weightFactor', {
            observed: (weightFactor * 100).toFixed(0),
            formula: ((1 - weightFactor) * 100).toFixed(0),
          })}
        </Text>
      </View>

      {/* Under-Logging Safeguard Banner */}
      {isUnderLogging && (
        <Notice tone="warning" title={t('weight.adaptive.underLoggingTitle')} style={{ marginTop: 12 }}>
          {t('weight.adaptive.underLoggingDesc')}
        </Notice>
      )}

      {/* Explanation Box */}
      <Notice tone="neutral" style={{ marginTop: 12 }}>{explanation}</Notice>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    boxShadow: '0px 4px 12px rgba(15, 23, 42, 0.05)',
  },
  topRow: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  sub: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 18,
  },
  heroBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroVal: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 2,
  },
  heroSub: {
    fontSize: 12,
    marginTop: 2,
  },
  deltaBadge: {
    flexShrink: 0,
    alignItems: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  deltaText: {
    fontSize: 16,
    fontWeight: '800',
  },
  deltaSub: {
    fontSize: 10,
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
    fontWeight: '600',
  },
  calibVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  track: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  calibNote: {
    fontSize: 11,
    marginTop: 6,
  },
});
