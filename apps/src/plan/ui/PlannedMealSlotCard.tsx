import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PlannedMealSlot } from '@nutrio/nutrition-core';
import { useTheme } from '../../theme.js';
import { Icon } from '../../ui/Icon.js';
import { useRegion } from '../../common/region/index.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';

interface PlannedMealSlotCardProps {
  slot: PlannedMealSlot;
  onOpenSwap: () => void;
}

export const PlannedMealSlotCard: React.FC<PlannedMealSlotCardProps> = ({
  slot,
  onOpenSwap,
}) => {
  const { theme, isDark } = useTheme();
  const { activeRegion } = useRegion();
  const { t } = useTranslation();
  const dir = useTextDirection();
  const isSaudi = activeRegion === 'SA';

  const getSlotIcon = (slotKey: string) => {
    switch (slotKey) {
      case 'breakfast':
        return <Icon name="sun" size={20} color="#F59E0B" />;
      case 'lunch':
        return <Icon name="utensils" size={20} color={theme.colors.primaryLime} />;
      case 'dinner':
        return <Icon name="utensils" size={20} color="#3B82F6" />;
      case 'snacks_chai':
        return <Icon name="coffee" size={20} color="#B45309" />;
      default:
        return <Icon name="utensils" size={20} color={theme.colors.primaryLime} />;
    }
  };

  const totalProtein = Number(
    slot.items.reduce((sum, i) => sum + i.proteinGrams, 0).toFixed(1)
  );
  const totalCarbs = Number(
    slot.items.reduce((sum, i) => sum + i.carbGrams, 0).toFixed(1)
  );
  const totalFat = Number(
    slot.items.reduce((sum, i) => sum + i.fatGrams, 0).toFixed(1)
  );
  const totalOil = Number(
    slot.items.reduce((sum, i) => sum + i.oilAddedG, 0).toFixed(1)
  );
  const oilTsps = (totalOil / 4.5).toFixed(1);

  const formatServing = (qty: number, label: string, totalG: number) => {
    const cleanLabel = (label || 'serving').replace(/\s*\(\s*\d+\s*g\s*\)/gi, '').trim();
    const qtyPrefix = qty !== 1 ? `${qty}× ` : '';
    return `${qtyPrefix}${cleanLabel} (${totalG}g)`;
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {/* Header Slot Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: theme.colors.surfaceSecondary },
            ]}
          >
            {getSlotIcon(slot.slot)}
          </View>
          <View style={styles.slotTitleCol}>
            <Text style={[styles.slotCategory, { color: theme.colors.textSecondary }]}>
              {t(`tracker.mealSlots.${slot.slot}.${activeRegion}`, {
                defaultValue: slot.slot.replace('_', ' '),
              })}
            </Text>
            <Text
              style={[styles.slotTitle, { color: theme.colors.textPrimary }]}
              numberOfLines={1}
            >
              {isSaudi
                ? slot.title?.replace(/Desi/gi, 'Saudi')?.replace(/Chai/gi, 'Gahwa')
                : slot.title}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.calBadge,
            {
              backgroundColor: isDark ? '#1C2608' : '#EDFCD2',
              borderColor: isDark ? '#2D4B05' : '#D4F88D',
            },
          ]}
        >
          <Text
            style={[
              styles.calorieVal,
              { color: isDark ? theme.colors.primaryLime : '#365314' },
            ]}
          >
            {t('common.kcalValue', { value: slot.actualCalories })}
          </Text>
        </View>
      </View>

      {/* Screen 3 Micro-Nutrient Chips */}
      <View style={styles.macroRow}>
        <View
          style={[
            styles.macroChip,
            {
              backgroundColor: theme.colors.surfaceSecondary,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.macroChipText, { color: theme.colors.textSecondary }]}>
            {totalProtein}g Protein
          </Text>
        </View>
        <View
          style={[
            styles.macroChip,
            {
              backgroundColor: theme.colors.surfaceSecondary,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.macroChipText, { color: theme.colors.textSecondary }]}>
            {totalCarbs}g Carbs
          </Text>
        </View>
        <View
          style={[
            styles.macroChip,
            styles.oilChip,
            {
              backgroundColor: isDark ? '#332306' : '#FEF3C7',
              borderColor: isDark ? '#6B4C0A' : '#FDE68A',
            },
          ]}
        >
          <Text
            style={[
              styles.oilText,
              { color: isDark ? '#FBBF24' : '#B45309' },
            ]}
          >
            {oilTsps} tsp oil
          </Text>
        </View>
      </View>

      {/* Tag Chips */}
      <View style={styles.tagRow}>
        <View
          style={[
            styles.dietitianBadge,
            {
              backgroundColor: isDark ? '#1C2608' : '#EDFCD2',
              borderColor: isDark ? '#2D4B05' : '#D4F88D',
            },
          ]}
        >
          <Text
            style={[
              styles.dietitianBadgeText,
              { color: isDark ? theme.colors.primaryLime : '#365314' },
            ]}
          >
            Dietitian Approved
          </Text>
        </View>
        <View
          style={[
            styles.cuisineBadge,
            {
              backgroundColor: theme.colors.surfaceSecondary,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.cuisineBadgeText, { color: theme.colors.textSecondary }]}>
            {t(`plan.mealSlot.cuisine.${activeRegion}`)}
          </Text>
        </View>
      </View>

      {/* Items list */}
      <View
        style={[
          styles.itemsList,
          { borderTopColor: theme.colors.border },
        ]}
      >
        {slot.items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <View style={styles.itemTitleRow}>
                <Text
                  style={[styles.itemName, { color: theme.colors.textPrimary }]}
                >
                  {item.foodName}
                </Text>
                {item.foodNameUr ? (
                  <Text
                    style={[
                      styles.itemUrduName,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {item.foodNameUr}
                  </Text>
                ) : null}
              </View>
              <Text
                style={[
                  styles.servingLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {formatServing(item.quantity, item.servingLabel, item.totalGrams)}
              </Text>
            </View>
            <Text
              style={[styles.itemKcal, { color: theme.colors.textPrimary }]}
            >
              {t('common.kcalValue', { value: item.calories })}
            </Text>
          </View>
        ))}
      </View>

      {/* Footer Actions: Swap Pill Button */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          style={[
            styles.swapButton,
            {
              backgroundColor: isDark ? '#1C2E12' : '#F2FF9E',
              borderColor: theme.colors.primaryLime,
            },
          ]}
          onPress={onOpenSwap}
          activeOpacity={0.7}
        >
          <View style={styles.swapBtnContent}>
            <Icon
              name="swap"
              size={13}
              color={isDark ? theme.colors.primaryLime : '#166534'}
            />
            <Text
              style={[
                styles.swapButtonText,
                { color: isDark ? theme.colors.primaryLime : '#166534' },
              ]}
            >
              Swap Alternatives
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 0,
    marginBottom: 16,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  slotTitleCol: {
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotCategory: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  slotTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  calBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
  },
  calorieVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  macroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  macroChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
    borderWidth: 1,
  },
  macroChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  oilChip: {
    borderWidth: 1,
  },
  oilText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  dietitianBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 9999,
    borderWidth: 1,
  },
  dietitianBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cuisineBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 9999,
    borderWidth: 1,
  },
  cuisineBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  itemsList: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginBottom: 14,
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginRight: 10,
  },
  itemTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: 6,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemUrduName: {
    fontSize: 13,
    fontWeight: '500',
  },
  servingLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  itemKcal: {
    fontSize: 13,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  swapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 9999,
    borderWidth: 1,
  },
  swapBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swapButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
