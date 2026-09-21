import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AdaptiveTDEEResult } from '@nutrio/nutrition-core';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';

interface AdaptiveTDEECardProps {
  adaptiveResult: AdaptiveTDEEResult;
  formulaTDEE: number;
}

export const AdaptiveTDEECard: React.FC<AdaptiveTDEECardProps> = ({
  adaptiveResult,
  formulaTDEE,
}) => {
  const { theme, isDark } = useTheme();
  const { activeRegion } = useRegion();
  const isSaudi = activeRegion === 'SA';
  const accentColor = theme.colors.primaryLime;
  const badgeBg = isDark
    ? 'rgba(164, 235, 63, 0.15)'
    : '#F4FCE3';
  const badgeBorder = isDark ? theme.colors.primaryLime : '#A4EB3F';

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
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            {isSaudi ? 'معدل الحرق الأيضي التكيفي · Adaptive TDEE' : 'Closed-Loop Adaptive TDEE'}
          </Text>
          <Text style={[styles.sub, { color: theme.colors.textMuted }]}>
            {isSaudi
              ? 'معايرة معدل الحرق الحقيقي عبر موازنة قراءات الميزان مع سعرات الطعام الفعلية'
              : 'Calibrating your true metabolic expenditure using scale trends & intake logs'}
          </Text>
        </View>
      </View>

      {/* Hero Numbers */}
      <View style={[styles.heroBox, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}>
        <View>
          <Text style={[styles.heroLabel, { color: theme.colors.textMuted }]}>
            {isSaudi ? 'معدل الحرق الفعلي النشط' : 'Active Blended TDEE'}
          </Text>
          <Text style={[styles.heroVal, { color: accentColor, fontWeight: '800' }]}>{blendedTDEE} kcal</Text>
          <Text style={[styles.heroSub, { color: theme.colors.textMuted }]}>
            {isSaudi ? `الأساس الحسابي: ${formulaTDEE} سعرة` : `Formula baseline: ${formulaTDEE} kcal`}
          </Text>
        </View>

        <View style={[styles.deltaBadge, { backgroundColor: badgeBg, borderColor: badgeBorder, borderWidth: 1 }]}>
          <Text style={[styles.deltaText, { color: accentColor }]}>
            {recommendedKcalDelta > 0
              ? `+${recommendedKcalDelta}`
              : recommendedKcalDelta}{' '}
            kcal/wk
          </Text>
          <Text style={[styles.deltaSub, { color: theme.colors.textMuted }]}>
            {isSaudi ? 'تعديل السعرات' : 'target adjustment'}
          </Text>
        </View>
      </View>

      {/* 28-day Calibration Progress */}
      <View style={styles.calibrationSection}>
        <View style={styles.calibHeader}>
          <Text style={[styles.calibLabel, { color: theme.colors.textMuted }]}>
            {isSaudi ? 'نافذة المعايرة (28 يوماً)' : 'Calibration Window'}
          </Text>
          <Text style={[styles.calibVal, { color: theme.colors.textPrimary }]}>
            {daysLogged} / 28 {isSaudi ? 'يوم' : 'days'} ({calibrationPct}%)
          </Text>
        </View>
        <View style={[styles.track, { backgroundColor: isDark ? '#272A33' : '#E2E8F0' }]}>
          <View style={[styles.fill, { width: `${calibrationPct}%`, backgroundColor: accentColor }]} />
        </View>
        <Text style={[styles.calibNote, { color: theme.colors.textMuted }]}>
          {isSaudi
            ? `وزن البيانات الحقيقية: ${(weightFactor * 100).toFixed(0)}% / المعادلة: ${((1 - weightFactor) * 100).toFixed(0)}%`
            : `Weight factor: ${(weightFactor * 100).toFixed(0)}% observed data / ${((1 - weightFactor) * 100).toFixed(0)}% formula`}
        </Text>
      </View>

      {/* Under-Logging Safeguard Banner */}
      {isUnderLogging && (
        <View style={[styles.underLoggingAlert, { backgroundColor: isDark ? '#3E1F07' : '#FEF3C7', borderColor: '#F59E0B' }]}>
          <Text style={[styles.underLoggingTitle, { color: '#D97706' }]}>
            {isSaudi ? '⚠️ تنبيه نقص التسجيل الحراري' : '⚠️ Under-Logging Detected'}
          </Text>
          <Text style={[styles.underLoggingDesc, { color: isDark ? '#FDE68A' : '#92400E' }]}>
            {isSaudi
              ? 'السعرات المسجلة أقل من خط الأساس البيولوجي (<1.1× BMR). لحماية الكتلة العضلية وصحتك، لن يقوم النظام بخفض سعراتك اليومية.'
              : 'Your logged caloric intake is below biological baseline (<1.1× BMR). To protect your health and lean muscle, our clinical engine will NOT slash your calorie targets.'}
          </Text>
        </View>
      )}

      {/* Explanation Box */}
      <View style={[styles.explanationBox, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}>
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
    boxShadow: '0px 4px 12px rgba(15, 23, 42, 0.05)',
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
    color: '#4D7C0F',
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
    backgroundColor: '#A4EB3F',
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
    backgroundColor: '#F7FEE7',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#A4EB3F',
  },
  explanationText: {
    color: '#365314',
    fontSize: 12,
    lineHeight: 18,
  },
});
