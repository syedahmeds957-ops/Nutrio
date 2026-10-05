import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import {
  NormalizedFood,
  PAKISTANI_RESTAURANT_BRANDS,
  SAUDI_RESTAURANT_BRANDS,
  ALL_SAUDI_FOODS,
  RestaurantBrand,
  searchPakistaniFoods,
  searchSaudiFoods,
  getDietBasicsForRegion,
  groupDietFoods,
} from '@nutrio/food-db';
import { Icon } from '../../ui/Icon.js';
import { BrandLogo } from '../../ui/BrandLogo.js';
import { noOutlineStyle } from '../../ui/AppleInput.js';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import {
  getMostLoggedFoodIds,
  loadMealPresets,
  saveMealPreset,
  deleteMealPreset,
  MAX_RECENT_FOODS,
  type MealPreset,
} from '../mealPresets.js';

/** One line of a custom meal: a food plus how many of its default serving. */
export interface MealBasketEntry {
  food: NormalizedFood;
  quantity: number;
}

export interface MealLogHubModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectBrand: (brandId: string) => void;
  onSelectItem: (item: NormalizedFood) => void;
  /** Logs a whole custom meal at once — "2 eggs + cucumber + yogurt". */
  onConfirmBasket?: (entries: MealBasketEntry[]) => void;
  /** Meal slot being logged into; each slot keeps its own selection. */
  slot?: string;
}

