import React, { useState, useRef } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { DailyProgressHeader } from './DailyProgressHeader.js';
import { WaterTrackerCard } from './WaterTrackerCard.js';
import { MealSlotCard } from './MealSlotCard.js';
import { UnifiedLogMealModal } from './UnifiedLogMealModal.js';
import { MealLogHubModal } from './MealLogHubModal.js';
import { BrandMenuModal } from './BrandMenuModal.js';
import { ItemCustomizerModal, CustomizedLogPayload } from './ItemCustomizerModal.js';
import { DiaryViewModal } from './DiaryViewModal.js';
import { AiRecommendationCard, RecommendedFood } from './AiRecommendationCard.js';
import { QuickStaplesBar, StapleItem } from './QuickStaplesBar.js';
import { WeeklyCalorieBankCard } from './WeeklyCalorieBankCard.js';
import { TrackerEngine } from '../engine.js';
import { MealSlot } from '../types.js';
import { NormalizedFood, PAKISTANI_STAPLES_DATA, ServingUnit } from '@nutrio/food-db';
import { ResolvedFoodItem } from '@nutrio/nutrition-core';
import { useTheme } from '../../theme.js';
import { Icon } from '../../ui/Icon.js';

interface TrackerDashboardScreenProps {
  userName?: string;
  targets: {
    targetCalories: number;
    targetProteinGrams: number;
    targetFatGrams: number;
    targetCarbGrams: number;
    targetWaterMl?: number;
  };
  onBackToPlan?: () => void;
  onOpenWeightTracker?: () => void;
  onOpenMealPlan?: () => void;
  onOpenCoachChat?: () => void;
  onOpenSurvey?: () => void;
  onOpenHome?: () => void;
  onLogout?: () => void;
}

