import React, { useState, useMemo, useEffect } from 'react';
import {
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
import { useRegion } from '../../common/region/index.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { HapticFeedback } from '../../ui/haptics.js';
import { styles } from './ItemCustomizerModal.styles.js';

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
  const { activeRegion } = useRegion();
  const { t } = useTranslation();
  const dir = useTextDirection();
  const isSaudi = activeRegion === 'SA';

  const mealSlots: { id: MealSlot; label: string }[] = useMemo(
    () =>
      (['breakfast', 'lunch', 'dinner', 'snacks_chai'] as MealSlot[]).map((id) => ({
        id,
        label: t(`tracker.mealSlots.${id}.${activeRegion}`),
      })),
    [t, activeRegion]
  );

  const handleClose = onBack || onClose || (() => {});
  const handleLog = onLogItem || onConfirmCustomizedLog || (() => {});
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, number>>({});
  const [selectedSlot, setSelectedSlot] = useState<MealSlot>(initialMealSlot);
  const [selectedServingIdx, setSelectedServingIdx] = useState<number>(0);
  const [isCustomWeightMode, setIsCustomWeightMode] = useState<boolean>(false);
  const [customGrams, setCustomGrams] = useState<number>(200);

  // Reset state on new item or visibility change. This modal stays mounted
  // for the dashboard's whole lifetime (only `visible` toggles), so
  // `useState(initialMealSlot)` above only ever runs once — without this,
  // every log would silently land in whatever slot was active on first mount.
  useEffect(() => {
    if (visible && item) {
      setQuantity(1);
      setSelectedModifiers({});
      setSelectedServingIdx(0);
      setIsCustomWeightMode(false);
      setSelectedSlot(initialMealSlot);
      const defaultServing = item.servings?.[0];
      const initialG = defaultServing?.servingWeightGrams || defaultServing?.grams || 100;
      setCustomGrams(initialG);
    }
  }, [visible, item, initialMealSlot]);

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
    HapticFeedback.impactLight();
    setCustomGrams((prev) => Math.max(20, Math.min(1500, prev + delta)));
  };

  const handleConfirmLog = () => {
    HapticFeedback.impactMedium();
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
  const fallbackBrand = t(`tracker.customizer.fallbackBrand.${activeRegion}`);
  const brandName = (item.brand || fallbackBrand).toUpperCase();

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
            accessibilityLabel={t('common.back')}
          >
            <Icon name="arrow-left" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          {/* Dish Brand & Title */}
          <Text style={[styles.brandText, { color: theme.colors.textMuted }]}>{brandName}</Text>
          <Text style={[styles.dishTitle, dir.text, { color: theme.colors.text }]}>
            {dir.isRTL && item.nameAr ? item.nameAr : item.name}
          </Text>

          {/* Estimated Badge */}
          <View style={styles.estimatedBadgeContainer}>
            <View style={[styles.estimatedBadge, { borderColor: isDark ? '#272A33' : '#E2E8F0', backgroundColor: isDark ? '#18191E' : '#F1F5F9' }]}>
              <Text style={[styles.estimatedBadgeText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                ≈ {t('tracker.customizer.estimated')}
              </Text>
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
                onPress={() => {
                  HapticFeedback.impactLight();
                  setQuantity((q) => Math.max(1, q - 1));
                }}
                disabled={quantity <= 1}
                activeOpacity={0.7}
                accessibilityLabel={t('tracker.customizer.decreaseQty')}
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
                onPress={() => {
                  HapticFeedback.impactLight();
                  setQuantity((q) => q + 1);
                }}
                activeOpacity={0.7}
                accessibilityLabel={t('tracker.customizer.increaseQty')}
              >
                <Icon name="plus" size={18} color={theme.colors.text} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Portion Size & Custom Grams Customizer */}
          <View style={[styles.portionControlCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.portionHeaderRow}>
              <Text style={[styles.portionSectionTitle, dir.text, { color: theme.colors.textMuted }]}>
                {t('tracker.customizer.portionSize')}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  HapticFeedback.selection();
                  setIsCustomWeightMode((prev) => !prev);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleCustomGramsText, { color: isDark ? '#A4EB3F' : '#16A34A' }]}>
                  {isCustomWeightMode
                    ? `${t('tracker.customizer.standardServings')}`
                    : `${t('tracker.customizer.customWeight')}`}
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
                      onPress={() => {
                        HapticFeedback.selection();
                        setSelectedServingIdx(idx);
                      }}
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
              /* Custom Weight Gram Stepper */
              <View style={styles.customGramsBox}>
                <Text style={[styles.customGramsPrompt, { color: theme.colors.textMuted }]}>
                  {t('tracker.customizer.customWeightHint')}
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

                  {/* Centered Gram Display Box */}
                  <View
                    style={[
                      styles.gramDisplayBadge,
                      {
                        backgroundColor: isDark ? '#1F2410' : '#F4FCE3',
                        borderColor: '#A4EB3F',
                        borderRadius: 12,
                        paddingVertical: 6,
                        paddingHorizontal: 16,
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.gramDisplayNumber,
                        {
                          color: isDark ? '#A4EB3F' : '#1C1917',
                        },
                      ]}
                    >
                      {customGrams}
                    </Text>
                    <Text
                      style={[
                        styles.gramDisplayUnit,
                        {
                          color: isDark ? '#A4EB3F' : '#4D7C0F',
                        },
                      ]}
                    >
                      grams
                    </Text>
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
              <Text style={[styles.makeItYoursTitle, dir.text, { color: theme.colors.text }]}>
                {t('tracker.customizer.makeItYours')}
              </Text>
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
                          {sign}{t('tracker.customizer.kcalEach', { value: mod.calories })}
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
                          accessibilityLabel={t('tracker.customizer.removeModifier', { name: mod.name })}
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
                          accessibilityLabel={t('tracker.customizer.addModifier', { name: mod.name })}
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
            <Text style={[styles.slotSectionTitle, dir.text, { color: theme.colors.textMuted }]}>
              {t('tracker.customizer.logToSlot')}
            </Text>
            <View style={styles.slotPillContainer}>
              {mealSlots.map((slot) => {
                const isSelected = selectedSlot === slot.id;
                return (
                  <TouchableOpacity
                    key={slot.id}
                    style={[
                      styles.slotPill,
                      { backgroundColor: isDark ? '#1C1D24' : '#FFFFFF', borderColor: theme.colors.border },
                      isSelected && styles.slotPillActive,
                    ]}
                    onPress={() => {
                      HapticFeedback.selection();
                      setSelectedSlot(slot.id);
                    }}
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
              <Text style={[styles.totalCalorieUnit, { color: theme.colors.text }]}>
                {t('common.kcal')}
              </Text>
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
            accessibilityLabel={t('tracker.customizer.logThis')}
          >
            <Text style={styles.logThisButtonText}>
              {t('tracker.customizer.logThis')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};
