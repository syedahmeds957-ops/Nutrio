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
import { useRegion } from '../../common/region/index.js';
import { useTheme } from '../../theme.js';

interface CulturalModesModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFamilyMode: (dishName: string, slot: 'lunch' | 'dinner') => void;
  onToggleRamadanMode: (active: boolean) => void;
  isRamadanActive: boolean;
  isFamilyActive: boolean;
  currentFamilyDish?: string;
}

const PK_FAMILY_DISHES = [
  'Chicken Karahi',
  'Aalo Gosht',
  'Daal Mash',
  'Chicken Korma',
  'Beef Nihari',
  'Chicken Biryani',
  'Bhindi Masala',
  'Daal Chana',
];

const SA_FAMILY_DISHES = [
  'Chicken Kabsa · كبسة دجاج',
  'Naeemi Lamb Mandi · مندي لحم نعيمي',
  'Hashi Camel Kabsa · كبسة حاشي',
  'Madhbi Chicken · مضبي دجاج',
  'Saleeg Taifi · سليق طائفي',
  'Najdi Jareesh · جريش نجد',
  'Mutabbaq Meat · مطبق لحم',
  'Sayadiah Fish · صيادية سمك',
];

export const CulturalModesModal: React.FC<CulturalModesModalProps> = ({
  visible,
  onClose,
  onApplyFamilyMode,
  onToggleRamadanMode,
  isRamadanActive,
  isFamilyActive,
  currentFamilyDish,
}) => {
  const { theme, isDark } = useTheme();
  const { activeRegion } = useRegion();
  const isSaudi = activeRegion === 'SA';
  const familyDishes = isSaudi ? SA_FAMILY_DISHES : PK_FAMILY_DISHES;
  const defaultDish = currentFamilyDish || (isSaudi ? 'Chicken Kabsa · كبسة دجاج' : 'Chicken Karahi');

  const [activeTab, setActiveTab] = useState<'family' | 'ramadan'>('family');
  const [selectedDish, setSelectedDish] = useState(defaultDish);
  const [customDish, setCustomDish] = useState('');
  const [mealSlot, setMealSlot] = useState<'lunch' | 'dinner'>('dinner');

  const [ramadanToggle, setRamadanToggle] = useState(isRamadanActive);

  const handleApplyFamily = () => {
    const rawDish = customDish.trim() || selectedDish;
    const cleanDish = rawDish.split('·')[0].split('(')[0].trim();
    onApplyFamilyMode(cleanDish, mealSlot);
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
          <View style={styles.headerRow}>
            <View>
              <Text
                style={[
                  styles.eyebrow,
                  { color: isDark ? theme.colors.primaryLime : '#4D7C0F' },
                ]}
              >
                {isSaudi
                  ? 'SAUDI CULTURAL ADAPTERS · الملاءمة الثقافية'
                  : 'PAKISTANI CULTURAL ADAPTERS'}
              </Text>
              <Text
                style={[
                  styles.modalTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Cultural Diet Modes {isSaudi ? '· الأنماط التراثية' : ''}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.closeBtn,
                { backgroundColor: theme.colors.surfaceSecondary },
              ]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.closeBtnText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          {/* Segmented Tab Switcher */}
          <View
            style={[
              styles.tabSwitcher,
              { backgroundColor: theme.colors.surfaceSecondary },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'family' && {
                  backgroundColor: theme.colors.primaryLime,
                },
              ]}
              onPress={() => setActiveTab('family')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: theme.colors.textSecondary },
                  activeTab === 'family' && {
                    color: '#0A0B0D',
                    fontWeight: '800',
                  },
                ]}
              >
                {isSaudi ? '👨‍👩‍👧 Family Banquet · سفرة العائلة' : '👨‍👩‍👧 Family Handi'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'ramadan' && {
                  backgroundColor: theme.colors.primaryLime,
                },
              ]}
              onPress={() => setActiveTab('ramadan')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: theme.colors.textSecondary },
                  activeTab === 'ramadan' && {
                    color: '#0A0B0D',
                    fontWeight: '800',
                  },
                ]}
              >
                {isSaudi ? '🌙 Ramadan Mode · صيام رمضان' : '🌙 Ramadan Mode'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollList} contentContainerStyle={styles.scrollPad}>
            {activeTab === 'family' ? (
              // Family Mode Content
              <View style={styles.section}>
                <View
                  style={[
                    styles.infoBanner,
                    {
                      backgroundColor: isDark ? '#1C2608' : '#EDFCD2',
                      borderColor: isDark ? '#2D4B05' : '#D4F88D',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.infoBannerText,
                      { color: isDark ? '#D9F99D' : '#365314' },
                    ]}
                  >
                    {isSaudi
                      ? '💡 In Saudi households, family gatherings revolve around shared banquets (Kabsa, Mandi, Saleeg). Pick whatever the family gathers around today. We will calibrate your portions so you hit your macro targets without cooking separate meals!'
                      : '💡 In Pakistani homes, cooking separate meals leads to failure. Pick whatever handi the family is cooking today. We will automatically re-balance your rotis and breakfast so you stay 100% on target!'}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.fieldLabel,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {isSaudi ? "Select Today's Family Dish · طبق العائلة اليوم" : "Select Today's Family Dish:"}
                </Text>
                <View style={styles.dishChipsGrid}>
                  {familyDishes.map((dish) => {
                    const isSelected = selectedDish === dish && !customDish;
                    return (
                      <TouchableOpacity
                        key={dish}
                        style={[
                          styles.dishChip,
                          {
                            backgroundColor: theme.colors.surfaceSecondary,
                            borderColor: theme.colors.border,
                          },
                          isSelected && {
                            backgroundColor: theme.colors.primaryLime,
                            borderColor: theme.colors.primaryLime,
                          },
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
                            { color: theme.colors.textPrimary },
                            isSelected && {
                              color: '#0A0B0D',
                              fontWeight: '800',
                            },
                          ]}
                        >
                          {dish}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text
                  style={[
                    styles.fieldLabel,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {isSaudi ? 'Or Type Other Saudi Dish:' : 'Or Type Other Family Dish:'}
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.colors.surfaceSecondary,
                      borderColor: theme.colors.border,
                      color: theme.colors.textPrimary,
                    },
                  ]}
                  placeholder={isSaudi ? 'e.g. Bukhari Rice, Mathlootha, Gursan...' : 'e.g. Haleem, Karelay Gosht...'}
                  placeholderTextColor={theme.colors.textMuted}
                  value={customDish}
                  onChangeText={setCustomDish}
                />

                <Text
                  style={[
                    styles.fieldLabel,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  When Will You Eat This?
                </Text>
                <View style={styles.slotChoiceRow}>
                  <TouchableOpacity
                    style={[
                      styles.slotChoiceBtn,
                      {
                        backgroundColor: theme.colors.surfaceSecondary,
                        borderColor: theme.colors.border,
                      },
                      mealSlot === 'dinner' && {
                        backgroundColor: theme.colors.primaryLime,
                        borderColor: theme.colors.primaryLime,
                      },
                    ]}
                    onPress={() => setMealSlot('dinner')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.slotChoiceText,
                        { color: theme.colors.textSecondary },
                        mealSlot === 'dinner' && {
                          color: '#0A0B0D',
                          fontWeight: '800',
                        },
                      ]}
                    >
                      {isSaudi ? '🥘 Family Dinner · عشاء العائلة' : '🥘 Family Dinner'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.slotChoiceBtn,
                      {
                        backgroundColor: theme.colors.surfaceSecondary,
                        borderColor: theme.colors.border,
                      },
                      mealSlot === 'lunch' && {
                        backgroundColor: theme.colors.primaryLime,
                        borderColor: theme.colors.primaryLime,
                      },
                    ]}
                    onPress={() => setMealSlot('lunch')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.slotChoiceText,
                        { color: theme.colors.textSecondary },
                        mealSlot === 'lunch' && {
                          color: '#0A0B0D',
                          fontWeight: '800',
                        },
                      ]}
                    >
                      {isSaudi ? '🍛 Family Lunch · غداء الكبسة' : '🍛 Family Lunch'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.applyBtn,
                    {
                      backgroundColor: theme.colors.primaryLime,
                      shadowColor: theme.colors.primaryLime,
                    },
                  ]}
                  onPress={handleApplyFamily}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.applyBtnText, { color: '#0A0B0D' }]}>
                    Apply {customDish || selectedDish} to Plan
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Ramadan Mode Content
              <View style={styles.section}>
                <View
                  style={[
                    styles.toggleRow,
                    {
                      backgroundColor: theme.colors.surfaceSecondary,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <View>
                    <Text
                      style={[
                        styles.toggleTitle,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      {isSaudi ? 'Enable Ramadan Fasting Mode · صيام رمضان' : 'Enable Ramadan Fasting Mode'}
                    </Text>
                    <Text
                      style={[
                        styles.toggleSubtitle,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Shifts eating window between Maghrib and Fajr
                    </Text>
                  </View>
                  <Switch
                    value={ramadanToggle}
                    onValueChange={setRamadanToggle}
                    trackColor={{
                      false: theme.colors.border,
                      true: isDark ? '#2D4B05' : '#D4F88D',
                    }}
                    thumbColor={ramadanToggle ? theme.colors.primaryLime : theme.colors.textMuted}
                  />
                </View>

                <View
                  style={[
                    styles.ramadanCard,
                    {
                      backgroundColor: theme.colors.surfaceSecondary,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.ramadanCardTitle,
                      { color: isDark ? theme.colors.primaryLime : '#365314' },
                    ]}
                  >
                    Daily Calorie Split:
                  </Text>
                  <Text
                    style={[
                      styles.ramadanScheduleLine,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    • <Text style={[styles.boldWhite, { color: theme.colors.textPrimary }]}>{isSaudi ? 'Suhoor · سحور - 40%:' : 'Suhoor (سحری) - 40%:'}</Text>{' '}
                    {isSaudi
                      ? 'Fresh Laban, Sukari dates, foul mudammas, boiled eggs & Tamees bread for sustained energy.'
                      : 'Eggs, whole wheat roti, dahi for sustained 14-hour satiety.'}
                  </Text>
                  <Text
                    style={[
                      styles.ramadanScheduleLine,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    • <Text style={[styles.boldWhite, { color: theme.colors.textPrimary }]}>{isSaudi ? 'Iftar · إفطار - 40%:' : 'Iftar (افطاری) - 40%:'}</Text>{' '}
                    {isSaudi
                      ? 'Sukari dates, water, Saudi Gahwa, Shourba hab & grilled Farrouj / Mandi meat.'
                      : 'Dates, protein-first main meal (chicken/tikka/daal), controlled oil.'}
                  </Text>
                  <Text
                    style={[
                      styles.ramadanScheduleLine,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    • <Text style={[styles.boldWhite, { color: theme.colors.textPrimary }]}>{isSaudi ? 'Post-Tarawih · غبقة وتمر - 20%:' : 'Post-Tarawih - 20%:'}</Text>{' '}
                    {isSaudi ? 'Light recovery snack, fruit & mint tea or Gahwa.' : 'Light snack & recovery chai.'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.ramadanCard,
                    {
                      backgroundColor: theme.colors.surfaceSecondary,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.ramadanCardTitle,
                      { color: isDark ? theme.colors.primaryLime : '#365314' },
                    ]}
                  >
                    5-Window Hydration Pacing:
                  </Text>
                  <Text
                    style={[
                      styles.ramadanScheduleLine,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    1. <Text style={[styles.boldWhite, { color: theme.colors.textPrimary }]}>Iftar Opening:</Text> 500ml water + dates
                  </Text>
                  <Text
                    style={[
                      styles.ramadanScheduleLine,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    2. <Text style={[styles.boldWhite, { color: theme.colors.textPrimary }]}>Post-Maghrib:</Text> 500ml with meal
                  </Text>
                  <Text
                    style={[
                      styles.ramadanScheduleLine,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    3. <Text style={[styles.boldWhite, { color: theme.colors.textPrimary }]}>Tarawih Window:</Text> 750ml bottle
                  </Text>
                  <Text
                    style={[
                      styles.ramadanScheduleLine,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    4. <Text style={[styles.boldWhite, { color: theme.colors.textPrimary }]}>Pre-Sleep:</Text> 500ml
                  </Text>
                  <Text
                    style={[
                      styles.ramadanScheduleLine,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    5. <Text style={[styles.boldWhite, { color: theme.colors.textPrimary }]}>Suhoor Pacing:</Text> 750ml steadily sipped
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.applyBtn,
                    {
                      backgroundColor: theme.colors.primaryLime,
                      shadowColor: theme.colors.primaryLime,
                    },
                  ]}
                  onPress={handleApplyRamadan}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.applyBtnText, { color: '#0A0B0D' }]}>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    borderRadius: 28,
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
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
  },
  eyebrow: {
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
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  tabSwitcher: {
    flexDirection: 'row',
    marginHorizontal: 16,
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
  tabText: {
    fontSize: 12,
    fontWeight: '700',
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
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  infoBannerText: {
    fontSize: 12,
    lineHeight: 18,
  },
  fieldLabel: {
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
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  dishChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
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
    borderRadius: 9999,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  slotChoiceText: {
    fontSize: 12,
    fontWeight: '700',
  },
  applyBtn: {
    marginTop: 8,
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  toggleSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  ramadanCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
  },
  ramadanCardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  ramadanScheduleLine: {
    fontSize: 12,
    lineHeight: 18,
  },
  boldWhite: {
    fontWeight: '700',
  },
});

