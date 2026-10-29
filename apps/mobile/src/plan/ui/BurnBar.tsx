import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { burnBreakdown, type BurnPieceKind } from '../burnBreakdown.js';
import { useTheme } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { useFormat } from '../../i18n/useFormat.js';

interface BurnBarProps {
  /** Calories at rest, daily burn and target, all from the computed plan. */
  bmr: number;
  tdee: number;
  kcalTarget: number;
}

/**
 * One stacked bar that explains the daily target: calories at rest plus
 * activity make up the daily burn, a marker shows where the target falls, and
 * the part of the bar past the marker is the planned deficit.
 *
 * Segments are told apart by colour that holds 3:1 against each other and the
 * card, and every one carries a text label below, so colour is never the only
 * cue. Layout uses flex only, so it mirrors for Arabic.
 */
export const BurnBar: React.FC<BurnBarProps> = ({ bmr, tdee, kcalTarget }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { formatNumber } = useFormat();
  const dir = useTextDirection();
  const b = burnBreakdown({ bmr, tdee, kcalTarget });

  const fill: Record<Exclude<BurnPieceKind, 'marker'>, string> = {
    rest: theme.colors.textPrimary,
    activity: theme.colors.protein,
    surplus: theme.colors.textPrimary,
  };

  const summary = t('plan.reveal.burnSummary', {
    rest: formatNumber(b.rest),
    activity: formatNumber(b.activity),
    burn: formatNumber(b.burn),
    target: formatNumber(b.target),
  });

  const legend: { key: string; label: string; value: number; color: string; marker?: boolean }[] = [
    { key: 'rest', label: t('plan.reveal.burnRest'), value: b.rest, color: fill.rest },
    { key: 'activity', label: t('plan.reveal.burnActivity'), value: b.activity, color: fill.activity },
  ];
  if (b.surplus > 0) {
    legend.push({ key: 'surplus', label: t('plan.reveal.burnSurplus'), value: b.surplus, color: fill.surplus });
  }
  legend.push({ key: 'target', label: t('plan.reveal.burnTarget'), value: b.target, color: theme.colors.textPrimary, marker: true });

  return (
    <View
      accessible
      role="img"
      aria-label={summary}
      accessibilityLabel={summary}
      testID="burn-bar"
    >
      <View style={styles.track}>
        {b.pieces.map((piece, index) =>
          piece.kind === 'marker' ? (
            <View
              key={`m${index}`}
              testID="burn-bar-marker"
              style={[styles.marker, { backgroundColor: theme.colors.textPrimary, borderColor: theme.colors.surface }]}
            />
          ) : (
            <View
              key={`${piece.kind}${index}`}
              testID={`burn-bar-${piece.kind}`}
              style={{ flex: piece.fraction, backgroundColor: fill[piece.kind] }}
            />
          ),
        )}
      </View>

      <View style={styles.legend}>
        {legend.map((item) => (
          <View key={item.key} style={styles.legendItem}>
            {item.marker ? (
              <View style={[styles.legendMarker, { backgroundColor: item.color, borderColor: theme.colors.surface }]} />
            ) : (
              <View style={[styles.swatch, { backgroundColor: item.color }]} />
            )}
            <Text style={[styles.legendText, dir.text, { color: theme.colors.textPrimary }]}>
              {item.label}{' '}
              <Text style={styles.legendValue}>{formatNumber(item.value)}</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: 18,
    borderRadius: 9,
    overflow: 'visible',
    marginVertical: 6,
  },
  // Taller than the bar so it shows above and below it; the surface-coloured
  // border cuts a visible gap even where it crosses the dark rest segment.
  marker: {
    width: 6,
    marginHorizontal: -3,
    marginVertical: -6,
    borderWidth: 2,
    borderRadius: 3,
    zIndex: 1,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 16,
    rowGap: 6,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendMarker: {
    width: 6,
    height: 14,
    borderWidth: 1,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 13,
    fontWeight: '600',
  },
  legendValue: {
    fontWeight: '800',
  },
});
