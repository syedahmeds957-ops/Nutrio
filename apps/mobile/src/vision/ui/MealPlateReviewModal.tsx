import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ResolvedFoodItem, VisionResolutionResult } from '@nutrio/nutrition-core';

interface MealPlateReviewModalProps {
  visible: boolean;
  onClose: () => void;
  dishTitle: string;
  cookingMethod?: string;
  initialResolution: VisionResolutionResult;
  onConfirmLog: (
    items: ResolvedFoodItem[],
    correctionsMade: boolean
  ) => void;
}

function rescaleItemGrams(
  item: ResolvedFoodItem,
  newGrams: number,
  portionSource: ResolvedFoodItem['portionSource']
): ResolvedFoodItem {
  const mult = newGrams / (item.resolvedGrams || 100);
  return {
    ...item,
    resolvedGrams: newGrams,
    calories: Math.round(item.calories * mult),
    proteinGrams: Number((item.proteinGrams * mult).toFixed(1)),
    fatGrams: Number((item.fatGrams * mult).toFixed(1)),
    carbGrams: Number((item.carbGrams * mult).toFixed(1)),
    oilAddedG: Number((item.oilAddedG * mult).toFixed(1)),
    portionSource,
  };
}

export const MealPlateReviewModal: React.FC<MealPlateReviewModalProps> = ({
  visible,
  onClose,
  dishTitle,
  cookingMethod,
  initialResolution,
  onConfirmLog,
}) => {
  const [items, setItems] = useState<ResolvedFoodItem[]>(
    initialResolution.items
  );
  const [hasUserEdited, setHasUserEdited] = useState(false);

  // Sync state if new initialResolution arrives
  React.useEffect(() => {
    setItems(initialResolution.items);
    setHasUserEdited(false);
  }, [initialResolution]);

  const handleAdjustPortionScale = (index: number, scale: 'S' | 'M' | 'L') => {
    setHasUserEdited(true);
    setItems((prev) => {
      const next = [...prev];
      const base = next[index].servingGrams || 100;
      const factor = scale === 'S' ? 0.75 : scale === 'L' ? 1.35 : 1.0;
      next[index] = rescaleItemGrams(next[index], Math.round(base * factor), 'portion_size');
      return next;
    });
  };

  const handleStepGrams = (index: number, deltaGrams: number) => {
    setHasUserEdited(true);
    setItems((prev) => {
      const next = [...prev];
      const newGrams = Math.max(25, next[index].resolvedGrams + deltaGrams);
      next[index] = rescaleItemGrams(next[index], newGrams, 'user_grams');
      return next;
    });
  };

  const handleDeleteItem = (index: number) => {
    setHasUserEdited(true);
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Recalculate totals
  const totalCalories = items.reduce((s, i) => s + i.calories, 0);
  const totalProtein = Number(
    items.reduce((s, i) => s + i.proteinGrams, 0).toFixed(1)
  );
  const totalCarbs = Number(
    items.reduce((s, i) => s + i.carbGrams, 0).toFixed(1)
  );
  const totalFat = Number(
    items.reduce((s, i) => s + i.fatGrams, 0).toFixed(1)
  );
  const totalOil = Number(
    items.reduce((s, i) => s + i.oilAddedG, 0).toFixed(1)
  );

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
            <View style={styles.headerTitles}>
              <Text style={styles.eyebrow}>AI MULTIMODAL MEAL SCAN</Text>
              <Text style={styles.modalTitle}>{dishTitle}</Text>
              {cookingMethod && (
                <Text style={styles.methodText}>🍳 {cookingMethod}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollList} contentContainerStyle={styles.scrollPad}>
            {/* Confidence Band Banner */}
            <View style={styles.confidenceCard}>
              <View style={styles.confidenceHeader}>
                <Text style={styles.confidenceTitle}>ESTIMATED ENERGY</Text>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceBadgeText}>
                    {initialResolution.confidence.toUpperCase()} CONFIDENCE
                  </Text>
                </View>
              </View>
              <Text style={styles.bigCalories}>
                ~{totalCalories} kcal
              </Text>
              <Text style={styles.confidenceRange}>
                Clinical Band: {Math.round(totalCalories * 0.9)} –{' '}
                {Math.round(totalCalories * 1.1)} kcal (±10%)
              </Text>
            </View>

            {/* Macro Summary Row */}
            <View style={styles.macroSummaryRow}>
              <View style={styles.macroChip}>
                <Text style={styles.macroVal}>{totalProtein}g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              <View style={styles.macroChip}>
                <Text style={styles.macroVal}>{totalCarbs}g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <View style={styles.macroChip}>
                <Text style={styles.macroVal}>{totalFat}g</Text>
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
              <View style={[styles.macroChip, styles.oilChip]}>
                <Text style={[styles.macroVal, styles.oilVal]}>{totalOil}g</Text>
                <Text style={styles.oilLabel}>Cooking Oil</Text>
              </View>
            </View>

            {/* Plate Itemizer & Portion Controls */}
            <Text style={styles.sectionHeading}>
              Plate Ingredients ({items.length})
            </Text>
            <View style={styles.itemsList}>
              {items.map((item, index) => (
                <View key={index} style={styles.itemCard}>
                  <View style={styles.itemTopRow}>
                    <View style={styles.itemTitleBlock}>
                      <Text style={styles.itemName}>
                        {item.matchedFoodName}
                        {item.matchedFoodNameUr ? ` · ${item.matchedFoodNameUr}` : ''}
                      </Text>
                      <Text style={styles.itemMeta}>
                        {item.resolvedGrams}g · {item.calories} kcal
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteItem(index)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.deleteBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  {/* One-Tap Portion Size Chips */}
                  <View style={styles.portionControlsRow}>
                    <View style={styles.smlGroup}>
                      {(['S', 'M', 'L'] as const).map((scale) => (
                        <TouchableOpacity
                          key={scale}
                          style={styles.smlBtn}
                          onPress={() => handleAdjustPortionScale(index, scale)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.smlBtnText}>{scale}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Gram Stepper */}
                    <View style={styles.stepperGroup}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => handleStepGrams(index, -25)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.stepBtnText}>-25g</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => handleStepGrams(index, +25)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.stepBtnText}>+25g</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Confirm Log Action */}
            <TouchableOpacity
              style={styles.logBtn}
              onPress={() => {
                onConfirmLog(items, hasUserEdited);
                onClose();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.logBtnText}>
                ✓ Log Meal to Diary (~{totalCalories} kcal)
              </Text>
            </TouchableOpacity>
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
    maxHeight: '90%',
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
  headerTitles: {
    flex: 1,
    marginRight: 12,
  },
  eyebrow: {
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
  methodText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '700',
  },
  scrollList: {
    paddingHorizontal: 16,
  },
  scrollPad: {
    paddingVertical: 14,
    gap: 14,
  },
  confidenceCard: {
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
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  confidenceBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  confidenceBadgeText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
  },
  bigCalories: {
    color: '#1E293B',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 6,
  },
  confidenceRange: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  macroSummaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroChip: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  macroVal: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '800',
  },
  macroLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  oilChip: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  oilVal: {
    color: '#B45309',
  },
  oilLabel: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionHeading: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '800',
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitleBlock: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '700',
  },
  itemMeta: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  portionControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  smlGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  smlBtn: {
    backgroundColor: '#ECFDF5',
    borderRadius: 9999,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  smlBtnText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
  },
  stepperGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  stepBtn: {
    backgroundColor: '#F8FAFC',
    borderRadius: 9999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepBtnText: {
    color: '#1E293B',
    fontSize: 11,
    fontWeight: '700',
  },
  logBtn: {
    backgroundColor: '#10B981',
    borderRadius: 9999,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  logBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
