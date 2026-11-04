import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SurveyBasics } from '../types.js';
import { useTheme } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { HapticFeedback } from '../../ui/haptics.js';
import { AppleGroupedRowInput } from '../../ui/AppleInput.js';
import { OptionButton, OptionGroup } from '../../ui/Selectable.js';

interface StepBasicsProps {
  data: Partial<SurveyBasics>;
  onChange: (updated: Partial<SurveyBasics>) => void;
  errors: Record<string, string>;
}

export const StepBasics: React.FC<StepBasicsProps> = ({ data, onChange, errors }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dir = useTextDirection();

  const handleSelectSex = (sex: 'male' | 'female') => {
    HapticFeedback.selection();
    onChange({ sex });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        {t('survey.basics.description')}
      </Text>

      {/* 1. Biological Sex: iOS Segmented Pill Control */}
      <View style={styles.sectionBlock}>
        <Text style={[styles.sectionEyebrow, dir.text, { color: theme.colors.textMuted }]}>
          {t('survey.basics.sexEyebrow')}
        </Text>

        <OptionGroup label={t('survey.basics.sexEyebrow')} style={styles.segmentedRow}>
          {(['male', 'female'] as const).map((sex) => (
            <OptionButton
              key={sex}
              label={t(`survey.basics.${sex}`)}
              selected={data.sex === sex}
              onPress={() => handleSelectSex(sex)}
              style={[styles.segmentBtn, errors.sex && !data.sex && { borderColor: theme.colors.danger }]}
            />
          ))}
        </OptionGroup>
        {errors.sex && <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.sex}</Text>}
      </View>

      {/* 2. Apple Grouped Inset Card: Physical Measurements */}
      <View style={styles.sectionBlock}>
        <Text style={[styles.sectionEyebrow, dir.text, { color: theme.colors.textMuted }]}>
          {t('survey.basics.measurementsEyebrow')}
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
          <AppleGroupedRowInput
            label={t('survey.basics.age')}
            unit={t('survey.basics.unitYears')}
            placeholder={t('survey.placeholderExample', { value: 28 })}
            keyboardType="numeric"
            value={data.ageYears !== undefined ? String(data.ageYears) : ''}
            onChangeText={(val) => {
              const num = parseInt(val, 10);
              onChange({ ageYears: isNaN(num) ? undefined : num });
            }}
            error={errors.ageYears}
          />

          <View style={[styles.rowDivider, { backgroundColor: theme.colors.border }]} />

          {/* Row 2: Height */}
          <AppleGroupedRowInput
            label={t('survey.basics.height')}
            unit={t('survey.basics.unitCm')}
            placeholder={t('survey.placeholderExample', { value: 170 })}
            keyboardType="numeric"
            value={data.heightCm !== undefined ? String(data.heightCm) : ''}
            onChangeText={(val) => {
              const num = parseFloat(val);
              onChange({ heightCm: isNaN(num) ? undefined : num });
            }}
            error={errors.heightCm}
          />

          <View style={[styles.rowDivider, { backgroundColor: theme.colors.border }]} />

          {/* Row 3: Current Weight */}
          <AppleGroupedRowInput
            label={t('survey.basics.weight')}
            unit={t('survey.basics.unitKg')}
            placeholder={t('survey.placeholderExample', { value: 78 })}
            keyboardType="numeric"
            value={data.weightKg !== undefined ? String(data.weightKg) : ''}
            onChangeText={(val) => {
              const num = parseFloat(val);
              onChange({ weightKg: isNaN(num) ? undefined : num });
            }}
            error={errors.weightKg}
          />
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
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    marginStart: 4,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
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
    marginStart: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    marginStart: 4,
  },
});
