import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { JobCategory, ShiftPattern, SurveyOccupational } from '../types.js';
import { useTheme } from '../../theme.js';

interface StepOccupationalProps {
  data: Partial<SurveyOccupational>;
  onChange: (updated: Partial<SurveyOccupational>) => void;
  errors: Record<string, string>;
}

const JOB_OPTIONS: Array<{ id: JobCategory; title: string; subtitle: string }> = [
  {
    id: 'desk_sedentary',
    title: 'Desk / Sedentary',
    subtitle: 'Software, corporate, customer support, remote desk work',
  },
  {
    id: 'standing_light',
    title: 'Standing / Teaching / Retail',
    subtitle: 'Shop staff, teachers, salon workers, pharmacists',
  },
  {
    id: 'active_walking',
    title: 'Active / Walking / Delivery',
    subtitle: 'Riders (Bykea/Foodpanda), waiters, healthcare nurses',
  },
  {
    id: 'heavy_manual_labor',
    title: 'Heavy Manual Labour',
    subtitle: 'Construction, factory floor, agriculture, warehouse loading',
  },
];

const SHIFT_OPTIONS: Array<{ id: ShiftPattern; label: string }> = [
  { id: 'regular_day', label: 'Day Shift (9 to 5)' },
  { id: 'night_shift', label: 'Night Shift (US/UK support)' },
  { id: 'rotating_shifts', label: 'Rotating Shifts' },
];

export const StepOccupational: React.FC<StepOccupationalProps> = ({
  data,
  onChange,
  errors,
}) => {
  const { theme, isDark } = useTheme();

  return (
    <View style={styles.container}>
      {Object.keys(errors).length > 0 && (
        <View style={[styles.errorBanner, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2', borderColor: '#EF4444' }]}>
          <Text style={styles.errorBannerText}>
            ⚠️ {errors.jobCategory || errors.dailySittingHours || errors.shiftPattern || 'Please complete all required fields.'}
          </Text>
        </View>
      )}

      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        Your daily job accounts for most non-exercise calories (NEAT). A desk worker burns very differently from a Lahore rider.
      </Text>

      {/* Job Category */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.colors.textPrimary }, errors.jobCategory && styles.labelError]}>
          Work Activity Type {errors.jobCategory ? '*(Required)' : ''}
        </Text>
        {JOB_OPTIONS.map((item) => {
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
                  backgroundColor: isDark ? 'rgba(164, 235, 63, 0.12)' : '#F7FEE7',
                  borderColor: theme.colors.primaryLime,
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
                isSelected && { color: isDark ? theme.colors.primaryLime : '#0F172A', fontWeight: '800' }
              ]}>
                {item.title}
              </Text>
              <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>{item.subtitle}</Text>
            </TouchableOpacity>
          );
        })}
        {errors.jobCategory && (
          <Text style={styles.errorText}>{errors.jobCategory}</Text>
        )}
      </View>

      {/* Sitting Hours */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Daily Sitting Hours</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.textPrimary,
            },
            errors.dailySittingHours && styles.inputError,
          ]}
          placeholder="e.g. 8"
          placeholderTextColor={theme.colors.textMuted}
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
        />
        {errors.dailySittingHours && (
          <Text style={styles.errorText}>{errors.dailySittingHours}</Text>
        )}
      </View>

      {/* Shift Pattern */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Work Shift Pattern</Text>
        <View style={styles.chipGrid}>
          {SHIFT_OPTIONS.map((opt) => {
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
                    backgroundColor: theme.colors.primaryLime,
                    borderColor: theme.colors.primaryLime,
                  },
                ]}
                onPress={() => onChange({ shiftPattern: opt.id })}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: theme.colors.textSecondary },
                    isSelected && { color: '#0A0B0D', fontWeight: '800' },
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
