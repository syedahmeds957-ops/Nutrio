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
} from 'react-native';
import {
  NormalizedFood,
  ALL_EXPANDED_PAKISTANI_FOODS,
  PAKISTANI_RESTAURANT_BRANDS,
  RestaurantBrand,
} from '@nutrio/food-db';
import { Icon } from '../../ui/Icon.js';
import { BrandLogo } from '../../ui/BrandLogo.js';
import { useTheme } from '../../theme.js';

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
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Reset category and search query whenever a new brand is opened
  useEffect(() => {
    setSelectedCategory('All');
    setSearchQuery('');
  }, [brandId, visible]);

  const currentBrand: RestaurantBrand | undefined = useMemo(() => {
    if (!brandId) return undefined;
    const cleanId = brandId.toLowerCase().trim();
    return (
      PAKISTANI_RESTAURANT_BRANDS.find((b) => b.id.toLowerCase() === cleanId) ||
      PAKISTANI_RESTAURANT_BRANDS.find(
        (b) => b.name.toLowerCase().replace(/[^a-z0-9]/g, '_') === cleanId
      ) ||
      PAKISTANI_RESTAURANT_BRANDS.find((b) => b.name.toLowerCase().includes(cleanId))
    );
  }, [brandId]);

  const brandName = currentBrand?.name || '';

  // Get all items belonging to this brand
  const brandItems = useMemo(() => {
    if (!brandId) return [];

    if (brandId === 'ghar_ka_khana' || currentBrand?.id === 'ghar_ka_khana') {
      const brandedGhar = ALL_EXPANDED_PAKISTANI_FOODS.filter(
        (i) => i.brand === 'Ghar ka Khana'
      );
      const stapleIds = new Set(brandedGhar.map((b) => b.id));
      const staples = ALL_EXPANDED_PAKISTANI_FOODS.filter(
        (f) => !f.brand && !stapleIds.has(f.id)
      ).map((f) => ({
        ...f,
        brand: 'Ghar ka Khana',
        brandCategory: f.brandCategory || mapStapleToCategory(f.category),
      }));

      return [...brandedGhar, ...staples];
    }

    const targetName = (currentBrand?.name || brandName).toLowerCase().trim();
    return ALL_EXPANDED_PAKISTANI_FOODS.filter((i) => {
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
    <Modal visible={visible} animationType="slide" transparent={false}>
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
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.colors.surfaceSecondary }]}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Icon name="arrow-left" size={18} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <BrandLogo brandId={currentBrand?.id || brandId || ''} size={34} style={{ marginRight: 10 }} />
            <View>
              <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
                {brandName || 'Brand Menu'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
                {brandItems.length} verified food items
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
                borderColor: theme.colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <Icon name="search" size={16} color={theme.colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.textPrimary }]}
              placeholder={`Search in ${brandName || 'menu'}...`}
              placeholderTextColor={theme.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
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
                    {cat}
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
              <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
                No items found
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                Try adjusting your search or category filter.
              </Text>
            </View>
          ) : (
            groupedSections.map((sec) => {
              if (sec.data.length === 0) return null;
              return (
                <View key={sec.title} style={styles.sectionBlock}>
                  {selectedCategory === 'All' && (
                    <Text style={[styles.sectionHeader, { color: theme.colors.textMuted }]}>
                      {sec.title.toUpperCase()} ({sec.data.length})
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
                        <View style={styles.itemCardLeft}>
                          <View style={styles.itemNameRow}>
                            <Text style={[styles.itemName, { color: theme.colors.textPrimary }]}>
                              {item.name}
                            </Text>
                            {item.nameUr && (
                              <Text style={[styles.itemNameUr, { color: theme.colors.textMuted }]}>
                                {item.nameUr}
                              </Text>
                            )}
                          </View>

                          <Text style={[styles.itemServing, { color: theme.colors.textSecondary }]}>
                            {serving
                              ? `${serving.grams || serving.servingWeightGrams || 100}g · ${serving.description || serving.label || '1 serving'}`
                              : '100g'}
                          </Text>

                          <Text
                            style={[
                              styles.itemMacros,
                              { color: isDark ? theme.colors.primaryLime : '#4B6200' },
                            ]}
                          >
                            P {p}g · C {c}g · F {f}g
                          </Text>
                        </View>

                        <View style={styles.itemCardRight}>
                          <View
                            style={[
                              styles.caloriePill,
                              {
                                backgroundColor: isDark
                                  ? 'rgba(164, 235, 63, 0.15)'
                                  : '#F7FEE7',
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
                          <Icon name="chevron-right" size={16} color={theme.colors.textMuted} />
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
    </Modal>
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
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
    marginLeft: 8,
    fontSize: 15,
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
    marginLeft: 4,
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
  itemCardLeft: {
    flex: 1,
    marginRight: 12,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '800',
    marginRight: 6,
  },
  itemNameUr: {
    fontSize: 12,
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
