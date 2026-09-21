import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { MedicalConditionFlag, SurveyHealthClinical } from '../types.js';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';
import { AppleTextInput } from '../../ui/AppleInput.js';

interface StepHealthClinicalProps {
  data: Partial<SurveyHealthClinical>;
  onChange: (updated: Partial<SurveyHealthClinical>) => void;
  errors: Record<string, string>;
  userSex?: 'male' | 'female';
}

const CONDITIONS: Array<{ id: MedicalConditionFlag; label: string }> = [
  { id: 'diabetes_type_2', label: 'Type 2 Diabetes / Pre-diabetes' },
  { id: 'hypertension', label: 'Hypertension (High Blood Pressure)' },
  { id: 'thyroid_hypo', label: 'Hypothyroidism' },
  { id: 'pcos', label: 'PCOS / Hormonal Imbalance' },
  { id: 'ckd_renal', label: 'Kidney / Renal Condition' },
  { id: 'none', label: 'None of the above' },
];

export const StepHealthClinical: React.FC<StepHealthClinicalProps> = ({
  data,
  onChange,
  errors,
  userSex,
}) => {
  const { theme, isDark } = useTheme();
  const { activeRegion } = useRegion();
  const isSaudi = activeRegion === 'SA';
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

  const visibleConditions = isMale
    ? CONDITIONS.filter((c) => c.id !== 'pcos')
    : CONDITIONS;

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
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        Your safety is non-negotiable. Medical conditions adjust your safety floors and prevent unsafe caloric restrictions.
      </Text>

      {/* Pregnancy / Lactation (Female only) */}
      {!isMale && (
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
            {isSaudi
              ? 'هل أنتِ حامل أو مرضع حالياً؟'
              : 'Are you pregnant or currently breastfeeding?'}
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
                {isSaudi ? 'Yes (نعم)' : 'Yes'}
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
                {isSaudi ? 'No (لا)' : 'No'}
              </Text>
            </TouchableOpacity>
          </View>
          {data.isPregnantOrBreastfeeding && (
            <View style={[styles.warningBox, { backgroundColor: isDark ? 'rgba(234, 179, 8, 0.15)' : '#FEF9C3', borderColor: '#EAB308' }]}>
              <Text style={[styles.warningText, { color: isDark ? '#FACC15' : '#854D0E' }]}>
                🛡️ Note: Caloric restriction is clinically disabled during pregnancy and active lactation. Your plan will be set to nourishing maintenance only.
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
        <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
          Known Medical & Health Diagnoses
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
        label={isSaudi ? 'الأدوية أو الملاحظات الطبية (اختياري)' : 'Medications or Clinical Notes (Optional)'}
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
            I acknowledge that Nutrio provides algorithmic nutritional guidance and is not a substitute for clinical diagnosis or prescription by a physician.
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
