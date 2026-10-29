import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { JobCategory, SurveyOccupational } from '../types.js';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { AppleTextInput } from '../../ui/AppleInput.js';
import { OptionButton, OptionGroup } from '../../ui/Selectable.js';

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

export const StepOccupational: React.FC<StepOccupationalProps> = ({
  data,
  onChange,
  errors,
}) => {
  const { theme } = useTheme();
  const { activeRegion } = useRegion();
  const { t } = useTranslation();
  const dir = useTextDirection();
  const jobOptions = JOB_CATEGORY_IDS.map((id) => ({
    id,
    title: t(`survey.occupational.jobs.${id}.title`),
    subtitle: t(`survey.occupational.jobs.${id}.subtitle.${activeRegion}`),
  }));

  return (
    <View style={styles.container}>
      <Text style={[styles.description, dir.text, { color: theme.colors.textSecondary }]}>
        {t(`survey.occupational.description.${activeRegion}`)}
      </Text>

      {/* Job Category */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, dir.text, { color: theme.colors.textPrimary }, errors.jobCategory && { color: theme.colors.danger }]}>
          {t('survey.occupational.workActivityType')} {errors.jobCategory ? t('common.requiredMarker') : ''}
        </Text>
        <OptionGroup label={t('survey.occupational.workActivityType')}>
          {jobOptions.map((item) => (
            <OptionButton
              key={item.id}
              label={item.title}
              accessibilityLabel={`${item.title}. ${item.subtitle}`}
              selected={data.jobCategory === item.id}
              onPress={() => onChange({ jobCategory: item.id })}
              style={[
                styles.cardOption,
                errors.jobCategory && !data.jobCategory && { borderColor: theme.colors.danger },
              ]}
            >
              {(colors) => (
                <>
                  <Text style={[styles.cardTitle, dir.text, colors.text]}>{item.title}</Text>
                  <Text style={[styles.cardSubtitle, dir.text, colors.sub]}>{item.subtitle}</Text>
                </>
              )}
            </OptionButton>
          ))}
        </OptionGroup>
        {errors.jobCategory && (
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.jobCategory}</Text>
        )}
      </View>

      {/* Sitting Hours */}
      <AppleTextInput
        label={t('survey.occupational.sittingHours')}
        placeholder={t('survey.placeholderExample', { value: 8 })}
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
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardOption: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
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
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});
