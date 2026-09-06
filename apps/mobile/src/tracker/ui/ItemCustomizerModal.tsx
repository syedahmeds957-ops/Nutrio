import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
} from 'react-native';
import {
  NormalizedFood,
  FoodModifier,
  FoodServingItem,
  getDishCustomizationModifiers,
} from '@nutrio/food-db';
import { MealSlot } from '../types.js';
import { useTheme } from '../../theme.js';
import { Icon } from '../../ui/Icon.js';

export interface CustomizedLogPayload {
  food: NormalizedFood;
  quantity: number;
  selectedModifiers: Record<string, number>;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealSlot: MealSlot;
  portionDescription?: string;
  actualGrams?: number;
}

export interface ItemCustomizerModalProps {
  visible: boolean;
  item: NormalizedFood | null;
  initialMealSlot?: MealSlot;
  onBack?: () => void;
  onClose?: () => void;
  onLogItem?: (payload: CustomizedLogPayload) => void;
  onConfirmCustomizedLog?: (payload: CustomizedLogPayload) => void;
}

export interface CalculatedMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Helper function to match whole words and phrases (prevents substring bugs like "steaks" matching "tea")
export function hasWord(text: string, ...words: string[]): boolean {
  if (!text) return false;
  return words.some((w) => {
    const escaped = w.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    return regex.test(text);
  });
}

// Category-smart verified modifiers delegating directly to centralized food-db taxonomy
export function getEffectiveModifiers(food: NormalizedFood): FoodModifier[] {
  return getDishCustomizationModifiers(food);
}

export function calculateCustomizedMacros(
  food: NormalizedFood,
  quantity: number,
  selectedModifiers: Record<string, number>,
  customGrams?: number | null,
  selectedServingIndex: number = 0,
  availableModifiers?: FoodModifier[]
): CalculatedMacros {
  const serving = food.servings && food.servings[selectedServingIndex]
    ? food.servings[selectedServingIndex]
    : food.servings && food.servings[0];

  let baseKcal = 0;
  let baseProtein = 0;
  let baseCarbs = 0;
  let baseFat = 0;

  if (typeof customGrams === 'number' && customGrams > 0) {
    // Custom portion in grams
    const ratio = customGrams / 100;
    baseKcal = food.kcal100g * ratio;
    baseProtein = food.protein100g * ratio;
    baseCarbs = food.carb100g * ratio;
    baseFat = food.fat100g * ratio;
  } else if (serving) {
    baseKcal = typeof serving.kcal === 'number' ? serving.kcal : (serving.grams / 100) * food.kcal100g;
    baseProtein = typeof serving.proteinGrams === 'number' ? serving.proteinGrams : (serving.grams / 100) * food.protein100g;
    baseCarbs = typeof serving.carbGrams === 'number' ? serving.carbGrams : (serving.grams / 100) * food.carb100g;
    baseFat = typeof serving.fatGrams === 'number' ? serving.fatGrams : (serving.grams / 100) * food.fat100g;
  } else {
    baseKcal = food.kcal100g;
    baseProtein = food.protein100g;
    baseCarbs = food.carb100g;
    baseFat = food.fat100g;
  }

  // Base item macros scaled by quantity
  let totalKcal = baseKcal * quantity;
  let totalP = baseProtein * quantity;
  let totalC = baseCarbs * quantity;
  let totalF = baseFat * quantity;

  // Modifiers
  const modifiers = availableModifiers || food.modifiers || getEffectiveModifiers(food);
  for (const mod of modifiers) {
    const count = selectedModifiers[mod.id] || 0;
    if (count > 0) {
      totalKcal += mod.calories * count;
      totalP += (mod.proteinGrams || 0) * count;
      totalC += (mod.carbGrams || 0) * count;
      totalF += (mod.fatGrams || 0) * count;
    }
  }

  return {
    calories: Math.max(0, Math.round(totalKcal)),
    protein: Math.max(0, Math.round(totalP)),
    carbs: Math.max(0, Math.round(totalC)),
    fat: Math.max(0, Math.round(totalF)),
  };
}

const MEAL_SLOT_OPTIONS: { id: MealSlot; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snacks_chai', label: 'Snacks & Chai' },
];

