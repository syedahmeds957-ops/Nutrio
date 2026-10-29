import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { WeightTrendSummary } from '../types.js';
import { trendChartSeries, weightTrendStage } from '../weightGlance.js';
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
  const stage = weightTrendStage(points.length);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const series = trendChartSeries(points, box.width, box.height);
  const pathOf = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const lastTrend = series.trend[series.trend.length - 1];
  // Zero change is neutral: neither progress nor a warning.
  const changeColor =
    totalDeltaKg === 0 ? theme.colors.textPrimary : totalDeltaKg < 0 ? theme.colors.primaryAccessible : theme.colors.fatText;

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
      {stage === 'empty' && (
        <Text style={[styles.logAgain, dir.text, { color: theme.colors.textSecondary }]}>
          {t('weight.trend.logFirst')}
        </Text>
      )}
      {stage !== 'empty' && (
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}>
          <Text numberOfLines={1} style={[styles.statLabel, dir.text, { color: theme.colors.textMuted }]}>
            {t('weight.trend.scaleWeight')}
          </Text>
          <Text style={[styles.statVal, dir.text, { color: theme.colors.textPrimary }]}>{t('common.kgValue', { value: currentWeightKg })}</Text>
          <Text style={[styles.statSub, dir.text, { color: theme.colors.textMuted }]}>
            {points[0]?.fromSurvey && stage === 'single' ? t('weight.trend.fromSurvey') : t('weight.trend.rawReading')}
          </Text>
        </View>

        {stage === 'trend' && (<>
        <View style={[styles.statBox, { backgroundColor: theme.colors.surfaceSecondary, borderColor: accentColor }]}>
          <Text numberOfLines={1} style={[styles.statLabel, dir.text, { color: theme.colors.textMuted }]}>
            {t('weight.trend.trendWeight')}
          </Text>
          <Text style={[styles.statVal, dir.text, { color: theme.colors.primaryAccessible, fontWeight: '800' }]}>{t('common.kgValue', { value: currentEWMAKg })}</Text>
          <Text style={[styles.statSub, dir.text, { color: theme.colors.textMuted }]}>
            {t('weight.trend.trueTissue')}
          </Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}>
          <Text numberOfLines={1} style={[styles.statLabel, dir.text, { color: theme.colors.textMuted }]}>
            {t('weight.trend.netChange')}
          </Text>
          <Text
            style={[
              styles.statVal,
              dir.text,
              { color: changeColor },
            ]}
          >
            {t('common.kgValue', { value: totalDeltaKg > 0 ? `+${totalDeltaKg}` : totalDeltaKg })}
          </Text>
          <Text style={[styles.statSub, dir.text, { color: theme.colors.textMuted }]}>
            {t('weight.trend.overallProgress')}
          </Text>
        </View>
        </>)}
      </View>
      )}

      {/* One reading cannot make a trend: say so, then ask for the next one. */}
      {stage === 'single' && (
        <Text style={[styles.logAgain, dir.text, { color: theme.colors.textSecondary }]}>
          {t('weight.trend.logAgain')}
        </Text>
      )}

      {/* The chart draws from the first weigh-in on */}
      {stage !== 'empty' && (
        <View
          accessibilityRole="image"
          accessibilityLabel={t('weight.trend.chartLabel', {
            n: points.length,
            first: points[0].rawWeightKg,
            last: points[points.length - 1].rawWeightKg,
          })}
          style={[styles.chart, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}
          onLayout={(e: LayoutChangeEvent) =>
            setBox({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
          }
        >
          {box.width > 0 && (
            <Svg width={box.width} height={box.height} style={StyleSheet.absoluteFill}>
              {series.trend.length > 1 && (
                <Path
                  d={pathOf(series.trend)}
                  fill="none"
                  stroke={theme.colors.primaryAccessible}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {series.raw.map((p, i) => (
                <Circle key={i} cx={p.x} cy={p.y} r={series.raw.length === 1 ? 5 : 2.5} fill={series.raw.length === 1 ? theme.colors.primaryAccessible : theme.colors.textMuted} />
              ))}
              {lastTrend && series.trend.length > 1 ? (
                <Circle cx={lastTrend.x} cy={lastTrend.y} r={4} fill={theme.colors.primaryAccessible} />
              ) : null}
            </Svg>
          )}
        </View>
      )}

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
              <View style={styles.pointDateCol}>
                <Text style={[styles.pointDate, { color: theme.colors.textPrimary }]}>{formatDayKey(pt.date, language)}</Text>
                {pt.fromSurvey ? (
                  <Text style={[styles.pointTag, { color: theme.colors.textMuted }]}>{t('weight.trend.fromSurvey')}</Text>
                ) : null}
              </View>
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
  logAgain: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  chart: {
    height: 110,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
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
    alignItems: 'stretch',
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  statSub: {
    fontSize: 12,
    marginTop: 2,
  },
  pointsList: {
    borderTopWidth: 1,
    paddingTop: 14,
  },
  pointsTitle: {
    fontSize: 12,
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
  pointDateCol: {
    flexShrink: 1,
  },
  pointTag: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
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
