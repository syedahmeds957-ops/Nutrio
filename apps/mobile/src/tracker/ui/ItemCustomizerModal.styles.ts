import { StyleSheet } from 'react-native';
import type { ThemeColors } from '../../theme.js';

/**
 * Styles for ItemCustomizerModal, kept apart so the component file stays readable.
 * Built from the active theme's colours so dark mode never shows a light default.
 */
export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.canvas,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      paddingHorizontal: 22,
      paddingTop: 16,
      paddingBottom: 28,
    },
    backButton: {
      alignSelf: 'flex-start',
      marginBottom: 16,
    },
    dishThumb: {
      marginBottom: 12,
    },
    brandText: {
      fontSize: 14,
      fontWeight: '700',
      color: c.textMuted,
      letterSpacing: 0.6,
      marginBottom: 4,
    },
    dishTitle: {
      fontSize: 32,
      fontWeight: '800',
      color: c.textPrimary,
      letterSpacing: -0.6,
      lineHeight: 38,
      marginBottom: 10,
    },
    estimatedBadgeContainer: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    estimatedBadge: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 4,
      backgroundColor: 'transparent',
    },
    estimatedBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: c.textSecondary,
      letterSpacing: 0.5,
    },
    estimateDisclaimer: {
      fontSize: 14,
      color: c.textMuted,
      lineHeight: 20,
      marginBottom: 24,
    },
    howManyCard: {
      borderRadius: 18,
      borderWidth: 1,
      padding: 16,
      marginBottom: 26,
    },
    howManyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    portionEmbedded: {
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
    },
    howManyLeft: {
      flex: 1,
      marginEnd: 16,
    },
    howManyLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: c.textMuted,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    howManySub: {
      fontSize: 13,
      color: c.textMuted,
      marginTop: 3,
      fontWeight: '500',
    },
    peachStepperContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    peachCircleButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.surfaceSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    peachCircleButtonSmall: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.surfaceSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Dimmed, not recoloured: the neutral fill stays so it reads as the same button.
    // A hairline keeps the dimmed fill visible on a white card.
    peachCircleButtonDisabled: {
      opacity: 0.55,
      borderWidth: 1,
      borderColor: 'rgba(100, 116, 139, 0.45)',
    },
    stepperNumber: {
      fontSize: 20,
      fontWeight: '800',
      color: c.textPrimary,
      minWidth: 28,
      textAlign: 'center',
      fontVariant: ['tabular-nums'],
    },
    stepperNumberSmall: {
      fontSize: 16,
      fontWeight: '800',
      color: c.textPrimary,
      minWidth: 24,
      textAlign: 'center',
      fontVariant: ['tabular-nums'],
    },
    portionControlCard: {
      backgroundColor: c.surface,
      borderRadius: 18,
      padding: 16,
      marginBottom: 26,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    portionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    portionSectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: c.textMuted,
      letterSpacing: 0.6,
    },
    toggleCustomGramsText: {
      fontSize: 12,
      fontWeight: '700',
      color: c.fatText,
    },
    servingsPillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    servingPill: {
      backgroundColor: c.surfaceSecondary,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      alignItems: 'center',
    },
    servingPillActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    servingPillText: {
      fontSize: 13,
      fontWeight: '600',
      color: c.textSecondary,
    },
    servingPillTextActive: {
      color: c.limeText,
      fontWeight: '800',
    },
    servingPillGrams: {
      fontSize: 11,
      color: c.textMuted,
      marginTop: 2,
    },
    servingPillGramsActive: {
      color: c.limeText,
      fontWeight: '700',
    },
    customGramsBox: {
      paddingTop: 4,
    },
    customGramsPrompt: {
      fontSize: 13,
      color: c.textMuted,
      marginBottom: 12,
    },
    gramsAdjustRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    gramChip: {
      backgroundColor: c.surfaceSecondary,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minHeight: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    gramChipText: {
      fontSize: 12,
      fontWeight: '700',
      color: c.textSecondary,
    },
    gramDisplayBadge: {
      alignItems: 'center',
      paddingHorizontal: 8,
    },
    gramDisplayNumber: {
      fontSize: 20,
      fontWeight: '800',
      color: c.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    gramsInputBox: {
      alignSelf: 'center',
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'baseline',
      borderRadius: 12,
      borderWidth: 1,
      paddingVertical: 6,
      paddingHorizontal: 12,
      gap: 2,
    },
    gramsInput: {
      // Fixed: a web TextInput otherwise takes its large default width.
      width: 88,
      padding: 0,
      textAlign: 'center',
    },
    gramsErrorText: {
      fontSize: 12,
      fontWeight: '600',
      marginTop: 8,
      textAlign: 'center',
    },
    saveMineButton: {
      alignSelf: 'center',
      marginTop: 12,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      minHeight: 44,
      justifyContent: 'center',
    },
    saveMineButtonDisabled: {
      opacity: 0.4,
    },
    saveMineText: {
      fontSize: 13,
      fontWeight: '700',
    },
    portionFooterRow: {
      alignSelf: 'flex-start',
      marginTop: 10,
      minHeight: 32,
      justifyContent: 'center',
    },
    resetMineText: {
      fontSize: 12,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
    gramDisplayUnit: {
      fontSize: 11,
      color: c.textMuted,
      fontWeight: '600',
    },
    makeItYoursSection: {
      marginBottom: 24,
    },
    makeItYoursTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: c.textPrimary,
      marginBottom: 4,
      letterSpacing: -0.3,
    },
    makeItYoursSubtitle: {
      fontSize: 14,
      color: c.textMuted,
      lineHeight: 20,
      marginBottom: 16,
    },
    modifiersContainerCard: {
      backgroundColor: c.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      overflow: 'hidden',
    },
    modifierItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingVertical: 14,
    },
    modifierItemDivider: {
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
    },
    modifierLeftInfo: {
      flex: 1,
      marginEnd: 12,
    },
    modifierItemTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: c.textPrimary,
      marginBottom: 3,
    },
    modifierItemKcal: {
      fontSize: 13,
      color: c.textMuted,
      fontWeight: '500',
    },
    slotSelectionSection: {
      marginBottom: 16,
    },
    slotSectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: c.textMuted,
      letterSpacing: 0.6,
      marginBottom: 8,
    },
    slotPillContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    slotPill: {
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    slotPillActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    slotPillText: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textSecondary,
    },
    slotPillTextActive: {
      color: c.limeText,
      fontWeight: '800',
    },
    bottomStickyBar: {
      backgroundColor: c.surface,
      borderTopWidth: 1,
      borderTopColor: c.borderSubtle,
      paddingHorizontal: 22,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    bottomTotalsLeft: {
      flex: 1,
      marginEnd: 16,
    },
    calorieRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    totalCalorieNumber: {
      fontSize: 28,
      fontWeight: '800',
      color: c.textPrimary,
      letterSpacing: -0.5,
    },
    totalCalorieUnit: {
      fontSize: 16,
      fontWeight: '700',
      color: c.textPrimary,
      marginStart: 4,
    },
    totalMacroBreakdown: {
      fontSize: 13,
      fontWeight: '600',
      color: c.textMuted,
      marginTop: 2,
    },
    logThisButton: {
      backgroundColor: c.primary,
      paddingHorizontal: 32,
      paddingVertical: 15,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logThisButtonText: {
      color: c.limeText,
      fontSize: 16,
      fontWeight: '800',
    },
  });
