import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme, commonRadii } from '../../theme.js';
import { useTranslation } from '../../i18n/index.js';

interface DiscardDialogProps {
  visible: boolean;
  onKeepGoing: () => void;
  onDiscard: () => void;
  /** Wording for another case (discarding edits to a finished workout); defaults to a workout in progress. */
  text?: { title: string; body: string; keepGoing: string; discard: string };
}

/** Asked when leaving a workout in progress. */
export const DiscardDialog: React.FC<DiscardDialogProps> = ({ visible, onKeepGoing, onDiscard, text }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onKeepGoing}>
      <View style={[styles.backdrop, { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.62)' : 'rgba(15,23,42,0.45)' }]}>
        <View accessibilityViewIsModal style={[styles.dialog, { backgroundColor: c.surface }]}>
          <Text accessibilityRole="header" style={[styles.title, { color: c.textPrimary }]}>
            {text?.title ?? t('workout.log.discardTitle')}
          </Text>
          <Text style={[styles.body, { color: c.textSecondary }]}>{text?.body ?? t('workout.log.discardBody')}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={onKeepGoing} style={[styles.keep, { backgroundColor: c.primaryLime }]}>
            <Text style={[styles.keepText, { color: c.limeText }]}>{text?.keepGoing ?? t('workout.log.keepGoing')}</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={onDiscard} style={styles.discard}>
            <Text style={[styles.discardText, { color: c.danger }]}>{text?.discard ?? t('workout.log.discard')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 340, borderRadius: 24, padding: 22, gap: 10 },
  title: { fontSize: 19, fontWeight: '800', textAlign: 'center' },
  body: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 6 },
  keep: { minHeight: 50, borderRadius: commonRadii.pill, alignItems: 'center', justifyContent: 'center' },
  keepText: { fontSize: 16, fontWeight: '800' },
  discard: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  discardText: { fontSize: 15, fontWeight: '700' },
});