const EMPTY_BASKET: MealBasketEntry[] = [];

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
}) => {
  const { theme, isDark } = useTheme();
  const { activeRegion, setRegion } = useRegion();
  const isSaudiRegion = activeRegion === 'SA';
  /** The local-script name for the active region, falling back to the other. */
  const localName = (nameUr?: string, nameAr?: string) =>
    isSaudiRegion ? nameAr || nameUr : nameUr || nameAr;
  const { t } = useTranslation();
  const dir = useTextDirection();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>(DIET_GROUP);
  const [selectedDietGroup, setSelectedDietGroup] = useState<string>(ALL_DIET_GROUPS);
  // Custom-meal mode: tapping a food stacks it up instead of opening the
  // customizer, so several things eaten together go in as one action.
  const [isBuildMode, setIsBuildMode] = useState(false);
  // One basket per meal slot, so picks made for lunch never show up when
  // breakfast or dinner is opened.
  const slotKey = slot ?? 'default';
  const [baskets, setBaskets] = useState<Record<string, MealBasketEntry[]>>({});
  const basket = baskets[slotKey] ?? EMPTY_BASKET;
  const setBasket = (
    next: MealBasketEntry[] | ((prev: MealBasketEntry[]) => MealBasketEntry[])
  ) =>
    setBaskets((all) => {
      const prev = all[slotKey] ?? EMPTY_BASKET;
      return { ...all, [slotKey]: typeof next === 'function' ? next(prev) : next };
    });
  // Presets and usage counts live in storage, not state. Bumped whenever this
  // modal writes to either, so the derived lists recompute without the modal
  // having to mirror storage it doesn't own.
  const [presetsVersion, setPresetsVersion] = useState(0);
  const [presetNameDraft, setPresetNameDraft] = useState('');
  const [isNamingPreset, setIsNamingPreset] = useState(false);

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

  const dietFoods = useMemo(() => getDietBasicsForRegion(activeRegion), [activeRegion]);
  const dietSections = useMemo(() => groupDietFoods(dietFoods), [dietFoods]);
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

  const foodKey = (food: NormalizedFood) => food.id || food.name;

  /**
   * The handful of foods this user actually repeats, lifted to the top of the
   * diet view. People eat the same ~15 things, so scrolling a 140-item
   * catalogue to find yesterday's breakfast is the common case, not the edge.
   */
  const recentFoods = useMemo(() => {
    if (!isDietView) return [];
    const ranked = getMostLoggedFoodIds(MAX_RECENT_FOODS);
    if (ranked.length === 0) return [];
    const byId = new Map(dietFoods.map((f) => [foodKey(f), f]));
    return ranked
      .map((id) => byId.get(id))
      .filter((f): f is NormalizedFood => Boolean(f));
  }, [isDietView, dietFoods, presetsVersion]);

  const presets = useMemo(
    () => (isDietView ? loadMealPresets() : []),
    [isDietView, presetsVersion]
  );

  const basketQty = (food: NormalizedFood) =>
    basket.find((e) => foodKey(e.food) === foodKey(food))?.quantity ?? 0;

  const addToBasket = (food: NormalizedFood) => {
    setBasket((prev) => {
      const key = foodKey(food);
      const existing = prev.find((e) => foodKey(e.food) === key);
      if (existing) {
        return prev.map((e) =>
          foodKey(e.food) === key ? { ...e, quantity: e.quantity + 1 } : e
        );
      }
      return [...prev, { food, quantity: 1 }];
    });
  };

  const removeFromBasket = (food: NormalizedFood) => {
    setBasket((prev) => {
      const key = foodKey(food);
      const existing = prev.find((e) => foodKey(e.food) === key);
      if (!existing) return prev;
      if (existing.quantity <= 1) return prev.filter((e) => foodKey(e.food) !== key);
      return prev.map((e) => (foodKey(e.food) === key ? { ...e, quantity: e.quantity - 1 } : e));
    });
  };

  // Serving-based, matching how the item is actually logged.
  const basketTotals = useMemo(() => {
    return basket.reduce(
      (acc, { food, quantity }) => {
        const serving = food.servings[0];
        const grams = (serving?.grams ?? 100) * quantity;
        acc.kcal += (food.kcal100g * grams) / 100;
        acc.count += quantity;
        return acc;
      },
      { kcal: 0, count: 0 }
    );
  }, [basket]);

  const exitBuildMode = () => {
    setIsBuildMode(false);
    setBasket([]);
    setIsNamingPreset(false);
    setPresetNameDraft('');
  };

  const handleSavePreset = () => {
    const saved = saveMealPreset(
      presetNameDraft,
      basket.map(({ food, quantity }) => ({
        foodId: foodKey(food),
        foodName: food.name,
        quantity,
      }))
    );
    if (!saved) return;
    setIsNamingPreset(false);
    setPresetNameDraft('');
    setPresetsVersion((v) => v + 1);
  };

  /**
   * Refills the basket from a saved combo. Foods are resolved by id at apply
   * time rather than stored whole, so a preset picks up any later correction to
   * the catalogue instead of pinning the macros as they were when it was saved.
   */
  const handleApplyPreset = (preset: MealPreset) => {
    const byId = new Map(dietFoods.map((f) => [foodKey(f), f]));
    const entries = preset.entries
      .map(({ foodId, quantity }) => {
        const food = byId.get(foodId);
        return food ? { food, quantity } : null;
      })
      .filter((e): e is MealBasketEntry => e !== null);

    if (entries.length === 0) return;
    setIsBuildMode(true);
    setBasket(entries);
  };

  const handleDeletePreset = (id: string) => {
    deleteMealPreset(id);
    setPresetsVersion((v) => v + 1);
  };

  const handleConfirmBasket = () => {
    if (!onConfirmBasket || basket.length === 0) return;
    onConfirmBasket(basket);
    exitBuildMode();
  };

  const handleDishPress = (item: NormalizedFood) => {
    if (isBuildMode) {
      addToBasket(item);
      return;
    }
    onSelectItem(item);
  };

  // Search across dishes adapted to active region
  const searchResults = useMemo(() => {
    const q = (debouncedQuery || searchQuery).trim().toLowerCase();
    if (!q) return [];

    if (activeRegion === 'SA') {
      return searchSaudiFoods(q, { limit: 40 });
    }

    return searchPakistaniFoods(q, { limit: 40 });
  }, [debouncedQuery, searchQuery, activeRegion]);

  const isSearching = searchQuery.trim().length > 0;

  // Filter brands by active region & selected cuisine group
  const filteredBrands = useMemo(() => {
    if (activeRegion === 'SA') {
      if (selectedGroup === 'All') return SAUDI_RESTAURANT_BRANDS;
      if (selectedGroup === 'Home Food') {
        return SAUDI_RESTAURANT_BRANDS.filter(
          (b) => b.id === 'al_matbakh_al_saudi' || b.category === 'Home Food'
        );
      }
      return SAUDI_RESTAURANT_BRANDS.filter(
        (b) =>
          b.category === selectedGroup ||
          b.cuisineTags?.includes(selectedGroup)
      );
    }

    if (selectedGroup === 'All') return PAKISTANI_RESTAURANT_BRANDS;
    if (selectedGroup === 'Home Food') {
      return PAKISTANI_RESTAURANT_BRANDS.filter((b) => b.id === 'ghar_ka_khana');
    }
    return PAKISTANI_RESTAURANT_BRANDS.filter((b) => b.brandGroup === selectedGroup);
  }, [selectedGroup, activeRegion]);

  // `keyPrefix` exists because the diet view can render the same food twice —
  // once under "Recent" and again in the full list — and bare ids would collide
  // between those siblings. Callers pass an explicit arrow so `.map`'s index
  // argument never lands here by accident.
  const renderDishCard = (item: NormalizedFood, keyPrefix = '') => {
    const qty = basketQty(item);
    const serving = item.servings[0];
    const kcal = serving ? Math.round(serving.kcal || item.kcal100g) : Math.round(item.kcal100g);
    const p = serving ? Math.round(serving.proteinGrams || item.protein100g) : Math.round(item.protein100g);
    const c = serving ? Math.round(serving.carbGrams || item.carb100g) : Math.round(item.carb100g);
    const f = serving ? Math.round(serving.fatGrams || item.fat100g) : Math.round(item.fat100g);

    return (
      <TouchableOpacity
        key={`${keyPrefix}${item.id ?? item.name}`}
        style={[
          styles.dishCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: qty > 0 ? theme.colors.primaryLime : theme.colors.border,
            borderWidth: qty > 0 ? 1.5 : 1,
          },
        ]}
        onPress={() => handleDishPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.dishCardLeft}>
          <View style={styles.dishTitleRow}>
            <Text style={[styles.dishName, { color: theme.colors.textPrimary }]}>{item.name}</Text>
            {/*
              One local name, not both. These rendered unconditionally, so a
              food carrying nameUr and nameAr printed its name three times.
            */}
            {localName(item.nameUr, item.nameAr) && (
              <Text
                style={[
                  isSaudiRegion ? styles.dishNameAr : styles.dishNameUr,
                  { color: isSaudiRegion ? theme.colors.primaryLime : theme.colors.textMuted },
                ]}
              >
                {localName(item.nameUr, item.nameAr)}
              </Text>
            )}
          </View>
          <View style={styles.dishMetaRow}>
            {item.brand && (
              <View style={[styles.brandBadge, { backgroundColor: theme.colors.surfaceSecondary }]}>
                <Text style={[styles.brandBadgeText, { color: theme.colors.textSecondary }]}>
                  {item.brand}
                </Text>
              </View>
            )}
            <Text style={[styles.dishServingText, { color: theme.colors.textSecondary }]}>
              {serving ? `${serving.grams}g · ${serving.description || serving.label}` : '100g'}
            </Text>
          </View>
          <Text
            style={[
              styles.dishMacrosText,
              { color: isDark ? theme.colors.primaryLime : '#4B6200' },
            ]}
          >
            P {p}g · C {c}g · F {f}g
          </Text>
        </View>

        <View style={styles.dishCardRight}>
          <View
            style={[
              styles.caloriePill,
              {
                backgroundColor: isDark ? 'rgba(164, 235, 63, 0.15)' : '#F7FEE7',
                borderColor: theme.colors.primaryLime,
              },
            ]}
          >
            <Text
              style={[
                styles.caloriePillText,
                { color: isDark ? theme.colors.primaryLime : '#4B6200' },
              ]}
            >
              ≈{kcal} kcal
            </Text>
          </View>
          {isBuildMode ? (
            <View style={styles.qtyControls}>
              {qty > 0 && (
                <>
                  <TouchableOpacity
                    style={[styles.qtyBtn, { backgroundColor: theme.colors.surfaceSecondary }]}
                    onPress={() => removeFromBasket(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={t('tracker.hub.removeOne', { name: item.name })}
                  >
                    <Icon name="minus" size={14} color={theme.colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={[styles.qtyValue, { color: theme.colors.textPrimary }]}>{qty}</Text>
                </>
              )}
              <View
                style={[
                  styles.qtyBtn,
                  { backgroundColor: qty > 0 ? theme.colors.primaryLime : theme.colors.surfaceSecondary },
                ]}
              >
                <Icon
                  name="plus"
                  size={14}
                  color={qty > 0 ? '#0A0B0D' : theme.colors.textPrimary}
                />
              </View>
            </View>
          ) : (
            <Icon name="chevron-right" size={16} color={theme.colors.textMuted} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
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
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.colors.surfaceSecondary }]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Icon name="arrow-left" size={18} color={theme.colors.textPrimary} />
          </TouchableOpacity>
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
            onPress={() => {
              setSelectedGroup('All');
              setRegion(activeRegion === 'SA' ? 'PK' : 'SA');
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('tracker.hub.switchRegion')}
          >
            <Text style={[styles.regionPillText, { color: theme.colors.textPrimary }]}>
              {activeRegion === 'SA' ? '🇸🇦 SA' : '🇵🇰 PK'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Preset naming (top, so the keyboard never covers it) */}
        {isBuildMode && basket.length > 0 && isNamingPreset && (
          <View
            style={[
              styles.basketBar,
              {
                backgroundColor: theme.colors.surface,
                borderTopWidth: 0,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.presetNameRow}>
              <TextInput
                style={[
                  styles.presetNameInput,
                  noOutlineStyle,
                  {
                    backgroundColor: theme.colors.canvas,
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary,
                  },
                ]}
                value={presetNameDraft}
                onChangeText={setPresetNameDraft}
                placeholder={t('tracker.hub.presetNamePlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSavePreset}
              />
              <TouchableOpacity
                style={[styles.basketConfirmBtn, { backgroundColor: theme.colors.primaryLime }]}
                onPress={handleSavePreset}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={[styles.basketConfirmText, { color: theme.colors.limeText }]}>
                  {t('tracker.hub.savePresetConfirm')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
                { color: theme.colors.textPrimary },
              ]}
              placeholder={t(`tracker.hub.searchPlaceholder.${activeRegion}`)}
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
                style={{ marginRight: 4 }}
              />
            ) : isSearching ? (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setDebouncedQuery('');
                  setIsFiltering(false);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="x" size={16} color={theme.colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Custom Meal Mode Toggle */}
        {onConfirmBasket && (
          <View
            style={[
              styles.buildModeRow,
              {
                backgroundColor: theme.colors.surface,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.buildModeBtn,
                {
                  backgroundColor: isBuildMode
                    ? theme.colors.primaryLime
                    : theme.colors.surfaceSecondary,
                  borderColor: isBuildMode ? theme.colors.primaryLime : theme.colors.border,
                },
              ]}
              onPress={() => (isBuildMode ? exitBuildMode() : setIsBuildMode(true))}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Icon
                name={isBuildMode ? 'x' : 'plus'}
                size={14}
                color={isBuildMode ? '#0A0B0D' : theme.colors.textPrimary}
              />
              <Text
                style={[
                  styles.buildModeBtnText,
                  { color: isBuildMode ? '#0A0B0D' : theme.colors.textPrimary },
                ]}
              >
                {isBuildMode ? t('tracker.hub.cancelCustomMeal') : t('tracker.hub.buildCustomMeal')}
              </Text>
            </TouchableOpacity>

            {isBuildMode && (
              <Text style={[styles.buildModeHint, { color: theme.colors.textSecondary }]}>
                {t('tracker.hub.buildCustomMealHint')}
              </Text>
            )}
          </View>
        )}

        {/* Brand Group Filter Pills (When Not Searching) */}
        {!isSearching && (
          <View
            style={[
              styles.groupScrollContainer,
              {
                backgroundColor: theme.colors.surface,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.groupPillsWrapper}
            >
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
                    onPress={() => setSelectedGroup(grp)}
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
            </ScrollView>
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
                backgroundColor: theme.colors.surface,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.groupPillsWrapper}
            >
              {[ALL_DIET_GROUPS, ...dietSections.map((s) => s.group)].map((group) => {
                const isActive = selectedDietGroup === group;
                const count =
                  group === ALL_DIET_GROUPS
                    ? dietFoods.length
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
            </ScrollView>
          </View>
        )}

        {/* Main Content Area */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isSearching ? (
            /* Search Results View */
            <View style={styles.searchResultsSection}>
              <Text style={[styles.sectionEyebrow, { color: theme.colors.textMuted }]}>
                {isFiltering
                  ? t('tracker.hub.searching')
                  : t('tracker.hub.resultsFound', { count: searchResults.length })}
              </Text>

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
              ) : searchResults.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <Text style={[styles.emptyStateTitle, dir.textCenter, { color: theme.colors.textPrimary }]}>
                    {t('tracker.hub.noDishes')}
                  </Text>
                  <Text style={[styles.emptyStateSubtitle, dir.textCenter, { color: theme.colors.textSecondary }]}>
                    {t(`tracker.hub.noDishesHint.${activeRegion}`)}
                  </Text>
                </View>
              ) : (
                searchResults.map((food) => renderDishCard(food))
              )}
            </View>
          ) : isDietView ? (
            /* Plain Single-Ingredient Foods */
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
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          accessibilityRole="button"
                          accessibilityLabel={t('tracker.hub.deletePreset', { name: preset.name })}
                        >
                          <Text style={[styles.presetChipRemove, { color: theme.colors.textMuted }]}>
                            ✕
                          </Text>
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

              <Text style={[styles.sectionEyebrow, { color: theme.colors.textMuted }]}>
                {t('tracker.hub.dietBasicsHeading', { count: dietFoods.length })}
              </Text>

              {/*
                Grouped, not one flat scroll of ~280 rows. Ordered so whole
                meals and proteins come first and the add-ons people put *on*
                food — oils, sugar, dressings — come last.
              */}
              {visibleDietSections.map(({ group, foods }) => (
                <View key={group}>
                  {visibleDietSections.length > 1 && (
                  <Text style={[styles.dietGroupHeading, { color: theme.colors.textSecondary }]}>
                    {t(`tracker.hub.dietGroups.${group}`)} · {foods.length}
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
                      group: groupLabel(selectedGroup),
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

                    <Icon name="chevron-right" size={18} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Custom Meal Summary Bar */}
        {isBuildMode && basket.length > 0 && !isNamingPreset && (
          <View
            style={[
              styles.basketBar,
              {
                backgroundColor: theme.colors.surface,
                borderTopColor: theme.colors.border,
              },
            ]}
          >
            {(
              <>
                <View style={styles.basketInfo}>
                  <Text style={[styles.basketCount, { color: theme.colors.textPrimary }]}>
                    {t('tracker.hub.basketCount', { count: basketTotals.count })}
                  </Text>
                  <Text
                    style={[styles.basketKcal, { color: theme.colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    ≈{Math.round(basketTotals.kcal)} kcal ·{' '}
                    {basket.map((e) => `${e.quantity}x ${e.food.name}`).join(', ')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsNamingPreset(true)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.savePresetLink, { color: theme.colors.primary }]}>
                      {t('tracker.hub.saveAsPreset')}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.basketConfirmBtn, { backgroundColor: theme.colors.primaryLime }]}
                  onPress={handleConfirmBasket}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <Text style={[styles.basketConfirmText, { color: theme.colors.limeText }]}>
                    {t('tracker.hub.logCustomMeal')}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  regionPillBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  regionPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 24,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  buildModeRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: 6,
  },
  buildModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 9999,
    borderWidth: 1,
  },
  buildModeBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  buildModeHint: {
    fontSize: 11,
    lineHeight: 15,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    fontSize: 14,
    fontWeight: '800',
    minWidth: 14,
    textAlign: 'center',
  },
  basketBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  basketInfo: {
    flex: 1,
  },
  savePresetLink: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  presetNameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  presetNameInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '700',
    maxWidth: 160,
  },
  presetChipMeta: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  presetChipRemove: {
    fontSize: 13,
    fontWeight: '700',
  },
  basketCount: {
    fontSize: 14,
    fontWeight: '800',
  },
  basketKcal: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  basketConfirmBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 9999,
  },
  basketConfirmText: {
    fontSize: 13,
    fontWeight: '800',
  },
  groupScrollContainer: {
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  groupPillsWrapper: {
    paddingHorizontal: 16,
    gap: 8,
  },
  groupPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  groupPillText: {
    fontSize: 13,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  dietGroupHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 8,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  brandsSection: {
    marginBottom: 20,
  },
  brandCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
  },
  brandAvatar: {
    marginRight: 14,
  },
  brandInfo: {
    flex: 1,
    marginRight: 8,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  brandName: {
    fontSize: 15,
    fontWeight: '800',
    marginRight: 8,
  },
  brandNameAr: {
    fontSize: 13,
    fontWeight: '700',
    marginRight: 6,
  },
  brandNameUr: {
    fontSize: 12,
  },
  brandTagline: {
    fontSize: 12,
  },
  searchResultsSection: {
    marginBottom: 24,
  },
  dishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
  },
  dishCardLeft: {
    flex: 1,
    marginRight: 12,
  },
  dishTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  dishName: {
    fontSize: 15,
    fontWeight: '800',
    marginRight: 6,
  },
  dishNameAr: {
    fontSize: 13,
    fontWeight: '700',
    marginRight: 6,
  },
  dishNameUr: {
    fontSize: 12,
  },
  dishMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  brandBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  brandBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dishServingText: {
    fontSize: 12,
  },
  dishMacrosText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dishCardRight: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 6,
  },
  caloriePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  caloriePillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptyStateContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  filterLoadingContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  filterLoadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