export const TrackerDashboardScreen: React.FC<TrackerDashboardScreenProps> = ({
  userName = 'Talha',
  targets,
  onBackToPlan,
  onOpenWeightTracker,
  onOpenMealPlan,
  onOpenCoachChat,
  onOpenSurvey,
  onOpenHome,
  onLogout,
}) => {
  const { theme, mode, setMode, toggleTheme } = useTheme();
  const [engine] = useState(() => new TrackerEngine(targets));
  const [, setRerender] = useState(0);
  const forceUpdate = () => setRerender((prev) => prev + 1);

  const [modalVisible, setModalVisible] = useState(false);
  const [activeSlot, setActiveSlot] = useState<MealSlot>('breakfast');

  // Calorify Modal Flow states
  const [hubVisible, setHubVisible] = useState(false);
  const [brandMenuVisible, setBrandMenuVisible] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [customizerVisible, setCustomizerVisible] = useState(false);
  const [selectedItemForCustomize, setSelectedItemForCustomize] = useState<NormalizedFood | null>(null);
  const [diaryVisible, setDiaryVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'diary'>('today');

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
    engine.logCustomizedItem(
      payload.mealSlot,
      payload.food.name,
      payload.food.nameUr,
      `${payload.quantity}x ${servingDesc}`,
      payload.quantity,
      payload.totalCalories,
      payload.totalProtein,
      payload.totalCarbs,
      payload.totalFat
    );
    setCustomizerVisible(false);
    setSelectedItemForCustomize(null);
    forceUpdate();
  };

  const handleConfirmLog = (
    slot: MealSlot,
    food: NormalizedFood,
    serving: ServingUnit,
    quantity: number
  ) => {
    engine.logItem(slot, food, serving, quantity);
    forceUpdate();
  };

  const handleConfirmPlateItems = (
    slot: MealSlot,
    items: ResolvedFoodItem[]
  ) => {
    for (const item of items) {
      const found =
        PAKISTANI_STAPLES_DATA.find((f) => f.name === item.matchedFoodName) ||
        PAKISTANI_STAPLES_DATA[0];
      const serving = found.servings[0] || {
        label: item.servingLabel,
        grams: item.servingGrams,
      };
      const qty = item.resolvedGrams / serving.grams;
      engine.logItem(slot, found, serving, Number(qty.toFixed(1)));
    }
    forceUpdate();
  };

  const handleDeleteItem = (id: string) => {
    engine.deleteItem(id);
    forceUpdate();
  };

  const handleLogWater = (ml: number) => {
    engine.logWater(ml);
    forceUpdate();
  };

  const handleLogRecommendation = (items: RecommendedFood[]) => {
    for (const item of items) {
      const found =
        PAKISTANI_STAPLES_DATA.find((f) =>
          f.name.toLowerCase().includes(item.name.toLowerCase())
        ) || PAKISTANI_STAPLES_DATA[0];
      const serving = found.servings[0] || { label: 'serving', grams: 100 };
      const qty = Number((item.calories / (serving.kcal || found.kcal100g || 100)).toFixed(1));
      engine.logItem('dinner', found, serving, Math.max(0.5, qty));
    }
    forceUpdate();
  };

  const handleQuickLogStaple = (staple: StapleItem) => {
    const found =
      PAKISTANI_STAPLES_DATA.find((f) =>
        f.name.toLowerCase().includes(staple.name.toLowerCase())
      ) || PAKISTANI_STAPLES_DATA[0];
    const serving = found.servings[0] || { label: 'serving', grams: 100 };
    const targetSlot: MealSlot = activeSlot || 'lunch';
    engine.logItem(targetSlot, found, serving, 1);
    forceUpdate();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.canvas }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollPad}
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
                    borderColor: theme.colors.primaryLime,
                  },
                ]}
              >
                <Text style={[styles.avatarInitial, { color: theme.colors.primaryLime }]}>
                  {userName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={[styles.greetingText, { color: theme.colors.textMuted }]}>
                  TODAY
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>
                    {userName}
                  </Text>
                  <View style={[styles.freeTag, { backgroundColor: theme.colors.primaryLime }]}>
                    <Text style={styles.freeTagText}>FREE</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            {/* Quick Theme Switcher Pill */}
            <TouchableOpacity
              style={[
                styles.themeToggleBtn,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={toggleTheme}
              activeOpacity={0.7}
            >
              <Text style={[styles.themeToggleText, { color: theme.colors.textPrimary }]}>
                {mode === 'dark' ? '☀️ Light' : '🌙 Dark'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Action Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.navActionsScroll}
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
                  <Text style={[styles.navPillBtnText, { color: theme.colors.textPrimary }]}>
                    Meals
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {onOpenWeightTracker && (
              <TouchableOpacity
                style={[
                  styles.navPillBtn,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
                onPress={onOpenWeightTracker}
                activeOpacity={0.7}
              >
                <View style={styles.navPillContent}>
                  <Icon name="scale" size={13} color={theme.colors.textPrimary} />
                  <Text style={[styles.navPillBtnText, { color: theme.colors.textPrimary }]}>
                    Weight
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {onOpenCoachChat && (
              <TouchableOpacity
                style={[
                  styles.navPillBtnActive,
                  { backgroundColor: theme.colors.primaryLime },
                ]}
                onPress={onOpenCoachChat}
                activeOpacity={0.7}
              >
                <View style={styles.navPillContent}>
                  <Icon name="coach" size={13} color="#0A0B0D" />
                  <Text style={[styles.navPillBtnActiveText, { color: '#0A0B0D' }]}>
                    AI Coach
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
                  <Text style={[styles.navPillBtnText, { color: theme.colors.textPrimary }]}>
                    Targets
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {onOpenSurvey && (
              <TouchableOpacity
                style={[
                  styles.navPillBtn,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
                onPress={onOpenSurvey}
                activeOpacity={0.7}
              >
                <View style={styles.navPillContent}>
                  <Icon name="survey" size={13} color={theme.colors.textPrimary} />
                  <Text style={[styles.navPillBtnText, { color: theme.colors.textPrimary }]}>
                    Survey
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* 1. Daily Progress Hero Card + 2x2 Metric Grid */}
        <DailyProgressHeader summary={summary} />

        {/* 2. Dynamic AI Recommendation Card */}
        <AiRecommendationCard
          remainingCalories={summary.remainingCalories}
          remainingProtein={Math.max(0, summary.targetProteinGrams - summary.totalProteinConsumed)}
          onLogRecommendation={handleLogRecommendation}
          onAskCoach={onOpenCoachChat}
        />

        {/* 3. Quick Staples 1-Tap Log Bar & Plate Scan */}
        <QuickStaplesBar
          onQuickLog={handleQuickLogStaple}
          onScanPlate={() => {
            setActiveSlot('dinner');
            setModalVisible(true);
          }}
        />

        {/* 4. Water Tracker */}
        <WaterTrackerCard
          consumedMl={summary.waterMlConsumed}
          targetMl={summary.targetWaterMl}
          onLogWater={handleLogWater}
        />

        {/* 5. Today's Meals Timeline */}
        <View style={styles.slotsSection}>
          <Text style={[styles.sectionHeading, { color: theme.colors.textPrimary }]}>
            Today's Logged Meals
          </Text>

          <MealSlotCard
            slot="breakfast"
            title="Breakfast"
            icon={<Icon name="sun" size={18} color="#F59E0B" />}
            items={engine.getItemsBySlot('breakfast')}
            onAddItem={handleOpenAdd}
            onDeleteItem={handleDeleteItem}
          />

          <MealSlotCard
            slot="lunch"
            title="Lunch"
            icon={<Icon name="utensils" size={18} color={theme.colors.primaryLime} />}
            items={engine.getItemsBySlot('lunch')}
            onAddItem={handleOpenAdd}
            onDeleteItem={handleDeleteItem}
          />

          <MealSlotCard
            slot="dinner"
            title="Dinner"
            icon={<Icon name="utensils" size={18} color="#3B82F6" />}
            items={engine.getItemsBySlot('dinner')}
            onAddItem={handleOpenAdd}
            onDeleteItem={handleDeleteItem}
          />

          <MealSlotCard
            slot="snacks_chai"
            title="Snacks & Chai"
            icon={<Icon name="coffee" size={18} color="#D97706" />}
            items={engine.getItemsBySlot('snacks_chai')}
            onAddItem={handleOpenAdd}
            onDeleteItem={handleDeleteItem}
          />
        </View>

        {/* Rolling Weekly Calorie Bank Card */}
        <WeeklyCalorieBankCard
          weeklyDeficitKcal={2450}
          targetCalories={targets.targetCalories}
        />
      </ScrollView>

      {/* Floating Pitch-Black Capsule Navigation Bar (Revolut/Ronasit Style) */}
      <View
        style={[
          styles.bottomTabBar,
          {
            backgroundColor: theme.colors.floatingBarBg,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.bottomTabItem, activeTab === 'today' && styles.bottomTabItemActive]}
          onPress={() => {
            setActiveTab('today');
            setDiaryVisible(false);
          }}
          activeOpacity={0.7}
        >
          <Icon
            name="sun"
            size={18}
            color={activeTab === 'today' ? theme.colors.primaryLime : '#8E929B'}
          />
          <Text
            style={[
              styles.bottomTabText,
              { color: activeTab === 'today' ? theme.colors.primaryLime : '#8E929B' },
            ]}
          >
            Today
          </Text>
        </TouchableOpacity>

        {/* Center Solid Lime Log Meal Button */}
        <TouchableOpacity
          style={[styles.bottomCenterLogBtn, { backgroundColor: theme.colors.primaryLime }]}
          onPress={() => handleOpenHub('lunch')}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={16} color="#0A0B0D" />
          <Text style={[styles.bottomCenterLogText, { color: '#0A0B0D' }]}>Log Meal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomTabItem, activeTab === 'diary' && styles.bottomTabItemActive]}
          onPress={() => {
            setActiveTab('diary');
            setDiaryVisible(true);
          }}
          activeOpacity={0.7}
        >
          <Icon
            name="clipboard"
            size={18}
            color={activeTab === 'diary' ? theme.colors.primaryLime : '#8E929B'}
          />
          <Text
            style={[
              styles.bottomTabText,
              { color: activeTab === 'diary' ? theme.colors.primaryLime : '#8E929B' },
            ]}
          >
            Diary
          </Text>
        </TouchableOpacity>
      </View>

      {/* Log a Meal Hub Screen */}
      <MealLogHubModal
        visible={hubVisible}
        onClose={() => setHubVisible(false)}
        onSelectBrand={handleSelectBrandInHub}
        onSelectItem={handleSelectItemInHubOrBrand}
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
        summary={summary}
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

      {/* Multimodal Unified Meal Logging Modal */}
      <UnifiedLogMealModal
        visible={modalVisible}
        mealSlot={activeSlot}
        onClose={() => setModalVisible(false)}
        onConfirmSingleFood={handleConfirmLog}
        onConfirmPlateItems={handleConfirmPlateItems}
      />

      {/* Profile & Settings Drawer Modal */}
      <Modal
        visible={profileVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => closeProfile()}
      >
        <Animated.View style={[styles.profileOverlay, { opacity: profileFade }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => closeProfile()}
            activeOpacity={1}
          />
          <Animated.View
            style={[
              styles.profileSheet,
              {
                backgroundColor: theme.colors.surface,
                transform: [{ translateY: profileSlide }],
              },
            ]}
          >
            {/* Sheet Handle */}
            <View style={[styles.sheetHandle, { backgroundColor: theme.colors.border }]} />

            <View style={styles.profileHeaderRow}>
              <View style={[styles.profileAvatarLarge, { backgroundColor: theme.colors.primaryLime }]}>
                <Text style={styles.profileAvatarLargeText}>
                  {userName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.profileNameLarge, { color: theme.colors.textPrimary }]}>
                  {userName}
                </Text>
                <Text style={[styles.profileEmail, { color: theme.colors.textMuted }]}>
                  100% Free Plan • All 60+ Brands Unlocked
                </Text>
              </View>
              <TouchableOpacity
                style={styles.profileCloseBtn}
                onPress={() => closeProfile()}
                activeOpacity={0.7}
              >
                <Text style={[styles.profileCloseText, { color: theme.colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Theme Switcher in User Settings */}
            <View
              style={[
                styles.themeSettingCard,
                { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.themeSettingTitle, { color: theme.colors.textPrimary }]}>
                Appearance
              </Text>
              <View style={styles.themeToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.themeChoiceBtn,
                    mode === 'dark' && { backgroundColor: theme.colors.primaryLime },
                  ]}
                  onPress={() => setMode('dark')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.themeChoiceText,
                      { color: mode === 'dark' ? '#0A0B0D' : theme.colors.textSecondary },
                    ]}
                  >
                    🌙 Dark Mode
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.themeChoiceBtn,
                    mode === 'light' && { backgroundColor: theme.colors.primaryLime },
                  ]}
                  onPress={() => setMode('light')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.themeChoiceText,
                      { color: mode === 'light' ? '#0A0B0D' : theme.colors.textSecondary },
                    ]}
                  >
                    ☀️ Light Mode
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Target Summary Stats Card */}
            <View
              style={[
                styles.profileStatsCard,
                {
                  backgroundColor: theme.colors.surfaceSecondary,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.profileStatItem}>
                <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Daily Target</Text>
                <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>
                  {targets.targetCalories} kcal
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.profileStatItem}>
                <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Protein</Text>
                <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>
                  {targets.targetProteinGrams}g
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.profileStatItem}>
                <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Water Goal</Text>
                <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>
                  {targets.targetWaterMl || 3000} ml
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.profileActions}>
              {onOpenSurvey && (
                <TouchableOpacity
                  style={[
                    styles.profileActionBtn,
                    { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
                  ]}
                  onPress={() => closeProfile(onOpenSurvey)}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionBtnRow}>
                    <Icon name="survey" size={16} color={theme.colors.primaryLime} />
                    <Text style={[styles.actionBtnText, { color: theme.colors.textPrimary }]}>
                      Retake Lifestyle Survey
                    </Text>
                  </View>
                  <Icon name="arrow-right" size={14} color={theme.colors.textMuted} />
                </TouchableOpacity>
              )}

              {onOpenMealPlan && (
                <TouchableOpacity
                  style={[
                    styles.profileActionBtn,
                    { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
                  ]}
                  onPress={() => closeProfile(onOpenMealPlan)}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionBtnRow}>
                    <Icon name="utensils" size={16} color={theme.colors.primaryLime} />
                    <Text style={[styles.actionBtnText, { color: theme.colors.textPrimary }]}>
                      View 7-Day Meal Plan
                    </Text>
                  </View>
                  <Icon name="arrow-right" size={14} color={theme.colors.textMuted} />
                </TouchableOpacity>
              )}

              {onLogout && (
                <TouchableOpacity
                  style={[styles.profileActionBtn, styles.logoutBtn]}
                  onPress={() => closeProfile(onLogout)}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionBtnRow}>
                    <Icon name="arrow-left" size={16} color="#EF4444" />
                    <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>
                      Log Out / Return to Home
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 500,
  },
  scrollPad: {
    paddingBottom: 115,
  },
  topNav: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    gap: 12,
  },
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '900',
  },
  greetingText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  freeTag: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  freeTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0A0B0D',
    letterSpacing: 0.5,
  },
  themeToggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
  },
  themeToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  navActionsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  navPillBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
  },
  navPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navPillBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  navPillBtnActive: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  navPillBtnActiveText: {
    fontSize: 12,
    fontWeight: '800',
  },
  slotsSection: {
    marginTop: 10,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    marginHorizontal: 20,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  profileOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  profileSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 18,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  profileAvatarLarge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarLargeText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0A0B0D',
  },
  profileNameLarge: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  profileCloseBtn: {
    padding: 8,
  },
  profileCloseText: {
    fontSize: 18,
    fontWeight: '700',
  },
  themeSettingCard: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  themeSettingTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  themeToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeChoiceBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  themeChoiceText: {
    fontSize: 13,
    fontWeight: '700',
  },
  profileStatsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 18,
    borderWidth: 1,
  },
  profileStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  statNumber: {
    fontSize: 14,
    fontWeight: '800',
  },
  profileActions: {
    gap: 10,
  },
  profileActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  logoutBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
    marginTop: 6,
  },
  bottomTabBar: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    width: '92%',
    maxWidth: 440,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  bottomTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 18,
  },
  bottomTabItemActive: {},
  bottomTabText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  bottomCenterLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 9999,
    gap: 6,
  },
  bottomCenterLogText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
