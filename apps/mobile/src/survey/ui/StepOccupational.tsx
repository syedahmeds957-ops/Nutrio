import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { JobCategory, ShiftPattern, SurveyOccupational } from '../types.js';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { AppleTextInput } from '../../ui/AppleInput.js';

interface StepOccupationalProps {
  data: Partial<SurveyOccupational>;
  onChange: (updated: Partial<SurveyOccupational>) => void;
  errors: Record<string, string>;
}

// Delivery platforms and job examples differ by market, so the subtitle key
// carries the region while the id stays shared.
const JOB_CATEGORY_IDS: JobCategory[] = [
  'desk_sedentary',
  'standing_light',
  'active_walking',
  'heavy_manual_labor',
];

const SHIFT_IDS: ShiftPattern[] = ['regular_day', 'night_shift', 'rotating_shifts'];

export const StepOccupational: React.FC<StepOccupationalProps> = ({
  data,
  onChange,
  errors,
}) => {
  const { theme, isDark } = useTheme();
  const { activeRegion } = useRegion();
  const { t } = useTranslation();
  const dir = useTextDirection();
  const accentColor = theme.colors.primaryLime;
  const activeTextColor = '#0A0B0D';
  const isSaudi = activeRegion === 'SA';
  const jobOptions = JOB_CATEGORY_IDS.map((id) => ({
    id,
    title: t(`survey.occupational.jobs.${id}.title`),
    subtitle: t(`survey.occupational.jobs.${id}.subtitle.${activeRegion}`),
  }));
  const shiftOptions = SHIFT_IDS.map((id) => ({
    id,
    label: t(`survey.occupational.shifts.${id}`),
  }));

  return (
    <View style={styles.container}>
      {Object.keys(errors).length > 0 && (
        <View style={[styles.errorBanner, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2', borderColor: '#EF4444' }]}>
          <Text style={styles.errorBannerText}>
            ⚠️ {errors.jobCategory || errors.dailySittingHours || errors.shiftPattern || t('common.completeRequiredFields')}
          </Text>
        </View>
      )}

      <Text style={[styles.description, dir.text, { color: theme.colors.textSecondary }]}>
        {t(`survey.occupational.description.${activeRegion}`)}
      </Text>

      {/* Job Category */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, dir.text, { color: theme.colors.textPrimary }, errors.jobCategory && styles.labelError]}>
          {t('survey.occupational.workActivityType')} {errors.jobCategory ? t('common.requiredMarker') : ''}
        </Text>
        {jobOptions.map((item) => {
          const isSelected = data.jobCategory === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.cardOption,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
                isSelected && {
                  backgroundColor: isDark
                    ? isSaudi
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(164, 235, 63, 0.12)'
                    : isSaudi
                      ? '#ECFDF5'
                      : '#F7FEE7',
                  borderColor: accentColor,
                  borderWidth: 2,
                },
                errors.jobCategory && !data.jobCategory && styles.cardOptionError,
              ]}
              onPress={() => onChange({ jobCategory: item.id })}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.cardTitle,
                { color: theme.colors.textPrimary },
                isSelected && {
                  color: isDark
                    ? isSaudi
                      ? '#34D399'
                      : theme.colors.primaryLime
                    : isSaudi
                      ? '#065F46'
                      : '#0F172A',
                  fontWeight: '800',
                }
              ]}>
                {item.title}
              </Text>
              <Text style={[styles.cardSubtitle, dir.text, { color: theme.colors.textSecondary }]}>{item.subtitle}</Text>
            </TouchableOpacity>
          );
        })}
        {errors.jobCategory && (
          <Text style={styles.errorText}>{errors.jobCategory}</Text>
        )}
      </View>

      {/* Sitting Hours */}
      <AppleTextInput
        label={t('survey.occupational.sittingHours')}
        placeholder="e.g. 8"
        keyboardType="numeric"
        value={
          data.dailySittingHours !== undefined
            ? String(data.dailySittingHours)
            : ''
        }
        onChangeText={(val) => {
          const num = parseFloat(val);
          onChange({ dailySittingHours: isNaN(num) ? undefined : num });
        }}
        error={errors.dailySittingHours}
      />

      {/* Shift Pattern */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, dir.text, { color: theme.colors.textPrimary }]}>
          {t('survey.occupational.shiftPattern')}
        </Text>
        <View style={styles.chipGrid}>
          {shiftOptions.map((opt) => {
            const isSelected = data.shiftPattern === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.chip,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                  isSelected && {
                    backgroundColor: accentColor,
                    borderColor: accentColor,
                  },
                ]}
                onPress={() => onChange({ shiftPattern: opt.id })}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: theme.colors.textSecondary },
                    isSelected && { color: activeTextColor, fontWeight: '800' },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {errors.shiftPattern && (
          <Text style={styles.errorText}>{errors.shiftPattern}</Text>
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
  errorBanner: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  labelError: {
    color: '#EF4444',
  },
  cardOption: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  cardOptionError: {
    borderColor: '#EF4444',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  chipGrid: {
    gap: 8,
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
