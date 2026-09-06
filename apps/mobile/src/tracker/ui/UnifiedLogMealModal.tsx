import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NormalizedFood, PAKISTANI_STAPLES_DATA, ServingUnit } from '@nutrio/food-db';
import {
  DetectedFoodItem,
  resolveDetectedPlate,
  ResolvedFoodItem,
  VisionResolutionResult,
} from '@nutrio/nutrition-core';
import { MealSlot } from '../types.js';
import {
  canPerformPhotoScan,
  consumePhotoScan,
  getRemainingScans,
  initializeQuotaState,
  ScanQuotaState,
  validateImageQuality,
} from '../../vision/index.js';
import { MealPlateReviewModal } from '../../vision/ui/MealPlateReviewModal.js';
import { analyzeMealPhoto } from '../../ai/ai-service.js';
import { getActiveAiProvider } from '../../ai/apiKeyStorage.js';
import { Icon } from '../../ui/Icon.js';
import { useTheme } from '../../theme.js';

interface UnifiedLogMealModalProps {
  visible: boolean;
  mealSlot: MealSlot;
  onClose: () => void;
  onConfirmSingleFood: (
    slot: MealSlot,
    food: NormalizedFood,
    serving: ServingUnit,
    quantity: number
  ) => void;
  onConfirmPlateItems?: (slot: MealSlot, items: ResolvedFoodItem[]) => void;
}

type TabType = 'search' | 'photo';

const FOOD_CATEGORIES = [
  'All',
  'Rice & Biryani',
  'Karahi & Handi',
  'BBQ & Grills',
  'Slow-Cooked Curries',
  'Breakfast & Nashta',
  'Sabzi & Lentils',
  'Pakistani Fast Food',
  'Beverages & Drinks',
];

