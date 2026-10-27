import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LoggedItem, MealSlot } from '../types.js';
import { MEAL_SLOTS, mealSegments } from '../mealsCard.js';
import { foodDisplayName } from '../foodDisplayName.js';
import { formatServingLine } from '../formatServing.js';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';
import { useTranslation, useTextDirection, useI18nState } from '../../i18n/index.js';
import { useFormat } from '../../i18n/useFormat.js';
import { Icon, IconName } from '../../ui/Icon.js';
import { HapticFeedback } from '../../ui/haptics.js';

interface TodayMealsCardProps {
  /** The day's logged items, any order. */
  items: readonly LoggedItem[];
  targetCalories: number;
  /** The slot to tag "Next", when there is one. */
  nextSlot: MealSlot | null;
  onAddItem: (slot: MealSlot) => void;
  onDeleteItem: (id: string) => void;
  onOpenMealPlan?: () => void;
}

const SLOT_ICON: Record<MealSlot, IconName> = {
  breakfast: 'sun',
  lunch: 'utensils',
  dinner: 'utensils',
  snacks_chai: 'coffee',
};

/**
 * Today's meals as one card: a "calories by meal" bar on top, then a row per
 * meal. A row with food expands to its dishes (with delete); an empty row
 * opens the add flow. The plus on every row always adds to that meal.
 */
