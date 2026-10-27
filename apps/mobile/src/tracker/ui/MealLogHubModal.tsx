import React, { useState, useMemo, useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { BackButton } from '../../ui/BackButton.js';
import { NamedModal } from '../../ui/NamedModal.js';
import type { NormalizedFood, RestaurantBrand } from '@nutrio/food-db';
import { foodDb } from '../../catalogue/index.js';
import { MealSlot } from '../types.js';
import { Icon } from '../../ui/Icon.js';
import { BrandLogo } from '../../ui/BrandLogo.js';
import { noOutlineStyle } from '../../ui/AppleInput.js';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';
import { filterSectionsForSlot, orderSectionsForSlot } from '../dietSlotOrder.js';
import { useConfirmedRegionSwitch } from '../../common/region/useConfirmedRegionSwitch.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { getMostLoggedFoodIds, loadMealPresets, MAX_RECENT_FOODS } from '../mealPresets.js';
import { searchCustomDishes } from '../customDishes.js';
import type { DraftLogEntry } from '../describeMeal.js';
import { AddDishModal } from './AddDishModal.js';
import { ScrollCue } from '../../ui/ScrollCue.js';
import { DescribeMealModal } from './DescribeMealModal.js';
import { looksLikeMealDescription } from '../looksLikeMealDescription.js';
import { styles } from './MealLogHubModal.styles.js';
import { DishCard } from './DishCard.js';
import { VariantDishCard } from './VariantDishCard.js';
import { BasketSummaryBar, PresetNamingBar } from './MealBasketBars.js';
import { foodKey, useMealBasket, type MealBasketEntry } from './useMealBasket.js';

/** How many catalogue matches a search asks for; a full page means there may be more. */
const SEARCH_LIMIT = 40;

export type { MealBasketEntry };

export interface MealLogHubModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectBrand: (brandId: string) => void;
  onSelectItem: (item: NormalizedFood) => void;
  /** Logs a whole custom meal at once — "2 eggs + cucumber + yogurt". */
  onConfirmBasket?: (entries: MealBasketEntry[]) => void;
  /** Meal slot being logged into; each slot keeps its own selection. */
  slot?: MealSlot;
  /** Called when the user picks a different meal in the hub. */
  onSlotChange?: (slot: MealSlot) => void;
  /** Logs a meal the user described in a sentence and reviewed. */
  onLogDescribedMeal?: (slot: MealSlot, entries: DraftLogEntry[]) => void;
}

const MEAL_SLOT_IDS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snacks_chai'];

// Plain single-ingredient foods. Listed first and selected by default so
// someone logging "2 eggs" or a salad lands on them without searching.
const DIET_GROUP = 'Diet & Basics';

/** Sentinel for the diet sub-category pills meaning 'show every section'. */
const ALL_DIET_GROUPS = '__all__';

const PK_BRAND_GROUPS = [
  'All',
  'Fast Food',
  'Pizza',
  'BBQ',
  'Chai & Cafes',
  'Asian & Continental',
  'Home Food',
];

const SA_BRAND_GROUPS = [
  'All',
  'Home Food',
  'Fast Food',
  'Shawarma',
  'Traditional Saudi',
  'Grills & Fast Casual',
  'Burgers',
  'Pizza',
  'Cafe & Coffee',
];

