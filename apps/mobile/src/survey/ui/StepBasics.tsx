import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { SurveyBasics } from '../types.js';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';
import { HapticFeedback } from '../../ui/haptics.js';

interface StepBasicsProps {
  data: Partial<SurveyBasics>;
  onChange: (updated: Partial<SurveyBasics>) => void;
  errors: Record<string, string>;
}

export const StepBasics: React.FC<StepBasicsProps> = ({ data, onChange, errors }) => {
  const { theme, isDark } = useTheme();
  const { activeRegion } = useRegion();
  const isSaudi = activeRegion === 'SA';
  const activeColor = theme.colors.primaryLime;
  const activeTextColor = '#0A0B0D';

  const handleSelectSex = (sex: 'male' | 'female') => {
    HapticFeedback.selection();
    onChange({ sex });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        These physical metrics are used to calculate your baseline resting metabolic rate (BMR) with clinical precision.
      </Text>

      {/* 1. Biological Sex: iOS Segmented Pill Control */}
      <View style={styles.sectionBlock}>
        <Text style={[styles.sectionEyebrow, { color: theme.colors.textMuted }]}>
          {isSaudi ? 'الجنس البيولوجي · BIOLOGICAL SEX' : 'BIOLOGICAL SEX (FOR BMR)'}
        </Text>

        <View
          style={[
            styles.segmentedContainer,
            {
              backgroundColor: theme.colors.surfaceSecondary,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              data.sex === 'male' && [
                styles.segmentBtnActive,
                { backgroundColor: activeColor },
              ],
            ]}
            onPress={() => handleSelectSex('male')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Select Male"
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color:
                    data.sex === 'male'
                      ? activeTextColor
                      : theme.colors.textSecondary,
                  fontWeight: data.sex === 'male' ? '800' : '600',
                },
              ]}
            >
              {isSaudi ? 'Male (ذكر)' : 'Male'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              data.sex === 'female' && [
                styles.segmentBtnActive,
                { backgroundColor: activeColor },
              ],
            ]}
            onPress={() => handleSelectSex('female')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Select Female"
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color:
                    data.sex === 'female'
                      ? activeTextColor
                      : theme.colors.textSecondary,
                  fontWeight: data.sex === 'female' ? '800' : '600',
                },
              ]}
            >
              {isSaudi ? 'Female (أنثى)' : 'Female'}
            </Text>
          </TouchableOpacity>
        </View>
        {errors.sex && <Text style={styles.errorText}>{errors.sex}</Text>}
      </View>

      {/* 2. Apple Grouped Inset Card: Physical Measurements */}
      <View style={styles.sectionBlock}>
        <Text style={[styles.sectionEyebrow, { color: theme.colors.textMuted }]}>
          {isSaudi ? 'القياسات البدنية · MEASUREMENTS' : 'BODY MEASUREMENTS'}
        </Text>

        <View
          style={[
            styles.groupedCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {/* Row 1: Age */}
          <View style={styles.formRow}>
            <View style={styles.rowLabelCol}>
              <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>
                {isSaudi ? 'العمر (Age)' : 'Age'}
              </Text>
            </View>

            <View style={styles.rowInputGroup}>
              <TextInput
                style={[
                  styles.numericInput,
                  {
                    color: theme.colors.textPrimary,
                  },
                  errors.ageYears && styles.inputError,
                ]}
                placeholder="28"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
                value={data.ageYears !== undefined ? String(data.ageYears) : ''}
                onChangeText={(val) => {
                  const num = parseInt(val, 10);
                  onChange({ ageYears: isNaN(num) ? undefined : num });
                }}
              />
              <View
                style={[
                  styles.unitBadge,
                  { backgroundColor: theme.colors.surfaceSecondary },
                ]}
              >
                <Text style={[styles.unitText, { color: theme.colors.textMuted }]}>
                  yrs
                </Text>
              </View>
            </View>
          </View>
          {errors.ageYears && <Text style={styles.rowErrorText}>{errors.ageYears}</Text>}

          <View style={[styles.rowDivider, { backgroundColor: theme.colors.border }]} />

          {/* Row 2: Height */}
          <View style={styles.formRow}>
            <View style={styles.rowLabelCol}>
              <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>
                {isSaudi ? 'الطول (Height)' : 'Height'}
              </Text>
            </View>

            <View style={styles.rowInputGroup}>
              <TextInput
                style={[
                  styles.numericInput,
                  {
                    color: theme.colors.textPrimary,
                  },
                  errors.heightCm && styles.inputError,
                ]}
                placeholder="175"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
                value={data.heightCm !== undefined ? String(data.heightCm) : ''}
                onChangeText={(val) => {
                  const num = parseFloat(val);
                  onChange({ heightCm: isNaN(num) ? undefined : num });
                }}
              />
              <View
                style={[
                  styles.unitBadge,
                  { backgroundColor: theme.colors.surfaceSecondary },
                ]}
              >
                <Text style={[styles.unitText, { color: theme.colors.textMuted }]}>
                  cm
                </Text>
              </View>
            </View>
          </View>
          {errors.heightCm && <Text style={styles.rowErrorText}>{errors.heightCm}</Text>}

          <View style={[styles.rowDivider, { backgroundColor: theme.colors.border }]} />

          {/* Row 3: Current Weight */}
          <View style={styles.formRow}>
            <View style={styles.rowLabelCol}>
              <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>
                {isSaudi ? 'الوزن الحالي (Weight)' : 'Current Weight'}
              </Text>
            </View>

            <View style={styles.rowInputGroup}>
              <TextInput
                style={[
                  styles.numericInput,
                  {
                    color: theme.colors.textPrimary,
                  },
                  errors.weightKg && styles.inputError,
                ]}
                placeholder="78"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
                value={data.weightKg !== undefined ? String(data.weightKg) : ''}
                onChangeText={(val) => {
                  const num = parseFloat(val);
                  onChange({ weightKg: isNaN(num) ? undefined : num });
                }}
              />
              <View
                style={[
                  styles.unitBadge,
                  { backgroundColor: theme.colors.surfaceSecondary },
                ]}
              >
                <Text style={[styles.unitText, { color: theme.colors.textMuted }]}>
                  kg
                </Text>
              </View>
            </View>
          </View>
          {errors.weightKg && <Text style={styles.rowErrorText}>{errors.weightKg}</Text>}
        </View>
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
  sectionBlock: {
    marginBottom: 24,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentText: {
    fontSize: 14,
  },
  groupedCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 52,
  },
  rowLabelCol: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  numericInput: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'right',
    minWidth: 60,
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontVariant: ['tabular-nums'],
  },
  unitBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    minWidth: 38,
    alignItems: 'center',
  },
  unitText: {
    fontSize: 12,
    fontWeight: '700',
  },
  rowDivider: {
    height: 1,
    marginLeft: 16,
  },
  inputError: {
    color: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  rowErrorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
});
