import React, { useState, useRef } from 'react';
import { Animated, View, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { hiddenFromAssistiveTech } from '../../common/a11yHidden.js';
import { DailyProgressHeader } from './DailyProgressHeader.js';
import { TodayHeader } from './TodayHeader.js';
import { TodayBento, WaterTile, WeightTile } from './TodayBento.js';
import { TodayMealsCard } from './TodayMealsCard.js';
import { TodayBottomBar } from './TodayBottomBar.js';
import { MealLogHubModal, MealBasketEntry } from './MealLogHubModal.js';
import { BrandMenuModal } from './BrandMenuModal.js';
import { ItemCustomizerModal, CustomizedLogPayload } from './ItemCustomizerModal.js';
import { DiaryViewModal } from './DiaryViewModal.js';
import { AiRecommendationCard } from './AiRecommendationCard.js';
import type { SuggestionItem } from '../suggestions.js';
import { QuickStaplesBar, StapleItem } from './QuickStaplesBar.js';
import { resolveStaple } from '../staples.js';
import { TrackerEngine } from '../engine.js';
import { MealSlot, DailyTrackerSummary, LoggedItem } from '../types.js';
import { foodDisplayName } from '../foodDisplayName.js';
import { UndoToast, UNDO_WINDOW_MS } from '../../ui/UndoToast.js';
import type { DraftLogEntry } from '../describeMeal.js';
import type { NormalizedFood, ServingUnit } from '@nutrio/food-db';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';
import { useConfirmedRegionSwitch } from '../../common/region/useConfirmedRegionSwitch.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { GuestAuthModal } from './GuestAuthModal.js';
import { ProfileSheet } from './ProfileSheet.js';
import type { WeeklyWorkoutPlan, WorkoutLog } from '@nutrio/workout-core';
import { TodayWorkoutCard } from '../../workout/ui/TodayWorkoutCard.js';
import { saveDailyActivities, loadDailyActivities, getOrInitHistoryStartDate } from '../activityStorage.js';
import { recordFoodUsage } from '../mealPresets.js';
import { defaultServingFor } from '../personalServings.js';
import { foodKey } from './useMealBasket.js';
import { pushDailyActivities } from '../../sync/activitySync.js';
import { HapticFeedback } from '../../ui/haptics.js';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { addDaysToKey, localDateKey } from '../../common/dateKey.js';
import { styles } from './TrackerDashboardScreen.styles.js';
import { MEAL_SLOTS, defaultSlotForHour, nextSlotToLog } from '../mealsCard.js';
import { loadWeighIns } from '../../weight/weightStorage.js';
import { withSurveyBaseline } from '../../weight/surveyBaseline.js';
import { weightGlance } from '../../weight/weightGlance.js';
import { weekStripFor } from '../weekStrip.js';
import { weekStartFor } from '../../workout/weekView.js';
import { computeLoggingStreak } from '../streak.js';
import { StreakBadge } from './StreakBadge.js';
import { WeeklyCalorieBankCard } from './WeeklyCalorieBankCard.js';
import { useReducedMotion } from '../../ui/useReducedMotion.js';

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
  /** The weight from the survey: the first weigh-in until the user logs a real one. */
  surveyWeightKg?: number | null;
  /** The signed-in user's email, shown in the profile sheet. */
  userEmail?: string | null;
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
  surveyWeightKg = null,
  userEmail = null,
}) => {
  const { theme } = useTheme();
  const { activeRegion } = useRegion();
  const requestRegionSwitch = useConfirmedRegionSwitch();
  const { t } = useTranslation();
  const dir = useTextDirection();

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
  // On a wide browser the bar sits in the layout under the scroll area instead of
  // floating over it, so it never covers or clips content.
  const { width: windowWidth } = useWindowDimensions();
  const dockBar = Platform.OS === 'web' && windowWidth >= 900;

  // Guests explore: they see an empty day and nothing saved on this device,
  // and logging asks them to create an account.
  const loadDay = (date: string, region: 'PK' | 'SA') => (isGuest ? null : loadDailyActivities(date, region));

  const enginesRef = useRef<Record<'PK' | 'SA', TrackerEngine>>({
    PK: (() => {
      if (activeRegion === 'PK' && trackerEngine) return trackerEngine;
      const eng = new TrackerEngine(targets);
      const today = localDateKey();
      const saved = loadDay(today, 'PK');
      if (saved && saved.items) eng.loadItems(saved.items, saved.waterMl || 0);
      return eng;
    })(),
    SA: (() => {
      if (activeRegion === 'SA' && trackerEngine) return trackerEngine;
      const eng = new TrackerEngine(targets);
      const today = localDateKey();
      const saved = loadDay(today, 'SA');
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
    const saved = loadDay(today, activeRegion);
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
  const [guestModalVisible, setGuestModalVisible] = useState(false);
  /** A guest tapped Start on the sample workout. */
  const [workoutPromptVisible, setWorkoutPromptVisible] = useState(false);
  const [staplesSheetOpen, setStaplesSheetOpen] = useState(false);

  // Profile modal with minimalist animation
  const [profileVisible, setProfileVisible] = useState(false);
  const profileFade = useRef(new Animated.Value(0)).current;
  const profileSlide = useRef(new Animated.Value(150)).current;

  const reduceMotion = useReducedMotion();

  const openProfile = () => {
    setProfileVisible(true);
    if (reduceMotion) {
      profileFade.setValue(1);
      profileSlide.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(profileFade, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(profileSlide, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();
  };

  const closeProfile = (callback?: () => void) => {
    if (reduceMotion) {
      profileFade.setValue(0);
      profileSlide.setValue(150);
      setProfileVisible(false);
      if (callback) callback();
      return;
    }
    Animated.parallel([
      Animated.timing(profileFade, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(profileSlide, { toValue: 150, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setProfileVisible(false);
      if (callback) callback();
    });
  };

  const summary = engine.getSummary();

  // While any sheet or dialog is open the dashboard under it is hidden from
  // screen readers (and, on web, out of the reading order).
  const overlayOpen =
    hubVisible ||
    brandMenuVisible ||
    customizerVisible ||
    diaryVisible ||
    profileVisible ||
    guestModalVisible ||
    workoutPromptVisible ||
    staplesSheetOpen;

  // Diary history never reaches back further than the day this user (or this
  // guest device) first opened the tracker — a brand-new user has no "before"
  // to view, so the back arrow stops right there.
  const historyStartDate = useRef(isGuest ? localDateKey() : getOrInitHistoryStartDate()).current;
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
          const saved = loadDay(diaryDate, activeRegion);
          if (saved && saved.items) {
            pastEngine.loadItems(saved.items, saved.waterMl || 0);
          }
          return pastEngine.getSummary();
        })();

  // Calories eaten on each day of the current calendar week, which starts on
  // the region's first day (SA Sunday, else Monday): past days from what was
  // saved, today from the live summary, later days not yet. The hero bars read
  // it. Days are found by date, so a region switch only re-windows the week.
  const weekStrip = weekStripFor(summary.date, activeRegion);
  const weekDays = (() => {
    const todayIdx = weekStrip.todayIndex;
    return weekStrip.dateKeys.map((date, idx) => {
      if (idx === todayIdx) {
        return { consumed: summary.totalCaloriesConsumed, isLogged: summary.items.length > 0, isToday: true };
      }
      if (idx > todayIdx) return { consumed: 0, isLogged: false, isToday: false };
      const saved = loadDay(date, activeRegion);
      if (!saved?.items?.length) return { consumed: 0, isLogged: false, isToday: false };
      const dayEngine = new TrackerEngine({ ...targets, date });
      dayEngine.loadItems(saved.items, saved.waterMl || 0);
      return { consumed: dayEngine.getSummary().totalCaloriesConsumed, isLogged: true, isToday: false };
    });
  })();

  // A brand-new user: nothing logged today or earlier this week. The tiles that
  // would read 0 (macros, weekly bank, streak) give way to the targets and the
  // first-meal card.
  const isFirstDay = weekDays.every((d) => !d.isLogged);

  // Fill (0-1) of the daily calorie target for each finished day of the week.
  // Today and later days stay 0 here; the hero draws today separately.
  const weeklyHistoryFills = weekDays.map((d) =>
    d.isToday ? 0 : Math.min(1, d.consumed / Math.max(1, targets.targetCalories))
  );

  // Logging streak from which days have a saved log (today from the live
  // list). Guests read nothing saved, so they get no streak.
  const weekStart = weekStartFor(activeRegion);
  const loggingStreak = isGuest
    ? null
    : computeLoggingStreak(
        (date) => (date === summary.date ? summary.items.length > 0 : !!loadDay(date, activeRegion)?.items?.length),
        summary.date,
        weekStart
      );

  /** True (and the sign-up prompt opens) when a guest tries to log or change anything. */
  const blockGuest = () => {
    if (!isGuest) return false;
    setGuestModalVisible(true);
    return true;
  };

  const handleOpenAdd = (slot: MealSlot) => {
    if (blockGuest()) return;
    setActiveSlot(slot);
    setHubVisible(true);
  };

  const handleOpenHub = (slot?: MealSlot) => {
    if (blockGuest()) return;
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
    if (blockGuest()) return;
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
      payload.actualGrams,
      payload.food.nameAr
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
    if (blockGuest()) return;
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
    if (blockGuest()) return;
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
    if (blockGuest()) return;
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

  // The last removed item, kept for UNDO_WINDOW_MS so one tap can bring it back.
  const [pendingUndo, setPendingUndo] = useState<{ item: LoggedItem; index: number } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearUndo = () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = null;
    setPendingUndo(null);
  };
  React.useEffect(() => () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }, []);
  // The undo belongs to one region's day; switching region closes it.
  React.useEffect(() => {
    clearUndo();
  }, [activeRegion]);

  const handleDeleteItem = (id: string) => {
    if (blockGuest()) return;
    const items = engine.getSummary().items;
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return;
    const removed = items[index];
    engine.deleteItem(id);
    persistCurrentActivities();
    // A newer removal replaces the older one; that one stays removed.
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setPendingUndo({ item: removed, index });
    undoTimer.current = setTimeout(clearUndo, UNDO_WINDOW_MS);
    forceUpdate();
  };

  const handleUndoDelete = () => {
    if (!pendingUndo || blockGuest()) return;
    // Same id, data and position, then the same save and push the delete did.
    engine.restoreItem(pendingUndo.item, pendingUndo.index);
    persistCurrentActivities();
    clearUndo();
    HapticFeedback.selection();
    forceUpdate();
  };

  const undoToast = (style: object) => {
    if (!pendingUndo) return null;
    const name = foodDisplayName(pendingUndo.item.foodName, pendingUndo.item.foodNameAr, dir.isRTL).primary;
    return (
      <UndoToast
        message={t('tracker.mealsCard.removed', { name })}
        undoAccessibilityLabel={t('tracker.mealsCard.undoRemove', { name })}
        onUndo={handleUndoDelete}
        style={style}
      />
    );
  };

  const handleLogWater = (ml: number) => {
    if (blockGuest()) return;
    engine.logWater(ml);
    persistCurrentActivities();
    forceUpdate();
  };

  // Items arrive already resolved to catalogue foods and servings; nothing is
  // looked up by name here, so nothing can fall back to an unrelated dish.
  const handleLogRecommendation = (items: SuggestionItem[]) => {
    const slot = defaultSlotForNow();
    if (blockGuest()) return;
    for (const item of items) {
      engine.logItem(slot, item.food, item.serving, item.quantity);
    }
    persistCurrentActivities();
    forceUpdate();
  };

  // The hub's "+" on a dish: one standard serving (the user's own if saved) into
  // the meal being logged, without opening the detail sheet. Returns the new
  // item's id so the hub can offer Undo, or null when nothing was logged.
  const handleQuickLogFromHub = (food: NormalizedFood): string | null => {
    if (blockGuest()) return null;
    const serving = defaultServingFor(food, foodKey(food), t('tracker.customizer.myServing'));
    if (!serving) return null;
    const logged = engine.logItem(activeSlot, food, serving, 1);
    recordFoodUsage([food.id || food.name]);
    persistCurrentActivities();
    HapticFeedback.impactMedium();
    forceUpdate();
    return logged.id;
  };

  const handleUndoQuickLog = (id: string) => {
    engine.deleteItem(id);
    persistCurrentActivities();
    forceUpdate();
  };

  const handleQuickLogStaple = (staple: StapleItem, slot: MealSlot) => {
    if (blockGuest()) return;
    const { food, serving } = resolveStaple(staple, activeRegion);
    engine.logItem(slot, food, serving, 1);
    persistCurrentActivities();
    forceUpdate();
  };

  /** The meal people most likely mean right now, used to preselect the hub. */
  const defaultSlotForNow = (): MealSlot => defaultSlotForHour(new Date().getHours());

  const itemCountBySlot = Object.fromEntries(
    MEAL_SLOTS.map((slot) => [slot, engine.getItemsBySlot(slot).length])
  ) as Record<MealSlot, number>;

  // The survey weight is the first weigh-in, the same as on the weight screen.
  const weight = isGuest ? null : weightGlance(withSurveyBaseline(loadWeighIns(), surveyWeightKg, historyStartDate));
  const openWeight = onOpenWeightTracker
    ? () => {
        if (isGuest) {
          setGuestModalVisible(true);
          return;
        }
        onOpenWeightTracker();
      }
    : undefined;
  const openCoach = () => {
    if (isGuest) {
      setGuestModalVisible(true);
      return;
    }
    onOpenCoachChat?.();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.canvas }]}>
      <View style={styles.screenLayer} {...hiddenFromAssistiveTech(overlayOpen)}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.scrollPad, { paddingBottom: dockBar ? 24 : 136 + insetsBottom }]}
          showsVerticalScrollIndicator={false}
        >
          <TodayHeader
            userName={userName}
            region={activeRegion === 'SA' ? 'SA' : 'PK'}
            pendingSyncCount={summary.pendingSyncCount}
            onOpenProfile={openProfile}
            onSwitchRegion={requestRegionSwitch}
          />

          {/* Hero + macro tiles. Their own bottom margin is 16; cards below sit 12 apart. */}
          <View style={styles.heroWrap}>
            <DailyProgressHeader
              summary={summary}
              weeklyHistoryFills={weeklyHistoryFills}
              weekdays={weekStrip.weekdays}
              todayIndex={weekStrip.todayIndex}
              firstDay={isFirstDay}
            />
          </View>

          <View style={styles.sections}>
            <TodayBento
              workoutWide={!workoutPlan}
              workout={
                onOpenWorkouts ? (
                  <TodayWorkoutCard
                    variant="tile"
                    plan={workoutPlan}
                    logs={workoutLogs}
                    todayKey={localDateKey()}
                    onSetUp={onOpenWorkouts}
                    onSeeWeek={onOpenWorkouts}
                    onOpenDay={isGuest ? () => setWorkoutPromptVisible(true) : (onOpenWorkoutDay ?? (() => onOpenWorkouts()))}
                    sample={isGuest}
                  />
                ) : undefined
              }
              weight={<WeightTile glance={weight} onPress={openWeight} />}
              water={
                <WaterTile
                  consumedMl={summary.waterMlConsumed}
                  targetMl={summary.targetWaterMl}
                  onLogWater={handleLogWater}
                />
              }
            />

            <AiRecommendationCard
              key={activeRegion}
              remainingCalories={summary.remainingCalories}
              remainingProtein={Math.max(0, summary.targetProteinGrams - summary.totalProteinConsumed)}
              totalCaloriesConsumed={summary.totalCaloriesConsumed}
              itemsLoggedCount={summary.items.length}
              onLogRecommendation={handleLogRecommendation}
              onOpenLogMeal={() => handleOpenAdd('breakfast')}
              onAskCoach={openCoach}
            />

            <QuickStaplesBar
              onQuickLog={handleQuickLogStaple}
              onRequireAccount={isGuest ? () => setGuestModalVisible(true) : undefined}
              onSheetOpenChange={setStaplesSheetOpen}
            />

            <TodayMealsCard
              items={summary.items}
              targetCalories={summary.targetCalories}
              nextSlot={nextSlotToLog(defaultSlotForNow(), itemCountBySlot)}
              onAddItem={handleOpenAdd}
              onDeleteItem={handleDeleteItem}
              onOpenMealPlan={onOpenMealPlan}
            />

            {loggingStreak && !isFirstDay ? <StreakBadge {...loggingStreak} weekStart={weekStart} /> : null}

            {!isFirstDay && (
              <WeeklyCalorieBankCard
                targetCalories={targets.targetCalories}
                weekStart={weekStart}
                dailyHistory={weekDays.map((d, idx) => ({
                  day: weekStrip.weekdays[idx],
                  consumed: Math.round(d.consumed),
                  target: targets.targetCalories,
                  isLogged: d.isLogged,
                  isToday: d.isToday,
                }))}
              />
            )}
          </View>
        </ScrollView>

        <TodayBottomBar
          bottom={bottomBarOffset}
          docked={dockBar}
          onOpenDiary={() => {
            setDiaryDayOffset(0);
            setDiaryVisible(true);
          }}
          onQuickLog={() => handleOpenHub(defaultSlotForNow())}
          onOpenCoach={openCoach}
        />

        {/* Above the floating bar (bar ~64 pt tall); the diary shows its own copy. */}
        {!diaryVisible && undoToast({ bottom: dockBar ? 24 : bottomBarOffset + 76 })}
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
        onQuickLog={handleQuickLogFromHub}
        onUndoQuickLog={handleUndoQuickLog}
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
        onClose={() => setDiaryVisible(false)}
        onDeleteItem={handleDeleteItem}
        undoToast={diaryVisible ? undoToast({ bottom: diaryDayOffset === 0 ? 116 : 24 }) : null}
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
        email={userEmail}
        targets={targets}
        isGuest={!!isGuest}
        onOpenSurvey={onOpenSurvey}
        onOpenMealPlan={onOpenMealPlan}
        onOpenTargets={onBackToPlan}
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
