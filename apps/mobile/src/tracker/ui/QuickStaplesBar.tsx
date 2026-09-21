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
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { HapticFeedback } from '../../ui/haptics.js';

export interface StapleItem {
  id: string;
  /** Localised short chip label, resolved from the id at render time. */
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

// Source rows carry the nutrition only; the visible label comes from i18n.
type StapleDefinition = Omit<StapleItem, 'label'>;

const PK_STAPLES: StapleDefinition[] = [
  {
    id: 'roti',
    name: 'Roti (Whole Wheat)',
    calories: 120,
    proteinGrams: 4,
    fatGrams: 1,
    carbGrams: 24,
    icon: 'utensils',
  },
  {
    id: 'daal',
    name: 'Daal Chana',
    calories: 160,
    proteinGrams: 9,
    fatGrams: 5,
    carbGrams: 20,
    icon: 'utensils',
  },
  {
    id: 'egg',
    name: 'Boiled Egg',
    calories: 75,
    proteinGrams: 6.5,
    fatGrams: 5,
    carbGrams: 0.5,
    icon: 'sun',
  },
  {
    id: 'chai',
    name: 'Chai (Doodh Patti)',
    calories: 85,
    proteinGrams: 2,
    fatGrams: 3,
    carbGrams: 12,
    icon: 'coffee',
  },
];

const SA_STAPLES: StapleDefinition[] = [
  {
    id: 'sa_tamees',
    name: 'Tamees Bread (خبز تميس)',
    calories: 150,
    proteinGrams: 5,
    fatGrams: 1,
    carbGrams: 35,
    icon: 'utensils',
  },
  {
    id: 'sa_laban',
    name: 'Almarai Laban (لبن المراعي)',
    calories: 120,
    proteinGrams: 8,
    fatGrams: 6,
    carbGrams: 10,
    icon: 'utensils',
  },
  {
    id: 'sa_gahwa',
    name: 'Saudi Gahwa (فنجان قهوة سعودية)',
    calories: 2,
    proteinGrams: 0.1,
    fatGrams: 0,
    carbGrams: 0.5,
    icon: 'coffee',
  },
  {
    id: 'sa_dates',
    name: 'Sukari Dates 3pc (تمر سكري)',
    calories: 75,
    proteinGrams: 0.6,
    fatGrams: 0.2,
    carbGrams: 19,
    icon: 'sun',
  },
  {
    id: 'sa_egg',
    name: 'Boiled Egg (بيض مسلوق)',
    calories: 75,
    proteinGrams: 6.5,
    fatGrams: 5,
    carbGrams: 0.5,
    icon: 'sun',
  },
  {
    id: 'sa_kabsa_rice',
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
  const { t } = useTranslation();
  const dir = useTextDirection();
  const isSaudi = activeRegion === 'SA';
  const accentColor = theme.colors.primaryLime;
  const activeTextColor = '#0A0B0D';
  const [justLoggedId, setJustLoggedId] = useState<string | null>(null);

  // Which staples appear is regional (roti in Pakistan, tamees in Saudi) and
  // only the chip label is translated: `name` is the key the dashboard matches
  // against the food database, so translating it would log the wrong dish.
  const staples: StapleItem[] = (isSaudi ? SA_STAPLES : PK_STAPLES).map((staple) => ({
    ...staple,
    label: t(`tracker.staples.${staple.id}`),
  }));

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
          <Text style={[styles.heading, dir.text, { color: theme.colors.textMuted }]}>
            {t('tracker.staples.heading')}
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
                  {isJustLogged ? t('tracker.staples.added') : staple.label}
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
                  {t('common.kcalValue', { value: staple.calories })}
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
