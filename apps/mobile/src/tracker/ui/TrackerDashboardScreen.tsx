import React, { useState, useRef } from 'react';
import {
  Animated,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { DailyProgressHeader } from './DailyProgressHeader.js';
import { WaterTrackerCard } from './WaterTrackerCard.js';
import { MealSlotCard } from './MealSlotCard.js';
import { MealLogHubModal, MealBasketEntry } from './MealLogHubModal.js';
import { BrandMenuModal } from './BrandMenuModal.js';
import { ItemCustomizerModal, CustomizedLogPayload } from './ItemCustomizerModal.js';
import { DiaryViewModal } from './DiaryViewModal.js';
import { AiRecommendationCard, RecommendedFood } from './AiRecommendationCard.js';
import { QuickStaplesBar, StapleItem } from './QuickStaplesBar.js';
import { resolveStaple } from '../staples.js';
import { WeeklyCalorieBankCard } from './WeeklyCalorieBankCard.js';
import { TrackerEngine } from '../engine.js';
import { MealSlot, DailyTrackerSummary } from '../types.js';
import type { DraftLogEntry } from '../describeMeal.js';
import {
  NormalizedFood,
  PAKISTANI_STAPLES_DATA,
  SAUDI_TRADITIONAL_FOODS,
  ServingUnit,
} from '@nutrio/food-db';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { GuestAuthModal } from './GuestAuthModal.js';
import { ProfileSheet } from './ProfileSheet.js';
import { Icon } from '../../ui/Icon.js';
import type { WeeklyWorkoutPlan, WorkoutLog } from '@nutrio/workout-core';
import { TodayWorkoutCard } from '../../workout/ui/TodayWorkoutCard.js';
import { saveDailyActivities, loadDailyActivities, getOrInitHistoryStartDate } from '../activityStorage.js';
import { recordFoodUsage } from '../mealPresets.js';
import { defaultServingFor } from '../personalServings.js';
import { foodKey } from './useMealBasket.js';
import { pushDailyActivities } from '../../sync/activitySync.js';
import { HapticFeedback } from '../../ui/haptics.js';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addDaysToKey, localDateKey } from '../../common/dateKey.js';
import { computeLoggingStreak } from '../streak.js';
import { StreakBadge } from './StreakBadge.js';
import { styles } from './TrackerDashboardScreen.styles.js';

interface TrackerDashboardScreenProps {
  userName?: string;
  targets: {
    targetCalories: number;
    targetProteinGrams: number;
    targetFatGrams: number;
    targetCarbGrams: number;
    targetWaterMl?: number;
  };
  trackerEngine?: TrackerEngine;
  onSummaryChange?: (summary: DailyTrackerSummary) => void;
  onBackToPlan?: () => void;
  onOpenWeightTracker?: () => void;
  onOpenMealPlan?: () => void;
  onOpenCoachChat?: () => void;
  onOpenWorkouts?: () => void;
  /** Opens Workouts straight on a day (the Today card's Start). */
  onOpenWorkoutDay?: (dateKey: string) => void;
  /** The user's workout plan, for the Today card; null when they have none. */
  workoutPlan?: WeeklyWorkoutPlan | null;
  /** Finished workouts, so the Today card can show today as done. */
  workoutLogs?: readonly WorkoutLog[];
  onOpenWeeklyCheckIn?: () => void;
  onOpenSurvey?: () => void;
  onOpenHome?: () => void;
  onLogout?: () => void;
  isGuest?: boolean;
  onRequireAuth?: () => void;
}

