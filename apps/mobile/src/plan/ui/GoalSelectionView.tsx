import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { BackButton } from '../../ui/BackButton.js';
import { calculateBMI, GoalType } from '@nutrio/nutrition-core';
import { GoalSelectionState, PlanUserContext } from '../types.js';
import { computeProjection, pacePreview } from '../engine.js';
import { Icon } from '../../ui/Icon.js';
import { AppleTextInput } from '../../ui/AppleInput.js';
import { OptionGroup, optionA11y } from '../../ui/Selectable.js';
import { useFormat } from '../../i18n/useFormat.js';
import { useTheme, commonRadii } from '../../theme.js';
import { addDaysToKey, formatDayKey, localDateKey } from '../../common/dateKey.js';
import { useTranslation, useTextDirection, useI18nState } from '../../i18n/index.js';

// Light-mode disabled pace chip. Against the page (#F6F7FB) the border is 3.4:1;
// the kg text (textSecondary #556274) is 5.0:1 on the fill. Dark mode keeps
// surfaceSecondary + textMuted (5.06:1).
const DISABLED_CHIP_LIGHT = { fill: '#E3E7ED', border: '#7C8796' } as const;

const PACE_OPTIONS = [0.25, 0.5, 0.75, 1.0];

/** The saved goal, unless it is a cut that is now clinically disabled. */
export function initialSelectionGoal(initial: GoalSelectionState | undefined, isCutDisabled: boolean): GoalType {
  if (initial && !(initial.goal === 'lose' && isCutDisabled)) return initial.goal;
  return isCutDisabled ? 'maintain' : 'lose';
}

/** The saved pace when it is one of the chips and still safe, else 0.5 (or the safe maximum). */
export function initialSelectionRate(initial: GoalSelectionState | undefined, maxSafeRate: number): number {
  const saved = initial?.targetRateKgPerWeek;
  if (saved !== undefined && PACE_OPTIONS.includes(saved) && saved <= maxSafeRate) return saved;
  return Math.min(0.5, maxSafeRate);
}

/** The saved goal weight; the defaults (5 kg down, 4 kg up) only for a first setup. */
export function initialTargetWeight(
  initial: GoalSelectionState | undefined,
  goal: GoalType,
  weightKg: number
): string {
  if (initial?.targetWeightKg !== undefined && Number.isFinite(initial.targetWeightKg)) {
    return String(initial.targetWeightKg);
  }
  return goal === 'lose'
    ? String(Math.round(weightKg - 5))
    : goal === 'gain'
      ? String(Math.round(weightKg + 4))
      : String(weightKg);
}

interface GoalSelectionViewProps {
  context: PlanUserContext;
  /** The saved goal, when there is one; without it the screen starts from defaults. */
  initialSelection?: GoalSelectionState;
  onConfirmGoal: (selection: GoalSelectionState) => void;
  onBack: () => void;
}