export const UnifiedLogMealModal: React.FC<UnifiedLogMealModalProps> = ({
  visible,
  mealSlot,
  onClose,
  onConfirmSingleFood,
  onConfirmPlateItems,
}) => {
  const { theme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('search');

  // Search tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedFood, setSelectedFood] = useState<NormalizedFood | null>(null);
  const [selectedServing, setSelectedServing] = useState<ServingUnit | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  // Photo tab state
  const [quotaState, setQuotaState] = useState<ScanQuotaState>(() =>
    initializeQuotaState()
  );
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [photoContextNote, setPhotoContextNote] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Review modal state
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewDishTitle, setReviewDishTitle] = useState('Detected Desi Plate');
  const [reviewCookingMethod, setReviewCookingMethod] = useState('');
  const [reviewResolution, setReviewResolution] = useState<VisionResolutionResult | null>(null);

  // 1. Search Filter with Categories
  const filteredFoods = React.useMemo(() => {
    let list = PAKISTANI_STAPLES_DATA;
    if (selectedCategory !== 'All') {
      list = list.filter((f) => {
        if (selectedCategory === 'Sabzi & Lentils') {
          return f.category === 'Sabzi & Lentils' || f.category === 'Vegetables & Daal';
        }
        if (selectedCategory === 'Breakfast & Nashta') {
          return f.category === 'Breakfast & Nashta' || f.category === 'Nashta & Breakfast';
        }
        return f.category.toLowerCase().includes(selectedCategory.toLowerCase());
      });
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.nameUr && f.nameUr.includes(q)) ||
        f.category.toLowerCase().includes(q)
    );
  }, [searchQuery, selectedCategory]);

  const handleSelectFood = (food: NormalizedFood) => {
    setSelectedFood(food);
    const def = food.servings.find((s) => s.isDefault) || food.servings[0];
    setSelectedServing(def || null);
    setQuantity(1);
  };

  const handleConfirmSearchLog = () => {
    if (selectedFood && selectedServing) {
      onConfirmSingleFood(mealSlot, selectedFood, selectedServing, quantity);
      handleCloseAll();
    }
  };

  // 2. Pick Image from Camera or Files
  const handlePickImage = () => {
    if (typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          setImageFileName(file.name);
          const reader = new FileReader();
          reader.onload = () => {
            setSelectedImage(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      // Fallback for non-browser testing
      const sampleBase64 =
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
      setSelectedImage(sampleBase64);
      setImageFileName('sample_karahi_plate.jpg');
    }
  };

  // 3. AI Photo Scan Trigger
  const handleTriggerPhotoScan = async () => {
    if (!selectedImage) {
      Alert.alert('Please select or capture a meal photo first');
      return;
    }

    const quality = validateImageQuality(selectedImage);
    if (!quality.passed) {
      Alert.alert('Image Rejected', quality.message || 'Photo quality is poor.');
      return;
    }

    // Deduct quota
    setQuotaState((prev) => consumePhotoScan(prev));
    setIsAnalyzing(true);

    try {
      // Call AI Vision Service (OpenAI / Gemini / Smart Desi Fallback)
      const analysis = await analyzeMealPhoto(selectedImage, photoContextNote);

      const candidates: DetectedFoodItem[] = analysis.detectedItems.map((i) => ({
        detectedName: i.detectedName,
        estimatedGrams: i.estimatedGrams,
        portionSize: 'M',
      }));

      // Deterministically resolve against authenticated Pakistani Staples DB
      const resolution = resolveDetectedPlate(
        candidates,
        PAKISTANI_STAPLES_DATA as any
      );

      setReviewDishTitle(analysis.dishDetected);
      setReviewCookingMethod(analysis.cookingMethod);
      setReviewResolution(resolution);
      setReviewModalVisible(true);
    } catch (err: any) {
      Alert.alert('Analysis Failed', err?.message || 'Could not analyze meal photo.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReviewPlateConfirmed = (
    items: ResolvedFoodItem[],
    _correctionsMade: boolean
  ) => {
    if (onConfirmPlateItems) {
      onConfirmPlateItems(mealSlot, items);
    } else {
      items.forEach((item) => {
        const found =
          PAKISTANI_STAPLES_DATA.find((f) => f.name === item.matchedFoodName) ||
          PAKISTANI_STAPLES_DATA[0];
        const s = found.servings[0];
        onConfirmSingleFood(mealSlot, found, s, Number((item.resolvedGrams / s.grams).toFixed(1)));
      });
    }
    handleCloseAll();
  };

  const handleCloseAll = () => {
    setSelectedFood(null);
    setSelectedServing(null);
    setSearchQuery('');
    setSelectedImage(null);
    setImageFileName(null);
    setPhotoContextNote('');
    setReviewModalVisible(false);
    setIsAnalyzing(false);
    onClose();
  };

  const remainingScans = getRemainingScans(quotaState);
  const activeProvider = getActiveAiProvider();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCloseAll}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.eyebrow, { color: isDark ? '#D4FF00' : '#16A34A' }]}>
                LOG TO {mealSlot.toUpperCase().replace('_', ' ')}
              </Text>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add Food to Diary</Text>
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: isDark ? '#272A33' : '#F1F5F9' }]}
              onPress={handleCloseAll}
              activeOpacity={0.7}
            >
              <Text style={[styles.closeBtnText, { color: theme.colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 2-Tab Navigation Bar */}
          <View style={[styles.tabBar, { backgroundColor: isDark ? '#111215' : '#F1F5F9' }]}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'search' && styles.tabBtnActive]}
              onPress={() => setActiveTab('search')}
              activeOpacity={0.7}
            >
              <View style={styles.tabBtnRow}>
                <Icon
                  name="search"
                  size={14}
                  color={activeTab === 'search' ? '#0A0B0D' : theme.colors.textMuted}
                />
                <Text style={[styles.tabText, { color: theme.colors.textMuted }, activeTab === 'search' && styles.tabTextActive]}>
                  Search / Manual
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'photo' && styles.tabBtnActive]}
              onPress={() => setActiveTab('photo')}
              activeOpacity={0.7}
            >
              <View style={styles.tabBtnRow}>
                <Icon
                  name="camera"
                  size={14}
                  color={activeTab === 'photo' ? '#0A0B0D' : theme.colors.textMuted}
                />
                <Text style={[styles.tabText, { color: theme.colors.textMuted }, activeTab === 'photo' && styles.tabTextActive]}>
                  AI Photo Scan (Free)
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Tab 1: Database Search */}
          {activeTab === 'search' && (
            <View style={styles.tabContent}>
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: isDark ? '#14151A' : '#F8FAFC',
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                placeholder="Search roti, biryani, daal chana..."
                placeholderTextColor={theme.colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />

              {/* Category Pills Bar */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.catScroll}
                contentContainerStyle={styles.catScrollContent}
              >
                {FOOD_CATEGORIES.map((cat) => {
                  const isCatActive = selectedCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.catChip,
                        {
                          backgroundColor: isDark ? '#1C1D24' : '#F1F5F9',
                          borderColor: theme.colors.border,
                        },
                        isCatActive && styles.catChipActive,
                      ]}
                      onPress={() => setSelectedCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.catChipText,
                          { color: theme.colors.textMuted },
                          isCatActive && styles.catChipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {selectedFood ? (
                <View style={[styles.selectedFoodCard, { backgroundColor: isDark ? '#14151A' : '#F8FAFC', borderColor: theme.colors.border }]}>
                  <Text style={[styles.selectedName, { color: theme.colors.text }]}>
                    {selectedFood.name}
                    {selectedFood.nameUr ? ` · ${selectedFood.nameUr}` : ''}
                  </Text>
                  <Text style={[styles.selectedServing, { color: theme.colors.textMuted }]}>
                    {selectedServing?.label} ({selectedServing?.grams}g)
                  </Text>

                  {/* Quantity Stepper */}
                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      style={[styles.qtyBtn, { backgroundColor: isDark ? '#272A33' : '#E2E8F0' }]}
                      onPress={() => setQuantity((q) => Math.max(0.5, q - 0.5))}
                    >
                      <Text style={[styles.qtyBtnText, { color: theme.colors.text }]}>-</Text>
                    </TouchableOpacity>
                    <Text style={[styles.qtyVal, { color: theme.colors.text }]}>{quantity}x</Text>
                    <TouchableOpacity
                      style={[styles.qtyBtn, { backgroundColor: isDark ? '#272A33' : '#E2E8F0' }]}
                      onPress={() => setQuantity((q) => q + 0.5)}
                    >
                      <Text style={[styles.qtyBtnText, { color: theme.colors.text }]}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={handleConfirmSearchLog}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.actionBtnText}>Log Selected Food</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView style={styles.searchList} showsVerticalScrollIndicator={false}>
                  {filteredFoods.slice(0, 18).map((food) => (
                    <TouchableOpacity
                      key={food.id}
                      style={[styles.foodRow, { borderBottomColor: theme.colors.border }]}
                      onPress={() => handleSelectFood(food)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.foodRowName, { color: theme.colors.text }]}>
                          {food.name}
                          {food.nameUr ? ` · ${food.nameUr}` : ''}
                        </Text>
                        <Text style={[styles.foodRowCategory, { color: theme.colors.textMuted }]}>{food.category}</Text>
                      </View>
                      <Text style={[styles.foodRowKcal, { color: isDark ? '#D4FF00' : '#16A34A' }]}>{food.kcal100g} kcal/100g</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Tab 2: AI Photo Calorie Scan */}
          {activeTab === 'photo' && (
            <ScrollView style={styles.tabContent} contentContainerStyle={{ gap: 14 }}>
              <View style={[styles.quotaBanner, { backgroundColor: isDark ? 'rgba(212, 255, 0, 0.12)' : '#ECFDF5', borderColor: isDark ? 'rgba(212, 255, 0, 0.3)' : '#A7F3D0' }]}>
                <View style={styles.quotaBannerRow}>
                  <Icon name="sparkles" size={14} color={isDark ? '#D4FF00' : '#059669'} />
                  <Text style={[styles.quotaText, { color: isDark ? '#D4FF00' : '#059669' }]}>
                    100% Free · Unlimited AI Photo Scans · AI: {activeProvider.toUpperCase()}
                  </Text>
                </View>
              </View>

              {!selectedImage ? (
                <TouchableOpacity
                  style={[styles.uploadArea, { backgroundColor: isDark ? '#14151A' : '#F8FAFC', borderColor: theme.colors.border }]}
                  onPress={handlePickImage}
                  activeOpacity={0.7}
                >
                  <View style={[styles.uploadIconCircle, { backgroundColor: isDark ? '#272A33' : '#ECFDF5' }]}>
                    <Icon name="camera" size={28} color={isDark ? '#D4FF00' : '#059669'} />
                  </View>
                  <Text style={[styles.cameraTitle, { color: theme.colors.text }]}>Upload or Snap Meal Photo</Text>
                  <Text style={[styles.cameraSubtitle, { color: theme.colors.textMuted }]}>
                    Place a hand, spoon, or standard bowl for maximum portion accuracy
                  </Text>
                  <View style={[styles.chooseFilePill, { backgroundColor: isDark ? '#1C1D24' : '#FFFFFF', borderColor: theme.colors.border }]}>
                    <Text style={[styles.chooseFileText, { color: isDark ? '#D4FF00' : '#059669' }]}>Choose Photo from Device</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={[styles.previewContainer, { borderColor: theme.colors.border, backgroundColor: isDark ? '#14151A' : '#F8FAFC' }]}>
                  <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                  <View style={styles.previewMetaRow}>
                    <Text style={[styles.fileNameText, { color: theme.colors.text }]} numberOfLines={1}>
                      {imageFileName || 'Selected Meal Photo'}
                    </Text>
                    <View style={styles.previewActions}>
                      <TouchableOpacity
                        style={styles.changeBtn}
                        onPress={handlePickImage}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.changeBtnText}>Change</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => {
                          setSelectedImage(null);
                          setImageFileName(null);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.removeBtnText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              <TextInput
                style={[styles.contextInput, { backgroundColor: isDark ? '#14151A' : '#F8FAFC', borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="Optional dish note (e.g. cooked with 1 spoon oil, homemade biryani)"
                placeholderTextColor={theme.colors.textMuted}
                value={photoContextNote}
                onChangeText={setPhotoContextNote}
              />

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  (!selectedImage || isAnalyzing) && styles.actionBtnDisabled,
                ]}
                onPress={handleTriggerPhotoScan}
                disabled={!selectedImage || isAnalyzing}
                activeOpacity={0.8}
              >
                {isAnalyzing ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="#0A0B0D" size="small" />
                    <Text style={styles.actionBtnText}>Analyzing with AI Vision...</Text>
                  </View>
                ) : (
                  <View style={styles.actionBtnContent}>
                    <Icon name="sparkles" size={16} color="#0A0B0D" />
                    <Text style={styles.actionBtnText}>Analyze & Estimate Calories</Text>
                  </View>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>

      {/* Plate Review Modal */}
      {reviewResolution && (
        <MealPlateReviewModal
          visible={reviewModalVisible}
          onClose={() => setReviewModalVisible(false)}
          dishTitle={reviewDishTitle}
          cookingMethod={reviewCookingMethod}
          initialResolution={reviewResolution}
          onConfirmLog={handleReviewPlateConfirmed}
        />
      )}
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
    height: '85%',
    paddingTop: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 12,
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
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 9999,
    padding: 3,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
  },
  tabBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: '#D4FF00',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#0A0B0D',
    fontWeight: '800',
  },
  catScroll: {
    marginBottom: 10,
    maxHeight: 38,
  },
  catScrollContent: {
    gap: 8,
    paddingRight: 16,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: 1,
  },
  catChipActive: {
    backgroundColor: '#D4FF00',
    borderColor: '#D4FF00',
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  catChipTextActive: {
    color: '#0A0B0D',
    fontWeight: '800',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchInput: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchList: {
    flex: 1,
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  foodRowName: {
    fontSize: 14,
    fontWeight: '600',
  },
  foodRowCategory: {
    fontSize: 12,
    marginTop: 2,
  },
  foodRowKcal: {
    fontSize: 13,
    fontWeight: '700',
  },
  selectedFoodCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    gap: 12,
  },
  selectedName: {
    fontSize: 17,
    fontWeight: '800',
  },
  selectedServing: {
    fontSize: 13,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 6,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  qtyVal: {
    fontSize: 17,
    fontWeight: '700',
  },
  actionBtn: {
    backgroundColor: '#D4FF00',
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionBtnText: {
    color: '#0A0B0D',
    fontSize: 15,
    fontWeight: '800',
  },
  actionBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quotaBanner: {
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  quotaBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quotaText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  uploadArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    gap: 8,
  },
  uploadIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cameraEmoji: {
    fontSize: 28,
  },
  cameraTitle: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '800',
  },
  cameraSubtitle: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  chooseFilePill: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chooseFileText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '700',
  },
  previewContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  previewMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  fileNameText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginRight: 8,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 8,
  },
  changeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
    backgroundColor: '#ECFDF5',
  },
  changeBtnText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  removeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
    backgroundColor: '#FEE2E2',
  },
  removeBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  contextInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#1E293B',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});
