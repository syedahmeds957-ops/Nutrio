import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { ComputedUserPlan } from '../types.js';
import { useTheme } from '../../theme.js';

interface PlanRevealViewProps {
  plan: ComputedUserPlan;
  onAcceptPlan: () => void;
  onAdjustGoal: () => void;
}

export const PlanRevealView: React.FC<PlanRevealViewProps> = ({
  plan,
  onAcceptPlan,
  onAdjustGoal,
}) => {
  const { theme } = useTheme();
  const { targetResult, macros, userContext, goalSelection } = plan;

  const signedDelta = targetResult.appliedDelta;
  const isDeficit = signedDelta < 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.canvas }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.badgeSuccess,
            {
              backgroundColor: theme.isDark ? '#1C2608' : '#F4FED0',
              borderColor: theme.colors.primaryLime,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeSuccessText,
              { color: theme.isDark ? theme.colors.primaryLime : '#465A00' },
            ]}
          >
            Clinical Formulation Complete
          </Text>
        </View>

        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Your Personalized Targets
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Formulated deterministically from your biometric metrics, Mifflin-St Jeor TDEE, and cultural levers.
        </Text>
      </View>

      {/* Hero Calorie Card - Solid Lime Revolut/Ronasit Style */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: theme.colors.heroCardBg, // Solid Lime #D4FF00
            borderColor: theme.colors.primaryLime,
          },
        ]}
      >
        <View style={styles.heroTopRow}>
          <Text style={[styles.heroLabel, { color: theme.colors.limeText }]}>
            DAILY TARGET
          </Text>
          <View style={styles.heroStatusDot} />
        </View>

        <Text style={[styles.heroValue, { color: theme.colors.limeText }]}>
          {targetResult.kcalTarget.toLocaleString()}
        </Text>
        <Text style={[styles.heroUnit, { color: theme.colors.limeText }]}>
          calories / day
        </Text>

        <View style={styles.deltaBox}>
          <Text style={styles.deltaText}>
            {isDeficit
              ? `⚡ ${Math.abs(signedDelta)} kcal deficit from maintenance (${userContext.tdee} kcal)`
              : signedDelta > 0
              ? `⚡ +${signedDelta} kcal surplus above maintenance (${userContext.tdee} kcal)`
              : `⚖️ Matched to maintenance TDEE (${userContext.tdee} kcal)`}
          </Text>
        </View>
      </View>

      {/* Macro Split Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.cardHeader, { color: theme.colors.textPrimary }]}>
          Daily Macronutrient Breakdown
        </Text>

        <View style={styles.macroRow}>
          {/* Protein */}
          <View
            style={[
              styles.macroCard,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: theme.colors.border,
                borderTopColor: theme.colors.protein,
              },
            ]}
          >
            <Text style={[styles.macroName, { color: theme.colors.textSecondary }]}>Protein</Text>
            <Text style={[styles.macroValue, { color: theme.colors.textPrimary }]}>
              {macros.proteinGrams}g
            </Text>
            <Text style={[styles.macroSub, { color: theme.colors.textMuted }]}>
              {macros.proteinKcal} kcal ({macros.proteinPct}%)
            </Text>
          </View>

          {/* Carbs */}
          <View
            style={[
              styles.macroCard,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: theme.colors.border,
                borderTopColor: theme.colors.carbs,
              },
            ]}
          >
            <Text style={[styles.macroName, { color: theme.colors.textSecondary }]}>Carbs</Text>
            <Text style={[styles.macroValue, { color: theme.colors.textPrimary }]}>
              {macros.carbGrams}g
            </Text>
            <Text style={[styles.macroSub, { color: theme.colors.textMuted }]}>
              {macros.carbKcal} kcal ({macros.carbPct}%)
            </Text>
          </View>

          {/* Fat */}
          <View
            style={[
              styles.macroCard,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: theme.colors.border,
                borderTopColor: theme.colors.fat,
              },
            ]}
          >
            <Text style={[styles.macroName, { color: theme.colors.textSecondary }]}>Fat</Text>
            <Text style={[styles.macroValue, { color: theme.colors.textPrimary }]}>
              {macros.fatGrams}g
            </Text>
            <Text style={[styles.macroSub, { color: theme.colors.textMuted }]}>
              {macros.fatKcal} kcal ({macros.fatPct}%)
            </Text>
          </View>
        </View>

        {/* Micronutrients / Essentials */}
        <View style={[styles.subMacroRow, { borderTopColor: theme.colors.border }]}>
          <View style={styles.subMacroItem}>
            <Text style={[styles.subMacroLabel, { color: theme.colors.textMuted }]}>
              Daily Fibre:
            </Text>
            <Text style={[styles.subMacroValue, { color: theme.colors.textPrimary }]}>
              {macros.fibreGrams}g
            </Text>
          </View>
          <View style={styles.subMacroItem}>
            <Text style={[styles.subMacroLabel, { color: theme.colors.textMuted }]}>
              Hydration:
            </Text>
            <Text style={[styles.subMacroValue, { color: theme.colors.textPrimary }]}>
              {(macros.waterMl / 1000).toFixed(1)} L
            </Text>
          </View>
        </View>
      </View>

      {/* Clinical Safeguards Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.cardHeader, { color: theme.colors.textPrimary }]}>
          Clinical Safety Safeguards
        </Text>

        <View style={styles.safeguardItem}>
          <View style={[styles.safeguardIconCircle, { backgroundColor: theme.colors.surfaceSecondary }]}>
            <Text style={[styles.safeguardIcon, { color: theme.colors.primaryLime }]}>✓</Text>
          </View>
          <Text style={[styles.safeguardText, { color: theme.colors.textPrimary }]}>
            Target strictly exceeds resting BMR floor ({userContext.bmr} kcal).
          </Text>
        </View>

        <View style={styles.safeguardItem}>
          <View style={[styles.safeguardIconCircle, { backgroundColor: theme.colors.surfaceSecondary }]}>
            <Text style={[styles.safeguardIcon, { color: theme.colors.primaryLime }]}>✓</Text>
          </View>
          <Text style={[styles.safeguardText, { color: theme.colors.textPrimary }]}>
            Caloric deficit safely capped at 25% of TDEE to prevent muscle catabolism.
          </Text>
        </View>

        <View style={styles.safeguardItem}>
          <View style={[styles.safeguardIconCircle, { backgroundColor: theme.colors.surfaceSecondary }]}>
            <Text style={[styles.safeguardIcon, { color: theme.colors.primaryLime }]}>✓</Text>
          </View>
          <Text style={[styles.safeguardText, { color: theme.colors.textPrimary }]}>
            Hormonal fat floor preserved (&ge;0.6 g/kg & &ge;20% kcal).
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[
            styles.adjustBtn,
            {
              backgroundColor: theme.colors.surfaceSecondary,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={onAdjustGoal}
          activeOpacity={0.7}
        >
          <Text style={[styles.adjustBtnText, { color: theme.colors.textPrimary }]}>
            Adjust Goal
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.acceptBtn, { backgroundColor: theme.colors.primaryLime }]}
          onPress={onAcceptPlan}
          activeOpacity={0.8}
        >
          <Text style={[styles.acceptBtnText, { color: theme.colors.limeText }]}>
            Accept & Launch Tracker →
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 20,
  },
  badgeSuccess: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 9999,
    alignSelf: 'flex-start',
    marginBottom: 10,
    borderWidth: 1,
  },
  badgeSuccessText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
    fontWeight: '500',
  },
  heroCard: {
    borderRadius: 26,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0A0B0D',
  },
  heroValue: {
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: -1.5,
    marginTop: 6,
    lineHeight: 56,
  },
  heroUnit: {
    fontSize: 14,
    fontWeight: '700',
    opacity: 0.8,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  deltaBox: {
    marginTop: 18,
    backgroundColor: '#0A0B0D',
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  deltaText: {
    color: '#D4FF00',
    fontSize: 12,
    fontWeight: '800',
  },
  card: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 16,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 10,
  },
  macroCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderTopWidth: 3,
    borderWidth: 1,
  },
  macroName: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  macroValue: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: -0.4,
  },
  macroSub: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  subMacroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  subMacroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subMacroLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  subMacroValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  safeguardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  safeguardIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeguardIcon: {
    fontSize: 14,
    fontWeight: '900',
  },
  safeguardText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    flex: 1,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  adjustBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  adjustBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  acceptBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
