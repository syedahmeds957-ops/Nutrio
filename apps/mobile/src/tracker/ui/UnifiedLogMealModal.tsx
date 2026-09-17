import React, { useState, useMemo } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import {
  NormalizedFood,
  PAKISTANI_STAPLES_DATA,
  SAUDI_TRADITIONAL_FOODS,
  ServingUnit,
} from '@nutrio/food-db';
import { ResolvedFoodItem } from '@nutrio/nutrition-core';
import { MealSlot } from '../types.js';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';

interface UnifiedLogMealModalProps {
  visible: boolean;
  mealSlot: MealSlot;
  onClose: () => void;
  onConfirmSingleFood: (
    slot: MealSlot,
    food: NormalizedFood,
    serving: ServingUnit,
    quantity: number
  ) => void;
  onConfirmPlateItems?: (slot: MealSlot, items: ResolvedFoodItem[]) => void;
}

const PK_FOOD_CATEGORIES = [
  'All',
  'Rice & Biryani',
  'Karahi & Handi',
  'BBQ & Grills',
  'Slow-Cooked Curries',
  'Breakfast & Nashta',
  'Sabzi & Lentils',
  'Pakistani Fast Food',
  'Beverages & Drinks',
];

const SA_FOOD_CATEGORIES = [
  'All',
  'Rice & Meat',
  'Soups & Grains',
  'Breakfast',
  'Dates & Coffee',
  'Traditional Sweets',
];

