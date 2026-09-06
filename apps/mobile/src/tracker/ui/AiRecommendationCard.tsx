import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../theme.js';
import { Icon } from '../../ui/Icon.js';

export interface RecommendedFood {
  name: string;
  calories: number;
  proteinGrams: number;
  fatGrams: number;
  carbGrams: number;
}

interface AiRecommendationCardProps {
  remainingCalories: number;
  remainingProtein: number;
  onLogRecommendation: (items: RecommendedFood[]) => void;
  onAskCoach?: () => void;
}

export const AiRecommendationCard: React.FC<AiRecommendationCardProps> = ({
  remainingCalories,
  remainingProtein: _remainingProtein,
  onLogRecommendation,
  onAskCoach,
}) => {
  const { theme, isDark } = useTheme();
  const [logged, setLogged] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Compute recommendation based on remaining calories & protein
  let title = 'Chicken Tikka Plate';
  let subtitle = 'Chicken Tikka Boti (150g) + 1 Whole Wheat Roti + Mint Raita';
  let rationale = `Matches your remaining ${remainingCalories} kcal with high protein to reach target.`;
  let items: RecommendedFood[] = [
    { name: 'Chicken Tikka Boti', calories: 280, proteinGrams: 35, fatGrams: 7, carbGrams: 2 },
    { name: 'Roti (Whole Wheat)', calories: 120, proteinGrams: 4, fatGrams: 1, carbGrams: 24 },
    { name: 'Mint Raita', calories: 60, proteinGrams: 3, fatGrams: 2, carbGrams: 6 },
  ];

  if (remainingCalories < 250) {
    title = 'Light Protein Snack';
    subtitle = '1 Boiled Egg + Fresh Cucumber Lemon Salad';
    rationale = `Protects calorie deficit with ~140 kcal while adding 8g clean protein.`;
    items = [
      { name: 'Boiled Egg', calories: 75, proteinGrams: 6.5, fatGrams: 5, carbGrams: 0.5 },
      { name: 'Cucumber Salad with Lemon', calories: 35, proteinGrams: 1.5, fatGrams: 0.2, carbGrams: 7 },
    ];
  } else if (remainingCalories < 420) {
    title = 'Comfort Desi Daal & Roti';
    subtitle = '1 Katori Daal Chana + 1 Whole Wheat Roti';
    rationale = `Satisfying fiber and plant protein fitting cleanly within ${remainingCalories} kcal.`;
    items = [
      { name: 'Daal Chana', calories: 160, proteinGrams: 9, fatGrams: 5, carbGrams: 20 },
      { name: 'Roti (Whole Wheat)', calories: 120, proteinGrams: 4, fatGrams: 1, carbGrams: 24 },
    ];
  }

  const totalKcal = items.reduce((s, i) => s + i.calories, 0);
  const totalProtein = items.reduce((s, i) => s + i.proteinGrams, 0);

  const handleLog = () => {
    onLogRecommendation(items);
    setLogged(true);
    setTimeout(() => setLogged(false), 3000);
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Header Badge */}
      <View style={styles.headerRow}>
        <View
          style={[
            styles.badgeRow,
            {
              backgroundColor: theme.colors.surfaceSecondary,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Icon name="sparkles" size={13} color={theme.colors.primaryLime} />
          <Text style={[styles.badgeText, { color: theme.colors.primaryLime }]}>
            AI COACH DAILY BITE
          </Text>
        </View>

        {onAskCoach && (
          <TouchableOpacity
            style={[
              styles.coachPill,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={onAskCoach}
            activeOpacity={0.7}
          >
            <View style={styles.coachBtnRow}>
              <Icon name="coach" size={12} color={theme.colors.textPrimary} />
              <Text style={[styles.coachPillText, { color: theme.colors.textPrimary }]}>
                Ask Coach
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestion Info */}
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
      <Text style={[styles.rationale, { color: theme.colors.textMuted }]}>{rationale}</Text>

      {/* Macro Pills & Action Row */}
      <View style={[styles.footerRow, { borderTopColor: theme.colors.border }]}>
        <View style={styles.macroPills}>
          <View
            style={[
              styles.macroPill,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Icon name="flame" size={11} color="#EF4444" />
            <Text style={[styles.macroVal, { color: theme.colors.textSecondary }]}>
              {totalKcal} kcal
            </Text>
          </View>
          <View
            style={[
              styles.macroPill,
              {
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
                borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE',
              },
            ]}
          >
            <Icon name="zap" size={11} color="#3B82F6" />
            <Text style={[styles.macroVal, { color: '#3B82F6' }]}>{totalProtein}g protein</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.logBtn,
            { backgroundColor: theme.colors.primaryLime },
            logged && { backgroundColor: '#10B981' },
          ]}
          onPress={handleLog}
          activeOpacity={0.8}
        >
          <View style={styles.btnContent}>
            <Icon name={logged ? 'check' : 'plus'} size={13} color="#0A0B0D" />
            <Text style={styles.logBtnText}>
              {logged ? 'Logged!' : '+ Log Suggestion'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  coachPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
    borderWidth: 1,
  },
  coachBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coachPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  rationale: {
    fontSize: 11,
    marginBottom: 14,
    lineHeight: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  macroPills: {
    flexDirection: 'row',
    gap: 6,
  },
  macroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 9999,
    borderWidth: 1,
  },
  macroVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  logBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 9999,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0A0B0D',
  },
});
