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
  adaptPlanForFamilyMode,
  DailyMealPlanResult,
  generateMealSwaps,
  generateRamadanPlan,
  MealPlanSolverInput,
  MealSwapOption,
  MealSwapResult,
  PlannedMealSlot,
  solveDailyMealPlan,
} from '@nutrio/nutrition-core';
import { PAKISTANI_STAPLES_DATA, SAUDI_TRADITIONAL_FOODS } from '@nutrio/food-db';
import { PlannedMealSlotCard } from './PlannedMealSlotCard.js';
import { MealSwapModal } from './MealSwapModal.js';
import { GroceryListView } from './GroceryListView.js';
import { CulturalModesModal } from './CulturalModesModal.js';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';

interface WeeklyPlanViewProps {
  solverInput: MealPlanSolverInput;
  onBackToDashboard: () => void;
  onOpenGroceryList?: (plans: DailyMealPlanResult[]) => void;
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const formatBudgetTier = (tier: string, isSaudi: boolean): string => {
  if (isSaudi) {
    switch (tier) {
      case 'low_under_3500':
      case 'budget_under_3500':
        return 'Budget (< 125 SAR)';
      case 'standard_3500_7000':
        return 'Standard (125 - 250 SAR)';
      case 'premium_above_7000':
        return 'Premium (> 250 SAR)';
      default:
        return (tier || '').replace(/_/g, ' ');
    }
  }
  switch (tier) {
    case 'low_under_3500':
      return 'Budget (< Rs 3,500)';
    case 'standard_3500_7000':
      return 'Standard (Rs 3,500 - 7,000)';
    case 'premium_above_7000':
      return 'Premium (> Rs 7,000)';
    default:
      return (tier || '').replace(/_/g, ' ');
  }
};

export const WeeklyPlanView: React.FC<WeeklyPlanViewProps> = ({
  solverInput,
  onBackToDashboard,
  onOpenGroceryList,
}) => {
  const { theme, isDark } = useTheme();
  const { activeRegion } = useRegion();
  const [viewMode, setViewMode] = useState<'plan' | 'grocery'>('plan');

  const isSaudi = activeRegion === 'SA';
  const regionalFoodPool = isSaudi ? (SAUDI_TRADITIONAL_FOODS as any) : (PAKISTANI_STAPLES_DATA as any);

  // Generate a distinct or calibrated 7-day schedule
  const [weekPlans, setWeekPlans] = useState<DailyMealPlanResult[]>(() => {
    return DAYS_OF_WEEK.map(() =>
      solveDailyMealPlan(solverInput, regionalFoodPool)
    );
  });

  // Re-generate if region changes
  React.useEffect(() => {
    setWeekPlans(DAYS_OF_WEEK.map(() => solveDailyMealPlan(solverInput, regionalFoodPool)));
  }, [activeRegion]);

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Swap modal state
  const [activeSlotToSwap, setActiveSlotToSwap] = useState<PlannedMealSlot | null>(null);
  const [activeSwapResult, setActiveSwapResult] = useState<MealSwapResult | null>(null);

  // Cultural Modes state
  const [modesModalVisible, setModesModalVisible] = useState(false);
  const [isFamilyActive, setIsFamilyActive] = useState(false);
  const [familyDishName, setFamilyDishName] = useState(isSaudi ? 'Chicken Kabsa' : 'Chicken Karahi');
  const [isRamadanActive, setIsRamadanActive] = useState(false);

  const currentDayPlan = weekPlans[selectedDayIndex];

  const handleApplyFamilyMode = (dishName: string, slot: 'lunch' | 'dinner') => {
    setIsFamilyActive(true);
    setFamilyDishName(dishName);

    setWeekPlans((prev) => {
      const updated = [...prev];
      const adapted = adaptPlanForFamilyMode(
        updated[selectedDayIndex],
        { familyDishName: dishName, familyMealSlot: slot },
        solverInput,
        regionalFoodPool
      );
      updated[selectedDayIndex] = adapted.plan;
      return updated;
    });
  };

  const handleToggleRamadan = (active: boolean) => {
    setIsRamadanActive(active);
    if (active) {
      const ramadan = generateRamadanPlan(
        solverInput,
        regionalFoodPool
      );
      setWeekPlans((prev) => {
        const updated = [...prev];
        const dayPlan = { ...updated[selectedDayIndex] };
        dayPlan.meals = [ramadan.suhoor, ramadan.iftar, ramadan.postTarawihSnack];
        dayPlan.actualCalories = ramadan.actualCalories;
        dayPlan.calorieDeviationPct = Number(
          (
            ((ramadan.actualCalories - dayPlan.targetCalories) /
              dayPlan.targetCalories) *
            100
          ).toFixed(1)
        );
        dayPlan.isWithinTolerance = Math.abs(dayPlan.calorieDeviationPct) <= 5.0;
        updated[selectedDayIndex] = dayPlan;
        return updated;
      });
    } else {
      // Re-solve standard plan
      setWeekPlans((prev) => {
        const updated = [...prev];
        updated[selectedDayIndex] = solveDailyMealPlan(
          solverInput,
          regionalFoodPool
        );
        return updated;
      });
    }
  };

  if (viewMode === 'grocery') {
    return (
      <GroceryListView
        weekPlans={weekPlans}
        budgetTier={solverInput.budgetTierPKR}
        onBackToPlan={() => setViewMode('plan')}
      />
    );
  }

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
          <Text style={[styles.backBtnText, { color: theme.colors.textPrimary }]}>
            ← Back
          </Text>
        </TouchableOpacity>

        {/* Segmented Tab Control: TODAY / GROCERY */}
        <View
          style={[
            styles.segmentedControl,
            { backgroundColor: theme.colors.surfaceSecondary },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              styles.segmentBtnActive,
              { backgroundColor: theme.colors.primaryLime },
            ]}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentTextActive, { color: '#0A0B0D' }]}>
              TODAY
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.segmentBtn}
            onPress={() => setViewMode('grocery')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, { color: theme.colors.textSecondary }]}>
              GROCERY
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.navRightActions}>
          <TouchableOpacity
            style={[
              styles.modesNavBtn,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: isDark ? theme.colors.border : '#A7F3D0',
              },
            ]}
            onPress={() => setModesModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.modesNavBtnText,
                { color: isDark ? theme.colors.primaryLime : '#059669' },
              ]}
            >
              {isRamadanActive ? '🌙 Fasting' : isFamilyActive ? '🍲 Handi' : '🍱 Modes'}
            </Text>
          </TouchableOpacity>
        </View>
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
            const shortName = dayName.slice(0, 3).toUpperCase();
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
                {DAYS_OF_WEEK[selectedDayIndex]} Meal Plan
              </Text>
              <Text
                style={[styles.dayTargetMeta, { color: theme.colors.textSecondary }]}
              >
                Target: {currentDayPlan.targetCalories} kcal · {formatBudgetTier(currentDayPlan.budgetTier, isSaudi)}
              </Text>
            </View>

            <View
              style={[
                styles.tolerancePill,
                {
                  backgroundColor: isDark ? '#082E1E' : '#DCFCE7',
                  borderColor: isDark ? '#10B981' : '#86EFAC',
                },
              ]}
            >
              <Text
                style={[
                  styles.tolerancePillText,
                  { color: isDark ? theme.colors.primaryLime : '#059669' },
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
                Calories
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
                Protein
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
                Carbs
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
                Fat
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
                Oil
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

        {/* Grocery Action Footer */}
        {onOpenGroceryList && (
          <TouchableOpacity
            style={[
              styles.groceryActionBtn,
              { backgroundColor: theme.colors.primaryLime },
            ]}
            onPress={() => onOpenGroceryList(weekPlans)}
            activeOpacity={0.8}
          >
            <Text style={[styles.groceryActionBtnText, { color: '#0A0B0D' }]}>
              View 7-Day Grocery List & Budget
            </Text>
          </TouchableOpacity>
        )}
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

      {/* Cultural Modes Modal */}
      <CulturalModesModal
        visible={modesModalVisible}
        onClose={() => setModesModalVisible(false)}
        onApplyFamilyMode={handleApplyFamilyMode}
        onToggleRamadanMode={handleToggleRamadan}
        isRamadanActive={isRamadanActive}
        isFamilyActive={isFamilyActive}
        currentFamilyDish={familyDishName}
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
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 9999,
    padding: 3,
  },
  segmentBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 9999,
  },
  segmentBtnActive: {},
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
  },
  segmentTextActive: {
    fontSize: 11,
    fontWeight: '700',
  },
  navRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modesNavBtn: {
    borderRadius: 9999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  modesNavBtnText: {
    fontSize: 11,
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
  groceryActionBtn: {
    borderRadius: 9999,
    paddingVertical: 14,
    marginTop: 8,
    alignItems: 'center',
  },
  groceryActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
