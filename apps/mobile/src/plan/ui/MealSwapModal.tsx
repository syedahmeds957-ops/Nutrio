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
  if (!originalSlot || !swapResult) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalSubtitle}>ONE-TAP MACRO MATCH</Text>
              <Text style={styles.modalTitle}>Swap {originalSlot.title}</Text>
              <Text style={styles.currentMeta}>
                Current: {originalSlot.actualCalories} kcal ·{' '}
                {originalSlot.items.map((i) => i.foodName).join(', ')}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollList} contentContainerStyle={styles.scrollPad}>
            <Text style={styles.toleranceNotice}>
              ✓ All 3 alternatives match your original meal within ±5% calories
            </Text>

            {swapResult.options.map((option, index) => {
              const deltaSign = option.calorieDeltaPct > 0 ? '+' : '';
              return (
                <View key={option.optionId} style={styles.optionCard}>
                  <View style={styles.optionTopRow}>
                    <View style={styles.optionTitleBlock}>
                      <Text style={styles.optionIndex}>Option {index + 1}</Text>
                      <Text style={styles.optionTitle}>{option.title}</Text>
                    </View>
                    <View style={styles.calorieBadge}>
                      <Text style={styles.calorieText}>{option.calories} kcal</Text>
                      <Text style={styles.deltaText}>
                        {deltaSign}
                        {option.calorieDeltaPct}%
                      </Text>
                    </View>
                  </View>

                  {/* Macro Row */}
                  <View style={styles.macroPillRow}>
                    <View style={styles.macroPill}>
                      <Text style={styles.macroPillLabel}>P</Text>
                      <Text style={styles.macroPillVal}>{option.proteinGrams}g</Text>
                    </View>
                    <View style={styles.macroPill}>
                      <Text style={styles.macroPillLabel}>C</Text>
                      <Text style={styles.macroPillVal}>{option.carbGrams}g</Text>
                    </View>
                    <View style={styles.macroPill}>
                      <Text style={styles.macroPillLabel}>F</Text>
                      <Text style={styles.macroPillVal}>{option.fatGrams}g</Text>
                    </View>
                    <View style={[styles.macroPill, styles.oilPill]}>
                      <Text style={styles.oilLabel}>Oil</Text>
                      <Text style={styles.oilVal}>{option.oilAddedG}g</Text>
                    </View>
                  </View>

                  {/* Item Breakdown */}
                  <View style={styles.itemsBlock}>
                    {option.items.map((item, idx) => (
                      <Text key={idx} style={styles.itemLine}>
                        • {item.quantity}× {item.foodName} ({item.servingLabel})
                      </Text>
                    ))}
                  </View>

                  {/* Select Button */}
                  <TouchableOpacity
                    style={styles.selectBtn}
                    onPress={() => onSelectOption(option)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.selectBtnText}>Select This Meal</Text>
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '85%',
    paddingTop: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalSubtitle: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  modalTitle: {
    color: '#1E293B',
    fontSize: 20,
    fontWeight: '800',
  },
  currentMeta: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
    maxWidth: 260,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#64748B',
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
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
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
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  optionTitle: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  calorieBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'flex-end',
  },
  calorieText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '800',
  },
  deltaText: {
    color: '#059669',
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
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  macroPillLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  macroPillVal: {
    color: '#1E293B',
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
    borderTopColor: '#F1F5F9',
    gap: 4,
  },
  itemLine: {
    color: '#64748B',
    fontSize: 13,
  },
  selectBtn: {
    marginTop: 14,
    backgroundColor: '#10B981',
    borderRadius: 9999,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 2,
  },
  selectBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
