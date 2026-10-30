import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme, commonRadii } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { Icon, type IconName } from '../../ui/Icon.js';

interface ExerciseOptionsSheetProps {
  /** The exercise's name; null hides the sheet. */
  name: string | null;
  swapped: boolean;
  onSwap: () => void;
  /** Opens the coach about this exercise; absent where the coach can't help (or for guests). */
  onAskCoach?: () => void;
  onDetails: () => void;
  onReset: () => void;
  onClose: () => void;
}

/** The ⋯ menu on an exercise: swap it, ask the coach, see how to do it, or undo a swap. */
export const ExerciseOptionsSheet: React.FC<ExerciseOptionsSheetProps> = ({ name, swapped, onSwap, onAskCoach, onDetails, onReset, onClose }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const dir = useTextDirection();

  const option = (icon: IconName, label: string, onPress: () => void) => (
    <TouchableOpacity accessibilityRole="button" onPress={onPress} style={[styles.option, { borderTopColor: c.border }]}>
      <Icon name={icon} size={18} color={c.textPrimary} />
      <Text style={[styles.optionText, dir.text, { color: c.textPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={name !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        accessibilityLabel={t('workout.detail.close')}
        onPress={onClose}
        style={[styles.backdrop, { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.62)' : 'rgba(15,23,42,0.45)' }]}
      />
      <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: c.surface }]}>
        <View style={[styles.handle, { backgroundColor: c.border }]} />
        <Text accessibilityRole="header" numberOfLines={1} style={[styles.title, dir.text, { color: c.textPrimary }]}>
          {name}
        </Text>
        {option('swap', t('workout.options.swap'), onSwap)}
        {onAskCoach ? option('sparkles', t('workout.options.askCoach'), onAskCoach) : null}
        {option('info', t('workout.options.details'), onDetails)}
        {swapped ? option('arrow-left', t('workout.swap.reset'), onReset) : null}
        <TouchableOpacity accessibilityRole="button" onPress={onClose} style={[styles.cancel, { backgroundColor: c.surfaceSecondary }]}>
          <Text style={[styles.cancelText, { color: c.textPrimary }]}>{t('workout.options.cancel')}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: StyleSheet.absoluteFill,
  sheet: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 500,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: commonRadii.pill, marginBottom: 10 },
  title: { fontSize: 17, fontWeight: '800', marginBottom: 6 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, borderTopWidth: 1 },
  optionText: { flex: 1, fontSize: 15, fontWeight: '600' },
  cancel: { marginTop: 10, minHeight: 48, borderRadius: commonRadii.pill, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 15, fontWeight: '700' },
});
