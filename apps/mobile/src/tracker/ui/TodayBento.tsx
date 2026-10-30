import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme, commonRadii } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { useFormat } from '../../i18n/useFormat.js';
import { Icon } from '../../ui/Icon.js';
import { HapticFeedback } from '../../ui/haptics.js';
import { sparklinePoints, WeightGlance } from '../../weight/weightGlance.js';
import { waterGoalPercent, waterLitres, waterTargetMl } from '../waterTile.js';

const SPARK_HEIGHT = 36;
const GLASS_ML = 250;


/** Weight tile: latest weigh-in, a sparkline of the recent ones, and the change this week. */
export const WeightTile: React.FC<{ glance: WeightGlance | null; onPress?: () => void }> = ({ glance, onPress }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const { formatNumber } = useFormat();
  const dir = useTextDirection();
  const [spark, setSpark] = useState({ width: 0, height: 0 });

  const points = glance ? sparklinePoints(glance.series, spark.width, spark.height) : [];
  const last = points[points.length - 1];
  const delta = glance?.weekDeltaKg ?? null;
  const deltaText = glance?.latestFromSurvey
    ? t('tracker.weightTile.fromSurvey')
    : delta === null
      ? null
      : t('tracker.weightTile.weekDelta', { value: `${delta > 0 ? '↑' : delta < 0 ? '↓' : ''} ${formatNumber(Math.abs(delta), { maximumFractionDigits: 1 })}`.trim() });
  // Green only for a drop; a rise stays neutral because the tile does not know whether gaining is the goal.
  const isDrop = !glance?.latestFromSurvey && delta !== null && delta < 0;
  const trendColor = isDrop ? c.successText : c.primaryAccessible;

  const header = (
    <View style={styles.headRow}>
      <Text style={[styles.overline, dir.text, { color: c.textSecondary }]}>{t('tracker.dashboard.nav.weight')}</Text>
      {onPress ? <Icon name={dir.isRTL ? 'chevron-left' : 'chevron-right'} size={16} color={c.textMuted} /> : null}
    </View>
  );

  const cardStyle = [styles.card, { backgroundColor: c.surface, borderColor: c.border }];

  if (!glance) {
    // No weigh-ins yet: a centred invitation. The card is a plain view so the button is its own target.
    const invitation = (
      <>
        <View style={[styles.emptyIcon, { backgroundColor: c.surfaceSecondary }]}>
          <Icon name="scale" size={22} color={c.textSecondary} />
        </View>
        <Text style={[styles.emptyText, { color: c.textSecondary }]} numberOfLines={2}>
          {t('tracker.weightTile.empty')}
        </Text>
      </>
    );
    return (
      <View style={cardStyle}>
        {/* One target, the button below: a second small button here only repeated it. */}
        <View style={styles.headRow}>
          <Text style={[styles.overline, dir.text, { color: c.textSecondary }]}>{t('tracker.dashboard.nav.weight')}</Text>
        </View>
        <View style={styles.center}>
          {invitation}
          {onPress ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t('tracker.weightTile.logCta')}
              activeOpacity={0.8}
              onPress={() => {
                HapticFeedback.impactLight();
                onPress();
              }}
              style={[styles.pill, { backgroundColor: c.surfaceSecondary }]}
            >
              <Text style={[styles.pillText, { color: c.textPrimary }]} numberOfLines={1}>
                {t('tracker.weightTile.logCta')}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  }

  const content = (
    <>
      {header}
      <View style={styles.dataBody}>
        <View style={styles.dataTop}>
        <Text style={[styles.value, dir.text, { color: c.textPrimary }]} numberOfLines={1}>
          {formatNumber(glance.latestKg, { maximumFractionDigits: 1 })}
          <Text style={[styles.unit, { color: c.textSecondary }]}>{` ${t('survey.basics.unitKg')}`}</Text>
        </Text>
        <View
          style={styles.spark}
          onLayout={(e: LayoutChangeEvent) => setSpark({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
        >
          {points.length > 1 && (
            <Svg width={spark.width} height={spark.height} style={StyleSheet.absoluteFill}>
              <Path
                d={points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')}
                fill="none"
                stroke={trendColor}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {last ? <Circle cx={last.x} cy={last.y} r={3} fill={trendColor} /> : null}
            </Svg>
          )}
        </View>
        </View>
        {deltaText ? (
          <Text style={[styles.weightDelta, dir.text, { color: isDrop ? c.successText : c.textSecondary }]} numberOfLines={1}>
            {deltaText}
          </Text>
        ) : null}
      </View>
    </>
  );

  return onPress ? (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.7}
      onPress={onPress}
      style={cardStyle}
    >
      {content}
    </TouchableOpacity>
  ) : (
    <View style={cardStyle}>{content}</View>
  );
};

/** Water tile: litres so far against the target, a progress bar, the share of the goal, and +250. */
export const WaterTile: React.FC<{
  consumedMl: number;
  targetMl: number;
  onLogWater: (ml: number) => void;
}> = ({ consumedMl, targetMl, onLogWater }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const { formatNumber } = useFormat();
  const dir = useTextDirection();

  const target = waterTargetMl(targetMl);
  const pct = waterGoalPercent(consumedMl, target);

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={styles.headRow}>
        <View style={styles.waterTitle}>
          <Icon name="droplet" size={13} color={c.water} />
          <Text style={[styles.overline, styles.waterTitleText, dir.text, { color: c.textSecondary }]} numberOfLines={1}>
            {t('tracker.water.tileTitle')}
          </Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('tracker.water.addGlass')}
          activeOpacity={0.8}
          onPress={() => {
            HapticFeedback.impactLight();
            onLogWater(GLASS_ML);
          }}
          style={styles.addHit}
        >
          <View style={[styles.addBtn, { backgroundColor: c.surfaceSecondary }]}>
            <Text style={[styles.addBtnText, { color: c.textPrimary }]}>{`+${GLASS_ML}`}</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.center}>
        <Text style={[styles.value, styles.stretchText, dir.text, { color: c.textPrimary }]} numberOfLines={1}>
          {formatNumber(waterLitres(consumedMl, 2), { maximumFractionDigits: 2 })}
          <Text style={[styles.unit, { color: c.textSecondary }]}>
            {` / ${t('common.litresValue', { value: formatNumber(waterLitres(target), { maximumFractionDigits: 1 }) })}`}
          </Text>
        </Text>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={t('tracker.water.title')}
          accessibilityValue={{ min: 0, max: 100, now: pct }}
          style={[styles.track, { backgroundColor: c.progressTrack }]}
        >
          <View style={[styles.fill, { width: `${pct}%`, backgroundColor: c.water }]} />
        </View>
        <Text style={[styles.sub, styles.stretchText, dir.text, { color: c.textSecondary }]} numberOfLines={2}>
          {t('tracker.water.goalPercent', { value: pct })}
        </Text>
      </View>
    </View>
  );
};

/**
 * The bento row: a tall workout tile on one side, weight over water on the
 * other, both columns the same height. Without a workout tile (no handler to
 * open workouts) the two small tiles sit side by side. Rows are not reversed
 * by hand: native and web mirror them in Arabic.
 *
 * `workoutWide` (no plan yet, so the tile is only a short invitation) puts the
 * workout tile across the full width above the weight and water pair, instead
 * of stretching it to the height of the two tiles beside it.
 */
export const TodayBento: React.FC<{
  workout?: React.ReactNode;
  workoutWide?: boolean;
  weight: React.ReactNode;
  water: React.ReactNode;
}> = ({ workout, workoutWide = false, weight, water }) => {
  if (workout && workoutWide) {
    return (
      <View style={styles.stack}>
        {workout}
        <View style={styles.row}>
          <View style={styles.colSmall}>{weight}</View>
          <View style={styles.colSmall}>{water}</View>
        </View>
      </View>
    );
  }
  if (!workout) {
    return (
      <View style={styles.row}>
        <View style={styles.colSmall}>{weight}</View>
        <View style={styles.colSmall}>{water}</View>
      </View>
    );
  }
  return (
    <View style={styles.row}>
      <View style={styles.colTall}>{workout}</View>
      <View style={styles.colSmall}>
        {weight}
        {water}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stack: { gap: 12 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'stretch' },
  colTall: { flex: 1.08, minWidth: 0 },
  // Cards size to their content and share any leftover height (flexGrow, not flex: 1), so the
  // tall workout tile never leaves them stretched over empty space.
  colSmall: { flex: 1, minWidth: 0, gap: 12 },
  card: { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', padding: 14, borderRadius: 20, borderWidth: 1, gap: 8 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 30 },
  waterTitle: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  waterTitleText: { flexShrink: 1 },
  overline: { fontSize: 13, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  value: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
  unit: { fontSize: 12, fontWeight: '600', letterSpacing: 0 },
  stretchText: { alignSelf: 'stretch' },
  // The body under the header: takes the leftover height and centres its group in it.
  center: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  dataBody: { flexGrow: 1, justifyContent: 'space-between', gap: 8 },
  dataTop: { gap: 8 },
  spark: { height: SPARK_HEIGHT, alignSelf: 'stretch', overflow: 'hidden' },
  sub: { fontSize: 12, fontWeight: '700' },
  weightDelta: { fontSize: 14, fontWeight: '800' },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 13, lineHeight: 17, fontWeight: '600', textAlign: 'center' },
  pill: { alignSelf: 'stretch', minHeight: 44, borderRadius: commonRadii.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  pillText: { fontSize: 13, fontWeight: '800' },
  // The 30 px pill sits in a 44 px target; the margin keeps the header row its old height.
  addHit: { minWidth: 48, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginVertical: -7 },
  addBtn: { minWidth: 48, height: 30, borderRadius: commonRadii.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  addBtnText: { fontSize: 12, fontWeight: '800' },
  track: { height: 8, borderRadius: 4, overflow: 'hidden', alignSelf: 'stretch' },
  fill: { height: '100%', borderRadius: 4 },
});
