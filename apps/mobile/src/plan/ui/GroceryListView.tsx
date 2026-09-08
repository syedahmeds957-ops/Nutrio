import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  DailyMealPlanResult,
  generateWeeklyGroceryList,
  GroceryCategory,
  PlanBudgetTier,
} from '@nutrio/nutrition-core';

interface GroceryListViewProps {
  weekPlans: DailyMealPlanResult[];
  budgetTier: PlanBudgetTier;
  onBackToPlan: () => void;
}

export const GroceryListView: React.FC<GroceryListViewProps> = ({
  weekPlans,
  budgetTier,
  onBackToPlan,
}) => {
  const summary = generateWeeklyGroceryList(weekPlans, budgetTier);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const toggleItem = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredCategories =
    selectedCategory === 'all'
      ? summary.categories
      : summary.categories.filter((c) => c.category === selectedCategory);

  const totalItemsCount = summary.categories.reduce(
    (sum, c) => sum + c.items.length,
    0
  );
  const checkedCount = checkedIds.size;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBackToPlan}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>← Back to Plan</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>7-Day Grocery List</Text>
        <View style={styles.checkedCountBadge}>
          <Text style={styles.checkedCountText}>
            {checkedCount}/{totalItemsCount}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollPad}>
        {/* Budget Status Card */}
        <View style={styles.budgetCard}>
          <View style={styles.budgetHeader}>
            <View>
              <Text style={styles.budgetTierLabel}>
                WEEKLY BUDGET: {budgetTier.replace('_', ' ').toUpperCase()}
              </Text>
              <Text style={styles.costBigVal}>
                Rs. {summary.estimatedTotalCostPKR.toLocaleString()}
                <Text style={styles.maxCapText}>
                  {' '}
                  / {summary.maxBudgetPKR.toLocaleString()} PKR
                </Text>
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                summary.isWithinBudget
                  ? styles.statusBadgeSuccess
                  : styles.statusBadgeWarning,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  summary.isWithinBudget
                    ? styles.statusTextSuccess
                    : styles.statusTextWarning,
                ]}
              >
                {summary.isWithinBudget ? '✓ Within Budget' : '⚠️ Over Budget'}
              </Text>
            </View>
          </View>

          {/* Budget tip */}
          {summary.budgetOptimizationTip && (
            <View style={styles.tipBox}>
              <Text style={styles.tipText}>
                💡 {summary.budgetOptimizationTip}
              </Text>
            </View>
          )}
        </View>

        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillsPad}
        >
          <TouchableOpacity
            style={[
              styles.pill,
              selectedCategory === 'all' && styles.pillActive,
            ]}
            onPress={() => setSelectedCategory('all')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.pillText,
                selectedCategory === 'all' && styles.pillTextActive,
              ]}
            >
              All Items ({totalItemsCount})
            </Text>
          </TouchableOpacity>

          {summary.categories.map((cat) => (
            <TouchableOpacity
              key={cat.category}
              style={[
                styles.pill,
                selectedCategory === cat.category && styles.pillActive,
              ]}
              onPress={() => setSelectedCategory(cat.category)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pillText,
                  selectedCategory === cat.category && styles.pillTextActive,
                ]}
              >
                {cat.title} ({cat.items.length})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Grocery Aisles / Categories */}
        {filteredCategories.map((group) => (
          <View key={group.category} style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <View>
                <Text style={styles.groupTitle}>{group.title}</Text>
                <Text style={styles.groupTitleUr}>{group.titleUr}</Text>
              </View>
              <Text style={styles.groupSubtotal}>
                Rs. {group.subtotalPKR.toLocaleString()}
              </Text>
            </View>

            <View style={styles.groupItemsList}>
              {group.items.map((item) => {
                const isChecked = checkedIds.has(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.itemRow,
                      isChecked && styles.itemRowChecked,
                    ]}
                    onPress={() => toggleItem(item.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        isChecked && styles.checkboxChecked,
                      ]}
                    >
                      {isChecked && (
                        <Text style={styles.checkIcon}>✓</Text>
                      )}
                    </View>

                    <View style={styles.itemDetails}>
                      <Text
                        style={[
                          styles.itemName,
                          isChecked && styles.itemNameChecked,
                        ]}
                      >
                        {item.name}
                        {item.nameUr ? ` · ${item.nameUr}` : ''}
                      </Text>
                      <Text style={styles.itemMeta}>
                        {item.quantityAmount} {item.unit}
                        {item.notes ? ` (${item.notes})` : ''}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.itemPrice,
                        isChecked && styles.itemPriceChecked,
                      ]}
                    >
                      Rs. {item.estimatedCostPKR}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F8F6',
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    backgroundColor: '#F1F5F9',
  },
  backBtnText: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '700',
  },
  navTitle: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '800',
  },
  checkedCountBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  checkedCountText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  scrollPad: {
    padding: 16,
    paddingBottom: 48,
  },
  budgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  budgetTierLabel: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  costBigVal: {
    color: '#1E293B',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
  },
  maxCapText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  statusBadgeSuccess: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeWarning: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextSuccess: {
    color: '#059669',
  },
  statusTextWarning: {
    color: '#B45309',
  },
  tipBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  tipText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
  },
  categoryPillsPad: {
    gap: 8,
    paddingBottom: 14,
  },
  pill: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  pillActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  pillText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 12,
  },
  groupTitle: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '800',
  },
  groupTitleUr: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  groupSubtotal: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '800',
  },
  groupItemsList: {
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemRowChecked: {
    opacity: 0.45,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '600',
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  itemMeta: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 1,
  },
  itemPrice: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  itemPriceChecked: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
});
