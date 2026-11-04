import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MedicalConditionFlag, SurveyHealthClinical } from '../types.js';
import { useTheme } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { AppleTextInput } from '../../ui/AppleInput.js';
import { OptionButton, OptionGroup } from '../../ui/Selectable.js';

interface StepHealthClinicalProps {
  data: Partial<SurveyHealthClinical>;
  onChange: (updated: Partial<SurveyHealthClinical>) => void;
  errors: Record<string, string>;
  userSex?: 'male' | 'female';
}

const CONDITION_IDS: MedicalConditionFlag[] = [
  'diabetes_type_2',
  'hypertension',
  'thyroid_hypo',
  'pcos',
  'ckd_renal',
  'none',
];

export const StepHealthClinical: React.FC<StepHealthClinicalProps> = ({
  data,
  onChange,
  errors,
  userSex,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dir = useTextDirection();
  const isMale = userSex === 'male';
  const currentConditions = data.medicalConditions ?? [];
  const isDisclaimerAccepted = data.medicalDisclaimerAccepted === true;

  React.useEffect(() => {
    if (isMale && data.isPregnantOrBreastfeeding) {
      onChange({ isPregnantOrBreastfeeding: false });
    }
  }, [isMale, data.isPregnantOrBreastfeeding]);

  const visibleConditions = (isMale ? CONDITION_IDS.filter((id) => id !== 'pcos') : CONDITION_IDS).map(
    (id) => ({ id, label: t(`survey.health.conditions.${id}`) })
  );

  const toggleCondition = (id: MedicalConditionFlag) => {
    if (id === 'none') {
      onChange({ medicalConditions: ['none'] });
      return;
    }
    const filtered = currentConditions.filter((c) => c !== 'none');
    if (filtered.includes(id)) {
      const remaining = filtered.filter((c) => c !== id);
      onChange({ medicalConditions: remaining.length > 0 ? remaining : ['none'] });
    } else {
      onChange({ medicalConditions: [...filtered, id] });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.description, dir.text, { color: theme.colors.textSecondary }]}>
        {t('survey.health.description')}
      </Text>

      {/* Pregnancy / Lactation (Female only) */}
      {!isMale && (
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, dir.text, { color: theme.colors.textPrimary }]}>
            {t('survey.health.pregnancyQuestion')}
          </Text>
          <OptionGroup label={t('survey.health.pregnancyQuestion')} style={styles.toggleRow}>
            <OptionButton
              label={t('common.yes')}
              selected={data.isPregnantOrBreastfeeding === true}
              onPress={() => onChange({ isPregnantOrBreastfeeding: true })}
              style={styles.toggleBtn}
              labelStyle={styles.toggleText}
            />
            <OptionButton
              label={t('common.no')}
              selected={data.isPregnantOrBreastfeeding === false}
              onPress={() => onChange({ isPregnantOrBreastfeeding: false })}
              style={styles.toggleBtn}
              labelStyle={styles.toggleText}
            />
          </OptionGroup>
          {data.isPregnantOrBreastfeeding && (
            <View style={[styles.warningBox, { backgroundColor: theme.colors.warningLight, borderColor: theme.colors.warningBorder }]}>
              <Text style={[styles.warningText, dir.text, { color: theme.colors.warningText }]}>
                {t('survey.health.pregnancyWarning')}
              </Text>
            </View>
          )}
          {errors.isPregnantOrBreastfeeding && (
            <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.isPregnantOrBreastfeeding}</Text>
          )}
        </View>
      )}

      {/* Medical Conditions */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, dir.text, { color: theme.colors.textPrimary }]}>
          {t('survey.health.diagnosesLabel')}
        </Text>
        <OptionGroup label={t('survey.health.diagnosesLabel')} mode="toggle" style={styles.conditionsList}>
          {visibleConditions.map((cond) => (
            <OptionButton
              key={cond.id}
              label={cond.label}
              mode="toggle"
              check="inline"
              selected={currentConditions.includes(cond.id)}
              onPress={() => toggleCondition(cond.id)}
              style={styles.condCard}
              labelStyle={styles.condLabel}
            />
          ))}
        </OptionGroup>
        {errors.medicalConditions && (
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.medicalConditions}</Text>
        )}
      </View>

      {/* Medications / Clinical Notes */}
      <AppleTextInput
        label={t('survey.health.medications')}
        placeholder={t('survey.health.medicationsPlaceholder')}
        value={data.medicationsNotes ?? ''}
        onChangeText={(val) => {
          onChange({ medicationsNotes: val });
        }}
      />

      {/* Safety & Medical Disclaimer */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
          {t('survey.health.disclaimerTitle')}
        </Text>
        <OptionButton
          label={t('survey.health.disclaimer')}
          mode="toggle"
          check="inline"
          selected={isDisclaimerAccepted}
          onPress={() => onChange({ medicalDisclaimerAccepted: !isDisclaimerAccepted })}
          style={[
            styles.condCard,
            errors.medicalDisclaimerAccepted && !isDisclaimerAccepted && { borderColor: theme.colors.danger },
          ]}
          labelStyle={styles.disclaimerLabel}
        />
        {errors.medicalDisclaimerAccepted && (
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.medicalDisclaimerAccepted}</Text>
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
    fontWeight: '700',
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
  },
  toggleText: {
    fontSize: 15,
  },
  warningBox: {
    marginTop: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  warningText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  conditionsList: {
    gap: 8,
  },
  condCard: {
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  condLabel: {
    fontSize: 14,
  },
  disclaimerLabel: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
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
