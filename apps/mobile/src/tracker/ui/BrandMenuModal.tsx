import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { BackButton } from '../../ui/BackButton.js';
import { NamedModal } from '../../ui/NamedModal.js';
import type { NormalizedFood, RestaurantBrand } from '@nutrio/food-db';
import { foodDb } from '../../catalogue/index.js';
import { Icon } from '../../ui/Icon.js';
import { BrandLogo } from '../../ui/BrandLogo.js';
import { noOutlineStyle } from '../../ui/AppleInput.js';
import { useTheme } from '../../theme.js';
import { foodDisplayName } from '../foodDisplayName.js';
import { DishThumb } from './DishThumb.js';
import { useTranslation, useTextDirection, useI18nState } from '../../i18n/index.js';
import { pickText } from '../../i18n/displayName.js';
import { servingDisplayLabel } from '../servingLabel.js';

export interface BrandMenuModalProps {
  visible: boolean;
  brandId: string | null;
  onBack: () => void;
  onSelectItem: (item: NormalizedFood) => void;
}

export const BrandMenuModal: React.FC<BrandMenuModalProps> = ({
  visible,
  brandId,
  onBack,
  onSelectItem,
}) => {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { language } = useI18nState();
  const dir = useTextDirection();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  // Reset category and search query whenever a new brand is opened
  useEffect(() => {
    setSelectedCategory('All');
    setSearchQuery('');
  }, [brandId, visible]);

  const currentBrand: RestaurantBrand | undefined = useMemo(() => {
    if (!brandId) return undefined;
    const cleanId = brandId.toLowerCase().trim();
    return (
      foodDb().ALL_RESTAURANT_BRANDS.find((b) => b.id.toLowerCase() === cleanId) ||
      foodDb().ALL_RESTAURANT_BRANDS.find(
        (b) => b.name.toLowerCase().replace(/[^a-z0-9]/g, '_') === cleanId
      ) ||
      foodDb().ALL_RESTAURANT_BRANDS.find((b) => b.name.toLowerCase().includes(cleanId))
    );
  }, [brandId]);

  const brandName = currentBrand?.name || '';
  const brandTitle = currentBrand ? pickText(currentBrand.name, currentBrand.nameAr, language) : '';

  const isSaudiBrand = useMemo(() => {
    if (!brandId) return false;
    const cleanId = brandId.toLowerCase().trim();
    return (
      currentBrand?.region === 'SA' ||
      foodDb().SAUDI_RESTAURANT_BRANDS.some((b) => b.id === cleanId)
    );
  }, [brandId, currentBrand]);

  // Get all items belonging to this brand
  const brandItems = useMemo(() => {
    if (!brandId) return [];
    const cleanId = brandId.toLowerCase().trim();

    // 1. Saudi Brand Resolution
    const isSaudi =
      currentBrand?.region === 'SA' ||
      foodDb().SAUDI_RESTAURANT_BRANDS.some((b) => b.id === cleanId);

    if (isSaudi) {
      if (
        cleanId === 'al_matbakh_al_saudi' ||
        cleanId === 'saudi_home_kitchen' ||
        cleanId === 'saudi_traditional_kitchen'
      ) {
        return foodDb().SAUDI_TRADITIONAL_FOODS.map((f) => ({
          ...f,
          brand: 'Saudi Traditional Kitchen',
          brandId: 'al_matbakh_al_saudi',
          brandCategory: f.category || 'Traditional Dishes',
        }));
      }

      const targetName = (currentBrand?.name || brandName).toLowerCase().trim();
      return foodDb().SAUDI_RESTAURANTS_DATA.filter((i) => {
        const itemBrandId = (i.brandId || '').toLowerCase().trim();
        const itemBrand = (i.brand || '').toLowerCase().trim();
        return (
          itemBrandId === cleanId ||
          (currentBrand && itemBrandId === currentBrand.id.toLowerCase().trim()) ||
          itemBrand === targetName
        );
      });
    }

    // 2. Pakistani Ghar ka Khana
    if (brandId === 'ghar_ka_khana' || currentBrand?.id === 'ghar_ka_khana') {
      const brandedGhar = foodDb().ALL_EXPANDED_PAKISTANI_FOODS.filter(
        (i) => i.brand === 'Ghar ka Khana'
      );
      const stapleIds = new Set(brandedGhar.map((b) => b.id));
      const staples = foodDb().ALL_EXPANDED_PAKISTANI_FOODS.filter(
        (f) => !f.brand && !stapleIds.has(f.id)
      ).map((f) => ({
        ...f,
        brand: 'Ghar ka Khana',
        brandCategory: f.brandCategory || mapStapleToCategory(f.category),
      }));

      return [...brandedGhar, ...staples];
    }

    // 3. Pakistani branded restaurants
    const targetName = (currentBrand?.name || brandName).toLowerCase().trim();
    return foodDb().ALL_EXPANDED_PAKISTANI_FOODS.filter((i) => {
      if (!i.brand) return false;
      const itemBrand = i.brand.toLowerCase().trim();
      return (
        itemBrand === targetName ||
        (currentBrand && itemBrand === currentBrand.name.toLowerCase().trim())
      );
    });
  }, [brandId, brandName, currentBrand]);

  // Categories list with fallback
  const categories = useMemo(() => {
    if (currentBrand?.categories?.length) return currentBrand.categories;
    const cats = brandItems.map((i) => i.brandCategory).filter((c): c is string => Boolean(c));
    return ['All', ...Array.from(new Set(cats))];
  }, [currentBrand, brandItems]);

  // Filter items by category & search query
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return brandItems.filter((item) => {
      // Category filter
      if (selectedCategory !== 'All') {
        const itemCat = item.brandCategory || '';
        if (itemCat.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // Search filter
      if (q) {
        const nameMatch = item.name.toLowerCase().includes(q);
        const urduMatch = item.nameUr ? item.nameUr.toLowerCase().includes(q) : false;
        const brandMatch = item.brand ? item.brand.toLowerCase().includes(q) : false;
        return nameMatch || urduMatch || brandMatch;
      }

      return true;
    });
  }, [brandItems, selectedCategory, searchQuery]);

  // Group items by category if showing "All"
  const groupedSections = useMemo(() => {
    if (selectedCategory !== 'All') {
      return [{ title: selectedCategory, data: filteredItems }];
    }

    const groups: Record<string, NormalizedFood[]> = {};
    for (const item of filteredItems) {
      const cat = item.brandCategory || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }

    return Object.keys(groups).map((title) => ({
      title,
      data: groups[title],
    }));
  }, [filteredItems, selectedCategory]);

  return (
    <NamedModal accessibilityName={t('a11y.dialog.brandMenu')} visible={visible} animationType="slide" transparent={false} onRequestClose={onBack}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.canvas }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <BackButton variant="icon" onPress={onBack} />

          <View style={styles.headerTitleContainer}>
            <BrandLogo brandId={currentBrand?.id || brandId || ''} size={34} style={{ marginEnd: 10 }} />
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
                  {brandTitle || t('tracker.brandMenu.fallbackTitle')}
                </Text>
              </View>
              <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
                {t('tracker.brandMenu.verifiedItems', { count: brandItems.length })}
                {currentBrand?.region === 'SA' ? ` · ${t('tracker.brandMenu.sfdaCompliant')}` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.headerRightSpacer} />
        </View>

        {/* Search Bar */}
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
                borderWidth: isSearchFocused ? 1.5 : 1,
              },
            ]}
          >
            <Icon name="search" size={16} color={isSearchFocused ? theme.colors.primaryLime : theme.colors.textMuted} />
            <TextInput
              style={[
                styles.searchInput,
                { color: theme.colors.textPrimary },
                noOutlineStyle,
                dir.text,
              ]}
              placeholder={t('tracker.brandMenu.searchPlaceholder', {
                brand: brandTitle || t('tracker.brandMenu.menuWord'),
              })}
              placeholderTextColor={theme.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="x" size={16} color={theme.colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Pills Bar */}
        <View
          style={[
            styles.categoryScrollContainer,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryPillsWrapper}
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryPill,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primaryLime
                            : theme.colors.surfaceSecondary,
                        },
                      ]}
                      onPress={() => setSelectedCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.categoryPillText,
                          {
                            color: isSelected
                              ? '#0A0B0D'
                              : theme.colors.textSecondary,
                            fontWeight: isSelected ? '800' : '600',
                          },
                        ]}
                      >
                        {t(`tracker.brandGroups.${cat}`, { defaultValue: cat })}
                      </Text>
                    </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Food Items List */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {filteredItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="search" size={32} color={theme.colors.textMuted} />
              <Text style={[styles.emptyTitle, dir.textCenter, { color: theme.colors.textPrimary }]}>
                {t('tracker.brandMenu.noItems')}
              </Text>
              <Text style={[styles.emptySubtitle, dir.textCenter, { color: theme.colors.textSecondary }]}>
                {t('tracker.brandMenu.noItemsHint')}
              </Text>
            </View>
          ) : (
            groupedSections.map((sec) => {
              if (sec.data.length === 0) return null;
              return (
                <View key={sec.title} style={styles.sectionBlock}>
                  {selectedCategory === 'All' && (
                    <Text style={[styles.sectionHeader, { color: theme.colors.textMuted }]}>
                      {t(`tracker.brandGroups.${sec.title}`, { defaultValue: sec.title })} ({sec.data.length})
                    </Text>
                  )}

                  {sec.data.map((item) => {
                    const serving = item.servings?.[0];
                    const ratio = serving ? (serving.grams || 100) / 100 : 1;
                    const kcal =
                      serving && serving.kcal !== undefined
                        ? Math.round(serving.kcal)
                        : Math.round((item.kcal100g || 0) * ratio);
                    const p =
                      serving && serving.proteinGrams !== undefined
                        ? Math.round(serving.proteinGrams)
                        : Math.round((item.protein100g || 0) * ratio);
                    const c =
                      serving && serving.carbGrams !== undefined
                        ? Math.round(serving.carbGrams)
                        : Math.round((item.carb100g || 0) * ratio);
                    const f =
                      serving && serving.fatGrams !== undefined
                        ? Math.round(serving.fatGrams)
                        : Math.round((item.fat100g || 0) * ratio);

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.itemCard,
                          {
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.border,
                          },
                        ]}
                        onPress={() => onSelectItem(item)}
                        activeOpacity={0.7}
                      >
                        <DishThumb category={item.brandCategory || item.category} size={52} style={styles.itemThumb} />
                        <View style={styles.itemCardLeft}>
                          <View style={styles.itemNameRow}>
                            <Text style={[styles.itemName, { color: theme.colors.textPrimary }]}>
                              {foodDisplayName(item.name, item.nameAr, dir.isRTL).primary}
                            </Text>
                          </View>

                          <Text style={[styles.itemServing, { color: theme.colors.textSecondary }]}>
                            {serving
                              ? `${t('common.gramsValue', { value: serving.grams || serving.servingWeightGrams || 100 })} · ${
                                  servingDisplayLabel(serving.description || serving.label || '', language) || t('tracker.brandMenu.oneServing')
                                }`
                              : t('common.gramsValue', { value: 100 })}
                          </Text>

                          <Text
                            style={[
                              styles.itemMacros,
                              { color: isDark ? theme.colors.primaryLime : '#4B6200' },
                            ]}
                          >
                            {t('common.macroLine', { protein: p, carbs: c, fat: f })}
                          </Text>
                        </View>

                        <View style={styles.itemCardRight}>
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
                              ≈{t('common.kcalValue', { value: kcal })}
                            </Text>
                          </View>
                          <Icon name={dir.isRTL ? 'chevron-left' : 'chevron-right'} size={16} color={theme.colors.textMuted} />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </NamedModal>
  );
};

// Helper to map generic categories to Ghar ka Khana categories
function mapStapleToCategory(cat: string): string {
  const c = cat.toLowerCase();
  if (c.includes('tea') || c.includes('beverage') || c.includes('drink') || c.includes('chai')) {
    return 'Chai & Drinks';
  }
  if (c.includes('breakfast') || c.includes('nashta') || c.includes('egg') || c.includes('paratha')) {
    return 'Nashta';
  }
  if (c.includes('biryani') || c.includes('rice') || c.includes('pulao')) {
    return 'Rice & Biryani';
  }
  if (c.includes('karahi') || c.includes('handi') || c.includes('curry') || c.includes('daal') || c.includes('gravy')) {
    return 'Curries & Karahi';
  }
  if (c.includes('roti') || c.includes('naan') || c.includes('bread')) {
    return 'Roti & Bread';
  }
  if (c.includes('dessert') || c.includes('sweet') || c.includes('halwa') || c.includes('kheer')) {
    return 'Meetha';
  }
  return 'Curries & Karahi';
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerRightSpacer: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginStart: 8,
    fontSize: 15,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  categoryScrollContainer: {
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  categoryPillsWrapper: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  categoryPillText: {
    fontSize: 13,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginStart: 4,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
  },
  itemThumb: {
    marginEnd: 12,
  },
  itemCardLeft: {
    flex: 1,
    marginEnd: 12,
  },
  itemNameRow: {
    marginBottom: 4,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '800',
    marginEnd: 6,
  },
  itemNameAr: {
    fontSize: 13,
    fontWeight: '700',
    marginEnd: 6,
  },
  itemServing: {
    fontSize: 13,
    marginBottom: 4,
  },
  itemMacros: {
    fontSize: 12,
    fontWeight: '700',
  },
  itemCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
