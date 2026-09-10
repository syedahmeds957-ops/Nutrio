import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { LoggedItem, MealSlot } from '../types.js';
import { useTheme } from '../../theme.js';

interface MealSlotCardProps {
  slot: MealSlot;
  title: string;
  emoji?: string;
  icon?: React.ReactNode;
  items: LoggedItem[];
  onAddItem: (slot: MealSlot) => void;
  onDeleteItem: (id: string) => void;
}

export const MealSlotCard: React.FC<MealSlotCardProps> = ({
  slot,
  title,
  emoji,
  icon,
  items,
  onAddItem,
  onDeleteItem,
}) => {
  const { theme, isDark } = useTheme();
  const slotCalories = items.reduce((sum, item) => sum + item.calories, 0);
  const isDone = items.length > 0;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: isDone
            ? isDark
              ? 'rgba(164, 235, 63, 0.45)'
              : '#86EFAC'
            : theme.colors.border,
          borderWidth: isDone ? 1.5 : 1,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View
            style={[
              styles.emojiBadge,
              {
                backgroundColor: isDone
                  ? isDark
                    ? 'rgba(164, 235, 63, 0.2)'
                    : '#DCFCE7'
                  : theme.colors.surfaceSecondary,
              },
            ]}
          >
            {icon ? icon : <Text style={styles.emoji}>{emoji}</Text>}
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
              {isDone && (
                <View
                  style={[
                    styles.doneBadge,
                    {
                      backgroundColor: isDark ? 'rgba(164, 235, 63, 0.2)' : '#DCFCE7',
                      borderColor: isDark ? theme.colors.primaryLime : '#16A34A',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.doneBadgeText,
                      { color: isDark ? theme.colors.primaryLime : '#15803D' },
                    ]}
                  >
                    ✓ DONE
                  </Text>
                </View>
              )}
            </View>
            {isDone && (
              <Text style={[styles.itemsCountText, { color: theme.colors.textSecondary }]}>
                {items.length} {items.length === 1 ? 'dish' : 'dishes'} tracked
              </Text>
            )}
          </View>
        </View>
        <View
          style={[
            styles.calBadge,
            {
              backgroundColor: isDone
                ? isDark
                  ? 'rgba(164, 235, 63, 0.25)'
                  : '#BBF7D0'
                : isDark
                ? 'rgba(255, 255, 255, 0.05)'
                : '#F1F5F9',
            },
          ]}
        >
          <Text
            style={[
              styles.slotCalories,
              {
                color: isDone
                  ? isDark
                    ? theme.colors.primaryLime
                    : '#059669'
                  : theme.colors.textMuted,
              },
            ]}
          >
            {slotCalories} kcal
          </Text>
        </View>
      </View>

      {/* Logged Items List */}
      {items.length > 0 ? (
        <View style={[styles.itemsList, { borderTopColor: theme.colors.border }]}>
          {items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: theme.colors.textPrimary }]}>
                  {item.foodName}
                  {item.foodNameUr ? ` (${item.foodNameUr})` : ''}
                </Text>
                <Text style={[styles.itemServing, { color: theme.colors.textSecondary }]}>
                  {item.quantity} × {item.servingLabel} ({item.totalGrams}g)
                </Text>
                <Text style={[styles.itemMacros, { color: theme.colors.textMuted }]}>
                  P: {item.proteinGrams}g · F: {item.fatGrams}g · C: {item.carbGrams}g
                </Text>
              </View>

              <View style={styles.itemRight}>
                <Text style={[styles.itemCalories, { color: theme.colors.textPrimary }]}>
                  {item.calories} kcal
                </Text>
                <TouchableOpacity
                  onPress={() => onDeleteItem(item.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.deleteText, { color: theme.colors.textMuted }]}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
          No dishes tracked in this slot yet
        </Text>
      )}

      {/* Add Food Button */}
      <TouchableOpacity
        style={[
          styles.addBtn,
          {
            backgroundColor: isDone
              ? isDark
                ? 'rgba(164, 235, 63, 0.08)'
                : '#F0FDF4'
              : theme.colors.surfaceSecondary,
            borderColor: isDone
              ? isDark
                ? 'rgba(164, 235, 63, 0.3)'
                : '#BBF7D0'
              : theme.colors.border,
          },
        ]}
        onPress={() => onAddItem(slot)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.addBtnText,
            { color: isDark ? theme.colors.primaryLime : '#0F172A' },
          ]}
        >
          {isDone ? `+ Add More to ${title}` : `+ Add Food`}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emojiBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 18,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  doneBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  doneBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  itemsCountText: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  calBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
  },
  slotCalories: {
    fontSize: 12,
    fontWeight: '800',
  },
  itemsList: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginBottom: 10,
    gap: 12,
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
    fontSize: 14,
    fontWeight: '600',
  },
  itemServing: {
    fontSize: 12,
    marginTop: 2,
  },
  itemMacros: {
    fontSize: 11,
    marginTop: 2,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  itemCalories: {
    fontSize: 13,
    fontWeight: '700',
  },
  deleteText: {
    fontSize: 13,
    padding: 2,
  },
  emptyText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginVertical: 8,
  },
  addBtn: {
    marginTop: 6,
    paddingVertical: 10,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
