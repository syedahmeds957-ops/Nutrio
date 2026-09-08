import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { BudgetTierPKR, DietPreference, SurveyPreferencesBudget } from '../types.js';
import { useTheme } from '../../theme.js';

interface StepPreferencesBudgetProps {
  data: Partial<SurveyPreferencesBudget>;
  onChange: (updated: Partial<SurveyPreferencesBudget>) => void;
  errors: Record<string, string>;
}

const DIET_OPTIONS: Array<{ id: DietPreference; label: string }> = [
  { id: 'halal_omnivore', label: 'Halal Omnivore (Chicken, Beef, Mutton, Daal, Veg)' },
  { id: 'halal_meat_moderate', label: 'Moderate Meat (Poultry/Fish 2-3x a week)' },
  { id: 'vegetarian_desi', label: 'Desi Vegetarian (Daal, Paneer, Sabzi, Roti)' },
  { id: 'eggetarian', label: 'Eggetarian (Vegetarian + Eggs)' },
  { id: 'vegan', label: 'Strict Plant-Based / Vegan' },
];

const BUDGET_TIERS: Array<{ id: BudgetTierPKR; title: string; range: string }> = [
  {
    id: 'budget_under_3500',
    title: 'Economical Desi Tier',
    range: 'Under PKR 3,500 / week (Focus on seasonal sabzi, daal, eggs, local grains)',
  },
  {
    id: 'standard_3500_7000',
    title: 'Balanced Household Tier',
    range: 'PKR 3,500 – 7,000 / week (Chicken, dairy, yogurt, mixed meat/veg)',
  },
  {
    id: 'premium_above_7000',
    title: 'High-Protein / Premium Tier',
    range: 'Above PKR 7,000 / week (Daily lean meats, fish, premium nuts, protein additions)',
  },
];

export const StepPreferencesBudget: React.FC<StepPreferencesBudgetProps> = ({
  data,
  onChange,
  errors,
}) => {
  const { theme, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        Tailoring your nutritional plan to your dietary ethos and realistic household grocery expenditure in Pakistan.
      </Text>

      {/* Diet Style */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Dietary Preference</Text>
        <View style={styles.chipGrid}>
          {DIET_OPTIONS.map((d) => {
            const isSelected = data.dietPreference === d.id;
            return (
              <TouchableOpacity
                key={d.id}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.primaryLime
                      : theme.colors.surface,
                    borderColor: isSelected
                      ? theme.colors.primaryLime
                      : theme.colors.border,
                  },
                ]}
                onPress={() => onChange({ dietPreference: d.id })}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: isSelected ? '#0A0B0D' : theme.colors.textPrimary,
                      fontWeight: isSelected ? '800' : '600',
                    },
                  ]}
                >
                  {d.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {errors.dietPreference && (
          <Text style={styles.errorText}>{errors.dietPreference}</Text>
        )}
      </View>

      {/* Budget Tier */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
          Weekly Grocery Budget Target (PKR)
        </Text>
        {BUDGET_TIERS.map((b) => {
          const isSelected = data.budgetTierPKR === b.id;
          return (
            <TouchableOpacity
              key={b.id}
              style={[
                styles.cardOption,
                {
                  backgroundColor: isSelected
                    ? isDark
                      ? 'rgba(164, 235, 63, 0.12)'
                      : '#F7FEE7'
                    : theme.colors.surface,
                  borderColor: isSelected
                    ? theme.colors.primaryLime
                    : theme.colors.border,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              onPress={() => onChange({ budgetTierPKR: b.id })}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <Text
                  style={[
                    styles.cardTitle,
                    {
                      color: isSelected
                        ? isDark
                          ? theme.colors.primaryLime
                          : '#1E293B'
                        : theme.colors.textPrimary,
                    },
                  ]}
                >
                  {b.title}
                </Text>
                {isSelected && (
                  <View
                    style={[
                      styles.activePill,
                      { backgroundColor: theme.colors.primaryLime },
                    ]}
                  >
                    <Text style={styles.activePillText}>SELECTED</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                {b.range}
              </Text>
            </TouchableOpacity>
          );
        })}
        {errors.budgetTierPKR && (
          <Text style={styles.errorText}>{errors.budgetTierPKR}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  chipGrid: {
    gap: 8,
  },
  chip: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
  },
  cardOption: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0A0B0D',
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
});
