import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { BudgetTierPKR, DietPreference, SurveyPreferencesBudget } from '../types.js';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';

interface StepPreferencesBudgetProps {
  data: Partial<SurveyPreferencesBudget>;
  onChange: (updated: Partial<SurveyPreferencesBudget>) => void;
  errors: Record<string, string>;
}

// Staple foods, retail brands and grocery prices are market specific, so both
// the diet labels and the budget ranges are keyed by region.
const DIET_OPTION_IDS: DietPreference[] = [
  'halal_omnivore',
  'halal_meat_moderate',
  'vegetarian_desi',
  'eggetarian',
  'vegan',
];

const BUDGET_TIER_IDS: BudgetTierPKR[] = [
  'budget_under_3500',
  'standard_3500_7000',
  'premium_above_7000',
];

export const StepPreferencesBudget: React.FC<StepPreferencesBudgetProps> = ({
  data,
  onChange,
  errors,
}) => {
  const { theme, isDark } = useTheme();
  const { activeRegion } = useRegion();
  const { t } = useTranslation();
  const dir = useTextDirection();
  const isSaudi = activeRegion === 'SA';
  const accentColor = theme.colors.primaryLime;
  const activeTextColor = '#0A0B0D';
  const dietOptions = DIET_OPTION_IDS.map((id) => ({
    id,
    label: t(`survey.preferences.diets.${id}.${activeRegion}`),
  }));
  const budgetTiers = BUDGET_TIER_IDS.map((id) => ({
    id,
    title: t(`survey.preferences.budgets.${id}.title`),
    range: t(`survey.preferences.budgets.${id}.range.${activeRegion}`),
  }));

  return (
    <View style={styles.container}>
      <Text style={[styles.description, dir.text, { color: theme.colors.textSecondary }]}>
        {t(`survey.preferences.description.${activeRegion}`)}
      </Text>

      {/* Diet Style */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, dir.text, { color: theme.colors.textPrimary }]}>
          {t('survey.preferences.dietaryPreference')}
        </Text>
        <View style={styles.chipGrid}>
          {dietOptions.map((d) => {
            const isSelected = data.dietPreference === d.id;
            return (
              <TouchableOpacity
                key={d.id}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected
                      ? accentColor
                      : theme.colors.surface,
                    borderColor: isSelected
                      ? accentColor
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
                      color: isSelected ? activeTextColor : theme.colors.textPrimary,
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
        <Text style={[styles.label, dir.text, { color: theme.colors.textPrimary }]}>
          {t(`survey.preferences.budgetLabel.${activeRegion}`)}
        </Text>
        {budgetTiers.map((b) => {
          const isSelected = data.budgetTierPKR === b.id;
          return (
            <TouchableOpacity
              key={b.id}
              style={[
                styles.cardOption,
                {
                  backgroundColor: isSelected
                    ? isDark
                      ? isSaudi
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(164, 235, 63, 0.12)'
                      : isSaudi
                        ? '#ECFDF5'
                        : '#F7FEE7'
                    : theme.colors.surface,
                  borderColor: isSelected
                    ? accentColor
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
                          ? isSaudi
                            ? '#34D399'
                            : theme.colors.primaryLime
                          : isSaudi
                            ? '#065F46'
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
                      { backgroundColor: accentColor },
                    ]}
                  >
                    <Text style={[styles.activePillText, isSaudi && { color: '#FFFFFF' }]}>
                      {t('common.selected')}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.cardSubtitle, dir.text, { color: theme.colors.textSecondary }]}>
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
