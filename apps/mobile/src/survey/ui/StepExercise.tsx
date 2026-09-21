import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { SurveyExercise, TrainingType, WorkoutIntensity } from '../types.js';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';
import { AppleTextInput } from '../../ui/AppleInput.js';

interface StepExerciseProps {
  data: Partial<SurveyExercise>;
  onChange: (updated: Partial<SurveyExercise>) => void;
  errors: Record<string, string>;
}

const PK_TRAINING_TYPES: Array<{ id: TrainingType; label: string }> = [
  { id: 'gym_resistance', label: 'Gym / Weightlifting' },
  { id: 'cardio_running', label: 'Running / Jogging' },
  { id: 'home_calisthenics', label: 'Home Bodyweight / Calisthenics' },
  { id: 'sports_cricket_football', label: 'Sports (Cricket / Football)' },
  { id: 'daily_brisk_walking', label: 'Brisk Walking' },
  { id: 'none', label: 'None / Not currently training' },
];

const SA_TRAINING_TYPES: Array<{ id: TrainingType; label: string }> = [
  { id: 'gym_resistance', label: 'Gym / Weightlifting (حديد ولياقة)' },
  { id: 'cardio_running', label: 'Running / Jogging (جري / ركض)' },
  { id: 'home_calisthenics', label: 'Home Bodyweight (تمارين منزلية)' },
  { id: 'sports_cricket_football', label: 'Sports (Football / Padel - كرة قدم / بادل)' },
  { id: 'daily_brisk_walking', label: 'Brisk Walking (مشي سريع)' },
  { id: 'none', label: 'None / Not currently training (لا أتمرن حالياً)' },
];

const PK_INTENSITY_OPTIONS: Array<{ id: WorkoutIntensity; label: string }> = [
  { id: 'light', label: 'Light' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'high', label: 'High Intensity' },
];

const SA_INTENSITY_OPTIONS: Array<{ id: WorkoutIntensity; label: string }> = [
  { id: 'light', label: 'Light (خفيف)' },
  { id: 'moderate', label: 'Moderate (متوسط)' },
  { id: 'high', label: 'High (عالي الشدة)' },
];

export const StepExercise: React.FC<StepExerciseProps> = ({
  data,
  onChange,
  errors,
}) => {
  const { theme, isDark: _isDark } = useTheme();
  const { activeRegion } = useRegion();
  const isSaudi = activeRegion === 'SA';
  const accentColor = theme.colors.primaryLime;
  const activeTextColor = '#0A0B0D';
  const trainingTypes = isSaudi ? SA_TRAINING_TYPES : PK_TRAINING_TYPES;
  const intensityOptions = isSaudi ? SA_INTENSITY_OPTIONS : PK_INTENSITY_OPTIONS;

  return (
    <View style={styles.container}>
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        Tell us about your intentional workouts. This enables our split TDEE model to credit your training accurately.
      </Text>

      {/* Training Type */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Primary Exercise Type</Text>
        <View style={styles.chipGrid}>
          {trainingTypes.map((t) => {
            const isSelected = data.trainingType === t.id;
            return (
              <TouchableOpacity
                key={t.id}
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
                onPress={() => onChange({ trainingType: t.id })}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: theme.colors.textSecondary },
                    isSelected && { color: activeTextColor, fontWeight: '800' },
                  ]}
                >
                  {t.label}
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
            <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Frequency (Days Per Week)</Text>
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
            label={isSaudi ? 'متوسط مدة التمرين (دقائق)' : 'Average Session Duration (Minutes)'}
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
            <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Workout Intensity</Text>
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
