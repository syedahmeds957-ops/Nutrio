import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { NormalizedFood } from '@nutrio/food-db';
import { formatServingLine } from '../formatServing.js';
import { Icon } from '../../ui/Icon.js';
import { useTheme } from '../../theme.js';
import { foodDisplayName } from '../foodDisplayName.js';
import { useTranslation, useTextDirection, useI18nState } from '../../i18n/index.js';
import { defaultServingFor, servingNutrition } from '../personalServings.js';
import { foodKey } from './useMealBasket.js';
import { styles } from './MealLogHubModal.styles.js';

const ACCENT_TEXT = '#0A0B0D';
const LIGHT_MACRO_TEXT = '#4B6200';

export interface DishCardProps {
  item: NormalizedFood;
  /** How many of this food are in the custom-meal basket (0 when none). */
  qty: number;
  /** Custom-meal mode: the card shows quantity controls instead of a chevron. */
  isBuildMode: boolean;
  onPress: () => void;
  onRemoveOne: () => void;
}

/** One food row in the meal-logging hub, with its default serving and macros. */
export const DishCard: React.FC<DishCardProps> = ({ item, qty, isBuildMode, onPress, onRemoveOne }) => {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const dir = useTextDirection();
  const { language } = useI18nState();
  // At most one local name. Urdu names are not displayed (lists show the
  // English name; Urdu still matches in search). Saudi users see the Arabic name.
  const names = foodDisplayName(item.name, item.nameAr, dir.isRTL);
  const macroColor = isDark ? theme.colors.primaryLime : LIGHT_MACRO_TEXT;

  // The serving one tap logs (the user's own, if saved), and its numbers. The
  // per-100g values used to be shown as the serving's when it had no kcal of
  // its own, so a 200g curry read as its 100g calories.
  const serving = defaultServingFor(item, foodKey(item), t('tracker.customizer.myServing'));
  const nutrition = servingNutrition(item, serving);
  const kcal = Math.round(nutrition.kcal);
  const p = Math.round(nutrition.protein);
  const c = Math.round(nutrition.carbs);
  const f = Math.round(nutrition.fat);

  return (
    <TouchableOpacity
      style={[
        styles.dishCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: qty > 0 ? theme.colors.primaryLime : theme.colors.border,
          borderWidth: qty > 0 ? 1.5 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.dishCardLeft}>
        <View style={styles.dishTitleRow}>
          <Text style={[styles.dishName, { color: theme.colors.textPrimary }]}>{names.primary}</Text>
          {names.secondary && (
            <Text style={[styles.dishNameUr, dir.text, { color: theme.colors.textMuted }]}>
              {names.secondary}
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
            {serving ? formatServingLine(1, serving.description || serving.label, serving.grams, language) : t('common.gramsValue', { value: 100 })}
          </Text>
        </View>
        <Text style={[styles.dishMacrosText, { color: macroColor }]}>
          {t('common.macroLine', { protein: p, carbs: c, fat: f })}
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
          <Text style={[styles.caloriePillText, { color: macroColor }]}>≈{t('common.kcalValue', { value: kcal })}</Text>
        </View>
        {isBuildMode ? (
          <View style={styles.qtyControls}>
            {qty > 0 && (
              <>
                <TouchableOpacity
                  style={[styles.qtyBtn, { backgroundColor: theme.colors.surfaceSecondary }]}
                  onPress={onRemoveOne}
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
              <Icon name="plus" size={14} color={qty > 0 ? ACCENT_TEXT : theme.colors.textPrimary} />
            </View>
          </View>
        ) : (
          <Icon name={dir.isRTL ? 'chevron-left' : 'chevron-right'} size={16} color={theme.colors.textMuted} />
        )}
      </View>
    </TouchableOpacity>
  );
};