export const ItemCustomizerModal: React.FC<ItemCustomizerModalProps> = ({
  visible,
  item,
  initialMealSlot = 'lunch',
  onBack,
  onClose,
  onLogItem,
  onConfirmCustomizedLog,
}) => {
  const { theme, isDark } = useTheme();
  const handleClose = onBack || onClose || (() => {});
  const handleLog = onLogItem || onConfirmCustomizedLog || (() => {});
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, number>>({});
  const [selectedSlot, setSelectedSlot] = useState<MealSlot>(initialMealSlot);
  const [selectedServingIdx, setSelectedServingIdx] = useState<number>(0);
  const [isCustomWeightMode, setIsCustomWeightMode] = useState<boolean>(false);
  const [customGrams, setCustomGrams] = useState<number>(200);

  // Reset state on new item or visibility change
  useEffect(() => {
    if (visible && item) {
      setQuantity(1);
      setSelectedModifiers({});
      setSelectedServingIdx(0);
      setIsCustomWeightMode(false);
      const defaultServing = item.servings?.[0];
      const initialG = defaultServing?.servingWeightGrams || defaultServing?.grams || 100;
      setCustomGrams(initialG);
    }
  }, [visible, item]);

  const activeModifiers = useMemo(() => {
    if (!item) return [];
    return getEffectiveModifiers(item);
  }, [item]);

  const activeServing = useMemo(() => {
    if (!item || !item.servings || item.servings.length === 0) return null;
    return item.servings[selectedServingIdx] || item.servings[0];
  }, [item, selectedServingIdx]);

  // Recalculate totals live
  const macros: CalculatedMacros = useMemo(() => {
    if (!item) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return calculateCustomizedMacros(
      item,
      quantity,
      selectedModifiers,
      isCustomWeightMode ? customGrams : null,
      selectedServingIdx,
      activeModifiers
    );
  }, [item, quantity, selectedModifiers, isCustomWeightMode, customGrams, selectedServingIdx, activeModifiers]);

  // Determine portion summary text for HOW MANY? section
  const portionSummaryText = useMemo(() => {
    if (isCustomWeightMode) {
      return `${quantity * customGrams}g total (${quantity}x ${customGrams}g)`;
    }
    if (activeServing) {
      const label = activeServing.label || activeServing.description || 'portion';
      if (quantity === 1) {
        return `${label} · ${activeServing.grams}g`;
      }
      return `${quantity}x ${label} · ${quantity * activeServing.grams}g`;
    }
    return `${quantity} standard serving`;
  }, [isCustomWeightMode, customGrams, activeServing, quantity]);

  if (!visible || !item) return null;

  const handleUpdateModifier = (modifierId: string, delta: number) => {
    setSelectedModifiers((prev) => {
      const current = prev[modifierId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[modifierId];
        return copy;
      }
      return { ...prev, [modifierId]: next };
    });
  };

  const handleAdjustGrams = (delta: number) => {
    setCustomGrams((prev) => Math.max(20, Math.min(1500, prev + delta)));
  };

  const handleConfirmLog = () => {
    const servingDesc = isCustomWeightMode
      ? `${customGrams}g custom portion`
      : activeServing?.description || activeServing?.label || 'serving';

    handleLog({
      food: item,
      quantity,
      selectedModifiers,
      totalCalories: macros.calories,
      totalProtein: macros.protein,
      totalCarbs: macros.carbs,
      totalFat: macros.fat,
      mealSlot: selectedSlot,
      portionDescription: servingDesc,
      actualGrams: isCustomWeightMode ? customGrams * quantity : (activeServing?.grams || 100) * quantity,
    });
  };

  const servingsList: FoodServingItem[] = item.servings || [];
  const brandName = (item.brand || 'PAKISTANI DISH').toUpperCase();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.canvas }]}>
        {/* Scrollable Content Container */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Navigation: Back Arrow */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleClose}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Icon name="arrow-left" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          {/* Dish Brand & Title */}
          <Text style={[styles.brandText, { color: theme.colors.textMuted }]}>{brandName}</Text>
          <Text style={[styles.dishTitle, { color: theme.colors.text }]}>{item.name}</Text>

          {/* Estimated Badge */}
          <View style={styles.estimatedBadgeContainer}>
            <View style={[styles.estimatedBadge, { borderColor: isDark ? '#272A33' : '#E2E8F0', backgroundColor: isDark ? '#18191E' : '#F1F5F9' }]}>
              <Text style={[styles.estimatedBadgeText, { color: isDark ? '#94A3B8' : '#64748B' }]}>≈ ESTIMATED</Text>
            </View>
          </View>

          {/* Estimate Disclaimer Subtitle */}
          <Text style={[styles.estimateDisclaimer, { color: theme.colors.textMuted }]}>
            Estimate — actual can vary ~±15% with kitchen and portion
          </Text>

          {/* HOW MANY? Row */}
          <View style={[styles.howManyCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.howManyLeft}>
              <Text style={[styles.howManyLabel, { color: theme.colors.textMuted }]}>HOW MANY?</Text>
              <Text style={[styles.howManySub, { color: theme.colors.text }]} numberOfLines={1}>
                {portionSummaryText}
              </Text>
            </View>

            <View style={styles.peachStepperContainer}>
              <TouchableOpacity
                style={[
                  styles.peachCircleButton,
                  { backgroundColor: isDark ? '#272A33' : '#F1F5F9' },
                  quantity <= 1 && styles.peachCircleButtonDisabled,
                ]}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                activeOpacity={0.7}
                accessibilityLabel="Decrease quantity"
              >
                <Icon
                  name="minus"
                  size={18}
                  color={quantity <= 1 ? (isDark ? '#4B5563' : '#CBD5E1') : theme.colors.text}
                  strokeWidth={2.5}
                />
              </TouchableOpacity>

              <Text style={[styles.stepperNumber, { color: theme.colors.text }]}>{quantity}</Text>

              <TouchableOpacity
                style={[styles.peachCircleButton, { backgroundColor: isDark ? '#272A33' : '#F1F5F9' }]}
                onPress={() => setQuantity((q) => q + 1)}
                activeOpacity={0.7}
                accessibilityLabel="Increase quantity"
              >
                <Icon name="plus" size={18} color={theme.colors.text} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Portion Size & Custom Grams Customizer */}
          <View style={[styles.portionControlCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.portionHeaderRow}>
              <Text style={[styles.portionSectionTitle, { color: theme.colors.textMuted }]}>PORTION SIZE</Text>
              <TouchableOpacity
                onPress={() => setIsCustomWeightMode((prev) => !prev)}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleCustomGramsText, { color: isDark ? '#A4EB3F' : '#16A34A' }]}>
                  {isCustomWeightMode ? '✓ Standard Servings' : '⚖ Custom Weight (g)'}
                </Text>
              </TouchableOpacity>
            </View>

            {!isCustomWeightMode ? (
              /* Servings Pills */
              <View style={styles.servingsPillRow}>
                {servingsList.map((srv, idx) => {
                  const isSelected = selectedServingIdx === idx;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.servingPill,
                        { backgroundColor: isDark ? '#1C1D24' : '#F8FAFC', borderColor: theme.colors.border },
                        isSelected && styles.servingPillActive,
                      ]}
                      onPress={() => setSelectedServingIdx(idx)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.servingPillText,
                          { color: theme.colors.textMuted },
                          isSelected && styles.servingPillTextActive,
                        ]}
                      >
                        {srv.label || srv.description}
                      </Text>
                      <Text
                        style={[
                          styles.servingPillGrams,
                          { color: theme.colors.textMuted },
                          isSelected && styles.servingPillGramsActive,
                        ]}
                      >
                        {srv.grams}g
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              /* Custom Grams Weight Stepper */
              <View style={[styles.customGramsBox, { backgroundColor: isDark ? '#14151A' : '#F8FAFC', borderColor: theme.colors.border }]}>
                <Text style={[styles.customGramsPrompt, { color: theme.colors.textMuted }]}>
                  Eaten more or less than standard size? Adjust actual weight:
                </Text>

                <View style={styles.gramsAdjustRow}>
                  <TouchableOpacity
                    style={[styles.gramChip, { backgroundColor: isDark ? '#272A33' : '#E2E8F0' }]}
                    onPress={() => handleAdjustGrams(-50)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.gramChipText, { color: theme.colors.text }]}>-50g</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.gramChip, { backgroundColor: isDark ? '#272A33' : '#E2E8F0' }]}
                    onPress={() => handleAdjustGrams(-10)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.gramChipText, { color: theme.colors.text }]}>-10g</Text>
                  </TouchableOpacity>

                  <View style={[styles.gramDisplayBadge, { backgroundColor: isDark ? '#1F2410' : '#F4FCE3', borderColor: '#A4EB3F' }]}>
                    <Text style={[styles.gramDisplayNumber, { color: isDark ? '#A4EB3F' : '#1C1917' }]}>{customGrams}</Text>
                    <Text style={[styles.gramDisplayUnit, { color: isDark ? '#A4EB3F' : '#4D7C0F' }]}>grams</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.gramChip, { backgroundColor: isDark ? '#272A33' : '#E2E8F0' }]}
                    onPress={() => handleAdjustGrams(10)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.gramChipText, { color: theme.colors.text }]}>+10g</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.gramChip, { backgroundColor: isDark ? '#272A33' : '#E2E8F0' }]}
                    onPress={() => handleAdjustGrams(50)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.gramChipText, { color: theme.colors.text }]}>+50g</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* "Make it yours" Section */}
          {activeModifiers.length > 0 && (
            <View style={styles.makeItYoursSection} testID="make-it-yours-section">
              <Text style={[styles.makeItYoursTitle, { color: theme.colors.text }]}>Make it yours</Text>
              <Text style={[styles.makeItYoursSubtitle, { color: theme.colors.textMuted }]}>
                Add or remove — the number follows your real order.
              </Text>

              {/* Modifiers List in Clean Card */}
              <View style={[styles.modifiersContainerCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                {activeModifiers.map((mod: FoodModifier, idx: number) => {
                  const count = selectedModifiers[mod.id] || 0;
                  const sign = mod.calories >= 0 ? '+' : '';
                  const isLast = idx === activeModifiers.length - 1;

                  return (
                    <View
                      key={mod.id}
                      style={[
                        styles.modifierItemRow,
                        !isLast && [styles.modifierItemDivider, { borderBottomColor: theme.colors.border }],
                      ]}
                    >
                      <View style={styles.modifierLeftInfo}>
                        <Text style={[styles.modifierItemTitle, { color: theme.colors.text }]}>{mod.name}</Text>
                        <Text style={[styles.modifierItemKcal, { color: theme.colors.textMuted }]}>
                          {sign}{mod.calories} kcal each
                        </Text>
                      </View>

                      <View style={styles.peachStepperContainer}>
                        <TouchableOpacity
                          style={[
                            styles.peachCircleButtonSmall,
                            { backgroundColor: isDark ? '#272A33' : '#F1F5F9' },
                            count === 0 && styles.peachCircleButtonDisabled,
                          ]}
                          onPress={() => handleUpdateModifier(mod.id, -1)}
                          disabled={count === 0}
                          activeOpacity={0.7}
                          accessibilityLabel={`Remove ${mod.name}`}
                        >
                          <Icon
                            name="minus"
                            size={16}
                            color={count === 0 ? (isDark ? '#4B5563' : '#CBD5E1') : theme.colors.text}
                            strokeWidth={2.5}
                          />
                        </TouchableOpacity>

                        <Text style={[styles.stepperNumberSmall, { color: theme.colors.text }]}>{count}</Text>

                        <TouchableOpacity
                          style={[styles.peachCircleButtonSmall, { backgroundColor: isDark ? '#272A33' : '#F1F5F9' }]}
                          onPress={() => handleUpdateModifier(mod.id, 1)}
                          activeOpacity={0.7}
                          accessibilityLabel={`Add ${mod.name}`}
                        >
                          <Icon name="plus" size={16} color={theme.colors.text} strokeWidth={2.5} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Meal Slot Selection */}
          <View style={styles.slotSelectionSection}>
            <Text style={[styles.slotSectionTitle, { color: theme.colors.textMuted }]}>LOG TO MEAL SLOT</Text>
            <View style={styles.slotPillContainer}>
              {MEAL_SLOT_OPTIONS.map((slot) => {
                const isSelected = selectedSlot === slot.id;
                return (
                  <TouchableOpacity
                    key={slot.id}
                    style={[
                      styles.slotPill,
                      { backgroundColor: isDark ? '#1C1D24' : '#FFFFFF', borderColor: theme.colors.border },
                      isSelected && styles.slotPillActive,
                    ]}
                    onPress={() => setSelectedSlot(slot.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.slotPillText,
                        { color: theme.colors.textMuted },
                        isSelected && styles.slotPillTextActive,
                      ]}
                    >
                      {slot.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Sticky Bottom Bar */}
        <View style={[styles.bottomStickyBar, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
          <View style={styles.bottomTotalsLeft}>
            <View style={styles.calorieRow}>
              <Text style={[styles.totalCalorieNumber, { color: theme.colors.text }]}>≈{macros.calories}</Text>
              <Text style={[styles.totalCalorieUnit, { color: theme.colors.text }]}>kcal</Text>
            </View>
            <Text style={[styles.totalMacroBreakdown, { color: theme.colors.textMuted }]}>
              P {macros.protein}g · C {macros.carbs}g · F {macros.fat}g
            </Text>
          </View>

          <TouchableOpacity
            style={styles.logThisButton}
            onPress={handleConfirmLog}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Log this meal"
          >
            <Text style={styles.logThisButtonText}>Log this</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 28,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginLeft: -4,
  },
  brandText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#78716C',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  dishTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.6,
    lineHeight: 38,
    marginBottom: 10,
  },
  estimatedBadgeContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  estimatedBadge: {
    borderWidth: 1,
    borderColor: '#D6D3D1',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'transparent',
  },
  estimatedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#57534E',
    letterSpacing: 0.5,
  },
  estimateDisclaimer: {
    fontSize: 14,
    color: '#78716C',
    lineHeight: 20,
    marginBottom: 24,
  },
  howManyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 20,
  },
  howManyLeft: {
    flex: 1,
    marginRight: 16,
  },
  howManyLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#78716C',
    letterSpacing: 0.5,
  },
  howManySub: {
    fontSize: 13,
    color: '#A8A29E',
    marginTop: 3,
    fontWeight: '500',
  },
  peachStepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  peachCircleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  peachCircleButtonSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  peachCircleButtonDisabled: {
    backgroundColor: '#FFF7ED',
    opacity: 0.6,
  },
  stepperNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1917',
    minWidth: 24,
    textAlign: 'center',
  },
  stepperNumberSmall: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1917',
    minWidth: 20,
    textAlign: 'center',
  },
  portionControlCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: '#F5F5F4',
  },
  portionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  portionSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78716C',
    letterSpacing: 0.6,
  },
  toggleCustomGramsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
  },
  servingsPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  servingPill: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  servingPillActive: {
    backgroundColor: '#A4EB3F',
    borderColor: '#A4EB3F',
  },
  servingPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#44403C',
  },
  servingPillTextActive: {
    color: '#0A0B0D',
    fontWeight: '800',
  },
  servingPillGrams: {
    fontSize: 11,
    color: '#78716C',
    marginTop: 2,
  },
  servingPillGramsActive: {
    color: '#0A0B0D',
    fontWeight: '700',
  },
  customGramsBox: {
    paddingTop: 4,
  },
  customGramsPrompt: {
    fontSize: 13,
    color: '#78716C',
    marginBottom: 12,
  },
  gramsAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gramChip: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  gramChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#44403C',
  },
  gramDisplayBadge: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  gramDisplayNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1917',
  },
  gramDisplayUnit: {
    fontSize: 11,
    color: '#78716C',
    fontWeight: '600',
  },
  makeItYoursSection: {
    marginBottom: 24,
  },
  makeItYoursTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  makeItYoursSubtitle: {
    fontSize: 14,
    color: '#78716C',
    marginBottom: 14,
    lineHeight: 20,
  },
  modifiersContainerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F5F5F4',
    overflow: 'hidden',
  },
  modifierItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  modifierItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F4',
  },
  modifierLeftInfo: {
    flex: 1,
    marginRight: 12,
  },
  modifierItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 3,
  },
  modifierItemKcal: {
    fontSize: 13,
    color: '#78716C',
    fontWeight: '500',
  },
  slotSelectionSection: {
    marginBottom: 16,
  },
  slotSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78716C',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  slotPillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  slotPillActive: {
    backgroundColor: '#A4EB3F',
    borderColor: '#A4EB3F',
  },
  slotPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#57534E',
  },
  slotPillTextActive: {
    color: '#0A0B0D',
    fontWeight: '800',
  },
  bottomStickyBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F4',
    paddingHorizontal: 22,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomTotalsLeft: {
    flex: 1,
    marginRight: 16,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  totalCalorieNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.5,
  },
  totalCalorieUnit: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
    marginLeft: 4,
  },
  totalMacroBreakdown: {
    fontSize: 13,
    fontWeight: '600',
    color: '#78716C',
    marginTop: 2,
  },
  logThisButton: {
    backgroundColor: '#A4EB3F',
    paddingHorizontal: 32,
    paddingVertical: 15,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logThisButtonText: {
    color: '#0A0B0D',
    fontSize: 16,
    fontWeight: '800',
  },
});
