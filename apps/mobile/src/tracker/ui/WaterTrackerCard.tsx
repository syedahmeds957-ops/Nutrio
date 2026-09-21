import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { Icon } from '../../ui/Icon.js';
import { HapticFeedback } from '../../ui/haptics.js';

export interface WaterTrackerCardProps {
  waterMlConsumed?: number;
  consumedMl?: number;
  targetWaterMl?: number;
  targetMl?: number;
  onLogWater: (ml: number) => void;
}

export const WaterTrackerCard: React.FC<WaterTrackerCardProps> = ({
  waterMlConsumed,
  consumedMl,
  targetWaterMl,
  targetMl,
  onLogWater,
}) => {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const dir = useTextDirection();

  const actualConsumed = consumedMl ?? waterMlConsumed ?? 0;
  const actualTarget = targetMl ?? targetWaterMl ?? 2500;

  const waterColor = '#06B6D4';
  const progressPct = Math.min(100, Math.round((actualConsumed / Math.max(1, actualTarget)) * 100));

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.titleArea}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isDark ? 'rgba(6, 182, 212, 0.15)' : '#ECFEFF',
                borderColor: waterColor,
              },
            ]}
          >
            <Icon name="droplet" size={16} color={waterColor} />
          </View>
          <View>
            <Text style={[styles.title, dir.text, { color: theme.colors.textPrimary }]}>
              {t('tracker.water.title')}
            </Text>
            <Text style={[styles.subtitle, dir.text, { color: theme.colors.textSecondary }]}>
              {t('tracker.water.dailyTarget', { amount: actualTarget.toLocaleString() })}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.pctBadge,
            {
              backgroundColor: isDark ? 'rgba(6, 182, 212, 0.2)' : '#CFFAFE',
            },
          ]}
        >
          <Text style={[styles.pctText, { color: waterColor }]}>
            {progressPct}%
          </Text>
        </View>
      </View>

      {/* Numerical Stats & Progress Track */}
      <View style={styles.metricRow}>
        <View style={styles.numCol}>
          <Text style={[styles.mainNum, { color: theme.colors.textPrimary }]}>
            {(actualConsumed / 1000).toFixed(2)}L
          </Text>
          <Text style={[styles.subNum, { color: theme.colors.textMuted }]}>
            {actualConsumed.toLocaleString()} / {actualTarget.toLocaleString()} ml
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.progressTrack,
          {
            backgroundColor: isDark
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${progressPct}%`,
              backgroundColor: waterColor,
            },
          ]}
        />
      </View>

      {/* Quick Log Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            {
              backgroundColor: theme.colors.surfaceSecondary,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={() => {
            if (actualConsumed < actualTarget && actualConsumed + 250 >= actualTarget) {
              HapticFeedback.notificationSuccess();
            } else {
              HapticFeedback.impactLight();
            }
            onLogWater(250);
          }}
          activeOpacity={0.7}
        >
          <Icon name="plus" size={13} color={waterColor} />
          <Text style={[styles.actionBtnText, { color: theme.colors.textPrimary }]}>
            {t('tracker.water.addGlass')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionBtn,
            {
              backgroundColor: theme.colors.surfaceSecondary,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={() => {
            if (actualConsumed < actualTarget && actualConsumed + 500 >= actualTarget) {
              HapticFeedback.notificationSuccess();
            } else {
              HapticFeedback.impactLight();
            }
            onLogWater(500);
          }}
          activeOpacity={0.7}
        >
          <Icon name="plus" size={13} color={waterColor} />
          <Text style={[styles.actionBtnText, { color: theme.colors.textPrimary }]}>
            {t('tracker.water.addBottle')}
          </Text>
        </TouchableOpacity>

        {actualConsumed > 0 && (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.undoBtn,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => {
              HapticFeedback.impactLight();
              onLogWater(-250);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionBtnText, { color: theme.colors.textMuted }]}>
              -250 ml
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  pctBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pctText: {
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  metricRow: {
    marginBottom: 8,
  },
  numCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  mainNum: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  subNum: {
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  undoBtn: {
    paddingHorizontal: 12,
    minHeight: 44,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
