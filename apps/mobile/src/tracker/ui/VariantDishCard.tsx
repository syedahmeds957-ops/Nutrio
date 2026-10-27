import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { NormalizedFood } from '@nutrio/food-db';
import { foodDb } from '../../catalogue/index.js';
import { useTheme } from '../../theme.js';
import { useTranslation, useI18nState } from '../../i18n/index.js';
import { pickText } from '../../i18n/displayName.js';
import { DishCard } from './DishCard.js';
import { styles } from './MealLogHubModal.styles.js';

const ACCENT_TEXT = '#0A0B0D';

export interface VariantDishCardProps {
  /** The search result; a dish with variants is shown once, starting on this one. */
  item: NormalizedFood;
  isBuildMode: boolean;
  basketQty: (food: NormalizedFood) => number;
  onPressFood: (food: NormalizedFood) => void;
  onRemoveFood: (food: NormalizedFood) => void;
}

/**
 * A search result that may be cooked several ways. Aloo Gosht appears once,
 * with Mutton / Beef / Chicken chips under it; the card's macros, and what a
 * tap logs, follow the chip that is selected.
 */
export const VariantDishCard: React.FC<VariantDishCardProps> = ({
  item,
  isBuildMode,
  basketQty,
  onPressFood,
  onRemoveFood,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { language } = useI18nState();
  const variants = foodDb().getFoodVariants(item);
  const [selectedId, setSelectedId] = useState(item.id);
  const selected = variants.find((v) => v.id === selectedId) ?? item;

  return (
    <View>
      <DishCard
        item={selected}
        qty={basketQty(selected)}
        isBuildMode={isBuildMode}
        onPress={() => onPressFood(selected)}
        onRemoveOne={() => onRemoveFood(selected)}
      />
      {variants.length > 1 && (
        <View
          style={styles.variantChipRow}
          accessibilityRole="radiogroup"
          accessibilityLabel={t('tracker.hub.variantPicker', { name: pickText(selected.name, selected.nameAr, language) })}
        >
          {variants.map((variant) => {
            const isSelected = variant.id === selected.id;
            return (
              <TouchableOpacity
                key={variant.id ?? variant.name}
                style={[
                  styles.variantChip,
                  {
                    backgroundColor: isSelected ? theme.colors.primaryLime : theme.colors.surfaceSecondary,
                    borderColor: isSelected ? theme.colors.primaryLime : theme.colors.border,
                  },
                ]}
                onPress={() => setSelectedId(variant.id)}
                accessibilityRole="radio"
                aria-checked={isSelected}
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              >
                <Text
                  style={[
                    styles.variantChipText,
                    { color: isSelected ? ACCENT_TEXT : theme.colors.textPrimary },
                  ]}
                >
                  {t(`tracker.hub.variant.${variant.variantLabel}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};