export const TrackerDashboardScreen: React.FC<TrackerDashboardScreenProps> = ({
  userName = 'User',
  targets,
  trackerEngine,
  onSummaryChange,
  onBackToPlan,
  onOpenWeightTracker,
  onOpenMealPlan,
  onOpenCoachChat,
  onOpenWorkouts,
  onOpenWorkoutDay,
  workoutPlan = null,
  workoutLogs,
  onOpenWeeklyCheckIn,
  onOpenSurvey,
  onOpenHome,
  onLogout,
  isGuest = false,
  onRequireAuth,
}) => {
  const { theme, isDark } = useTheme();
  const { activeRegion, setRegion } = useRegion();
  const { t } = useTranslation();
  const dir = useTextDirection();
  const accentColor = theme.colors.primaryLime;
  const accentTextColor = '#0A0B0D';

  let insetsBottom = 0;
  try {
    const insets = useSafeAreaInsets();
    if (insets && typeof insets.bottom === 'number') {
      insetsBottom = insets.bottom;
    }
  } catch {
    insetsBottom = 0;
  }
  const bottomBarOffset = Math.max(20, insetsBottom + 8);

  const enginesRef = useRef<Record<'PK' | 'SA', TrackerEngine>>({
    PK: (() => {
      if (activeRegion === 'PK' && trackerEngine) return trackerEngine;
      const eng = new TrackerEngine(targets);
      const today = localDateKey();
      const saved = loadDailyActivities(today, 'PK');
      if (saved && saved.items) eng.loadItems(saved.items, saved.waterMl || 0);
      return eng;
    })(),
    SA: (() => {
      if (activeRegion === 'SA' && trackerEngine) return trackerEngine;
      const eng = new TrackerEngine(targets);
      const today = localDateKey();
      const saved = loadDailyActivities(today, 'SA');
      if (saved && saved.items) eng.loadItems(saved.items, saved.waterMl || 0);
      return eng;
    })(),
  });

  const engine = enginesRef.current[activeRegion] || enginesRef.current.PK;
  const [, setRerender] = useState(0);
  const forceUpdate = () => {
    setRerender((prev) => prev + 1);
    onSummaryChange?.(engine.getSummary());
  };

  const persistCurrentActivities = () => {
    const currentSummary = engine.getSummary();
    saveDailyActivities(
      currentSummary.date,
      activeRegion,
      currentSummary.items,
      currentSummary.waterMlConsumed
    );

    // Mirror the day to the account so it survives logout and device changes.
    // Guests have no profile to attach it to, so they stay local-only.
    if (!isGuest) {
      pushDailyActivities({
        date: currentSummary.date,
        region: activeRegion,
        items: currentSummary.items,
        waterMl: currentSummary.waterMlConsumed,
      }).catch(() => {
        // Local copy already saved; a failed push retries on the next change.
      });
    }
  };

  React.useEffect(() => {
    if (trackerEngine) {
      enginesRef.current[activeRegion] = trackerEngine;
      forceUpdate();
    }
  }, [trackerEngine]);

  React.useEffect(() => {
    const today = localDateKey();
    const saved = loadDailyActivities(today, activeRegion);
    if (saved && saved.items) {
      engine.loadItems(saved.items, saved.waterMl || 0);
    }
    onSummaryChange?.(engine.getSummary());
    forceUpdate();
  }, [activeRegion]);

  React.useEffect(() => {
    const pkItems = enginesRef.current.PK.getSummary().items;
    const pkWater = enginesRef.current.PK.getSummary().waterMlConsumed;
    const saItems = enginesRef.current.SA.getSummary().items;
    const saWater = enginesRef.current.SA.getSummary().waterMlConsumed;

    enginesRef.current.PK = new TrackerEngine(targets);
    enginesRef.current.PK.loadItems(pkItems, pkWater);
    enginesRef.current.SA = new TrackerEngine(targets);
    enginesRef.current.SA.loadItems(saItems, saWater);
    forceUpdate();
  }, [targets.targetCalories, targets.targetProteinGrams, targets.targetFatGrams, targets.targetCarbGrams]);

  const [activeSlot, setActiveSlot] = useState<MealSlot>('breakfast');

  // Calorify Modal Flow states
  const [hubVisible, setHubVisible] = useState(false);
  const [brandMenuVisible, setBrandMenuVisible] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [customizerVisible, setCustomizerVisible] = useState(false);
  const [selectedItemForCustomize, setSelectedItemForCustomize] = useState<NormalizedFood | null>(null);
  const [diaryVisible, setDiaryVisible] = useState(false);
  const [diaryDayOffset, setDiaryDayOffset] = useState(0);
  const [activeTab, setActiveTab] = useState<'today' | 'diary'>('today');
  const [guestModalVisible, setGuestModalVisible] = useState(false);
  /** A guest tapped Start on the sample workout. */
  const [workoutPromptVisible, setWorkoutPromptVisible] = useState(false);

  // Profile modal with minimalist animation
  const [profileVisible, setProfileVisible] = useState(false);
  const profileFade = useRef(new Animated.Value(0)).current;
  const profileSlide = useRef(new Animated.Value(150)).current;

  const openProfile = () => {
    setProfileVisible(true);
    Animated.parallel([
      Animated.timing(profileFade, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(profileSlide, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();
  };

  const closeProfile = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(profileFade, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(profileSlide, { toValue: 150, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setProfileVisible(false);
      if (callback) callback();
    });
  };

  const summary = engine.getSummary();

  // Diary history never reaches back further than the day this user (or this
  // guest device) first opened the tracker — a brand-new user has no "before"
  // to view, so the back arrow stops right there.
  const historyStartDate = useRef(getOrInitHistoryStartDate()).current;
  const minDiaryDayOffset = -Math.max(
    0,
    Math.round(
      (new Date(`${summary.date}T00:00:00Z`).getTime() -
        new Date(`${historyStartDate}T00:00:00Z`).getTime()) /
        86400000
    )
  );

  const diaryDate = addDaysToKey(summary.date, diaryDayOffset);

  const diarySummary: DailyTrackerSummary =
    diaryDayOffset === 0
      ? summary
      : (() => {
          const pastEngine = new TrackerEngine({ ...targets, date: diaryDate });
          const saved = loadDailyActivities(diaryDate, activeRegion);
          if (saved && saved.items) {
            pastEngine.loadItems(saved.items, saved.waterMl || 0);
          }
          return pastEngine.getSummary();
        })();

  // Fill (0-1) of the daily calorie target for each day of the current
  // Mon-Sun week, read from what was saved on those days. Days that have not
  // happened yet, or were never logged, stay 0 so their bars stay empty.
  const weeklyHistoryFills = (() => {
    const today = new Date(`${summary.date}T00:00:00Z`);
    const todayIdx = (today.getUTCDay() + 6) % 7;
    return Array.from({ length: 7 }, (_, idx) => {
      if (idx >= todayIdx) return 0;
      const date = addDaysToKey(summary.date, -(todayIdx - idx));
      const saved = loadDailyActivities(date, activeRegion);
      if (!saved?.items?.length) return 0;
      const dayEngine = new TrackerEngine({ ...targets, date });
      dayEngine.loadItems(saved.items, saved.waterMl || 0);
      const eaten = dayEngine.getSummary().totalCaloriesConsumed;
      return Math.min(1, eaten / Math.max(1, targets.targetCalories));
    });
  })();

  // Today reads from the live summary so a meal logged a moment ago counts at once.
  const loggingStreak = computeLoggingStreak(
    (date) =>
      date === summary.date
        ? summary.items.length > 0
        : (loadDailyActivities(date, activeRegion)?.items?.length ?? 0) > 0,
    summary.date
  );

  const handleOpenAdd = (slot: MealSlot) => {
    setActiveSlot(slot);
    setHubVisible(true);
  };

  const handleOpenHub = (slot?: MealSlot) => {
    if (slot) setActiveSlot(slot);
    setHubVisible(true);
  };

  const handleSelectBrandInHub = (brandId: string) => {
    setSelectedBrandId(brandId);
    setHubVisible(false);
    setBrandMenuVisible(true);
  };

  const handleSelectItemInHubOrBrand = (item: NormalizedFood) => {
    setSelectedItemForCustomize(item);
    setHubVisible(false);
    setBrandMenuVisible(false);
    setCustomizerVisible(true);
  };

  const handleConfirmCustomizedLog = (payload: CustomizedLogPayload) => {
    const servingDesc = payload.portionDescription || payload.food.servings[0]?.description || 'serving';
    // The label stays the singular portion ("1 bazinga burger") — the cards
    // prepend the quantity themselves, so baking it in here printed it twice.
    engine.logCustomizedItem(
      payload.mealSlot,
      payload.food.name,
      payload.food.nameUr,
      servingDesc,
      payload.quantity,
      payload.totalCalories,
      payload.totalProtein,
      payload.totalCarbs,
      payload.totalFat,
      payload.actualGrams
    );
    recordFoodUsage([payload.food.id || payload.food.name]);
    setCustomizerVisible(false);
    setSelectedItemForCustomize(null);
    persistCurrentActivities();
    const completedNow = (['breakfast', 'lunch', 'dinner', 'snacks_chai'] as const).filter(
      (s) => engine.getItemsBySlot(s).length > 0
    ).length;
    if (completedNow === 4) {
      HapticFeedback.notificationSuccess();
    } else {
      HapticFeedback.impactMedium();
    }
    forceUpdate();
  };

  const handleConfirmLog = (
    slot: MealSlot,
    food: NormalizedFood,
    serving: ServingUnit,
    quantity: number
  ) => {
    engine.logItem(slot, food, serving, quantity);
    recordFoodUsage([food.id || food.name]);
    persistCurrentActivities();
    const completedNow = (['breakfast', 'lunch', 'dinner', 'snacks_chai'] as const).filter(
      (s) => engine.getItemsBySlot(s).length > 0
    ).length;
    if (completedNow === 4) {
      HapticFeedback.notificationSuccess();
    } else {
      HapticFeedback.impactMedium();
    }
    forceUpdate();
  };

  // A custom meal goes in as one LoggedItem per food, all tagged with the same
  // slot — the slot card already renders and lets you delete them individually.
  const handleConfirmBasket = (entries: MealBasketEntry[]) => {
    for (const { food, quantity } of entries) {
      const serving = defaultServingFor(food, foodKey(food), t('tracker.customizer.myServing'));
      if (!serving) continue;
      engine.logItem(activeSlot, food, serving, quantity);
    }
    recordFoodUsage(entries.map(({ food }) => food.id || food.name));
    setHubVisible(false);
    persistCurrentActivities();
    HapticFeedback.notificationSuccess();
    forceUpdate();
  };

  // A described meal arrives reviewed: each row already carries its serving
  // and count, and the engine prices it from the catalogue.
  const handleLogDescribedMeal = (slot: MealSlot, entries: DraftLogEntry[]) => {
    for (const { food, serving, quantity } of entries) {
      engine.logItem(slot, food, serving, quantity);
    }
    recordFoodUsage(entries.map(({ food }) => food.id || food.name));
    setActiveSlot(slot);
    setHubVisible(false);
    persistCurrentActivities();
    HapticFeedback.notificationSuccess();
    forceUpdate();
  };

  const handleDeleteItem = (id: string) => {
    engine.deleteItem(id);
    persistCurrentActivities();
    forceUpdate();
  };

  const handleLogWater = (ml: number) => {
    engine.logWater(ml);
    persistCurrentActivities();
    forceUpdate();
  };

  const handleLogRecommendation = (items: RecommendedFood[]) => {
    const foodPool = activeRegion === 'SA' ? SAUDI_TRADITIONAL_FOODS : PAKISTANI_STAPLES_DATA;
    for (const item of items) {
      const found =
        foodPool.find((f) =>
          f.name.toLowerCase().includes(item.name.toLowerCase())
        ) || foodPool[0];
      const serving = found.servings[0] || { label: 'serving', grams: 100 };
      const qty = Number((item.calories / (serving.kcal || found.kcal100g || 100)).toFixed(1));
      engine.logItem('dinner', found, serving, Math.max(0.5, qty));
    }
    persistCurrentActivities();
    forceUpdate();
  };

  const handleQuickLogStaple = (staple: StapleItem, slot: MealSlot) => {
    const { food, serving } = resolveStaple(staple, activeRegion);
    engine.logItem(slot, food, serving, 1);
    persistCurrentActivities();
    forceUpdate();
  };

  /** The meal people most likely mean right now, used to preselect the hub. */
const defaultSlotForNow = (): MealSlot => {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 16) return 'lunch';
  if (h < 19) return 'snacks_chai';
  return 'dinner';
};

  const completedSlotsCount = (['breakfast', 'lunch', 'dinner', 'snacks_chai'] as MealSlot[]).filter(
    (s) => engine.getItemsBySlot(s).length > 0
  ).length;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.canvas }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scrollPad, { paddingBottom: 115 + insetsBottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.topNav}>
          <View style={styles.topHeaderRow}>
            <TouchableOpacity
              style={styles.userRow}
              onPress={openProfile}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.avatarCircle,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: accentColor,
                  },
                ]}
              >
                <Text style={[styles.avatarInitial, { color: accentColor }]}>
                  {userName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={[styles.greetingText, dir.text, { color: theme.colors.textMuted }]}>
                  {t('common.today')}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>
                    {userName}
                  </Text>
                  <View style={[styles.freeTag, { backgroundColor: accentColor }]}>
                    <Text style={[styles.freeTagText, { color: accentTextColor }]}>
                      {t('tracker.dashboard.freeTag')}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            {/* Header Right Actions: Region Switcher + Theme Toggle */}
            <View style={styles.headerRightActions}>
              <TouchableOpacity
                style={[
                  styles.regionToggleBtn,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => {
                  HapticFeedback.selection();
                  setRegion(activeRegion === 'SA' ? 'PK' : 'SA');
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                accessibilityRole="button"
                accessibilityLabel={t('tracker.dashboard.toggleRegion')}
              >
                <Text style={[styles.regionToggleText, { color: theme.colors.textPrimary }]}>
                  {activeRegion === 'SA' ? 'SA' : 'PK'}
                </Text>
              </TouchableOpacity>

            </View>
          </View>

          {/* Navigation Action Chips. Content-width and scrollable: five equal-width
              pills clip their labels on a 360-390 px phone. */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.navActionsScroll}
            contentContainerStyle={styles.navActionsRow}
          >
            {onOpenMealPlan && (
              <TouchableOpacity
                style={[
                  styles.navPillBtn,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
                onPress={onOpenMealPlan}
                activeOpacity={0.7}
              >
                <View style={styles.navPillContent}>
                  <Icon name="utensils" size={13} color={theme.colors.textPrimary} />
                  <Text numberOfLines={1} style={[styles.navPillBtnText, { color: theme.colors.textPrimary }]}>
                    {t('tracker.dashboard.nav.meals')}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {onOpenWorkouts && (
              <TouchableOpacity
                style={[
                  styles.navPillBtn,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
                onPress={onOpenWorkouts}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <View style={styles.navPillContent}>
                  <Icon name="dumbbell" size={13} color={theme.colors.textPrimary} />
                  <Text numberOfLines={1} style={[styles.navPillBtnText, { color: theme.colors.textPrimary }]}>
                    {t('tracker.dashboard.nav.workouts')}
                  </Text>
                  <View style={[styles.newBadge, { backgroundColor: theme.colors.primaryLime }]}>
                    <Text style={[styles.newBadgeText, { color: theme.colors.limeText }]}>{t('workout.newBadge')}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {onOpenWeightTracker && (
              <TouchableOpacity
                style={[
                  styles.navPillBtn,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
                onPress={() => {
                  if (isGuest) {
                    setGuestModalVisible(true);
                    return;
                  }
                  onOpenWeightTracker();
                }}
                activeOpacity={0.7}
              >
                <View style={styles.navPillContent}>
                  <Icon name="scale" size={13} color={theme.colors.textPrimary} />
                  <Text numberOfLines={1} style={[styles.navPillBtnText, { color: theme.colors.textPrimary }]}>
                    {t('tracker.dashboard.nav.weight')}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {onOpenCoachChat && (
              <TouchableOpacity
                style={[
                  styles.navPillBtnActive,
                  { backgroundColor: accentColor },
                ]}
                onPress={() => {
                  if (isGuest) {
                    setGuestModalVisible(true);
                    return;
                  }
                  onOpenCoachChat();
                }}
                activeOpacity={0.7}
              >
                <View style={styles.navPillContent}>
                  <Icon name="coach" size={13} color={accentTextColor} />
                  <Text numberOfLines={1} style={[styles.navPillBtnActiveText, { color: accentTextColor }]}>
                    {t('tracker.dashboard.nav.coach')}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {onBackToPlan && (
              <TouchableOpacity
                style={[
                  styles.navPillBtn,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
                onPress={onBackToPlan}
                activeOpacity={0.7}
              >
                <View style={styles.navPillContent}>
                  <Icon name="clipboard" size={13} color={theme.colors.textPrimary} />
                  <Text numberOfLines={1} style={[styles.navPillBtnText, { color: theme.colors.textPrimary }]}>
                    {t('tracker.dashboard.nav.targets')}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/*
              No Survey pill here. The nav row is for places you go during a
              normal day — meals, weight, coach, targets — and re-taking the
              whole onboarding survey is not one of them. It still lives in the
              profile sheet, where settings-shaped actions belong.
            */}
          </ScrollView>
        </View>

        {/* 1. Daily Progress Hero Card + 2x2 Metric Grid */}
        <DailyProgressHeader summary={summary} weeklyHistoryFills={weeklyHistoryFills} />

        {!isGuest && <StreakBadge {...loggingStreak} />}

        {onOpenWorkouts && (
          <TodayWorkoutCard
            plan={workoutPlan}
            logs={workoutLogs}
            todayKey={localDateKey()}
            onSetUp={onOpenWorkouts}
            onSeeWeek={onOpenWorkouts}
            onOpenDay={isGuest ? () => setWorkoutPromptVisible(true) : (onOpenWorkoutDay ?? (() => onOpenWorkouts()))}
            sample={isGuest}
          />
        )}

        {/* 2. Dynamic AI Recommendation Card */}
        <AiRecommendationCard
          key={activeRegion}
          remainingCalories={summary.remainingCalories}
          remainingProtein={Math.max(0, summary.targetProteinGrams - summary.totalProteinConsumed)}
          totalCaloriesConsumed={summary.totalCaloriesConsumed}
          itemsLoggedCount={summary.items.length}
          onLogRecommendation={handleLogRecommendation}
          onOpenLogMeal={() => handleOpenAdd('breakfast')}
          onAskCoach={() => {
            if (isGuest) {
              setGuestModalVisible(true);
              return;
            }
            onOpenCoachChat?.();
          }}
        />

        {/* 3. Quick Staples 1-Tap Log Bar */}
        <QuickStaplesBar
          onQuickLog={handleQuickLogStaple}
        />

        {/* 4. Water Tracker */}
        <WaterTrackerCard
          consumedMl={summary.waterMlConsumed}
          targetMl={summary.targetWaterMl}
          onLogWater={handleLogWater}
        />

        {/* 5. Today's Meals Timeline */}
        <View style={styles.slotsSection}>
          <View style={styles.slotsHeadingRow}>
            <Text style={[styles.sectionHeading, dir.text, { color: theme.colors.textPrimary, marginHorizontal: 0, marginBottom: 0 }]}>
              {t('tracker.dashboard.todaysMeals')}
            </Text>
            <View
              style={[
                styles.mealsProgressPill,
                {
                  backgroundColor:
                    completedSlotsCount === 4
                      ? accentColor
                      : isDark
                      ? 'rgba(164, 235, 63, 0.15)'
                      : '#DCFCE7',
                  borderColor: accentColor,
                },
              ]}
            >
              <Text
                style={[
                  styles.mealsProgressText,
                  {
                    color:
                      completedSlotsCount === 4
                        ? accentTextColor
                        : isDark
                        ? accentColor
                        : '#365314',
                  },
                ]}
              >
                {completedSlotsCount === 4
                  ? t('tracker.dashboard.allMealsDone')
                  : t('tracker.dashboard.slotsLogged', { count: completedSlotsCount })}
              </Text>
            </View>
          </View>

          <MealSlotCard
            slot="breakfast"
            title={t('tracker.mealSlots.breakfast.' + activeRegion)}
            icon={<Icon name="sun" size={18} color="#F59E0B" />}
            items={engine.getItemsBySlot('breakfast')}
            onAddItem={handleOpenAdd}
            onDeleteItem={handleDeleteItem}
          />

          <MealSlotCard
            slot="lunch"
            title={t('tracker.mealSlots.lunch.' + activeRegion)}
            icon={<Icon name="utensils" size={18} color={theme.colors.primaryLime} />}
            items={engine.getItemsBySlot('lunch')}
            onAddItem={handleOpenAdd}
            onDeleteItem={handleDeleteItem}
          />

          <MealSlotCard
            slot="dinner"
            title={t('tracker.mealSlots.dinner.' + activeRegion)}
            icon={<Icon name="utensils" size={18} color="#3B82F6" />}
            items={engine.getItemsBySlot('dinner')}
            onAddItem={handleOpenAdd}
            onDeleteItem={handleDeleteItem}
          />

          <MealSlotCard
            slot="snacks_chai"
            title={t('tracker.mealSlots.snacks_chai.' + activeRegion)}
            icon={<Icon name="coffee" size={18} color="#D97706" />}
            items={engine.getItemsBySlot('snacks_chai')}
            onAddItem={handleOpenAdd}
            onDeleteItem={handleDeleteItem}
          />
        </View>

        {/* Rolling Weekly Calorie Bank Card (Dynamic Real Data) */}
        <WeeklyCalorieBankCard
          targetCalories={targets.targetCalories}
          dailyHistory={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
            const currentDayOfWeek = (new Date().getDay() + 6) % 7;
            if (idx === currentDayOfWeek) {
              return {
                day,
                consumed: Math.round(summary.totalCaloriesConsumed),
                target: targets.targetCalories,
                isLogged: true,
              };
            }
            return {
              day,
              consumed: 0,
              target: targets.targetCalories,
              isLogged: false,
            };
          })}
          weeklyDeficitKcal={
            summary.totalCaloriesConsumed > 0
              ? Math.max(0, targets.targetCalories - summary.totalCaloriesConsumed)
              : 0
          }
        />
      </ScrollView>

      {/* Floating Pitch-Black Capsule Navigation Bar (Revolut/Ronasit Style) */}
      <View
        style={[
          styles.bottomTabBar,
          {
            backgroundColor: theme.colors.floatingBarBg,
            borderColor: theme.colors.border,
            bottom: bottomBarOffset,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.bottomTabItem, activeTab === 'today' && styles.bottomTabItemActive]}
          onPress={() => {
            HapticFeedback.selection();
            setActiveTab('today');
            setDiaryVisible(false);
          }}
          activeOpacity={0.7}
        >
          <Icon
            name="sun"
            size={18}
            color={activeTab === 'today' ? accentColor : '#8E929B'}
          />
          <Text
            style={[
              styles.bottomTabText,
              { color: activeTab === 'today' ? accentColor : '#8E929B' },
            ]}
          >
            {t('common.today')}
          </Text>
        </TouchableOpacity>

        {/* Center Solid Lime or Saudi Emerald Log Meal Button */}
        <TouchableOpacity
          style={[styles.bottomCenterLogBtn, { backgroundColor: accentColor }]}
          onPress={() => {
            HapticFeedback.impactMedium();
            handleOpenHub(defaultSlotForNow());
          }}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={16} color={accentTextColor} />
          <Text style={[styles.bottomCenterLogText, { color: accentTextColor }]}>
            {t('tracker.dashboard.logMeal')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomTabItem, activeTab === 'diary' && styles.bottomTabItemActive]}
          onPress={() => {
            HapticFeedback.selection();
            setActiveTab('diary');
            setDiaryDayOffset(0);
            setDiaryVisible(true);
          }}
          activeOpacity={0.7}
        >
          <Icon
            name="clipboard"
            size={18}
            color={activeTab === 'diary' ? accentColor : '#8E929B'}
          />
          <Text
            style={[
              styles.bottomTabText,
              { color: activeTab === 'diary' ? accentColor : '#8E929B' },
            ]}
          >
            {t('tracker.dashboard.diary')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Log a Meal Hub Screen */}
      <MealLogHubModal
        visible={hubVisible}
        onClose={() => setHubVisible(false)}
        onSelectBrand={handleSelectBrandInHub}
        onSelectItem={handleSelectItemInHubOrBrand}
        onConfirmBasket={handleConfirmBasket}
        slot={activeSlot}
        onSlotChange={setActiveSlot}
        onLogDescribedMeal={handleLogDescribedMeal}
      />

      {/* Brand Menu View with Sub-Categories */}
      <BrandMenuModal
        visible={brandMenuVisible}
        brandId={selectedBrandId}
        onBack={() => {
          setBrandMenuVisible(false);
          setHubVisible(true);
        }}
        onSelectItem={handleSelectItemInHubOrBrand}
      />

      {/* Make It Yours Live Order Customizer */}
      <ItemCustomizerModal
        visible={customizerVisible}
        item={selectedItemForCustomize}
        initialMealSlot={activeSlot}
        onClose={() => {
          setCustomizerVisible(false);
          setSelectedItemForCustomize(null);
        }}
        onConfirmCustomizedLog={handleConfirmCustomizedLog}
      />

      {/* Diary Screen */}
      <DiaryViewModal
        visible={diaryVisible}
        summary={diarySummary}
        dayOffset={diaryDayOffset}
        minDayOffset={minDiaryDayOffset}
        onDayOffsetChange={setDiaryDayOffset}
        readOnly={diaryDayOffset !== 0}
        onClose={() => {
          setDiaryVisible(false);
          setActiveTab('today');
        }}
        onDeleteItem={handleDeleteItem}
        onOpenLogHub={() => {
          setDiaryVisible(false);
          handleOpenHub();
        }}
      />

      {/* Profile & Settings Drawer */}
      <ProfileSheet
        visible={profileVisible}
        fade={profileFade}
        slide={profileSlide}
        onClose={closeProfile}
        userName={userName}
        targets={targets}
        isGuest={!!isGuest}
        onOpenSurvey={onOpenSurvey}
        onOpenMealPlan={onOpenMealPlan}
        onOpenWeeklyCheckIn={onOpenWeeklyCheckIn}
        onRequireAuth={onRequireAuth}
        onLogout={onLogout}
      />

      {/* Guest Authentication Guard Modal */}
      <GuestAuthModal
        visible={guestModalVisible}
        onClose={() => setGuestModalVisible(false)}
        onSignIn={() => {
          setGuestModalVisible(false);
          onRequireAuth?.();
        }}
      />
      <GuestAuthModal
        visible={workoutPromptVisible}
        title={t('workout.guest.promptTitle')}
        description={t('workout.guest.promptBody')}
        onClose={() => setWorkoutPromptVisible(false)}
        onSignIn={() => {
          setWorkoutPromptVisible(false);
          onRequireAuth?.();
        }}
      />
    </SafeAreaView>
  );
};
