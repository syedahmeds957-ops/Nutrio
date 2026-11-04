import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { useTheme, commonRadii } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { useFormat } from '../../i18n/useFormat.js';
import { Icon } from '../../ui/Icon.js';
import { localDateKey } from '../../common/dateKey.js';
import { HapticFeedback } from '../../ui/haptics.js';
import { sparklinePoints, WeightGlance } from '../../weight/weightGlance.js';
import { waterGoalPercent, waterLitres, waterTargetMl } from '../waterTile.js';

// Both tiles share one set of rows: header, number, visual, caption. Everything under the header is
// pinned to the bottom, so the two numbers sit on the same line whatever height the tiles get.
const HEADER_HEIGHT = 28;
const VALUE_HEIGHT = 44;
const VISUAL_HEIGHT = 28;
const CAPTION_HEIGHT = 16;
const SPARK_HEIGHT = VISUAL_HEIGHT;
const GLASS_ML = 250;


/** Weight tile: latest weigh-in, a sparkline of the recent ones, and the change this week. */
export const WeightTile: React.FC<{ glance: WeightGlance | null; onPress?: () => void }> = ({ glance, onPress }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const { formatNumber, formatDate } = useFormat();
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

  // One weigh-in cannot draw a trend: a dotted line with a single dot keeps the row from reading empty.
  const single = points.length < 2;
  // Never a blank caption: a trend change, else the hint, else when the weight was last logged.
  const [y, m, d] = (glance?.latestDate ?? '').split('-').map(Number);
  const loggedCaption =
    glance?.latestDate === localDateKey()
      ? t('tracker.weightTile.loggedToday')
      : glance && y && m && d
        ? t('tracker.weightTile.lastLogged', { date: formatDate(new Date(y, m - 1, d), { day: 'numeric', month: 'short' }) })
        : null;
  const caption = deltaText ?? (single ? t('tracker.weightTile.singleHint') : loggedCaption);

  const content = (
    <>
      {header}
      <View style={styles.body}>
        <Text style={[styles.value, dir.text, { color: c.textPrimary }]} numberOfLines={1}>
          {formatNumber(glance.latestKg, { maximumFractionDigits: 1 })}
          <Text style={[styles.unit, { color: c.textSecondary }]}>{` ${t('survey.basics.unitKg')}`}</Text>
        </Text>
        <View
          style={styles.visual}
          onLayout={(e: LayoutChangeEvent) => setSpark({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
        >
          {spark.width > 0 && (
            <Svg width={spark.width} height={spark.height} style={StyleSheet.absoluteFill}>
              {single ? (
                <>
                  <Line
                    x1={4}
                    y1={spark.height / 2}
                    x2={spark.width - 8}
                    y2={spark.height / 2}
                    stroke={c.border}
                    strokeWidth={2.4}
                    strokeDasharray="0.1 7"
                    strokeLinecap="round"
                  />
                  <Circle cx={spark.width - 4} cy={spark.height / 2} r={4} fill={c.textPrimary} />
                </>
              ) : (
                <>
                  <Path
                    d={points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')}
                    fill="none"
                    stroke={trendColor}
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {last ? <Circle cx={last.x} cy={last.y} r={3} fill={trendColor} /> : null}
                </>
              )}
            </Svg>
          )}
        </View>
        <Text style={[styles.caption, dir.text, { color: isDrop ? c.successText : c.textSecondary }, isDrop && styles.captionStrong]} numberOfLines={1}>
          {caption ?? ' '}
        </Text>
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
  const ratio = target > 0 ? Math.min(1, Math.max(0, consumedMl / target)) : 0;
  const pipCount = Math.min(16, Math.max(6, Math.round(target / GLASS_ML)));

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
      <View style={styles.body}>
        <Text style={[styles.value, dir.text, { color: c.textPrimary }]} numberOfLines={1}>
          {formatNumber(waterLitres(consumedMl, 2), { maximumFractionDigits: 2 })}
          <Text style={[styles.unit, { color: c.textSecondary }]}>
            {` / ${t('common.litresValue', { value: formatNumber(waterLitres(target), { maximumFractionDigits: 1 }) })}`}
          </Text>
        </Text>
        {/* One pip per glass of the day's target, filling upward like the week's pills. They take the whole
            height of the row, so the tile has no blank space around a thin bar. */}
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={t('tracker.water.title')}
          accessibilityValue={{ min: 0, max: 100, now: pct }}
          style={[styles.visual, styles.pips]}
        >
          {Array.from({ length: pipCount }, (_, i) => {
            const fill = Math.min(1, Math.max(0, ratio * pipCount - i));
            return (
              <View key={i} style={[styles.pip, { backgroundColor: `${c.water}33` }]}>
                <View style={[styles.pipFill, { height: `${fill * 100}%`, backgroundColor: c.water }]} />
              </View>
            );
          })}
        </View>
        <Text style={[styles.caption, dir.text, { color: c.textSecondary }]} numberOfLines={1}>
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
  card: { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', padding: 14, borderRadius: 20, borderWidth: 1 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: HEADER_HEIGHT },
  waterTitle: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  waterTitleText: { flexShrink: 1 },
  overline: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  // The number and its unit share one text baseline (the unit is a nested Text).
  value: { height: VALUE_HEIGHT, fontSize: 36, lineHeight: VALUE_HEIGHT, fontWeight: '800', letterSpacing: -0.8, fontVariant: ['tabular-nums'] },
  unit: { fontSize: 14, fontWeight: '700', letterSpacing: 0 },
  // The body under the header: takes the leftover height and centres its group in it.
  center: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 8 },
  // Number, visual and caption, pinned to the bottom of the tile.
  // The body takes whatever height the tile has left under the header, and the graph row (not a gap) absorbs it.
  body: { flexGrow: 1 },
  visual: { flexGrow: 1, minHeight: VISUAL_HEIGHT, marginTop: 4, justifyContent: 'center', alignSelf: 'stretch' },
  caption: { height: CAPTION_HEIGHT, marginTop: 4, fontSize: 12, lineHeight: CAPTION_HEIGHT, fontWeight: '600' },
  captionStrong: { fontWeight: '700' },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 13, lineHeight: 17, fontWeight: '600', textAlign: 'center' },
  pill: { alignSelf: 'stretch', minHeight: 44, borderRadius: commonRadii.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  pillText: { fontSize: 13, fontWeight: '800' },
  // The 30 px pill sits in a 44 px target; the margin keeps the header row its old height.
  addHit: { minWidth: 48, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginVertical: -7 },
  addBtn: { minWidth: 48, height: 30, borderRadius: commonRadii.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  addBtnText: { fontSize: 12, fontWeight: '800' },
  // The fill is absolute, so it never feeds back into the row's height; the row is capped as well.
  pips: { flexDirection: 'row', alignItems: 'stretch', justifyContent: 'flex-start', gap: 3, maxHeight: 56 },
  pip: { flex: 1, borderRadius: 3, overflow: 'hidden' },
  pipFill: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
