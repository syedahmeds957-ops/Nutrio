import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { PlanUserContext, AssessmentNarrative } from '../types.js';
import { Icon } from '../../ui/Icon.js';
import { useTheme } from '../../theme.js';

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
              Back
            </Text>
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Metabolic Analysis
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Your baseline resting requirements and lifestyle energy expenditure calculated via @nutrio/nutrition-core.
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
        <Text style={[styles.cardHeader, { color: theme.colors.textPrimary }]}>
          Energy Expenditure Breakdown
        </Text>

        <View style={[styles.metricRow, { borderBottomColor: theme.colors.border }]}>
          <View>
            <Text style={[styles.metricLabel, { color: theme.colors.textPrimary }]}>
              Basal Metabolic Rate (BMR)
            </Text>
            <Text style={[styles.metricSub, { color: theme.colors.textSecondary }]}>
              Resting energy required for basic biological life
            </Text>
          </View>
          <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>
            {context.bmr} kcal
          </Text>
        </View>

        <View style={[styles.metricRow, { borderBottomColor: theme.colors.border }]}>
          <View>
            <Text style={[styles.metricLabel, { color: theme.colors.textPrimary }]}>
              Daily Sitting Load
            </Text>
            <Text style={[styles.metricSub, { color: theme.colors.textSecondary }]}>
              {sittingHours} hours seated per day
            </Text>
          </View>
          <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>
            {sittingHours >= 8 ? 'Sedentary' : 'Active'}
          </Text>
        </View>

        <View style={styles.totalRow}>
          <View>
            <Text style={[styles.totalLabel, { color: theme.colors.textPrimary }]}>
              Total Daily Expenditure (TDEE)
            </Text>
            <Text
              style={[
                styles.totalSub,
                { color: isDark ? theme.colors.primaryLime : '#4B6200' },
              ]}
            >
              Estimated maintenance calorie baseline
            </Text>
          </View>
          <Text
            style={[
              styles.totalValue,
              { color: isDark ? theme.colors.primaryLime : '#4B6200' },
            ]}
          >
            {context.tdee} kcal
          </Text>
        </View>
      </View>

      {/* Cultural Levers Card (Pakistani Chai & Cooking) */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: isDark ? '#854D0E' : '#FDE68A',
          },
        ]}
      >
        <View style={styles.chaiHeaderRow}>
          <Text style={[styles.chaiTitle, { color: isDark ? '#FDE047' : '#B45309' }]}>
            ☕ Pakistani Dietary Levers
          </Text>
          <View
            style={[
              styles.badgeAmber,
              { backgroundColor: isDark ? 'rgba(234, 179, 8, 0.2)' : '#FEF3C7' },
            ]}
          >
            <Text style={[styles.badgeAmberText, { color: isDark ? '#FDE047' : '#B45309' }]}>
              High Impact
            </Text>
          </View>
        </View>

        <View style={[styles.metricRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.metricLabel, { color: theme.colors.textPrimary }]}>
            Sweetened Chai Energy Load:
          </Text>
          <Text style={[styles.chaiHighlight, { color: isDark ? '#FBBF24' : '#D97706' }]}>
            ~{chaiKcalDay} kcal/day
          </Text>
        </View>

        <View style={[styles.metricRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.metricLabel, { color: theme.colors.textPrimary }]}>
            Weekly Chai Energy Load:
          </Text>
          <Text style={[styles.chaiHighlight, { color: isDark ? '#FBBF24' : '#D97706' }]}>
            ~{chaiKcalWeek.toLocaleString()} kcal/week
          </Text>
        </View>

        <View
          style={[
            styles.insightBox,
            {
              backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FFFBEB',
              borderLeftColor: '#D97706',
            },
          ]}
        >
          <Text style={[styles.insightText, { color: isDark ? '#FDE68A' : '#92400E' }]}>
            Traditional sweetened tea and unchecked cooking oil in karahis and daals account for ~30% of unlogged calories in Pakistan. Moderating tea sugar alone yields rapid progress without eating less food.
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
          <Text style={[styles.cardHeader, { color: theme.colors.textPrimary }]}>
            Top 3 Actionable Levers
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
