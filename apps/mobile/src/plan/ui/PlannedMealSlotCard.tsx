import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PlannedMealSlot } from '@nutrio/nutrition-core';
import { theme } from '../../theme.js';
import { Icon } from '../../ui/Icon.js';

interface PlannedMealSlotCardProps {
  slot: PlannedMealSlot;
  onOpenSwap: () => void;
}

export const PlannedMealSlotCard: React.FC<PlannedMealSlotCardProps> = ({
  slot,
  onOpenSwap,
}) => {
  const getSlotIcon = (slotKey: string) => {
    switch (slotKey) {
      case 'breakfast':
        return <Icon name="sun" size={20} color="#F59E0B" />;
      case 'lunch':
        return <Icon name="utensils" size={20} color="#10B981" />;
      case 'dinner':
        return <Icon name="utensils" size={20} color="#3B82F6" />;
      case 'snacks_chai':
        return <Icon name="coffee" size={20} color="#B45309" />;
      default:
        return <Icon name="utensils" size={20} color="#10B981" />;
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

  return (
    <View style={styles.card}>
      {/* Header Slot Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <View style={styles.iconCircle}>
            {getSlotIcon(slot.slot)}
          </View>
          <View>
            <Text style={styles.slotCategory}>
              {slot.slot.toUpperCase().replace('_', ' ')}
            </Text>
            <Text style={styles.slotTitle} numberOfLines={1}>
              {slot.title}
            </Text>
          </View>
        </View>

        <View style={styles.calBadge}>
          <Text style={styles.calorieVal}>{slot.actualCalories} kcal</Text>
        </View>
      </View>

      {/* Screen 3 Micro-Nutrient Chips */}
      <View style={styles.macroRow}>
        <View style={styles.macroChip}>
          <Text style={styles.macroChipText}>{totalProtein}g Protein</Text>
        </View>
        <View style={styles.macroChip}>
          <Text style={styles.macroChipText}>{totalCarbs}g Carbs</Text>
        </View>
        <View style={[styles.macroChip, styles.oilChip]}>
          <Text style={styles.oilText}>{oilTsps} tsp oil</Text>
        </View>
      </View>

      {/* Tag Chips */}
      <View style={styles.tagRow}>
        <View style={styles.dietitianBadge}>
          <Text style={styles.dietitianBadgeText}>Dietitian Approved</Text>
        </View>
        <View style={styles.cuisineBadge}>
          <Text style={styles.cuisineBadgeText}>Pakistani Cuisine</Text>
        </View>
      </View>

      {/* Items list */}
      <View style={styles.itemsList}>
        {slot.items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>
                {item.foodName}
                {item.foodNameUr ? ` · ${item.foodNameUr}` : ''}
              </Text>
              <Text style={styles.servingLabel}>
                {item.quantity}× {item.servingLabel} ({item.totalGrams}g)
              </Text>
            </View>
            <Text style={styles.itemKcal}>{item.calories} kcal</Text>
          </View>
        ))}
      </View>

      {/* Footer Actions: Swap Pill Button */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          style={styles.swapButton}
          onPress={onOpenSwap}
          activeOpacity={0.7}
        >
          <View style={styles.swapBtnContent}>
            <Icon name="swap" size={13} color="#059669" />
            <Text style={styles.swapButtonText}>Swap Alternatives</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.card,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.soft,
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
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  slotCategory: {
    ...theme.typography.overline,
    color: theme.colors.textSecondary,
  },
  slotTitle: {
    ...theme.typography.cardTitle,
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  calBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: theme.radii.pill,
  },
  calorieVal: {
    ...theme.typography.bodyMetric,
    color: '#059669',
  },
  macroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  macroChip: {
    backgroundColor: theme.colors.surfaceSecondary,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  macroChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  oilChip: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  oilText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  dietitianBadge: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: theme.radii.pill,
  },
  dietitianBadgeText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  cuisineBadge: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: theme.radii.pill,
  },
  cuisineBadgeText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  itemsList: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
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
  itemName: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  servingLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  itemKcal: {
    color: theme.colors.textPrimary,
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
    backgroundColor: theme.colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.radii.pill,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  swapBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swapButtonText: {
    color: theme.colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
});
