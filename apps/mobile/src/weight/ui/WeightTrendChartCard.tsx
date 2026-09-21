import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WeightTrendSummary } from '../types.js';
import { useTheme } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';

interface WeightTrendChartCardProps {
  summary: WeightTrendSummary;
  spikeWarning?: string;
}

export const WeightTrendChartCard: React.FC<WeightTrendChartCardProps> = ({
  summary,
  spikeWarning,
}) => {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const dir = useTextDirection();
  const accentColor = theme.colors.primaryLime;
  const { currentWeightKg, currentEWMAKg, totalDeltaKg, points } = summary;
  const isLoss = totalDeltaKg < 0;

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          {t('weight.trend.title')}
        </Text>
        <Text style={[styles.sub, { color: theme.colors.textMuted }]}>
          {t('weight.trend.subtitle')}
        </Text>
      </View>

      {/* Hero Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}>
          <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
            {t('weight.trend.scaleWeight')}
          </Text>
          <Text style={[styles.statVal, { color: theme.colors.textPrimary }]}>{currentWeightKg} kg</Text>
          <Text style={[styles.statSub, { color: theme.colors.textMuted }]}>
            {t('weight.trend.rawReading')}
          </Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: theme.colors.surfaceSecondary, borderColor: accentColor }]}>
          <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
            {t('weight.trend.trendWeight')}
          </Text>
          <Text style={[styles.statVal, { color: accentColor, fontWeight: '800' }]}>{currentEWMAKg} kg</Text>
          <Text style={[styles.statSub, { color: theme.colors.textMuted }]}>
            {t('weight.trend.trueTissue')}
          </Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}>
          <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
            {t('weight.trend.netChange')}
          </Text>
          <Text
            style={[
              styles.statVal,
              isLoss ? { color: accentColor } : styles.gainText,
            ]}
          >
            {totalDeltaKg > 0 ? `+${totalDeltaKg}` : totalDeltaKg} kg
          </Text>
          <Text style={[styles.statSub, { color: theme.colors.textMuted }]}>
            {t('weight.trend.overallProgress')}
          </Text>
        </View>
      </View>

      {/* Water Retention Warning */}
      {spikeWarning && (
        <View style={[styles.spikeBox, { backgroundColor: isDark ? '#0C2A3D' : '#F0F9FF', borderLeftColor: '#0284C7' }]}>
          <Text style={[styles.spikeText, { color: isDark ? '#7DD3FC' : '#0369A1' }]}>💧 {spikeWarning}</Text>
        </View>
      )}

      {/* Recent Trend Points */}
      {points.length > 0 && (
        <View style={styles.pointsList}>
          <Text style={[styles.pointsTitle, { color: theme.colors.textPrimary }]}>
            {t('weight.trend.recentHistory')}
          </Text>
          {points.slice(-5).reverse().map((pt, idx) => (
            <View key={idx} style={[styles.pointRow, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.pointDate, { color: theme.colors.textPrimary }]}>{pt.date}</Text>
              <View style={styles.pointValues}>
                <Text style={[styles.pointRaw, { color: theme.colors.textMuted }]}>
                  {t('weight.trend.kgScale', { value: pt.rawWeightKg })}
                </Text>
                <Text style={[styles.pointEwma, { color: accentColor }]}>
                  {dir.isRTL ? '←' : '→'} {t('weight.trend.kgTrend', { value: pt.ewmaWeightKg })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    boxShadow: '0px 4px 12px rgba(15, 23, 42, 0.05)',
  },
  header: {
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
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
    marginTop: 4,
  },
  ewmaVal: {
    color: '#059669',
  },
  lossText: {
    color: '#059669',
  },
  gainText: {
    color: '#D97706',
  },
  statSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  spikeBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#0284C7',
    marginBottom: 14,
  },
  spikeText: {
    color: '#0284C7',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  pointsList: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
  },
  pointsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  pointRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  pointDate: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '500',
  },
  pointValues: {
    flexDirection: 'row',
    gap: 8,
  },
  pointRaw: {
    color: '#64748B',
    fontSize: 13,
  },
  pointEwma: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '700',
  },
});
