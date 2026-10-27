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
import { Icon, type IconName } from '../../ui/Icon.js';
import { BrandLogo } from '../../ui/BrandLogo.js';
import { noOutlineStyle } from '../../ui/AppleInput.js';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';
import { filterSectionsForSlot, orderSectionsForSlot } from '../dietSlotOrder.js';
import { useTranslation, useTextDirection, useI18nState } from '../../i18n/index.js';
import { pickText } from '../../i18n/displayName.js';
import { getMostLoggedFoodIds, loadMealPresets, MAX_RECENT_FOODS } from '../mealPresets.js';
import { searchCustomDishes } from '../customDishes.js';
import type { DraftLogEntry } from '../describeMeal.js';
import { AddDishModal } from './AddDishModal.js';
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

type HubTab = 'forYou' | 'browse' | 'restaurants';
const HUB_TABS: HubTab[] = ['forYou', 'browse', 'restaurants'];

/** Sentinel for the Browse tab meaning 'show the category tiles'. */
const ALL_DIET_GROUPS = '__all__';

// Pastel tile fills and their ink, cycled over the Browse categories. In dark
// mode the tiles use the theme's own surface instead.
const TILE_COLORS: Array<{ bg: string; ink: string }> = [
  { bg: '#EDFCD2', ink: '#365314' },
  { bg: '#FEF3C7', ink: '#7C2D12' },
  { bg: '#E0F2FE', ink: '#075985' },
  { bg: '#FEE2E2', ink: '#7F1D1D' },
  { bg: '#F1F5F9', ink: '#334155' },
];

