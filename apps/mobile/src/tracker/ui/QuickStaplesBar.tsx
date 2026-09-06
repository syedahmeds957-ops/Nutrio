import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../theme.js';
import { Icon } from '../../ui/Icon.js';

export interface StapleItem {
  id: string;
  label: string;
  name: string;
  calories: number;
  proteinGrams: number;
  fatGrams: number;
  carbGrams: number;
  icon: 'utensils' | 'coffee' | 'sun';
}

interface QuickStaplesBarProps {
  onQuickLog: (staple: StapleItem) => void;
  onScanPlate?: () => void;
}

const COMMON_STAPLES: StapleItem[] = [
  {
    id: 'roti',
    label: '+ 1 Roti',
    name: 'Roti (Whole Wheat)',
    calories: 120,
    proteinGrams: 4,
    fatGrams: 1,
    carbGrams: 24,
    icon: 'utensils',
  },
  {
    id: 'daal',
    label: '+ 1 Daal',
    name: 'Daal Chana',
    calories: 160,
    proteinGrams: 9,
    fatGrams: 5,
    carbGrams: 20,
    icon: 'utensils',
  },
  {
    id: 'egg',
    label: '+ 1 Egg',
    name: 'Boiled Egg',
    calories: 75,
    proteinGrams: 6.5,
    fatGrams: 5,
    carbGrams: 0.5,
    icon: 'sun',
  },
  {
    id: 'chai',
    label: '+ 1 Chai',
    name: 'Chai (Doodh Patti)',
    calories: 85,
    proteinGrams: 2,
    fatGrams: 3,
    carbGrams: 12,
    icon: 'coffee',
  },
];

export const QuickStaplesBar: React.FC<QuickStaplesBarProps> = ({
  onQuickLog,
  onScanPlate,
}) => {
  const { theme, isDark } = useTheme();
  const [justLoggedId, setJustLoggedId] = useState<string | null>(null);

  const handlePress = (staple: StapleItem) => {
    onQuickLog(staple);
    setJustLoggedId(staple.id);
    setTimeout(() => setJustLoggedId(null), 1800);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          <Icon name="zap" size={13} color={theme.colors.primaryLime} />
          <Text style={[styles.heading, { color: theme.colors.textMuted }]}>
            QUICK LOG STAPLES
          </Text>
        </View>

        {onScanPlate && (
          <TouchableOpacity
            style={[styles.scanBtn, { backgroundColor: theme.colors.primaryLime }]}
            onPress={onScanPlate}
            activeOpacity={0.8}
          >
            <View style={styles.scanBtnContent}>
              <Icon name="camera" size={13} color="#0A0B0D" />
              <Text style={styles.scanBtnText}>Scan Plate</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {COMMON_STAPLES.map((staple) => {
          const isJustLogged = justLoggedId === staple.id;

          return (
            <TouchableOpacity
              key={staple.id}
              style={[
                styles.pillBtn,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
                isJustLogged && {
                  backgroundColor: theme.colors.primaryLime,
                  borderColor: theme.colors.primaryLime,
                },
              ]}
              onPress={() => handlePress(staple)}
              activeOpacity={0.7}
            >
              <View style={styles.pillContent}>
                <Icon
                  name={isJustLogged ? 'check' : staple.icon}
                  size={12}
                  color={isJustLogged ? '#0A0B0D' : theme.colors.primaryLime}
                />
                <Text
                  style={[
                    styles.pillLabel,
                    { color: isJustLogged ? '#0A0B0D' : theme.colors.textPrimary },
                  ]}
                >
                  {isJustLogged ? 'Added!' : staple.label}
                </Text>
                <Text
                  style={[
                    styles.pillKcal,
                    { color: isJustLogged ? '#0A0B0D' : theme.colors.textSecondary },
                  ]}
                >
                  {staple.calories} kcal
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  scanBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  scanBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  scanBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0A0B0D',
  },
  scrollContent: {
    gap: 8,
    paddingVertical: 2,
  },
  pillBtn: {
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  pillKcal: {
    fontSize: 11,
    fontWeight: '600',
  },
});