export const MealLogHubModal: React.FC<MealLogHubModalProps> = ({
  visible,
  onClose,
  onSelectBrand,
  onSelectItem,
  onConfirmBasket,
  slot,
  onSlotChange,
  onLogDescribedMeal,
}) => {
  const { theme } = useTheme();
  const { activeRegion } = useRegion();
  const requestRegionSwitch = useConfirmedRegionSwitch(() => setSelectedGroup(null));
  const isSaudiRegion = activeRegion === 'SA';
  /**
   * The Arabic name for Saudi users. Urdu names are not displayed (lists show
   * the English name only) but still match in search.
   */
  const localName = (_nameUr?: string, nameAr?: string) =>
    isSaudiRegion ? nameAr : undefined;
  const { t } = useTranslation();
  const dir = useTextDirection();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  /**
   * The category pill the user picked, or null: nothing is preselected. The
   * second row of pills appears only once a category with sub-options is picked.
   */
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedDietGroup, setSelectedDietGroup] = useState<string>(ALL_DIET_GROUPS);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setDebouncedQuery('');
      setIsFiltering(false);
      return;
    }
    setIsFiltering(true);
    // In test environment, resolve immediately; in app use brief 150ms debounce
    const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    if (isTest) {
      setDebouncedQuery(searchQuery);
      setIsFiltering(false);
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsFiltering(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Group names double as filter keys matched against brand.category, so the
  // raw value stays and only the visible label is translated.
  const brandGroups = [
    DIET_GROUP,
    ...(activeRegion === 'SA' ? SA_BRAND_GROUPS : PK_BRAND_GROUPS),
  ];
  const groupLabel = (group: string) =>
    t(`tracker.brandGroups.${group}`, { defaultValue: group });

  const dietFoods = useMemo(() => foodDb().getDietBasicsForRegion(activeRegion), [activeRegion]);
  // The diet list shows what suits the meal being logged, with one tap to see
  // every food. Search and the saved meals / most-logged list are never filtered.
  const [showAllDietFoods, setShowAllDietFoods] = useState(false);
  const allDietSections = useMemo(
    () => orderSectionsForSlot(foodDb().groupDietFoods(dietFoods), slot),
    [dietFoods, slot]
  );
  const dietSections = useMemo(
    () => (showAllDietFoods ? allDietSections : filterSectionsForSlot(allDietSections, slot)),
    [allDietSections, showAllDietFoods, slot]
  );
  // A pill for a group the meal filter removed would open an empty list.
  useEffect(() => {
    if (selectedDietGroup !== ALL_DIET_GROUPS && !dietSections.some((s) => s.group === selectedDietGroup)) {
      setSelectedDietGroup(ALL_DIET_GROUPS);
    }
  }, [dietSections, selectedDietGroup]);
  const shownDietCount = dietSections.reduce((sum, section) => sum + section.foods.length, 0);
  const isDietFiltered = shownDietCount < dietFoods.length;
  useEffect(() => {
    setSelectedDietGroup(ALL_DIET_GROUPS);
  }, [activeRegion]);
  /**
   * Which diet sub-category the pills have selected, or every one of them.
   * Reset whenever the region changes, since the sections themselves change
   * with it and a pill for a group that no longer exists would show nothing.
   */
  const visibleDietSections = useMemo(
    () =>
      selectedDietGroup === ALL_DIET_GROUPS
        ? dietSections
        : dietSections.filter((s) => s.group === selectedDietGroup),
    [dietSections, selectedDietGroup]
  );
  const isDietView = selectedGroup === DIET_GROUP;
  /**
   * With no category picked, the hub opens on the user's saved meals, most-logged
   * foods and the plain-food list — the quickest path for everyday logging.
   */
  const showsFoodList = selectedGroup === null || isDietView;

  const {
    basket,
    isBuildMode,
    setIsBuildMode,
    basketQty,
    addToBasket,
    removeFromBasket,
    basketTotals,
    exitBuildMode,
    presetsVersion,
    presetNameDraft,
    setPresetNameDraft,
    isNamingPreset,
    setIsNamingPreset,
    handleSavePreset,
    handleApplyPreset,
    handleDeletePreset,
    handleConfirmBasket,
  } = useMealBasket({ slot, dietFoods, onConfirmBasket });

  /**
   * The handful of foods this user actually repeats, lifted to the top of the
   * diet view. People eat the same ~15 things, so scrolling a 140-item
   * catalogue to find yesterday's breakfast is the common case, not the edge.
   */
  const recentFoods = useMemo(() => {
    if (!showsFoodList) return [];
    const ranked = getMostLoggedFoodIds(MAX_RECENT_FOODS);
    if (ranked.length === 0) return [];
    const byId = new Map(dietFoods.map((f) => [foodKey(f), f]));
    return ranked
      .map((id) => byId.get(id) ?? byId.get(foodDb().resolveFoodId(id)))
      .filter((f): f is NormalizedFood => Boolean(f));
  }, [showsFoodList, dietFoods, presetsVersion]);

  const presets = useMemo(
    () => (showsFoodList ? loadMealPresets() : []),
    [showsFoodList, presetsVersion]
  );

  const handleDishPress = (item: NormalizedFood) => {
    if (isBuildMode) {
      addToBasket(item);
      return;
    }
    onSelectItem(item);
  };

  // A dish name the catalogue lacked, being added in AddDishModal; null when closed.
  const [addDishName, setAddDishName] = useState<string | null>(null);
  const [isDescribing, setIsDescribing] = useState(false);
  const [isPickingMeal, setIsPickingMeal] = useState(false);
  // Bumped when a dish is added, so search picks it up straight away.
  const [customDishesVersion, setCustomDishesVersion] = useState(0);

  // Search across dishes adapted to active region. The user's own dishes come
  // first: they added them because the catalogue had nothing better.
  const { results: searchResults, capped: searchCapped } = useMemo(() => {
    const q = (debouncedQuery || searchQuery).trim().toLowerCase();
    if (!q) return { results: [] as NormalizedFood[], capped: false };

    const own = searchCustomDishes(q);
    const catalogue =
      activeRegion === 'SA'
        ? foodDb().searchSaudiFoods(q, { limit: SEARCH_LIMIT })
        : foodDb().searchPakistaniFoods(q, { limit: SEARCH_LIMIT });
    // Hitting the limit means there may be more; saying "40 results" for
    // every broad query made the count look like a constant.
    return { results: [...own, ...catalogue], capped: catalogue.length >= SEARCH_LIMIT };
  }, [debouncedQuery, searchQuery, activeRegion, customDishesVersion]);

  const handleDishAdded = (dish: NormalizedFood) => {
    setAddDishName(null);
    setCustomDishesVersion((v) => v + 1);
    handleDishPress(dish);
  };

  const isSearching = searchQuery.trim().length > 0;
  // A sentence like "2 rotis and daal" gets a card offering to log it as a meal,
  // above the usual results.
  const offersDescribe =
    Boolean(onLogDescribedMeal) && !isBuildMode && looksLikeMealDescription(searchQuery);
  // A whole sentence rarely matches one dish; then the card is all there is, not
  // "0 results" and an offer to add the sentence as a dish.
  const describeOnly = offersDescribe && !isFiltering && searchResults.length === 0;

  // Filter brands by active region & selected cuisine group
  const filteredBrands = useMemo(() => {
    if (!selectedGroup || selectedGroup === DIET_GROUP) return [];
    if (activeRegion === 'SA') {
      if (selectedGroup === 'All') return foodDb().SAUDI_RESTAURANT_BRANDS;
      if (selectedGroup === 'Home Food') {
        return foodDb().SAUDI_RESTAURANT_BRANDS.filter(
          (b) => b.id === 'al_matbakh_al_saudi' || b.category === 'Home Food'
        );
      }
      return foodDb().SAUDI_RESTAURANT_BRANDS.filter(
        (b) =>
          b.category === selectedGroup ||
          b.cuisineTags?.includes(selectedGroup)
      );
    }

    if (selectedGroup === 'All') return foodDb().PAKISTANI_RESTAURANT_BRANDS;
    if (selectedGroup === 'Home Food') {
      return foodDb().PAKISTANI_RESTAURANT_BRANDS.filter((b) => b.id === 'ghar_ka_khana');
    }
    return foodDb().PAKISTANI_RESTAURANT_BRANDS.filter((b) => b.brandGroup === selectedGroup);
  }, [selectedGroup, activeRegion]);

  // `keyPrefix` exists because the diet view can render the same food twice —
  // once under "Recent" and again in the full list — and bare ids would collide
  // between those siblings. Callers pass an explicit arrow so `.map`'s index
  // argument never lands here by accident.
  const renderDishCard = (item: NormalizedFood, keyPrefix = '') => (
    <DishCard
      key={`${keyPrefix}${item.id ?? item.name}`}
      item={item}
      qty={basketQty(item)}
      isBuildMode={isBuildMode}
      onPress={() => handleDishPress(item)}
      onRemoveOne={() => removeFromBasket(item)}
    />
  );

  return (
    <NamedModal accessibilityName={t('a11y.dialog.logMeal')}
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.canvas }]}>
        {/* Header with Region Switcher Pill */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <BackButton variant="icon" onPress={onClose} />
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
            {t('tracker.hub.title')}
          </Text>
          <TouchableOpacity
            style={[
              styles.regionPillBtn,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={requestRegionSwitch}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${activeRegion}, ${t('tracker.hub.switchRegion')}`}
          >
            <Text style={[styles.regionPillText, { color: theme.colors.textPrimary }]}>
              {activeRegion === 'SA' ? 'SA' : 'PK'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Which meal this is being logged to: one chip, the four meals in a picker */}
        {slot && onSlotChange && (
          <View style={[styles.slotRow, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity
              style={[styles.mealChip, { backgroundColor: theme.colors.textPrimary }]}
              onPress={() => setIsPickingMeal(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`${t('tracker.hub.logTo', {
                meal: t(`tracker.mealSlots.${slot}.${activeRegion}`),
              })}, ${t('tracker.hub.chooseMeal')}`}
            >
              <View style={[styles.mealChipDot, { backgroundColor: theme.colors.primaryLime }]} />
              <Text style={[styles.mealChipText, { color: theme.colors.canvas }]} numberOfLines={1}>
                {t('tracker.hub.logTo', { meal: t(`tracker.mealSlots.${slot}.${activeRegion}`) })}
              </Text>
              <Icon name="chevron-down" size={16} color={theme.colors.canvas} />
            </TouchableOpacity>
          </View>
        )}

        {/* Preset naming (top, so the keyboard never covers it) */}
        {isBuildMode && basket.length > 0 && isNamingPreset && (
          <PresetNamingBar
            name={presetNameDraft}
            onChangeName={setPresetNameDraft}
            onSave={handleSavePreset}
          />
        )}

        {/* Global Search Bar */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <View
            style={[
              styles.searchInputWrapper,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: isSearchFocused ? theme.colors.primaryLime : theme.colors.border,
                borderWidth: 1.5,
              },
            ]}
          >
            <Icon
              name="search"
              size={18}
              color={isSearchFocused ? theme.colors.primaryLime : theme.colors.textMuted}
            />
            <TextInput
              style={[
                styles.searchInput,
                noOutlineStyle,
                dir.text,
                { color: theme.colors.textPrimary },
              ]}
              placeholder={t(`tracker.hub.searchOrDescribe.${activeRegion === 'SA' ? 'SA' : 'PK'}`)}
              placeholderTextColor={theme.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {isFiltering ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.primaryLime}
                style={{ marginEnd: 4 }}
              />
            ) : isSearching ? (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setDebouncedQuery('');
                  setIsFiltering(false);
                }}
                style={[styles.searchClearBtn, onLogDescribedMeal && !isBuildMode && styles.searchClearBtnBesideSparkle]}
                accessibilityRole="button"
                accessibilityLabel={t('tracker.hub.clearSearch')}
              >
                <Icon name="x" size={16} color={theme.colors.textMuted} />
              </TouchableOpacity>
            ) : null}
            {onLogDescribedMeal && !isBuildMode && (
              <TouchableOpacity
                style={[styles.sparkleBtn, { backgroundColor: theme.colors.primaryLime }]}
                onPress={() => setIsDescribing(true)}
                hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('tracker.hub.describeAsMeal')}
              >
                <Icon name="sparkles" size={18} color={theme.colors.limeText} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/*
          Only the title, meal tabs and search stay pinned. Describe, Custom and
          the category pills scroll away with the list, so the food keeps the
          screen.
        */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* While a custom meal is being built: how, and the way out (the pill is hidden then) */}
        {isBuildMode && (
          <View style={styles.buildModeRow}>
            <Text style={[styles.buildModeHint, dir.text, { color: theme.colors.textSecondary }]}>
              {t('tracker.hub.buildCustomMealHint')}
            </Text>
            <TouchableOpacity
              style={[
                styles.buildModeBtn,
                { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
              ]}
              onPress={exitBuildMode}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Icon name="x" size={14} color={theme.colors.textPrimary} />
              <Text style={[styles.buildModeBtnText, { color: theme.colors.textPrimary }]}>
                {t('tracker.hub.cancelCustomMeal')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Brand Group Filter Pills (When Not Searching) */}
        {!isSearching && (
          <View
            style={[
              styles.groupScrollContainer,
              {
                backgroundColor: theme.colors.canvas,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.groupPillsWrapped}>
              {brandGroups.map((grp) => {
                const isActive = selectedGroup === grp;
                return (
                  <TouchableOpacity
                    key={grp}
                    style={[
                      styles.groupPill,
                      {
                        backgroundColor: isActive
                          ? theme.colors.primaryLime
                          : theme.colors.surfaceSecondary,
                      },
                    ]}
                    onPress={() => {
                      // Tapping the picked category again clears it.
                      setSelectedGroup(isActive ? null : grp);
                      setSelectedDietGroup(ALL_DIET_GROUPS);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.groupPillText,
                        {
                          color: isActive
                            ? '#0A0B0D'
                            : theme.colors.textSecondary,
                          fontWeight: isActive ? '800' : '600',
                        },
                      ]}
                    >
                      {groupLabel(grp)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/*
          Diet sub-category pills — the same nav the brand groups use, one level
          down. Diet & Basics is ~290 items, and a single scroll that long is
          not a list you browse, it is one you give up on.
        */}
        {isDietView && !searchQuery.trim() && dietSections.length > 1 && (
          <View
            style={[
              styles.groupScrollContainer,
              {
                backgroundColor: theme.colors.canvas,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <ScrollCue fadeColor={theme.colors.canvas} contentContainerStyle={styles.groupPillsWrapper}>
              {[ALL_DIET_GROUPS, ...dietSections.map((s) => s.group)].map((group) => {
                const isActive = selectedDietGroup === group;
                const count =
                  group === ALL_DIET_GROUPS
                    ? shownDietCount
                    : (dietSections.find((s) => s.group === group)?.foods.length ?? 0);
                return (
                  <TouchableOpacity
                    key={group}
                    style={[
                      styles.groupPill,
                      {
                        backgroundColor: isActive
                          ? theme.colors.primaryLime
                          : theme.colors.surfaceSecondary,
                      },
                    ]}
                    onPress={() => setSelectedDietGroup(group)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.groupPillText,
                        {
                          color: isActive ? '#0A0B0D' : theme.colors.textSecondary,
                          fontWeight: isActive ? '800' : '600',
                        },
                      ]}
                    >
                      {group === ALL_DIET_GROUPS
                        ? t('tracker.hub.dietGroups.all')
                        : t(`tracker.hub.dietGroups.${group}`)}{' '}
                      {count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollCue>
          </View>
        )}

        {showsFoodList && !searchQuery.trim() && slot && (isDietFiltered || showAllDietFoods) && (
          <View style={[styles.slotFilterRow, { backgroundColor: theme.colors.canvas }]}>
            <Text style={[styles.slotFilterText, dir.text, { color: theme.colors.textSecondary }]}>
              {showAllDietFoods
                ? t('tracker.hub.slotFilter.showingAll')
                : t('tracker.hub.slotFilter.showing', {
                    meal: t(`tracker.mealSlots.${slot}.${activeRegion}`),
                    shown: shownDietCount,
                    total: dietFoods.length,
                  })}
            </Text>
            <TouchableOpacity
              onPress={() => setShowAllDietFoods((v) => !v)}
              style={styles.slotFilterBtn}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Text style={[styles.slotFilterBtnText, { color: theme.colors.primaryAccessible }]}>
                {showAllDietFoods
                  ? t('tracker.hub.slotFilter.onlyMeal', { meal: t(`tracker.mealSlots.${slot}.${activeRegion}`) })
                  : t('tracker.hub.slotFilter.showAll')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.contentBody}>
          {isSearching ? (
            /* Search Results View */
            <View style={styles.searchResultsSection}>
              {offersDescribe && (
                <>
                  <TouchableOpacity
                    style={[
                      styles.describeCard,
                      { backgroundColor: theme.colors.surface, borderColor: theme.colors.primaryLime },
                    ]}
                    onPress={() => setIsDescribing(true)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                  >
                    <View style={[styles.describeCardIcon, { backgroundColor: theme.colors.primaryLime }]}>
                      <Icon name="sparkles" size={22} color={theme.colors.limeText} />
                    </View>
                    <View style={styles.describeMealTextCol}>
                      <Text style={[styles.describeMealTitle, dir.text, { color: theme.colors.textPrimary }]}>
                        {t('tracker.hub.describeCardTitle', { text: searchQuery.trim() })}
                      </Text>
                      <Text style={[styles.describeMealHint, dir.text, { color: theme.colors.textSecondary }]}>
                        {t('tracker.hub.describeCardHint')}
                      </Text>
                    </View>
                    <Icon name={dir.isRTL ? 'chevron-left' : 'chevron-right'} size={18} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                  {!describeOnly && (
                    <Text style={[styles.sectionEyebrow, styles.orPickEyebrow, { color: theme.colors.textMuted }]}>
                      {t('tracker.hub.orPickOneDish')}
                    </Text>
                  )}
                </>
              )}
              {!describeOnly && (
                <Text style={[styles.sectionEyebrow, { color: theme.colors.textMuted }]}>
                  {isFiltering
                    ? t('tracker.hub.searching')
                    : t(searchCapped ? 'tracker.hub.resultsFoundMore' : 'tracker.hub.resultsFound', {
                        count: searchResults.length,
                      })}
                </Text>
              )}

              {isFiltering ? (
                <View style={styles.filterLoadingContainer}>
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primaryLime}
                  />
                  <Text style={[styles.filterLoadingText, { color: theme.colors.textSecondary }]}>
                    {t('tracker.hub.filtering')}
                  </Text>
                </View>
              ) : describeOnly ? null : searchResults.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <Text style={[styles.emptyStateTitle, dir.textCenter, { color: theme.colors.textPrimary }]}>
                    {t('tracker.hub.noDishes')}
                  </Text>
                  <Text style={[styles.emptyStateSubtitle, dir.textCenter, { color: theme.colors.textSecondary }]}>
                    {t(`tracker.hub.noDishesHint.${activeRegion}`)}
                  </Text>
                  <TouchableOpacity
                    style={[styles.addDishButton, { backgroundColor: theme.colors.primaryLime }]}
                    onPress={() => setAddDishName(searchQuery.trim())}
                    accessibilityRole="button"
                  >
                    <Icon name="plus" size={16} color="#0A0B0D" />
                    <Text style={styles.addDishButtonText}>
                      {t('tracker.addDish.addButton', { name: searchQuery.trim() })}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {searchResults.map((food) => (
                    <VariantDishCard
                      key={food.id ?? food.name}
                      item={food}
                      isBuildMode={isBuildMode}
                      basketQty={basketQty}
                      onPressFood={handleDishPress}
                      onRemoveFood={removeFromBasket}
                    />
                  ))}
                  {/* The catalogue's nearest names may not be the dish the user means. */}
                  <TouchableOpacity
                    style={styles.addDishLink}
                    onPress={() => setAddDishName(searchQuery.trim())}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.addDishLinkText, dir.textCenter, { color: theme.colors.textSecondary }]}>
                      {t('tracker.addDish.notListed', { name: searchQuery.trim() })}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : showsFoodList ? (
            /* Plain Single-Ingredient Foods (also the view before any category is picked) */
            <View style={styles.searchResultsSection}>
              {presets.length > 0 && (
                <>
                  <Text style={[styles.sectionEyebrow, { color: theme.colors.textMuted }]}>
                    {t('tracker.hub.presetsHeading')}
                  </Text>
                  <View style={styles.presetRow}>
                    {presets.map((preset) => (
                      <View
                        key={preset.id}
                        style={[
                          styles.presetChip,
                          {
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.border,
                          },
                        ]}
                      >
                        <TouchableOpacity
                          onPress={() => handleApplyPreset(preset)}
                          activeOpacity={0.7}
                          accessibilityRole="button"
                          accessibilityLabel={t('tracker.hub.applyPreset', { name: preset.name })}
                        >
                          <Text
                            style={[styles.presetChipText, { color: theme.colors.textPrimary }]}
                            numberOfLines={1}
                          >
                            {preset.name}
                          </Text>
                          <Text style={[styles.presetChipMeta, { color: theme.colors.textMuted }]}>
                            {t('tracker.hub.presetItemCount', { count: preset.entries.length })}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeletePreset(preset.id)}
                          style={styles.presetDeleteBtn}
                          accessibilityRole="button"
                          accessibilityLabel={t('tracker.hub.deletePreset', { name: preset.name })}
                        >
                          <Icon name="x" size={12} color={theme.colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {recentFoods.length > 0 && (
                <>
                  <Text style={[styles.sectionEyebrow, { color: theme.colors.textMuted }]}>
                    {t('tracker.hub.recentHeading')}
                  </Text>
                  {recentFoods.map((food) => renderDishCard(food, 'recent_'))}
                </>
              )}

              {/* The slot-filter row above is the one count line when it is showing. */}
              {!(slot && (isDietFiltered || showAllDietFoods)) && (
                <Text style={[styles.sectionEyebrow, { color: theme.colors.textMuted }]}>
                  {t('tracker.hub.dietBasicsHeading', { count: shownDietCount })}
                </Text>
              )}

              {/*
                Grouped, not one flat scroll of ~280 rows. Ordered so whole
                meals and proteins come first and the add-ons people put *on*
                food — oils, sugar, dressings — come last.
              */}
              {visibleDietSections.map(({ group, foods }) => (
                <View key={group}>
                  {visibleDietSections.length > 1 && (
                  <Text style={[styles.dietGroupHeading, { color: theme.colors.textSecondary }]}>
                    {t(`tracker.hub.dietGroups.${group}`)}
                  </Text>
                  )}
                  {foods.map((food) => renderDishCard(food, `${group}_`))}
                </View>
              ))}
            </View>
          ) : (
            /* Brands List View */
            <View style={styles.brandsSection}>
              <Text style={[styles.sectionEyebrow, { color: theme.colors.textMuted }]}>
                {selectedGroup === 'All'
                  ? t(`tracker.hub.allBrandsHeading.${activeRegion}`)
                  : t('tracker.hub.groupBrandsHeading', {
                      group: groupLabel(selectedGroup ?? ''),
                      count: filteredBrands.length,
                    })}
              </Text>

              {filteredBrands.map((brand: RestaurantBrand) => {
                return (
                  <TouchableOpacity
                    key={brand.id}
                    style={[
                      styles.brandCard,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    onPress={() => onSelectBrand(brand.id)}
                    activeOpacity={0.7}
                  >
                    <BrandLogo brandId={brand.id} size={46} style={styles.brandAvatar} />

                    <View style={styles.brandInfo}>
                      <View style={styles.brandTitleRow}>
                        <Text style={[styles.brandName, { color: theme.colors.textPrimary }]}>
                          {brand.name}
                        </Text>
                        {localName(brand.nameUr, brand.nameAr) && (
                          <Text
                            style={[
                              isSaudiRegion ? styles.brandNameAr : styles.brandNameUr,
                              {
                                color: isSaudiRegion
                                  ? theme.colors.primaryLime
                                  : theme.colors.textMuted,
                              },
                            ]}
                          >
                            {localName(brand.nameUr, brand.nameAr)}
                          </Text>
                        )}
                      </View>
                      <Text style={[styles.brandTagline, { color: theme.colors.textSecondary }]}>
                        {activeRegion === 'SA' && brand.taglineAr ? brand.taglineAr : brand.tagline}
                      </Text>
                    </View>

                    <Icon name={dir.isRTL ? 'chevron-left' : 'chevron-right'} size={18} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
        </ScrollView>

        {/* Pinned, so building a meal is one tap from anywhere in the list */}
        {onConfirmBasket && !isBuildMode && !isSearchFocused && (
          <View style={styles.customPillDock} pointerEvents="box-none">
            <TouchableOpacity
              style={[styles.customPill, { backgroundColor: theme.colors.textPrimary }]}
              onPress={() => setIsBuildMode(true)}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Icon name="plus" size={18} color={theme.colors.primaryLime} />
              <Text style={[styles.customPillText, { color: theme.colors.canvas }]}>
                {t('tracker.hub.customMealPill')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Custom Meal Summary Bar */}
        {isBuildMode && basket.length > 0 && !isNamingPreset && (
          <BasketSummaryBar
            basket={basket}
            totals={basketTotals}
            onStartNaming={() => setIsNamingPreset(true)}
            onConfirm={handleConfirmBasket}
          />
        )}

        {onLogDescribedMeal && (
          <DescribeMealModal
            visible={isDescribing}
            region={activeRegion}
            initialSlot={slot ?? 'breakfast'}
            initialText={searchQuery}
            onClose={() => setIsDescribing(false)}
            onLog={(mealSlot, entries) => {
              setIsDescribing(false);
              onLogDescribedMeal(mealSlot, entries);
            }}
          />
        )}

        {slot && onSlotChange && (
          <NamedModal
            accessibilityName={t('tracker.hub.chooseMeal')}
            visible={isPickingMeal}
            transparent
            animationType="fade"
            onRequestClose={() => setIsPickingMeal(false)}
          >
            <Pressable
              style={styles.pickerBackdrop}
              onPress={() => setIsPickingMeal(false)}
              accessibilityLabel={t('tracker.hub.chooseMeal')}
            >
              <View
                style={[
                  styles.pickerSheet,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
              >
                <Text style={[styles.pickerTitle, dir.text, { color: theme.colors.textMuted }]}>
                  {t('tracker.hub.chooseMeal')}
                </Text>
                {MEAL_SLOT_IDS.map((id) => {
                  const selected = slot === id;
                  return (
                    <TouchableOpacity
                      key={id}
                      style={[
                        styles.pickerRow,
                        selected && { backgroundColor: theme.colors.surfaceSecondary },
                      ]}
                      onPress={() => {
                        onSlotChange(id);
                        setIsPickingMeal(false);
                      }}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                    >
                      <Text style={[styles.pickerRowText, dir.text, { color: theme.colors.textPrimary }]}>
                        {t(`tracker.mealSlots.${id}.${activeRegion}`)}
                      </Text>
                      {selected && <Icon name="check" size={18} color={theme.colors.textPrimary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Pressable>
          </NamedModal>
        )}

        <AddDishModal
          visible={addDishName !== null}
          dishName={addDishName ?? ''}
          region={activeRegion}
          onClose={() => setAddDishName(null)}
          onDishAdded={handleDishAdded}
        />
      </SafeAreaView>
    </NamedModal>
  );
};
