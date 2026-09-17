import React, { useState, useMemo } from 'react';
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
  PlanBudgetTier,
} from '@nutrio/nutrition-core';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';

interface GroceryListViewProps {
  weekPlans: DailyMealPlanResult[];
  budgetTier: PlanBudgetTier;
  onBackToPlan: () => void;
}

const formatBudgetTierHeader = (tier: string, isSaudiMode: boolean): string => {
  if (isSaudiMode) {
    switch (tier) {
      case 'low_under_3500':
      case 'budget_under_3500':
        return 'BUDGET (< 125 SAR)';
      case 'standard_3500_7000':
        return 'STANDARD (125 - 250 SAR)';
      case 'premium_above_7000':
        return 'PREMIUM (> 250 SAR)';
      default:
        return tier.replace(/_/g, ' ').replace(/\d+/g, '').trim().toUpperCase() || 'STANDARD';
    }
  }
  switch (tier) {
    case 'low_under_3500':
      return 'BUDGET (< Rs 3,500)';
    case 'standard_3500_7000':
      return 'STANDARD (Rs 3,500 - 7,000)';
    case 'premium_above_7000':
      return 'PREMIUM (> Rs 7,000)';
    default:
      return tier.replace(/_/g, ' ').toUpperCase();
  }
};

export const GroceryListView: React.FC<GroceryListViewProps> = ({
  weekPlans: plans,
  budgetTier = 'standard_3500_7000',
  onBackToPlan: onBack,
}) => {
  const { theme, isDark } = useTheme();
  const { activeRegion } = useRegion();
  const isSaudi = activeRegion === 'SA';

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const summary = useMemo(
    () => generateWeeklyGroceryList(plans, budgetTier, activeRegion as any),
    [plans, budgetTier, activeRegion]
  );

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

  const filteredCategories = useMemo(() => {
    if (selectedCategory === 'all') {
      return summary.categories;
    }
    return summary.categories.filter((c: any) => c.category === selectedCategory);
  }, [summary, selectedCategory]);

  const totalItemsCount = summary.categories.reduce(
    (sum: number, c: any) => sum + c.items.length,
    0
  );
  const checkedCount = checkedIds.size;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.canvas }]}>
      {/* Top Header */}
      <View
        style={[
          styles.topNav,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backBtn,
            {
              backgroundColor: theme.colors.surfaceSecondary,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={[styles.backBtnText, { color: theme.colors.textPrimary }]}>
            ← Back to Plan
          </Text>
        </TouchableOpacity>
        <Text
          style={[styles.navTitle, { color: theme.colors.textPrimary }]}
          numberOfLines={1}
        >
          {isSaudi ? '7-Day Grocery List (مقاضي الأسبوع)' : '7-Day Grocery List'}
        </Text>
        <View
          style={[
            styles.checkedCountBadge,
            { backgroundColor: isDark ? '#1C2608' : '#F4FED0' },
          ]}
        >
          <Text
            style={[
              styles.checkedCountText,
              { color: isDark ? theme.colors.primaryLime : '#465A00' },
            ]}
          >
            {checkedCount}/{totalItemsCount}
          </Text>
        </View>
      </View>

      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.canvas }]}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Budget Status Card */}
        <View
          style={[
            styles.budgetCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.budgetHeader}>
            <View>
              <Text
                style={[
                  styles.budgetTierLabel,
                  { color: theme.colors.primaryLime },
                ]}
              >
                {isSaudi
                  ? `WEEKLY BUDGET (ميزانية الأسبوع): ${formatBudgetTierHeader(budgetTier, true)}`
                  : `WEEKLY BUDGET: ${formatBudgetTierHeader(budgetTier, false)}`}
              </Text>
              <Text
                style={[styles.costBigVal, { color: theme.colors.textPrimary }]}
              >
                {summary.currencySymbol} {summary.estimatedTotalCost.toLocaleString()}
                <Text
                  style={[styles.maxCapText, { color: theme.colors.textSecondary }]}
                >
                  {' '}
                  / {summary.maxBudget.toLocaleString()} {summary.currency}
                </Text>
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                summary.isWithinBudget
                  ? {
                      backgroundColor: isDark ? '#1C2608' : '#EDFCD2',
                      borderColor: isDark ? '#2D4B05' : '#D4F88D',
                    }
                  : {
                      backgroundColor: isDark ? '#332306' : '#FEF3C7',
                      borderColor: isDark ? '#6B4C0A' : '#FDE68A',
                    },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  summary.isWithinBudget
                    ? { color: isDark ? theme.colors.primaryLime : '#365314' }
                    : { color: isDark ? '#FBBF24' : '#B45309' },
                ]}
              >
                {summary.isWithinBudget ? '✓ Within Budget' : '⚠ Over Budget'}
              </Text>
            </View>
          </View>

          {/* Budget tip */}
          {summary.budgetOptimizationTip && (
            <View
              style={[
                styles.tipBox,
                { borderTopColor: theme.colors.border },
              ]}
            >
              <Text
                style={[styles.tipText, { color: theme.colors.textSecondary }]}
              >
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
              selectedCategory === 'all'
                ? {
                    backgroundColor: theme.colors.primaryLime,
                    borderColor: theme.colors.primaryLime,
                  }
                : {
                    backgroundColor: theme.colors.surfaceSecondary,
                    borderColor: theme.colors.border,
                  },
            ]}
            onPress={() => setSelectedCategory('all')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.pillText,
                selectedCategory === 'all'
                  ? { color: '#0A0B0D' }
                  : { color: theme.colors.textSecondary },
              ]}
            >
              {isSaudi ? 'All Items (الكل)' : 'All Items'} ({totalItemsCount})
            </Text>
          </TouchableOpacity>

          {summary.categories.map((cat: any) => {
            const isCatSelected = selectedCategory === cat.category;
            return (
              <TouchableOpacity
                key={cat.category}
                style={[
                  styles.pill,
                  isCatSelected
                    ? {
                        backgroundColor: theme.colors.primaryLime,
                        borderColor: theme.colors.primaryLime,
                      }
                    : {
                        backgroundColor: theme.colors.surfaceSecondary,
                        borderColor: theme.colors.border,
                      },
                ]}
                onPress={() => setSelectedCategory(cat.category)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pillText,
                    isCatSelected
                      ? { color: '#0A0B0D' }
                      : { color: theme.colors.textSecondary },
                  ]}
                >
                  {isSaudi && cat.titleAr ? cat.titleAr : cat.title} ({cat.items.length})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Grocery Aisles / Categories */}
        {filteredCategories.map((group: any) => (
          <View
            key={group.category}
            style={[
              styles.groupCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.groupHeader,
                { borderBottomColor: theme.colors.border },
              ]}
            >
              <View>
                <Text
                  style={[styles.groupTitle, { color: theme.colors.textPrimary }]}
                >
                  {group.title}
                </Text>
                <Text
                  style={[styles.groupTitleUr, { color: theme.colors.textSecondary }]}
                >
                  {isSaudi ? group.titleAr : group.titleUr}
                </Text>
              </View>
              <Text
                style={[styles.groupSubtotal, { color: theme.colors.primaryLime }]}
              >
                {summary.currencySymbol}{' '}
                {(group.subtotal !== undefined
                  ? group.subtotal
                  : group.subtotalPKR
                ).toLocaleString()}
              </Text>
            </View>

            <View style={styles.groupItemsList}>
              {group.items.map((item: any) => {
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
                        isChecked
                          ? {
                              backgroundColor: theme.colors.primaryLime,
                              borderColor: theme.colors.primaryLime,
                            }
                          : {
                              backgroundColor: theme.colors.surfaceSecondary,
                              borderColor: theme.colors.border,
                            },
                      ]}
                    >
                      {isChecked && (
                        <Text style={[styles.checkIcon, { color: '#0A0B0D' }]}>
                          ✓
                        </Text>
                      )}
                    </View>

                    <View style={styles.itemDetails}>
                      <Text
                        style={[
                          styles.itemName,
                          { color: theme.colors.textPrimary },
                          isChecked && styles.itemNameChecked,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {isSaudi && item.nameAr && (
                        <Text
                          style={[
                            styles.itemNameAr,
                            { color: theme.colors.textSecondary },
                            isChecked && styles.itemNameChecked,
                          ]}
                        >
                          {item.nameAr}
                        </Text>
                      )}
                      <Text
                        style={[
                          styles.itemMeta,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {item.quantityAmount} {item.unit} · {summary.currencySymbol}{' '}
                        {item.estimatedCost ?? item.estimatedCostPKR}
                      </Text>
                    </View>
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
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  checkedCountBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
    borderWidth: 1,
  },
  checkedCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  scrollPad: {
    padding: 16,
    paddingBottom: 60,
  },
  budgetCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  budgetTierLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  costBigVal: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
  },
  maxCapText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tipBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  tipText: {
    fontSize: 12,
    lineHeight: 18,
  },
  categoryPillsPad: {
    gap: 8,
    paddingBottom: 14,
  },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 9999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  groupCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    paddingBottom: 10,
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  groupTitleUr: {
    fontSize: 11,
    marginTop: 2,
  },
  groupSubtotal: {
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
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    fontSize: 12,
    fontWeight: '900',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemNameAr: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
  },
  itemMeta: {
    fontSize: 12,
    marginTop: 2,
  },
});

