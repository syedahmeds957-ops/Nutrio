import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { PlanUserContext, AssessmentNarrative } from '../types.js';
import { Icon } from '../../ui/Icon.js';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';

interface AnalysisViewProps {
  context: PlanUserContext;
  narrative?: AssessmentNarrative;
  onProceedToGoal: () => void;
  onBack?: () => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  context,
  narrative,
  onProceedToGoal,
  onBack,
}) => {
  const { theme, isDark } = useTheme();
  const { activeRegion } = useRegion();
  const { t } = useTranslation();
  const dir = useTextDirection();
  const isSaudi = activeRegion === 'SA';

  const sittingHours = Number.isFinite(context.dailySittingHours) ? context.dailySittingHours : 8;
  const chaiKcalDay = Number.isFinite(context.chaiSugarKcalPerDay) ? context.chaiSugarKcalPerDay : 130;
  const chaiKcalWeek = Number.isFinite(context.weeklyChaiSugarKcal) ? context.weeklyChaiSugarKcal : chaiKcalDay * 7;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.canvas }]}
      contentContainerStyle={styles.content}
    >
      {/* Top Back Button */}
      {onBack && (
        <TouchableOpacity
          style={[
            styles.topBackBtn,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <View style={styles.topBackContent}>
            <Icon
              name="arrow-left"
              size={14}
              color={theme.colors.textPrimary}
            />
            <Text style={[styles.topBackText, { color: theme.colors.textPrimary }]}>
              {t('common.back')}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.header}>
        <Text style={[styles.title, dir.text, { color: theme.colors.textPrimary }]}>
          {t('plan.analysis.title')}
        </Text>
        <Text style={[styles.subtitle, dir.text, { color: theme.colors.textSecondary }]}>
          {t('plan.analysis.subtitle')}
        </Text>
      </View>

      {/* Metabolic Profile Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.cardHeader, dir.text, { color: theme.colors.textPrimary }]}>
          {t('plan.analysis.expenditureBreakdown')}
        </Text>

        <View style={[styles.metricRow, { borderBottomColor: theme.colors.border }]}>
          <View>
            <Text style={[styles.metricLabel, dir.text, { color: theme.colors.textPrimary }]}>
              {t('plan.analysis.bmr')}
            </Text>
            <Text style={[styles.metricSub, dir.text, { color: theme.colors.textSecondary }]}>
              {t('plan.analysis.bmrSub')}
            </Text>
          </View>
          <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>
            {t('common.kcalValue', { value: context.bmr })}
          </Text>
        </View>

        <View style={[styles.metricRow, { borderBottomColor: theme.colors.border }]}>
          <View>
            <Text style={[styles.metricLabel, dir.text, { color: theme.colors.textPrimary }]}>
              {t('plan.analysis.sittingLoad')}
            </Text>
            <Text style={[styles.metricSub, dir.text, { color: theme.colors.textSecondary }]}>
              {t('plan.analysis.sittingHours', { count: sittingHours })}
            </Text>
          </View>
          <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>
            {sittingHours >= 8 ? t('plan.analysis.sedentary') : t('plan.analysis.active')}
          </Text>
        </View>

        <View style={styles.totalRow}>
          <View>
            <Text style={[styles.totalLabel, dir.text, { color: theme.colors.textPrimary }]}>
              {t('plan.analysis.tdee')}
            </Text>
            <Text
              style={[
                styles.totalSub,
                { color: isDark ? theme.colors.primaryLime : '#4B6200' },
              ]}
            >
              {t('plan.analysis.tdeeSub')}
            </Text>
          </View>
          <Text
            style={[
              styles.totalValue,
              { color: isDark ? theme.colors.primaryLime : '#4B6200' },
            ]}
          >
            {t('common.kcalValue', { value: context.tdee })}
          </Text>
        </View>
      </View>

      {/* Cultural Levers Card (Pakistani Chai & Cooking vs Saudi Gahwa & Dates) */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: isDark
              ? isSaudi
                ? '#065F46'
                : '#854D0E'
              : isSaudi
              ? '#A7F3D0'
              : '#FDE68A',
          },
        ]}
      >
        <View style={styles.chaiHeaderRow}>
          <Text
            style={[
              styles.chaiTitle,
              {
                color: isDark
                  ? isSaudi
                    ? '#34D399'
                    : '#FDE047'
                  : isSaudi
                  ? '#047857'
                  : '#B45309',
              },
            ]}
          >
            {t(`plan.analysis.levers.title.${activeRegion}`)}
          </Text>
          <View
            style={[
              styles.badgeAmber,
              {
                backgroundColor: isDark
                  ? isSaudi
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(234, 179, 8, 0.2)'
                  : isSaudi
                  ? '#D1FAE5'
                  : '#FEF3C7',
              },
            ]}
          >
            <Text
              style={[
                styles.badgeAmberText,
                {
                  color: isDark
                    ? isSaudi
                      ? '#34D399'
                      : '#FDE047'
                    : isSaudi
                    ? '#065F46'
                    : '#B45309',
                },
              ]}
            >
              {t('plan.analysis.levers.highImpact')}
            </Text>
          </View>
        </View>

        <View style={[styles.metricRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.metricLabel, { color: theme.colors.textPrimary }]}>
            {t(`plan.analysis.levers.dailyLoad.${activeRegion}`)}
          </Text>
          <Text
            style={[
              styles.chaiHighlight,
              {
                color: isDark
                  ? isSaudi
                    ? '#34D399'
                    : '#FBBF24'
                  : isSaudi
                  ? '#059669'
                  : '#D97706',
              },
            ]}
          >
            {t('plan.analysis.levers.perDay', { value: isSaudi ? 175 : chaiKcalDay })}
          </Text>
        </View>

        <View style={[styles.metricRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.metricLabel, { color: theme.colors.textPrimary }]}>
            {t(`plan.analysis.levers.weeklyLoad.${activeRegion}`)}
          </Text>
          <Text
            style={[
              styles.chaiHighlight,
              {
                color: isDark
                  ? isSaudi
                    ? '#34D399'
                    : '#FBBF24'
                  : isSaudi
                  ? '#059669'
                  : '#D97706',
              },
            ]}
          >
            {t('plan.analysis.levers.perWeek', {
              value: (isSaudi ? 1225 : chaiKcalWeek).toLocaleString(),
            })}
          </Text>
        </View>

        <View
          style={[
            styles.insightBox,
            {
              backgroundColor: isDark
                ? isSaudi
                  ? 'rgba(6, 95, 70, 0.2)'
                  : 'rgba(217, 119, 6, 0.15)'
                : isSaudi
                ? '#F0FDF4'
                : '#FFFBEB',
              borderLeftColor: isSaudi ? '#059669' : '#D97706',
            },
          ]}
        >
          <Text
            style={[
              styles.insightText,
              {
                color: isDark
                  ? isSaudi
                    ? '#D1FAE5'
                    : '#FDE68A'
                  : isSaudi
                  ? '#064E3B'
                  : '#92400E',
              },
            ]}
          >
            {t(`plan.analysis.levers.insight.${activeRegion}`)}
          </Text>
        </View>
      </View>

      {/* AI / Clinical Levers */}
      {narrative && (
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.cardHeader, dir.text, { color: theme.colors.textPrimary }]}>
            {t('plan.analysis.topLevers')}
          </Text>
          {narrative.highestLeverageChanges.map((lever, index) => (
            <View key={index} style={styles.leverItem}>
              <View
                style={[
                  styles.leverIndexBadge,
                  { backgroundColor: theme.colors.primaryLime },
                ]}
              >
                <Text style={styles.leverIndexText}>{index + 1}</Text>
              </View>
              <Text style={[styles.leverText, { color: theme.colors.textPrimary }]}>
                {lever}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Navigation Buttons */}
      <View style={styles.btnRow}>
        {onBack && (
          <TouchableOpacity
            style={[
              styles.backBtn,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Text style={[styles.backBtnText, { color: theme.colors.textPrimary }]}>
              Back
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.actionBtn,
            { backgroundColor: theme.colors.primaryLime },
            onBack ? styles.actionBtnFlex : null,
          ]}
          onPress={onProceedToGoal}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionBtnText, { color: theme.colors.limeText }]}>
            Select Your Goal & Pace →
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  card: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  metricSub: {
    fontSize: 12,
    marginTop: 2,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  totalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  chaiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chaiTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  badgeAmber: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
  },
  badgeAmberText: {
    fontSize: 11,
    fontWeight: '800',
  },
  chaiHighlight: {
    fontSize: 16,
    fontWeight: '800',
  },
  insightBox: {
    marginTop: 12,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
  },
  insightText: {
    fontSize: 12,
    lineHeight: 18,
  },
  leverItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  leverIndexBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  leverIndexText: {
    color: '#0A0B0D',
    fontSize: 12,
    fontWeight: '900',
  },
  leverText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  topBackBtn: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 9999,
    borderWidth: 1,
  },
  topBackContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topBackText: {
    fontSize: 13,
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  backBtn: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  actionBtn: {
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnFlex: {
    flex: 1,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