const TILE_ICONS: Record<string, IconName> = {
  meals: 'bowl',
  protein: 'fish',
  grains: 'bread',
  legumes: 'grains',
  dairy: 'cheese',
  fruits: 'orange',
  vegetables: 'carrot',
  salads: 'leaf',
  soups: 'cooking-pot',
  beverages: 'coffee',
  snacks: 'cookie',
  nuts_seeds: 'plant',
  extras: 'jar',
};

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
  const { theme, isDark } = useTheme();
  const { activeRegion } = useRegion();
  const { t } = useTranslation();
  const { language } = useI18nState();
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
  const [tab, setTab] = useState<HubTab>('forYou');
  // The saved-meals chips are tucked behind their card on For you.
  const [showSavedMeals, setShowSavedMeals] = useState(false);
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
  const brandGroups = activeRegion === 'SA' ? SA_BRAND_GROUPS : PK_BRAND_GROUPS;
  const activeBrandGroup = selectedGroup ?? 'All';
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
  const shownDietCount = dietSections.reduce((sum, section) => sum + section.foods.length, 0);
  const isDietFiltered = shownDietCount < dietFoods.length;
  useEffect(() => {
    setSelectedDietGroup(ALL_DIET_GROUPS);
    setSelectedGroup(null);
  }, [activeRegion]);
  /**
   * The Browse tab lists every category, whatever the meal filter says: it is
   * the way to reach the foods "For you" leaves out. Reset with the region,
   * since the categories themselves change with it.
   */
  const browseSection =
    selectedDietGroup === ALL_DIET_GROUPS
      ? undefined
      : allDietSections.find((s) => s.group === selectedDietGroup);
  /** Saved meals, most-logged foods and the meal's own food list live under "For you". */
  const showsFoodList = tab === 'forYou';

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

  // The meal-suited food list is the fallback for someone with no history yet;
  // everyone else gets the shorter "you log these most" list, and Browse for the rest.
  const showDietList = recentFoods.length === 0;

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
    if (tab !== 'restaurants') return [];
    if (activeRegion === 'SA') {
      if (activeBrandGroup === 'All') return foodDb().SAUDI_RESTAURANT_BRANDS;
      if (activeBrandGroup === 'Home Food') {
        return foodDb().SAUDI_RESTAURANT_BRANDS.filter(
          (b) => b.id === 'al_matbakh_al_saudi' || b.category === 'Home Food'
        );
      }
      return foodDb().SAUDI_RESTAURANT_BRANDS.filter(
        (b) =>
          b.category === activeBrandGroup ||
          b.cuisineTags?.includes(activeBrandGroup)
      );
    }

    if (activeBrandGroup === 'All') return foodDb().PAKISTANI_RESTAURANT_BRANDS;
    if (activeBrandGroup === 'Home Food') {
      return foodDb().PAKISTANI_RESTAURANT_BRANDS.filter((b) => b.id === 'ghar_ka_khana');
    }
    return foodDb().PAKISTANI_RESTAURANT_BRANDS.filter((b) => b.brandGroup === activeBrandGroup);
  }, [tab, activeBrandGroup, activeRegion]);

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
        {/*
          Back, the meal being logged to, and the region: one row. The chip takes
          the title's place, so the four meals live in a picker and the screen
          starts with the search bar.
        */}
        <View style={[styles.header, { backgroundColor: theme.colors.canvas }]}>
          <BackButton variant="icon" onPress={onClose} />
          {slot && onSlotChange ? (
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
          ) : (
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
              {t('tracker.hub.title')}
            </Text>
          )}
          {/* Same width as the back button, so the meal chip sits in the middle. */}
          <View style={styles.headerSpacer} />
        </View>

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
              backgroundColor: theme.colors.canvas,
            },
          ]}
        >
          <View
            style={[
              styles.searchInputWrapper,
              {
                backgroundColor: theme.colors.surface,
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
              placeholder={t('tracker.hub.searchOrDescribe')}
              placeholderTextColor={theme.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              autoCapitalize="none"
              autoCorrect={false}
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

        {/* For you / Browse / Restaurants (hidden while a query is being typed) */}
        {!isSearching && (
          <View
            style={[styles.tabRow, { borderBottomColor: theme.colors.border }]}
            accessibilityRole="tablist"
          >
            {HUB_TABS.map((id) => {
              const selected = tab === id;
              return (
                <TouchableOpacity
                  key={id}
                  style={[
                    styles.tab,
                    selected && { borderBottomColor: theme.colors.primaryLime },
                  ]}
                  onPress={() => {
                    setTab(id);
                    setSelectedDietGroup(ALL_DIET_GROUPS);
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color: selected ? theme.colors.textPrimary : theme.colors.textSecondary,
                        fontWeight: selected ? '800' : '600',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {t(`tracker.hub.tabs.${id}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/*
          Only the title, meal chip, search and tabs stay pinned. The list scrolls
          under them, with the Custom meal pill floating above it.
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

        {/* Restaurant groups, wrapped so every one is in view (Restaurants tab only) */}
        {!isSearching && tab === 'restaurants' && (
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
                const isActive = activeBrandGroup === grp;
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
                    onPress={() => setSelectedGroup(grp)}
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

        {showsFoodList && showDietList && !searchQuery.trim() && slot && (isDietFiltered || showAllDietFoods) && (
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
          ) : tab === 'browse' ? (
            /* Browse: category tiles, or one category's foods */
            <View style={styles.searchResultsSection}>
              {browseSection ? (
                <>
                  <TouchableOpacity
                    style={styles.browseBack}
                    onPress={() => setSelectedDietGroup(ALL_DIET_GROUPS)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                  >
                    <Icon name={dir.isRTL ? 'chevron-right' : 'chevron-left'} size={18} color={theme.colors.textPrimary} />
                    <Text style={[styles.browseBackText, { color: theme.colors.textPrimary }]}>
                      {t('tracker.hub.allCategories')}
                    </Text>
                  </TouchableOpacity>
                  <Text style={[styles.sectionEyebrow, { color: theme.colors.textMuted }]}>
                    {t(`tracker.hub.dietGroups.${browseSection.group}`)} · {browseSection.foods.length}
                  </Text>
                  {browseSection.foods.map((food) => renderDishCard(food, `${browseSection.group}_`))}
                </>
              ) : (
                <View style={styles.tileGrid}>
                  {allDietSections.map(({ group, foods }, index) => {
                    const tone = TILE_COLORS[index % TILE_COLORS.length];
                    const ink = isDark ? theme.colors.textPrimary : tone.ink;
                    return (
                      <TouchableOpacity
                        key={group}
                        style={[
                          styles.tile,
                          { backgroundColor: isDark ? theme.colors.surfaceSecondary : tone.bg },
                        ]}
                        onPress={() => setSelectedDietGroup(group)}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                      >
                        <Icon name={TILE_ICONS[group] ?? 'utensils'} size={26} color={ink} />
                        <View>
                          <Text style={[styles.tileTitle, dir.text, { color: theme.colors.textPrimary }]}>
                            {t(`tracker.hub.dietGroups.${group}`)}
                          </Text>
                          <Text style={[styles.tileCount, dir.text, { color: ink }]}>
                            {t('tracker.hub.tileCount', { count: foods.length })}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          ) : tab === 'forYou' ? (
            /* For you: saved meals, most-logged foods, and the foods that suit this meal */
            <View style={styles.searchResultsSection}>
              {!isBuildMode && (
                <View style={styles.actionRow}>
                  {onConfirmBasket && (
                    <TouchableOpacity
                      style={[styles.actionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                      onPress={() => setIsBuildMode(true)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                    >
                      <View style={[styles.actionIcon, { backgroundColor: isDark ? theme.colors.surfaceSecondary : '#EDFCD2' }]}>
                        <Icon name="plus" size={22} color={isDark ? theme.colors.primaryLime : '#365314'} />
                      </View>
                      <Text style={[styles.actionLabel, { color: theme.colors.textPrimary }]}>
                        {t('tracker.hub.customMealPill')}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.actionCard,
                      { backgroundColor: theme.colors.surface, borderColor: showSavedMeals ? theme.colors.primaryLime : theme.colors.border },
                    ]}
                    onPress={() => setShowSavedMeals((v) => !v)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: showSavedMeals }}
                  >
                    <View style={[styles.actionIcon, { backgroundColor: isDark ? theme.colors.surfaceSecondary : '#EDFCD2' }]}>
                      <Icon name="bookmark" size={22} color={isDark ? theme.colors.primaryLime : '#365314'} />
                    </View>
                    <Text style={[styles.actionLabel, { color: theme.colors.textPrimary }]}>
                      {t('tracker.hub.savedMeals')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {showSavedMeals && presets.length === 0 && (
                <Text style={[styles.savedEmpty, dir.text, { color: theme.colors.textSecondary }]}>
                  {t('tracker.hub.noSavedMeals')}
                </Text>
              )}
              {showSavedMeals && presets.length > 0 && (
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
              {showDietList && !(slot && (isDietFiltered || showAllDietFoods)) && (
                <Text style={[styles.sectionEyebrow, { color: theme.colors.textMuted }]}>
                  {t('tracker.hub.dietBasicsHeading', { count: shownDietCount })}
                </Text>
              )}

              {/*
                Grouped, not one flat scroll of ~280 rows. Ordered so whole
                meals and proteins come first and the add-ons people put *on*
                food — oils, sugar, dressings — come last.
              */}
              {(showDietList ? dietSections : []).map(({ group, foods }) => (
                <View key={group}>
                  {dietSections.length > 1 && (
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
                {activeBrandGroup === 'All'
                  ? t(`tracker.hub.allBrandsHeading.${activeRegion}`)
                  : t('tracker.hub.groupBrandsHeading', {
                      group: groupLabel(activeBrandGroup),
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
                          {pickText(brand.name, brand.nameAr, language)}
                        </Text>
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
            {/* The dismiss area sits beside the sheet, not around it: a labelled parent
                would make VoiceOver read the whole sheet as one button. */}
            <View style={styles.pickerBackdrop}>
              <Pressable
                style={styles.pickerDismiss}
                onPress={() => setIsPickingMeal(false)}
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
              />
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
            </View>
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