export const GoalSelectionView: React.FC<GoalSelectionViewProps> = ({
  context,
  initialSelection,
  onConfirmGoal,
  onBack,
}) => {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { language } = useI18nState();
  const dir = useTextDirection();
  const { formatRate } = useFormat();

  const bmi = useMemo(
    () => calculateBMI(context.weightKg, context.heightCm),
    [context.weightKg, context.heightCm]
  );

  const isUnderweight = bmi < 18.5;
  const isPregnant = Boolean(context.isPregnantOrBreastfeeding);
  const isCutDisabled = isUnderweight || isPregnant;

  const initialGoal = initialSelectionGoal(initialSelection, isCutDisabled);
  const [selectedGoal, setSelectedGoal] = useState<GoalType>(initialGoal);

  const maxSafeRate = Number((context.weightKg * 0.01).toFixed(2));
  const [rateKgPerWeek, setRateKgPerWeek] = useState(() =>
    initialSelectionRate(initialSelection, maxSafeRate)
  );

  const [targetWeight, setTargetWeight] = useState<string>(() =>
    initialTargetWeight(initialSelection, initialGoal, context.weightKg)
  );

  const parsedTargetWeight = parseFloat(targetWeight);

  // What nutrition-core will actually allow for this pace: a safety floor can
  // slow it, and the milestone has to follow the pace the plan really uses.
  const paceLimit = useMemo(
    () => pacePreview(context, selectedGoal, rateKgPerWeek),
    [context, selectedGoal, rateKgPerWeek]
  );
  const effectiveRate = paceLimit.limited ? paceLimit.effectiveRateKgPerWeek : rateKgPerWeek;
  const paceLimitKey =
    paceLimit.reason === 'bmr' || paceLimit.reason === 'absoluteFloor'
      ? 'floor'
      : paceLimit.reason === 'maxDeficit'
        ? 'maxDeficit'
        : 'maxRate';

  const projection = useMemo(() => {
    return computeProjection(
      context.weightKg,
      selectedGoal,
      effectiveRate,
      isNaN(parsedTargetWeight) ? undefined : parsedTargetWeight,
      language
    );
  }, [context.weightKg, selectedGoal, effectiveRate, parsedTargetWeight, language]);

  /** Radio role and checked state for a goal card (disabled merged in, not dropped). */
  const goalA11y = (goal: GoalType, disabled = false) => {
    const a11y = optionA11y('radio', selectedGoal === goal);
    return {
      ...a11y,
      accessibilityState: { ...a11y.accessibilityState, disabled },
      'aria-disabled': disabled,
    };
  };

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
        <Text role="heading" aria-level={1} style={[styles.title, dir.text, { color: theme.colors.textPrimary }]}>
          {t('plan.goal.title')}
        </Text>
        <Text style={[styles.subtitle, dir.text, { color: theme.colors.textSecondary }]}>
          {t('plan.goal.subtitle')}
        </Text>
      </View>

      {/* Goal Cards */}
      <View style={styles.section}>
        <Text style={[styles.label, dir.text, { color: theme.colors.textPrimary }]}>
          {t('plan.goal.primaryTarget')}
        </Text>

        <OptionGroup label={t('plan.goal.primaryTarget')}>
        {/* Lose Weight */}
        <TouchableOpacity
          style={[
            styles.goalCard,
            {
              backgroundColor:
                selectedGoal === 'lose'
                  ? isDark
                    ? 'rgba(164, 235, 63, 0.12)'
                    : theme.colors.limeTint
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
          {...goalA11y('lose', isCutDisabled)}
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
                      : theme.colors.primaryAccessible
                    : theme.colors.danger
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
                {t('plan.goal.lose.title')}
              </Text>
            </View>
            {isCutDisabled && (
              <View
                style={[
                  styles.disabledBadge,
                  { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : theme.colors.dangerLight },
                ]}
              >
                <Text style={styles.disabledBadgeText}>{t('plan.goal.clinicallyDisabled')}</Text>
              </View>
            )}
            {selectedGoal === 'lose' && !isCutDisabled && (
              <View
                style={[
                  styles.activeBadge,
                  { backgroundColor: theme.colors.primaryLime },
                ]}
              >
                <Text style={styles.activeBadgeText}>{t('common.selected')}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.goalSub, { color: theme.colors.textSecondary }]}>
            {t('plan.goal.lose.sub')}
          </Text>
          {isUnderweight && (
            <Text style={styles.warningText}>
              {t('plan.goal.lose.disabledUnderweight', { bmi })}
            </Text>
          )}
          {isPregnant && (
            <Text style={styles.warningText}>
              {t('plan.goal.lose.disabledPregnant')}
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
                    : theme.colors.limeTint
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
          {...goalA11y('maintain')}
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
                      : theme.colors.primaryAccessible
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
                {t('plan.goal.maintain.title')}
              </Text>
            </View>
            {selectedGoal === 'maintain' && (
              <View
                style={[
                  styles.activeBadge,
                  { backgroundColor: theme.colors.primaryLime },
                ]}
              >
                <Text style={styles.activeBadgeText}>{t('common.selected')}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.goalSub, { color: theme.colors.textSecondary }]}>
            {t('plan.goal.maintain.sub')}
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
                    : theme.colors.limeTint
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
          {...goalA11y('gain')}
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
                      : theme.colors.primaryAccessible
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
                {t('plan.goal.gain.title')}
              </Text>
            </View>
            {selectedGoal === 'gain' && (
              <View
                style={[
                  styles.activeBadge,
                  { backgroundColor: theme.colors.primaryLime },
                ]}
              >
                <Text style={styles.activeBadgeText}>{t('common.selected')}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.goalSub, { color: theme.colors.textSecondary }]}>
            {t('plan.goal.gain.sub')}
          </Text>
        </TouchableOpacity>
        </OptionGroup>
      </View>

      {/* Target Weight & Pace (if not maintain) */}
      {selectedGoal !== 'maintain' && (
        <>
          <AppleTextInput
            label={t('plan.goal.targetWeight')}
            icon="target"
            keyboardType="numeric"
            value={targetWeight}
            onChangeText={setTargetWeight}
            placeholder="75"
            helperText={t('plan.goal.targetWeightHelper')}
          />

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
              {t('plan.goal.weeklyPace', { rate: formatRate(rateKgPerWeek) })}
            </Text>
            <Text style={[styles.subtext, { color: theme.colors.textSecondary }]}>
              {t('plan.goal.maxSafeRate', { rate: formatRate(maxSafeRate, 'down') })}
            </Text>

            <OptionGroup label={t('plan.goal.paceLabel')} style={styles.rateOptionsRow}>
              {PACE_OPTIONS.map((rate) => {
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
                          : isOverMax
                            ? isDark
                              ? theme.colors.surfaceSecondary
                              : DISABLED_CHIP_LIGHT.fill
                            : theme.colors.surface,
                        borderColor: isSelected
                          ? theme.colors.primaryLime
                          : isOverMax && !isDark
                            ? DISABLED_CHIP_LIGHT.border
                            : theme.colors.border,
                      },
                      isOverMax && styles.rateBtnDisabled,
                    ]}
                    onPress={() => !isOverMax && setRateKgPerWeek(rate)}
                    disabled={isOverMax}
                    {...optionA11y('radio', isSelected)}
                    accessibilityState={{ checked: isSelected, disabled: isOverMax }}
                    aria-disabled={isOverMax}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.rateBtnText,
                        {
                          // Disabled chips dim the surface and the weight, never the text:
                          // the kg value must stay >= 4.5:1.
                          color: isSelected
                            ? theme.colors.limeText
                            : isOverMax
                              ? isDark
                                ? theme.colors.textMuted
                                : theme.colors.textSecondary
                              : theme.colors.textPrimary,
                          fontWeight: isSelected ? '800' : '600',
                        },
                      ]}
                    >
                      {t('common.kgValue', { value: formatRate(rate) })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </OptionGroup>
            {paceLimit.limited && (
              <Text
                accessibilityLiveRegion="polite"
                role="status"
                style={[styles.paceLimitNote, dir.text, { color: theme.colors.textPrimary }]}
              >
                {t(`plan.goal.paceLimit.${paceLimitKey}`, {
                  rate: formatRate(paceLimit.effectiveRateKgPerWeek, 'down'),
                })}
              </Text>
            )}
            {PACE_OPTIONS.some((rate) => rate > maxSafeRate) && (
              <Text style={[styles.subtext, dir.text, { color: theme.colors.textSecondary }]}>
                {t('plan.goal.pacesDisabledReason', { rate: formatRate(maxSafeRate, 'down') })}
              </Text>
            )}
          </View>

          {/* Timeline Projection Card */}
          {projection.estimatedWeeks && (
            <View
              style={[
                styles.projectionCard,
                {
                  backgroundColor: isDark
                    ? 'rgba(164, 235, 63, 0.08)'
                    : theme.colors.limeTint,
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
                  color={theme.colors.primaryAccessible}
                />
                <Text
                  style={[
                    styles.projectionTitle,
                    { color: theme.colors.primaryAccessible },
                  ]}
                >
                  {t('plan.goal.projectedMilestone')}
                </Text>
              </View>
              <Text style={[styles.projectionValue, { color: theme.colors.textPrimary }]}>
                ~{t('plan.goal.weeks', { count: projection.estimatedWeeks })} ({formatDayKey(addDaysToKey(localDateKey(), (projection.estimatedWeeks ?? 0) * 7), language)})
              </Text>
              <Text style={[styles.projectionAdvice, { color: theme.colors.textSecondary }]}>
                {projection.pacingAdviceKey
                  ? t(`plan.goal.pacingAdvice.${projection.pacingAdviceKey}`)
                  : projection.pacingAdvice}
              </Text>
            </View>
          )}
        </>
      )}

      {/* Navigation Buttons */}
      <View style={styles.btnRow}>
        <BackButton variant="icon" onPress={onBack} />

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
              {t('plan.goal.calculatePlan')}
            </Text>
            <Icon name={dir.isRTL ? 'arrow-left' : 'arrow-right'} size={16} color={theme.colors.limeText} />
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
    borderRadius: commonRadii.pill,
  },
  disabledBadgeText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
  },
  activeBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeBadgeText: {
    color: '#0A0B0D',
    fontSize: 12,
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
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: commonRadii.pill,
    borderWidth: 1,
    alignItems: 'center',
  },
  rateBtnDisabled: {
    borderStyle: 'dashed',
  },
  rateBtnText: {
    fontSize: 13,
  },
  paceLimitNote: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 10,
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
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
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
  confirmBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: commonRadii.pill,
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
