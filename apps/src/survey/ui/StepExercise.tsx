import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { SurveyExercise, TrainingType, WorkoutIntensity } from '../types.js';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { AppleTextInput } from '../../ui/AppleInput.js';

interface StepExerciseProps {
  data: Partial<SurveyExercise>;
  onChange: (updated: Partial<SurveyExercise>) => void;
  errors: Record<string, string>;
}

// The popular sports differ by market (cricket in Pakistan, padel in Saudi),
// so the label key carries the region while the id stays shared.
const TRAINING_TYPE_IDS: TrainingType[] = [
  'gym_resistance',
  'cardio_running',
  'home_calisthenics',
  'sports_cricket_football',
  'daily_brisk_walking',
  'none',
];

const INTENSITY_IDS: WorkoutIntensity[] = ['light', 'moderate', 'high'];

export const StepExercise: React.FC<StepExerciseProps> = ({
  data,
  onChange,
  errors,
}) => {
  const { theme, isDark: _isDark } = useTheme();
  const { activeRegion } = useRegion();
  const { t } = useTranslation();
  const dir = useTextDirection();
  const accentColor = theme.colors.primaryLime;
  const activeTextColor = '#0A0B0D';
  const trainingTypes = TRAINING_TYPE_IDS.map((id) => ({
    id,
    label: t(`survey.exercise.trainingTypes.${id}.${activeRegion}`),
  }));
  const intensityOptions = INTENSITY_IDS.map((id) => ({
    id,
    label: t(`survey.exercise.intensity.${id}`),
  }));

  return (
    <View style={styles.container}>
      <Text style={[styles.description, dir.text, { color: theme.colors.textSecondary }]}>
        {t('survey.exercise.description')}
      </Text>

      {/* Training Type */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, dir.text, { color: theme.colors.textPrimary }]}>
          {t('survey.exercise.primaryType')}
        </Text>
        <View style={styles.chipGrid}>
          {trainingTypes.map((option) => {
            const isSelected = data.trainingType === option.id;
            return (
              <TouchableOpacity
                key={option.id}
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
                onPress={() => onChange({ trainingType: option.id })}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: theme.colors.textSecondary },
                    isSelected && { color: activeTextColor, fontWeight: '800' },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {errors.trainingType && (
          <Text style={styles.errorText}>{errors.trainingType}</Text>
        )}
      </View>

      {data.trainingType !== 'none' && (
        <>
          {/* Frequency */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, dir.text, { color: theme.colors.textPrimary }]}>
              {t('survey.exercise.frequency')}
            </Text>
            <View style={styles.frequencyRow}>
              {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                const isSelected = data.frequencyDaysPerWeek === num;
                return (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.numBtn,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                      isSelected && {
                        backgroundColor: accentColor,
                        borderColor: accentColor,
                      },
                    ]}
                    onPress={() => onChange({ frequencyDaysPerWeek: num })}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.numText,
                        { color: theme.colors.textSecondary },
                        isSelected && { color: activeTextColor, fontWeight: '800' },
                      ]}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.frequencyDaysPerWeek && (
              <Text style={styles.errorText}>{errors.frequencyDaysPerWeek}</Text>
            )}
          </View>

          {/* Session Duration */}
          <AppleTextInput
            label={t('survey.exercise.sessionDuration')}
            placeholder="e.g. 45"
            keyboardType="numeric"
            value={
              data.sessionDurationMins !== undefined
                ? String(data.sessionDurationMins)
                : ''
            }
            onChangeText={(val) => {
              const num = parseInt(val, 10);
              onChange({ sessionDurationMins: isNaN(num) ? undefined : num });
            }}
            error={errors.sessionDurationMins}
          />

          {/* Intensity */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, dir.text, { color: theme.colors.textPrimary }]}>
              {t('survey.exercise.intensityLabel')}
            </Text>
            <View style={styles.intensityRow}>
              {intensityOptions.map((item) => {
                const isSelected = data.intensity === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.intensityBtn,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                      isSelected && {
                        backgroundColor: accentColor,
                        borderColor: accentColor,
                      },
                    ]}
                    onPress={() => onChange({ intensity: item.id })}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.intensityText,
                        { color: theme.colors.textSecondary },
                        isSelected && { color: activeTextColor, fontWeight: '800' },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </>
      )}
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
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  numBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  numText: {
    fontSize: 15,
    fontWeight: '700',
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  intensityBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  intensityText: {
    fontSize: 13,
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
