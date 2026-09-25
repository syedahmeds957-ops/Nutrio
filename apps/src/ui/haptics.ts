/**
 * Nutrio Tactile Haptics Engine
 * Conforms to Apple Human Interface Guidelines (HIG) tactile feedback principles.
 * Gracefully degrades on Web and during automated tests without throwing.
 */
import { Platform } from 'react-native';

export const HapticFeedback = {
  /**
   * Selection feedback: subtle tick for discrete UI switches like
   * tabs, serving size pills, radio options, and region/theme toggles.
   */
  selection: async (): Promise<void> => {
    if (Platform.OS === 'web') return;
    try {
      const Haptics = await import('expo-haptics');
      await Haptics.selectionAsync();
    } catch {
      // Graceful fallback for non-supported runtime
    }
  },

  /**
   * Light impact: tactile tap for quantity steppers (+/-), gram adjustments,
   * water quick-adds (+250ml), and staple item 1-tap logging.
   */
  impactLight: async (): Promise<void> => {
    if (Platform.OS === 'web') return;
    try {
      const Haptics = await import('expo-haptics');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Graceful fallback
    }
  },

  /**
   * Medium impact: firm tactile acknowledgment for modal confirmations,
   * confirming customized food log, adding new food item.
   */
  impactMedium: async (): Promise<void> => {
    if (Platform.OS === 'web') return;
    try {
      const Haptics = await import('expo-haptics');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Graceful fallback
    }
  },

  /**
   * Heavy / Rigid impact: tactile snap for delete, dismiss or clearing actions.
   */
  impactHeavy: async (): Promise<void> => {
    if (Platform.OS === 'web') return;
    try {
      const Haptics = await import('expo-haptics');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // Graceful fallback
    }
  },

  /**
   * Success notification: celebratory tactile sequence for completing all 4 meals
   * ("ALL MEALS DONE") or hitting 100% daily water hydration goal.
   */
  notificationSuccess: async (): Promise<void> => {
    if (Platform.OS === 'web') return;
    try {
      const Haptics = await import('expo-haptics');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Graceful fallback
    }
  },

  /**
   * Warning notification: tactile pattern for exceeding limits.
   */
  notificationWarning: async (): Promise<void> => {
    if (Platform.OS === 'web') return;
    try {
      const Haptics = await import('expo-haptics');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // Graceful fallback
    }
  },
};
