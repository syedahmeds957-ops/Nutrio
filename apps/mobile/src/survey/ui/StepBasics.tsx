import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { SurveyBasics } from '../types.js';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';

interface StepBasicsProps {
  data: Partial<SurveyBasics>;
  onChange: (updated: Partial<SurveyBasics>) => void;
  errors: Record<string, string>;
}

export const StepBasics: React.FC<StepBasicsProps> = ({ data, onChange, errors }) => {
  const { theme, isDark } = useTheme();
  const { activeRegion } = useRegion();
  const isSaudi = activeRegion === 'SA';
  const activeColor = isSaudi ? '#10B981' : theme.colors.primaryLime;
  const activeTextColor = isSaudi ? '#FFFFFF' : '#0A0B0D';

  return (
    <View style={styles.container}>
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        These physical metrics are used to calculate your baseline resting metabolic rate (BMR) with clinical precision.
      </Text>

      {/* Biological Sex */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
          Biological Sex (Required for BMR calculation)
        </Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
              data.sex === 'male' && {
                backgroundColor: activeColor,
                borderColor: activeColor,
              },
            ]}
            onPress={() => onChange({ sex: 'male' })}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.toggleText,
                { color: theme.colors.textSecondary },
                data.sex === 'male' && { color: activeTextColor, fontWeight: '800' },
              ]}
            >
              {isSaudi ? 'Male (ذكر)' : 'Male'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleBtn,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
              data.sex === 'female' && {
                backgroundColor: activeColor,
                borderColor: activeColor,
              },
            ]}
            onPress={() => onChange({ sex: 'female' })}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.toggleText,
                { color: theme.colors.textSecondary },
                data.sex === 'female' && { color: activeTextColor, fontWeight: '800' },
              ]}
            >
              {isSaudi ? 'Female (أنثى)' : 'Female'}
            </Text>
          </TouchableOpacity>
        </View>
        {errors.sex && <Text style={styles.errorText}>{errors.sex}</Text>}
      </View>

      {/* Age */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Age (Years)</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.textPrimary,
            },
            errors.ageYears && styles.inputError,
          ]}
          placeholder="e.g. 28"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="numeric"
          value={data.ageYears !== undefined ? String(data.ageYears) : ''}
          onChangeText={(val) => {
            const num = parseInt(val, 10);
            onChange({ ageYears: isNaN(num) ? undefined : num });
          }}
        />
        {errors.ageYears && <Text style={styles.errorText}>{errors.ageYears}</Text>}
      </View>

      {/* Height */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Height (Centimeters)</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.textPrimary,
            },
            errors.heightCm && styles.inputError,
          ]}
          placeholder="e.g. 175"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="numeric"
          value={data.heightCm !== undefined ? String(data.heightCm) : ''}
          onChangeText={(val) => {
            const num = parseFloat(val);
            onChange({ heightCm: isNaN(num) ? undefined : num });
          }}
        />
        {errors.heightCm && <Text style={styles.errorText}>{errors.heightCm}</Text>}
      </View>

      {/* Weight */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Current Weight (Kilograms)</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.textPrimary,
            },
            errors.weightKg && styles.inputError,
          ]}
          placeholder="e.g. 78"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="numeric"
          value={data.weightKg !== undefined ? String(data.weightKg) : ''}
          onChangeText={(val) => {
            const num = parseFloat(val);
            onChange({ weightKg: isNaN(num) ? undefined : num });
          }}
        />
        {errors.weightKg && <Text style={styles.errorText}>{errors.weightKg}</Text>}
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
    fontWeight: '700',
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '700',
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
});
