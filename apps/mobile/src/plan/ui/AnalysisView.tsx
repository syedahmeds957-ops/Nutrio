import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { BackButton } from '../../ui/BackButton.js';
import { PlanUserContext, AssessmentNarrative } from '../types.js';
import { sittingBand } from '../sittingBand.js';
import { ritualCupKcal } from '../../common/ritualDrinks.js';
import { Icon } from '../../ui/Icon.js';
import { useTheme, commonRadii } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { useFormat } from '../../i18n/useFormat.js';

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
  const { theme } = useTheme();
  const { activeRegion } = useRegion();
  const { t } = useTranslation();
  const { formatNumber } = useFormat();
  const dir = useTextDirection();
  const isSaudi = activeRegion === 'SA';
  // The levers card is green for Saudi and amber for Pakistan; both pairs come from the theme.
  const tone = isSaudi
    ? { text: theme.colors.successText, tint: theme.colors.successLight, border: theme.colors.successBorder }
    : { text: theme.colors.warningText, tint: theme.colors.warningLight, border: theme.colors.warningBorder };

  const sittingHours = Number.isFinite(context.dailySittingHours) ? context.dailySittingHours : 8;
  // Priced for the region from the survey's cup count. The Saudi card used to
  // show a fixed 175 kcal/day whatever the user had answered.
  const ritualKcalDay =
    context.ritualCupsPerDay !== undefined
      ? context.ritualCupsPerDay * ritualCupKcal(activeRegion)
      : Number.isFinite(context.chaiSugarKcalPerDay)
      ? context.chaiSugarKcalPerDay
      : 2 * ritualCupKcal(activeRegion);
  const ritualKcalWeek = ritualKcalDay * 7;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.canvas }]}
      contentContainerStyle={styles.content}
    >
      {/* Top Back Button */}
      {onBack && (
        <BackButton variant="icon" onPress={onBack} style={styles.topBackBtn} />
      )}

      <View style={styles.header}>
        <Text role="heading" aria-level={1} style={[styles.title, dir.text, { color: theme.colors.textPrimary }]}>
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
          <View style={styles.metricTextCol}>
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
          <View style={styles.metricTextCol}>
            <Text style={[styles.metricLabel, dir.text, { color: theme.colors.textPrimary }]}>
              {t('plan.analysis.sittingLoad')}
            </Text>
            <Text style={[styles.metricSub, dir.text, { color: theme.colors.textSecondary }]}>
              {t('plan.analysis.sittingHours', { count: sittingHours })}
            </Text>
          </View>
          <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>
            {t(`plan.analysis.${sittingBand(sittingHours)}`)}
          </Text>
        </View>

        <View style={styles.totalRow}>
          <View style={styles.metricTextCol}>
            <Text style={[styles.totalLabel, dir.text, { color: theme.colors.textPrimary }]}>
              {t('plan.analysis.tdee')}
            </Text>
            <Text
              style={[
                styles.totalSub,
                { color: theme.colors.primaryAccessible },
              ]}
            >
              {t('plan.analysis.tdeeSub')}
            </Text>
          </View>
          <Text
            style={[
              styles.totalValue,
              { color: theme.colors.primaryAccessible },
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
            borderColor: tone.border,
          },
        ]}
      >
        <View style={styles.chaiHeaderRow}>
          <Text
            style={[
              styles.chaiTitle,
              {
                color: tone.text,
              },
            ]}
          >
            {t(`plan.analysis.levers.title.${activeRegion}`)}
          </Text>
          <View
            style={[
              styles.badgeAmber,
              {
                backgroundColor: tone.tint,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeAmberText,
                {
                  color: tone.text,
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
                color: tone.text,
              },
            ]}
          >
            {t('plan.analysis.levers.perDay', { value: ritualKcalDay })}
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
                color: tone.text,
              },
            ]}
          >
            {t('plan.analysis.levers.perWeek', {
              value: formatNumber(ritualKcalWeek),
            })}
          </Text>
        </View>

        <View
          style={[
            styles.insightBox,
            {
              backgroundColor: tone.tint,
              borderLeftColor: tone.text,
            },
          ]}
        >
          <Text
            style={[
              styles.insightText,
              {
                color: tone.text,
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
        <TouchableOpacity
          style={[
            styles.actionBtn,
            { backgroundColor: theme.colors.primaryLime },
            styles.actionBtnFlex,
          ]}
          onPress={onProceedToGoal}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <Text style={[styles.actionBtnText, { color: theme.colors.limeText }]}>
              {t('plan.analysis.selectGoal')}
            </Text>
            <Icon name={dir.isRTL ? 'arrow-left' : 'arrow-right'} size={18} color={theme.colors.limeText} />
          </View>
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
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  // The label side gives way, the number never wraps onto it.
  metricTextCol: {
    flex: 1,
    minWidth: 0,
  },
  metricLabel: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  metricSub: {
    fontSize: 12,
    marginTop: 2,
  },
  metricValue: {
    flexShrink: 0,
    fontSize: 15,
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
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
    flexShrink: 0,
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
    borderRadius: commonRadii.pill,
  },
  badgeAmberText: {
    fontSize: 12,
    fontWeight: '800',
  },
  chaiHighlight: {
    flexShrink: 0,
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
    marginBottom: 16,
  },
  // Beside the primary button: natural width, not an equal share.
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  actionBtn: {
    borderRadius: commonRadii.pill,
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