export const TodayMealsCard: React.FC<TodayMealsCardProps> = ({
  items,
  targetCalories,
  nextSlot,
  onAddItem,
  onDeleteItem,
  onOpenMealPlan,
}) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { activeRegion } = useRegion();
  const { t } = useTranslation();
  const { formatNumber } = useFormat();
  const dir = useTextDirection();
  const { language } = useI18nState();
  const [openSlot, setOpenSlot] = useState<MealSlot | null>(null);

  // One colour per meal, shared by the bar segment and the row icon.
  const slotColor: Record<MealSlot, string> = {
    breakfast: c.warning,
    lunch: c.primaryDark,
    dinner: c.protein,
    snacks_chai: c.fatText,
  };
  const iconColor: Record<MealSlot, string> = { ...slotColor, lunch: c.primaryAccessible };

  const bySlot = (slot: MealSlot) => items.filter((item) => item.mealSlot === slot);
  const kcalBySlot = Object.fromEntries(
    MEAL_SLOTS.map((slot) => [slot, bySlot(slot).reduce((sum, item) => sum + item.calories, 0)])
  ) as Record<MealSlot, number>;
  const eaten = MEAL_SLOTS.reduce((sum, slot) => sum + kcalBySlot[slot], 0);
  const segments = mealSegments(kcalBySlot, targetCalories);
  const chevron = dir.isRTL ? 'chevron-left' : 'chevron-right';

  return (
    <View>
      <View style={styles.sectionHead}>
        <Text role="heading" aria-level={2} style={[styles.heading, dir.text, { color: c.textPrimary }]}>
          {t('tracker.dashboard.todaysMeals')}
        </Text>
        {onOpenMealPlan && (
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            onPress={onOpenMealPlan}
            style={styles.link}
          >
            <Text style={[styles.linkText, { color: c.primaryAccessible }]}>{t('tracker.mealsCard.mealPlan')}</Text>
            <Icon name={chevron} size={14} color={c.primaryAccessible} strokeWidth={2.6} />
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={[styles.dist, { borderBottomColor: c.border }]}>
          <View style={styles.distHead}>
            <Text style={[styles.distLabel, dir.text, { color: c.textSecondary }]} numberOfLines={1}>
              {t('tracker.mealsCard.caloriesByMeal')}
            </Text>
            <Text style={[styles.distValue, { color: c.textPrimary }]} numberOfLines={1}>
              {targetCalories > 0
                ? t('tracker.mealsCard.eatenOfTarget', {
                    eaten: formatNumber(Math.round(eaten)),
                    target: formatNumber(Math.round(targetCalories)),
                  })
                : t('common.kcalValue', { value: formatNumber(Math.round(eaten)) })}
            </Text>
          </View>
          <View style={[styles.distBar, { backgroundColor: c.surfaceSecondary }]}>
            {segments.map((segment) => (
              <View
                key={segment.slot}
                style={{ width: `${segment.fraction * 100}%`, backgroundColor: slotColor[segment.slot], borderRadius: 4 }}
              />
            ))}
          </View>
        </View>

        {MEAL_SLOTS.map((slot, index) => {
          const slotItems = bySlot(slot);
          const filled = slotItems.length > 0;
          const expanded = filled && openSlot === slot;
          const title = t(`tracker.mealSlots.${slot}.${activeRegion}`);
          const subtitle = filled
            ? slotItems.map((item) => foodDisplayName(item.foodName, item.foodNameAr, dir.isRTL).primary).join(', ')
            : t('tracker.mealsCard.nothingLogged');

          return (
            <View
              key={slot}
              style={[styles.slot, index < MEAL_SLOTS.length - 1 && { borderBottomColor: c.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
            >
              <View style={styles.slotHead}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={filled ? { expanded } : undefined}
                  accessibilityLabel={title}
                  activeOpacity={0.7}
                  onPress={() => {
                    HapticFeedback.selection();
                    if (filled) setOpenSlot(expanded ? null : slot);
                    else onAddItem(slot);
                  }}
                  style={styles.slotMain}
                >
                  <View style={[styles.slotIcon, { backgroundColor: filled ? c.successLight : c.surfaceSecondary }]}>
                    <Icon name={SLOT_ICON[slot]} size={16} color={iconColor[slot]} />
                  </View>
                  <View style={styles.slotText}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.slotName, dir.text, { color: c.textPrimary }]} numberOfLines={1}>
                        {title}
                      </Text>
                      {filled && <Icon name="check" size={14} color={c.successText} strokeWidth={3} />}
                      {nextSlot === slot && !filled && (
                        <View style={[styles.nextTag, { backgroundColor: c.primaryLime }]}>
                          <Text style={[styles.nextTagText, { color: c.limeText }]}>{t('tracker.mealsCard.next')}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.slotSub, dir.text, { color: c.textSecondary }]} numberOfLines={1}>
                      {subtitle}
                    </Text>
                  </View>
                  <Text style={[styles.slotKcal, { color: filled ? c.textPrimary : c.textMuted }]} numberOfLines={1}>
                    {t('common.kcalValue', { value: Math.round(kcalBySlot[slot]) })}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={t('tracker.mealsCard.addTo', { slot: title })}
                  activeOpacity={0.8}
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                  onPress={() => {
                    HapticFeedback.selection();
                    onAddItem(slot);
                  }}
                  style={[styles.plus, { backgroundColor: filled ? c.surfaceSecondary : c.primaryLime }]}
                >
                  <Icon name="plus" size={15} color={filled ? c.textPrimary : c.limeText} strokeWidth={2.8} />
                </TouchableOpacity>
              </View>

              {expanded && (
                <View style={styles.dishes}>
                  {slotItems.map((item) => (
                    <View key={item.id} style={styles.dish}>
                      <View style={styles.dishInfo}>
                        <Text style={[styles.dishName, dir.text, { color: c.textPrimary }]}>
                          {foodDisplayName(item.foodName, item.foodNameAr, dir.isRTL).primary}
                        </Text>
                        <Text style={[styles.dishMeta, dir.text, { color: c.textSecondary }]}>
                          {formatServingLine(item.quantity, item.servingLabel, item.totalGrams, language)}
                        </Text>
                        <Text style={[styles.dishMeta, dir.text, { color: c.textMuted }]}>
                          {t('common.macroLine', { protein: item.proteinGrams, carbs: item.carbGrams, fat: item.fatGrams })}
                        </Text>
                      </View>
                      <Text style={[styles.dishKcal, { color: c.textPrimary }]}>
                        {t('common.kcalValue', { value: item.calories })}
                      </Text>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={t('tracker.mealsCard.removeDish', { name: foodDisplayName(item.foodName, item.foodNameAr, dir.isRTL).primary })}
                        activeOpacity={0.6}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() => {
                          HapticFeedback.impactHeavy();
                          onDeleteItem(item.id);
                        }}
                        style={styles.dishDelete}
                      >
                        <Icon name="x" size={16} color={c.textMuted} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, minHeight: 28 },
  heading: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  linkText: { fontSize: 13, fontWeight: '700' },
  card: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14 },
  dist: { paddingTop: 14, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  distHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 8 },
  distLabel: { flexShrink: 1, fontSize: 12, fontWeight: '600' },
  distValue: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  distBar: { height: 8, borderRadius: 4, flexDirection: 'row', gap: 2, overflow: 'hidden' },
  slot: { paddingVertical: 4 },
  slotHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  slotMain: { flex: 1, minWidth: 0, minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10 },
  slotIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  slotText: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  slotName: { flexShrink: 1, fontSize: 15, fontWeight: '700' },
  nextTag: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  nextTagText: { fontSize: 10, fontWeight: '800' },
  slotSub: { fontSize: 12, marginTop: 1 },
  slotKcal: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  plus: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dishes: { paddingBottom: 10, paddingStart: 44, gap: 10 },
  dish: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  dishInfo: { flex: 1, minWidth: 0 },
  dishName: { fontSize: 14, fontWeight: '600' },
  dishMeta: { fontSize: 12, marginTop: 2 },
  dishKcal: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  dishDelete: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
});
