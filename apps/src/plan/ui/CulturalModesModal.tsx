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
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { useTheme } from '../../theme.js';
import { AppleTextInput } from '../../ui/AppleInput.js';

interface CulturalModesModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFamilyMode: (dishName: string, slot: 'lunch' | 'dinner') => void;
  onToggleRamadanMode: (active: boolean) => void;
  isRamadanActive: boolean;
  isFamilyActive: boolean;
  currentFamilyDish?: string;
}

// Which dishes a family gathers around is regional. `name` is the string the
// meal solver matches against the food database, so it stays in the database's
// spelling; only the chip label is translated.
const PK_FAMILY_DISHES = [
  { id: 'chickenKarahi', name: 'Chicken Karahi' },
  { id: 'aaloGosht', name: 'Aalo Gosht' },
  { id: 'daalMash', name: 'Daal Mash' },
  { id: 'chickenKorma', name: 'Chicken Korma' },
  { id: 'beefNihari', name: 'Beef Nihari' },
  { id: 'chickenBiryani', name: 'Chicken Biryani' },
  { id: 'bhindiMasala', name: 'Bhindi Masala' },
  { id: 'daalChana', name: 'Daal Chana' },
];

const SA_FAMILY_DISHES = [
  { id: 'chickenKabsa', name: 'Chicken Kabsa' },
  { id: 'lambMandi', name: 'Naeemi Lamb Mandi' },
  { id: 'camelKabsa', name: 'Hashi Camel Kabsa' },
  { id: 'madhbiChicken', name: 'Madhbi Chicken' },
  { id: 'saleegTaifi', name: 'Saleeg Taifi' },
  { id: 'najdiJareesh', name: 'Najdi Jareesh' },
  { id: 'mutabbaqMeat', name: 'Mutabbaq Meat' },
  { id: 'sayadiahFish', name: 'Sayadiah Fish' },
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
  const { t } = useTranslation();
  const dir = useTextDirection();
  const isSaudi = activeRegion === 'SA';
  const accentColor = theme.colors.primaryLime;
  const accentTextColor = '#0A0B0D';
  const familyDishes = (isSaudi ? SA_FAMILY_DISHES : PK_FAMILY_DISHES).map((dish) => ({
    ...dish,
    label: t(`plan.cultural.dishes.${dish.id}`),
  }));
  const defaultDish = currentFamilyDish || familyDishes[0].name;
  const dishLabel = (name: string) =>
    familyDishes.find((dish) => dish.name === name)?.label ?? name;

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
                {t(`plan.cultural.eyebrow.${activeRegion}`)}
              </Text>
              <Text
                style={[
                  styles.modalTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                {t('plan.cultural.title')}
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
                  backgroundColor: accentColor,
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
                    color: accentTextColor,
                    fontWeight: '800',
                  },
                ]}
              >
                👨‍👩‍👧 {t(`plan.cultural.tabs.family.${activeRegion}`)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'ramadan' && {
                  backgroundColor: accentColor,
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
                    color: accentTextColor,
                    fontWeight: '800',
                  },
                ]}
              >
                🌙 {t('plan.cultural.tabs.ramadan')}
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
                    💡 {t(`plan.cultural.familyBanner.${activeRegion}`)}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.fieldLabel,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {t('plan.cultural.selectDish')}
                </Text>
                <View style={styles.dishChipsGrid}>
                  {familyDishes.map((dish) => {
                    const isSelected = selectedDish === dish.name && !customDish;
                    return (
                      <TouchableOpacity
                        key={dish.id}
                        style={[
                          styles.dishChip,
                          {
                            backgroundColor: theme.colors.surfaceSecondary,
                            borderColor: theme.colors.border,
                          },
                          isSelected && {
                            backgroundColor: accentColor,
                            borderColor: accentColor,
                          },
                        ]}
                        onPress={() => {
                          setSelectedDish(dish.name);
                          setCustomDish('');
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.dishChipText,
                            { color: theme.colors.textPrimary },
                            isSelected && {
                              color: accentTextColor,
                              fontWeight: '800',
                            },
                          ]}
                        >
                          {dish.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={{ marginTop: 16, marginBottom: 16 }}>
                  <AppleTextInput
                    label={t('plan.cultural.otherDishLabel')}
                    placeholder={t(`plan.cultural.otherDishPlaceholder.${activeRegion}`)}
                    value={customDish}
                    onChangeText={setCustomDish}
                  />
                </View>

                <Text
                  style={[
                    styles.fieldLabel,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {t('plan.cultural.whenEat')}
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
                        backgroundColor: accentColor,
                        borderColor: accentColor,
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
                          color: accentTextColor,
                          fontWeight: '800',
                        },
                      ]}
                    >
                      🥘 {t('plan.cultural.familyDinner')}
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
                        backgroundColor: accentColor,
                        borderColor: accentColor,
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
                          color: accentTextColor,
                          fontWeight: '800',
                        },
                      ]}
                    >
                      🍛 {t('plan.cultural.familyLunch')}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.applyBtn,
                    {
                      backgroundColor: accentColor,
                      shadowColor: accentColor,
                    },
                  ]}
                  onPress={handleApplyFamily}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.applyBtnText, { color: accentTextColor }]}>
                    {t('plan.cultural.applyDish', {
                      dish: customDish || dishLabel(selectedDish),
                    })}
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
                      {t('plan.cultural.enableRamadan')}
                    </Text>
                    <Text
                      style={[
                        styles.toggleSubtitle,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {t('plan.cultural.ramadanSubtitle')}
                    </Text>
                  </View>
                  <Switch
                    value={ramadanToggle}
                    onValueChange={setRamadanToggle}
                    trackColor={{
                      false: theme.colors.border,
                      true: isSaudi
                        ? (isDark ? '#064E3B' : '#A7F3D0')
                        : (isDark ? '#2D4B05' : '#D4F88D'),
                    }}
                    thumbColor={ramadanToggle ? accentColor : theme.colors.textMuted}
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
                    {t('plan.cultural.calorieSplit')}
                  </Text>
                  <Text
                    style={[
                      styles.ramadanScheduleLine,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    • <Text style={[styles.boldWhite, { color: theme.colors.textPrimary }]}>{t('plan.cultural.suhoor')}</Text>{' '}
                    {t(`plan.cultural.suhoorDetail.${activeRegion}`)}
                  </Text>
                  <Text
                    style={[
                      styles.ramadanScheduleLine,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    • <Text style={[styles.boldWhite, { color: theme.colors.textPrimary }]}>{t('plan.cultural.iftar')}</Text>{' '}
                    {t(`plan.cultural.iftarDetail.${activeRegion}`)}
                  </Text>
                  <Text
                    style={[
                      styles.ramadanScheduleLine,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    • <Text style={[styles.boldWhite, { color: theme.colors.textPrimary }]}>{t(`plan.cultural.postTaraweeh.${activeRegion}`)}</Text>{' '}
                    {t(`plan.cultural.postTaraweehDetail.${activeRegion}`)}
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
                    {t('plan.cultural.hydrationPacing')}
                  </Text>
                  <Text
                    style={[
                      styles.ramadanScheduleLine,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    1. <Text style={[styles.boldWhite, { color: theme.colors.textPrimary }]}>{t('plan.cultural.hydration.iftarOpening')}</Text> {t('plan.cultural.hydration.iftarOpeningDetail')}
                  </Text>
                  <Text
                    style={[
                      styles.ramadanScheduleLine,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    2. <Text style={[styles.boldWhite, { color: theme.colors.textPrimary }]}>{t('plan.cultural.hydration.postMaghrib')}</Text> {t('plan.cultural.hydration.postMaghribDetail')}
                  </Text>
                  <Text
                    style={[
                      styles.ramadanScheduleLine,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    3. <Text style={[styles.boldWhite, { color: theme.colors.textPrimary }]}>{t('plan.cultural.hydration.tarawih')}</Text> {t('plan.cultural.hydration.tarawihDetail')}
                  </Text>
                  <Text
                    style={[
                      styles.ramadanScheduleLine,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    4. <Text style={[styles.boldWhite, { color: theme.colors.textPrimary }]}>{t('plan.cultural.hydration.preSleep')}</Text> {t('plan.cultural.hydration.preSleepDetail')}
                  </Text>
                  <Text
                    style={[
                      styles.ramadanScheduleLine,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    5. <Text style={[styles.boldWhite, { color: theme.colors.textPrimary }]}>{t('plan.cultural.hydration.suhoorPacing')}</Text> {t('plan.cultural.hydration.suhoorPacingDetail')}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.applyBtn,
                    {
                      backgroundColor: accentColor,
                      shadowColor: accentColor,
                    },
                  ]}
                  onPress={handleApplyRamadan}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.applyBtnText, { color: accentTextColor }]}>
                    {ramadanToggle ? t('plan.cultural.activateRamadan') : t('plan.cultural.disableRamadan')}
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

