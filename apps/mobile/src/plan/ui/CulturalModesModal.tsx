import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface CulturalModesModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFamilyMode: (dishName: string, slot: 'lunch' | 'dinner') => void;
  onToggleRamadanMode: (active: boolean) => void;
  isRamadanActive: boolean;
  isFamilyActive: boolean;
  currentFamilyDish?: string;
}

const COMMON_FAMILY_DISHES = [
  'Chicken Karahi',
  'Aalo Gosht',
  'Daal Mash',
  'Chicken Korma',
  'Beef Nihari',
  'Chicken Biryani',
  'Bhindi Masala',
  'Daal Chana',
];

export const CulturalModesModal: React.FC<CulturalModesModalProps> = ({
  visible,
  onClose,
  onApplyFamilyMode,
  onToggleRamadanMode,
  isRamadanActive,
  isFamilyActive,
  currentFamilyDish = 'Chicken Karahi',
}) => {
  const [activeTab, setActiveTab] = useState<'family' | 'ramadan'>('family');
  const [selectedDish, setSelectedDish] = useState(currentFamilyDish);
  const [customDish, setCustomDish] = useState('');
  const [mealSlot, setMealSlot] = useState<'lunch' | 'dinner'>('dinner');

  const [ramadanToggle, setRamadanToggle] = useState(isRamadanActive);

  const handleApplyFamily = () => {
    const dish = customDish.trim() || selectedDish;
    onApplyFamilyMode(dish, mealSlot);
    onClose();
  };

  const handleApplyRamadan = () => {
    onToggleRamadanMode(ramadanToggle);
    onClose();
  };

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
              <Text style={styles.eyebrow}>PAKISTANI CULTURAL ADAPTERS</Text>
              <Text style={styles.modalTitle}>Cultural Diet Modes</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Segmented Tab Switcher */}
          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'family' && styles.tabBtnActive,
              ]}
              onPress={() => setActiveTab('family')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'family' && styles.tabTextActive,
                ]}
              >
                👨‍👩‍👧 Family Handi
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'ramadan' && styles.tabBtnActive,
              ]}
              onPress={() => setActiveTab('ramadan')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'ramadan' && styles.tabTextActive,
                ]}
              >
                🌙 Ramadan Mode
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollList} contentContainerStyle={styles.scrollPad}>
            {activeTab === 'family' ? (
              // Family Mode Content
              <View style={styles.section}>
                <View style={styles.infoBanner}>
                  <Text style={styles.infoBannerText}>
                    💡 In Pakistani homes, cooking separate meals leads to failure.
                    Pick whatever handi the family is cooking today. We will automatically
                    re-balance your rotis and breakfast so you stay 100% on target!
                  </Text>
                </View>

                <Text style={styles.fieldLabel}>Select Today's Family Dish:</Text>
                <View style={styles.dishChipsGrid}>
                  {COMMON_FAMILY_DISHES.map((dish) => {
                    const isSelected = selectedDish === dish && !customDish;
                    return (
                      <TouchableOpacity
                        key={dish}
                        style={[
                          styles.dishChip,
                          isSelected && styles.dishChipSelected,
                        ]}
                        onPress={() => {
                          setSelectedDish(dish);
                          setCustomDish('');
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.dishChipText,
                            isSelected && styles.dishChipTextSelected,
                          ]}
                        >
                          {dish}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.fieldLabel}>Or Type Other Family Dish:</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Haleem, Karelay Gosht..."
                  placeholderTextColor="#64748B"
                  value={customDish}
                  onChangeText={setCustomDish}
                />

                <Text style={styles.fieldLabel}>When Will You Eat This?</Text>
                <View style={styles.slotChoiceRow}>
                  <TouchableOpacity
                    style={[
                      styles.slotChoiceBtn,
                      mealSlot === 'dinner' && styles.slotChoiceActive,
                    ]}
                    onPress={() => setMealSlot('dinner')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.slotChoiceText,
                        mealSlot === 'dinner' && styles.slotChoiceTextActive,
                      ]}
                    >
                      🥘 Family Dinner
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.slotChoiceBtn,
                      mealSlot === 'lunch' && styles.slotChoiceActive,
                    ]}
                    onPress={() => setMealSlot('lunch')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.slotChoiceText,
                        mealSlot === 'lunch' && styles.slotChoiceTextActive,
                      ]}
                    >
                      🍛 Family Lunch
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.applyBtn}
                  onPress={handleApplyFamily}
                  activeOpacity={0.8}
                >
                  <Text style={styles.applyBtnText}>
                    Apply {customDish || selectedDish} to Plan
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Ramadan Mode Content
              <View style={styles.section}>
                <View style={styles.toggleRow}>
                  <View>
                    <Text style={styles.toggleTitle}>Enable Ramadan Fasting Mode</Text>
                    <Text style={styles.toggleSubtitle}>
                      Shifts eating window between Maghrib and Fajr
                    </Text>
                  </View>
                  <Switch
                    value={ramadanToggle}
                    onValueChange={setRamadanToggle}
                    trackColor={{ false: '#334155', true: '#059669' }}
                    thumbColor={ramadanToggle ? '#10B981' : '#94A3B8'}
                  />
                </View>

                <View style={styles.ramadanCard}>
                  <Text style={styles.ramadanCardTitle}>Daily Calorie Split:</Text>
                  <Text style={styles.ramadanScheduleLine}>
                    • <Text style={styles.boldWhite}>Suhoor (سحری) - 40%:</Text> Eggs,
                    whole wheat roti, dahi for sustained 14-hour satiety.
                  </Text>
                  <Text style={styles.ramadanScheduleLine}>
                    • <Text style={styles.boldWhite}>Iftar (افطاری) - 40%:</Text> Dates,
                    protein-first main meal (chicken/tikka/daal), controlled oil.
                  </Text>
                  <Text style={styles.ramadanScheduleLine}>
                    • <Text style={styles.boldWhite}>Post-Tarawih - 20%:</Text> Light
                    snack & recovery chai.
                  </Text>
                </View>

                <View style={styles.ramadanCard}>
                  <Text style={styles.ramadanCardTitle}>5-Window Hydration Pacing:</Text>
                  <Text style={styles.ramadanScheduleLine}>
                    1. <Text style={styles.boldWhite}>Iftar Opening:</Text> 500ml water + dates
                  </Text>
                  <Text style={styles.ramadanScheduleLine}>
                    2. <Text style={styles.boldWhite}>Post-Maghrib:</Text> 500ml with meal
                  </Text>
                  <Text style={styles.ramadanScheduleLine}>
                    3. <Text style={styles.boldWhite}>Tarawih Window:</Text> 750ml bottle
                  </Text>
                  <Text style={styles.ramadanScheduleLine}>
                    4. <Text style={styles.boldWhite}>Pre-Sleep:</Text> 500ml
                  </Text>
                  <Text style={styles.ramadanScheduleLine}>
                    5. <Text style={styles.boldWhite}>Suhoor Pacing:</Text> 750ml steadily sipped
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.applyBtn}
                  onPress={handleApplyRamadan}
                  activeOpacity={0.8}
                >
                  <Text style={styles.applyBtnText}>
                    {ramadanToggle ? 'Activate Ramadan Mode' : 'Disable Ramadan Mode'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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
  tabSwitcher: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 9999,
    padding: 3,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 9999,
  },
  tabBtnActive: {
    backgroundColor: '#10B981',
  },
  tabText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scrollList: {
    paddingHorizontal: 16,
  },
  scrollPad: {
    paddingVertical: 10,
    paddingBottom: 40,
  },
  section: {
    gap: 12,
  },
  infoBanner: {
    backgroundColor: '#ECFDF5',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  infoBannerText: {
    color: '#065F46',
    fontSize: 12,
    lineHeight: 18,
  },
  fieldLabel: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  dishChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dishChip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dishChipSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  dishChipText: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '600',
  },
  dishChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#1E293B',
    fontSize: 13,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  slotChoiceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  slotChoiceBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 9999,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotChoiceActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  slotChoiceText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  slotChoiceTextActive: {
    color: '#FFFFFF',
  },
  applyBtn: {
    marginTop: 8,
    backgroundColor: '#10B981',
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleTitle: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '700',
  },
  toggleSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  ramadanCard: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  ramadanCardTitle: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '800',
  },
  ramadanScheduleLine: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
  },
  boldWhite: {
    color: '#1E293B',
    fontWeight: '700',
  },
});
