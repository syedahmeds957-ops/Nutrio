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
import { PAKISTANI_STAPLES_DATA } from '@nutrio/food-db';
import { PlannedMealSlotCard } from './PlannedMealSlotCard.js';
import { MealSwapModal } from './MealSwapModal.js';
import { GroceryListView } from './GroceryListView.js';
import { CulturalModesModal } from './CulturalModesModal.js';

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

export const WeeklyPlanView: React.FC<WeeklyPlanViewProps> = ({
  solverInput,
  onBackToDashboard,
  onOpenGroceryList,
}) => {
  const [viewMode, setViewMode] = useState<'plan' | 'grocery'>('plan');

  // Generate a distinct or calibrated 7-day schedule
  const [weekPlans, setWeekPlans] = useState<DailyMealPlanResult[]>(() => {
    return DAYS_OF_WEEK.map(() =>
      solveDailyMealPlan(solverInput, PAKISTANI_STAPLES_DATA as any)
    );
  });

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Swap modal state
  const [activeSlotToSwap, setActiveSlotToSwap] = useState<PlannedMealSlot | null>(null);
  const [activeSwapResult, setActiveSwapResult] = useState<MealSwapResult | null>(null);

  // Cultural Modes state
  const [modesModalVisible, setModesModalVisible] = useState(false);
  const [isFamilyActive, setIsFamilyActive] = useState(false);
  const [familyDishName, setFamilyDishName] = useState('Chicken Karahi');
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
        PAKISTANI_STAPLES_DATA as any
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
        PAKISTANI_STAPLES_DATA as any
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
          PAKISTANI_STAPLES_DATA as any
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
      PAKISTANI_STAPLES_DATA as any
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBackToDashboard}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>

        {/* Screen 3 Segmented Tab Control */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentBtn, styles.segmentBtnActive]}
            activeOpacity={0.8}
          >
            <Text style={styles.segmentTextActive}>TODAY</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.segmentBtn}
            onPress={() => setViewMode('grocery')}
            activeOpacity={0.8}
          >
            <Text style={styles.segmentText}>GROCERY</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.navRightActions}>
          <TouchableOpacity
            style={styles.modesNavBtn}
            onPress={() => setModesModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.modesNavBtnText}>
              {isRamadanActive ? '🌙 Fasting' : isFamilyActive ? '👨‍👩‍👧 Handi' : '🎭 Modes'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Horizontal Day Selector with Screen 1 Date Strip Aesthetic */}
      <View style={styles.daySelectorWrapper}>
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
                style={[styles.dayTab, isSelected && styles.dayTabActive]}
                onPress={() => setSelectedDayIndex(idx)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayTabShort,
                    isSelected && styles.dayTabShortActive,
                  ]}
                >
                  {shortName}
                </Text>
                <Text
                  style={[
                    styles.dayTabFull,
                    isSelected && styles.dayTabFullActive,
                  ]}
                >
                  {idx + 18}
                </Text>
                {isSelected && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollPad}>
        {/* Day Summary Card */}
        <View style={styles.daySummaryCard}>
          <View style={styles.daySummaryHeader}>
            <View>
              <Text style={styles.dayNameLabel}>
                {DAYS_OF_WEEK[selectedDayIndex]} Meal Plan
              </Text>
              <Text style={styles.dayTargetMeta}>
                Target: {currentDayPlan.targetCalories} kcal · {currentDayPlan.budgetTier.replace('_', ' ')}
              </Text>
            </View>

            <View style={styles.tolerancePill}>
              <Text style={styles.tolerancePillText}>
                {currentDayPlan.calorieDeviationPct >= 0 ? '+' : ''}
                {currentDayPlan.calorieDeviationPct}%
              </Text>
            </View>
          </View>

          {/* Macro Summary Row */}
          <View style={styles.macrosRow}>
            <View style={styles.macroCard}>
              <Text style={styles.macroVal}>
                {currentDayPlan.actualCalories}
              </Text>
              <Text style={styles.macroLabel}>Calories</Text>
            </View>
            <View style={styles.macroCard}>
              <Text style={styles.macroVal}>
                {currentDayPlan.actualProteinGrams}g
              </Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroCard}>
              <Text style={styles.macroVal}>
                {currentDayPlan.actualCarbGrams}g
              </Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroCard}>
              <Text style={styles.macroVal}>
                {currentDayPlan.actualFatGrams}g
              </Text>
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
            <View style={[styles.macroCard, styles.oilCard]}>
              <Text style={[styles.macroVal, styles.oilVal]}>
                {currentDayPlan.totalOilAddedG}g
              </Text>
              <Text style={styles.oilLabel}>Oil</Text>
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
            style={styles.groceryActionBtn}
            onPress={() => onOpenGroceryList(weekPlans)}
            activeOpacity={0.8}
          >
            <Text style={styles.groceryActionBtnText}>
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
    backgroundColor: '#F6F8F6',
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    backgroundColor: '#F1F5F9',
  },
  backBtnText: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '700',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 9999,
    padding: 3,
  },
  segmentBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 9999,
  },
  segmentBtnActive: {
    backgroundColor: '#10B981',
  },
  segmentText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  navRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modesNavBtn: {
    backgroundColor: '#ECFDF5',
    borderRadius: 9999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  modesNavBtnText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  daySelectorWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayTabActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0A0B0D',
    marginTop: 4,
  },
  dayTabShort: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  dayTabShortActive: {
    color: '#FFFFFF',
  },
  dayTabFull: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  dayTabFullActive: {
    color: '#A7F3D0',
  },
  container: {
    flex: 1,
  },
  scrollPad: {
    padding: 16,
    paddingBottom: 40,
  },
  daySummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  daySummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  dayNameLabel: {
    color: '#1E293B',
    fontSize: 18,
    fontWeight: '800',
  },
  dayTargetMeta: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  tolerancePill: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
  },
  tolerancePillText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  macroCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  macroVal: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '800',
  },
  macroLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  oilCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  oilVal: {
    color: '#B45309',
  },
  oilLabel: {
    color: '#B45309',
    fontSize: 10,
    marginTop: 2,
  },
  slotList: {
    gap: 4,
  },
  groceryActionBtn: {
    backgroundColor: '#10B981',
    borderRadius: 9999,
    paddingVertical: 14,
    marginTop: 8,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 3,
  },
  groceryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
