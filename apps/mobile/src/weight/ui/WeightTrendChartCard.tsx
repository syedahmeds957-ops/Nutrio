import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WeightTrendSummary } from '../types.js';
import { Notice } from '../../ui/Notice.js';
import { useTheme } from '../../theme.js';
import { formatDayKey } from '../../common/dateKey.js';
import { useTranslation, useTextDirection, useI18nState } from '../../i18n/index.js';
import { Icon } from '../../ui/Icon.js';

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
  const { language } = useI18nState();
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
          <Text style={[styles.statVal, { color: theme.colors.primaryAccessible, fontWeight: '800' }]}>{currentEWMAKg} kg</Text>
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
              { color: isLoss ? theme.colors.primaryAccessible : theme.colors.fatText },
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
        <Notice tone="info" icon="droplet">{spikeWarning}</Notice>
      )}

      {/* Recent Trend Points */}
      {points.length > 0 && (
        <View style={[styles.pointsList, { borderTopColor: theme.colors.border }]}>
          <Text style={[styles.pointsTitle, { color: theme.colors.textPrimary }]}>
            {t('weight.trend.recentHistory')}
          </Text>
          {points.slice(-5).reverse().map((pt, idx) => (
            <View key={idx} style={[styles.pointRow, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.pointDate, { color: theme.colors.textPrimary }]}>{formatDayKey(pt.date, language)}</Text>
              <View style={styles.pointValues}>
                <Text style={[styles.pointRaw, { color: theme.colors.textMuted }]}>
                  {t('weight.trend.kgScale', { value: pt.rawWeightKg })}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name={dir.isRTL ? 'arrow-left' : 'arrow-right'} size={14} color={accentColor} />
                  <Text style={[styles.pointEwma, { color: theme.colors.primaryAccessible }]}>
                    {t('weight.trend.kgTrend', { value: pt.ewmaWeightKg })}
                  </Text>
                </View>
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
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    boxShadow: '0px 4px 12px rgba(15, 23, 42, 0.05)',
  },
  header: {
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
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  statSub: {
    fontSize: 10,
    marginTop: 2,
  },
  pointsList: {
    borderTopWidth: 1,
    paddingTop: 14,
  },
  pointsTitle: {
    fontSize: 11,
    fontWeight: '800',
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
    fontSize: 13,
    fontWeight: '500',
  },
  pointValues: {
    flexDirection: 'row',
    gap: 8,
  },
  pointRaw: {
    fontSize: 13,
  },
  pointEwma: {
    fontSize: 13,
    fontWeight: '700',
  },
});
