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
import { NormalizedFood, PAKISTANI_STAPLES_DATA, ServingUnit } from '@nutrio/food-db';
import { MealSlot } from '../types.js';
import { calculateNutrientsForGrams } from '../engine.js';

interface DesiFoodSearchModalProps {
  visible: boolean;
  mealSlot: MealSlot;
  onClose: () => void;
  onConfirmLog: (
    slot: MealSlot,
    food: NormalizedFood,
    serving: ServingUnit,
    quantity: number
  ) => void;
}

const SLOT_NAMES: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks_chai: 'Snacks & Chai',
};

export const DesiFoodSearchModal: React.FC<DesiFoodSearchModalProps> = ({
  visible,
  mealSlot,
  onClose,
  onConfirmLog,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<NormalizedFood | null>(null);
  const [selectedServing, setSelectedServing] = useState<ServingUnit | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  // Filter food items
  const filteredFoods = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return PAKISTANI_STAPLES_DATA;
    return PAKISTANI_STAPLES_DATA.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.nameUr && f.nameUr.includes(q)) ||
        f.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleSelectFood = (food: NormalizedFood) => {
    setSelectedFood(food);
    const defaultServing =
      food.servings.find((s) => s.isDefault) || food.servings[0];
    setSelectedServing(defaultServing || { label: '100g', grams: 100, isDefault: true });
    setQuantity(1);
  };

  const calculatedNutrients = useMemo(() => {
    if (!selectedFood || !selectedServing) return null;
    const totalGrams = Math.round(selectedServing.grams * quantity);
    return {
      totalGrams,
      ...calculateNutrientsForGrams(selectedFood, totalGrams),
    };
  }, [selectedFood, selectedServing, quantity]);

  const handleConfirm = () => {
    if (!selectedFood || !selectedServing) return;
    onConfirmLog(mealSlot, selectedFood, selectedServing, quantity);
    setSelectedFood(null);
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Log to {SLOT_NAMES[mealSlot]}</Text>
            <Text style={styles.subtitle}>
              Pakistani Staples with authentic desi household measures
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.closeBtn}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* If a food is selected, show portion customizer */}
        {selectedFood && selectedServing && calculatedNutrients ? (
          <ScrollView style={styles.content} contentContainerStyle={styles.scrollPad}>
            <TouchableOpacity
              style={styles.backToSearchBtn}
              onPress={() => setSelectedFood(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.backToSearchText}>← Back to food list</Text>
            </TouchableOpacity>

            <View style={styles.card}>
              <Text style={styles.selectedFoodTitle}>{selectedFood.name}</Text>
              {selectedFood.nameUr && (
                <Text style={styles.selectedFoodUrdu}>{selectedFood.nameUr}</Text>
              )}
              <Text style={styles.categoryBadge}>{selectedFood.category}</Text>

              {/* Serving Unit Picker */}
              <Text style={styles.sectionTitle}>Select Serving Size</Text>
              <View style={styles.servingsGrid}>
                {selectedFood.servings.map((serving, idx) => {
                  const isSelected = selectedServing.label === serving.label;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.servingOption,
                        isSelected && styles.servingOptionActive,
                      ]}
                      onPress={() => setSelectedServing(serving)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.servingOptionText,
                          isSelected && styles.servingOptionTextActive,
                        ]}
                      >
                        {serving.label}
                      </Text>
                      {serving.labelUr && (
                        <Text style={styles.servingOptionUrdu}>
                          {serving.labelUr}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Quantity Stepper */}
              <Text style={styles.sectionTitle}>Quantity</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setQuantity((prev) => Math.max(0.5, prev - (prev <= 1 ? 0.5 : 1)))}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stepperBtnText}>−</Text>
                </TouchableOpacity>

                <View style={styles.stepperValueBox}>
                  <Text style={styles.stepperValue}>{quantity}</Text>
                  <Text style={styles.stepperUnit}>
                    ({calculatedNutrients.totalGrams}g total)
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setQuantity((prev) => prev + (prev < 1 ? 0.5 : 1))}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Calculated Nutrients Preview */}
              <View style={styles.nutrientPreviewCard}>
                <Text style={styles.nutrientCalories}>
                  {calculatedNutrients.calories} kcal
                </Text>
                <View style={styles.nutrientMacrosRow}>
                  <Text style={styles.macroPill}>
                    Protein: {calculatedNutrients.proteinGrams}g
                  </Text>
                  <Text style={styles.macroPill}>
                    Fat: {calculatedNutrients.fatGrams}g
                  </Text>
                  <Text style={styles.macroPill}>
                    Carbs: {calculatedNutrients.carbGrams}g
                  </Text>
                </View>
                <Text style={styles.ruleNotice}>
                  Strictly computed: {selectedFood.kcal100g} kcal/100g × ({calculatedNutrients.totalGrams}g / 100)
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmBtnText}>
                Log {calculatedNutrients.calories} kcal to {SLOT_NAMES[mealSlot]}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          /* Food Search List */
          <View style={styles.content}>
            <View style={styles.searchBox}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search roti, biryani, daal, chai..."
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>

            <ScrollView contentContainerStyle={styles.scrollPad}>
              {filteredFoods.map((food, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.foodRow}
                  onPress={() => handleSelectFood(food)}
                  activeOpacity={0.7}
                >
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName}>{food.name}</Text>
                    {food.nameUr && (
                      <Text style={styles.foodUrdu}>{food.nameUr}</Text>
                    )}
                    <Text style={styles.foodServingHint}>
                      {food.servings[0]?.label || '100g'}
                    </Text>
                  </View>
                  <View style={styles.foodKcalBox}>
                    <Text style={styles.foodKcal}>{food.kcal100g}</Text>
                    <Text style={styles.foodKcalSub}>kcal/100g</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F8F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  scrollPad: {
    padding: 20,
    paddingBottom: 48,
  },
  searchBox: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#1E293B',
    fontSize: 15,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  foodUrdu: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  foodServingHint: {
    fontSize: 12,
    color: '#059669',
    marginTop: 4,
  },
  foodKcalBox: {
    alignItems: 'flex-end',
  },
  foodKcal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  foodKcalSub: {
    fontSize: 10,
    color: '#64748B',
  },
  backToSearchBtn: {
    marginBottom: 16,
  },
  backToSearchText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  selectedFoodTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  selectedFoodUrdu: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
    marginTop: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 10,
    marginTop: 10,
  },
  servingsGrid: {
    gap: 8,
  },
  servingOption: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  servingOptionActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  servingOptionText: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '600',
  },
  servingOptionTextActive: {
    color: '#059669',
  },
  servingOptionUrdu: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 12,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  stepperBtnText: {
    color: '#1E293B',
    fontSize: 22,
    fontWeight: '700',
  },
  stepperValueBox: {
    alignItems: 'center',
    minWidth: 100,
  },
  stepperValue: {
    color: '#1E293B',
    fontSize: 26,
    fontWeight: '900',
  },
  stepperUnit: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  nutrientPreviewCard: {
    marginTop: 20,
    backgroundColor: '#ECFDF5',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  nutrientCalories: {
    fontSize: 32,
    fontWeight: '900',
    color: '#059669',
  },
  nutrientMacrosRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  macroPill: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '700',
  },
  ruleNotice: {
    color: '#047857',
    fontSize: 10,
    marginTop: 8,
    fontStyle: 'italic',
  },
  confirmBtn: {
    backgroundColor: '#10B981',
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
