import React from 'react';
import { AccessibilityInfo, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTheme, commonRadii } from '../theme.js';
import { useTranslation } from '../i18n/index.js';
import { Icon } from './Icon.js';

/** How long a removal can be undone. */
export const UNDO_WINDOW_MS = 5000;

interface UndoToastProps {
  /** What happened, e.g. "Biryani removed". Also announced to screen readers. */
  message: string;
  /** Spoken name of the Undo button, e.g. "Undo removing Biryani". */
  undoAccessibilityLabel: string;
  onUndo: () => void;
  /** Positioning from the host screen (it knows what sits under the toast). */
  style?: StyleProp<ViewStyle>;
}

/**
 * A short-lived "<thing> removed · Undo" bar, styled like the workout "saved"
 * toast. The host owns the timer and decides when to unmount it.
 *
 * Announced through a polite live region (Android, web `role="status"`) and
 * `announceForAccessibility` (iOS VoiceOver ignores live regions).
 */
export const UndoToast: React.FC<UndoToastProps> = ({ message, undoAccessibilityLabel, onUndo, style }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();

  React.useEffect(() => {
    AccessibilityInfo.announceForAccessibility?.(message);
  }, [message]);

  return (
    <View
      accessibilityLiveRegion="polite"
      role="status"
      style={[styles.toast, { backgroundColor: c.floatingBarBg }, style]}
    >
      <Icon name="check" size={16} color={c.floatingBarActive} strokeWidth={3} />
      <Text style={[styles.message, { color: c.floatingBarInactive }]} numberOfLines={2}>
        {message}
      </Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={undoAccessibilityLabel}
        onPress={onUndo}
        activeOpacity={0.7}
        style={styles.undoBtn}
      >
        <Text style={[styles.undoText, { color: c.floatingBarActive }]}>{t('common.undo')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    width: '92%',
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingStart: 18,
    paddingEnd: 6,
    paddingVertical: 4,
    borderRadius: commonRadii.pill,
    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.3)',
  },
  message: { flex: 1, fontSize: 14, fontWeight: '700' },
  undoBtn: { minHeight: 44, minWidth: 64, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  undoText: { fontSize: 15, fontWeight: '800' },
});
