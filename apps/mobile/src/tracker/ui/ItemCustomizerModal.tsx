import React, { useState, useMemo, useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '../../ui/BackButton.js';
import { NamedModal } from '../../ui/NamedModal.js';
import type { NormalizedFood, FoodModifier } from '@nutrio/food-db';
import { foodDb } from '../../catalogue/index.js';
import { MealSlot } from '../types.js';
import { useTheme } from '../../theme.js';
import { Icon } from '../../ui/Icon.js';
import { useRegion } from '../../common/region/index.js';
import { useTranslation, useTextDirection, useI18nState } from '../../i18n/index.js';
import { brandDisplayName, pickText } from '../../i18n/displayName.js';
import { HapticFeedback } from '../../ui/haptics.js';
import {
  clearPersonalServing,
  getPersonalServing,
  LabelledServing,
  MAX_PORTION_GRAMS,
  MIN_PORTION_GRAMS,
  parseGramsInput,
  savePersonalServing,
  withPersonalServing,
} from '../personalServings.js';
import { foodKey } from './useMealBasket.js';
import { servingDisplayLabel } from '../servingLabel.js';
import { PortionPicker } from './PortionPicker.js';
import { DishThumb } from './DishThumb.js';
import { createStyles } from './ItemCustomizerModal.styles.js';

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
  return foodDb().getDishCustomizationModifiers(food);
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
  const styles = useMemo(() => createStyles(theme.colors), [theme]);
  const { activeRegion } = useRegion();
  const { t } = useTranslation();
  const { language } = useI18nState();
  const dir = useTextDirection();
  const isSaudi = activeRegion === 'SA';

  const handleClose = onBack || onClose || (() => {});
  const handleLog = onLogItem || onConfirmCustomizedLog || (() => {});
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, number>>({});
  const [selectedSlot, setSelectedSlot] = useState<MealSlot>(initialMealSlot);
  const slotLabel = t(`tracker.mealSlots.${selectedSlot}.${activeRegion}`);
  const [selectedServingIdx, setSelectedServingIdx] = useState<number>(0);
  const [isCustomWeightMode, setIsCustomWeightMode] = useState<boolean>(false);
  const [customGrams, setCustomGrams] = useState<number>(200);
  /** The grams field as typed; `customGrams` only takes it when it parses. */
  const [gramsText, setGramsText] = useState<string>('200');
  /** Bumped when the saved serving changes, to re-read it. */
  const [personalVersion, setPersonalVersion] = useState(0);

  /** The item with this user's saved standard serving, if any, as its default. */
  const servingItem = useMemo(() => {
    if (!item) return null;
    return withPersonalServing(item, getPersonalServing(foodKey(item)), t('tracker.customizer.myServing'));
    // personalVersion re-reads the store after a save or reset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, personalVersion, t]);

  const gramsValid = parseGramsInput(gramsText) !== null;

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
      const defaultServing = withPersonalServing(item, getPersonalServing(foodKey(item)), '').servings[0];
      const initialG = defaultServing?.servingWeightGrams || defaultServing?.grams || 100;
      setCustomGrams(initialG);
      setGramsText(String(initialG));
    }
  }, [visible, item, initialMealSlot]);

  const activeModifiers = useMemo(() => {
    if (!item) return [];
    return getEffectiveModifiers(item);
  }, [item]);

  const activeServing = useMemo(() => {
    if (!servingItem || servingItem.servings.length === 0) return null;
    return servingItem.servings[selectedServingIdx] || servingItem.servings[0];
  }, [servingItem, selectedServingIdx]);

  // A typed weight is the whole portion, so the count does not multiply it.
  const effectiveQuantity = isCustomWeightMode ? 1 : quantity;

  // Recalculate totals live
  const macros: CalculatedMacros = useMemo(() => {
    if (!servingItem) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return calculateCustomizedMacros(
      servingItem,
      effectiveQuantity,
      selectedModifiers,
      isCustomWeightMode ? customGrams : null,
      selectedServingIdx,
      activeModifiers
    );
  }, [servingItem, effectiveQuantity, selectedModifiers, isCustomWeightMode, customGrams, selectedServingIdx, activeModifiers]);

  // Determine portion summary text for HOW MANY? section
  const portionSummaryText = useMemo(() => {
    // The typed weight is on its own field below.
    if (isCustomWeightMode) return null;
    if (activeServing) {
      const label = servingDisplayLabel(activeServing.label || activeServing.description || t('common.portion'), language);
      // One serving is already on its pill below; only a multiple needs a total.
      if (quantity === 1) return null;
      return `${quantity}x ${label} · ${t('common.gramsValue', { value: quantity * activeServing.grams })}`;
    }
    return t('common.standardServing', { count: quantity });
  }, [isCustomWeightMode, activeServing, quantity, t, language]);

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

  const setGrams = (grams: number) => {
    setCustomGrams(grams);
    setGramsText(String(grams));
  };

  const handleAdjustGrams = (delta: number) => {
    HapticFeedback.impactLight();
    // Steps start from the last valid weight, so a half-typed field still steps sensibly.
    const base = parseGramsInput(gramsText) ?? customGrams;
    setGrams(Math.round(Math.max(MIN_PORTION_GRAMS, Math.min(MAX_PORTION_GRAMS, base + delta)) * 10) / 10);
  };

  const handleGramsTextChange = (text: string) => {
    setGramsText(text);
    const grams = parseGramsInput(text);
    if (grams !== null) setCustomGrams(grams);
  };

  const handleSaveAsMine = () => {
    const grams = parseGramsInput(gramsText);
    if (grams === null || !savePersonalServing(foodKey(item), grams)) return;
    HapticFeedback.notificationSuccess();
    setPersonalVersion((v) => v + 1);
    setSelectedServingIdx(0);
    setIsCustomWeightMode(false);
  };

  const handleResetMine = () => {
    HapticFeedback.selection();
    clearPersonalServing(foodKey(item));
    setPersonalVersion((v) => v + 1);
    setSelectedServingIdx(0);
  };

  // Entering custom weight starts from the portion already chosen (2 roti → 90g),
  // so the user corrects it rather than typing it from scratch.
  const handleToggleCustomWeight = () => {
    if (!isCustomWeightMode) setGrams((activeServing?.grams || 100) * quantity);
    setIsCustomWeightMode((prev) => !prev);
  };

  const canLog = !isCustomWeightMode || gramsValid;

  const handleConfirmLog = () => {
    if (!canLog) return;
    HapticFeedback.impactMedium();
    const servingDesc = isCustomWeightMode
      ? t('tracker.customizer.customPortion', { grams: customGrams })
      : activeServing?.description || activeServing?.label || 'serving';

    handleLog({
      food: item,
      quantity: effectiveQuantity,
      selectedModifiers,
      totalCalories: macros.calories,
      totalProtein: macros.protein,
      totalCarbs: macros.carbs,
      totalFat: macros.fat,
      mealSlot: selectedSlot,
      portionDescription: servingDesc,
      actualGrams: isCustomWeightMode ? customGrams : (activeServing?.grams || 100) * quantity,
    });
  };

  const servingsList: LabelledServing[] = servingItem?.servings ?? [];
  const fallbackBrand = t(`tracker.customizer.fallbackBrand.${activeRegion}`);
  const brandName = brandDisplayName(item.brand || fallbackBrand, language).toUpperCase();

  return (
    <NamedModal accessibilityName={t('a11y.dialog.customizeItem')}
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
          <BackButton variant="icon" onPress={handleClose} style={styles.backButton} />

          {/* Dish Brand & Title */}
          <DishThumb category={item.brandCategory || item.category} size={96} style={styles.dishThumb} />
          <Text style={[styles.brandText, { color: theme.colors.textMuted }]}>{brandName}</Text>
          <Text style={[styles.dishTitle, dir.text, { color: theme.colors.text }]}>
            {pickText(item.name, item.nameAr, language)}
          </Text>

          {/* Estimate Disclaimer Subtitle */}
          <Text style={[styles.estimateDisclaimer, { color: theme.colors.textMuted }]}>
            {t('tracker.customizer.estimateNote')}
          </Text>

          {/* HOW MANY? Row */}
          {/* One card: how many, then which portion (or an exact weight) */}
          <View style={[styles.howManyCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.howManyRow}>
            <View style={styles.howManyLeft}>
              <Text style={[styles.howManyLabel, { color: theme.colors.textMuted }]}>{t('tracker.customizer.howMany')}</Text>
              {portionSummaryText && (
                <Text style={[styles.howManySub, { color: theme.colors.text }]}>
                  {portionSummaryText}
                </Text>
              )}
            </View>

            {!isCustomWeightMode && (
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
                accessibilityRole="button"
                accessibilityState={{ disabled: quantity <= 1 }}
                accessibilityLabel={t('tracker.customizer.decreaseQty')}
              >
                <Icon
                  name="minus"
                  size={18}
                  color={quantity <= 1 ? (isDark ? '#4B5563' : '#CBD5E1') : theme.colors.text}
                  strokeWidth={2.5}
                />
              </TouchableOpacity>

              <Text
                style={[styles.stepperNumber, { color: theme.colors.text }]}
                accessibilityLiveRegion="polite"
              >
                {quantity}
              </Text>

              <TouchableOpacity
                style={[styles.peachCircleButton, { backgroundColor: isDark ? '#272A33' : '#F1F5F9' }]}
                onPress={() => {
                  HapticFeedback.impactLight();
                  setQuantity((q) => q + 1);
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('tracker.customizer.increaseQty')}
              >
                <Icon name="plus" size={18} color={theme.colors.text} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
            )}
          </View>

          <PortionPicker
            embedded
            servings={servingsList}
            selectedIndex={selectedServingIdx}
            onSelectServing={setSelectedServingIdx}
            isCustomWeight={isCustomWeightMode}
            onToggleCustomWeight={handleToggleCustomWeight}
            gramsText={gramsText}
            gramsValid={gramsValid}
            onGramsTextChange={handleGramsTextChange}
            onAdjustGrams={handleAdjustGrams}
            onSaveAsMine={handleSaveAsMine}
            onResetMine={handleResetMine}
          />
          </View>

          {/* "Make it yours" Section */}
          {activeModifiers.length > 0 && (
            <View style={styles.makeItYoursSection} testID="make-it-yours-section">
              <Text style={[styles.makeItYoursTitle, dir.text, { color: theme.colors.text }]}>
                {t('tracker.customizer.makeItYours')}
              </Text>
              <Text style={[styles.makeItYoursSubtitle, dir.text, { color: theme.colors.textMuted }]}>
                {t('tracker.customizer.makeItYoursSubtitle')}
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
                        <Text style={[styles.modifierItemTitle, dir.text, { color: theme.colors.text }]}>{pickText(mod.name, mod.nameAr, language)}</Text>
                        <Text style={[styles.modifierItemKcal, dir.text, { color: theme.colors.textMuted }]}>
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
                          accessibilityRole="button"
                          accessibilityState={{ disabled: count === 0 }}
                          accessibilityLabel={t('tracker.customizer.removeModifier', { name: pickText(mod.name, mod.nameAr, language) })}
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
                          accessibilityRole="button"
                          accessibilityLabel={t('tracker.customizer.addModifier', { name: pickText(mod.name, mod.nameAr, language) })}
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
        </ScrollView>

        {/* Sticky Bottom Bar */}
        <View style={[styles.bottomStickyBar, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
          <View style={styles.bottomTotalsLeft}>
            <View style={styles.calorieRow}>
              <Text style={[styles.totalCalorieNumber, { color: theme.colors.text }]}>{canLog ? `≈${macros.calories}` : '—'}</Text>
              <Text style={[styles.totalCalorieUnit, { color: theme.colors.text }]}>
                {t('common.kcal')}
              </Text>
            </View>
            <Text style={[styles.totalMacroBreakdown, { color: theme.colors.textMuted }]}>
              {canLog ? t('common.macroLine', { protein: macros.protein, carbs: macros.carbs, fat: macros.fat }) : '—'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.logThisButton, !canLog && styles.saveMineButtonDisabled]}
            onPress={handleConfirmLog}
            disabled={!canLog}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canLog }}
            accessibilityLabel={t('tracker.customizer.logToMeal', { meal: slotLabel })}
          >
            <Text style={styles.logThisButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {t('tracker.customizer.logToMeal', { meal: slotLabel })}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </NamedModal>
  );
};
