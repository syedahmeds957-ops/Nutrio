import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SurveyLifestyleDesi } from '../types.js';
import { ritualCupKcal } from '../../common/ritualDrinks.js';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { useFormat } from '../../i18n/useFormat.js';

interface StepLifestyleDesiProps {
  data: Partial<SurveyLifestyleDesi>;
  onChange: (updated: Partial<SurveyLifestyleDesi>) => void;
  errors: Record<string, string>;
}

export const StepLifestyleDesi: React.FC<StepLifestyleDesiProps> = ({
  data,
  onChange,
  errors,
}) => {
  const { theme } = useTheme();
  const { activeRegion } = useRegion();
  const { t } = useTranslation();
  const { formatNumber } = useFormat();
  const dir = useTextDirection();
  const isSaudi = activeRegion === 'SA';
  const accentColor = theme.colors.primaryLime;
  const chaiCount = data.chaiWithSugarCupsPerDay ?? 2;
  const estimatedChaiKcal = chaiCount * ritualCupKcal(activeRegion);
  const estimatedWeeklyChaiKcal = estimatedChaiKcal * 7;

  return (
    <View style={styles.container}>
      {/* Chai with Sugar Stepper Card */}
      <View
        style={[
          styles.chaiCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.chaiHeader}>
          <Text style={[styles.chaiTitle, dir.text, { color: theme.colors.textPrimary }]}>
            {t(`survey.lifestyle.chai.title.${activeRegion}`)}
          </Text>
          <View style={[styles.chaiBadge, { backgroundColor: accentColor }]}>
            <Text style={[styles.chaiBadgeText, isSaudi && { color: '#FFFFFF' }]}>
              {t(`survey.lifestyle.chai.badge.${activeRegion}`)}
            </Text>
          </View>
        </View>
        <Text style={[styles.chaiSubtitle, dir.text, { color: theme.colors.textSecondary }]}>
          {t(`survey.lifestyle.chai.subtitle.${activeRegion}`)}
        </Text>

        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={[
              styles.stepperBtn,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => onChange({ chaiWithSugarCupsPerDay: Math.max(0, chaiCount - 1) })}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('common.decrease')}
          >
            <Text style={[styles.stepperBtnText, { color: theme.colors.textPrimary }]}>−</Text>
          </TouchableOpacity>

          <View style={styles.stepperValueBox}>
            <Text style={[styles.stepperValue, { color: theme.colors.textPrimary }]}>
              {chaiCount}
            </Text>
            <Text style={[styles.stepperUnit, dir.textCenter, { color: theme.colors.textSecondary }]}>
              {t(`survey.lifestyle.chai.unit.${activeRegion}`)}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.stepperBtn,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => onChange({ chaiWithSugarCupsPerDay: chaiCount + 1 })}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('common.increase')}
          >
            <Text style={[styles.stepperBtnText, { color: theme.colors.textPrimary }]}>+</Text>
          </TouchableOpacity>
        </View>

        {chaiCount > 0 && (
          <View
            style={[
              styles.impactBox,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.impactText, { color: theme.colors.textPrimary }]}>
              {t('survey.lifestyle.chai.addsPrefix')}
              <Text
                style={[
                  styles.impactHighlight,
                  { color: theme.colors.primaryAccessible },
                ]}
              >
                {t('survey.lifestyle.chai.kcalPerDay', { kcal: estimatedChaiKcal })}
              </Text>{' '}
              {t(`survey.lifestyle.chai.weekly.${activeRegion}`, {
                weekly: formatNumber(estimatedWeeklyChaiKcal),
              })}
            </Text>
          </View>
        )}
        {errors.chaiWithSugarCupsPerDay && (
          <Text style={styles.errorText}>{errors.chaiWithSugarCupsPerDay}</Text>
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
  chaiCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
  },
  chaiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chaiTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  chaiBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  chaiBadgeText: {
    color: '#0A0B0D',
    fontSize: 10,
    fontWeight: '800',
  },
  chaiSubtitle: {
    fontSize: 12,
    marginBottom: 16,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 12,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
  },
  stepperValueBox: {
    alignItems: 'center',
    minWidth: 80,
  },
  stepperValue: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  stepperUnit: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  impactBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
  },
  impactText: {
    fontSize: 12,
    lineHeight: 18,
  },
  impactHighlight: {
    fontWeight: '800',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
});
