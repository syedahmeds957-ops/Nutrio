import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme.js';
import { Icon } from '../../ui/Icon.js';

interface WaterTrackerCardProps {
  consumedMl: number;
  targetMl: number;
  onLogWater: (amountMl: number) => void;
}

export const WaterTrackerCard: React.FC<WaterTrackerCardProps> = ({
  consumedMl,
  targetMl,
  onLogWater,
}) => {
  const { theme, isDark } = useTheme();
  const pct = Math.min(100, Math.round((consumedMl / (targetMl || 1)) * 100));

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
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <View
            style={[
              styles.waterIconBox,
              { backgroundColor: isDark ? 'rgba(2, 132, 199, 0.18)' : '#E0F2FE' },
            ]}
          >
            <Icon name="droplet" size={20} color="#0284C7" />
          </View>
          <View>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              Hydration Tracker
            </Text>
            <Text style={[styles.sub, { color: theme.colors.textSecondary }]}>
              {consumedMl.toLocaleString()} / {targetMl.toLocaleString()} ml ({pct}%)
            </Text>
          </View>
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[
              styles.waterBtn,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => onLogWater(250)}
            activeOpacity={0.7}
          >
            <Text style={[styles.waterBtnText, { color: '#0284C7' }]}>+250ml</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.waterBtn,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => onLogWater(500)}
            activeOpacity={0.7}
          >
            <Text style={[styles.waterBtnText, { color: '#0284C7' }]}>+500ml</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.track, { backgroundColor: theme.colors.surfaceSecondary }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: '#0284C7' }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  waterIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  waterBtn: {
    borderRadius: 9999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  waterBtnText: {
    fontSize: 11,
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
});
