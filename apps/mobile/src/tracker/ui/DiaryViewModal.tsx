import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
} from 'react-native';
import { DailyTrackerSummary, LoggedItem } from '../types.js';
import { Icon } from '../../ui/Icon.js';
import { useTheme } from '../../theme.js';

export interface DiaryViewModalProps {
  visible: boolean;
  summary: DailyTrackerSummary;
  onClose: () => void;
  onDeleteItem: (id: string) => void;
  onOpenLogHub: () => void;
}

export const DiaryViewModal: React.FC<DiaryViewModalProps> = ({
  visible,
  summary,
  onClose,
  onDeleteItem,
  onOpenLogHub,
}) => {
  const { theme, isDark } = useTheme();
  const [dayOffset, setDayOffset] = useState<number>(0);

  if (!visible) return null;

  const dateLabel =
    dayOffset === 0
      ? 'Today'
      : dayOffset === -1
      ? 'Yesterday'
      : dayOffset === 1
      ? 'Tomorrow'
      : `${Math.abs(dayOffset)} days ${dayOffset < 0 ? 'ago' : 'ahead'}`;

  const pct = Math.min(
    100,
    Math.round((summary.totalCaloriesConsumed / (summary.targetCalories || 2100)) * 100)
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.canvas }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.colors.surfaceSecondary }]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Back to dashboard"
          >
            <Icon name="arrow-left" size={18} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
            Food Diary
          </Text>

          <View style={styles.headerRightSpacer} />
        </View>

        {/* Date Selector Carousel */}
        <View
          style={[
            styles.dateSelector,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.dateArrow, { backgroundColor: theme.colors.surfaceSecondary }]}
            onPress={() => setDayOffset((d) => d - 1)}
          >
            <Icon name="arrow-left" size={16} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.dateCenter}>
            <Text style={[styles.dateText, { color: theme.colors.textPrimary }]}>
              {dateLabel}
            </Text>
            <Text style={[styles.dateSub, { color: theme.colors.textSecondary }]}>
              {summary.date}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.dateArrow,
              { backgroundColor: theme.colors.surfaceSecondary },
              dayOffset >= 0 && { opacity: 0.3 },
            ]}
            onPress={() => setDayOffset((d) => Math.min(0, d + 1))}
            disabled={dayOffset >= 0}
          >
            <Icon name="arrow-right" size={16} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Daily Progress Card */}
          <View
            style={[
              styles.progressCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.progressTopRow}>
              <View>
                <Text style={[styles.progressKcalText, { color: theme.colors.textPrimary }]}>
                  {summary.totalCaloriesConsumed}{' '}
                  <Text style={[styles.progressKcalTarget, { color: theme.colors.textSecondary }]}>
                    / {summary.targetCalories} kcal
                  </Text>
                </Text>
                <Text
                  style={[
                    styles.progressMacroSub,
                    { color: isDark ? theme.colors.primaryLime : '#4B6200' },
                  ]}
                >
                  P {summary.totalProteinConsumed}g · C {summary.totalCarbConsumed}g · F{' '}
                  {summary.totalFatConsumed}g · {summary.items.length}{' '}
                  {summary.items.length === 1 ? 'item' : 'items'}
                </Text>
              </View>

              <View
                style={[
                  styles.percentageBadge,
                  { backgroundColor: theme.colors.primaryLime },
                ]}
              >
                <Text style={styles.percentageText}>{pct}%</Text>
              </View>
            </View>

            {/* Progress Bar Track */}
            <View
              style={[
                styles.progressBarTrack,
                { backgroundColor: theme.colors.surfaceSecondary },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${pct}%`,
                    backgroundColor: theme.colors.primaryLime,
                  },
                ]}
              />
            </View>
          </View>

          {/* Logged Food Items List */}
          <View style={styles.itemsSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
                LOGGED DISHES
              </Text>
              <Text style={[styles.sectionCount, { color: theme.colors.textMuted }]}>
                {summary.items.length} {summary.items.length === 1 ? 'dish' : 'dishes'}
              </Text>
            </View>

            {summary.items.length === 0 ? (
              <View
                style={[
                  styles.emptyContainer,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
                  No dishes logged yet
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                  Tap below to log your meals, fast-food favorites, or chai.
                </Text>
                <TouchableOpacity
                  style={[
                    styles.emptyLogBtn,
                    { backgroundColor: theme.colors.primaryLime },
                  ]}
                  onPress={onOpenLogHub}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.emptyLogBtnText, { color: theme.colors.limeText }]}>
                    + Log a meal
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              summary.items.map((item: LoggedItem) => (
                <View
                  key={item.id}
                  style={[
                    styles.itemRow,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <View style={styles.itemLeft}>
                    <View style={styles.itemTitleRow}>
                      <Text style={[styles.itemName, { color: theme.colors.textPrimary }]}>
                        {item.foodName}
                      </Text>
                      {item.foodNameUr && (
                        <Text style={[styles.itemNameUr, { color: theme.colors.textMuted }]}>
                          {item.foodNameUr}
                        </Text>
                      )}
                    </View>

                    <Text style={[styles.itemMeta, { color: theme.colors.textSecondary }]}>
                      {item.mealSlot.replace('_', ' ').toUpperCase()} · {item.quantity}x {item.servingLabel}
                    </Text>

                    <Text
                      style={[
                        styles.itemMacros,
                        { color: isDark ? theme.colors.primaryLime : '#4B6200' },
                      ]}
                    >
                      P {item.proteinGrams}g · C {item.carbGrams}g · F {item.fatGrams}g
                    </Text>
                  </View>

                  <View style={styles.itemRight}>
                    <View
                      style={[
                        styles.caloriePill,
                        {
                          backgroundColor: isDark
                            ? 'rgba(164, 235, 63, 0.15)'
                            : '#F7FEE7',
                          borderColor: theme.colors.primaryLime,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.caloriePillText,
                          { color: isDark ? theme.colors.primaryLime : '#4B6200' },
                        ]}
                      >
                        ≈{item.calories} kcal
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.deleteBtn,
                        { backgroundColor: theme.colors.surfaceSecondary },
                      ]}
                      onPress={() => onDeleteItem(item.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel="Delete item"
                    >
                      <Icon name="x" size={14} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Bottom Floating Log Action */}
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.logHubButton,
              { backgroundColor: theme.colors.primaryLime },
            ]}
            onPress={onOpenLogHub}
            activeOpacity={0.8}
          >
            <Icon name="plus" size={18} color={theme.colors.limeText} />
            <Text style={[styles.logHubButtonText, { color: theme.colors.limeText }]}>
              Log a meal
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerRightSpacer: {
    width: 40,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  dateArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCenter: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: 15,
    fontWeight: '800',
  },
  dateSub: {
    fontSize: 11,
    marginTop: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  progressCard: {
    padding: 18,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  progressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressKcalText: {
    fontSize: 20,
    fontWeight: '800',
  },
  progressKcalTarget: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressMacroSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  percentageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0A0B0D',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  itemsSection: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sectionCount: {
    fontSize: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
  },
  itemLeft: {
    flex: 1,
    marginRight: 10,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '800',
    marginRight: 6,
  },
  itemNameUr: {
    fontSize: 12,
  },
  itemMeta: {
    fontSize: 12,
    marginBottom: 3,
  },
  itemMacros: {
    fontSize: 11,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  caloriePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  caloriePillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 28,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyLogBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  emptyLogBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  logHubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    paddingVertical: 16,
    gap: 8,
  },
  logHubButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
