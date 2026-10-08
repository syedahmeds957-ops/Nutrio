import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  DailyMealPlanResult,
  generateMealSwaps,
  MealPlanSolverInput,
  MealSwapOption,
  MealSwapResult,
  PlannedMealSlot,
  solveDailyMealPlan,
} from '@nutrio/nutrition-core';
import { PAKISTANI_STAPLES_DATA, SAUDI_TRADITIONAL_FOODS } from '@nutrio/food-db';
import { PlannedMealSlotCard } from './PlannedMealSlotCard.js';
import { MealSwapModal } from './MealSwapModal.js';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { Icon } from '../../ui/Icon.js';

interface WeeklyPlanViewProps {
  solverInput: MealPlanSolverInput;
  onBackToDashboard: () => void;
}

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
// Kept as a plain array so the existing index-based plan generation is unchanged.
const DAYS_OF_WEEK = DAY_KEYS;

export const WeeklyPlanView: React.FC<WeeklyPlanViewProps> = ({
  solverInput,
  onBackToDashboard,
}) => {
  const { theme, isDark } = useTheme();
  const { activeRegion } = useRegion();

  const { t } = useTranslation();
  const dir = useTextDirection();
  const isSaudi = activeRegion === 'SA';
  const regionalFoodPool = isSaudi ? (SAUDI_TRADITIONAL_FOODS as any) : (PAKISTANI_STAPLES_DATA as any);

  // Generate a distinct or calibrated 7-day schedule with daily variety
  // The region is passed explicitly rather than left for the solver to infer
  // from the pool. Diet & Basics foods are region-neutral and merge into both
  // catalogues, so the Pakistani pool contains a few Saudi dishes — enough to
  // fool a "does this pool contain any Saudi food" check.
  const [weekPlans, setWeekPlans] = useState<DailyMealPlanResult[]>(() => {
    return DAYS_OF_WEEK.map((_, dayIndex) =>
      solveDailyMealPlan(solverInput, regionalFoodPool, { dayIndex, region: activeRegion })
    );
  });

  // Re-generate if region changes
  React.useEffect(() => {
    setWeekPlans(
      DAYS_OF_WEEK.map((_, dayIndex) =>
        solveDailyMealPlan(solverInput, regionalFoodPool, { dayIndex, region: activeRegion })
      )
    );
  }, [activeRegion]);

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Swap modal state
  const [activeSlotToSwap, setActiveSlotToSwap] = useState<PlannedMealSlot | null>(null);
  const [activeSwapResult, setActiveSwapResult] = useState<MealSwapResult | null>(null);



  const currentDayPlan = weekPlans[selectedDayIndex];

  const handleOpenSwap = (slot: PlannedMealSlot) => {
    const swap = generateMealSwaps(
      slot,
      solverInput,
      regionalFoodPool
    );
    setActiveSlotToSwap(slot);
    setActiveSwapResult(swap);
  };

  const handleApplySwap = (option: MealSwapOption) => {
    if (!activeSlotToSwap) return;

    setWeekPlans((prev) => {
      const updated = [...prev];
      const dayPlan = { ...updated[selectedDayIndex] };
      const slotIndex = dayPlan.meals.findIndex(
        (m) => m.slot === activeSlotToSwap.slot
      );

      if (slotIndex >= 0) {
        const updatedMeals = [...dayPlan.meals];
        updatedMeals[slotIndex] = {
          ...updatedMeals[slotIndex],
          title: option.title,
          actualCalories: option.calories,
          items: option.items,
        };

        const newActualCalories = updatedMeals.reduce(
          (sum, m) => sum + m.actualCalories,
          0
        );
        const newCalorieDeviationPct = Number(
          (
            ((newActualCalories - dayPlan.targetCalories) /
              dayPlan.targetCalories) *
            100
          ).toFixed(1)
        );

        dayPlan.meals = updatedMeals;
        dayPlan.actualCalories = newActualCalories;
        dayPlan.calorieDeviationPct = newCalorieDeviationPct;
        dayPlan.isWithinTolerance = Math.abs(newCalorieDeviationPct) <= 5.0;

        const allItems = updatedMeals.flatMap((m) => m.items);
        dayPlan.actualProteinGrams = Number(
          allItems.reduce((s, i) => s + i.proteinGrams, 0).toFixed(1)
        );
        dayPlan.actualFatGrams = Number(
          allItems.reduce((s, i) => s + i.fatGrams, 0).toFixed(1)
        );
        dayPlan.actualCarbGrams = Number(
          allItems.reduce((s, i) => s + i.carbGrams, 0).toFixed(1)
        );
        dayPlan.totalOilAddedG = Number(
          allItems.reduce((s, i) => s + i.oilAddedG, 0).toFixed(1)
        );

        updated[selectedDayIndex] = dayPlan;
      }
      return updated;
    });

    setActiveSlotToSwap(null);
    setActiveSwapResult(null);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.canvas }]}>
      {/* Top Nav Bar */}
      <View
        style={[
          styles.topNav,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.colors.surfaceSecondary }]}
          onPress={onBackToDashboard}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name={dir.isRTL ? 'arrow-right' : 'arrow-left'} size={16} color={theme.colors.textPrimary} />
            <Text style={[styles.backBtnText, { color: theme.colors.textPrimary }]}>{t('common.back')}</Text>
          </View>
        </TouchableOpacity>

        {/*
          The Today/Grocery segmented control is gone with the grocery list.
          A segmented control with one segment is not a control.
        */}


      </View>

      {/* Horizontal Day Selector */}
      <View
        style={[
          styles.daySelectorWrapper,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daySelectorPad}
        >
          {DAYS_OF_WEEK.map((dayName, idx) => {
            const isSelected = idx === selectedDayIndex;
            const shortName = t(`common.weekdayAbbrev.${dayName}`);
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.dayTab,
                  isSelected
                    ? {
                        backgroundColor: theme.colors.primaryLime,
                        borderColor: theme.colors.primaryLime,
                      }
                    : {
                        backgroundColor: theme.colors.surfaceSecondary,
                        borderColor: theme.colors.border,
                      },
                ]}
                onPress={() => setSelectedDayIndex(idx)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayTabShort,
                    {
                      color: isSelected ? '#0A0B0D' : theme.colors.textSecondary,
                    },
                  ]}
                >
                  {shortName}
                </Text>
                <Text
                  style={[
                    styles.dayTabFull,
                    {
                      color: isSelected ? '#0A0B0D' : theme.colors.textPrimary,
                    },
                  ]}
                >
                  {idx + 18}
                </Text>
                {isSelected && (
                  <View
                    style={[
                      styles.activeDot,
                      { backgroundColor: '#0A0B0D' },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.canvas }]}
        contentContainerStyle={styles.scrollPad}
      >
        {/* Day Summary Card */}
        <View
          style={[
            styles.daySummaryCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.daySummaryHeader}>
            <View style={styles.dayHeaderTitleCol}>
              <Text
                style={[styles.dayNameLabel, { color: theme.colors.textPrimary }]}
              >
                {t('plan.weekly.dayMealPlan', {
                  day: t(`common.weekday.${DAY_KEYS[selectedDayIndex]}`),
                })}
              </Text>
              <Text
                style={[styles.dayTargetMeta, { color: theme.colors.textSecondary }]}
              >
                {t('plan.weekly.dayTargetKcal', {
                  kcal: currentDayPlan.targetCalories,
                })}
              </Text>
            </View>

            <View
              style={[
                styles.tolerancePill,
                {
                  backgroundColor: isDark ? '#1C2608' : '#EDFCD2',
                  borderColor: isDark ? '#2D4B05' : '#D4F88D',
                },
              ]}
            >
              <Text
                style={[
                  styles.tolerancePillText,
                  { color: isDark ? theme.colors.primaryLime : '#365314' },
                ]}
              >
                {currentDayPlan.calorieDeviationPct >= 0 ? '+' : ''}
                {currentDayPlan.calorieDeviationPct}%
              </Text>
            </View>
          </View>

          {/* Macro Summary Row */}
          <View style={styles.macrosRow}>
            <View
              style={[
                styles.macroCard,
                {
                  backgroundColor: theme.colors.surfaceSecondary,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[styles.macroVal, { color: theme.colors.textPrimary }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {currentDayPlan.actualCalories}
              </Text>
              <Text
                style={[styles.macroLabel, { color: theme.colors.textSecondary }]}
              >
                {t('common.calories')}
              </Text>
            </View>
            <View
              style={[
                styles.macroCard,
                {
                  backgroundColor: theme.colors.surfaceSecondary,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[styles.macroVal, { color: theme.colors.protein }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {currentDayPlan.actualProteinGrams}g
              </Text>
              <Text
                style={[styles.macroLabel, { color: theme.colors.textSecondary }]}
              >
                {t('common.protein')}
              </Text>
            </View>
            <View
              style={[
                styles.macroCard,
                {
                  backgroundColor: theme.colors.surfaceSecondary,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[styles.macroVal, { color: theme.colors.carbs }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {currentDayPlan.actualCarbGrams}g
              </Text>
              <Text
                style={[styles.macroLabel, { color: theme.colors.textSecondary }]}
              >
                {t('common.carbs')}
              </Text>
            </View>
            <View
              style={[
                styles.macroCard,
                {
                  backgroundColor: theme.colors.surfaceSecondary,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[styles.macroVal, { color: theme.colors.fat }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {currentDayPlan.actualFatGrams}g
              </Text>
              <Text
                style={[styles.macroLabel, { color: theme.colors.textSecondary }]}
              >
                {t('common.fat')}
              </Text>
            </View>
            <View
              style={[
                styles.macroCard,
                styles.oilCard,
                {
                  backgroundColor: isDark ? '#332306' : '#FEF3C7',
                  borderColor: isDark ? '#6B4C0A' : '#FDE68A',
                },
              ]}
            >
              <Text
                style={[styles.macroVal, styles.oilVal, { color: isDark ? '#FBBF24' : '#B45309' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {currentDayPlan.totalOilAddedG}g
              </Text>
              <Text
                style={[styles.oilLabel, { color: isDark ? '#FBBF24' : '#B45309' }]}
              >
                {t('common.oil')}
              </Text>
            </View>
          </View>
        </View>

        {/* Meal Slots */}
        <View style={styles.slotList}>
          {currentDayPlan.meals.map((mealSlot) => (
            <PlannedMealSlotCard
              key={mealSlot.slot}
              slot={mealSlot}
              onOpenSwap={() => handleOpenSwap(mealSlot)}
            />
          ))}
        </View>

      </ScrollView>

      {/* 1-Tap Macro-Matched Swap Modal */}
      <MealSwapModal
        visible={!!activeSlotToSwap && !!activeSwapResult}
        onClose={() => {
          setActiveSlotToSwap(null);
          setActiveSwapResult(null);
        }}
        originalSlot={activeSlotToSwap}
        swapResult={activeSwapResult}
        onSelectOption={handleApplySwap}
      />


    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  daySelectorWrapper: {
    borderBottomWidth: 1,
  },
  daySelectorPad: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  dayTab: {
    width: 54,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  dayTabShort: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  dayTabFull: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  container: {
    flex: 1,
  },
  scrollPad: {
    padding: 16,
    paddingBottom: 100,
  },
  daySummaryCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  daySummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  dayHeaderTitleCol: {
    flex: 1,
    marginRight: 8,
  },
  dayNameLabel: {
    fontSize: 18,
    fontWeight: '800',
  },
  dayTargetMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  tolerancePill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
    borderWidth: 1,
  },
  tolerancePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  macroCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 2,
    alignItems: 'center',
    borderWidth: 1,
  },
  macroVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  oilCard: {
    borderWidth: 1,
  },
  oilVal: {},
  oilLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  slotList: {
    gap: 4,
  },
});
