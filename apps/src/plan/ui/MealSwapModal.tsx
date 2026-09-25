import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  MealSwapOption,
  MealSwapResult,
  PlannedMealSlot,
} from '@nutrio/nutrition-core';
import { useTheme } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';

interface MealSwapModalProps {
  visible: boolean;
  onClose: () => void;
  originalSlot: PlannedMealSlot | null;
  swapResult: MealSwapResult | null;
  onSelectOption: (option: MealSwapOption) => void;
}

export const MealSwapModal: React.FC<MealSwapModalProps> = ({
  visible,
  onClose,
  originalSlot,
  swapResult,
  onSelectOption,
}) => {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const dir = useTextDirection();

  if (!originalSlot || !swapResult) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.headerRow,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <View>
              <Text
                style={[
                  styles.modalSubtitle,
                  { color: isDark ? theme.colors.primaryLime : '#4D7C0F' },
                ]}
              >
                {t('plan.swap.eyebrow')}
              </Text>
              <Text
                style={[
                  styles.modalTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                {t('plan.swap.title', { slot: originalSlot.title })}
              </Text>
              <Text
                style={[
                  styles.currentMeta,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {t('plan.swap.current', { value: originalSlot.actualCalories })} ·{' '}
                {originalSlot.items.map((i) => i.foodName).join(', ')}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: theme.colors.surfaceSecondary },
              ]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.closeButtonText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollList} contentContainerStyle={styles.scrollPad}>
            <Text
              style={[
                styles.toleranceNotice,
                {
                  backgroundColor: isDark ? '#1C2608' : '#EDFCD2',
                  borderColor: isDark ? '#2D4B05' : '#D4F88D',
                  color: isDark ? '#D9F99D' : '#365314',
                },
              ]}
            >
              ✓ All 3 alternatives match your original meal within ±5% calories
            </Text>

            {swapResult.options.map((option, index) => {
              const deltaSign = option.calorieDeltaPct > 0 ? '+' : '';
              return (
                <View
                  key={option.optionId}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: theme.colors.surfaceSecondary,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <View style={styles.optionTopRow}>
                    <View style={styles.optionTitleBlock}>
                      <Text
                        style={[
                          styles.optionIndex,
                          { color: isDark ? theme.colors.primaryLime : '#4D7C0F' },
                        ]}
                      >
                        Option {index + 1}
                      </Text>
                      <Text
                        style={[
                          styles.optionTitle,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {option.title}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.calorieBadge,
                        {
                          backgroundColor: isDark ? '#1C2608' : '#EDFCD2',
                          borderColor: theme.colors.primaryLime,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.calorieText,
                          { color: isDark ? theme.colors.primaryLime : '#2E4D08' },
                        ]}
                      >
                        {option.calories} kcal
                      </Text>
                      <Text
                        style={[
                          styles.deltaText,
                          { color: isDark ? theme.colors.primaryLime : '#4D7C0F' },
                        ]}
                      >
                        {deltaSign}
                        {option.calorieDeltaPct}%
                      </Text>
                    </View>
                  </View>

                  {/* Macro Row */}
                  <View style={styles.macroPillRow}>
                    <View
                      style={[
                        styles.macroPill,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.macroPillLabel, { color: theme.colors.protein }]}>
                        P
                      </Text>
                      <Text style={[styles.macroPillVal, { color: theme.colors.textPrimary }]}>
                        {option.proteinGrams}g
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.macroPill,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.macroPillLabel, { color: isDark ? theme.colors.primaryLime : '#4D7C0F' }]}>
                        C
                      </Text>
                      <Text style={[styles.macroPillVal, { color: theme.colors.textPrimary }]}>
                        {option.carbGrams}g
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.macroPill,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.macroPillLabel, { color: theme.colors.fat }]}>
                        F
                      </Text>
                      <Text style={[styles.macroPillVal, { color: theme.colors.textPrimary }]}>
                        {option.fatGrams}g
                      </Text>
                    </View>
                    <View style={[styles.macroPill, styles.oilPill]}>
                      <Text style={styles.oilLabel}>Oil</Text>
                      <Text style={styles.oilVal}>{option.oilAddedG}g</Text>
                    </View>
                  </View>

                  {/* Item Breakdown */}
                  <View
                    style={[
                      styles.itemsBlock,
                      { borderTopColor: theme.colors.border },
                    ]}
                  >
                    {option.items.map((item, idx) => (
                      <Text
                        key={idx}
                        style={[
                          styles.itemLine,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        • {item.quantity}× {item.foodName} ({item.servingLabel})
                      </Text>
                    ))}
                  </View>

                  {/* Select Button */}
                  <TouchableOpacity
                    style={[
                      styles.selectBtn,
                      {
                        backgroundColor: theme.colors.primaryLime,
                        shadowColor: theme.colors.primaryLime,
                      },
                    ]}
                    onPress={() => onSelectOption(option)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.selectBtnText, { color: '#0A0B0D' }]}>
                      {t('plan.swap.selectMeal')}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    borderRadius: 28,
    width: '100%',
    maxWidth: 580,
    maxHeight: '88%',
    paddingTop: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  modalSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  currentMeta: {
    fontSize: 12,
    marginTop: 2,
    maxWidth: 260,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  scrollList: {
    paddingHorizontal: 16,
  },
  scrollPad: {
    paddingVertical: 16,
    gap: 14,
  },
  toleranceNotice: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 9999,
    borderWidth: 1,
  },
  optionCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  optionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  optionTitleBlock: {
    flex: 1,
    marginRight: 10,
  },
  optionIndex: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  calorieBadge: {
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'flex-end',
    borderWidth: 1,
  },
  calorieText: {
    fontSize: 14,
    fontWeight: '800',
  },
  deltaText: {
    fontSize: 11,
    fontWeight: '700',
  },
  macroPillRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  macroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
    borderWidth: 1,
  },
  macroPillLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  macroPillVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  oilPill: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  oilLabel: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '700',
  },
  oilVal: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '700',
  },
  itemsBlock: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 4,
  },
  itemLine: {
    fontSize: 13,
  },
  selectBtn: {
    marginTop: 14,
    borderRadius: 9999,
    paddingVertical: 12,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 2,
  },
  selectBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
});

