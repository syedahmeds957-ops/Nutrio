import { StyleSheet } from 'react-native';

/** Styles for MealLogHubModal, kept apart so the component file stays readable. */
export const styles = StyleSheet.create({
  slotRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  // Sized by their label (the longest one needs more room than an equal share),
  // then stretched to fill the row.
  slotChip: {
    minHeight: 44,
    justifyContent: 'center',
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  slotChipText: {
    fontSize: 12,
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
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  regionPillBtn: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  regionPillText: {
    fontSize: 12,
    fontWeight: '700',
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
  presetDeleteBtn: {
    width: 44,
    height: 44,
    marginVertical: -14,
    marginEnd: -14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  describeMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  describeMealTextCol: {
    flex: 1,
  },
  describeMealTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  describeMealHint: {
    fontSize: 12,
    marginTop: 2,
  },
  buildModeRow: {
    paddingHorizontal: 16,
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
    borderRadius: 9999,
    borderWidth: 1,
  },
  buildModeBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  buildModeHint: {
    fontSize: 11,
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
    fontSize: 11,
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
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  basketConfirmBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 9999,
  },
  basketConfirmText: {
    fontSize: 13,
    fontWeight: '800',
  },
  groupScrollContainer: {
    paddingVertical: 10,
  },
  groupPillsWrapper: {
    paddingHorizontal: 16,
    gap: 8,
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
  contentContainer: {
    paddingBottom: 40,
  },
  contentBody: {
    padding: 16,
  },
  dietGroupHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 8,
  },
  sectionEyebrow: {
    fontSize: 11,
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
    fontSize: 11,
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
    borderRadius: 9999,
  },
  addDishButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A0B0D',
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
