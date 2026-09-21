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
import { useRegion } from '../../common/region/index.js';
import { HapticFeedback } from '../../ui/haptics.js';

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
}

const PK_STAPLES: StapleItem[] = [
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

const SA_STAPLES: StapleItem[] = [
  {
    id: 'sa_tamees',
    label: '+ خبز تميس',
    name: 'Tamees Bread (خبز تميس)',
    calories: 150,
    proteinGrams: 5,
    fatGrams: 1,
    carbGrams: 35,
    icon: 'utensils',
  },
  {
    id: 'sa_laban',
    label: '+ لبن المراعي',
    name: 'Almarai Laban (لبن المراعي)',
    calories: 120,
    proteinGrams: 8,
    fatGrams: 6,
    carbGrams: 10,
    icon: 'utensils',
  },
  {
    id: 'sa_gahwa',
    label: '+ قهوة سعودية',
    name: 'Saudi Gahwa (فنجان قهوة سعودية)',
    calories: 2,
    proteinGrams: 0.1,
    fatGrams: 0,
    carbGrams: 0.5,
    icon: 'coffee',
  },
  {
    id: 'sa_dates',
    label: '+ 3 تمرات',
    name: 'Sukari Dates 3pc (تمر سكري)',
    calories: 75,
    proteinGrams: 0.6,
    fatGrams: 0.2,
    carbGrams: 19,
    icon: 'sun',
  },
  {
    id: 'sa_egg',
    label: '+ بيض مسلوق',
    name: 'Boiled Egg (بيض مسلوق)',
    calories: 75,
    proteinGrams: 6.5,
    fatGrams: 5,
    carbGrams: 0.5,
    icon: 'sun',
  },
  {
    id: 'sa_kabsa_rice',
    label: '+ أرز كبسة',
    name: 'Kabsa Rice Portion (أرز كبسة)',
    calories: 180,
    proteinGrams: 4,
    fatGrams: 4,
    carbGrams: 32,
    icon: 'utensils',
  },
];

export const QuickStaplesBar: React.FC<QuickStaplesBarProps> = ({
  onQuickLog,
}) => {
  const { theme, isDark } = useTheme();
  const { activeRegion } = useRegion();
  const isSaudi = activeRegion === 'SA';
  const accentColor = theme.colors.primaryLime;
  const activeTextColor = '#0A0B0D';
  const [justLoggedId, setJustLoggedId] = useState<string | null>(null);

  const staples = isSaudi ? SA_STAPLES : PK_STAPLES;

  const handlePress = (staple: StapleItem) => {
    HapticFeedback.impactLight();
    onQuickLog(staple);
    setJustLoggedId(staple.id);
    setTimeout(() => setJustLoggedId(null), 1800);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          <Icon name="zap" size={13} color={accentColor} />
          <Text style={[styles.heading, { color: theme.colors.textMuted }]}>
            {isSaudi ? 'تسجيل سريع للأكلات الأساسية' : 'QUICK LOG STAPLES'}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {staples.map((staple) => {
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
                  backgroundColor: accentColor,
                  borderColor: accentColor,
                },
              ]}
              onPress={() => handlePress(staple)}
              activeOpacity={0.7}
            >
              <View style={styles.pillContent}>
                <Icon
                  name={isJustLogged ? 'check' : staple.icon}
                  size={12}
                  color={isJustLogged ? activeTextColor : accentColor}
                />
                <Text
                  style={[
                    styles.pillLabel,
                    { color: isJustLogged ? activeTextColor : theme.colors.textPrimary },
                  ]}
                >
                  {isJustLogged ? (isSaudi ? 'تمت الإضافة!' : 'Added!') : staple.label}
                </Text>
                <Text
                  style={[
                    styles.pillKcal,
                    {
                      color: isJustLogged
                        ? (isSaudi ? 'rgba(255,255,255,0.85)' : '#0A0B0D')
                        : theme.colors.textSecondary,
                    },
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
