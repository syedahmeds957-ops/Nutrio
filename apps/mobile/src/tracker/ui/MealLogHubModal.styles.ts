import { StyleSheet } from 'react-native';

import { commonRadii } from '../../theme.js';
/** Styles for MealLogHubModal, kept apart so the component file stays readable. */
export const styles = StyleSheet.create({
  mealChip: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: 22,
  },
  mealChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mealChipText: {
    fontSize: 14,
    fontWeight: '800',
  },
  pickerBackdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(10, 11, 13, 0.45)',
  },
  pickerDismiss: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  pickerSheet: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 8,
  },
  pickerTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  pickerRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  pickerRowText: {
    fontSize: 16,
    fontWeight: '700',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  // Balances the back button, so the meal chip is centred.
  headerSpacer: {
    width: 44,
    height: 44,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 24,
  },
  searchInput: {
    flex: 1,
    // Fills the 48 px field, so the whole bar is the tap target, not one text line.
    alignSelf: 'stretch',
    marginStart: 10,
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  // 44 px targets; negative margins keep the 48 px search field and the preset chip as they were.
  searchClearBtn: {
    width: 44,
    height: 44,
    marginEnd: -14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // With the sparkle at the bar's end the clear button is no longer at the edge:
  // no negative margin, or the two 44 px targets overlap.
  searchClearBtnBesideSparkle: {
    marginEnd: 4,
  },
  presetDeleteBtn: {
    width: 44,
    height: 44,
    marginVertical: -14,
    marginEnd: -14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 44 px target (was 40); the bar is 48 px tall so it still fits inside the field.
  sparkleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: -12,
  },
  describeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  describeCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orPickEyebrow: {
    marginTop: 24,
    marginBottom: 10,
  },
  describeMealTextCol: {
    flex: 1,
  },
  describeMealTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  describeMealHint: {
    fontSize: 13,
    marginTop: 3,
    lineHeight: 17,
  },
  buildModeRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 6,
  },
  buildModeBtn: {
    minHeight: 44,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: commonRadii.pill,
    borderWidth: 1,
  },
  buildModeBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  buildModeHint: {
    fontSize: 12,
    lineHeight: 15,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    fontSize: 14,
    fontWeight: '800',
    minWidth: 14,
    textAlign: 'center',
  },
  basketBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  basketInfo: {
    flex: 1,
  },
  savePresetLink: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  presetNameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  presetNameInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '700',
    maxWidth: 160,
  },
  presetChipMeta: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  presetChipRemove: {
    fontSize: 13,
    fontWeight: '700',
  },
  basketCount: {
    fontSize: 14,
    fontWeight: '800',
  },
  basketKcal: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 15,
  },
  basketConfirmBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: commonRadii.pill,
  },
  basketConfirmText: {
    fontSize: 13,
    fontWeight: '800',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 15,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 6,
    borderRadius: 22,
    borderWidth: 1,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  savedEmpty: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: -10,
    marginBottom: 20,
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  // Two to a row; flexBasis leaves room for the gap.
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    height: 112,
    padding: 14,
    borderRadius: 22,
    justifyContent: 'space-between',
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  tileCount: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  browseBack: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 6,
  },
  browseBackText: {
    fontSize: 15,
    fontWeight: '700',
  },
  groupScrollContainer: {
    paddingVertical: 10,
  },
  groupPillsWrapper: {
    paddingHorizontal: 16,
    gap: 8,
  },
  // Every category in view at once; wraps onto as many rows as it needs.
  groupPillsWrapped: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  // Floats over the bottom of the list; contentContainer keeps its padding clear of it.
  customPillDock: {
    position: 'absolute',
    start: 0,
    end: 0,
    bottom: 24,
    alignItems: 'center',
  },
  customPill: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    borderRadius: 26,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  customPillText: {
    fontSize: 15,
    fontWeight: '800',
  },
  slotFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  slotFilterText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  slotFilterBtn: {
    minHeight: 44,
    justifyContent: 'center',
  },
  slotFilterBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  groupPill: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  groupPillText: {
    fontSize: 13,
  },
  content: {
    flex: 1,
  },
  // Clears the pinned Custom meal pill (52 tall, 24 up) with room to spare, so the last rows' macros stay readable.
  contentContainer: {
    paddingBottom: 132,
  },
  contentBody: {
    padding: 16,
  },
  dietGroupHeading: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 8,
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  brandsSection: {
    marginBottom: 20,
  },
  brandCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
  },
  brandAvatar: {
    marginEnd: 14,
  },
  brandInfo: {
    flex: 1,
    marginEnd: 8,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  brandName: {
    fontSize: 15,
    fontWeight: '800',
    marginEnd: 8,
  },
  brandNameAr: {
    fontSize: 13,
    fontWeight: '700',
    marginEnd: 6,
  },
  brandNameUr: {
    fontSize: 12,
  },
  brandTagline: {
    fontSize: 12,
  },
  searchResultsSection: {
    marginBottom: 24,
  },
  dishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
  },
  dishCardLeft: {
    flex: 1,
    marginEnd: 12,
  },
  dishTitleRow: {
    marginBottom: 4,
  },
  dishName: {
    fontSize: 15,
    fontWeight: '800',
    marginEnd: 6,
  },
  dishNameAr: {
    fontSize: 13,
    fontWeight: '700',
    marginEnd: 6,
  },
  dishNameUr: {
    fontSize: 12,
  },
  dishMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  brandBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginEnd: 8,
  },
  brandBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dishServingText: {
    fontSize: 12,
  },
  dishMacrosText: {
    fontSize: 12,
    fontWeight: '700',
  },
  variantChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: -4,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  variantChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  variantChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dishCardRight: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 6,
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
  emptyStateContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  addDishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: commonRadii.pill,
  },
  addDishButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  addDishLink: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  addDishLinkText: {
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  filterLoadingContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  filterLoadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
