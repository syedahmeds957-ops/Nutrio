import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { MedicalConditionFlag, SurveyHealthClinical } from '../types.js';
import { useTheme } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { AppleTextInput } from '../../ui/AppleInput.js';

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
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const dir = useTextDirection();
  const isSaudi = dir.isRTL;
  const isMale = userSex === 'male';
  const accentColor = theme.colors.primaryLime;
  const activeTextColor = '#0A0B0D';
  const currentConditions = data.medicalConditions ?? [];
  const isDisclaimerAccepted = data.medicalDisclaimerAccepted !== false;

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
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
                data.isPregnantOrBreastfeeding === true && {
                  backgroundColor: accentColor,
                  borderColor: accentColor,
                },
              ]}
              onPress={() => onChange({ isPregnantOrBreastfeeding: true })}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: theme.colors.textSecondary },
                  data.isPregnantOrBreastfeeding === true && { color: activeTextColor, fontWeight: '800' },
                ]}
              >
                {t('common.yes')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleBtn,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
                data.isPregnantOrBreastfeeding === false && {
                  backgroundColor: accentColor,
                  borderColor: accentColor,
                },
              ]}
              onPress={() => onChange({ isPregnantOrBreastfeeding: false })}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: theme.colors.textSecondary },
                  data.isPregnantOrBreastfeeding === false && { color: activeTextColor, fontWeight: '800' },
                ]}
              >
                {t('common.no')}
              </Text>
            </TouchableOpacity>
          </View>
          {data.isPregnantOrBreastfeeding && (
            <View style={[styles.warningBox, { backgroundColor: isDark ? 'rgba(234, 179, 8, 0.15)' : '#FEF9C3', borderColor: '#EAB308' }]}>
              <Text style={[styles.warningText, dir.text, { color: isDark ? '#FACC15' : '#854D0E' }]}>
                {t('survey.health.pregnancyWarning')}
              </Text>
            </View>
          )}
          {errors.isPregnantOrBreastfeeding && (
            <Text style={styles.errorText}>{errors.isPregnantOrBreastfeeding}</Text>
          )}
        </View>
      )}

      {/* Medical Conditions */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, dir.text, { color: theme.colors.textPrimary }]}>
          {t('survey.health.diagnosesLabel')}
        </Text>
        <View style={styles.conditionsList}>
          {visibleConditions.map((cond) => {
            const isChecked = currentConditions.includes(cond.id);
            return (
              <TouchableOpacity
                key={cond.id}
                style={[
                  styles.condCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                  isChecked && {
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
                ]}
                onPress={() => toggleCondition(cond.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: theme.colors.surfaceSecondary,
                      borderColor: theme.colors.border,
                    },
                    isChecked && {
                      backgroundColor: accentColor,
                      borderColor: accentColor,
                    },
                  ]}
                >
                  {isChecked && (
                    <Text style={[styles.checkmark, isSaudi && { color: '#FFFFFF' }]}>✓</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.condLabel,
                    { color: theme.colors.textPrimary },
                    isChecked && {
                      color: isDark
                        ? isSaudi
                          ? '#34D399'
                          : theme.colors.primaryLime
                        : isSaudi
                          ? '#065F46'
                          : '#0F172A',
                      fontWeight: '700',
                    },
                  ]}
                >
                  {cond.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {errors.medicalConditions && (
          <Text style={styles.errorText}>{errors.medicalConditions}</Text>
        )}
      </View>

      {/* Medications / Clinical Notes */}
      <AppleTextInput
        label={t('survey.health.medications')}
        placeholder="e.g. Metformin 500mg, insulin, thyroxine"
        value={data.medicationsNotes ?? ''}
        onChangeText={(val) => {
          onChange({ medicationsNotes: val });
        }}
      />

      {/* Safety & Medical Disclaimer */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
          Safety & Medical Disclaimer
        </Text>
        <TouchableOpacity
          style={[
            styles.condCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: errors.medicalDisclaimerAccepted
                ? theme.colors.danger
                : theme.colors.border,
            },
            isDisclaimerAccepted && {
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
          ]}
          onPress={() => onChange({ medicalDisclaimerAccepted: !isDisclaimerAccepted })}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: theme.colors.border,
              },
              isDisclaimerAccepted && {
                backgroundColor: accentColor,
                borderColor: accentColor,
              },
            ]}
          >
            {isDisclaimerAccepted && (
              <Text style={[styles.checkmark, isSaudi && { color: '#FFFFFF' }]}>✓</Text>
            )}
          </View>
          <Text
            style={[
              styles.condLabel,
              {
                color: theme.colors.textPrimary,
                flex: 1,
                fontSize: 13,
                lineHeight: 18,
              },
              isDisclaimerAccepted && {
                color: isDark
                  ? isSaudi
                    ? '#34D399'
                    : theme.colors.primaryLime
                  : isSaudi
                    ? '#065F46'
                    : '#0F172A',
                fontWeight: '700',
              },
            ]}
          >
            {t('survey.health.disclaimer')}
          </Text>
        </TouchableOpacity>
        {errors.medicalDisclaimerAccepted && (
          <Text style={styles.errorText}>{errors.medicalDisclaimerAccepted}</Text>
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
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '700',
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#0A0B0D',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 16,
  },
  condLabel: {
    fontSize: 14,
    flex: 1,
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
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
});
