import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { calculateBMI, GoalType } from '@nutrio/nutrition-core';
import { GoalSelectionState, PlanUserContext } from '../types.js';
import { computeProjection } from '../engine.js';
import { Icon } from '../../ui/Icon.js';
import { useTheme } from '../../theme.js';

interface GoalSelectionViewProps {
  context: PlanUserContext;
  onConfirmGoal: (selection: GoalSelectionState) => void;
  onBack: () => void;
}

export const GoalSelectionView: React.FC<GoalSelectionViewProps> = ({
  context,
  onConfirmGoal,
  onBack,
}) => {
  const { theme, isDark } = useTheme();

  const bmi = useMemo(
    () => calculateBMI(context.weightKg, context.heightCm),
    [context.weightKg, context.heightCm]
  );

  const isUnderweight = bmi < 18.5;
  const isPregnant = Boolean(context.isPregnantOrBreastfeeding);
  const isCutDisabled = isUnderweight || isPregnant;

  const [selectedGoal, setSelectedGoal] = useState<GoalType>(
    isCutDisabled ? 'maintain' : 'lose'
  );

  const maxSafeRate = Number((context.weightKg * 0.01).toFixed(2));
  const [rateKgPerWeek, setRateKgPerWeek] = useState(
    Math.min(0.5, maxSafeRate)
  );

  const [targetWeight, setTargetWeight] = useState<string>(
    selectedGoal === 'lose'
      ? String(Math.round(context.weightKg - 5))
      : selectedGoal === 'gain'
      ? String(Math.round(context.weightKg + 4))
      : String(context.weightKg)
  );

  const parsedTargetWeight = parseFloat(targetWeight);

  const projection = useMemo(() => {
    return computeProjection(
      context.weightKg,
      selectedGoal,
      rateKgPerWeek,
      isNaN(parsedTargetWeight) ? undefined : parsedTargetWeight
    );
  }, [context.weightKg, selectedGoal, rateKgPerWeek, parsedTargetWeight]);

  const handleConfirm = () => {
    onConfirmGoal({
      goal: selectedGoal,
      targetRateKgPerWeek: rateKgPerWeek,
      targetWeightKg: isNaN(parsedTargetWeight) ? undefined : parsedTargetWeight,
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.canvas }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Choose Your Target Goal
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Set your primary focus and weekly pace. Safety bounds are strictly enforced by our clinical engine.
        </Text>
      </View>

      {/* Goal Cards */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
          Primary Target
        </Text>

        {/* Lose Weight */}
        <TouchableOpacity
          style={[
            styles.goalCard,
            {
              backgroundColor:
                selectedGoal === 'lose'
                  ? isDark
                    ? 'rgba(164, 235, 63, 0.12)'
                    : '#F7FEE7'
                  : theme.colors.surface,
              borderColor:
                selectedGoal === 'lose'
                  ? theme.colors.primaryLime
                  : theme.colors.border,
              borderWidth: selectedGoal === 'lose' ? 2 : 1,
            },
            isCutDisabled && styles.goalCardDisabled,
          ]}
          onPress={() => !isCutDisabled && setSelectedGoal('lose')}
          activeOpacity={0.7}
          disabled={isCutDisabled}
        >
          <View style={styles.goalCardTop}>
            <View style={styles.goalTitleRow}>
              <Icon
                name="flame"
                size={18}
                color={
                  selectedGoal === 'lose'
                    ? isDark
                      ? theme.colors.primaryLime
                      : '#4B6200'
                    : '#EF4444'
                }
              />
              <Text
                style={[
                  styles.goalTitle,
                  {
                    color:
                      selectedGoal === 'lose'
                        ? isDark
                          ? theme.colors.primaryLime
                          : '#1E293B'
                        : theme.colors.textPrimary,
                  },
                ]}
              >
                Fat Loss / Cut
              </Text>
            </View>
            {isCutDisabled && (
              <View
                style={[
                  styles.disabledBadge,
                  { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2' },
                ]}
              >
                <Text style={styles.disabledBadgeText}>Clinically Disabled</Text>
              </View>
            )}
            {selectedGoal === 'lose' && !isCutDisabled && (
              <View
                style={[
                  styles.activeBadge,
                  { backgroundColor: theme.colors.primaryLime },
                ]}
              >
                <Text style={styles.activeBadgeText}>SELECTED</Text>
              </View>
            )}
          </View>
          <Text style={[styles.goalSub, { color: theme.colors.textSecondary }]}>
            Controlled caloric deficit preserving lean muscle tissue while reducing body fat.
          </Text>
          {isUnderweight && (
            <Text style={styles.warningText}>
              Disabled: BMI of {bmi} indicates underweight status. Weight loss is unsafe.
            </Text>
          )}
          {isPregnant && (
            <Text style={styles.warningText}>
              Disabled: Caloric restriction is medically contraindicated during pregnancy/lactation.
            </Text>
          )}
        </TouchableOpacity>

        {/* Maintain Weight */}
        <TouchableOpacity
          style={[
            styles.goalCard,
            {
              backgroundColor:
                selectedGoal === 'maintain'
                  ? isDark
                    ? 'rgba(164, 235, 63, 0.12)'
                    : '#F7FEE7'
                  : theme.colors.surface,
              borderColor:
                selectedGoal === 'maintain'
                  ? theme.colors.primaryLime
                  : theme.colors.border,
              borderWidth: selectedGoal === 'maintain' ? 2 : 1,
            },
          ]}
          onPress={() => setSelectedGoal('maintain')}
          activeOpacity={0.7}
        >
          <View style={styles.goalCardTop}>
            <View style={styles.goalTitleRow}>
              <Icon
                name="scale"
                size={18}
                color={
                  selectedGoal === 'maintain'
                    ? isDark
                      ? theme.colors.primaryLime
                      : '#4B6200'
                    : '#3B82F6'
                }
              />
              <Text
                style={[
                  styles.goalTitle,
                  {
                    color:
                      selectedGoal === 'maintain'
                        ? isDark
                          ? theme.colors.primaryLime
                          : '#1E293B'
                        : theme.colors.textPrimary,
                  },
                ]}
              >
                Maintenance & Performance
              </Text>
            </View>
            {selectedGoal === 'maintain' && (
              <View
                style={[
                  styles.activeBadge,
                  { backgroundColor: theme.colors.primaryLime },
                ]}
              >
                <Text style={styles.activeBadgeText}>SELECTED</Text>
              </View>
            )}
          </View>
          <Text style={[styles.goalSub, { color: theme.colors.textSecondary }]}>
            Balance calories to current expenditure. Optimizes athletic energy and recovery.
          </Text>
        </TouchableOpacity>

        {/* Build Muscle / Gain */}
        <TouchableOpacity
          style={[
            styles.goalCard,
            {
              backgroundColor:
                selectedGoal === 'gain'
                  ? isDark
                    ? 'rgba(164, 235, 63, 0.12)'
                    : '#F7FEE7'
                  : theme.colors.surface,
              borderColor:
                selectedGoal === 'gain'
                  ? theme.colors.primaryLime
                  : theme.colors.border,
              borderWidth: selectedGoal === 'gain' ? 2 : 1,
            },
          ]}
          onPress={() => setSelectedGoal('gain')}
          activeOpacity={0.7}
        >
          <View style={styles.goalCardTop}>
            <View style={styles.goalTitleRow}>
              <Icon
                name="dumbbell"
                size={18}
                color={
                  selectedGoal === 'gain'
                    ? isDark
                      ? theme.colors.primaryLime
                      : '#4B6200'
                    : '#10B981'
                }
              />
              <Text
                style={[
                  styles.goalTitle,
                  {
                    color:
                      selectedGoal === 'gain'
                        ? isDark
                          ? theme.colors.primaryLime
                          : '#1E293B'
                        : theme.colors.textPrimary,
                  },
                ]}
              >
                Lean Muscle Gain
              </Text>
            </View>
            {selectedGoal === 'gain' && (
              <View
                style={[
                  styles.activeBadge,
                  { backgroundColor: theme.colors.primaryLime },
                ]}
              >
                <Text style={styles.activeBadgeText}>SELECTED</Text>
              </View>
            )}
          </View>
          <Text style={[styles.goalSub, { color: theme.colors.textSecondary }]}>
            Controlled caloric surplus (~0.25 kg/wk) to fuel muscle synthesis without excess fat storage.
          </Text>
        </TouchableOpacity>
      </View>

      {/* Target Weight & Pace (if not maintain) */}
      {selectedGoal !== 'maintain' && (
        <>
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
              Goal Target Weight (kg)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.textPrimary,
                },
              ]}
              keyboardType="numeric"
              value={targetWeight}
              onChangeText={setTargetWeight}
              placeholder="e.g. 75"
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
              Weekly Pace: {rateKgPerWeek} kg / week
            </Text>
            <Text style={[styles.subtext, { color: theme.colors.textSecondary }]}>
              Max clinically safe rate: {maxSafeRate} kg/week (1% of your bodyweight)
            </Text>

            <View style={styles.rateOptionsRow}>
              {[0.25, 0.5, 0.75, 1.0].map((rate) => {
                const isOverMax = rate > maxSafeRate;
                const isSelected = rateKgPerWeek === rate;
                return (
                  <TouchableOpacity
                    key={rate}
                    style={[
                      styles.rateBtn,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primaryLime
                          : theme.colors.surface,
                        borderColor: isSelected
                          ? theme.colors.primaryLime
                          : theme.colors.border,
                      },
                      isOverMax && styles.rateBtnDisabled,
                    ]}
                    onPress={() => !isOverMax && setRateKgPerWeek(rate)}
                    disabled={isOverMax}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.rateBtnText,
                        {
                          color: isSelected ? '#0A0B0D' : theme.colors.textPrimary,
                          fontWeight: isSelected ? '800' : '600',
                        },
                      ]}
                    >
                      {rate} kg
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Timeline Projection Card */}
          {projection.estimatedWeeks && (
            <View
              style={[
                styles.projectionCard,
                {
                  backgroundColor: isDark
                    ? 'rgba(164, 235, 63, 0.08)'
                    : '#F7FEE7',
                  borderColor: isDark
                    ? 'rgba(164, 235, 63, 0.25)'
                    : '#D9F99D',
                },
              ]}
            >
              <View style={styles.projectionTitleRow}>
                <Icon
                  name="calendar"
                  size={16}
                  color={isDark ? theme.colors.primaryLime : '#4B6200'}
                />
                <Text
                  style={[
                    styles.projectionTitle,
                    { color: isDark ? theme.colors.primaryLime : '#4B6200' },
                  ]}
                >
                  Projected Milestone
                </Text>
              </View>
              <Text style={[styles.projectionValue, { color: theme.colors.textPrimary }]}>
                ~{projection.estimatedWeeks} Weeks ({projection.projectedDate})
              </Text>
              <Text style={[styles.projectionAdvice, { color: theme.colors.textSecondary }]}>
                {projection.pacingAdvice}
              </Text>
            </View>
          )}
        </>
      )}

      {/* Navigation Buttons */}
      <View style={styles.btnRow}>
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

        <TouchableOpacity
          style={[
            styles.confirmBtn,
            { backgroundColor: theme.colors.primaryLime },
          ]}
          onPress={handleConfirm}
          activeOpacity={0.8}
        >
          <View style={styles.confirmBtnContent}>
            <Text style={[styles.confirmBtnText, { color: theme.colors.limeText }]}>
              Calculate Custom Plan
            </Text>
            <Icon name="arrow-right" size={16} color={theme.colors.limeText} />
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
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  subtext: {
    fontSize: 12,
    marginBottom: 10,
  },
  goalCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
  },
  goalCardDisabled: {
    opacity: 0.5,
  },
  goalCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  goalSub: {
    fontSize: 12,
    lineHeight: 18,
  },
  warningText: {
    marginTop: 6,
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  disabledBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 9999,
  },
  disabledBadgeText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
  },
  activeBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeBadgeText: {
    color: '#0A0B0D',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '700',
  },
  rateOptionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rateBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
  },
  rateBtnDisabled: {
    opacity: 0.4,
  },
  rateBtnText: {
    fontSize: 13,
  },
  projectionCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
  },
  projectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  projectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  projectionValue: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },
  projectionAdvice: {
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  backBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