export const UnifiedLogMealModal: React.FC<UnifiedLogMealModalProps> = ({
  visible,
  mealSlot,
  onClose,
  onConfirmSingleFood,
}) => {
  const { theme, isDark } = useTheme();
  const { activeRegion } = useRegion();
  const isSaudi = activeRegion === 'SA';

  const categories = isSaudi ? SA_FOOD_CATEGORIES : PK_FOOD_CATEGORIES;

  // Search tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedFood, setSelectedFood] = useState<NormalizedFood | null>(null);
  const [selectedServing, setSelectedServing] = useState<ServingUnit | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  // Search Filter with Categories
  const filteredFoods = useMemo(() => {
    let list: readonly NormalizedFood[] = isSaudi
      ? SAUDI_TRADITIONAL_FOODS
      : PAKISTANI_STAPLES_DATA;

    if (selectedCategory !== 'All') {
      list = list.filter((f) => {
        if (selectedCategory === 'Sabzi & Lentils') {
          return f.category === 'Sabzi & Lentils' || f.category === 'Vegetables & Daal';
        }
        if (selectedCategory === 'Breakfast & Nashta') {
          return f.category === 'Breakfast & Nashta' || f.category === 'Nashta & Breakfast';
        }
        return f.category.toLowerCase().includes(selectedCategory.toLowerCase());
      });
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;

    return list.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.nameUr && f.nameUr.includes(q)) ||
        (f.nameAr && f.nameAr.includes(q)) ||
        f.category.toLowerCase().includes(q)
    );
  }, [searchQuery, selectedCategory, isSaudi]);

  const handleSelectFood = (food: NormalizedFood) => {
    setSelectedFood(food);
    const def = food.servings.find((s) => s.isDefault) || food.servings[0];
    setSelectedServing(def || null);
    setQuantity(1);
  };

  const handleConfirmSearchLog = () => {
    if (selectedFood && selectedServing) {
      onConfirmSingleFood(mealSlot, selectedFood, selectedServing, quantity);
      handleCloseAll();
    }
  };

  const handleCloseAll = () => {
    setSelectedFood(null);
    setSelectedServing(null);
    setSearchQuery('');
    setSelectedCategory('All');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCloseAll}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.eyebrow, { color: isDark ? (isSaudi ? '#10B981' : '#A4EB3F') : (isSaudi ? '#059669' : '#16A34A') }]}>
                LOG TO {mealSlot.toUpperCase().replace('_', ' ')}
              </Text>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add Food to Diary</Text>
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: isDark ? '#272A33' : '#F1F5F9' }]}
              onPress={handleCloseAll}
              activeOpacity={0.7}
            >
              <Text style={[styles.closeBtnText, { color: theme.colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Database Search */}
          <View style={styles.tabContent}>
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: isDark ? '#14151A' : '#F8FAFC',
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              placeholder={isSaudi ? 'Search kabsa, mandi, saleeg, tamees...' : 'Search roti, biryani, daal chana...'}
              placeholderTextColor={theme.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {/* Category Pills Bar */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.catScroll}
              contentContainerStyle={styles.catScrollContent}
            >
              {categories.map((cat) => {
                const isCatActive = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catChip,
                      {
                        backgroundColor: isDark ? '#1C1D24' : '#F1F5F9',
                        borderColor: theme.colors.border,
                      },
                      isCatActive && [
                        styles.catChipActive,
                        isSaudi && { backgroundColor: '#10B981', borderColor: '#10B981' },
                      ],
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.catChipText,
                        { color: theme.colors.textMuted },
                        isCatActive && [
                          styles.catChipTextActive,
                          isSaudi && { color: '#FFFFFF' },
                        ],
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {selectedFood ? (
              <View style={[styles.selectedFoodCard, { backgroundColor: isDark ? '#14151A' : '#F8FAFC', borderColor: theme.colors.border }]}>
                <Text style={[styles.selectedName, { color: theme.colors.text }]}>
                  {selectedFood.name}
                  {isSaudi && selectedFood.nameAr
                    ? ` · ${selectedFood.nameAr}`
                    : !isSaudi && selectedFood.nameUr
                    ? ` · ${selectedFood.nameUr}`
                    : ''}
                </Text>
                <Text style={[styles.selectedServing, { color: theme.colors.textMuted }]}>
                  {selectedServing?.label} ({selectedServing?.grams}g)
                </Text>

                {/* Quantity Stepper */}
                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    style={[styles.qtyBtn, { backgroundColor: isDark ? '#272A33' : '#E2E8F0' }]}
                    onPress={() => setQuantity((q) => Math.max(0.5, q - 0.5))}
                  >
                    <Text style={[styles.qtyBtnText, { color: theme.colors.text }]}>-</Text>
                  </TouchableOpacity>
                  <Text style={[styles.qtyVal, { color: theme.colors.text }]}>{quantity}x</Text>
                  <TouchableOpacity
                    style={[styles.qtyBtn, { backgroundColor: isDark ? '#272A33' : '#E2E8F0' }]}
                    onPress={() => setQuantity((q) => q + 0.5)}
                  >
                    <Text style={[styles.qtyBtnText, { color: theme.colors.text }]}>+</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.actionBtn, isSaudi && { backgroundColor: '#10B981' }]}
                  onPress={handleConfirmSearchLog}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.actionBtnText, isSaudi && { color: '#FFFFFF' }]}>
                    {isSaudi ? 'Log Selected Food (تسجيل الوجبة)' : 'Log Selected Food'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={styles.searchList} showsVerticalScrollIndicator={false}>
                {filteredFoods.slice(0, 18).map((food) => (
                  <TouchableOpacity
                    key={food.id}
                    style={[styles.foodRow, { borderBottomColor: theme.colors.border }]}
                    onPress={() => handleSelectFood(food)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.foodRowName, { color: theme.colors.text }]}>
                        {food.name}
                        {isSaudi && food.nameAr
                          ? ` · ${food.nameAr}`
                          : !isSaudi && food.nameUr
                          ? ` · ${food.nameUr}`
                          : ''}
                      </Text>
                      <Text style={[styles.foodRowCategory, { color: theme.colors.textMuted }]}>{food.category}</Text>
                    </View>
                    <Text style={[styles.foodRowKcal, { color: isDark ? (isSaudi ? '#10B981' : '#A4EB3F') : (isSaudi ? '#059669' : '#16A34A') }]}>{food.kcal100g} kcal/100g</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
    ...Platform.select({
      web: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      },
    }),
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '85%',
    paddingTop: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      web: {
        width: '100%',
        maxWidth: 500,
        maxHeight: 750,
        borderRadius: 28,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  eyebrow: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  modalTitle: {
    color: '#1E293B',
    fontSize: 20,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '700',
  },
  catScroll: {
    marginBottom: 10,
    maxHeight: 38,
  },
  catScrollContent: {
    gap: 8,
    paddingRight: 16,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: 1,
  },
  catChipActive: {
    backgroundColor: '#A4EB3F',
    borderColor: '#A4EB3F',
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  catChipTextActive: {
    color: '#0A0B0D',
    fontWeight: '800',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchInput: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchList: {
    flex: 1,
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  foodRowName: {
    fontSize: 14,
    fontWeight: '600',
  },
  foodRowCategory: {
    fontSize: 12,
    marginTop: 2,
  },
  foodRowKcal: {
    fontSize: 13,
    fontWeight: '700',
  },
  selectedFoodCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    gap: 12,
  },
  selectedName: {
    fontSize: 17,
    fontWeight: '800',
  },
  selectedServing: {
    fontSize: 13,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 6,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  qtyVal: {
    fontSize: 17,
    fontWeight: '700',
  },
  actionBtn: {
    backgroundColor: '#A4EB3F',
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#0A0B0D',
    fontSize: 15,
    fontWeight: '800',
  },
});
