import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  SafeAreaView,
} from 'react-native';
import {
  NormalizedFood,
  PAKISTANI_RESTAURANT_BRANDS,
  SAUDI_RESTAURANT_BRANDS,
  ALL_SAUDI_FOODS,
  RestaurantBrand,
  searchPakistaniFoods,
  searchSaudiFoods,
} from '@nutrio/food-db';
import { Icon } from '../../ui/Icon.js';
import { BrandLogo } from '../../ui/BrandLogo.js';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';

export interface MealLogHubModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectBrand: (brandId: string) => void;
  onSelectItem: (item: NormalizedFood) => void;
}

const PK_BRAND_GROUPS = [
  'All',
  'Fast Food',
  'Pizza',
  'Desi BBQ',
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
}) => {
  const { theme, isDark } = useTheme();
  const { activeRegion, setRegion } = useRegion();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('All');

  const brandGroups = activeRegion === 'SA' ? SA_BRAND_GROUPS : PK_BRAND_GROUPS;

  // Search across dishes adapted to active region
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    if (activeRegion === 'SA') {
      return searchSaudiFoods(q, { limit: 40 });
    }

    return searchPakistaniFoods(q, { limit: 40 });
  }, [searchQuery, activeRegion]);

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
            accessibilityLabel="Back"
          >
            <Icon name="arrow-left" size={18} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
            Log a meal
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
            accessibilityLabel="Switch Region"
          >
            <Text style={[styles.regionPillText, { color: theme.colors.textPrimary }]}>
              {activeRegion === 'SA' ? '🇸🇦 SA' : '🇵🇰 PK'}
            </Text>
          </TouchableOpacity>
        </View>

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
                borderColor: theme.colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <Icon name="search" size={18} color={theme.colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.textPrimary }]}
              placeholder={
                activeRegion === 'SA'
                  ? 'Search Kabsa, AlBaik, Mandi, Gahwa, Shawarma...'
                  : 'Search 2,700+ dishes, Zinger, pulao, fries...'
              }
              placeholderTextColor={theme.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {isSearching && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="x" size={16} color={theme.colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

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
                          ? (activeRegion === 'SA' ? '#10B981' : theme.colors.primaryLime)
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
                            ? (activeRegion === 'SA' ? '#FFFFFF' : '#0A0B0D')
                            : theme.colors.textSecondary,
                          fontWeight: isActive ? '800' : '600',
                        },
                      ]}
                    >
                      {grp}
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
                {searchResults.length} {searchResults.length === 1 ? 'RESULT' : 'RESULTS'} FOUND
              </Text>

              {searchResults.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <Text style={[styles.emptyStateTitle, { color: theme.colors.textPrimary }]}>
                    No dishes found
                  </Text>
                  <Text style={[styles.emptyStateSubtitle, { color: theme.colors.textSecondary }]}>
                    {activeRegion === 'SA'
                      ? 'Try searching for "Kabsa", "AlBaik", "Mandi", "Saleeg", or "Gahwa".'
                      : 'Try searching for "Zinger", "Biryani", "Chai", "Pizza", or "Karahi".'}
                  </Text>
                </View>
              ) : (
                searchResults.map((item: NormalizedFood) => {
                  const serving = item.servings[0];
                  const kcal = serving ? Math.round(serving.kcal || item.kcal100g) : Math.round(item.kcal100g);
                  const p = serving ? Math.round(serving.proteinGrams || item.protein100g) : Math.round(item.protein100g);
                  const c = serving ? Math.round(serving.carbGrams || item.carb100g) : Math.round(item.carb100g);
                  const f = serving ? Math.round(serving.fatGrams || item.fat100g) : Math.round(item.fat100g);

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.dishCard,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border,
                        },
                      ]}
                      onPress={() => onSelectItem(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.dishCardLeft}>
                        <View style={styles.dishTitleRow}>
                          <Text style={[styles.dishName, { color: theme.colors.textPrimary }]}>
                            {item.name}
                          </Text>
                          {item.nameAr && (
                            <Text style={[styles.dishNameAr, { color: activeRegion === 'SA' ? '#10B981' : theme.colors.primaryLime }]}>
                              {item.nameAr}
                            </Text>
                          )}
                          {item.nameUr && (
                            <Text style={[styles.dishNameUr, { color: theme.colors.textMuted }]}>
                              {item.nameUr}
                            </Text>
                          )}
                        </View>
                        <View style={styles.dishMetaRow}>
                          {item.brand && (
                            <View
                              style={[
                                styles.brandBadge,
                                { backgroundColor: theme.colors.surfaceSecondary },
                              ]}
                            >
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
                            { color: activeRegion === 'SA' ? '#10B981' : (isDark ? theme.colors.primaryLime : '#4B6200') },
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
                              backgroundColor: activeRegion === 'SA'
                                ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5')
                                : (isDark ? 'rgba(164, 235, 63, 0.15)' : '#F7FEE7'),
                              borderColor: activeRegion === 'SA' ? '#10B981' : theme.colors.primaryLime,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.caloriePillText,
                              {
                                color: activeRegion === 'SA'
                                  ? '#10B981'
                                  : (isDark ? theme.colors.primaryLime : '#4B6200'),
                              },
                            ]}
                          >
                            ≈{kcal} kcal
                          </Text>
                        </View>
                        <Icon name="chevron-right" size={16} color={theme.colors.textMuted} />
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          ) : (
            /* Brands List View */
            <View style={styles.brandsSection}>
              <Text style={[styles.sectionEyebrow, { color: theme.colors.textMuted }]}>
                {activeRegion === 'SA'
                  ? selectedGroup === 'All'
                    ? '12+ SAUDI RESTAURANTS & TRADITIONAL DISHES (SFDA)'
                    : `${selectedGroup.toUpperCase()} BRANDS (${filteredBrands.length})`
                  : selectedGroup === 'All'
                  ? '60+ PAKISTANI RESTAURANTS & HOME FOODS'
                  : `${selectedGroup.toUpperCase()} BRANDS (${filteredBrands.length})`}
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
                        {brand.nameAr && (
                          <Text style={[styles.brandNameAr, { color: activeRegion === 'SA' ? '#10B981' : theme.colors.primaryLime }]}>
                            {brand.nameAr}
                          </Text>
                        )}
                        {brand.nameUr && (
                          <Text style={[styles.brandNameUr, { color: theme.colors.textMuted }]}>
                            {brand.nameUr}
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
});
