import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SurveyExercise, TrainingType, WorkoutIntensity } from '../types.js';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { AppleTextInput } from '../../ui/AppleInput.js';
import { OptionButton, OptionGroup } from '../../ui/Selectable.js';

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
  const { theme } = useTheme();
  const { activeRegion } = useRegion();
  const { t } = useTranslation();
  const dir = useTextDirection();
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
      {/* Training Type */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, dir.text, { color: theme.colors.textPrimary }]}>
          {t('survey.exercise.primaryType')}
        </Text>
        <OptionGroup label={t('survey.exercise.primaryType')} style={styles.chipGrid}>
          {trainingTypes.map((option) => (
            <OptionButton
              key={option.id}
              label={option.label}
              selected={data.trainingType === option.id}
              onPress={() => onChange({ trainingType: option.id })}
              style={styles.chip}
              labelStyle={styles.chipText}
            />
          ))}
        </OptionGroup>
        {errors.trainingType && (
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.trainingType}</Text>
        )}
      </View>

      {data.trainingType !== 'none' && (
        <>
          {/* Frequency */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, dir.text, { color: theme.colors.textPrimary }]}>
              {t('survey.exercise.frequency')}
            </Text>
            <OptionGroup label={t('survey.exercise.frequency')} style={styles.frequencyRow}>
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <OptionButton
                  key={num}
                  label={String(num)}
                  selected={data.frequencyDaysPerWeek === num}
                  onPress={() => onChange({ frequencyDaysPerWeek: num })}
                  style={styles.numBtn}
                  labelStyle={styles.numText}
                />
              ))}
            </OptionGroup>
            {errors.frequencyDaysPerWeek && (
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.frequencyDaysPerWeek}</Text>
            )}
          </View>

          {/* Session Duration */}
          <AppleTextInput
            label={t('survey.exercise.sessionDuration')}
            placeholder={t('survey.placeholderExample', { value: 45 })}
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
            <OptionGroup label={t('survey.exercise.intensityLabel')} style={styles.intensityRow}>
              {intensityOptions.map((item) => (
                <OptionButton
                  key={item.id}
                  label={item.label}
                  selected={data.intensity === item.id}
                  onPress={() => onChange({ intensity: item.id })}
                  style={styles.intensityBtn}
                  labelStyle={styles.intensityText}
                />
              ))}
            </OptionGroup>
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
    paddingHorizontal: 16,
  },
  chipText: {
    fontSize: 13,
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: 4,
  },
  numBtn: {
    flex: 1,
    paddingHorizontal: 0,
    borderRadius: 12,
  },
  numText: {
    fontSize: 15,
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  intensityBtn: {
    flex: 1,
    paddingHorizontal: 8,
  },
  intensityText: {
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});
